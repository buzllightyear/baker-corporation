# Depth-map parallax for the room paintings

Research: `docs/research/04-depth-and-motion.md` item 1 + item 5. This is the drop-in
implementation. Stream C owns `SceneStage.tsx`; everything below is the edit list.

| File | What it is |
| --- | --- |
| `src/ui/StageArt3D.tsx` | `three` + `postprocessing` canvas: cover-fit plane, UV-warp shader, vignette + grain + chromatic aberration, close-up zoom, Ken Burns |
| `src/ui/webgl.ts` | `hasWebGL()` feature probe (cached), `resetWebGLCache()` for tests |
| `src/ui/depth.ts` | `loadDepth()` → `DepthSampler`, `hotspotOffset()`, `PARALLAX_STRENGTH`, `PARALLAX_LERP` |
| `scripts/depth-maps.py` | offline generator for `public/art/rooms/*.depth.png` |
| `public/art/rooms/*.depth.png` | 10 maps, 768×432, greyscale, **white = near** |

## How it works, in one paragraph

The plane never moves. The fragment shader samples the painting at
`uv + mouse * strength * depth(uv)`, so near pixels slide further than far pixels and the
frame reads as a shallow diorama. Because the geometry is static, **DOM hotspots do not
move with the picture** unless you displace them yourself — that is what `hotspotOffset` is
for. The shader multiplies its parallax delta by the same cover-crop and zoom factors that
map screen to UV, which makes the on-screen displacement exactly `-mouse * strength * depth`
at any stage aspect ratio or zoom level. `hotspotOffset` computes precisely that, in pixels.

## SceneStage.tsx — the edits

**1. Imports** (after `import { goalTargets } from './tutorial';`):

```tsx
import { StageArt3D } from './StageArt3D';
import { hasWebGL } from './webgl';
import { loadDepth, hotspotOffset, flatSampler, PARALLAX_STRENGTH, type DepthSampler } from './depth';
const depthUrl = (image: string) => image.replace(/\.jpg$/, '.depth.png');
```

**2. State** (next to the existing `const [par, setPar] = ...`):

```tsx
  const gl = React.useMemo(() => hasWebGL(), []);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [dep, setDep] = React.useState<DepthSampler>(flatSampler);
```

**3. Load the depth map for the current room, and derive the hotspot style**
(after the existing `React.useEffect(() => { setPerson(null); setLook(null); }, [st.pos.holmes]);`):

```tsx
  const artImage = art?.image ?? null;
  React.useEffect(() => {
    if (!gl || !artImage) { setDep(flatSampler()); return; }
    let live = true;
    loadDepth(depthUrl(artImage)).then((s) => { if (live) setDep(s); });
    return () => { live = false; };
  }, [gl, artImage]);
  const hotStyle = (x: number, y: number): React.CSSProperties => {
    const box = stageRef.current;
    const off = gl && dep.ok && box
      ? hotspotOffset(dep, x / 100, y / 100, par, PARALLAX_STRENGTH, box.clientWidth, box.clientHeight)
      : { dx: 0, dy: 0 };
    return { left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) translate(${off.dx}px, ${off.dy}px)`, transition: 'transform 120ms linear' };
  };
