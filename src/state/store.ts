import { create } from 'zustand';
import type { Episode } from '../../content/types';
import { EPISODES } from '../../content';
import { invoke } from '../kernel/kernel';
import { newRun } from '../kernel/model';
import type { Actor, Cmd, KernelResult, RunState } from '../kernel/model';
import { loadRun, saveRun } from './persist';
import { crewMoves } from '../kernel/presence';
import { fetchStatus } from '../kernel/leads';
import { T } from '../i18n/ui';
import { currentLang, pick } from '../i18n/lang';
const registry = new Map<string, Episode>(EPISODES.map((e) => [e.id, e]));
export function registerEpisode(e: Episode) { registry.set(e.id, e); }
export function getEpisode(id: string): Episode | undefined { return registry.get(id); }
export function listEpisodes(): Episode[] { return [...registry.values()]; }
export interface HearingVerdict { claim: string; propositionId: string | null; status: 'proven' | 'unsupported' | 'contradicted' | 'unmatched'; missing?: string[]; stillToFind?: number }
export interface Activity { ts: number; actor: Actor | 'sys'; verb: string; ok: boolean; code?: string; detail?: string }
/** One line of Watson's visible presence: what he just did, where, and what he pointed at. Kept short-lived — only the last TICKER_KEEP survive. */
export interface TickerLine { id: number; text: string; placeId?: string; targetId?: string; at: number }
export const TICKER_KEEP = 5;
let tickerId = 0;
/** Her Story's coverage prompt: the moment the notebook covers every provable proposition (or the ship has nothing
 *  left to give), Watson says his one structural line — once, and never who. Computed from before/after so it
 *  cannot fire on reload and does not repeat. */
function announceCoverage(ep: Episode, before: RunState, after: RunState, push: GameStore['pushTicker']): void {
  if (fetchStatus(ep, before) === 'nothing_left_to_fetch' || fetchStatus(ep, after) !== 'nothing_left_to_fetch') return;
  push({ text: T.nothingLeft[currentLang()], placeId: after.pos.watson });
}
/** The manifest moved someone while the clock advanced: say so on the stage ticker, in the UI language,
 *  so a player who met the engineer in the engine room and finds him in the galley reads a move, not a twin. */
function announceMoves(ep: Episode, before: number, after: number, push: GameStore['pushTicker']): void {
  const lang = currentLang();
  const place = (id: string | null) => (id ? pick(ep.places.find((p) => p.id === id)?.name ?? { en: id, ko: id }, lang) : '—');
  for (const m of crewMoves(ep, before, after)) {
    const who = pick(ep.people.find((p) => p.id === m.personId)?.name ?? { en: m.personId, ko: m.personId }, lang);
    push({ text: `◆ ${who}: ${place(m.from)} → ${place(m.to)}`, placeId: m.to ?? undefined, targetId: m.personId });
  }
}
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
    if (r.ok) { saveRun(r.state); set({ state: r.state }); get().log({ actor, verb: cmd.kind, ok: true }); announceMoves(episode, state.clock, r.state.clock, get().pushTicker); announceCoverage(episode, state, r.state, get().pushTicker); if (cmd.kind === 'submit_theory') set({ lastHearing: { at: r.state.clock, verdicts: (r.result as { verdicts: HearingVerdict[] }).verdicts } }); }
    else get().log({ actor, verb: cmd.kind, ok: false, code: r.code, detail: r.message });
    return r;
  },
}));
