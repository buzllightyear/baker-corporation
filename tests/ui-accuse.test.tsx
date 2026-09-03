import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { AccuseDialog } from '../src/ui/AccuseDialog';
import { VerdictView } from '../src/ui/VerdictView';
import { TutorialChips } from '../src/ui/TutorialChips';
import { useGame, registerEpisode } from '../src/state/store';
import { setLang } from '../src/i18n/lang';
import { MINI_CASE } from './fixtures/mini-case';
describe('accuse dialog', () => {
  beforeEach(() => { setLang('en'); registerEpisode({ ...MINI_CASE, tutorial: [{ id: 't0', when: { kind: 'start' }, say: { en: 'Greet Watson.', ko: '왓슨에게 인사.' }, chip: { en: 'Watson, read the case.', ko: '왓슨, 사건 읽어줘.' } }] }); useGame.getState().startEpisode('mini'); });
  it('three selects, wrong slots reported, second miss ends the case', () => {
    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' }); useGame.getState().dispatch('holmes', { kind: 'examine', evidenceId: 'e_print' });
    render(createElement('div', null, createElement(AccuseDialog, { open: true, onClose: () => {} }), createElement(VerdictView)));
    fireEvent.change(screen.getByLabelText('Who'), { target: { value: 'ada' } });
    fireEvent.change(screen.getByLabelText('How'), { target: { value: 'm_sold' } });
    fireEvent.change(screen.getByLabelText('Decisive evidence'), { target: { value: 'e_print' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText(/Wrong:/).textContent).toMatch(/How/); expect(useGame.getState().state!.accusationsLeft).toBe(1);
  });
  it('solving shows the reveal', () => {
    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' }); useGame.getState().dispatch('holmes', { kind: 'examine', evidenceId: 'e_print' });
    render(createElement('div', null, createElement(AccuseDialog, { open: true, onClose: () => {} }), createElement(VerdictView)));
    fireEvent.change(screen.getByLabelText('Who'), { target: { value: 'ada' } }); fireEvent.change(screen.getByLabelText('How'), { target: { value: 'm_took' } }); fireEvent.change(screen.getByLabelText('Decisive evidence'), { target: { value: 'e_print' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Ada took it.')).toBeTruthy();
  });
  it('tutorial chip copies its sentence in the current language', async () => {
    const written: string[] = []; Object.assign(navigator, { clipboard: { writeText: async (t: string) => { written.push(t); } } });
    render(createElement(TutorialChips)); fireEvent.click(screen.getByRole('button', { name: /Watson, read the case/ }));
    await Promise.resolve(); expect(written).toEqual(['Watson, read the case.']);
  });
});
