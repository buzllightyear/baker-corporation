import { describe, it, expect, beforeEach } from 'vitest';
import { useGame, registerEpisode } from '../src/state/store';
import { MINI_CASE } from './fixtures/mini-case';
describe('store', () => {
  beforeEach(() => { localStorage.clear(); registerEpisode(MINI_CASE); useGame.getState().startEpisode('mini'); });
  it('dispatch applies kernel results and logs errors without changing state', () => {
    const st = useGame.getState();
    const ok = st.dispatch('holmes', { kind: 'move', placeId: 'galley' }); expect(ok.ok).toBe(true); expect(useGame.getState().state!.pos.holmes).toBe('galley');
    const bad = useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'engine' }); expect(bad.ok).toBe(false);
    expect(useGame.getState().state!.pos.holmes).toBe('galley'); expect(useGame.getState().activity.at(-1)!.ok).toBe(false);
  });
  it('persists and hydrates the run', () => {
    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' });
    useGame.setState({ state: null }); useGame.getState().hydrate();
    expect(useGame.getState().state!.pos.holmes).toBe('galley');
  });
  it('startEpisode resets the run', () => { useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' }); useGame.getState().startEpisode('mini'); expect(useGame.getState().state!.clock).toBe(0); });
  it('watsonBusy holds for a minimum window', async () => {
    useGame.getState().setWatsonBusy('moving'); expect(useGame.getState().watsonBusy).toBe('moving');
    await new Promise((r) => setTimeout(r, 1300)); expect(useGame.getState().watsonBusy).toBe(null);
  });
});
