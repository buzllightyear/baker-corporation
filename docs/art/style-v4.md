# Style Block v4 — "painted 3D" for The Baker Corporation (2026-09-04)

Derived from `docs/research/06a-arcane-pipeline.md`, `06b-arcane-visual-language.md`, `06c-arcane-prompting.md`. This file is the frozen anchor: paste the STYLE block verbatim (last in the prompt), never paraphrase. Character bibles are pasted verbatim in the SUBJECT slot; identity anchors are attached with `codex exec -i <file>`.

## STYLE (fixed — paste last, verbatim)

STYLE (fixed): Stylized 3D concept art finished with hand-painted textures — oil and gouache brushed over clean sculpted forms, the way a 2D animation studio paints its 3D sets. Paint, don't shade: shading, grime and edge wear are painted into the surfaces; no glossy CG speculars, no smooth gradients. Shadows are authored graphic shapes with hard edges. Figure/ground separation comes from value contrast and one coloured rim/kicker light, never from ink outlines; edges are crisp where forms meet and softer into depth. Visible directional brushstrokes on hair, cloth, metal and background; hair painted as chunky rim-lit clumps. Faces clean and readable: sharp graphic facial planes, sculpted cheekbones, defined jaw, tight edges, eyes slightly enlarged with hard lids and one specular dot; brushwork never crosses eyes or mouth. Two-tone lighting: one key colour and one hard clashing rim (indigo/gold or teal/amber), deep crushed shadows. Palette muted and desaturated with a few saturated accents. Smoke, dust and haze are flat painted 2D layers. Background is a loose matte painting with less detail than the figure. Everything shares one painted language — props, characters and set in the same medium. Faint canvas grain in the flats. Stylized realism, not cartoon exaggeration. Avoid: photorealism, 8K, octane, unreal engine, smooth CG shading, soft focus, DSLR, anime, cel-shading, lineart, blur, extra text.

## Series palette line (append to STYLE for world shots)

Series palette: indigo-violet #2b2a5e, blue-white #cfe3ff, gold #d9b56a; the Baker Corporation is gold thin lines on black glass; Watson is teal #5fd1c8 with an amber eye #ffa640.

## Character bibles (verbatim, one variable changed per image)

- **HOLMES** — SHERLOCK HOLMES, Baker Corporation consulting investigator, tag H-221B: mid-30s, lean, angular jaw, high cheekbones, straight nose, dark unruly hair in chunky clumps swept left, pale cool skin, narrow grey eyes; long charcoal coat #2a2c31 with a high standing collar, black gloves, a small gold Baker pin on the left lapel; one asymmetry: a thin old scar through the right eyebrow. Colours: #2a2c31 #0b0d12 #d9b56a #cfe3ff #6b6f78. Keep the same face, hair, coat and proportions.
- **WATSON** — WATSON, Baker Corporation service unit W-24-7: chest-high maintenance robot, boxy lamp-shaped head with ONE large round amber sensor eye #ffa640, dented teal chassis #5fd1c8 with chipped paint and rust, stencilled serial "W-24-7" half rubbed off on the chest, articulated arms with three-finger grippers, short sturdy legs, no cape, no other face features. Colours: #5fd1c8 #2f5a5c #ffa640 #6b4a2a #cfe3ff. Keep the same head shape, eye, chassis and proportions.
- **VANCE** — Captain Iris Vance, master of the freighter Marlow: 50s, grey cropped hair, square jaw, weathered skin, worn dark captain's jacket with a faded gold Baker patch on the shoulder, tired authority. Colours: #1f2a33 #7a7f86 #d9b56a #cfe3ff #3c2e23.
- **OKAFOR** — Dr. Ada Okafor, ship's doctor: 40s, dark skin, short natural hair, calm face with decided eyes, sleeves rolled, a stethoscope, navy work coveralls with a white cross patch. Colours: #1c2233 #bfe9d0 #cfe3ff #2b2a5e #d9b56a.
- **LIND** — Teo Lind, engineer: late 20s, grease on the jaw, messy brown hair, a tool harness over an amber-stained work shirt, restless hands, a smile trying too hard. Colours: #3b2a1e #ffa640 #6b4a2a #2a2c31 #cfe3ff.
- **SATO** — Kei Sato, navigator: 30s, composed, black hair cut neat, neat dark uniform with a thin gold piping, a faint strip of tape residue on the left cuff, unreadable expression. Colours: #1c2233 #d9b56a #cfe3ff #2b2a5e #7a4fb5.
- **REYES** — Mara Reyes, cook: 60s, grey hair tied back, forearms of a working life, canvas apron over a teal work shirt, watchful and kind. Colours: #6b4a2a #5fd1c8 #d9b56a #3b2a1e #cfe3ff.

