/* ==========================================================================
   THE BAKER CORPORATION — room ambience
   The ship never stops running, so neither does this. There is no loop point
   to hear: two or three detuned low oscillators beat against each other on
   irrational periods, a noise bed breathes under an LFO that never lines up
   with them, and the metal complains at random intervals.

   Everything sits about −18 dB under the SFX. If the player notices it as a
   sound rather than as a room, it is too loud.
   ========================================================================== */

import { context, dry, send, noise, isSupported } from './engine';

export type RoomKey =
  | 'corridor' | 'bridge' | 'medbay' | 'galley' | 'engine' | 'cargo' | 'quarters' | 'airlock' | 'default';

/** −18 dB under the SFX bus. */
const BED_LEVEL = 0.126;
const XFADE = 1.5;

interface RoomProfile {
  /** Hum partials: [Hz, gain] — always detuned pairs so the beat is audible but slow. */
  hum: [number, number][];
  /** Beat width in Hz added to the second voice of each partial (0.3–0.8). */
  beat: number;
  /** Air handling: noise bed cutoff (Hz) and level. */
  air: [number, number];
  /** LFO on cutoff + gain, 0.05–0.12 Hz. */
  lfo: number;
  /** Random metallic ping window, seconds. */
  ping: [number, number];
  /** Ping pitch window, Hz. */
  pingHz: [number, number];
  /** Share of the ping sent to reverb. */
  pingSend: number;
  /** Optional faint whine (bridge) — [Hz, gain]. */
  whine?: [number, number];
  /** Optional mains buzz (medbay) — [Hz, gain]. */
  buzz?: [number, number];
}

const ROOMS: Record<RoomKey, RoomProfile> = {
  // Long deck plate, everything arrives from somewhere else.
  corridor: { hum: [[52, 0.55], [78, 0.22]], beat: 0.4, air: [240, 0.5], lfo: 0.07, ping: [11, 24], pingHz: [190, 250], pingSend: 0.6 },
  // Instruments awake, hull noise filtered out by the pressure door.
  bridge: { hum: [[62, 0.4], [93, 0.16]], beat: 0.35, air: [200, 0.34], lfo: 0.09, ping: [14, 25], pingHz: [220, 260], pingSend: 0.45, whine: [4800, 0.008] },
  // Sterile: less hull, a bad fluorescent ballast.
  medbay: { hum: [[58, 0.34], [87, 0.14]], beat: 0.3, air: [220, 0.4], lfo: 0.11, ping: [13, 25], pingHz: [210, 255], pingSend: 0.4, buzz: [50, 0.012] },
  // Extraction fans, warmer, closer.
  galley: { hum: [[48, 0.5], [96, 0.2]], beat: 0.5, air: [300, 0.55], lfo: 0.06, ping: [12, 24], pingHz: [185, 235], pingSend: 0.35 },
  // The reason the whole ship hums. More partials, more frequent complaint.
  engine: { hum: [[44, 0.8], [88, 0.42], [110, 0.2]], beat: 0.8, air: [320, 0.62], lfo: 0.05, ping: [9, 15], pingHz: [180, 240], pingSend: 0.3 },
  // Cold, high, empty. Sparse pings that take a long time to come back.
  cargo: { hum: [[50, 0.42], [75, 0.14]], beat: 0.6, air: [420, 0.38], lfo: 0.055, ping: [18, 25], pingHz: [210, 260], pingSend: 0.95 },
  // Bunks: the ship heard through a bulkhead.
  quarters: { hum: [[54, 0.42], [81, 0.15]], beat: 0.32, air: [180, 0.42], lfo: 0.1, ping: [15, 25], pingHz: [190, 240], pingSend: 0.5 },
  // Nothing on the other side of that door.
  airlock: { hum: [[46, 0.36], [92, 0.12]], beat: 0.45, air: [200, 0.3], lfo: 0.08, ping: [16, 25], pingHz: [200, 255], pingSend: 0.85 },
  default: { hum: [[52, 0.5], [78, 0.2]], beat: 0.45, air: [250, 0.46], lfo: 0.08, ping: [12, 24], pingHz: [190, 250], pingSend: 0.55 },
};

/** Map a content place id onto a room profile by what the id contains. */
export function mapRoom(placeId: string | null | undefined): RoomKey {
  const s = String(placeId ?? '').toLowerCase();
  if (!s) return 'default';
  if (s.includes('corridor')) return 'corridor';
  if (s.includes('bridge')) return 'bridge';
  if (s.includes('medbay')) return 'medbay';
  if (s.includes('galley')) return 'galley';
  if (s.includes('engine')) return 'engine';
  if (s.includes('cargo')) return 'cargo';
  if (s.includes('quarters') || s.includes('bunks')) return 'quarters';
  if (s.includes('airlock')) return 'airlock';
  return 'default';
}

const rand = (a: number, b: number): number => a + Math.random() * (b - a);

interface Layer {
  key: RoomKey;
  out: GainNode;
  stop: (fadeSeconds: number) => void;
}

