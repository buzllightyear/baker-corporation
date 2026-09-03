/* ==========================================================================
   THE BAKER CORPORATION — procedural audio engine
   No files, no libraries. Every sound on this ship is synthesised at runtime
   from oscillators, white noise and a noise-built convolution tail.

   House rules
   -----------
   1. Nothing here may throw. The game must run identically with the audio
      subsystem missing (jsdom, a locked-down webview, a refused AudioContext).
      Every public function short-circuits to a no-op when `isSupported()`
      is false, and every browser call sits inside a try/catch.
   2. The AudioContext is created lazily, on the first sound or the first
      unlock, never at import time — a context created before a gesture is
      born `suspended` and some engines count that against the page.
   3. Volume and mute are user state, so they persist even when there is no
      audio device to apply them to.
   ========================================================================== */

export interface AudioSettings { muted: boolean; volume: number }

const STORE_KEY = 'baker.audio';
const DEFAULTS: AudioSettings = { muted: false, volume: 0.6 };

/** Reverb impulse geometry: a short, dry steel room. Long enough to place a
 *  ping somewhere down the hull, short enough never to sound like a cathedral. */
const IR_SECONDS = 2.2;
const IR_DECAY = 3.4;
/** How much of the reverb return reaches the master. Deliberately meagre. */
const REVERB_RETURN = 0.5;

const clamp01 = (n: number): number => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

// — persisted settings ------------------------------------------------------

function readSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<AudioSettings> | null;
    if (!p || typeof p !== 'object') return { ...DEFAULTS };
    return {
      muted: typeof p.muted === 'boolean' ? p.muted : DEFAULTS.muted,
      volume: typeof p.volume === 'number' ? clamp01(p.volume) : DEFAULTS.volume,
    };
  } catch { return { ...DEFAULTS }; }
}

function writeSettings(s: AudioSettings): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* private mode, quota, no storage */ }
}

let settings: AudioSettings = readSettings();

export function getSettings(): AudioSettings { return { ...settings }; }
export function isMuted(): boolean { return settings.muted; }
export function getVolume(): number { return settings.volume; }

// — capability --------------------------------------------------------------

type Ctor = new () => AudioContext;

function ctor(): Ctor | null {
  try {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
    const C = w.AudioContext ?? w.webkitAudioContext;
    return typeof C === 'function' ? C : null;
  } catch { return null; }
}

/** True when this page can actually make a sound. False under jsdom. */
export function isSupported(): boolean { return ctor() !== null; }

// — graph -------------------------------------------------------------------

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let dryBus: GainNode | null = null;
let sendBus: GainNode | null = null;
let convolver: ConvolverNode | null = null;
let irBuffer: AudioBuffer | null = null;
let noiseBuffer: AudioBuffer | null = null;
let failed = false;

/** The live context, creating it on first use. `null` when unsupported. */
export function context(): AudioContext | null {
  if (ctx || failed) return ctx;
  const C = ctor();
  if (!C) { failed = true; return null; }
  try {
    ctx = new C();
    masterGain = ctx.createGain();
    masterGain.gain.value = settings.muted ? 0 : settings.volume;
    masterGain.connect(ctx.destination);

    dryBus = ctx.createGain();
    dryBus.gain.value = 1;
    dryBus.connect(masterGain);

    // reverb send → convolver → return → master
    sendBus = ctx.createGain();
    sendBus.gain.value = 1;
    const ir = impulseReverb(IR_SECONDS, IR_DECAY);
    if (ir) {
      convolver = ctx.createConvolver();
      convolver.buffer = ir;
      const ret = ctx.createGain();
      ret.gain.value = REVERB_RETURN;
      sendBus.connect(convolver);
      convolver.connect(ret);
      ret.connect(masterGain);
    } else {
      // no convolver on this engine: fold the send back in, quietly
      sendBus.gain.value = 0.12;
      sendBus.connect(masterGain);
    }
  } catch {
    failed = true; ctx = null; masterGain = null; dryBus = null; sendBus = null; convolver = null;
  }
  return ctx;
}

/** Master gain. Everything audible passes through it; mute is `gain = 0` here. */
export function master(): GainNode | null { context(); return masterGain; }
/** Dry bus — the default destination for a sound. */
export function dry(): GainNode | null { context(); return dryBus; }
/** Reverb send bus. Connect a sound here as well as to `dry()` for a tail. */
export function send(): GainNode | null { context(); return sendBus; }
/** Context clock, or 0 when there is no context. */
export function now(): number { const c = context(); return c ? c.currentTime : 0; }

