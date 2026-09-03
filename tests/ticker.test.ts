import { describe, it, expect, beforeEach } from 'vitest';
import { watsonTools } from '../src/webmcp/tools';
import { useGame, registerEpisode, TICKER_KEEP } from '../src/state/store';
import { setLang } from '../src/i18n/lang';
import { MINI_CASE } from './fixtures/mini-case';
import type { Cmd } from '../src/kernel/model';
const deps = () => ({
  getState: () => useGame.getState().state!, getEpisode: () => useGame.getState().episode!,
  dispatch: (c: Cmd) => useGame.getState().dispatch('watson', c), setBusy: (_: string | null) => {}, lang: () => 'en' as const,
  pushTicker: (t: { text: string; placeId?: string; targetId?: string }) => useGame.getState().pushTicker(t),
});
const tool = (name: string) => watsonTools(deps()).find((t) => t.name === name)!;
const ticker = () => useGame.getState().ticker;
describe('watson ticker', () => {
  beforeEach(() => { setLang('en'); registerEpisode(MINI_CASE); useGame.getState().startEpisode('mini'); });
  it('move pushes a line naming the route and the room it ends in', async () => {
    await tool('move').execute({ place_id: 'engine' });   // hall → engine
    const last = ticker().at(-1)!;
    expect(last.text).toBe('▲ WATSON → Engine');
    expect(last.placeId).toBe('engine');
    expect(last.at).toBeGreaterThan(0);
  });
  it('talk pushes a line naming the person and the topic, and targets the person', async () => {
    await tool('move').execute({ place_id: 'galley' });
    await tool('talk').execute({ person_id: 'bo', topic_id: 'night' });
    const last = ticker().at(-1)!;
    expect(last.text).toBe('▲ WATSON · asking Bo: Last night');
    expect(last.targetId).toBe('bo');
  });
  it('the other tools each leave one line', async () => {
    await tool('get_case').execute({});
    await tool('search_records').execute({ query: 'door log' });
    await tool('cross_check').execute({ person_id: 'ada' });
    const texts = ticker().map((l) => l.text);
    expect(texts).toContain('▲ WATSON · reading the case');
    expect(texts).toContain('▲ WATSON · searching records “door log”');
    expect(texts).toContain('▲ WATSON · cross-checking Ada');
  });
  it('keeps only the last five lines, newest last, with rising ids', async () => {
    for (const q of ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7']) await tool('search_records').execute({ query: q });
    const t = ticker();
    expect(t).toHaveLength(TICKER_KEEP);
    expect(t[0].text).toContain('a3');
    expect(t.at(-1)!.text).toContain('a7');
    expect(t.map((l) => l.id)).toEqual([...t.map((l) => l.id)].sort((a, b) => a - b));
  });
  it('a bad call still says nothing happened — no line for arguments that never parsed', async () => {
    const before = ticker().length;
    await tool('talk').execute('not json');
    expect(ticker()).toHaveLength(before);
  });
  it('tools work without the hook at all', async () => {
    const bare = watsonTools({ ...deps(), pushTicker: undefined }).find((t) => t.name === 'move')!;
    const r = (await bare.execute({ place_id: 'galley' })) as { ok: boolean };
    expect(r.ok).toBe(true); expect(ticker()).toHaveLength(0);
  });
});
