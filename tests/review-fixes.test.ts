import { describe, it, expect } from 'vitest';
import { invoke } from '../src/kernel/kernel';
import { newRun } from '../src/kernel/model';
import type { RunState, Cmd, Actor } from '../src/kernel/model';
import { coverage, leads } from '../src/kernel/leads';
import { MINI_CASE as ep } from './fixtures/mini-case';
import { EP1 } from '../content/ep1-sensor';

const run = (...steps: [Actor, Cmd][]): RunState => steps.reduce((s, [a, c]) => { const r = invoke(ep, s, a, c); if (!r.ok) throw new Error(`${c.kind}: ${r.message}`); return r.state; }, newRun('mini', 'hall', 'hall'));

describe('codex review fixes', () => {
  it('hearing never names an undiscovered card: only held-but-uncited cards are named, the rest is a count', () => {
    const s = run(['holmes', { kind: 'move', placeId: 'galley' }]);
    const r = invoke(ep, s, 'watson', { kind: 'submit_theory', claims: [{ claim: 'p_ada_took', evidence_ids: [] }] });
    const v = (r.ok ? (r.result as any).verdicts[0] : null)!;
    expect(v.status).toBe('unsupported'); expect(v.missing).toEqual([]); expect(v.stillToFind).toBe(2);
    // hold s_bo_wrench (opens at 30) but do not cite it → it is named; e_print still unfound → counted
    const s2 = run(['holmes', { kind: 'move', placeId: 'galley' }], ['watson', { kind: 'search_records', query: 'wrench' }], ['holmes', { kind: 'talk', personId: 'bo', topicId: 'wrench' }]);
    const r2 = invoke(ep, s2, 'watson', { kind: 'submit_theory', claims: [{ claim: 'p_ada_took', evidence_ids: [] }] });
    const v2 = (r2.ok ? (r2.result as any).verdicts[0] : null)!;
    expect(v2.missing).toEqual(['s_bo_wrench']); expect(v2.stillToFind).toBe(1);
  });
  it('a locked partial card is not proof: coverage, hearing and leads all ignore it until the prerequisite is held', () => {
    const s = run(['holmes', { kind: 'move', placeId: 'galley' }], ['holmes', { kind: 'examine', evidenceId: 'e_print' }]);   // before s_bo_wrench → locked
    expect(s.cards.find((c) => c.id === 'e_print')?.unlocked).toBe(false);
    expect(leads(ep, s).rooms.find((r) => r.placeId === 'galley')?.unexamined).toBe(2);   // e_hook + locked e_print
    const s2 = [['watson', { kind: 'search_records', query: 'wrench' }], ['holmes', { kind: 'talk', personId: 'bo', topicId: 'wrench' }]].reduce((st, [a, c]) => invoke(ep, st, a as Actor, c as Cmd).ok ? (invoke(ep, st, a as Actor, c as Cmd) as any).state : st, s);
    expect(coverage(ep, s2).covered).toBe(0);   // e_print still the locked version
    const r = invoke(ep, s2, 'watson', { kind: 'submit_theory', claims: [{ claim: 'p_ada_took', evidence_ids: ['e_print', 's_bo_wrench'] }] });
    expect(r.ok && (r.result as any).verdicts[0].status).toBe('unsupported');
    const s3 = invoke(ep, s2, 'holmes', { kind: 'examine', evidenceId: 'e_print' });   // re-examine → unlocked upgrade
    expect(s3.ok && s3.state.cards.find((c) => c.id === 'e_print')?.unlocked).toBe(true);
    expect(s3.ok && coverage(ep, s3.state).covered).toBe(1);
  });
  it('Ep1 keeps the engineering-codes topic inside the first four (never behind the fold)', () => {
    expect(EP1.topics.slice(0, 4).map((t) => t.id)).toContain('maint_code');
  });
  it('leads.openLater counts statements that will open later', () => {
    const l = leads(ep, newRun('mini', 'hall', 'hall'));
    expect(l.openLater).toBe(1);   // s_bo_wrench opens at 30
  });
});
