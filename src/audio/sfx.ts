/* ==========================================================================
   THE BAKER CORPORATION — interaction SFX
   Dry, low, restrained. A corporate terminal bolted to an old freighter:
   nothing chimes prettily, nothing announces itself. Amber = you, teal = Watson.

   Every cue is ≤ 600 ms except the two verdict stingers, and everything runs
   a small share into the shared reverb send so a sound lands somewhere in a
   steel room rather than inside your head.
   ========================================================================== */

import { context, noise, osc, now } from './engine';

export type SfxName =
  | 'hatch' | 'examine' | 'card' | 'type' | 'watson' | 'watsonMove' | 'chip' | 'hover'
  | 'hearingProven' | 'hearingUnsupported' | 'hearingContradicted'
  | 'stamp' | 'solved' | 'failed' | 'tutorial' | 'open';

/** The typewriter is the only cue fired per animation frame, so it gets a floor. */
const TYPE_MIN_MS = 30;
let lastType = 0;

// — test/debug bridge -------------------------------------------------------
// With ?bridge=1 the page keeps a list of every cue it decided to play, so an
// automated playtester can assert the bindings fired without hearing anything.
function record(name: string): void {
  try {
    if (typeof window === 'undefined') return;
    if (!/[?&]bridge=1/.test(location.search)) return;
    const w = window as unknown as { __bakerAudio?: { played: string[]; ctx?: () => { state: string; time: number } | null } };
    if (!w.__bakerAudio) w.__bakerAudio = { played: [] };
    if (!w.__bakerAudio.ctx) w.__bakerAudio.ctx = () => { const c = context(); return c ? { state: c.state, time: c.currentTime } : null; };
    w.__bakerAudio.played.push(name);
  } catch { /* ignore */ }
}

// — building blocks ---------------------------------------------------------

/** A short tone. `send` keeps it in the room instead of in your ear. */
function tone(freq: number, seconds: number, o: { at?: number; gain?: number; type?: OscillatorType; detune?: number; send?: number; attack?: number } = {}): void {
  const t = o.at ?? now();
  const a = o.attack ?? 0.005;
  osc(o.type ?? 'triangle', freq, {
    at: t, gain: o.gain ?? 0.14, detune: o.detune,
    attack: a, decay: seconds * 0.35, sustain: 0.6, release: Math.max(0.02, seconds * 0.55),
    send: o.send ?? 0.12,
  });
}

/** Filtered noise burst. */
function hit(seconds: number, o: { at?: number; gain?: number; lowpass?: number; highpass?: number; send?: number } = {}): void {
  noise(seconds, { at: o.at ?? now(), gain: o.gain ?? 0.12, lowpass: o.lowpass, highpass: o.highpass, send: o.send ?? 0.1, attack: 0.002 });
}

// — the sound design --------------------------------------------------------