// — unlock ------------------------------------------------------------------

let unlocked = false;
let armed = false;
const unlockWaiters = new Set<() => void>();

export function isUnlocked(): boolean { return unlocked; }

/** Run `fn` once the context is running (immediately if it already is). */
export function onUnlock(fn: () => void): () => void {
  if (unlocked) { try { fn(); } catch { /* caller's problem, not ours */ } return () => {}; }
  unlockWaiters.add(fn);
  return () => unlockWaiters.delete(fn);
}

function fireUnlock(): void {
  unlocked = true;
  const fns = [...unlockWaiters];
  unlockWaiters.clear();
  for (const fn of fns) { try { fn(); } catch { /* ignore */ } }
}

/** Create + resume the context. Safe to call any number of times. */
export function unlock(): void {
  const c = context();
  if (!c) return;
  try {
    if (c.state === 'running') { if (!unlocked) fireUnlock(); return; }
    void c.resume().then(() => { if (c.state === 'running' && !unlocked) fireUnlock(); }).catch(() => {});
  } catch { /* ignore */ }
  // some engines report 'running' synchronously
  try { if (c.state === 'running' && !unlocked) fireUnlock(); } catch { /* ignore */ }
}

/** Bind `unlock()` once to the first pointer/key gesture, then let go. */
export function armUnlock(): void {
  if (armed || !isSupported()) return;
  try {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
  } catch { return; }
  armed = true;
  const go = () => {
    try {
      window.removeEventListener('pointerdown', go);
      window.removeEventListener('keydown', go);
    } catch { /* ignore */ }
    unlock();
  };
  try {
    window.addEventListener('pointerdown', go, { passive: true });
    window.addEventListener('keydown', go);
  } catch { armed = false; }
}

// — settings ----------------------------------------------------------------

function applyGain(): void {
  const g = masterGain;
  if (!g || !ctx) return;
  try {
    const t = ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(settings.muted ? 0 : settings.volume, t + 0.05);
  } catch { try { g.gain.value = settings.muted ? 0 : settings.volume; } catch { /* ignore */ } }
}

export function setMuted(m: boolean): void {
  settings = { ...settings, muted: !!m };
  writeSettings(settings);
  applyGain();
}

export function setVolume(v: number): void {
  settings = { ...settings, volume: clamp01(v) };
  writeSettings(settings);
  applyGain();
}

/** Test seam: forget the cached settings and re-read storage. */
export function reloadSettings(): AudioSettings { settings = readSettings(); applyGain(); return { ...settings }; }

// — buffers -----------------------------------------------------------------

/** A one-shot white-noise buffer, cached: 2 s is longer than any of our bursts
 *  and long enough to loop as an air-handling bed without an audible seam. */
function whiteNoise(): AudioBuffer | null {
  if (noiseBuffer) return noiseBuffer;
  const c = context();
  if (!c) return null;
  try {
    const len = Math.floor(c.sampleRate * 2);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseBuffer = buf;
    return buf;
  } catch { return null; }
}

/** Noise-built convolution impulse: exponentially decaying stereo noise.
 *  Built once and reused — generating it is the most expensive thing we do. */
export function impulseReverb(seconds = IR_SECONDS, decay = IR_DECAY): AudioBuffer | null {
  if (irBuffer) return irBuffer;
  const c = context();
  if (!c) return null;
  try {
    const len = Math.max(1, Math.floor(c.sampleRate * seconds));
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
      }
    }
    irBuffer = buf;
    return buf;
  } catch { return null; }
}

// — envelope ----------------------------------------------------------------

/**
 * ADSR onto a GainNode's gain param, in absolute context time.
 * @param g      target gain node
 * @param t      start time
 * @param a      attack seconds
 * @param d      decay seconds
 * @param s      sustain LEVEL (0..1, relative to `peak`)
 * @param r      release seconds
 * @param peak   peak gain
 * @param hold   optional seconds held at the sustain level before release
 * @returns      the time at which the envelope reaches zero
 */
export function env(g: GainNode | null, t: number, a: number, d: number, s: number, r: number, peak = 1, hold = 0): number {
  const endsAt = t + a + d + hold + r;
  if (!g) return endsAt;
  try {
    const p = g.gain;
    p.cancelScheduledValues(t);
    p.setValueAtTime(0.0001, t);
    p.exponentialRampToValueAtTime(Math.max(0.0001, peak), t + Math.max(0.001, a));
    const sus = Math.max(0.0001, peak * s);
    p.exponentialRampToValueAtTime(sus, t + a + Math.max(0.001, d));
    if (hold > 0) p.setValueAtTime(sus, t + a + d + hold);
    p.exponentialRampToValueAtTime(0.0001, endsAt);
    p.setValueAtTime(0, endsAt + 0.001);
  } catch { /* ignore */ }
  return endsAt;
}

