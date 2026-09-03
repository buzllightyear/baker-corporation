import { describe, it, expect, beforeEach } from 'vitest';
import { watsonTools } from '../src/webmcp/tools';
import { useGame, registerEpisode } from '../src/state/store';
import { MINI_CASE } from './fixtures/mini-case';
import type { Cmd } from '../src/kernel/model';
const deps = () => ({ getState: () => useGame.getState().state!, getEpisode: () => useGame.getState().episode!, dispatch: (c: Cmd) => useGame.getState().dispatch('watson', c), setBusy: (_: string | null) => {}, lang: () => 'en' as const });
describe('watson tools', () => {
  beforeEach(() => { registerEpisode(MINI_CASE); useGame.getState().startEpisode('mini'); });
  it('registers exactly ten tools and never accuse', () => {
    const names = watsonTools(deps()).map((t) => t.name).sort();
    expect(names).toEqual(['ask', 'cross_check', 'examine', 'get_case', 'move', 'pin', 'search_records', 'submit_theory', 'talk', 'timeline']);
  });
  it('get_case returns the board, clock, positions, accusations left, and the voice rules, but no truth', async () => {
    const t = watsonTools(deps()).find((x) => x.name === 'get_case')!;
    const r = (await t.execute({})) as Record<string, unknown>;
    expect(r.ok).toBe(true); expect(r.accusationsLeft).toBe(2); expect(String(r.voice)).toMatch(/record/i); expect(JSON.stringify(r)).not.toMatch(/culpritId|"lie":|provedBy|decisiveEvidenceId/);
  });
  it('move accepts a JSON string (legacy host) and reports errors as ok:false with a code', async () => {
    const t = watsonTools(deps()).find((x) => x.name === 'move')!;
    const r = (await t.execute(JSON.stringify({ place_id: 'galley' }))) as Record<string, unknown>; expect(r.ok).toBe(true); expect(useGame.getState().state!.pos.watson).toBe('galley');
    const far = (await t.execute({ place_id: 'engine' })) as Record<string, unknown>; expect(far.ok).toBe(true); expect(far.route).toEqual(['hall', 'engine']); expect(useGame.getState().state!.clock).toBe(30);
    const bad = (await t.execute({ place_id: 'nowhere' })) as Record<string, unknown>; expect(bad.ok).toBe(false); expect(bad.code).toBe('UNKNOWN_ID');
  });
  it('every tool result is language-projected: card bodies are strings, not {en,ko}', async () => {
    const tools = watsonTools(deps()); const move = tools.find((x) => x.name === 'move')!; await move.execute({ place_id: 'galley' });
    const talk = tools.find((x) => x.name === 'talk')!; const r = (await talk.execute({ person_id: 'bo', topic_id: 'night' })) as { card: { body: unknown } };
    expect(typeof r.card.body).toBe('string'); expect(r.card.body).toBe('Ada came to the galley after the first hour.');
  });
});