const SFX: Record<SfxName, (t: number) => void> = {
  /* Room change. A pressure hatch: air rushing down as the seal breaks
     (noise sweeping 300 → 80 Hz), then the dull weight of the door landing. */
  hatch: (t) => {
    const n = noise(0.35, { at: t, gain: 0.16, lowpass: 300, send: 0.22, attack: 0.02, release: 0.16 });
    try { n?.lp?.frequency.exponentialRampToValueAtTime(80, t + 0.35); } catch { /* ignore */ }
    osc('sine', 70, { at: t + 0.3, gain: 0.3, attack: 0.004, decay: 0.05, sustain: 0.3, release: 0.04, send: 0.18 });
  },

  /* Focus. Two clipped tones as the terminal locks onto the object. */
  examine: (t) => {
    tone(660, 0.06, { at: t, gain: 0.09 });
    tone(880, 0.06, { at: t + 0.075, gain: 0.09 });
  },

  /* A card lands on the notebook: paper edge, then a small ping of the clip. */
  card: (t) => {
    hit(0.04, { at: t, gain: 0.07, highpass: 2400 });
    tone(1320, 0.12, { at: t + 0.02, gain: 0.045, send: 0.2 });
  },

  /* Typewriter tick — 4 ms, barely there. Fired per revealed character. */
  type: (t) => { hit(0.004, { at: t, gain: 0.022, highpass: 1600, send: 0 }); },

  /* Watson's own voice: a console beep pair. Teal identity — a clean interval,
     a machine that is on your side but is still a machine. */
  watson: (t) => {
    tone(1046, 0.05, { at: t, gain: 0.075, type: 'triangle', send: 0.16 });
    tone(1568, 0.05, { at: t + 0.07, gain: 0.06, type: 'triangle', send: 0.16 });
  },

  /* Watson walking: three quick ticks, descending, like a servo counting doors. */
  watsonMove: (t) => {
    tone(1200, 0.03, { at: t, gain: 0.05, type: 'triangle' });
    tone(980, 0.03, { at: t + 0.06, gain: 0.045, type: 'triangle' });
    tone(760, 0.035, { at: t + 0.12, gain: 0.04, type: 'triangle' });
  },

  /* Topic chip: a soft contact click. */
  chip: (t) => { tone(2000, 0.015, { at: t, gain: 0.05, type: 'square', send: 0.06 }); },

  /* Hover glint — about −24 dB under the rest of the set, and 3 kHz is where the
     ear is most sensitive, so it stays the quietest thing that is still above the
     engine-room bed. Should register as texture, never as a beep. */
  hover: (t) => { tone(3000, 0.01, { at: t, gain: 0.028, type: 'sine', send: 0.05 }); },

  /* Hearing verdicts. Proven: a rising perfect fifth — the only consonance
     in the whole set, and it is never handed out for free. */
  hearingProven: (t) => {
    tone(440, 0.15, { at: t, gain: 0.1, send: 0.22 });
    tone(660, 0.15, { at: t + 0.14, gain: 0.1, send: 0.22 });
  },
  /* Unsupported: one neutral tone. Not a failure, just nothing underneath it. */
  hearingUnsupported: (t) => { tone(440, 0.2, { at: t, gain: 0.085, send: 0.18 }); },
  /* Contradicted: a falling tritone, detuned. The interval that cannot resolve. */
  hearingContradicted: (t) => {
    tone(622, 0.16, { at: t, gain: 0.1, detune: -14, send: 0.2 });
    tone(440, 0.22, { at: t + 0.15, gain: 0.1, detune: 18, send: 0.2 });
  },

  /* Accusation submitted. A rubber stamp on a steel desk: body, slap, and the
     ring the desk gives back. The heaviest thing the player can do. */
  stamp: (t) => {
    osc('sine', 55, { at: t, gain: 0.34, attack: 0.002, decay: 0.09, sustain: 0.2, release: 0.1, send: 0.2 });
    hit(0.08, { at: t, gain: 0.2, lowpass: 2600, highpass: 200, send: 0.25 });
    tone(1200, 0.18, { at: t + 0.03, gain: 0.05, type: 'triangle', send: 0.45 });
  },

  /* Case closed. Three voices settling into a major triad, wet. Restrained —
     it resolves, it does not celebrate. */
  solved: (t) => {
    const v: [number, number][] = [[220, 0.11], [277.18, 0.085], [329.63, 0.075]];
    v.forEach(([f, g], i) => {
      osc('triangle', f, { at: t + i * 0.09, gain: g, attack: 0.05, decay: 0.3, sustain: 0.55, release: 0.7, hold: 0.15, send: 0.5 });
    });
    osc('sine', 110, { at: t, gain: 0.13, attack: 0.08, decay: 0.4, sustain: 0.4, release: 0.6, hold: 0.1, send: 0.3 });
  },

  /* The truth stays sealed. A drone that holds too long, then is simply cut,
     and the room answers with a breath of static. */
  failed: (t) => {
    osc('sine', 45, { at: t, gain: 0.26, attack: 0.25, decay: 0.2, sustain: 0.95, release: 0.02, hold: 0.98, send: 0.2 });
    osc('triangle', 45.4, { at: t, gain: 0.1, attack: 0.3, decay: 0.2, sustain: 0.9, release: 0.02, hold: 0.93, send: 0.2 });
    hit(0.06, { at: t + 1.52, gain: 0.14, lowpass: 900, send: 0.3 });
  },

  /* Tutorial step: a two-note chime, soft, an octave-ish lift. */
  tutorial: (t) => {
    tone(880, 0.1, { at: t, gain: 0.06, send: 0.25 });
    tone(1108, 0.14, { at: t + 0.1, gain: 0.055, send: 0.25 });
  },

  /* A panel boots: contact noise, then the blip of something coming up. */
  open: (t) => {
    hit(0.03, { at: t, gain: 0.08, highpass: 900, lowpass: 5000 });
    tone(2000, 0.05, { at: t + 0.025, gain: 0.05, type: 'triangle', send: 0.12 });
  },
};

const NAMES = new Set<string>(Object.keys(SFX));

/** Play one designed cue. Unknown names, muted audio and missing AudioContext
 *  are all silent no-ops — this never throws. */
export function playSfx(name: SfxName | string): void {
  if (!NAMES.has(name as string)) return;
  if (name === 'type') {
    const ms = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (ms - lastType < TYPE_MIN_MS) return;
    lastType = ms;
  }
  record(name as string);
  const c = context();
  if (!c) return;
  try { SFX[name as SfxName](c.currentTime); } catch { /* a sound is never worth an exception */ }
}

/** Play several cues spaced `gapMs` apart, starting now. */
export function playSequence(names: (SfxName | string)[], gapMs = 180): void {
  names.forEach((n, i) => {
    if (i === 0) { playSfx(n); return; }
    setTimeout(() => playSfx(n), i * gapMs);
  });
}

export const __sfxNames = (): string[] => [...NAMES];
