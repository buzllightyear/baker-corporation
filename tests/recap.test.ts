import { describe, it, expect } from 'vitest';
import { encodeRecap, decodeRecap } from '../src/share/recap';
describe('recap share code', () => {
  it('round-trips and carries no truth fields', () => {
    const r = { episodeId: 'mini', timeLeft: 33, watsonCalls: 4, accusations: 1, verdict: 'solved' as const, visited: ['hall', 'galley'], unvisited: ['engine'], order: [{ cardId: 'e_hook', by: 'holmes' as const, at: 15 }] };
    const code = encodeRecap(r); expect(code).not.toMatch(/reveal|culprit|lie/); expect(decodeRecap(code)).toEqual(r);
  });
  it('rejects garbage', () => { expect(decodeRecap('!!!')).toBe(null); });
});
