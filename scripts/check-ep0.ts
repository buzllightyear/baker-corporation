// scripts/check-ep0.ts
// Standalone self-check for Episode 0, written because src/kernel/* is being built in
// parallel on main and does not exist in this worktree. It re-implements, from the plan,
// exactly the rules that tests/content-ep0.test.ts will run after the merge:
//   - reference integrity (REF), R3, R4, R5, R6 as validateCase does them,
//   - the golden path replayed against kernel semantics (adjacency, presence windows,
//     availability windows, requiresCard gating, clock costs, shared clock).
// R2 (three liars) and R7 (exhaustive time) are printed but never fail: the tutorial is
// allowed to miss them, and the real test filters them out.
//
// Run: npx tsc scripts/check-ep0.ts --outDir <tmp outside the package> --module commonjs \
//        --moduleResolution node --target ES2022 --strict --skipLibCheck && node <tmp>/scripts/check-ep0.js
declare const process: { exit(code: number): never };

import { EP0, EP0_GOLDEN } from '../content/ep0-titan';
import type { Episode } from '../content/types';

const COST: Record<string, number> = {
  move: 10, talk: 5, ask: 5, examine: 5, pin: 0,
  timeline: 10, cross_check: 20, search_records: 30, submit_theory: 0,
};

const problems: string[] = [];
const soft: string[] = [];
const ep: Episode = EP0;

// ---------- reference integrity + authoring rules (mirrors src/kernel/validate.ts) ----------
const ids = new Set<string>(
  [...ep.places, ...ep.people, ...ep.statements, ...ep.evidence, ...ep.records, ...ep.topics, ...ep.methods, ...ep.propositions].map((x) => x.id),
);
const need = (id: string, where: string) => { if (!ids.has(id)) problems.push(`REF ${where}: ${id} does not exist`); };
ep.places.forEach((pl) => pl.adjacent.forEach((a) => need(a, `place ${pl.id}.adjacent`)));
ep.presence.forEach((p) => { need(p.personId, 'presence'); need(p.placeId, 'presence'); });
ep.statements.forEach((s) => { need(s.personId, s.id); need(s.topicId, s.id); (s.refutedBy ?? []).forEach((r) => need(r, `${s.id}.refutedBy`)); });
ep.evidence.forEach((e) => { need(e.placeId, e.id); if (e.requiresCard) need(e.requiresCard, `${e.id}.requiresCard`); });
ep.propositions.forEach((p) => { p.provedBy.flat().forEach((id) => need(id, `${p.id}.provedBy`)); p.refutedBy.forEach((id) => need(id, `${p.id}.refutedBy`)); });
need(ep.truth.culpritId, 'truth'); need(ep.truth.methodId, 'truth'); need(ep.truth.decisiveEvidenceId, 'truth');
need(ep.startPlaceId, 'start'); need(ep.watsonStartPlaceId, 'watsonStart');

// R1: at most one provable culprit-proposition
const culpritProps = ep.propositions.filter((p) => /took|killed|culprit|did it|murder/i.test(p.text.en) && p.provedBy.length > 0);
if (culpritProps.length > 1) problems.push(`R1 more than one provable culprit-proposition: ${culpritProps.map((p) => p.id).join(', ')}`);
// R2: soft for the tutorial, except "the culprit never lies", which is hard
const liars = new Set(ep.statements.filter((s) => s.lie).map((s) => s.personId));
if (liars.size < 3) soft.push(`R2 only ${liars.size} liar(s); need >=3  [allowed for the tutorial]`);
if (!liars.has(ep.truth.culpritId)) problems.push('R2 the culprit never lies');
// R3: decisive evidence gated + has a full description
const dec = ep.evidence.find((e) => e.id === ep.truth.decisiveEvidenceId);
if (!dec) problems.push('R3 decisive evidence not found');
else {
  if (!dec.requiresCard) problems.push(`R3 decisive evidence ${dec.id} has no requiresCard gate`);
  if (!dec.fullDescription || dec.fullDescription.en.length <= 40) problems.push(`R3 decisive evidence ${dec.id} has no fullDescription over 40 chars`);
}
// R4: something depends on the clock
const timed = ep.statements.some((s) => s.availableFrom !== undefined || s.availableTo !== undefined)
  || ep.evidence.some((e) => e.availableFrom !== undefined || e.availableTo !== undefined)
  || ep.presence.some((p) => p.from > 0 || p.to < ep.budgetMinutes);
