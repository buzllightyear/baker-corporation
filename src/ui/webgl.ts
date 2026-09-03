// WebGL feature detection. The ChatGPT app-embed sandbox is undocumented on WebGL,
// so every 3D path has to be behind this and fall back to the CSS stage.
let cached: boolean | null = null;

/** True when a WebGL2 (or WebGL1) context can actually be created in this document. */
export function hasWebGL(): boolean {
  if (cached !== null) return cached;
  cached = probe();
  return cached;
}

function probe(): boolean {
  if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    if (typeof canvas.getContext !== 'function') return false;
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return false;
    // jsdom and some sandboxes hand back a stub object; require a real method.
    return typeof (gl as WebGLRenderingContext).getParameter === 'function';
  } catch {
    return false;
  }
}

/** Test seam: forget the cached probe result. */
export function resetWebGLCache(): void {
  cached = null;
}
