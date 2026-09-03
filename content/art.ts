// Room paintings and clickable hotspots. Coordinates are percentages of the 16:9 picture (x right, y down).
// A room without an entry, or without a picture file, renders the dark placeholder with the room description.
export interface Hotspot { x: number; y: number }
export interface RoomArt { image: string; evidence?: Record<string, Hotspot>; people?: Record<string, Hotspot>; exits?: Record<string, 'left' | 'right' | 'ahead' | 'back'> }
const R = (image: string, rest: Omit<RoomArt, 'image'> = {}): RoomArt => ({ image: `/art/rooms/${image}.png`, ...rest });
export const ROOM_ART: Record<string, Record<string, RoomArt>> = {
  ep0: {
    corridor: R('corridor_a', { evidence: { e_bootprint: { x: 22, y: 82 } }, exits: { medbay: 'left', galley: 'right', bunks: 'ahead' } }),
    medbay: R('medbay_ep0', { evidence: { e_safe: { x: 70, y: 45 } }, exits: { corridor: 'back' } }),
    galley: R('galley', { evidence: { e_wrapper: { x: 84, y: 84 } }, exits: { corridor: 'back' } }),
    bunks: R('quarters', { evidence: { e_locker: { x: 78, y: 55 } }, exits: { corridor: 'back' } }),
  },
  ep1: {
    bridge: R('bridge', { evidence: { e_nav_tablet: { x: 52, y: 66 } }, exits: { corridor_a: 'left', airlock: 'right' } }),
    corridor_a: R('corridor_a', { exits: { medbay: 'left', galley: 'right', corridor_b: 'ahead', bridge: 'back' } }),
    medbay: R('medbay_ep1', { evidence: { e_bruise: { x: 62, y: 58 } }, exits: { corridor_a: 'back' } }),
    galley: R('galley', { evidence: { e_coffee: { x: 46, y: 64 } }, exits: { corridor_a: 'back' } }),
    corridor_b: R('corridor_b', { evidence: { e_boot: { x: 40, y: 84 } }, exits: { engine: 'ahead', cargo3: 'left', quarters: 'right', corridor_a: 'back' } }),
    engine: R('engine', { evidence: { e_code_note: { x: 30, y: 62 } }, exits: { corridor_b: 'back' } }),
    cargo3: R('cargo3', { evidence: { e_body: { x: 50, y: 78 }, e_sensor_panel: { x: 18, y: 50 } }, exits: { corridor_b: 'back' } }),
    quarters: R('quarters', { evidence: { e_haldane_ledger: { x: 30, y: 60 }, e_sato_jacket: { x: 72, y: 66 } }, exits: { corridor_b: 'back' } }),
    airlock: R('airlock', { evidence: { e_glove: { x: 56, y: 86 } }, exits: { bridge: 'back' } }),
  },
};
export const PORTRAIT: Record<string, string> = { vance: '/art/portraits/vance.png', okafor: '/art/portraits/okafor.png', lind: '/art/portraits/lind.png', sato: '/art/portraits/sato.png', reyes: '/art/portraits/reyes.png', watson: '/art/portraits/watson.png' };
export function roomArt(episodeId: string, placeId: string): RoomArt | null { return ROOM_ART[episodeId]?.[placeId] ?? null; }