if (!timed) problems.push('R4 nothing depends on the clock');
// R5: a record is load-bearing
const recordIds = new Set(ep.records.map((r) => r.id));
const recordUsed = ep.propositions.some((p) => p.provedBy.some((set) => set.some((id) => recordIds.has(id))) || p.refutedBy.some((id) => recordIds.has(id)));
if (!recordUsed) problems.push('R5 no record participates in any proposition');
// R6: loudest liar is not the culprit
const lieCount = new Map<string, number>();
ep.statements.forEach((s) => { if (s.lie) lieCount.set(s.personId, (lieCount.get(s.personId) ?? 0) + 1); });
const ranked = [...lieCount.entries()].sort((a, b) => b[1] - a[1]);
const loudest = ranked[0];
if (loudest && loudest[0] === ep.truth.culpritId) problems.push(`R6 loudest liar ${loudest[0]} is the culprit`);
if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) problems.push(`R6 tie for loudest liar (${ranked[0][0]}=${ranked[0][1]}, ${ranked[1][0]}=${ranked[1][1]}); the rule would depend on sort order`);
// R7: exhaustive time (soft for the tutorial)
const exhaustive = ep.statements.length * COST.talk + ep.evidence.length * COST.examine + ep.places.length * COST.move * 2
  + ep.people.length * COST.cross_check + COST.search_records * 3;
if (exhaustive < ep.budgetMinutes * 1.6) soft.push(`R7 exhaustive ${exhaustive} min < 1.6 x budget ${ep.budgetMinutes}  [allowed for the tutorial]`);

// every Text non-empty in both languages
let textCount = 0;
const walk = (v: unknown, path: string) => {
  if (!v || typeof v !== 'object') return;
  if ('en' in (v as object) && 'ko' in (v as object)) {
    const tx = v as { en: string; ko: string };
    textCount++;
    if (!tx.en.trim() || !tx.ko.trim()) problems.push(`TEXT ${path} is empty in one language`);
    return;
  }
  Object.entries(v as object).forEach(([k, x]) => walk(x, `${path}.${k}`));
};
walk({ ...ep, clockLabel: undefined }, 'EP0');

// ---------- golden path replay (mirrors src/kernel/kernel.ts) ----------
const STOP = new Set(['the', 'a', 'an', 'you', 'your', 'were', 'was', 'is', 'are', 'do', 'did', 'about', 'of', 'to', 'at', 'in', 'on', 'and', 'or', 'what', 'know', 'anything', 'tell', 'me', 'with', 'for', 'have', 'has', 'had', 'be', 'it', 'that', 'this', 'there']);
const tokenize = (q: string) => q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
const within = (from: number | undefined, to: number | undefined, clock: number) =>
  (from === undefined || clock >= from) && (to === undefined || clock < to);
const whoIsHere = (clock: number, placeId: string) =>
  ep.presence.filter((p) => p.placeId === placeId && clock >= p.from && clock < p.to).map((p) => p.personId);

let clock = 0;
const pos: Record<string, string> = { holmes: ep.startPlaceId, watson: ep.watsonStartPlaceId };
const board = new Map<string, { unlocked: boolean }>();
const trace: string[] = [];
let detail = '';
let lockerAt = -1;
let inventoryAt = -1;
const die = (msg: string) => { problems.push(`GOLDEN ${msg}`); throw new Error(msg); };

