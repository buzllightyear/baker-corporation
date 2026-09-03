// Depth-map parallax for the room paintings (the LeiaPix / Immersity "fake 3D" trick).
//
// One full-bleed plane, cover-fitted like `background-size: cover`, with a fragment shader that
// offsets the sampled UV by `mouse * strength * depth`. Geometry never moves, so DOM hotspots
// layered on top must apply the same displacement on the CPU — see `hotspotOffset` in ./depth.
// Wrapped in grain + vignette + a whisker of chromatic aberration so the frame reads as film.
//
// Renders nothing without WebGL (`hasWebGL()`); the caller keeps the CSS `.stage-art` div for that.
// `three` and `postprocessing` are pulled in by dynamic import *after* the WebGL probe passes, so
// the ~145 kB gzip of 3D never lands on the critical path of a device (or a ChatGPT embed) that
// cannot use it.

import React from 'react';
import type {
  DataTexture,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Texture,
  TextureLoader,
  Timer,
  Vector2,
  WebGLRenderer,
} from 'three';
import type { EffectComposer } from 'postprocessing';
import { hasWebGL } from './webgl';
import { PARALLAX_LERP, PARALLAX_STRENGTH } from './depth';

/** Zoom target for the evidence close-up. `x`/`y` are stage fractions (0..1), not percentages. */
export interface StageZoom {
  x: number;
  y: number;
  scale: number;
}

export interface StageArt3DProps {
  /** Room painting, e.g. `/art/rooms/bridge.jpg`. */
  image: string;
  /** Greyscale depth map, e.g. `/art/rooms/bridge.depth.png`. Omit for flat parallax + Ken Burns. */
  depth?: string;
  /** Pointer offset from stage centre, -0.5..0.5 on both axes. */
  parallax: { x: number; y: number };
  /** Close-up target, or null/undefined for the wide shot. */
  zoom?: StageZoom | null;
  className?: string;
}

const MARGIN = 0.02;          // UV clamp guard; the vignette hides the resulting edge smear
const KEN_AMPLITUDE = 0.004;  // 0.4% scale oscillation, depth-less rooms only
const KEN_PERIOD = 12;        // seconds
const ZOOM_LERP = 0.12;

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Screen -> cover-fitted picture UV -> zoom about the close-up point -> depth-scaled parallax.
// Because the parallax delta is multiplied by the same `cover / zoom` that maps screen to UV,
// the on-screen displacement is exactly `-mouse * strength * depth` at any aspect or zoom.
// `hotspotOffset` in ./depth relies on that.
const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uImage;
uniform sampler2D uDepth;
uniform vec2 uCover;
uniform vec2 uMouse;
uniform vec2 uZoomCenter;
uniform float uZoom;
uniform float uKen;
uniform float uStrength;
uniform float uHasDepth;
varying vec2 vUv;

