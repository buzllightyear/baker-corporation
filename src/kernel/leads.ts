// src/kernel/leads.ts — what is still open on the ship, and whether Watson has anything left to fetch.
//
// Research (docs/research/05-stuck-synthesis.md): a stuck player needs a
// readiness signal, not a hint. Acclaimed games say WHERE something is still
// open (Outer Wilds "more to explore here", Paradise Killer open leads) and
// fire a coverage prompt when the load-bearing facts are all in hand (Her
// Story). They never say WHAT, and never "correct".
//
// Everything here is computed from content the notebook can legitimately
// reach — statements available now, evidence lying in rooms, the log of what
// has been cross-checked, proposition proving sets. `lie`, `truth` and
// `refutedBy` are never read, so no count leaks who is lying or who did it.
import type { Episode } from '../../content/types';
import type { RunState } from './model';
import { whatIsHere, whoIsHere, proofEligible } from './kernel';

export interface PersonLead { personId: string; unheard: number; crossed: boolean; placeId: string | null }
export interface RoomLead { placeId: string; unvisited: boolean; unexamined: number; unheard: number }
export interface Leads { people: PersonLead[]; rooms: RoomLead[]; open: number; openLater: number }
export interface Coverage { covered: number; provable: number; complete: boolean }
export type FetchStatus = 'more_to_fetch' | 'nothing_left_to_fetch';

const has = (s: RunState, id: string) => s.cards.some((c) => c.id === id);
const within = (from: number | undefined, to: number | undefined, clock: number) => (from === undefined || clock >= from) && (to === undefined || clock < to);

/** Statements this person could give right now that are not yet on the notebook. */
function unheardOf(ep: Episode, s: RunState, personId: string): number {
  return ep.statements.filter((st) => st.personId === personId && within(st.availableFrom, st.availableTo, s.clock) && !has(s, st.id)).length;
}

/** Open threads per person and per room. Counts only — no content, no truth. */
export function leads(ep: Episode, s: RunState): Leads {
  const people: PersonLead[] = ep.people.map((p) => ({
    personId: p.id,
    unheard: unheardOf(ep, s, p.id),
    crossed: s.log.some((l) => l.verb === 'cross_check' && l.target === p.id),
    placeId: ep.presence.find((x) => x.personId === p.id && s.clock >= x.from && s.clock < x.to)?.placeId ?? null,
  }));
  const rooms: RoomLead[] = ep.places.map((pl) => ({
    placeId: pl.id,
    unvisited: pl.id !== ep.startPlaceId && !has(s, `place:${pl.id}`),
    unexamined: whatIsHere(ep, s, pl.id).filter((e) => !proofEligible(s, e.id)).length,   // a locked partial card is still a lead
    unheard: whoIsHere(ep, s, pl.id).reduce((n, p) => n + unheardOf(ep, s, p.id), 0),
  }));
  const open = rooms.reduce((n, r) => n + r.unexamined + r.unheard + (r.unvisited ? 1 : 0), 0)
    + people.filter((p) => !p.crossed && s.cards.some((c) => c.kind === 'statement' && c.personId === p.personId)).length;
  // statements that will open later (availableFrom in the future) are not fetchable now, but they mean the ship is not done
  const openLater = ep.statements.filter((st) => st.availableFrom !== undefined && s.clock < st.availableFrom && !has(s, st.id)).length;
  return { people, rooms, open, openLater };
}

/** Coverage fires at a share of provable propositions, not all of them (Her Story prompts on "enough" key clips):
 *  a case has decoys and side-threads, and "all nine" would make the line fire after the accusation is obvious. */
export const COVERAGE_SHARE = 0.75;
/** How many provable propositions already have a full proving set on the notebook. */
export function coverage(ep: Episode, s: RunState): Coverage {
  const provable = ep.propositions.filter((p) => p.provedBy.length > 0);
  const covered = provable.filter((p) => p.provedBy.some((set) => set.every((id) => proofEligible(s, id)))).length;
  return { covered, provable: provable.length, complete: provable.length > 0 && covered >= Math.ceil(provable.length * COVERAGE_SHARE) };
}

/** Watson's structural prompt (Her Story's "do you think you understand?") is earned when the notebook covers
 *  enough provable propositions, or when the ship truly has nothing left to give — now or later. Says nothing about who. */
export function fetchStatus(ep: Episode, s: RunState): FetchStatus {
  const l = leads(ep, s);
  return coverage(ep, s).complete || (l.open === 0 && l.openLater === 0) ? 'nothing_left_to_fetch' : 'more_to_fetch';
}