function buildLayer(key: RoomKey, parent: GainNode): Layer | null {
  const c = context();
  if (!c) return null;
  const p = ROOMS[key] ?? ROOMS.default;
  try {
    const out = c.createGain();
    out.gain.value = 0;
    out.connect(parent);

    const dead: (() => void)[] = [];

    // — hum: each partial is a detuned pair, so it beats at `beat` Hz —
    for (const [hz, g] of p.hum) {
      for (const [i, delta] of [0, p.beat].entries()) {
        const o = c.createOscillator();
        o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = hz + delta;
        const vg = c.createGain();
        vg.gain.value = g * 0.09 * (i === 0 ? 1 : 0.7);
        o.connect(vg); vg.connect(out);
        o.start();
        dead.push(() => { try { o.stop(); o.disconnect(); vg.disconnect(); } catch { /* ignore */ } });
      }
    }

    // — air handling: looping filtered noise, cutoff + level breathing on a slow LFO —
    const [cut, airGain] = p.air;
    const bed = noise(0, { loop: true, lowpass: cut, gain: airGain * 0.16, dest: out, attack: 1.2 });
    if (bed) {
      const lfo = c.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = p.lfo;
      const toCut = c.createGain(); toCut.gain.value = cut * 0.28;
      const toGain = c.createGain(); toGain.gain.value = airGain * 0.05;
      lfo.connect(toCut); lfo.connect(toGain);
      if (bed.lp) toCut.connect(bed.lp.frequency);
      toGain.connect(bed.gain.gain);
      lfo.start();
      dead.push(() => { try { lfo.stop(); lfo.disconnect(); toCut.disconnect(); toGain.disconnect(); } catch { /* ignore */ } });
      dead.push(() => { try { bed.source.stop(); bed.source.disconnect(); bed.gain.disconnect(); } catch { /* ignore */ } });
    }

    // — a faint electronic whine, only where instruments are awake —
    if (p.whine) {
      const [hz, g] = p.whine;
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = hz;
      const vg = c.createGain(); vg.gain.value = g;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = hz * 1.4;
      o.connect(lp); lp.connect(vg); vg.connect(out); o.start();
      dead.push(() => { try { o.stop(); o.disconnect(); lp.disconnect(); vg.disconnect(); } catch { /* ignore */ } });
    }

    // — a bad ballast, 50 Hz plus its odd harmonic —
    if (p.buzz) {
      const [hz, g] = p.buzz;
      for (const [mult, share] of [[1, 1], [3, 0.35]] as [number, number][]) {
        const o = c.createOscillator(); o.type = 'square'; o.frequency.value = hz * mult;
        const vg = c.createGain(); vg.gain.value = g * share;
        o.connect(vg); vg.connect(out); o.start();
        dead.push(() => { try { o.stop(); o.disconnect(); vg.disconnect(); } catch { /* ignore */ } });
      }
    }

    // — random metallic pings: the hull settling, somewhere down the ship —
    let timer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;
    const schedule = () => {
      if (!alive) return;
      timer = setTimeout(() => {
        if (!alive) return;
        try {
          const t = c.currentTime;
          const o = c.createOscillator();
          o.type = 'sine';
          o.frequency.value = rand(p.pingHz[0], p.pingHz[1]);
          const g = c.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.05, t + 0.006);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
          o.connect(g);
          g.connect(out);
          const sb = send();
          if (sb) { const sg = c.createGain(); sg.gain.value = p.pingSend; g.connect(sg); sg.connect(sb); }
          o.start(t); o.stop(t + 0.7);
          o.onended = () => { try { o.disconnect(); g.disconnect(); } catch { /* ignore */ } };
        } catch { /* ignore */ }
        schedule();
      }, rand(p.ping[0], p.ping[1]) * 1000);
    };
    schedule();
    dead.push(() => { alive = false; if (timer) clearTimeout(timer); });

    const stop = (fadeSeconds: number) => {
      try {
        const t = c.currentTime;
        out.gain.cancelScheduledValues(t);
        out.gain.setValueAtTime(out.gain.value, t);
        out.gain.linearRampToValueAtTime(0, t + fadeSeconds);
      } catch { /* ignore */ }
      setTimeout(() => {
        for (const f of dead) f();
        try { out.disconnect(); } catch { /* ignore */ }
      }, Math.max(0, fadeSeconds * 1000) + 120);
    };

    return { key, out, stop };
  } catch { return null; }
}

class AmbienceEngine {
  private bus: GainNode | null = null;
  private layer: Layer | null = null;
  private room: RoomKey = 'default';
  private running = false;

  /** Bring the bed up. No-op without an AudioContext, and idempotent. */
  start(): void {
    if (this.running || !isSupported()) return;
    const c = context();
    if (!c) return;
    this.running = true;
    try {
      if (!this.bus) {
        this.bus = c.createGain();
        this.bus.gain.value = BED_LEVEL;
        const d = dry();
        if (d) this.bus.connect(d);
      }
      this.swap(this.room, XFADE);
    } catch { /* ignore */ }
  }

  /** Cross-fade to another room over 1.5 s. Remembers the room when stopped. */
  setRoom(key: RoomKey): void {
    if (this.room === key && this.layer) return;
    this.room = key;
    if (!this.running) return;
    this.swap(key, XFADE);
  }

  /** Fade the whole bed out and release its nodes. */
  stop(fadeSeconds = 1.2): void {
    if (!this.running) return;
    this.running = false;
    const l = this.layer;
    this.layer = null;
    l?.stop(fadeSeconds);
  }

  isRunning(): boolean { return this.running; }
  currentRoom(): RoomKey { return this.room; }

  private swap(key: RoomKey, fade: number): void {
    const c = context();
    if (!c || !this.bus) return;
    const old = this.layer;
    const next = buildLayer(key, this.bus);
    if (!next) return;
    try {
      const t = c.currentTime;
      next.out.gain.setValueAtTime(0.0001, t);
      next.out.gain.linearRampToValueAtTime(1, t + fade);
    } catch { /* ignore */ }
    this.layer = next;
    old?.stop(fade);
  }
}

export const ambience = new AmbienceEngine();