## Colour keys per set (from the colour script)
bridge blue-white/amber · fwd corridor grey-blue · medbay white-green #bfe9d0 · galley amber · aft corridor amber-rust · engine deep amber · cargo bay 3 violet #7a4fb5 · airlock cold white · tense state: shift toward magenta.

## Rules (from research)
1. Never name the show. "Stylized" alone drifts anime; the medium anchor leads.
2. Faces: structure before texture; brushwork on hair/cloth/background only.
3. One image = one variable changed; regenerate on drift, never edit.
4. Reference images: attach with `-i`; say what each image is for ("Image 1: identity anchor — keep face/body; do not copy its background or brushwork").
5. Sheets: neutral grey light, equal gutters, no labels (add in post).
6. UI mockups: "painted key-visual of a screen", labels in quotes, same STYLE block.
7. Class as height and light; two-character scenes staged by body angle, not expression.
8. Typography: flared engraved display face for names, hard geometric sans for UI.

## STYLE v5 (2026-09-04, after "why does it look like 2D oil illustration?")

Diagnosis: v4 weighted eight painterly tokens against one "sculpted 3D" clause and banned the very tokens (CG shading, render) that give solidity, so the model produced flat oil illustration. v5 declares the medium as a 3D animated film frame first, fixes lighting/camera/materials as 3D, and confines brushwork to surface texture.

STYLE (fixed): A single frame from a stylized 3D animated feature film — sculpted characters and sets with clean solid geometry, correct perspective and real volume. Form shading is fully 3D: one directional key light with cast shadows and contact shadows, ambient occlusion in the folds, subtle subsurface scattering on skin, one hard coloured rim light for separation, volumetric haze and light shafts, a cinematic 35mm lens with shallow depth of field. Surfaces carry HAND-PAINTED TEXTURES: visible brush marks, dry-brush wear, grime and chipped paint live inside the texture maps — the strokes follow the surface, they never replace the form. Faces are sculpted and readable: sharp planes, defined jaw, slightly enlarged eyes with a wet specular; hair is modelled as chunky sculpted clumps with painted strands. No ink outlines. Palette muted with a few saturated accents; two-tone lighting (indigo/gold or teal/amber). Painterly 3D look, like a prestige animated series that paints over its CG. Avoid: flat 2D illustration, oil painting on canvas, canvas grain, watercolour, sketch, photorealism, live-action, anime, cel-shading, lineart, extra text.

## Canon anchors (confirmed 2026-09-04)

- Holmes: `public/art/concept/canon/holmes-anchor.png` (crop of `canon/holmes-c.png`, director's pick). Born text-only from STYLE v5 + Fortiche grounding.
- Watson: `public/art/concept/canon/watson-anchor.png` (= `canon/watson-b.png`).
- Leak test passed: `canon/test-keyart.png` (both anchors, new composition/lighting) and `canon/test-holmes-neutral.png` keep identity AND the 3D finish.

Anchor rules learned today: an anchor must be **born text-only** (a 2D-finished reference drags every later image toward 2D regardless of the prompt), have a plain background, show every identity token, and be cropped to face/shoulders. One fixed file per character; never re-anchor on a descendant.
