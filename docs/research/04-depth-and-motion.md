# Research 4 — Depth & motion for static paintings (three.js)

Source: research subagent, 2026-09-04 01:40 KST.

1. **Depth-map parallax (UV-warp shader)** — offline Depth-Anything-V2 depth PNG per plate; fragment shader offsets UV by `mouse * strength * depth`. 1h setup + 10 min/scene. Payoff 4/5. Risks: silhouette smear, edge clamp → keep strength 2–4%, clamp UV with margin, vignette. Refs: Codrops "Fake 3D Image Effect", robin-dela CodePen, Codrops 2026 "Relighting with depth maps".
2. **Cutout layers (RMBG-1.4 / SAM2 + inpaint)** — true occlusion, 1–2h/scene. Best combined with 1 for hero scenes.
3. **Ambient overlays (payoff/hour)**: global post FX grain+vignette+CA (1h, multiplier) · emissive flicker mask image additive-blended (1h, 4/5) · dust in light beams via THREE.Points (2h, 5/5) · steam sprites (1h) · Ken Burns camera drift (0.5h, always).
4. **Room transitions** — crossfade + 5–8% zoom-through, 400–700ms; iris wipe for hatches. 1–2h. Payoff 4/5 — connective tissue sells "studio-made".
5. **Hotspots in 3D** — CSS2D markers; with UV-warp the geometry never moves, so compute the same depth-sampled offset on CPU for each marker or markers swim. 2h, critical.
6. **Embed constraints** — ChatGPT iframe sandbox: WebGL undocumented → feature-detect, fall back to CSS parallax; gyro likely blocked → mouse only.

**Tonight (3h):** plane + UV-warp shader with offline depth PNGs, postprocessing (vignette/grain/CA), depth-synced hotspots, GSAP crossfade+zoom, mouse parallax. **Next week:** cutout layers for hero scenes, dust particles, emissive masks, iris wipe, CSS fallback.
Versions: three@0.185.x, postprocessing@6.39.x, Depth-Anything-V2 offline (or onnx-community/depth-anything-v2-small).
