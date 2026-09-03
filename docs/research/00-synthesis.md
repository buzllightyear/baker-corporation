# Reference research — synthesis (2026-09-04 01:45 KST)

Three problems raised by the owner after playtest, mapped to what the research says to borrow.

## P1 · Chapter story and characters are not absorbed
- **Chapter title card + Watson recap** (TV case file). Full-bleed generated image, "EPISODE 0 · Titan, I Perceive", 3 lines from Watson in chat.
- **Cold-open cards** (FTL/Into the Breach briefing + Firewatch text prologue): 3–4 cards — ship & situation · the incident · **crew photo / manifest** (Obra Dinn) · your role & Watson. Skippable, re-openable.
- **Crew dossier** (Ace Attorney Court Record): topbar button → portrait, role, one line, last seen, statements collected. Persistent across episodes (Hades codex).
- **Dialogue view**: portrait large, name/role, typewriter line (Pentiment: per-speaker type/colour later).
- **"Tell me about X"**: Watson answers from cards (Her Story) — already possible via get_case; make it a habit in tutorial copy.

## P2 · No key visual in the UI
- Direction **A "Salvage Terminal"** (Alien: Isolation × Hardspace × Prey): Baker Corp wordmark + serial + stamp on every panel = *issued equipment*. Charcoal ground, amber phosphor, hazard yellow; Oswald/Big Shoulders Stencil headers, JetBrains Mono terminal text; **raster** frames with rivets/scratches (generated), boot flicker, scanline drift, vignette.
- Borrow **B** (paper grain, ink stamps) for notebook/hearing; **C** (green/cyan console) as Watson's own skin (Dead Space RIG logic).
- Hero art on Home (ship exterior) generated; portraits and rooms framed in A's riveted placard frame so the paintings stay untouched.
- Persona 5 lesson: commit everywhere, no exceptions.

## P3 · Interactions all feel like "click → card"
- **Evidence close-up** (The Room): zoom into the painting at the hotspot, description, pin, "ask Watson" chip.
- **Watson visible presence** (Elizabeth/Wheatley): minimap avatar walks, target hotspot pulses on his tool call; **ticker line** interjections (Disco Elysium).
- **Room transitions** (Myst/Riven): crossfade + zoom-through 500ms; iris wipe at hatches.
- **Ambient motion**: depth-map parallax (three.js UV-warp), grain/vignette, emissive flicker, dust in beams (later).
- Later: string board (Shadows of Doubt), fill-in accusation (Golden Idol), freeze-frame (Obra Dinn), sound.

## Proposed order
1. Title card · cold-open cards (with crew photo) · dossier button · dialogue view — **P1, ~90 min**
2. Direction A chrome: generated logo/frame/texture set via codex, fonts, panel frames, Home hero — **P2, ~60 min**
3. Evidence close-up · Watson ticker + minimap walk · room crossfade — **P3, ~60 min**
4. three.js depth parallax + post FX — **P3, ~2h**, after submission (needs depth PNGs per room)
