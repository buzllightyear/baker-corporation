// tests/theory.test.ts
import { describe, it, expect } from 'vitest';
import { runTheory, matchProposition } from '../src/kernel/theory';
import { newRun } from '../src/kernel/model';
import { MINI_CASE as ep } from './fixtures/mini-case';
const withCards = (...ids: string[]) => ({ ...newRun('mini', 'hall', 'hall'), cards: ids.map((id) => ({ id, kind: 'statement' as const, title: { en: '', ko: '' }, body: { en: '', ko: '' }, foundBy: 'holmes' as const, foundAt: 0 })) });
describe('submit_theory', () => {
  it('proven when the cited cards cover one proving set AND are on the board', () => {
    const r = runTheory(ep, withCards('s_bo_night'), { kind: 'submit_theory', claims: [{ claim: 'p_ada_left', evidence_ids: ['s_bo_night'] }] });
    expect(r.ok && (r.result as any).verdicts[0].status).toBe('proven');
  });
  it('unsupported when a set is only partly covered, counting (not naming) what is still to find', () => {
    const r = runTheory(ep, withCards('e_print'), { kind: 'submit_theory', claims: [{ claim: 'p_ada_took', evidence_ids: ['e_print'] }] });
    expect(r.ok && (r.result as any).verdicts[0]).toMatchObject({ status: 'unsupported', missing: [], stillToFind: 1 });   // s_bo_wrench is not held → counted, never named
  });
  it('contradicted when a cited card refutes the proposition', () => {
    const r = runTheory(ep, withCards('r_manifest'), { kind: 'submit_theory', claims: [{ claim: 'p_bo_took', evidence_ids: ['r_manifest'] }] });
    expect(r.ok && (r.result as any).verdicts[0].status).toBe('contradicted');
  });
  it('cards not on the board do not count even if cited', () => {
    const r = runTheory(ep, withCards(), { kind: 'submit_theory', claims: [{ claim: 'p_ada_left', evidence_ids: ['s_bo_night'] }] });
    expect(r.ok && (r.result as any).verdicts[0].status).toBe('unsupported');
  });
  it('matches free text to a proposition, and reports unmatched otherwise', () => {
    expect(matchProposition(ep, 'Ada left the engine room early')!.id).toBe('p_ada_left');
    const r = runTheory(ep, withCards(), { kind: 'submit_theory', claims: [{ claim: 'The moon is cheese', evidence_ids: [] }] });
    expect(r.ok && (r.result as any).verdicts[0].status).toBe('unmatched');
  });
  it('never returns the truth or provedBy', () => {
    const r = runTheory(ep, withCards(), { kind: 'submit_theory', claims: [{ claim: 'p_ada_took', evidence_ids: [] }] });
    expect(JSON.stringify(r)).not.toMatch(/provedBy|culpritId|"lie"/);
  });
});
