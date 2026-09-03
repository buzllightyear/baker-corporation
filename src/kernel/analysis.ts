import type { Episode } from '../../content/types';
import type { Cmd, KernelResult, RunState } from './model';
import { advance } from './clock';
type Span = { personId: string; placeId: string; from: number; to: number };
export function conflictsBetween(a: Span, b: Span): boolean { return a.personId === b.personId && a.placeId !== b.placeId && a.from < b.to && b.from < a.to; }
function spansOnBoard(s: RunState, personId?: string) {
  return s.cards.flatMap((c) => (c.asserts ?? []).filter((a) => !personId || a.personId === personId).map((a) => ({ ...a, sourceCardId: c.id })));
}
export function runCrossCheck(ep: Episode, s: RunState, cmd: Extract<Cmd, { kind: 'cross_check' }>): KernelResult {
  if (!ep.people.some((p) => p.id === cmd.personId)) return { ok: false, code: 'UNKNOWN_ID', message: `No person ${cmd.personId}.` };
  s = advance(s, 'cross_check');
  const spans = spansOnBoard(s, cmd.personId).sort((a, b) => a.from - b.from);
  const titleOf = (id: string) => s.cards.find((c) => c.id === id)?.title;
  const conflicts: { a: string; b: string; aTitle?: { en: string; ko: string }; bTitle?: { en: string; ko: string }; personId: string; why: string }[] = [];
  for (let i = 0; i < spans.length; i++) for (let j = i + 1; j < spans.length; j++) {
    const x = spans[i], y = spans[j];
    if (x.sourceCardId !== y.sourceCardId && conflictsBetween(x, y)) conflicts.push({ a: x.sourceCardId, b: y.sourceCardId, aTitle: titleOf(x.sourceCardId), bTitle: titleOf(y.sourceCardId), personId: cmd.personId, why: `${x.sourceCardId} puts ${cmd.personId} in ${x.placeId} ${x.from}-${x.to}; ${y.sourceCardId} puts them in ${y.placeId} ${y.from}-${y.to}.` });
  }
  return { ok: true, state: s, result: { conflicts, note: 'These are mechanical time/place collisions between cards already on the board — candidates, not verdicts. A collision means at least one card is wrong, not which.' } };
}
export function runTimeline(ep: Episode, s: RunState, cmd: Extract<Cmd, { kind: 'timeline' }>): KernelResult {
  if (cmd.personId && !ep.people.some((p) => p.id === cmd.personId)) return { ok: false, code: 'UNKNOWN_ID', message: `No person ${cmd.personId}.` };
  s = advance(s, 'timeline');
  const people = cmd.personId ? [cmd.personId] : ep.people.map((p) => p.id);
  const timeline = people.map((personId) => {
    const spans = spansOnBoard(s, personId).sort((a, b) => a.from - b.from);
    const gaps: { from: number; to: number }[] = []; let cursor = 0;
    for (const sp of spans) { if (sp.from > cursor) gaps.push({ from: cursor, to: sp.from }); cursor = Math.max(cursor, Math.min(sp.to, ep.budgetMinutes)); }
    if (cursor < ep.budgetMinutes) gaps.push({ from: cursor, to: ep.budgetMinutes });
    return { personId, spans, gaps };
  });
  return { ok: true, state: s, result: { timeline, clockLabel: ep.clockLabel(s.clock) } };
}
