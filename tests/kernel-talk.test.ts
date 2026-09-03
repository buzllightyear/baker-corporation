import { describe, it, expect } from 'vitest';
import { invoke } from '../src/kernel/kernel';
import { newRun } from '../src/kernel/model';
import { MINI_CASE as ep } from './fixtures/mini-case';
const at = (placeId: string, clock = 0) => ({ ...newRun('mini', 'hall', 'hall'), clock, pos: { holmes: placeId, watson: 'hall' } });
describe('talk', () => {
  it('returns the statement card for a topic when the person is here and now', () => {
    const r = invoke(ep, at('galley'), 'holmes', { kind: 'talk', personId: 'bo', topicId: 'night' });
    expect(r.ok && r.state.cards[0].id).toBe('s_bo_night'); expect(r.ok && r.state.clock).toBe(5);
  });
  it('rejects a person not in the room, and a statement not yet available', () => {
    let r = invoke(ep, at('galley'), 'holmes', { kind: 'talk', personId: 'ada', topicId: 'night' }); expect(!r.ok && r.code).toBe('NOT_HERE');
    r = invoke(ep, at('galley', 0), 'holmes', { kind: 'talk', personId: 'bo', topicId: 'wrench' }); expect(!r.ok && r.code).toBe('NOT_NOW');
    r = invoke(ep, at('galley', 30), 'holmes', { kind: 'talk', personId: 'bo', topicId: 'wrench' }); expect(r.ok).toBe(true);
  });
  it('unlocks the full evidence description once the gating statement is on the board', () => {
    const a = invoke(ep, at('galley', 30), 'holmes', { kind: 'examine', evidenceId: 'e_print' }); if (!a.ok) throw new Error(a.code);
    const b = invoke(ep, a.state, 'holmes', { kind: 'talk', personId: 'bo', topicId: 'wrench' }); if (!b.ok) throw new Error(b.code);
    const c = invoke(ep, b.state, 'holmes', { kind: 'examine', evidenceId: 'e_print' }); if (!c.ok) throw new Error(c.code);
    expect(c.state.cards.find((x) => x.id === 'e_print')!.body.en).toContain('engine grease');
    expect(c.state.cards.filter((x) => x.id === 'e_print').length).toBe(1);
  });
  it('the card never carries lie or refutedBy', () => {
    const r = invoke(ep, at('engine'), 'holmes', { kind: 'talk', personId: 'ada', topicId: 'wrench' });
    expect(r.ok && JSON.stringify(r.state.cards[0])).not.toMatch(/lie|refutedBy/);
  });
});
describe('pin', () => {
  it('adds a note without moving the clock; unknown card rejected', () => {
    const a = invoke(ep, at('galley'), 'holmes', { kind: 'talk', personId: 'bo', topicId: 'night' }); if (!a.ok) throw new Error();
    const b = invoke(ep, a.state, 'holmes', { kind: 'pin', cardId: 's_bo_night', note: 'Ada moved.' });
    expect(b.ok && b.state.pins[0].note).toBe('Ada moved.'); expect(b.ok && b.state.clock).toBe(5);
    const c = invoke(ep, a.state, 'holmes', { kind: 'pin', cardId: 'nope', note: '' }); expect(!c.ok && c.code).toBe('UNKNOWN_ID');
  });
});
