import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PARALLAX_STRENGTH,
  flatSampler,
  hotspotOffset,
  loadDepth,
  samplerFromImageData,
  type DepthSampler,
} from '../src/ui/depth';
import { hasWebGL, resetWebGLCache } from '../src/ui/webgl';

/** 2x2 greyscale ramp: left column 0, right column 255. */
function rampSampler(): DepthSampler {
  const px = new Uint8ClampedArray(2 * 2 * 4);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
    const v = x === 0 ? 0 : 255;
    const i = (y * 2 + x) * 4;
    px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255;
  }
  return samplerFromImageData({ data: px, width: 2, height: 2, colorSpace: 'srgb' } as ImageData);
}

describe('depth sampler', () => {
  it('reads 0 and 1 at the ends of a ramp and interpolates between them', () => {
    const s = rampSampler();
    expect(s.sample(0, 0.5)).toBeCloseTo(0, 5);
    expect(s.sample(1, 0.5)).toBeCloseTo(1, 5);
    expect(s.sample(0.5, 0.5)).toBeCloseTo(0.5, 5);
    expect(s.ok).toBe(true);
  });

  it('clamps out-of-range coordinates instead of wrapping', () => {
    const s = rampSampler();
    expect(s.sample(-3, 0.5)).toBeCloseTo(0, 5);
    expect(s.sample(9, 0.5)).toBeCloseTo(1, 5);
  });

  it('flatSampler reports mid depth and flags itself as not-ok', () => {
    const s = flatSampler();
    expect(s.sample(0.1, 0.9)).toBe(0.5);
    expect(s.ok).toBe(false);
  });
});

describe('hotspotOffset', () => {
  const mouse = { x: 0.5, y: -0.25 };

  it('moves the hotspot against the mouse, scaled by depth and stage size', () => {
    const s = rampSampler();
    // depth 1 at u=1 -> full displacement
    const near = hotspotOffset(s, 1, 0.5, mouse, PARALLAX_STRENGTH, 1000, 600);
    expect(near.dx).toBeCloseTo(-0.5 * PARALLAX_STRENGTH * 1000, 6);
    expect(near.dy).toBeCloseTo(0.25 * PARALLAX_STRENGTH * 600, 6);
  });

  it('leaves the furthest points alone', () => {
    const far = hotspotOffset(rampSampler(), 0, 0.5, mouse, PARALLAX_STRENGTH, 1000, 600);
    expect(far.dx).toBe(0);
    expect(far.dy).toBe(0);
  });

  it('is linear in depth: the mid-ramp point moves half as far as the near one', () => {
    const s = rampSampler();
    const near = hotspotOffset(s, 1, 0.5, mouse, PARALLAX_STRENGTH, 1000, 600);
    const mid = hotspotOffset(s, 0.5, 0.5, mouse, PARALLAX_STRENGTH, 1000, 600);
    expect(mid.dx).toBeCloseTo(near.dx / 2, 6);
    expect(mid.dy).toBeCloseTo(near.dy / 2, 6);
  });

  it('is zero when the pointer is centred', () => {
    const o = hotspotOffset(rampSampler(), 1, 1, { x: 0, y: 0 }, PARALLAX_STRENGTH, 1000, 600);
    expect(o.dx).toBe(0);
    expect(o.dy).toBe(0);
  });

  it('stays inside 3% of the stage at the extremes of the pointer range', () => {
    const s = rampSampler();
    for (const m of [{ x: -0.5, y: -0.5 }, { x: 0.5, y: 0.5 }]) {
      const o = hotspotOffset(s, 1, 1, m, PARALLAX_STRENGTH, 1000, 600);
      expect(Math.abs(o.dx)).toBeLessThanOrEqual(0.03 * 1000);
      expect(Math.abs(o.dy)).toBeLessThanOrEqual(0.03 * 600);
    }
  });
});

describe('loadDepth', () => {
  // jsdom neither fetches nor decodes images, so drive the Image callbacks by hand.
  class StubImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    crossOrigin = '';
    naturalWidth = 0;
    naturalHeight = 0;
    set src(_v: string) { queueMicrotask(() => this.onerror?.()); }
  }

  it('resolves to a flat sampler when the depth PNG cannot be loaded', async () => {
    vi.stubGlobal('Image', StubImage);
    const s = await loadDepth('/art/rooms/does-not-exist.depth.png');
    vi.unstubAllGlobals();
    expect(s.ok).toBe(false);
    expect(s.sample(0.3, 0.7)).toBe(0.5);
  });

  it('resolves to a flat sampler when the 2d context is unavailable', async () => {
    class OkImage extends StubImage {
      override set src(_v: string) {
        this.naturalWidth = 4; this.naturalHeight = 4;
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('Image', OkImage);
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const s = await loadDepth('/art/rooms/bridge.depth.png');
    spy.mockRestore();
    vi.unstubAllGlobals();
    expect(s.ok).toBe(false);
    expect(s.sample(0.3, 0.7)).toBe(0.5);
  });
});

describe('hasWebGL', () => {
  beforeEach(() => resetWebGLCache());

  it('is false under jsdom, which has no WebGL context', () => {
    expect(hasWebGL()).toBe(false);
  });

  it('is false when getContext throws', () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(hasWebGL()).toBe(false);
    spy.mockRestore();
  });

  it('is true when a context with getParameter is available, and the probe is cached', () => {
    const fake = { getParameter: () => 0 } as unknown as RenderingContext;
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fake);
    expect(hasWebGL()).toBe(true);
    spy.mockRestore();
    expect(hasWebGL()).toBe(true); // cached, no second probe
  });
});
