// tests/content-ep0.test.ts
import { describe, it, expect } from 'vitest';
import { EP0 } from '../content/ep0-titan';
import { validateCase } from '../src/kernel/validate';
import { invoke } from '../src/kernel/kernel';
import { newRun } from '../src/kernel/model';
describe('Episode 0', () => {
  it('passes the authoring rules except R7 (tutorial is meant to be short) and R2 (three people, two liars allowed)', () => {
    const v = validateCase(EP0); const hard = v.problems.filter((p) => !p.startsWith('R7') && !p.startsWith('R2 only'));
    expect(hard).toEqual([]);
  });
  it('has every text in both languages, non-empty', () => {
    const texts: { en: string; ko: string }[] = [];
    const walk = (v: unknown) => { if (v && typeof v === 'object') { if ('en' in (v as object) && 'ko' in (v as object)) texts.push(v as any); else Object.values(v as object).forEach(walk); } };
    walk({ ...EP0, clockLabel: undefined });
    expect(texts.length).toBeGreaterThan(20); for (const t of texts) { expect(t.en.trim()).not.toBe(''); expect(t.ko.trim()).not.toBe(''); }
  });
  it('is solvable along the golden path within budget', () => {
    let s = newRun(EP0.id, EP0.startPlaceId, EP0.watsonStartPlaceId);
    const step = (actor: 'holmes' | 'watson', cmd: any) => { const r = invoke(EP0, s, actor, cmd); if (!r.ok) throw new Error(`${cmd.kind}: ${r.code} ${r.message}`); s = r.state; return r.result as any; };
    for (const [actor, cmd] of EP0_GOLDEN) step(actor as any, cmd);
    expect(s.clock).toBeLessThan(EP0.budgetMinutes);
    const r = invoke(EP0, s, 'holmes', { kind: 'accuse', who: EP0.truth.culpritId, how: EP0.truth.methodId, evidence: EP0.truth.decisiveEvidenceId });
    expect(r.ok && r.state.verdict).toBe('solved');
    expect(s.cards.some((c) => c.id === EP0.truth.decisiveEvidenceId && c.body.en.length > 40)).toBe(true);   // the decisive card was unlocked
  });
  it('tutorial steps cover every verb once', () => {
    const kinds = EP0.tutorial!.map((t) => t.when.kind); expect(kinds[0]).toBe('start'); expect(kinds).toContain('theory'); expect(kinds).toContain('accused'); expect(EP0.tutorial!.length).toBeGreaterThanOrEqual(8);
  });
});
import { EP0_GOLDEN } from '../content/ep0-titan';
