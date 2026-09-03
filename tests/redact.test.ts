import { describe, it, expect } from 'vitest';
import { cardFromStatement, cardFromEvidence, cardFromRecord } from '../src/kernel/redact';
import { MINI_CASE } from './fixtures/mini-case';
describe('redact', () => {
  it('never leaks lie/refutedBy/fullDescription gating', () => {
    const st = MINI_CASE.statements.find((x) => x.id === 's_ada_wrench')!;
    const c = cardFromStatement(st, MINI_CASE, 'holmes', 5) as unknown as Record<string, unknown>;
    expect('lie' in c).toBe(false); expect('refutedBy' in c).toBe(false); expect(c.kind).toBe('statement');
    const ev = MINI_CASE.evidence.find((x) => x.id === 'e_print')!;
    expect(cardFromEvidence(ev, MINI_CASE, 'holmes', 5, false).body.en).toBe('A greasy handprint.');
    expect(cardFromEvidence(ev, MINI_CASE, 'holmes', 5, true).body.en).toContain('engine grease');
    expect(cardFromRecord(MINI_CASE.records[0], 'watson', 9).foundBy).toBe('watson');
  });
});