try {
  for (const [actor, cmd] of EP0_GOLDEN) {
    const kind = cmd.kind as string;
    if (clock >= ep.budgetMinutes) die(`CASE_CLOSED before ${kind} at ${clock}`);
    switch (kind) {
      case 'move': {
        const to = cmd.placeId as string;
        const here = ep.places.find((p) => p.id === pos[actor])!;
        if (!ep.places.some((p) => p.id === to)) die(`UNKNOWN_ID place ${to}`);
        if (!here.adjacent.includes(to)) die(`NOT_ADJACENT ${here.id} -> ${to}`);
        pos[actor] = to; clock += COST.move;
        board.set(`place:${to}`, { unlocked: true });
        break;
      }
      case 'talk': {
        const personId = cmd.personId as string, topicId = cmd.topicId as string;
        const st = ep.statements.find((x) => x.personId === personId && x.topicId === topicId);
        if (!st) die(`UNKNOWN_ID statement ${personId}/${topicId}`);
        if (!whoIsHere(clock, pos[actor]).includes(personId)) die(`NOT_HERE ${personId} not in ${pos[actor]} at ${clock}`);
        if (!within(st!.availableFrom, st!.availableTo, clock)) die(`NOT_NOW ${st!.id} at ${clock}`);
        clock += COST.talk; board.set(st!.id, { unlocked: true });
        break;
      }
      case 'examine': {
        const evId = cmd.evidenceId as string;
        const ev = ep.evidence.find((e) => e.id === evId);
        if (!ev) die(`UNKNOWN_ID evidence ${evId}`);
        if (ev!.placeId !== pos[actor]) die(`NOT_HERE ${evId} is in ${ev!.placeId}, ${actor} in ${pos[actor]}`);
        if (!within(ev!.availableFrom, ev!.availableTo, clock)) die(`NOT_NOW ${evId} at ${clock}`);
        clock += COST.examine;
        const unlocked = !ev!.requiresCard || board.has(ev!.requiresCard);
        if (ev!.requiresCard && !unlocked) problems.push(`GOLDEN ${evId} examined without its gate card ${ev!.requiresCard}`);
        board.set(evId, { unlocked });
        if (evId === ep.truth.decisiveEvidenceId) lockerAt = clock;
        break;
      }
      case 'search_records': {
        clock += COST.search_records;
        const words = new Set(tokenize(cmd.query as string));
        const hits = ep.records.filter((r) => r.keywords.some((k) => words.has(k)));
        if (hits.length === 0) problems.push(`GOLDEN search_records "${cmd.query}" found nothing`);
        for (const r of hits) { board.set(r.id, { unlocked: true }); if (r.id === 'r_inventory' && inventoryAt < 0) inventoryAt = clock; }
        detail = `      hits: ${hits.map((r) => r.id).join(', ')}`;
        break;
      }
      case 'timeline': clock += COST.timeline; break;
      case 'cross_check': clock += COST.cross_check; break;
      case 'submit_theory': {
        for (const c of cmd.claims as { claim: string; evidence_ids: string[] }[]) {
          const p = ep.propositions.find((x) => x.id === c.claim);
          if (!p) { problems.push(`GOLDEN claim ${c.claim} matches no proposition id`); continue; }
          const cited = c.evidence_ids.filter((id) => board.has(id));
          const off = c.evidence_ids.filter((id) => !board.has(id));
          if (off.length) problems.push(`GOLDEN claim ${p.id} cites cards not on the board: ${off.join(', ')}`);
          if (p.refutedBy.some((id) => cited.includes(id))) problems.push(`GOLDEN claim ${p.id} is contradicted by its own citations`);
          else if (!p.provedBy.some((set) => set.every((id) => cited.includes(id)))) problems.push(`GOLDEN claim ${p.id} is unsupported by ${cited.join(', ')}`);
          else detail = `      claim ${p.id}: proven`;
        }
        break;
      }
      default: die(`unhandled verb ${kind}`);
    }
    trace.push(`  ${String(clock).padStart(3)}  ${ep.clockLabel(clock)}  ${actor.padEnd(6)} ${kind}${'placeId' in cmd ? ` ${cmd.placeId}` : ''}${'personId' in cmd ? ` ${cmd.personId}/${cmd.topicId ?? ''}` : ''}${'evidenceId' in cmd ? ` ${cmd.evidenceId}` : ''}${'query' in cmd ? ` "${cmd.query}"` : ''}`);
    if (detail) { trace.push(detail); detail = ''; }
  }
} catch {
  // already recorded in problems
}

if (lockerAt < 0) problems.push('GOLDEN the decisive evidence was never examined');
if (inventoryAt < 0) problems.push('GOLDEN r_inventory never reached the board');
if (lockerAt >= 0 && inventoryAt >= 0 && inventoryAt > lockerAt) problems.push('GOLDEN e_locker was opened before r_inventory was on the board');
if (clock >= ep.budgetMinutes) problems.push(`GOLDEN final clock ${clock} is not under the ${ep.budgetMinutes} minute budget`);
const decCard = board.get(ep.truth.decisiveEvidenceId);
if (!decCard?.unlocked) problems.push('GOLDEN the decisive card was never unlocked');

// ---------- report ----------
console.log('Episode 0 — self-check\n');
console.log('golden path:');
trace.forEach((l) => console.log(l));
console.log(`\nfinal clock: ${clock} / ${ep.budgetMinutes} min  (${ep.clockLabel(0)} -> ${ep.clockLabel(clock)})`);
console.log(`texts checked (en+ko): ${textCount}`);
console.log(`liar counts: ${ranked.map(([p, n]) => `${p}=${n}`).join(', ')}  culprit=${ep.truth.culpritId}`);
console.log(`r_inventory on board at ${inventoryAt}, e_locker examined at ${lockerAt}`);
console.log(`\nR1 ok · R3 ok · R4 ${timed ? 'ok' : 'FAIL'} · R5 ${recordUsed ? 'ok' : 'FAIL'} · R6 ${loudest && loudest[0] !== ep.truth.culpritId ? 'ok' : 'FAIL'}  (hard rules; see problems below if any)`);
soft.forEach((s) => console.log(`soft (not a failure): ${s}`));
if (problems.length) {
  console.log(`\nPROBLEMS (${problems.length}):`);
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
console.log('\nOK — all hard rules pass and the golden path solves inside the budget.');
