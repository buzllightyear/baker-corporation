// tests/matching.test.ts
import { describe, it, expect } from 'vitest';
import { tokenize, matchTopic, runAsk, runSearchRecords } from '../src/kernel/matching';
import { newRun } from '../src/kernel/model';
import { MINI_CASE as ep } from './fixtures/mini-case';
const at = (placeId: string, clock = 0) => ({ ...newRun('mini', 'hall', 'hall'), clock, pos: { holmes: 'hall', watson: placeId } });
describe('tokenize', () => { it('lowercases, strips punctuation, drops stopwords', () => { expect(tokenize('Where were YOU last night?')).toEqual(['where', 'last', 'night']); }); });
describe('ask', () => {
  it('maps a free question to the best topic by keyword overlap and returns that statement', () => {
    const r = runAsk(ep, at('galley', 40), 'watson', { kind: 'ask', personId: 'bo', question: 'Do you know anything about the wrench?' });
    expect(r.ok && (r.result as any).card.id).toBe('s_bo_wrench'); expect(r.ok && r.state.clock).toBe(45);
  });
  it('returns unknown:true (no card, clock still spent) when nothing matches', () => {
    const r = runAsk(ep, at('galley'), 'watson', { kind: 'ask', personId: 'bo', question: 'What is your favourite colour?' });
    expect(r.ok && (r.result as any).unknown).toBe(true); expect(r.ok && r.state.cards.length).toBe(0); expect(r.ok && r.state.clock).toBe(5);
  });
  it('is NOT_HERE when the person is elsewhere', () => { const r = runAsk(ep, at('hall'), 'watson', { kind: 'ask', personId: 'bo', question: 'wrench' }); expect(!r.ok && r.code).toBe('NOT_HERE'); });
  it('matchTopic prefers the topic with more overlapping keywords', () => { expect(matchTopic(ep, 'bo', 'where were you at night with the tool')!.id).toBe('night'); });
});
describe('search_records', () => {
  it('returns matching records as cards, costs 30, no location needed', () => {
    const r = runSearchRecords(ep, at('hall'), 'watson', { kind: 'search_records', query: 'wrench manifest' });
    expect(r.ok && r.state.cards.map((c) => c.id)).toEqual(['r_manifest']); expect(r.ok && r.state.clock).toBe(30);
  });
  it('empty result is ok with hits: []', () => { const r = runSearchRecords(ep, at('hall'), 'watson', { kind: 'search_records', query: 'zebra' }); expect(r.ok && (r.result as any).hits).toEqual([]); });
});
