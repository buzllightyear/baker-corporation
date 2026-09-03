import { create } from 'zustand';
import type { Episode } from '../../content/types';
import { EPISODES } from '../../content';
import { invoke } from '../kernel/kernel';
import { newRun } from '../kernel/model';
import type { Actor, Cmd, KernelResult, RunState } from '../kernel/model';
import { loadRun, saveRun } from './persist';
const registry = new Map<string, Episode>(EPISODES.map((e) => [e.id, e]));
export function registerEpisode(e: Episode) { registry.set(e.id, e); }
export function getEpisode(id: string): Episode | undefined { return registry.get(id); }
export function listEpisodes(): Episode[] { return [...registry.values()]; }
export interface HearingVerdict { claim: string; propositionId: string | null; status: 'proven' | 'unsupported' | 'contradicted' | 'unmatched'; missing?: string[] }
export interface Activity { ts: number; actor: Actor | 'sys'; verb: string; ok: boolean; code?: string; detail?: string }
/** One line of Watson's visible presence: what he just did, where, and what he pointed at. Kept short-lived — only the last TICKER_KEEP survive. */
export interface TickerLine { id: number; text: string; placeId?: string; targetId?: string; at: number }
export const TICKER_KEEP = 5;
let tickerId = 0;
const BUSY_MS = 1200;
let busyTimer: ReturnType<typeof setTimeout> | null = null;
interface GameStore {
  episode: Episode | null; state: RunState | null; activity: Activity[];
  toolCount: number; setToolCount: (n: number) => void; watsonBusy: string | null; setWatsonBusy: (s: string | null) => void;
  notebookOpen: boolean; toggleNotebook: () => void;
  watsonReads: number; markWatsonRead: () => void;
  ticker: TickerLine[]; pushTicker: (t: { text: string; placeId?: string; targetId?: string }) => void;
  lastHearing: { at: number; verdicts: HearingVerdict[] } | null;
  startEpisode: (id: string) => void; hydrate: () => void; dispatch: (actor: Actor, cmd: Cmd) => KernelResult; log: (a: Omit<Activity, 'ts'>) => void;
}
export const useGame = create<GameStore>((set, get) => ({
  episode: null, state: null, activity: [], toolCount: 0, watsonBusy: null,
  notebookOpen: (() => { try { return localStorage.getItem('baker.notebook') === 'open'; } catch { return false; } })(),
  lastHearing: null,
  watsonReads: 0, markWatsonRead: () => set((s) => ({ watsonReads: s.watsonReads + 1 })),
  ticker: [],
  pushTicker: (t) => set((s) => ({ ticker: [...s.ticker, { ...t, id: ++tickerId, at: Date.now() }].slice(-TICKER_KEEP) })),
  toggleNotebook: () => set((s) => { const next = !s.notebookOpen; try { localStorage.setItem('baker.notebook', next ? 'open' : 'closed'); } catch {} return { notebookOpen: next }; }),
  setToolCount: (n) => set({ toolCount: n }),
  // a non-null busy label stays on screen at least BUSY_MS so a synchronous tool call is still visible on the map
  setWatsonBusy: (s) => { if (busyTimer) { clearTimeout(busyTimer); busyTimer = null; } if (s === null) { set({ watsonBusy: null }); return; } set({ watsonBusy: s }); busyTimer = setTimeout(() => { busyTimer = null; set({ watsonBusy: null }); }, BUSY_MS); },
  log: (a) => set((s) => ({ activity: [...s.activity, { ...a, ts: Date.now() }].slice(-200) })),
  startEpisode: (id) => { const ep = registry.get(id); if (!ep) throw new Error(`no episode ${id}`); const state = newRun(ep.id, ep.startPlaceId, ep.watsonStartPlaceId); saveRun(state); set({ episode: ep, state, activity: [], watsonReads: 0, lastHearing: null, ticker: [] }); },
  hydrate: () => { const st = loadRun(); if (!st) return; const ep = registry.get(st.episodeId); if (!ep) return; set({ episode: ep, state: st }); },
  dispatch: (actor, cmd) => {
    const { episode, state } = get(); if (!episode || !state) return { ok: false, code: 'INVALID_ARGS', message: 'No episode running.' };
    const r = invoke(episode, state, actor, cmd);
    if (r.ok) { saveRun(r.state); set({ state: r.state }); get().log({ actor, verb: cmd.kind, ok: true }); if (cmd.kind === 'submit_theory') set({ lastHearing: { at: r.state.clock, verdicts: (r.result as { verdicts: HearingVerdict[] }).verdicts } }); }
    else get().log({ actor, verb: cmd.kind, ok: false, code: r.code, detail: r.message });
    return r;
  },
}));
