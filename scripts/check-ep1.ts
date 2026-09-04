// scripts/check-ep1.ts — standalone authoring check for an Episode.
//
// Why this exists: the content branches are written in parallel with the kernel,
// so `src/kernel/*` may not be present yet and `tests/content-ep*.test.ts` cannot
// run. This script re-implements the parts of `validateCase` (Task 9) and of the
// kernel's legality rules (Tasks 3-7) that an author needs, so a case file can be
// checked on its own branch before the merge. Once the kernel is merged, the
// vitest suite is authoritative; keep this as the fast authoring loop.
//
// Run it (no extra dependency needed — this repo already has typescript):
//
//   npx tsc --ignoreConfig scripts/check-ep1.ts --outDir /tmp/ep1check \
//     --module commonjs --target es2022 --moduleResolution bundler --strict \
//     && node /tmp/ep1check/scripts/check-ep1.js
//
// (`npx tsx scripts/check-ep1.ts` does the same in one line if tsx is installed.)
//
import { EP1, EP1_GOLDEN } from '../content/ep1-sensor';
import { COST } from '../src/kernel/clock';
import type { Episode, Minute } from '../content/types';

declare const process: { exit(code: number): never };   // avoids a dependency on @types/node

type Cmd = Record<string, unknown>;
type Actor = 'holmes' | 'watson';


const problems: string[] = [];
const notes: string[] = [];
const P = (s: string) => problems.push(s);

// ─────────────────────────────── reference integrity ──────────────────────────
function checkReferences(ep: Episode): void {
  const ids = new Set<string>(
    [...ep.places, ...ep.people, ...ep.statements, ...ep.evidence, ...ep.records, ...ep.topics, ...ep.methods, ...ep.propositions].map((x) => x.id),
  );
  const need = (id: string, where: string) => { if (!ids.has(id)) P(`REF ${where}: ${id} does not exist`); };
  ep.places.forEach((pl) => pl.adjacent.forEach((a) => need(a, `place ${pl.id}.adjacent`)));
  ep.presence.forEach((p) => { need(p.personId, 'presence'); need(p.placeId, 'presence'); });
  ep.statements.forEach((s) => {
    need(s.personId, s.id); need(s.topicId, s.id);
    (s.refutedBy ?? []).forEach((r) => need(r, `${s.id}.refutedBy`));
    (s.asserts ?? []).forEach((a) => { need(a.personId, `${s.id}.asserts`); need(a.placeId, `${s.id}.asserts`); });
  });
  ep.evidence.forEach((e) => {
    need(e.placeId, e.id);
    if (e.requiresCard) need(e.requiresCard, `${e.id}.requiresCard`);
    (e.asserts ?? []).forEach((a) => { need(a.personId, `${e.id}.asserts`); need(a.placeId, `${e.id}.asserts`); });
  });
  ep.records.forEach((r) => (r.asserts ?? []).forEach((a) => { need(a.personId, `${r.id}.asserts`); need(a.placeId, `${r.id}.asserts`); }));
  ep.propositions.forEach((p) => {
    p.provedBy.flat().forEach((id) => need(id, `${p.id}.provedBy`));
    p.refutedBy.forEach((id) => need(id, `${p.id}.refutedBy`));
  });
  need(ep.truth.culpritId, 'truth'); need(ep.truth.methodId, 'truth'); need(ep.truth.decisiveEvidenceId, 'truth');
  need(ep.startPlaceId, 'start'); need(ep.watsonStartPlaceId, 'watsonStart');
  // adjacency should be symmetric, or the map lies to the player
  ep.places.forEach((pl) => pl.adjacent.forEach((a) => {
    const other = ep.places.find((x) => x.id === a);
    if (other && !other.adjacent.includes(pl.id)) P(`REF adjacency ${pl.id}->${a} is one-way`);
  }));
}

