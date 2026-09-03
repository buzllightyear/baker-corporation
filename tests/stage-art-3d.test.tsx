import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { StageArt3D } from '../src/ui/StageArt3D';
import { resetWebGLCache } from '../src/ui/webgl';

describe('StageArt3D', () => {
  beforeEach(() => resetWebGLCache());
  afterEach(() => resetWebGLCache());

  it('renders nothing without WebGL so the CSS stage stays the only picture', () => {
    const { container } = render(
      createElement(StageArt3D, { image: '/art/rooms/bridge.jpg', depth: '/art/rooms/bridge.depth.png', parallax: { x: 0, y: 0 } }),
    );
    expect(container.innerHTML).toBe('');
  });

  it('mounts a positioned host when WebGL is reported present', () => {
    // Only the probe is faked; three itself will fail to build a real context and bail
    // out inside the effect, which is exactly the "context lost after probe" path.
    const fake = { getParameter: () => 0 } as unknown as RenderingContext;
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fake);
    const { container } = render(
      createElement(StageArt3D, { image: '/art/rooms/bridge.jpg', parallax: { x: 0.2, y: -0.1 }, className: 'stage-art' }),
    );
    const host = container.firstElementChild as HTMLElement | null;
    expect(host).not.toBeNull();
    expect(host!.className).toBe('stage-art');
    expect(host!.style.position).toBe('absolute');
    spy.mockRestore();
  });
});
