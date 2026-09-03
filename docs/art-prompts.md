# Art prompts — The Baker Corporation

Generate in ChatGPT (image generation). **Paste the STYLE block first, then one ROOM block per image.** Keep the same chat so the style stays consistent. Save each PNG under the exact filename shown, into `public/art/rooms/` (rooms) or `public/art/portraits/` (people). Aspect **16:9** (landscape) for rooms, **1:1** for portraits.

Drop finished files into `~/Downloads/baker-art/` with the exact filenames and tell me — I move them, place the clickable hotspots on each picture, and redeploy.

## STYLE (paste once, at the top of every prompt)

> Hand-painted concept art for a point-and-click sci-fi mystery game. **First-person view, eye level, standing in the room, no people, no text, no UI.** Worn interstellar cargo freighter interior, decades old, everything bolted down and patched. Palette: muted teal steel, amber work-lights, cold white LEDs, deep shadows. Cinematic lighting, slight film grain, painterly brush texture, wide 24mm lens, 16:9. Objects mentioned must be clearly visible and readable as clickable props.

## ROOMS (10 unique pictures cover both episodes — reuse noted)

| # | File | Prompt (append after STYLE) |
|---|---|---|
| 1 | `bridge.png` | The bridge of the freighter *Marlow*. Three pilot consoles in a row, two of them dark, one alive with amber readouts. A docking countdown glows in the corner of every screen. A small navigation tablet rests on the live console. Forward viewport shows a slow starfield and the distant lights of a port. Hatch to the corridor on the left, airlock hatch on the right. |
| 2 | `corridor_a.png` | The forward corridor: a straight spine of deck plating, warm amber strip lights, pipe runs overhead, door hatches with small status panels — medbay hatch to port (left), galley hatch to starboard (right), the corridor continuing aft (straight ahead), bridge hatch behind. A cleaning robot parked far down the corridor. *(also used as Episode 0 "Main corridor"; include one faint greasy boot print on the deck near the left hatch)* |
| 3 | `medbay_ep0.png` | Ship medbay, cold white light. One empty berth, a wall-mounted drug safe bolted to the bulkhead — its door hanging **open**, empty shelves inside. Medical cabinets, a steel sink, a small desk with a stock sheet. Nobody present. |
| 4 | `medbay_ep1.png` | Ship medbay, cold white light. Two berths; on the far berth a body under a white sheet, a shape only. A wall-mounted drug cabinet with a heavy lock, medical cabinets, a steel tray with cleaned instruments, a desk lamp. Somber, still. |
| 5 | `galley.png` | The freighter's galley, the only warm room on the ship. Steel counters, a stove with a pot, hanging utensils, a small table with **two cups**, a wall clock, a waste bin by the door with a **foil scrap** on the floor beside it. Warm amber light, steam. *(used by both episodes)* |
| 6 | `corridor_b.png` | The aft corridor: grated deck, hydraulic lines overhead, a slow drip forming a small puddle, red emergency light strips. Hatches: engine room straight ahead (loud, glowing), cargo bay 3 to port with a heavy sealed door and a pressure readout, crew quarters to starboard with a curtain half-drawn behind the hatch. One **boot print** on the grating. |
| 7 | `engine.png` | Engine room: a big humming drive core behind a safety rail, coolant pipes, tool racks arranged with obsessive tidiness, a workbench with a **scrap of paper** pinned under a wrench, warning stripes, heat shimmer, orange light. |
| 8 | `cargo3.png` | Cargo bay 3: sealed freight crates stacked two high, frost on the metal, breath-cold blue light. By the inner hatch a **pressure sensor housing** with a small open panel and a maintenance light blinking. On the deck between crates a taped outline where a body lay, a dark stain. |
| 9 | `quarters.png` | Crew quarters: nine bunks in three tiers, six curtains drawn, personal lockers with stickers and dents. On one bunk a folded **navigator's jacket** with tape residue on the sleeve; on a shelf a battered **ledger** book. Dim, private, one reading lamp on. *(also used as Episode 0 "Crew bunks" — include one locker slightly ajar)* |
| 10 | `airlock.png` | The airlock: outer hatch furred with frost, inner control panel showing "LAST CYCLE: TITAN", suit lockers, a single **work glove** dropped on the deck, harsh white light, cold vapor. |

Episode 0 uses: `corridor_a` (Main corridor), `medbay_ep0`, `galley`, `quarters` (Crew bunks).
Episode 1 uses: all of 1, 2, 4, 5, 6, 7, 8, 9, 10.

## PORTRAITS (5, optional — the game works without them)

> STYLE for portraits: Painted character portrait for a sci-fi mystery game, bust, facing slightly left, neutral expression with one telling detail, dark plain background, same palette and brush texture as the rooms, 1:1, no text.

| File | Prompt |
|---|---|
| `vance.png` | Captain Iris Vance, master of an old freighter, 50s, grey cropped hair, worn captain's jacket with a faded Baker Corporation patch, tired authority. |
| `okafor.png` | Dr. Ada Okafor, ship's doctor, 40s, calm, sleeves rolled, a stethoscope, eyes that have decided something. |
| `lind.png` | Teo Lind, engineer, late 20s, grease on the jaw, tool harness, restless hands, a smile that is trying too hard. |
| `sato.png` | Kei Sato, navigator, 30s, composed, neat uniform, a jacket sleeve with a faint strip of tape residue, unreadable. |
| `reyes.png` | Mara Reyes, cook, 60s, apron, forearms of a working life, watchful and kind. |

Episode 0 reuses `okafor`, `lind`, `reyes`.

## Watson (optional, 1)

`watson.png` — A Baker Corporation service unit: a compact, well-worn maintenance robot with a single amber sensor eye, dented teal chassis, a corporate serial stencil half rubbed off. Bust, 1:1, dark background.