// — voices ------------------------------------------------------------------

export interface OscOpts {
  attack?: number; decay?: number; sustain?: number; release?: number;
  gain?: number; detune?: number;
  /** absolute start time; defaults to `now()` */
  at?: number;
  /** seconds held at the sustain level */
  hold?: number;
  /** 0..1 share of the voice routed to the reverb send */
  send?: number;
  /** override the dry destination */
  dest?: AudioNode | null;
}

export interface Voice { osc: OscillatorNode; gain: GainNode; end: number }

/** One enveloped oscillator, started and scheduled to stop. */
export function osc(type: OscillatorType, freq: number, o: OscOpts = {}): Voice | null {
  const c = context();
  if (!c) return null;
  try {
    const t = o.at ?? c.currentTime;
    const a = o.attack ?? 0.004, d = o.decay ?? 0.06, s = o.sustain ?? 0.35, r = o.release ?? 0.08;
    const node = c.createOscillator();
    node.type = type;
    node.frequency.setValueAtTime(Math.max(1, freq), t);
    if (o.detune) node.detune.setValueAtTime(o.detune, t);
    const g = c.createGain();
    node.connect(g);
    const target = o.dest === undefined ? dryBus : o.dest;
    if (target) g.connect(target);
    if (o.send && sendBus) { const sg = c.createGain(); sg.gain.value = o.send; g.connect(sg); sg.connect(sendBus); }
    const end = env(g, t, a, d, s, r, o.gain ?? 0.2, o.hold ?? 0);
    node.start(t);
    node.stop(end + 0.02);
    node.onended = () => { try { g.disconnect(); node.disconnect(); } catch { /* ignore */ } };
    return { osc: node, gain: g, end };
  } catch { return null; }
}

export interface NoiseOpts {
  lowpass?: number; highpass?: number; gain?: number;
  attack?: number; release?: number;
  at?: number; send?: number; dest?: AudioNode | null; loop?: boolean;
}

export interface NoiseVoice { source: AudioBufferSourceNode; gain: GainNode; lp: BiquadFilterNode | null; hp: BiquadFilterNode | null; end: number }

/** A burst (or loop) of filtered white noise. */
export function noise(seconds: number, o: NoiseOpts = {}): NoiseVoice | null {
  const c = context();
  const buf = whiteNoise();
  if (!c || !buf) return null;
  try {
    const t = o.at ?? c.currentTime;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;                       // always loop the source; the envelope is the note
    let node: AudioNode = src;
    let hp: BiquadFilterNode | null = null;
    let lp: BiquadFilterNode | null = null;
    if (o.highpass) { hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.setValueAtTime(o.highpass, t); node.connect(hp); node = hp; }
    if (o.lowpass) { lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(o.lowpass, t); node.connect(lp); node = lp; }
    const g = c.createGain();
    node.connect(g);
    const target = o.dest === undefined ? dryBus : o.dest;
    if (target) g.connect(target);
    if (o.send && sendBus) { const sg = c.createGain(); sg.gain.value = o.send; g.connect(sg); sg.connect(sendBus); }
    const a = o.attack ?? 0.003;
    const r = o.release ?? Math.min(0.12, seconds * 0.5);
    const peak = o.gain ?? 0.15;
    const end = t + seconds;
    if (o.loop) {
      // sustained bed: fade in and leave running; the caller owns `stop`
      try {
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t + Math.max(0.01, a));
      } catch { /* ignore */ }
      src.start(t);
      return { source: src, gain: g, lp, hp, end: Infinity };
    }
    try {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t + Math.max(0.001, a));
      g.gain.setValueAtTime(Math.max(0.0001, peak), Math.max(t + a, end - r));
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      g.gain.setValueAtTime(0, end + 0.001);
    } catch { /* ignore */ }
    src.start(t);
    src.stop(end + 0.02);
    src.onended = () => { try { g.disconnect(); src.disconnect(); } catch { /* ignore */ } };
    return { source: src, gain: g, lp, hp, end };
  } catch { return null; }
}

// Arm the gesture listener at import time: by the time the player clicks
// anything at all, the context is ready to be resumed.
armUnlock();
