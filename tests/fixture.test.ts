import { describe, it, expect } from 'vitest';
import { MINI_CASE } from './fixtures/mini-case';
describe('fixture', () => {
  it('references only existing ids', () => {
    const ids = new Set([...MINI_CASE.places, ...MINI_CASE.people, ...MINI_CASE.statements, ...MINI_CASE.evidence, ...MINI_CASE.records].map((x) => x.id));
    for (const p of MINI_CASE.propositions) { for (const set of p.provedBy) for (const id of set) expect(ids.has(id)).toBe(true); for (const id of p.refutedBy) expect(ids.has(id)).toBe(true); }
    expect(ids.has(MINI_CASE.truth.decisiveEvidenceId)).toBe(true);
  });
});
