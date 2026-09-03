import { describe, it, expect } from 'vitest';
import { invoke } from '../src/kernel/kernel';
import { newRun } from '../src/kernel/model';
import { MINI_CASE as ep } from './fixtures/mini-case';
const start = () => newRun('mini', 'hall', 'hall');
describe('move', () => {
  it('moves along adjacency, is free, returns the scene', () => {
    const r = invoke(ep, start(), 'holmes', { kind: 'move', placeId: 'galley' });
    expect(r.ok && r.state.pos.holmes).toBe('galley'); expect(r.ok && r.state.clock).toBe(0);
    expect(r.ok && (r.result as any).people.map((p: any) => p.id)).toEqual(['bo']);
    expect(r.ok && (r.result as any).evidence.map((e: any) => e.id)).toEqual(['e_hook', 'e_print']);
  });
  it('rejects non-adjacent and unknown places', () => {
    let r = invoke(ep, start(), 'holmes', { kind: 'move', placeId: 'nowhere' }); expect(r.ok).toBe(false); expect(!r.ok && r.code).toBe('UNKNOWN_ID');
    const s = { ...start(), pos: { holmes: 'engine', watson: 'hall' } };
    r = invoke(ep, s, 'holmes', { kind: 'move', placeId: 'galley' }); expect(!r.ok && r.code).toBe('NOT_ADJACENT');
  });
  it('watson moves independently of holmes', () => {
    const r = invoke(ep, start(), 'watson', { kind: 'move', placeId: 'engine' });
    expect(r.ok && r.state.pos).toEqual({ holmes: 'hall', watson: 'engine' }); expect(r.ok && r.state.watsonCalls).toBe(1);
  });
  it('presence follows the clock', () => {
    const s = { ...start(), clock: 70, pos: { holmes: 'hall', watson: 'hall' } };
    const r = invoke(ep, s, 'holmes', { kind: 'move', placeId: 'engine' });
    expect(r.ok && (r.result as any).people).toEqual([]);
  });
});
describe('examine', () => {
  it('requires being in the room and honours availableTo and requiresCard', () => {
    let r = invoke(ep, start(), 'holmes', { kind: 'examine', evidenceId: 'e_hook' }); expect(!r.ok && r.code).toBe('NOT_HERE');
    const inGalley = { ...start(), pos: { holmes: 'galley', watson: 'hall' } };
    r = invoke(ep, inGalley, 'holmes', { kind: 'examine', evidenceId: 'e_print' });
    expect(r.ok && r.state.cards[0].body.en).toBe('A greasy handprint.');
    const late = { ...start(), clock: 95, pos: { holmes: 'engine', watson: 'hall' } };
    r = invoke(ep, late, 'holmes', { kind: 'examine', evidenceId: 'e_log' }); expect(!r.ok && r.code).toBe('NOT_NOW');
  });
  it('does not close at the budget while the deadline is off', () => {
    const s = { ...start(), clock: 120 };
    const r = invoke(ep, s, 'holmes', { kind: 'move', placeId: 'galley' }); expect(r.ok).toBe(true);
  });
});
