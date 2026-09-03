export interface RecapShare { episodeId: string; timeLeft: number; watsonCalls: number; accusations: number; verdict: 'solved' | 'failed' | null; visited: string[]; unvisited: string[]; order: { cardId: string; by: 'holmes' | 'watson'; at: number }[] }
const KEYS: (keyof RecapShare)[] = ['episodeId', 'timeLeft', 'watsonCalls', 'accusations', 'verdict', 'visited', 'unvisited', 'order'];
export function encodeRecap(r: RecapShare): string { const clean = Object.fromEntries(KEYS.map((k) => [k, r[k]])); return btoa(unescape(encodeURIComponent(JSON.stringify(clean)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
export function decodeRecap(code: string): RecapShare | null {
  try { const json = decodeURIComponent(escape(atob(code.replace(/-/g, '+').replace(/_/g, '/')))); const o = JSON.parse(json); if (typeof o.episodeId !== 'string' || !Array.isArray(o.order)) return null; return o as RecapShare; } catch { return null; }
}
