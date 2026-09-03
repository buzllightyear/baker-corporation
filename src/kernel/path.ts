import type { Episode } from '../../content/types';
/** Shortest route between two rooms over the adjacency graph (BFS). Returns the rooms to enter, in order; [] if from === to; null if unreachable. */
export function routeTo(ep: Episode, from: string, to: string): string[] | null {
  if (from === to) return [];
  const prev = new Map<string, string | null>([[from, null]]); const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!; const pl = ep.places.find((p) => p.id === cur); if (!pl) continue;
    for (const n of pl.adjacent) { if (prev.has(n)) continue; prev.set(n, cur); if (n === to) { const path: string[] = []; let x: string | null = n; while (x && x !== from) { path.unshift(x); x = prev.get(x) ?? null; } return path; } queue.push(n); }
  }
  return null;
}