// ─────────────────────────────────── R1 - R7 ──────────────────────────────────
function checkRules(ep: Episode): void {
  const culpritProps = ep.propositions.filter((p) => /took|killed|culprit|did it|murder/i.test(p.text.en) && p.provedBy.length > 0);
  if (culpritProps.length > 1) P(`R1 more than one provable culprit-proposition: ${culpritProps.map((p) => p.id).join(', ')}`);
  notes.push(`R1 provable culprit-propositions by keyword: ${culpritProps.length} (must be ≤ 1)`);

  const liars = new Set(ep.statements.filter((s) => s.lie).map((s) => s.personId));
  if (liars.size < 3) P(`R2 only ${liars.size} liar(s); need ≥3`);
  if (!liars.has(ep.truth.culpritId)) P('R2 the culprit never lies');
  notes.push(`R2 liars: ${[...liars].join(', ')} (${liars.size}); culprit lies: ${liars.has(ep.truth.culpritId)}`);

  const dec = ep.evidence.find((e) => e.id === ep.truth.decisiveEvidenceId);
  if (dec && !dec.requiresCard) P(`R3 decisive evidence ${dec.id} has no requiresCard gate`);
  if (dec && !dec.fullDescription) P(`R3 decisive evidence ${dec.id} has no fullDescription`);
  notes.push(`R3 decisive ${dec?.id} gated by ${dec?.requiresCard}${dec?.requiresCard ? ` (itself gated by ${ep.evidence.find((e) => e.id === dec.requiresCard)?.requiresCard ?? 'nothing'})` : ''}`);

  const timed = ep.statements.some((s) => s.availableFrom !== undefined || s.availableTo !== undefined)
    || ep.evidence.some((e) => e.availableFrom !== undefined || e.availableTo !== undefined)
    || ep.presence.some((p) => p.from > 0 || p.to < ep.budgetMinutes);
  if (!timed) P('R4 nothing depends on the clock');
  const vanishing = ep.evidence.filter((e) => e.availableTo !== undefined && e.availableTo < ep.budgetMinutes);
  if (vanishing.length === 0) P('R4 no clue vanishes before the budget runs out');
  notes.push(`R4 clock-dependent: yes; clues that vanish: ${vanishing.map((e) => `${e.id}@${e.availableTo}`).join(', ')}`);

  const recordIds = new Set(ep.records.map((r) => r.id));
  const loadBearing = ep.propositions.filter((p) => p.provedBy.some((set) => set.some((id) => recordIds.has(id))) || p.refutedBy.some((id) => recordIds.has(id)));
  if (loadBearing.length === 0) P('R5 no record participates in any proposition');
  notes.push(`R5 propositions carrying a record: ${loadBearing.map((p) => p.id).join(', ')}`);

  const lieCount = new Map<string, number>();
  ep.statements.forEach((s) => { if (s.lie) lieCount.set(s.personId, (lieCount.get(s.personId) ?? 0) + 1); });
  const ranked = [...lieCount.entries()].sort((a, b) => b[1] - a[1]);
  const loudest = ranked[0];
  if (loudest && loudest[0] === ep.truth.culpritId) P(`R6 loudest liar ${loudest[0]} is the culprit`);
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) P(`R6 tie for loudest liar (${ranked[0][0]}, ${ranked[1][0]}) — the trap depends on sort order`);
  notes.push(`R6 lies per person: ${ranked.map(([p, n]) => `${p}=${n}`).join(', ')}; culprit=${ep.truth.culpritId}`);

  const exhaustive = ep.statements.length * COST.talk + ep.evidence.length * COST.examine
    + ep.places.length * COST.move * 2 + ep.people.length * COST.cross_check + COST.search_records * 3;
  if (exhaustive < ep.budgetMinutes * 1.6) P(`R7 exhaustive ${exhaustive} min < 1.6 × budget ${ep.budgetMinutes}`);
  notes.push(`R7 exhaustive = ${ep.statements.length}×5 + ${ep.evidence.length}×5 + ${ep.places.length}×10×2 + ${ep.people.length}×20 + 30×3 = ${exhaustive} min; need ≥ ${ep.budgetMinutes * 1.6}`);
}

// ─────────────────────────────── bilingual text ───────────────────────────────
function checkText(ep: Episode): void {
  const texts: { en: string; ko: string; where: string }[] = [];
  const walk = (v: unknown, where: string): void => {
    if (!v || typeof v !== 'object') return;
    if ('en' in (v as object) && 'ko' in (v as object)) { texts.push({ ...(v as { en: string; ko: string }), where }); return; }
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) walk(val, `${where}.${k}`);
  };
  walk({ ...ep, clockLabel: undefined }, 'EP');
  for (const t of texts) {
    if (!t.en || !t.en.trim()) P(`TEXT ${t.where}: empty en`);
    if (!t.ko || !t.ko.trim()) P(`TEXT ${t.where}: empty ko`);
    if (t.en.trim() === t.ko.trim()) P(`TEXT ${t.where}: ko is a copy of en`);
  }
  notes.push(`TEXT ${texts.length} bilingual fields, all non-empty in both languages`);
}

