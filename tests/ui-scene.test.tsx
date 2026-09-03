import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { SceneStage } from '../src/ui/SceneStage';
import { MiniMap } from '../src/ui/MiniMap';
import { NotebookPanel } from '../src/ui/NotebookPanel';
import { useGame, registerEpisode } from '../src/state/store';
import { setLang } from '../src/i18n/lang';
import { MINI_CASE } from './fixtures/mini-case';
describe('click path', () => {
  beforeEach(() => { setLang('en'); registerEpisode(MINI_CASE); useGame.getState().startEpisode('mini'); });
  it('map click walks the shortest route for free', () => {
    render(createElement(MiniMap));
    fireEvent.click(screen.getByRole('button', { name: 'Galley' })); expect(useGame.getState().state!.pos.holmes).toBe('galley'); expect(useGame.getState().state!.clock).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Engine' })); expect(useGame.getState().state!.pos.holmes).toBe('engine'); expect(useGame.getState().state!.clock).toBe(0);   // galley → hall → engine
  });
  it('scene shows people with topic chips; chip click adds a card that the notebook renders', () => {
    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' });
    render(createElement('div', null, createElement(SceneStage), createElement(NotebookPanel)));
    fireEvent.click(screen.getByRole('button', { name: /Bo/ }));
    fireEvent.click(screen.getByRole('button', { name: /Last night/ }));
    expect(screen.getAllByText('Ada came to the galley after the first hour.').length).toBeGreaterThan(0);
  });
  it('evidence click examines and the card appears', () => {
    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' });
    render(createElement('div', null, createElement(SceneStage), createElement(NotebookPanel)));
    fireEvent.click(screen.getByRole('button', { name: /Empty hook/ })); expect(screen.getAllByText('A hook by the stove. Empty.').length).toBeGreaterThan(0);
  });
});
