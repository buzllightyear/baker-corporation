// Room paintings and clickable hotspots. Coordinates are percentages of the 16:9 picture (x right, y down).
// A room without an entry, or without a picture file, renders the dark placeholder with the room description.
export interface Hotspot { x: number; y: number }
export type ExitDir = 'left' | 'right' | 'ahead' | 'back';
export interface RoomArt { image: string; evidence?: Record<string, Hotspot>; people?: Record<string, Hotspot>; exits?: Record<string, ExitDir> }
const R = (image: string, rest: Omit<RoomArt, 'image'> = {}): RoomArt => ({ image: `/art/rooms/${image}.jpg`, ...rest });
export const ROOM_ART: Record<string, Record<string, RoomArt>> = {
  ep0: {
    corridor: R('corridor_a', { evidence: { e_bootprint: { x: 19, y: 86 } }, people: { lind: { x: 50, y: 62 } }, exits: { medbay: 'left', galley: 'right', bunks: 'ahead' } }),
    medbay: R('medbay_ep0', { evidence: { e_safe: { x: 76, y: 40 } }, people: { okafor: { x: 38, y: 60 } }, exits: { corridor: 'back' } }),
    galley: R('galley', { evidence: { e_wrapper: { x: 66, y: 80 } }, people: { reyes: { x: 30, y: 62 }, lind: { x: 50, y: 66 } }, exits: { corridor: 'back' } }),
    bunks: R('quarters', { evidence: { e_locker: { x: 71, y: 50 } }, people: { lind: { x: 45, y: 66 } }, exits: { corridor: 'back' } }),
  },
  ep1: {
    bridge: R('bridge', { evidence: { e_nav_tablet: { x: 58, y: 57 } }, people: { vance: { x: 30, y: 66 }, sato: { x: 70, y: 66 } }, exits: { corridor_a: 'left', airlock: 'right' } }),
    corridor_a: R('corridor_a', { people: { vance: { x: 36, y: 64 }, sato: { x: 64, y: 64 }, reyes: { x: 50, y: 70 } }, exits: { medbay: 'left', galley: 'right', corridor_b: 'ahead', bridge: 'back' } }),
    medbay: R('medbay_ep1', { evidence: { e_bruise: { x: 62, y: 49 } }, people: { okafor: { x: 32, y: 64 } }, exits: { corridor_a: 'back' } }),
    galley: R('galley', { evidence: { e_coffee: { x: 78, y: 67 } }, people: { reyes: { x: 30, y: 64 }, lind: { x: 50, y: 68 } }, exits: { corridor_a: 'back' } }),
    corridor_b: R('corridor_b', { evidence: { e_boot: { x: 67, y: 90 } }, people: { lind: { x: 36, y: 66 }, sato: { x: 62, y: 66 } }, exits: { engine: 'ahead', cargo3: 'left', quarters: 'right', corridor_a: 'back' } }),
    engine: R('engine', { evidence: { e_code_note: { x: 66, y: 63 } }, people: { lind: { x: 36, y: 66 } }, exits: { corridor_b: 'back' } }),
    cargo3: R('cargo3', { evidence: { e_body: { x: 49, y: 79 }, e_sensor_panel: { x: 65, y: 38 } }, exits: { corridor_b: 'back' } }),
    quarters: R('quarters', { evidence: { e_haldane_ledger: { x: 9, y: 68 }, e_sato_jacket: { x: 51, y: 64 } }, people: { vance: { x: 32, y: 60 }, sato: { x: 70, y: 62 }, reyes: { x: 50, y: 60 } }, exits: { corridor_b: 'back' } }),
    airlock: R('airlock', { evidence: { e_glove: { x: 56, y: 85 } }, exits: { bridge: 'back' } }),
  },
};
export const PORTRAIT: Record<string, string> = { vance: '/art/portraits/vance.jpg', okafor: '/art/portraits/okafor.jpg', lind: '/art/portraits/lind.jpg', sato: '/art/portraits/sato.jpg', reyes: '/art/portraits/reyes.jpg', watson: '/art/portraits/watson.jpg' };
export function roomArt(episodeId: string, placeId: string): RoomArt | null { return ROOM_ART[episodeId]?.[placeId] ?? null; }
