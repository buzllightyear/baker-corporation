import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import type { Episode } from '../content/types';
import { Intro, introKey, introSeen } from '../src/ui/Intro';
import { registerEpisode } from '../src/state/store';
import { setLang } from '../src/i18n/lang';
import { MINI_CASE } from './fixtures/mini-case';

const t = (en: string, ko = en) => ({ en, ko });

// A local copy of the fixture: `intro` and `blurb` live here, not in the shared fixture file.
const CASE: Episode = {
  ...MINI_CASE,
  id: 'mini-intro',
  people: MINI_CASE.people.map((p) => ({ ...p, blurb: t(`${p.name.en} keeps to the ${p.role.en.toLowerCase()} shift.`) })),
  intro: {
    cards: [
      { title: t('The ship'), body: t('A freighter, two hours from dock.'), image: '/art/rooms/corridor_a.jpg' },
      { title: t('The crew'), body: t('Two aboard on this watch.'), showCrew: true },
      { title: t('Your posting'), body: t('You are the investigator Baker Corp sent. Watson is the service unit they issued you.') },
    ],
  },
};

const next = () => fireEvent.click(screen.getByRole('button', { name: /Next/ }));

describe('cold open', () => {
  beforeEach(() => { setLang('en'); registerEpisode(CASE); });

  it('opens on the title card and steps through the cold-open cards', () => {
    render(createElement(Intro, { episode: CASE, onClose: () => {} }));
    expect(screen.getByRole('heading', { name: 'Mini' })).toBeTruthy();       // card 0 — episode title, large
    expect(screen.getByText('Test')).toBeTruthy();                            // series name
    expect(screen.queryByText('The ship')).toBeNull();

    next();
    expect(screen.getByText('A freighter, two hours from dock.')).toBeTruthy();
    next(); next();
    expect(screen.getByText('You are the investigator Baker Corp sent. Watson is the service unit they issued you.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Next/ })).toBeNull();        // last card offers Start instead
    expect(screen.getByRole('button', { name: 'Start' })).toBeTruthy();
  });

  it('the crew card lists every person with role and blurb', () => {
    render(createElement(Intro, { episode: CASE, onClose: () => {} }));
    next(); next();
    expect(screen.getByText('Crew manifest')).toBeTruthy();
    for (const p of CASE.people) {
      expect(screen.getByText(p.name.en)).toBeTruthy();
      expect(screen.getByText(p.role.en)).toBeTruthy();
      expect(screen.getByText(p.blurb!.en)).toBeTruthy();
    }
  });

  it('Skip sets the per-episode localStorage flag and closes', () => {
    const onClose = vi.fn();
    render(createElement(Intro, { episode: CASE, onClose }));
    expect(introSeen(CASE.id)).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /Skip/ }));
    expect(localStorage.getItem(introKey(CASE.id))).toBe('1');
    expect(introSeen(CASE.id)).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Start also marks it seen; Escape skips; ArrowRight advances', () => {
    const onClose = vi.fn();
    const { unmount } = render(createElement(Intro, { episode: CASE, onClose }));
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('A freighter, two hours from dock.')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(introSeen(CASE.id)).toBe(true);
    unmount();

    localStorage.removeItem(introKey(CASE.id));
    render(createElement(Intro, { episode: CASE, onClose: () => {} }));
    next(); next(); next();
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(introSeen(CASE.id)).toBe(true);
  });

  it('an episode with no intro still shows the title card and a Start button', () => {
    render(createElement(Intro, { episode: MINI_CASE, onClose: () => {} }));
    expect(screen.getByRole('heading', { name: 'Mini' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start' })).toBeTruthy();
  });
});