```

`translate(-50%, -50%)` has to be repeated because an inline `transform` overrides the one
`.hot` sets in `theme.css`. The `120ms linear` transition matches the shader's uniform
smoothing (`PARALLAX_LERP = 0.15` per frame at 60fps) so the marker and the picture arrive
together; without it the hotspot snaps ahead of the painting.

**4. The stage element** — take a ref, and swap the art div for the canvas when WebGL is up:

```diff
-    <div className={'stage' + (img === 'ok' ? ' has-art' : '')} onMouseMove={onMove} onMouseLeave={() => setPar({ x: 0, y: 0 })}>
-      <div className="stage-art" style={img === 'ok' && art ? { backgroundImage: `url(${art.image})`, transform: `scale(1.06) translate(${-par.x * 14}px, ${-par.y * 10}px)` } : undefined} />
+    <div ref={stageRef} className={'stage' + (img === 'ok' ? ' has-art' : '')} onMouseMove={onMove} onMouseLeave={() => setPar({ x: 0, y: 0 })}>
+      {img === 'ok' && art && gl
+        ? <StageArt3D image={art.image} depth={depthUrl(art.image)} parallax={par} zoom={closeup} />
+        : <div className="stage-art" style={img === 'ok' && art ? { backgroundImage: `url(${art.image})`, transform: `scale(1.06) translate(${-par.x * 14}px, ${-par.y * 10}px)` } : undefined} />}
```

**5. The two hotspot rows** — replace the inline position object with `hotStyle`:

```diff
-        <button key={e.id} className={'hot evidence' + (goal.evidence === e.id ? ' goal' : '')} style={{ left: `${h.x}%`, top: `${h.y}%` }} aria-label={pick(e.name, lang)} title={pick(e.name, lang)}
+        <button key={e.id} className={'hot evidence' + (goal.evidence === e.id ? ' goal' : '')} style={hotStyle(h.x, h.y)} aria-label={pick(e.name, lang)} title={pick(e.name, lang)}
```

```diff
-        <button key={p.id} className={'hot person' + (person === p.id ? ' on' : '') + (goal.person === p.id ? ' goal' : '')} style={{ left: `${h.x}%`, top: `${h.y}%` }} aria-label={pick(p.name, lang)} onClick={...}>
+        <button key={p.id} className={'hot person' + (person === p.id ? ' on' : '') + (goal.person === p.id ? ' goal' : '')} style={hotStyle(h.x, h.y)} aria-label={pick(p.name, lang)} onClick={...}>
```

Exits are anchored to the frame, not to the picture, so they keep `EXIT_POS` untouched.
No change to `theme.css`: `StageArt3D` positions its own host with an inline
`position: absolute; inset: 0`, and it is the first child of `.stage`, so hotspots still
stack above it.

## The evidence close-up (`zoom`)

`zoom` is `{ x, y, scale } | null` where `x`/`y` are **stage fractions, 0..1** — divide the
`art.ts` percentages by 100. The shader eases toward it (`ZOOM_LERP = 0.12`/frame) and back
to the wide shot on `null`, so a single piece of state is the whole animation:

```tsx
  const [closeup, setCloseup] = React.useState<{ x: number; y: number; scale: number } | null>(null);
  // in the evidence onClick, after dispatch succeeds:
  setCloseup({ x: h.x / 100, y: h.y / 100, scale: 1.9 });
  // in the existing `React.useEffect(..., [st.pos.holmes])` and wherever `setLook(null)` fires:
  setCloseup(null);
