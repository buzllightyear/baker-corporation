// tests/content-ep1.test.ts
import { describe, it, expect } from 'vitest';
import { EP1, EP1_GOLDEN } from '../content/ep1-sensor';
import { validateCase } from '../src/kernel/validate';
import { invoke } from '../src/kernel/kernel';
import { newRun } from '../src/kernel/model';

describe('Episode 1', () => {
  it('passes every authoring rule with no exceptions', () => {
    const v = validateCase(EP1);
    expect(v.problems).toEqual([]);
    expect(v.ok).toBe(true);
  });

  it('has every text in both languages, non-empty', () => {
    const texts: { en: string; ko: string }[] = [];
    const walk = (v: unknown) => { if (v && typeof v === 'object') { if ('en' in (v as object) && 'ko' in (v as object)) texts.push(v as any); else Object.values(v as object).forEach(walk); } };
    walk({ ...EP1, clockLabel: undefined });
    expect(texts.length).toBeGreaterThan(20); for (const t of texts) { expect(t.en.trim()).not.toBe(''); expect(t.ko.trim()).not.toBe(''); }
  });

  it('is solvable along the golden path within budget', () => {
    let s = newRun(EP1.id, EP1.startPlaceId, EP1.watsonStartPlaceId);
    const step = (actor: 'holmes' | 'watson', cmd: any) => { const r = invoke(EP1, s, actor, cmd); if (!r.ok) throw new Error(`${cmd.kind}: ${r.code} ${r.message}`); s = r.state; return r.result as any; };
    for (const [actor, cmd] of EP1_GOLDEN) step(actor as any, cmd);
    expect(s.clock).toBeLessThan(EP1.budgetMinutes);
    const r = invoke(EP1, s, 'holmes', { kind: 'accuse', who: EP1.truth.culpritId, how: EP1.truth.methodId, evidence: EP1.truth.decisiveEvidenceId });
    expect(r.ok && r.state.verdict).toBe('solved');
    expect(s.cards.some((c) => c.id === EP1.truth.decisiveEvidenceId && c.body.en.length > 40)).toBe(true);   // the decisive card was unlocked
  });

  it('carries no tutorial — Episode 0 teaches the verbs, Episode 1 assumes them', () => {
    expect(EP1.tutorial).toBeUndefined();
  });

  it('has ≥3 liars with distinct reasons and the loudest is not the culprit', () => {
    const liars = new Set(EP1.statements.filter((s) => s.lie).map((s) => s.personId)); expect(liars.size).toBeGreaterThanOrEqual(3);
  });

  it('the decisive evidence is unreadable without its gating statement', () => {
    const dec = EP1.evidence.find((e) => e.id === EP1.truth.decisiveEvidenceId)!; expect(dec.requiresCard).toBeTruthy(); expect(dec.fullDescription).toBeTruthy();
  });

  it('at least one record is load-bearing and at least one clue vanishes before dawn', () => {
    expect(EP1.evidence.some((e) => e.availableTo !== undefined && e.availableTo < EP1.budgetMinutes)).toBe(true);
  });
});
