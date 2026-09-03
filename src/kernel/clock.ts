import type { Episode } from '../../content/types';
import type { RunState, Verb } from './model';
export const COST: Record<Verb, number> = { move: 10, talk: 5, ask: 5, examine: 5, pin: 0, timeline: 10, cross_check: 20, search_records: 30, submit_theory: 0 };
export function advance(s: RunState, verb: Verb): RunState { return { ...s, clock: s.clock + COST[verb] }; }
export function isClosed(ep: Episode, s: RunState): boolean { return s.clock >= ep.budgetMinutes; }
