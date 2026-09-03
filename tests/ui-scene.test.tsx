import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { ScenePanel } from '../src/ui/ScenePanel';
import { MapPanel } from '../src/ui/MapPanel';
import { NotebookPanel } from '../src/ui/NotebookPanel';
import { useGame, registerEpisode } from '../src/state/store';
import { setLang } from '../src/i18n/lang';
import { MINI_CASE } from './fixtures/mini-case';
describe('click path', () => {
  beforeEach(() => { setLang('en'); registerEpisode(MINI_CASE); useGame.getState().startEpisode('mini'); });
  it('map click moves holmes only along adjacency', () => {
    render(createElement(MapPanel));
    fireEvent.click(screen.getByRole('button', { name: 'Galley' })); expect(useGame.getState().state!.pos.holmes).toBe('galley');
    fireEvent.click(screen.getByRole('button', { name: 'Engine' })); expect(useGame.getState().state!.pos.holmes).toBe('galley');
  });
  it('scene shows people with topic chips; chip click adds a card that the notebook renders', () => {
    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' });
    render(createElement('div', null, createElement(ScenePanel), createElement(NotebookPanel)));
    fireEvent.click(screen.getByRole('button', { name: /Bo/ }));
    fireEvent.click(screen.getByRole('button', { name: /Last night/ }));
    expect(screen.getByText('Ada came to the galley after the first hour.')).toBeTruthy();
  });
  it('evidence click examines and the card appears', () => {
    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' });
    render(createElement('div', null, createElement(ScenePanel), createElement(NotebookPanel)));
    fireEvent.click(screen.getByRole('button', { name: /Empty hook/ })); expect(screen.getByText('A hook by the stove. Empty.')).toBeTruthy();
  });
});
