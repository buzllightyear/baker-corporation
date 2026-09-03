import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import type { Episode } from '../content/types';
import { Dossier, lastSeenPlace } from '../src/ui/Dossier';
import { useGame, registerEpisode } from '../src/state/store';
import { setLang } from '../src/i18n/lang';
import { MINI_CASE } from './fixtures/mini-case';

const t = (en: string, ko = en) => ({ en, ko });

// Local copy so the shared fixture stays untouched.
const CASE: Episode = {
  ...MINI_CASE,
  id: 'mini-dossier',
  people: MINI_CASE.people.map((p) => ({ ...p, blurb: t(`${p.name.en} works the ${p.role.en.toLowerCase()} shift.`) })),
};

describe('crew dossier', () => {
  beforeEach(() => { setLang('en'); registerEpisode(CASE); useGame.getState().startEpisode('mini-dossier'); });

  it('lists every person with role, blurb and where the manifest last puts them', () => {
    render(createElement(Dossier, { onClose: () => {} }));
    for (const p of CASE.people) {
      expect(screen.getByText(p.name.en)).toBeTruthy();
      expect(screen.getByText(p.role.en)).toBeTruthy();
      expect(screen.getByText(p.blurb!.en)).toBeTruthy();
    }
    expect(screen.getByText('last seen: Engine')).toBeTruthy();   // Ada, clock 0
    expect(screen.getByText('last seen: Galley')).toBeTruthy();   // Bo
  });

  it('shows 0 statements before a talk and 1 after, and lists the card when the person is opened', () => {
    const { rerender } = render(createElement(Dossier, { onClose: () => {} }));
    expect(screen.getAllByText('0 statements on the notebook').length).toBe(2);

    useGame.getState().dispatch('holmes', { kind: 'move', placeId: 'galley' });
    useGame.getState().dispatch('holmes', { kind: 'talk', personId: 'bo', topicId: 'night' });
    rerender(createElement(Dossier, { onClose: () => {} }));

    expect(screen.getByText('1 statements on the notebook')).toBeTruthy();
    expect(screen.queryByText('Ada came to the galley after the first hour.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Bo/ }));
    expect(screen.getByText('Ada came to the galley after the first hour.')).toBeTruthy();
  });

  it('lastSeenPlace falls back to the most recent room once the person has moved on', () => {
    expect(lastSeenPlace(CASE, 0, 'ada')!.id).toBe('engine');
    expect(lastSeenPlace(CASE, 90, 'ada')!.id).toBe('galley');
    expect(lastSeenPlace(CASE, 0, 'nobody')).toBe(null);
  });
});
