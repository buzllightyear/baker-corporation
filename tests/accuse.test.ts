import { describe, it, expect } from 'vitest';
import { invoke } from '../src/kernel/kernel';
import { recapOf } from '../src/kernel/recap';
import { newRun } from '../src/kernel/model';
import { MINI_CASE as ep } from './fixtures/mini-case';
const s0 = () => newRun('mini', 'hall', 'hall');
describe('accuse', () => {
  it('solves when all three match and reveals the truth', () => {
    const r = invoke(ep, s0(), 'holmes', { kind: 'accuse', who: 'ada', how: 'm_took', evidence: 'e_print' });
    expect(r.ok && r.state.verdict).toBe('solved'); expect(r.ok && (r.result as any).reveal.en).toBe('Ada took it.');
  });
  it('reports only which slots were wrong, keeps the truth sealed, decrements', () => {
    const r = invoke(ep, s0(), 'holmes', { kind: 'accuse', who: 'ada', how: 'm_sold', evidence: 'e_print' });
    expect(r.ok && (r.result as any).result).toEqual({ who: true, how: false, evidence: true }); expect(r.ok && r.state.accusationsLeft).toBe(1);
    expect(r.ok && r.state.verdict).toBe(null); expect(JSON.stringify(r)).not.toMatch(/reveal|culprit/);
  });
  it('second failure ends the case as failed; third attempt rejected', () => {
    const a = invoke(ep, s0(), 'holmes', { kind: 'accuse', who: 'bo', how: 'm_sold', evidence: 'e_hook' }); if (!a.ok) throw new Error();
    const b = invoke(ep, a.state, 'holmes', { kind: 'accuse', who: 'bo', how: 'm_sold', evidence: 'e_hook' }); if (!b.ok) throw new Error();
    expect(b.state.verdict).toBe('failed'); expect(b.state.accusationsLeft).toBe(0);
    const c = invoke(ep, b.state, 'holmes', { kind: 'accuse', who: 'ada', how: 'm_took', evidence: 'e_print' }); expect(!c.ok && c.code).toBe('NO_ACCUSATIONS_LEFT');
  });
  it('watson cannot accuse; accusing works after the clock closed', () => {
    expect(invoke(ep, s0(), 'watson', { kind: 'accuse', who: 'ada', how: 'm_took', evidence: 'e_print' }).ok).toBe(false);
    const late = { ...s0(), clock: 120 };
    expect(invoke(ep, late, 'holmes', { kind: 'accuse', who: 'ada', how: 'm_took', evidence: 'e_print' }).ok).toBe(true);
  });
  it('unknown ids are INVALID_ARGS', () => { const r = invoke(ep, s0(), 'holmes', { kind: 'accuse', who: 'zed', how: 'm_took', evidence: 'e_print' }); expect(!r.ok && r.code).toBe('INVALID_ARGS'); });
});
describe('recap', () => {
  it('computes the three numbers, order, visited/unvisited', () => {
    const a = invoke(ep, s0(), 'holmes', { kind: 'move', placeId: 'galley' }); if (!a.ok) throw new Error();
    const b = invoke(ep, a.state, 'watson', { kind: 'move', placeId: 'engine' }); if (!b.ok) throw new Error();
    const c = invoke(ep, b.state, 'holmes', { kind: 'accuse', who: 'ada', how: 'm_took', evidence: 'e_print' }); if (!c.ok) throw new Error();
    const rc = recapOf(ep, c.state);
    expect(rc).toMatchObject({ timeLeft: 100, watsonCalls: 1, accusations: 1, visited: ['hall', 'galley', 'engine'], unvisited: [] });
    expect(rc.order.map((o) => o.cardId)).toEqual(['place:galley', 'place:engine']);
  });
});
