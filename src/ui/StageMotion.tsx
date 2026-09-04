import React from 'react';
/**
 * P9 motion (2026-09-04): the two cheapest layers Fortiche puts over a finished plate — drifting dust
 * and a slow haze — as a 2D canvas over the stage. Painted, not simulated: soft discs in the room's
 * key colour, a couple of huge low-alpha blobs crossing the frame over a minute. Runs at ~30 fps,
 * stops when the tab is hidden or the user prefers reduced motion. Pointer events pass through.
 */
const KEY: Record<string, string> = {
  bridge: '207,227,255', corridor_a: '170,190,220', medbay_ep0: '191,233,208', medbay_ep1: '191,233,208',
  galley: '255,190,110', corridor_b: '255,150,90', engine: '255,166,64', cargo3: '150,110,200', quarters: '200,210,255', airlock: '220,235,255',
};
interface Mote { x: number; y: number; r: number; vx: number; vy: number; a: number; ph: number }
export function StageMotion({ image, tense }: { image: string | null; tense?: boolean }) {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  React.useEffect(() => {
    const c = ref.current; if (!c) return;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const stem = (image ?? '').split('/').pop()?.replace(/\.[a-z]+$/, '') ?? '';
    const key = tense ? '255,120,200' : (KEY[stem] ?? '217,181,106');
    let w = 0, h = 0, raf = 0, last = 0, alive = true;
    const motes: Mote[] = [];

    const resize = () => { const p = c.parentElement; if (!p) return; w = c.width = p.clientWidth; h = c.height = p.clientHeight;
      motes.length = 0; const n = Math.min(40, Math.round((w * h) / 36000));
      for (let i = 0; i < n; i++) motes.push({ x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 1.8, vx: (Math.random() - 0.5) * 6, vy: -3 - Math.random() * 8, a: 0.15 + Math.random() * 0.45, ph: Math.random() * 6.28 }); };
    resize();
    const ro = new ResizeObserver(resize); if (c.parentElement) ro.observe(c.parentElement);
    const frame = (t: number) => {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016); if (t - last < 50) return; last = t;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) { m.ph += dt * 1.3; m.x += (m.vx + Math.sin(m.ph) * 4) * dt; m.y += m.vy * dt;
        if (m.y < -4) { m.y = h + 4; m.x = Math.random() * w; } if (m.x < -4) m.x = w + 4; if (m.x > w + 4) m.x = -4;
        const a = m.a * (0.6 + 0.4 * Math.sin(m.ph * 0.7));
        ctx.fillStyle = `rgba(${key},${a})`; ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.28); ctx.fill(); }
    };
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); };
  }, [image, tense]);
  const stem = (image ?? '').split('/').pop()?.replace(/\.[a-z]+$/, '') ?? '';
  const key = tense ? '255,120,200' : (KEY[stem] ?? '217,181,106');
  return (
    <>
      <div className="stage-haze a" style={{ ['--key' as string]: key }} aria-hidden="true" />
      <div className="stage-haze b" style={{ ['--key' as string]: key }} aria-hidden="true" />
      <canvas ref={ref} className="stage-motion" aria-hidden="true" />
    </>
  );
}
