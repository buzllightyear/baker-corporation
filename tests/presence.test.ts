import { describe, it, expect, beforeEach } from 'vitest';
import { crewMoves, placeAt } from '../src/kernel/presence';
import { useGame, registerEpisode } from '../src/state/store';
import { setLang } from '../src/i18n/lang';
import { MINI_CASE } from './fixtures/mini-case';

describe('crewMoves', () => {
  it('reads the manifest at a clock', () => {
    expect(placeAt(MINI_CASE, 'ada', 0)).toBe('engine');
    expect(placeAt(MINI_CASE, 'ada', 60)).toBe('galley');
    expect(placeAt(MINI_CASE, 'ada', 5000)).toBeNull();
  });
  it('lists only the people whose room changed between two clocks', () => {
    expect(crewMoves(MINI_CASE, 0, 30)).toEqual([]);
    expect(crewMoves(MINI_CASE, 30, 60)).toEqual([{ personId: 'ada', from: 'engine', to: 'galley' }]);
    expect(crewMoves(MINI_CASE, 60, 60)).toEqual([]);
  });
});

describe('store announces crew moves on the ticker', () => {
  beforeEach(() => { setLang('en'); registerEpisode(MINI_CASE); useGame.getState().startEpisode('mini'); });
  it('pushes a line when the clock crosses a manifest boundary', () => {
    const g = useGame.getState();
    g.dispatch('watson', { kind: 'search_records', query: 'wrench' });   // clock 30
    expect(g.ticker.filter((l) => l.text.includes('Ada'))).toHaveLength(0);
    useGame.getState().dispatch('watson', { kind: 'search_records', query: 'wrench' });   // clock 60 → ada moves
    const last = useGame.getState().ticker.at(-1)!;
    expect(last.text).toBe('◆ Ada: Engine → Galley');
    expect(last.placeId).toBe('galley');
    expect(last.targetId).toBe('ada');
  });
  it('says it in Korean when the UI is Korean', () => {
    setLang('ko');
    useGame.getState().dispatch('watson', { kind: 'search_records', query: 'wrench' });
    useGame.getState().dispatch('watson', { kind: 'search_records', query: 'wrench' });
    expect(useGame.getState().ticker.at(-1)!.text).toBe('◆ Ada: Engine → Galley'.replace('Ada', pickKo('ada')).replace('Engine', pickKo('engine')).replace('Galley', pickKo('galley')));
  });
});
function pickKo(id: string): string {
  const p = MINI_CASE.people.find((x) => x.id === id); if (p) return p.name.ko;
  return MINI_CASE.places.find((x) => x.id === id)!.name.ko;
}
