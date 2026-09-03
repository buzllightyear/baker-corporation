import type { Episode } from '../../content/types';
import type { RunState, Verb } from './model';
export const COST: Record<Verb, number> = { move: 0, talk: 5, ask: 5, examine: 5, pin: 0, timeline: 10, cross_check: 20, search_records: 30, submit_theory: 0 };
/** The docking deadline is switched off for now (2026-09-03 decision): the clock still runs and is reported, but nothing closes. */
export const DEADLINE_ENABLED = false;
export function advance(s: RunState, verb: Verb): RunState { return { ...s, clock: s.clock + COST[verb] }; }
export function isClosed(ep: Episode, s: RunState, enabled: boolean = DEADLINE_ENABLED): boolean { return enabled && s.clock >= ep.budgetMinutes; }
