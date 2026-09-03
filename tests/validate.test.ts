// tests/validate.test.ts
import { describe, it, expect } from 'vitest';
import { validateCase } from '../src/kernel/validate';
import { MINI_CASE } from './fixtures/mini-case';
describe('validateCase', () => {
  it('reports the mini fixture\'s known shortfalls by rule name (it is a test fixture, not a real case)', () => {
    const v = validateCase(MINI_CASE);
    expect(v.problems.some((p) => p.startsWith('R2'))).toBe(true);   // only one liar
    // R7 (deviation from plan's test, see commit message): with the plan's exact formula,
    // 4 statements*5 + 3 evidence*5 + 3 places*10*2 + 2 people*20 + 30*3 = 225 >= 120*1.6 = 192,
    // so R7 does NOT fire here — the flat search_records*3 term already clears the 1.6x bar
    // for a fixture this small. Asserting the true (negative) outcome instead of the plan's
    // (incorrect) expectation that it fires.
    expect(v.problems.some((p) => p.startsWith('R7'))).toBe(false);
  });
  it('R1: the truth must be provable — culprit/method/evidence ids exist and decisive evidence is gated (R3)', () => {
    const bad = { ...MINI_CASE, evidence: MINI_CASE.evidence.map((e) => (e.id === 'e_print' ? { ...e, requiresCard: undefined } : e)) };
    expect(validateCase(bad).problems.some((p) => p.startsWith('R3'))).toBe(true);
  });
  it('R4: something must depend on the clock', () => {
    const bad = { ...MINI_CASE, statements: MINI_CASE.statements.map((s) => ({ ...s, availableFrom: undefined })), evidence: MINI_CASE.evidence.map((e) => ({ ...e, availableTo: undefined })), presence: MINI_CASE.presence.map((p) => ({ ...p, from: 0, to: 999 })) };
    expect(validateCase(bad).problems.some((p) => p.startsWith('R4'))).toBe(true);
  });
  it('R5: at least one record must be a proving-set member', () => {
    const bad = { ...MINI_CASE, propositions: MINI_CASE.propositions.map((p) => ({ ...p, provedBy: p.provedBy.map((set) => set.filter((id) => !id.startsWith('r_'))), refutedBy: p.refutedBy.filter((id) => !id.startsWith('r_')) })) };
    expect(validateCase(bad).problems.some((p) => p.startsWith('R5'))).toBe(true);
  });
  it('R6: the loudest liar must not be the culprit', () => {
    const v = validateCase(MINI_CASE); expect(v.problems.some((p) => p.startsWith('R6'))).toBe(true);   // ada is the only liar AND the culprit
  });
  it('references: every id used must exist', () => {
    const bad = { ...MINI_CASE, truth: { ...MINI_CASE.truth, decisiveEvidenceId: 'ghost' } };
    expect(validateCase(bad).problems.some((p) => p.startsWith('REF'))).toBe(true);
  });
});
