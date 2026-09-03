// CPU-side twin of the StageArt3D parallax shader.
//
// The shader never moves geometry — it warps UVs — so a hotspot drawn in the DOM on top of
// the canvas will *not* follow the picture unless we apply the same displacement here.
// `hotspotOffset` is that displacement, in stage pixels, and is derived from the same
// numbers the shader uses (see `PARALLAX_STRENGTH`, `PARALLAX_LERP`).

/** UV displacement per unit depth, as a fraction of the stage. Keep small: 2-4% or silhouettes smear. */
export const PARALLAX_STRENGTH = 0.03;
/** Per-frame smoothing on the mouse uniform. Mirror it in CSS as `transition: transform 120ms linear`. */
export const PARALLAX_LERP = 0.15;

export interface Vec2 {
  x: number;
  y: number;
}

export interface Offset {
  dx: number;
  dy: number;
}

export interface DepthSampler {
  readonly width: number;
  readonly height: number;
  /** False when the depth PNG could not be decoded; `sample` then returns a flat 0.5. */
  readonly ok: boolean;
  /** Bilinear depth in 0..1 at normalized picture coordinates (u right, v down). 1 = nearest. */
  sample(u: number, v: number): number;
}

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
/** Fold -0 into 0 so offsets stringify as `0px` rather than `-0px`. */
const unsigned = (n: number): number => (n === 0 ? 0 : n);

/** A sampler that reports mid-depth everywhere — used when a room has no depth map. */
export function flatSampler(value = 0.5): DepthSampler {
  const d = clamp01(value);
  return { width: 1, height: 1, ok: false, sample: () => d };
}

/** Build a sampler from already-decoded greyscale-ish RGBA pixels (test seam). */
export function samplerFromImageData(data: ImageData): DepthSampler {
  const { width, height, data: px } = data;
  if (width < 1 || height < 1) return flatSampler();
  const at = (x: number, y: number): number => {
    const cx = x < 0 ? 0 : x > width - 1 ? width - 1 : x;
    const cy = y < 0 ? 0 : y > height - 1 ? height - 1 : y;
    return px[(cy * width + cx) * 4] / 255;
  };
  return {
    width,
    height,
    ok: true,
    sample(u, v) {
      const fx = clamp01(u) * (width - 1);
      const fy = clamp01(v) * (height - 1);
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;
      const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
      const bottom = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
      return top * (1 - ty) + bottom * ty;
    },
  };
}

/**
 * Load a depth PNG and expose bilinear sampling over an offscreen canvas.
 * Never rejects: a missing or undecodable map resolves to `flatSampler()` with `ok: false`,
 * so callers can wire it in unconditionally.
 */
export function loadDepth(url: string): Promise<DepthSampler> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || typeof Image === 'undefined') {
      resolve(flatSampler());
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx || canvas.width < 1 || canvas.height < 1) {
          resolve(flatSampler());
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(samplerFromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height)));
      } catch {
        resolve(flatSampler());
      }
    };
    img.onerror = () => resolve(flatSampler());
    img.src = url;
  });
}

/**
 * Screen displacement, in px, for a hotspot anchored to picture content at (u, v).
 *
 * The shader samples at `uv + mouse * strength * depth`, so the content that lands under a
 * given screen point comes from further along the mouse vector — i.e. the picture appears to
 * move *against* the mouse. The shader compensates for cover-crop and zoom internally, which
 * makes the screen-space result exactly `-mouse * strength * depth` regardless of stage aspect.
 *
 * @param u,v      hotspot position as a fraction of the stage (art.ts stores these as percentages)
 * @param mouse    pointer offset from stage centre, -0.5..0.5 on both axes
 * @param strength normally `PARALLAX_STRENGTH`
 */
export function hotspotOffset(
  sampler: DepthSampler,
  u: number,
  v: number,
  mouse: Vec2,
  strength: number,
  stageW: number,
  stageH: number,
): Offset {
  const depth = sampler.sample(u, v);
  return {
    dx: unsigned(-mouse.x * strength * depth * stageW),
    dy: unsigned(-mouse.y * strength * depth * stageH),
  };
}