// ─────────────────────────── golden path simulation ───────────────────────────
function within(from: Minute | undefined, to: Minute | undefined, clock: number): boolean {
  return (from === undefined || clock >= from) && (to === undefined || clock < to);
}
function whoIsHere(ep: Episode, clock: number, placeId: string): string[] {
  return ep.presence.filter((p) => p.placeId === placeId && clock >= p.from && clock < p.to).map((p) => p.personId);
}

function simulate(ep: Episode, golden: ReadonlyArray<readonly [Actor, Cmd]>): void {
  let clock = 0;
  const pos: Record<Actor, string> = { holmes: ep.startPlaceId, watson: ep.watsonStartPlaceId };
  const board = new Set<string>();
  const trace: string[] = [];
  const watsonOnly = new Set(['timeline', 'cross_check', 'search_records', 'submit_theory']);

  golden.forEach(([actor, cmd], i) => {
    const step = `step ${i + 1} (${actor} ${cmd.kind})`;
    const bad = (why: string) => P(`GOLDEN ${step}: ${why}`);
    if (clock >= ep.budgetMinutes) { bad('the case is already closed'); return; }
    if (actor === 'holmes' && watsonOnly.has(cmd.kind as string)) { bad(`${cmd.kind} is Watson's verb`); return; }

    switch (cmd.kind) {
      case 'move': {
        const here = ep.places.find((p) => p.id === pos[actor])!;
        const to = ep.places.find((p) => p.id === cmd.placeId);
        if (!to) { bad(`no place ${cmd.placeId}`); return; }
        if (!here.adjacent.includes(to.id)) { bad(`${here.id} is not adjacent to ${to.id}`); return; }
        pos[actor] = to.id;
        clock += COST.move;
        board.add(`place:${to.id}`);
        break;
      }
      case 'talk': {
        const st = ep.statements.find((x) => x.personId === cmd.personId && x.topicId === cmd.topicId);
        if (!st) { bad(`no statement for ${cmd.personId}/${cmd.topicId}`); return; }
        if (!whoIsHere(ep, clock, pos[actor]).includes(cmd.personId as string)) {
          bad(`${cmd.personId} is not in ${pos[actor]} at ${clock} (${ep.clockLabel(clock)})`); return;
        }
        if (!within(st.availableFrom, st.availableTo, clock)) { bad(`${st.id} is not available at ${clock}`); return; }
        clock += COST.talk;
        board.add(st.id);
        break;
      }
      case 'examine': {
        const ev = ep.evidence.find((e) => e.id === cmd.evidenceId);
        if (!ev) { bad(`no evidence ${cmd.evidenceId}`); return; }
        if (ev.placeId !== pos[actor]) { bad(`${ev.id} is in ${ev.placeId}, ${actor} is in ${pos[actor]}`); return; }
        if (!within(ev.availableFrom, ev.availableTo, clock)) { bad(`${ev.id} is gone at ${clock} (${ep.clockLabel(clock)})`); return; }
        clock += COST.examine;
        const unlocked = !ev.requiresCard || board.has(ev.requiresCard);
        if (ev.requiresCard && !unlocked) notes.push(`GOLDEN ${step}: ${ev.id} read LOCKED (gate ${ev.requiresCard} not on the board)`);
        if (ev.id === ep.truth.decisiveEvidenceId && !unlocked) bad('the decisive evidence was read without its gate');
        board.add(ev.id);
        if (unlocked) board.add(`${ev.id}:full`);
        break;
      }
      case 'search_records': {
        clock += COST.search_records;
        const STOP = new Set(['the', 'a', 'an', 'you', 'your', 'were', 'was', 'is', 'are', 'do', 'did', 'about', 'of', 'to', 'at', 'in', 'on', 'and', 'or', 'what', 'know', 'anything', 'tell', 'me', 'with', 'for', 'have', 'has', 'had', 'be', 'it', 'that', 'this', 'there']);
        const words = new Set(String(cmd.query).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)));
        const hits = ep.records.filter((r) => r.keywords.some((k) => words.has(k)));
        if (hits.length === 0) bad(`query "${cmd.query}" matches no record`);
        hits.forEach((r) => board.add(r.id));
        notes.push(`GOLDEN ${step}: "${cmd.query}" → ${hits.map((r) => r.id).join(', ') || 'nothing'}`);
        break;
      }
      case 'cross_check': {
        if (!ep.people.some((p) => p.id === cmd.personId)) { bad(`no person ${cmd.personId}`); return; }
        clock += COST.cross_check;
        const spans = [...ep.statements, ...ep.evidence, ...ep.records]
          .filter((x) => board.has(x.id))
          .flatMap((x) => (x.asserts ?? []).filter((a) => a.personId === cmd.personId).map((a) => ({ ...a, src: x.id })));
        const conflicts: string[] = [];
        for (let a = 0; a < spans.length; a++) for (let b = a + 1; b < spans.length; b++) {
          const x = spans[a], y = spans[b];
          if (x.src !== y.src && x.placeId !== y.placeId && x.from < y.to && y.from < x.to) conflicts.push(`${x.src}↔${y.src}`);
        }
        notes.push(`GOLDEN ${step}: ${cmd.personId} conflicts = ${conflicts.join(', ') || 'none'}`);
        if (cmd.personId === ep.truth.culpritId && conflicts.length === 0) bad('cross-checking the culprit surfaces nothing');
        break;
      }
      case 'timeline': {
        if (cmd.personId && !ep.people.some((p) => p.id === cmd.personId)) { bad(`no person ${cmd.personId}`); return; }
        clock += COST.timeline;
        break;
      }
      case 'submit_theory': {
        clock += COST.submit_theory;
        for (const c of cmd.claims as { claim: string; evidence_ids: string[] }[]) {
          const p = ep.propositions.find((x) => x.id === c.claim);
          if (!p) { bad(`claim "${c.claim}" is not a proposition id`); continue; }
          const offBoard = c.evidence_ids.filter((id) => !board.has(id));
          if (offBoard.length) bad(`claim ${p.id} cites cards that are not on the board: ${offBoard.join(', ')}`);
          const cited = c.evidence_ids.filter((id) => board.has(id));
          const contradicted = p.refutedBy.some((id) => cited.includes(id));
          const proven = p.provedBy.some((set) => set.every((id) => cited.includes(id)));
          const status = contradicted ? 'contradicted' : proven ? 'proven' : 'unsupported';
          notes.push(`GOLDEN ${step}: ${p.id} → ${status}`);
          if (status === 'unsupported') bad(`claim ${p.id} comes back unsupported`);
        }
        break;
      }
      default: bad(`unhandled verb ${cmd.kind}`);
    }
    trace.push(`${String(i + 1).padStart(2)}. ${actor.padEnd(6)} ${String(cmd.kind).padEnd(15)} ${ep.clockLabel(clock)} (${clock})`);
  });

  if (clock >= ep.budgetMinutes) P(`GOLDEN the path ends at ${clock} min, at or past the ${ep.budgetMinutes} min budget`);
  if (!board.has(`${ep.truth.decisiveEvidenceId}:full`)) P('GOLDEN the decisive evidence was never unlocked');

  console.log('\n── golden path ──');
  trace.forEach((l) => console.log(l));
  console.log(`\nfinal clock: ${clock} / ${ep.budgetMinutes} min  (${ep.clockLabel(0)} → ${ep.clockLabel(clock)}), ${golden.length} steps`);
  console.log(`cards on the board at the end: ${board.size}`);
}

// ───────────────────────────────────── run ────────────────────────────────────
const ep = EP1;
checkReferences(ep);
checkRules(ep);
checkText(ep);
simulate(ep, EP1_GOLDEN);

console.log('\n── counts ──');
console.log(`places ${ep.places.length} · people ${ep.people.length} · topics ${ep.topics.length} · statements ${ep.statements.length} · evidence ${ep.evidence.length} · records ${ep.records.length} · propositions ${ep.propositions.length} · methods ${ep.methods.length}`);

console.log('\n── rules ──');
notes.filter((n) => !n.startsWith('GOLDEN')).forEach((n) => console.log(`  ${n}`));
console.log('\n── golden path detail ──');
notes.filter((n) => n.startsWith('GOLDEN')).forEach((n) => console.log(`  ${n}`));

console.log('');
if (problems.length === 0) {
  console.log(`✅ ${ep.id} passes reference integrity, R1–R7, bilingual text, and the golden path.`);
} else {
  console.log(`❌ ${problems.length} problem(s):`);
  problems.forEach((p) => console.log(`  - ${p}`));
  process.exit(1);
}
