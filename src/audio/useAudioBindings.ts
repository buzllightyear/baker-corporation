/* ==========================================================================
   THE BAKER CORPORATION — store → sound
   One subscription to the game store, and every audible consequence of a
   state change is decided here rather than sprinkled through the views.
   The views only own sounds that have no state behind them at all (hover,
   a chip press, a typewriter tick).
   ========================================================================== */

import React from 'react';
import { useGame } from '../state/store';
import type { HearingVerdict } from '../state/store';
import { guide } from '../ui/tutorial';
import { playSfx, playSequence } from './sfx';
import type { SfxName } from './sfx';
import { ambience, mapRoom } from './ambience';
import { isUnlocked, onUnlock, unlock } from './engine';

const HEARING_GAP_MS = 180;

/** Watson's walk lines are the only ticker lines shaped `▲ WATSON → room → room`. */
const isMoveLine = (text: string): boolean => text.includes('→');

const HEARING_SFX: Record<HearingVerdict['status'], SfxName | null> = {
  proven: 'hearingProven',
  unsupported: 'hearingUnsupported',
  contradicted: 'hearingContradicted',
  unmatched: null,
};

type Snap = ReturnType<typeof snapshot>;

function snapshot(s: ReturnType<typeof useGame.getState>) {
  const st = s.state;
  const ep = s.episode;
  const last = s.ticker.length ? s.ticker[s.ticker.length - 1] : null;
  let step = -1;
  try { if (ep && st) step = guide(ep, st, s.watsonReads)?.index ?? -1; } catch { step = -1; }
  return {
    place: st?.pos.holmes ?? null,
    // place cards are bookkeeping, not findings — the notebook does not count them either
    cards: st ? st.cards.filter((c) => c.kind !== 'place').length : 0,
    lastCardBy: st?.cards.length ? st.cards[st.cards.length - 1].foundBy : null,
    tickerId: last?.id ?? 0,
    tickerText: last?.text ?? '',
    hearingAt: s.lastHearing?.at ?? -1,
    hearing: s.lastHearing?.verdicts ?? null,
    accusations: st?.accusations.length ?? 0,
    verdict: st?.verdict ?? null,
    notebook: s.notebookOpen,
    step,
    running: !!st,
  };
}

/** Everything that a single store transition should make audible. */
export function reactTo(prev: Snap, next: Snap): void {
  // room change — the hatch, and the room the bed cross-fades to.
  // Arriving from nowhere (a fresh start, a hydrate) is not a walk through a door.
  if (next.place && next.place !== prev.place) {
    if (prev.place) playSfx('hatch');
    ambience.setRoom(mapRoom(next.place));
  }

  // a card landed on the notebook; if Watson brought it, he says so
  if (next.cards > prev.cards) {
    playSfx('card');
    if (next.lastCardBy === 'watson') setTimeout(() => playSfx('watson'), 90);
  }

  // Watson's ticker: a walk sounds different from a tool call
  if (next.tickerId !== prev.tickerId && next.tickerId > 0) {
    playSfx(isMoveLine(next.tickerText) ? 'watsonMove' : 'watson');
  }

  // preliminary hearing: one cue per claim, read out in order
  if (next.hearingAt !== prev.hearingAt && next.hearing) {
    const cues = next.hearing.map((v) => HEARING_SFX[v.status]).filter((n): n is SfxName => n !== null);
    if (cues.length) playSequence(cues, HEARING_GAP_MS);
  }

  if (next.accusations > prev.accusations) playSfx('stamp');

  if (next.verdict !== prev.verdict && next.verdict) {
    playSfx(next.verdict === 'solved' ? 'solved' : 'failed');
    ambience.stop(2.2);
  }

  if (next.step !== prev.step && next.step >= 0 && prev.step >= 0) playSfx('tutorial');

  if (next.notebook && !prev.notebook) playSfx('open');
}

/**
 * Called once, from App. `active` is true while an episode is on screen and
 * not yet decided — the bed runs then and only then.
 */
export function useAudioBindings(active: boolean): void {
  React.useEffect(() => {
    let prev = snapshot(useGame.getState());
    return useGame.subscribe((s) => {
      const next = snapshot(s);
      try { reactTo(prev, next); } catch { /* a sound is never worth an exception */ }
      prev = next;
    });
  }, []);

  React.useEffect(() => {
    // ?bridge=1 only: let an automated playtester read the bed's state too
    try {
      if (typeof window !== 'undefined' && /[?&]bridge=1/.test(location.search)) {
        const w = window as unknown as { __bakerAudio?: { played: string[]; amb?: () => { running: boolean; room: string } } };
        if (!w.__bakerAudio) w.__bakerAudio = { played: [] };
        w.__bakerAudio.amb = () => ({ running: ambience.isRunning(), room: ambience.currentRoom() });
      }
    } catch { /* ignore */ }
    if (!active) { ambience.stop(); return; }
    const place = useGame.getState().state?.pos.holmes ?? null;
    ambience.setRoom(mapRoom(place));
    if (isUnlocked()) { ambience.start(); return; }
    // no gesture yet: come back the moment the context is allowed to run
    unlock();
    return onUnlock(() => ambience.start());
  }, [active]);

  React.useEffect(() => () => { ambience.stop(0.3); }, []);
}
