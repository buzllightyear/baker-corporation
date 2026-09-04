// Room paintings and clickable hotspots. Coordinates are percentages of the 16:9 picture (x right, y down).
// A room without an entry, or without a picture file, renders the dark placeholder with the room description.
export interface Hotspot { x: number; y: number }
export type ExitDir = 'left' | 'right' | 'ahead' | 'back';
export interface RoomArt { image: string; evidence?: Record<string, Hotspot>; people?: Record<string, Hotspot>; exits?: Record<string, ExitDir> }
const R = (image: string, rest: Omit<RoomArt, 'image'> = {}): RoomArt => ({ image: `/art/rooms/${image}.jpg`, ...rest });
export const ROOM_ART: Record<string, Record<string, RoomArt>> = {
  ep0: {
    corridor: R('corridor_a', { evidence: { e_bootprint: { x: 32, y: 77 } }, people: { lind: { x: 50, y: 62 } }, exits: { medbay: 'left', galley: 'right', bunks: 'ahead' } }),
    medbay: R('medbay_ep0', { evidence: { e_safe: { x: 84, y: 27 } }, people: { okafor: { x: 45, y: 62 } }, exits: { corridor: 'back' } }),
    galley: R('galley', { evidence: { e_wrapper: { x: 72, y: 80 } }, people: { reyes: { x: 44, y: 60 }, lind: { x: 60, y: 63 } }, exits: { corridor: 'back' } }),
    bunks: R('quarters', { evidence: { e_locker: { x: 12, y: 45 } }, people: { lind: { x: 45, y: 70 } }, exits: { corridor: 'back' } }),
  },
  ep1: {
    bridge: R('bridge', { evidence: { e_nav_tablet: { x: 60, y: 55 } }, people: { vance: { x: 30, y: 68 }, sato: { x: 72, y: 68 } }, exits: { corridor_a: 'left', airlock: 'right' } }),
    corridor_a: R('corridor_a', { people: { vance: { x: 36, y: 64 }, sato: { x: 64, y: 64 }, reyes: { x: 50, y: 70 } }, exits: { medbay: 'left', galley: 'right', corridor_b: 'ahead', bridge: 'back' } }),
    medbay: R('medbay_ep1', { evidence: { e_bruise: { x: 49, y: 38 } }, people: { okafor: { x: 24, y: 52 } }, exits: { corridor_a: 'back' } }),
    galley: R('galley', { evidence: { e_coffee: { x: 88, y: 72 } }, people: { reyes: { x: 44, y: 60 }, lind: { x: 60, y: 63 } }, exits: { corridor_a: 'back' } }),
    corridor_b: R('corridor_b', { evidence: { e_boot: { x: 47, y: 92 } }, people: { lind: { x: 30, y: 66 }, sato: { x: 66, y: 66 } }, exits: { engine: 'ahead', cargo3: 'left', quarters: 'right', corridor_a: 'back' } }),
    engine: R('engine', { evidence: { e_code_note: { x: 87, y: 82 } }, people: { lind: { x: 33, y: 70 } }, exits: { corridor_b: 'back' } }),
    cargo3: R('cargo3', { evidence: { e_body: { x: 52, y: 76 }, e_sensor_panel: { x: 49, y: 34 } }, exits: { corridor_b: 'back' } }),
    quarters: R('quarters', { evidence: { e_haldane_ledger: { x: 88, y: 32 }, e_sato_jacket: { x: 52, y: 48 } }, people: { vance: { x: 30, y: 72 }, sato: { x: 70, y: 72 }, reyes: { x: 50, y: 78 } }, exits: { corridor_b: 'back' } }),
    airlock: R('airlock', { evidence: { e_glove: { x: 57, y: 89 } }, exits: { bridge: 'back' } }),
  },
};
export const PORTRAIT: Record<string, string> = { vance: '/art/portraits/vance.jpg', okafor: '/art/portraits/okafor.jpg', lind: '/art/portraits/lind.jpg', sato: '/art/portraits/sato.jpg', reyes: '/art/portraits/reyes.jpg', watson: '/art/portraits/watson.jpg' };
export function roomArt(episodeId: string, placeId: string): RoomArt | null { return ROOM_ART[episodeId]?.[placeId] ?? null; }
/** Where a hotspot sits in the room picture, for the close-up zoom origin and Watson's targeting pulse. Falls back to the stage's own default. */
export function hotspot(episodeId: string, placeId: string, targetId: string): Hotspot | null {
  const a = roomArt(episodeId, placeId); if (!a) return null;
  return a.evidence?.[targetId] ?? a.people?.[targetId] ?? null;
}
