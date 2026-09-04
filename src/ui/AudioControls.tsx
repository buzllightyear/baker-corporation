import { useLang, T } from '../i18n/lang';
import React from 'react';
import { getSettings, setMuted, setVolume, unlock } from '../audio/engine';
import { playSfx } from '../audio/sfx';
import './audio-controls.css';

/** Mute toggle + master volume, living in the topbar's right-hand group.
 *  Both write straight through to localStorage, so the setting survives a
 *  reload even on a page that never managed to build an AudioContext. */
export function AudioControls() {
  const [s, setS] = React.useState(() => getSettings()); const lang = useLang((x) => x.lang);
  const apply = () => setS(getSettings());
  return (
    <span className="audio-ctl">
      <button
        className={'audio-mute' + (s.muted ? '' : ' on')}
        aria-label={s.muted ? 'unmute' : 'mute'}
        aria-pressed={s.muted}
        title={s.muted ? T.soundOff[lang] : T.soundOn[lang]}
        onClick={() => { unlock(); setMuted(!s.muted); apply(); if (s.muted) playSfx('chip'); }}
      ><span className={'snd' + (s.muted ? ' off' : '')}>♪</span></button>
      <input
        className="audio-vol"
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(s.volume * 100)}
        aria-label="volume"
        title={T.volume[lang]}
        onChange={(e) => { unlock(); setVolume(Number(e.currentTarget.value) / 100); apply(); }}
        onMouseUp={() => playSfx('chip')}
      />
    </span>
  );
}
