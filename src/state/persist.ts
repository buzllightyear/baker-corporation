import type { RunState } from '../kernel/model';
export const KEY = 'baker.v1';
export function saveRun(state: RunState): boolean { try { localStorage.setItem(KEY, JSON.stringify({ v: 1, state })); return true; } catch { return false; } }
export function loadRun(): RunState | null {
  try { const raw = localStorage.getItem(KEY); if (!raw) return null; const p = JSON.parse(raw); if (p?.v !== 1 || typeof p.state?.episodeId !== 'string' || !Array.isArray(p.state.cards)) return null; return p.state as RunState; } catch { return null; }
}
export function clearRun(): void { try { localStorage.removeItem(KEY); } catch {} }
