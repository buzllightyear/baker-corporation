import React from 'react';
import { useGame } from '../state/store';
import { useLang } from '../i18n/lang';
import type { Cmd, KernelResult } from '../kernel/model';
import { allowed, guide, hint, tutorialDone } from './tutorial';
/** dispatch for human clicks: while a tutorial episode is in progress, only the current step's action goes through. */
export function useGuard(): (cmd: Cmd) => KernelResult {
  const dispatch = useGame((s) => s.dispatch); const lang = useLang((s) => s.lang);
  return React.useCallback((cmd: Cmd) => {
    const { episode, state, watsonReads } = useGame.getState();
    if (episode && state && episode.tutorial && !tutorialDone()) {
      const g = guide(episode, state, watsonReads);
      if (g && !g.complete && !allowed(episode, state, g.goal, cmd)) return { ok: false, code: 'INVALID_ARGS', message: hint(episode, state, g.goal, lang) };
    }
    return dispatch('holmes', cmd);
  }, [dispatch, lang]);
}
