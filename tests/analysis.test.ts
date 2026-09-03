import { describe, it, expect } from 'vitest';
import { runTimeline, runCrossCheck, conflictsBetween } from '../src/kernel/analysis';
import { newRun } from '../src/kernel/model';
import { invoke } from '../src/kernel/kernel';
import { MINI_CASE as ep } from './fixtures/mini-case';
function board() {
  let s = { ...newRun('mini', 'hall', 'hall'), pos: { holmes: 'galley', watson: 'engine' } };
  const a = invoke(ep, s, 'holmes', { kind: 'talk', personId: 'bo', topicId: 'night' }); if (!a.ok) throw new Error(a.code);
  const b = invoke(ep, a.state, 'watson', { kind: 'talk', personId: 'ada', topicId: 'night' }); if (!b.ok) throw new Error(b.code);
  return b.state;
}
describe('cross_check', () => {
  it('flags a time-place conflict between two cards about the same person', () => {
    const r = runCrossCheck(ep, board(), { kind: 'cross_check', personId: 'ada' });
    expect(r.ok && (r.result as any).conflicts.length).toBe(1);
    expect(r.ok && (r.result as any).conflicts[0]).toMatchObject({ a: 's_ada_night', b: 's_bo_night', personId: 'ada' });
    expect(r.ok && r.state.clock).toBe(board().clock + 20);
  });
  it('finds nothing when the board lacks the second card', () => {
    const s = { ...newRun('mini', 'hall', 'hall'), pos: { holmes: 'hall', watson: 'engine' } };
    const a = invoke(ep, s, 'watson', { kind: 'talk', personId: 'ada', topicId: 'night' }); if (!a.ok) throw new Error();
    const r = runCrossCheck(ep, a.state, { kind: 'cross_check', personId: 'ada' });
    expect(r.ok && (r.result as any).conflicts).toEqual([]);
  });
  it('conflictsBetween is symmetric and ignores different people', () => {
    const x = { personId: 'ada', placeId: 'engine', from: 0, to: 120 }, y = { personId: 'ada', placeId: 'galley', from: 60, to: 120 }, z = { personId: 'bo', placeId: 'galley', from: 60, to: 120 };
    expect(conflictsBetween(x, y)).toBe(true); expect(conflictsBetween(y, x)).toBe(true); expect(conflictsBetween(x, z)).toBe(false);
  });
});
describe('timeline', () => {
  it('lists spans from cards and the gaps between them', () => {
    const r = runTimeline(ep, board(), { kind: 'timeline', personId: 'ada' });
    const t = r.ok && (r.result as any).timeline[0];
    expect(t.personId).toBe('ada'); expect(t.spans.map((x: any) => x.sourceCardId).sort()).toEqual(['s_ada_night', 's_bo_night']);
  });
  it('gaps: with only the door log (0-55) on the board, 55-120 is a gap', () => {
    let s = { ...newRun('mini', 'hall', 'hall'), pos: { holmes: 'engine', watson: 'hall' } };
    const a = invoke(ep, s, 'holmes', { kind: 'examine', evidenceId: 'e_log' }); if (!a.ok) throw new Error();
    const r = runTimeline(ep, a.state, { kind: 'timeline', personId: 'ada' });
    expect(r.ok && (r.result as any).timeline[0].gaps).toEqual([{ from: 55, to: 120 }]);
  });
});
