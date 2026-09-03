// src/kernel/presence.ts — who moved between two clock readings.
//
// The crew keep a manifest (`ep.presence`): a person is in one room for a
// window of ship minutes, then another. The kernel already answers "who is
// here now"; this answers "who changed rooms while the clock advanced", so
// the stage can say so instead of letting a player conclude the ship has two
// engineers. Pure: episode + two clocks in, moves out.
import type { Episode } from '../../content/types';

export interface CrewMove { personId: string; from: string | null; to: string | null }

/** Room a person occupies at `clock`, or null when the manifest has no window for them. */
export function placeAt(ep: Episode, personId: string, clock: number): string | null {
  return ep.presence.find((p) => p.personId === personId && clock >= p.from && clock < p.to)?.placeId ?? null;
}

/** Every crew member whose room at `after` differs from their room at `before`, in manifest order. */
export function crewMoves(ep: Episode, before: number, after: number): CrewMove[] {
  if (before === after) return [];
  return ep.people.flatMap((p) => {
    const from = placeAt(ep, p.id, before), to = placeAt(ep, p.id, after);
    return from === to ? [] : [{ personId: p.id, from, to }];
  });
}
