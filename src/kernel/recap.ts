import type { Episode } from '../../content/types';
import type { RunState } from './model';
export function recapOf(ep: Episode, s: RunState) {
  const visited = [ep.startPlaceId, ...s.log.filter((l) => l.verb === 'move').map((l) => l.target)].filter((v, i, a) => a.indexOf(v) === i);
  return { timeLeft: Math.max(0, ep.budgetMinutes - s.clock), timeUsed: s.clock, watsonCalls: s.watsonCalls, accusations: s.accusations.length,
    order: s.cards.map((c) => ({ cardId: c.id, by: c.foundBy, at: c.foundAt })), visited, unvisited: ep.places.map((p) => p.id).filter((id) => !visited.includes(id)), verdict: s.verdict };
}
