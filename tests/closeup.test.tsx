import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { SceneStage } from '../src/ui/SceneStage';
import { useGame, registerEpisode } from '../src/state/store';
import { setLang } from '../src/i18n/lang';
import { MINI_CASE } from './fixtures/mini-case';
describe('evidence close-up', () => {
  beforeEach(() => { setLang('en'); registerEpisode(MINI_CASE); useGame.getState().startEpisode('mini'); useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' }); });
  const openHook = () => { const { container } = render(createElement(SceneStage)); fireEvent.click(screen.getByRole('button', { name: /Empty hook/ })); return container; };
  it('clicking evidence opens the close-up with the card body and zooms the art into the hotspot', () => {
    const container = openHook();
    const panel = screen.getByRole('dialog', { name: 'Empty hook' });
    expect(panel.textContent).toContain('A hook by the stove. Empty.');
    expect(container.querySelector('.stage')!.className).toContain('closeup-on');
    expect(screen.queryByText('Ask Watson')).not.toBeNull();
  });
  it('Back closes the panel and restores the stage', () => {
    const container = openHook();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.queryByRole('dialog', { name: 'Empty hook' })).toBeNull();
    expect(container.querySelector('.stage')!.className).not.toContain('closeup-on');
  });
  it('Escape also closes it', () => {
    openHook();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Empty hook' })).toBeNull();
  });
  it('the old .look text box is gone — evidence no longer answers with a plain card', () => {
    const container = openHook();
    expect(container.querySelector('.look')).toBeNull();
  });
  it('Pin note attaches the note to the card the examine produced', () => {
    openHook();
    fireEvent.click(screen.getByRole('button', { name: 'Pin note' }));
    fireEvent.change(screen.getByLabelText('Pin note'), { target: { value: 'hook is clean' } });
    fireEvent.submit(screen.getByLabelText('Pin note').closest('form')!);
    expect(useGame.getState().state!.pins).toEqual([{ cardId: 'e_hook', note: 'hook is clean', at: 5 }]);
  });
});
