import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { SceneStage } from '../src/ui/SceneStage';
import { useGame, registerEpisode } from '../src/state/store';
import { setLang } from '../src/i18n/lang';
import { MANY_TOPICS } from './fixtures/many-topics';
const chips = (container: HTMLElement) => [...container.querySelectorAll('.chip.topic')].map((c) => c.textContent);
describe('talk rail folds long topic lists', () => {
  beforeEach(() => { setLang('en'); registerEpisode(MANY_TOPICS); useGame.getState().startEpisode('many'); useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' }); });
  it('shows the first four topics in authored order behind a "+N more" chip, then expands', () => {
    const { container } = render(createElement(SceneStage));
    fireEvent.click(screen.getByRole('button', { name: /Bo/ }));
    expect(chips(container)).toEqual(['Topic 1 night', 'Topic 2 wrench', 'Topic 3 stove', 'Topic 4 watch']);
    const more = screen.getByRole('button', { name: '+3 more' });
    fireEvent.click(more);
    expect(chips(container)).toEqual(['Topic 1 night', 'Topic 2 wrench', 'Topic 3 stove', 'Topic 4 watch', 'Topic 5 manifest', 'Topic 6 debt', 'Topic 7 rumour']);
    fireEvent.click(screen.getByRole('button', { name: 'Fewer' }));
    expect(chips(container)).toHaveLength(4);
  });
  it('a short list gets no fold chip', () => {
    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'hall' });
    registerEpisode({ ...MANY_TOPICS, id: 'few', topics: MANY_TOPICS.topics.slice(0, 3), statements: MANY_TOPICS.statements.slice(0, 3) });
    useGame.getState().startEpisode('few'); useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' });
    const { container } = render(createElement(SceneStage));
    fireEvent.click(screen.getByRole('button', { name: /Bo/ }));
    expect(chips(container)).toHaveLength(3);
    expect(container.querySelector('.chip.more')).toBeNull();
  });
  it('the tutorial goal topic is never behind the fold', () => {
    const tutored = { ...MANY_TOPICS, id: 'tut', tutorial: [{ id: 'w', when: { kind: 'start' as const }, say: { en: 'Welcome.', ko: '' } }, { id: 'g', when: { kind: 'card' as const, cardId: 's_bo_debt' }, say: { en: 'Ask about the debt.', ko: '' } }] };
    registerEpisode(tutored); useGame.getState().startEpisode('tut'); useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' });
    const { container } = render(createElement(SceneStage));
    fireEvent.click(screen.getByRole('button', { name: /Bo/ }));
    // 'debt' is authored sixth; it takes the fourth slot and the first three keep their order
    expect(chips(container)).toEqual(['Topic 1 night', 'Topic 2 wrench', 'Topic 3 stove', 'Topic 6 debt']);
    expect(container.querySelector('.chip.topic.goal')!.textContent).toBe('Topic 6 debt');
    expect(screen.getByRole('button', { name: '+3 more' })).toBeTruthy();
  });
  it('a topic chip opens the dialogue view, not the old .look box', () => {
    const { container } = render(createElement(SceneStage));
    fireEvent.click(screen.getByRole('button', { name: /Bo/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Topic 2 wrench' }));
    const dlg = screen.getByRole('dialog', { name: 'Bo' });
    expect(dlg.textContent).toContain('Topic 2 wrench');
    expect(container.querySelector('.look')).toBeNull();
  });
});