```

Caveat: `hotspotOffset` accounts for the parallax, not for the zoom. While a close-up is
active the hotspots stay at their wide-shot positions, which is fine when the close-up
darkens or replaces them (the `look` card already covers the frame); if Stream C wants the
markers to track *into* the zoom, multiply their offset from the zoom centre by
`closeup.scale` as well.

## Fallbacks

* **No WebGL** — `hasWebGL()` is false, `StageArt3D` returns `null`, and the branch above
  keeps the existing `.stage-art` div verbatim. Nothing else changes. `hotStyle` also
  short-circuits to plain `left`/`top`, so hotspots behave exactly as they do today.
* **No depth map for a room** — pass `depth={undefined}`. The shader falls back to a flat
  0.5 depth (a uniform CSS-like parallax) and adds a slow Ken Burns push: 0.4% scale over a
  12s cycle, so the frame is never dead still. `loadDepth` resolves to `flatSampler()` with
  `ok: false`, so `hotStyle` leaves hotspots alone. `loadDepth` never rejects.
* **Context creation fails after the probe** (blocklisted GPU, lost context) — the mount
  effect catches it and leaves an empty host div. Worth pairing with the fallback div if
  that ever shows up in the wild.

## ChatGPT embed caveat

**WebGL in the ChatGPT app-embed iframe sandbox is undocumented and untested.** Treat the
CSS path as the one that must always work:

* Never make the 3D path load-bearing for gameplay. Hotspots, hit areas, and the evidence
  card all work identically with `gl === false`; only the picture's motion differs.
* `three` and `postprocessing` are behind a **dynamic import inside `StageArt3D`'s mount
  effect**, which only runs after `hasWebGL()` passes. An embed that blocks WebGL never
  downloads them. Keep it that way — a static `import 'three'` at the top of `SceneStage`
  would put ~145 kB gzip back on the critical path for every viewer.
* Gyroscope is likely blocked in the sandbox too, so `parallax` stays mouse-only. On touch,
  leave it at `{ x: 0, y: 0 }` and let Ken Burns carry the motion.

## Bundle cost (measured, `npm run build`)

| Chunk | Before | After |
| --- | --- | --- |
| `index.js` (critical path) | 300.97 kB / 99.06 kB gzip | 309.57 kB / 102.98 kB gzip |
| `three.module.js` (lazy) | — | 724.23 kB / 184.67 kB gzip |
| `postprocessing` (lazy) | — | 320.52 kB / 112.15 kB gzip |

So +3.9 kB gzip for everyone, +297 kB gzip only on WebGL devices, fetched in parallel with a
room JPEG that is already 320–460 kB. Note that rolldown does *not* tree-shake across the
dynamic-import boundary: bundling `three` eagerly costs 568 kB raw instead of 1045 kB, but
puts all of it on the critical path. If the 3D path ever becomes unconditional, revisit.

## Regenerating the depth maps

```bash
uv venv --python 3.12 /tmp/depth-venv
uv pip install --python /tmp/depth-venv/bin/python torch torchvision transformers pillow
/tmp/depth-venv/bin/python scripts/depth-maps.py --force
```

`depth-anything/Depth-Anything-V2-Small-hf` on CPU, ~0.3 s per 1536×864 plate plus ~8 s of
model load. Output is normalized so **white = near**; check a new map against its plate
before trusting it — an inverted map makes the whole scene move backwards. `--pseudo` emits
a luminance + vertical-gradient stand-in with no torch, clearly labelled in the output; it is
a stopgap, not a depth estimate.

## Knobs

| Constant | Where | Value | Why |
| --- | --- | --- | --- |
| `PARALLAX_STRENGTH` | `depth.ts` | `0.03` | 2–4%; above that silhouettes visibly smear |
| `PARALLAX_LERP` | `depth.ts` | `0.15`/frame | mirror in CSS as `transition: transform 120ms linear` |
| `MARGIN` | `StageArt3D.tsx` | `0.02` | UV clamp guard; the vignette hides the edge smear it causes |
| `KEN_AMPLITUDE` / `KEN_PERIOD` | `StageArt3D.tsx` | `0.004` / `12s` | depth-less rooms only |
| `ZOOM_LERP` | `StageArt3D.tsx` | `0.12`/frame | close-up ease |
| noise opacity / vignette | `StageArt3D.tsx` | `0.055` / `offset .28, darkness .52` | grain and falloff |

## Verification

`tests/depth.test.ts` covers the `hotspotOffset` math (sign, linearity in depth, the
centred-pointer no-op, the 3% bound) and `hasWebGL()` under jsdom; `tests/stage-art-3d.test.tsx`
asserts the component renders nothing without WebGL.

Measured in headless Chromium with SwiftShader at 1440×828, sweeping the pointer across the
full width of `corridor_a` (Δmouse = 0.76):

| Region | Depth | Screen shift |
| --- | --- | --- |
| near wall, left | ~0.46 | −15 px |
| boot-print floor | 0.655 | −20 px |
| corridor vanishing point | ~0.0 | 0 px |

The `e_bootprint` hotspot moved −21.69 px against a measured content shift of −20 px and a
predicted −21.5 px, i.e. it stays glued to its content within ~1.7 px across a 1440 px stage.
The residual is the cover-crop: `hotspotOffset` samples the depth map at the *stage* fraction
rather than the cover-corrected picture UV, which is a ≤2% coordinate error on a 16:9 stage.
A flat parallax would have moved all three regions equally — the far/near split is the proof
the depth map is doing the work.