void main() {
  vec2 cover = uCover * uKen;
  vec2 base = (vUv - 0.5) * cover + 0.5;
  vec2 zc = (uZoomCenter - 0.5) * cover + 0.5;
  vec2 uv = zc + (base - zc) / uZoom;
  float d = uHasDepth > 0.5 ? texture2D(uDepth, clamp(uv, 0.0, 1.0)).r : 0.5;
  vec2 delta = uMouse * uStrength * d * cover / uZoom;
  vec2 warped = clamp(uv + delta, MARGIN_C, 1.0 - MARGIN_C);
  gl_FragColor = texture2D(uImage, warped);
}
`.replace(/MARGIN_C/g, MARGIN.toFixed(4));

interface Sources {
  image: string;
  depth?: string;
}

interface Engine {
  renderer: WebGLRenderer;
  composer: EffectComposer;
  scene: Scene;
  camera: OrthographicCamera;
  mesh: Mesh<PlaneGeometry, ShaderMaterial>;
  material: ShaderMaterial;
  timer: Timer;
  loader: TextureLoader;
  blank: DataTexture;
  makeVec2: (x: number, y: number) => Vector2;
  imageTexture: Texture | null;
  depthTexture: Texture | null;
  imageAspect: number;
  size: { w: number; h: number };
  /** Bumped on every source change so late-arriving texture loads can be discarded. */
  token: number;
  resize: () => void;
}

/** Cover-fit factor: the fraction of the picture sampled on each axis. */
function coverFactor(imageAspect: number, stageAspect: number): { x: number; y: number } {
  return stageAspect > imageAspect
    ? { x: 1, y: imageAspect / stageAspect }
    : { x: stageAspect / imageAspect, y: 1 };
}

function applyCover(engine: Engine): void {
  const c = coverFactor(engine.imageAspect, engine.size.w / Math.max(1, engine.size.h));
  (engine.material.uniforms.uCover.value as Vector2).set(c.x, c.y);
}

/** (Re)load the picture and its depth map into the engine's uniforms. */
function applyTextures(engine: Engine, src: Sources, prepare: (t: Texture, srgb: boolean) => Texture): void {
  const token = ++engine.token;
  const u = engine.material.uniforms;

  engine.loader.loadAsync(src.image).then(
    (tex) => {
      if (token !== engine.token) { tex.dispose(); return; }
      engine.imageTexture?.dispose();
      engine.imageTexture = prepare(tex, true);
      const img = tex.image as { width?: number; height?: number } | undefined;
      engine.imageAspect = (img?.width ?? 16) / (img?.height ?? 9);
      u.uImage.value = engine.imageTexture;
      applyCover(engine);
    },
    () => undefined,
  );

  const flat = () => {
    if (token !== engine.token) return;
    engine.depthTexture?.dispose();
    engine.depthTexture = null;
    u.uDepth.value = engine.blank;
    u.uHasDepth.value = 0;
  };

  if (!src.depth) { flat(); return; }
  engine.loader.loadAsync(src.depth).then(
    (tex) => {
      if (token !== engine.token) { tex.dispose(); return; }
      engine.depthTexture?.dispose();
      engine.depthTexture = prepare(tex, false);
      u.uDepth.value = engine.depthTexture;
      u.uHasDepth.value = 1;
    },
    flat,
  );
}

export function StageArt3D({ image, depth, parallax, zoom, className }: StageArt3DProps) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const engineRef = React.useRef<Engine | null>(null);
  const prepareRef = React.useRef<((t: Texture, srgb: boolean) => Texture) | null>(null);
  const targetRef = React.useRef({ parallax, zoom: zoom ?? null });
  const sourcesRef = React.useRef<Sources>({ image, depth });
  const [enabled] = React.useState(hasWebGL);

  targetRef.current = { parallax, zoom: zoom ?? null };
  sourcesRef.current = { image, depth };

  // Scene, composer and render loop. Created once, after `three` has been fetched.
  React.useEffect(() => {
    const host = hostRef.current;
    if (!enabled || !host) return;

    let disposed = false;
    let teardown: (() => void) | null = null;

    void (async () => {
      const [THREE, PP] = await Promise.all([import('three'), import('postprocessing')]);
      if (disposed || !hostRef.current) return;

      let renderer: WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
      } catch {
        return; // context creation can still fail after the probe (blocklisted GPU, lost context)
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
      host.appendChild(renderer.domElement);

      const blank = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat);
      blank.colorSpace = THREE.NoColorSpace;
      blank.needsUpdate = true;

      const prepare = (tex: Texture, srgb: boolean): Texture => {
        tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        return tex;
      };
      prepareRef.current = prepare;

      const material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uImage: { value: blank },
          uDepth: { value: blank },
          uCover: { value: new THREE.Vector2(1, 1) },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uZoomCenter: { value: new THREE.Vector2(0.5, 0.5) },
          uZoom: { value: 1 },
          uKen: { value: 1 },
          uStrength: { value: PARALLAX_STRENGTH },
          uHasDepth: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      mesh.frustumCulled = false;
      const scene = new THREE.Scene();
      scene.add(mesh);
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const composer = new PP.EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
      composer.addPass(new PP.RenderPass(scene, camera));
      const chroma = new PP.ChromaticAberrationEffect({
        offset: new THREE.Vector2(0.0004, 0.0004),
        radialModulation: true,
        modulationOffset: 0.15,
      });
      const noise = new PP.NoiseEffect({ blendFunction: PP.BlendFunction.OVERLAY, premultiply: true });
      noise.blendMode.opacity.value = 0.055;
      const vignette = new PP.VignetteEffect({ offset: 0.28, darkness: 0.52 });
      composer.addPass(new PP.EffectPass(camera, chroma, noise, vignette));

      const engine: Engine = {
        renderer, composer, scene, camera, mesh, material,
        timer: new THREE.Timer(),
        loader: new THREE.TextureLoader(),
        blank,
        makeVec2: (x, y) => new THREE.Vector2(x, y),
        imageTexture: null, depthTexture: null,
        imageAspect: 16 / 9, size: { w: 1, h: 1 },
        token: 0,
        resize: () => undefined,
      };

      engine.resize = () => {
        const w = Math.max(1, host.clientWidth);
        const h = Math.max(1, host.clientHeight);
        engine.size = { w, h };
        renderer.setSize(w, h, false);
        composer.setSize(w, h);
        applyCover(engine);
      };
      engine.resize();
      engineRef.current = engine;
      applyTextures(engine, sourcesRef.current, prepare);

      const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(engine.resize) : null;
      ro?.observe(host);
      window.addEventListener('resize', engine.resize);

      engine.timer.connect(document);
      const frame = () => {
        engine.timer.update();
        const dt = Math.min(engine.timer.getDelta(), 0.1);
        const u = material.uniforms;
        const { parallax: p, zoom: z } = targetRef.current;

        (u.uMouse.value as Vector2).lerp(engine.makeVec2(p.x, p.y), PARALLAX_LERP);
        (u.uZoomCenter.value as Vector2).lerp(engine.makeVec2(z ? z.x : 0.5, z ? z.y : 0.5), ZOOM_LERP);
        u.uZoom.value += ((z ? Math.max(1, z.scale) : 1) - (u.uZoom.value as number)) * ZOOM_LERP;

        // Rooms without a depth map get a slow Ken Burns push so the frame is never dead still.
        u.uKen.value = (u.uHasDepth.value as number) > 0.5
          ? 1
          : 1 - KEN_AMPLITUDE * (0.5 - 0.5 * Math.cos((engine.timer.getElapsed() / KEN_PERIOD) * Math.PI * 2));

        composer.render(dt);
      };

      const play = () => { engine.timer.reset(); renderer.setAnimationLoop(frame); };
      const pause = () => renderer.setAnimationLoop(null);
      const onVisibility = () => (document.visibilityState === 'hidden' ? pause() : play());
      document.addEventListener('visibilitychange', onVisibility);
      if (document.visibilityState !== 'hidden') play();

      teardown = () => {
        pause();
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('resize', engine.resize);
        ro?.disconnect();
        engine.timer.disconnect();
        engine.timer.dispose();
        engine.imageTexture?.dispose();
        engine.depthTexture?.dispose();
        blank.dispose();
        mesh.geometry.dispose();
        material.dispose();
        composer.dispose();
        renderer.dispose();
        renderer.domElement.remove();
        engineRef.current = null;
        prepareRef.current = null;
      };
      if (disposed) teardown();
    })();

    return () => { disposed = true; teardown?.(); };
  }, [enabled]);

  // Swap textures when the room changes.
  React.useEffect(() => {
    const engine = engineRef.current;
    const prepare = prepareRef.current;
    if (!enabled || !engine || !prepare) return; // the mount effect loads the first pair itself
    applyTextures(engine, { image, depth }, prepare);
  }, [enabled, image, depth]);

  if (!enabled) return null;
  return <div ref={hostRef} className={className} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }} />;
}

export default StageArt3D;
