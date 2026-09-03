import type { Episode, Topic } from '../../content/types';
import type { Actor, Cmd, KernelResult, RunState } from './model';
import { advance } from './clock';
import { addCard, whoIsHere } from './kernel';
import { cardFromRecord, cardFromStatement } from './redact';
const STOP = new Set(['the', 'a', 'an', 'you', 'your', 'were', 'was', 'is', 'are', 'do', 'did', 'about', 'of', 'to', 'at', 'in', 'on', 'and', 'or', 'what', 'know', 'anything', 'tell', 'me', 'with', 'for', 'have', 'has', 'had', 'be', 'it', 'that', 'this', 'there']);
export function tokenize(q: string): string[] { return q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w)); }
export function matchTopic(ep: Episode, personId: string, q: string): Topic | null {
  const words = new Set(tokenize(q));
  const candidates = ep.topics.filter((t) => ep.statements.some((s) => s.personId === personId && s.topicId === t.id));
  let best: Topic | null = null, bestScore = 0;
  for (const t of candidates) { const score = t.keywords.filter((k) => words.has(k)).length; if (score > bestScore) { best = t; bestScore = score; } }
  return best;
}
export function runAsk(ep: Episode, s: RunState, actor: Actor, cmd: Extract<Cmd, { kind: 'ask' }>): KernelResult {
  if (!ep.people.some((p) => p.id === cmd.personId)) return { ok: false, code: 'UNKNOWN_ID', message: `No person ${cmd.personId}.` };
  if (!whoIsHere(ep, s, s.pos[actor]).some((p) => p.id === cmd.personId)) return { ok: false, code: 'NOT_HERE', message: `${cmd.personId} is not in ${s.pos[actor]} right now.` };
  s = advance(s, 'ask');
  const topic = matchTopic(ep, cmd.personId, cmd.question);
  const st = topic ? ep.statements.find((x) => x.personId === cmd.personId && x.topicId === topic.id) : undefined;
  const now = st && (st.availableFrom === undefined || s.clock >= st.availableFrom) && (st.availableTo === undefined || s.clock < st.availableTo);
  if (!st || !now) return { ok: true, state: s, result: { unknown: true, note: 'They have nothing to say about that. Voice it as the character declining or not knowing — do not invent details.' } };
  s = addCard(s, cardFromStatement(st, ep, actor, s.clock));
  return { ok: true, state: s, result: { card: s.cards.find((c) => c.id === st.id), note: 'Voice this in the character\'s own words. Say only what the card says.' } };
}
export function runSearchRecords(ep: Episode, s: RunState, actor: Actor, cmd: Extract<Cmd, { kind: 'search_records' }>): KernelResult {
  s = advance(s, 'search_records');
  const words = new Set(tokenize(cmd.query));
  const hits = ep.records.filter((r) => r.keywords.some((k) => words.has(k)));
  for (const r of hits) s = addCard(s, cardFromRecord(r, actor, s.clock));
  return { ok: true, state: s, result: { hits: hits.map((r) => s.cards.find((c) => c.id === r.id)) } };
}
