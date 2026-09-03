// Generative music layer — a slow, sparse arpeggio in A aeolian over a pedal, never repeating exactly.
// Runs under the ambience; louder on the home/briefing screens, sparser during play, a low pedal only during the hearing/accusation.
import { context, dry, send, isSupported } from './engine';

export type MusicMode = 'home' | 'play' | 'tense' | 'off';
const A2 = 110;
// A aeolian: A B C D E F G (semitones 0 2 3 5 7 8 10), voiced across two octaves
const SCALE = [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19];
const hz = (deg: number, base = A2 * 2) => base * Math.pow(2, SCALE[((deg % SCALE.length) + SCALE.length) % SCALE.length] / 12) * Math.pow(2, Math.floor(deg / SCALE.length));

const LEVEL: Record<Exclude<MusicMode, 'off'>, number> = { home: 0.16, play: 0.07, tense: 0.09 };
const GAP: Record<Exclude<MusicMode, 'off'>, [number, number]> = { home: [0.9, 1.9], play: [3.5, 9], tense: [6, 12] };

class Music {
  private mode: MusicMode = 'off';
  private bus: GainNode | null = null;
  private pedal: { o: OscillatorNode; g: GainNode }[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private deg = 0;
  private gen = 0;

  set(mode: MusicMode): void {
    if (mode === this.mode) return;
    const prev = this.mode; this.mode = mode;
    if (!isSupported()) return;
    const c = context(); if (!c) return;
    try {
      if (mode === 'off') { this.fadeOut(1.6); return; }
      if (!this.bus) { this.bus = c.createGain(); this.bus.gain.value = 0; const d = dry(); if (d) this.bus.connect(d); const s = send(); if (s) { const sg = c.createGain(); sg.gain.value = 0.9; this.bus.connect(sg); sg.connect(s); } }
      const t = c.currentTime; this.bus.gain.cancelScheduledValues(t); this.bus.gain.setTargetAtTime(LEVEL[mode], t, prev === 'off' ? 1.2 : 0.8);
      if (prev === 'off') { this.startPedal(c); this.schedule(++this.gen); }
      else if (mode === 'tense') this.schedule(++this.gen);
    } catch { /* ignore */ }
  }

  private startPedal(c: AudioContext): void {
    this.stopPedal();
    if (!this.bus) return;
    for (const [f, type, lvl] of [[A2, 'sine', 0.35], [A2 * 1.005, 'triangle', 0.12], [A2 / 2, 'sine', 0.25]] as const) {
      const o = c.createOscillator(); o.type = type; o.frequency.value = f; const g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(lvl, c.currentTime, 2.5);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; o.connect(lp); lp.connect(g); g.connect(this.bus); o.start();
      this.pedal.push({ o, g });
    }
  }
  private stopPedal(): void { for (const p of this.pedal) { try { p.o.stop(); p.o.disconnect(); p.g.disconnect(); } catch { /* ignore */ } } this.pedal = []; }

  /** One pad note: soft attack, long release, a fifth or octave shimmer sometimes. */
  private note(c: AudioContext, freq: number, dur: number, vel: number): void {
    if (!this.bus) return;
    const t = c.currentTime;
    for (const [mult, lvl, type] of [[1, 1, 'sine'], [2.002, 0.22, 'sine'], [0.5, 0.18, 'triangle']] as const) {
      const o = c.createOscillator(); o.type = type; o.frequency.value = freq * mult; o.detune.value = (Math.random() - 0.5) * 6;
      const g = c.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(vel * lvl, t + 0.35); g.gain.setTargetAtTime(0, t + dur * 0.4, dur * 0.35);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.Q.value = 0.4;
      o.connect(lp); lp.connect(g); g.connect(this.bus); o.start(t); o.stop(t + dur + 2);
    }
  }

  private schedule(gen: number): void {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    const tick = () => {
      if (gen !== this.gen || this.mode === 'off') return;
      const c = context(); if (!c) return;
      const m = this.mode as Exclude<MusicMode, 'off'>;
      if (m !== 'tense' || Math.random() < 0.5) {
        // random walk on the scale, pulled back toward the tonic; occasional leap of a fifth
        const step = Math.random() < 0.12 ? (Math.random() < 0.5 ? 4 : -4) : (Math.random() < 0.5 ? 1 : -1) * (Math.random() < 0.7 ? 1 : 2);
        this.deg = Math.max(-2, Math.min(9, this.deg + step)); if (Math.random() < 0.18) this.deg = Math.round(this.deg / 2);
        const dur = m === 'home' ? 3.5 + Math.random() * 2 : 5 + Math.random() * 3;
        this.note(c, hz(this.deg), dur, m === 'tense' ? 0.35 : 0.5);
        if (m === 'home' && Math.random() < 0.35) setTimeout(() => { if (gen === this.gen) this.note(c, hz(this.deg + (Math.random() < 0.5 ? 4 : 2)), dur * 0.8, 0.3); }, 700 + Math.random() * 600);
      }
      const [a, b] = GAP[m]; this.timer = setTimeout(tick, (a + Math.random() * (b - a)) * 1000);
    };
    this.timer = setTimeout(tick, 400);
  }

  private fadeOut(sec: number): void {
    this.gen++; if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    const c = context(); if (!c || !this.bus) return;
    const t = c.currentTime; this.bus.gain.cancelScheduledValues(t); this.bus.gain.setTargetAtTime(0, t, sec / 3);
    const pedal = this.pedal; this.pedal = [];
    setTimeout(() => { for (const p of pedal) { try { p.o.stop(); p.o.disconnect(); p.g.disconnect(); } catch { /* ignore */ } } }, sec * 1000 + 200);
  }

  current(): MusicMode { return this.mode; }
}
export const music = new Music();
