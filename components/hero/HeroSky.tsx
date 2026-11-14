'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The hero's animated sky, drawn with three.js. three is loaded after the
 * page is interactive, and the scene only animates while the hero is on
 * screen. Until it is ready (or if WebGL is unavailable) the hero shows the
 * same artwork as a still image, set in CSS.
 */
export default function HeroSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let frame = 0;
    let cleanup = () => {};

    (async () => {
      const { createSkyScene } = await import('./skyScene');
      if (disposed) return;

      let scene: Awaited<ReturnType<typeof createSkyScene>>;
      try {
        scene = await createSkyScene(canvas);
      } catch {
        return; // no WebGL or the artwork failed to load: keep the still image
      }
      if (disposed) { scene.dispose(); return; }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      let visible = true;
      let last = 0;
      const start = performance.now();

      const draw = (now: number) => {
        frame = 0;
        if (!visible || document.hidden) return;
        // ~30fps is plenty for swaying grass and keeps phones cool.
        if (now - last >= 30) {
          last = now;
          scene.render(reducedMotion.matches ? 0 : (now - start) / 1000);
        }
        if (!reducedMotion.matches) frame = requestAnimationFrame(draw);
      };
      const wake = () => { if (!frame) frame = requestAnimationFrame(draw); };

      const resizeObserver = new ResizeObserver(() => { scene.resize(); last = 0; scene.render(reducedMotion.matches ? 0 : (performance.now() - start) / 1000); });
      resizeObserver.observe(canvas);
      const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); });
      intersection.observe(canvas);
      document.addEventListener('visibilitychange', wake);
      reducedMotion.addEventListener('change', wake);

      scene.render(0);
      setReady(true);
      wake();

      cleanup = () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        intersection.disconnect();
        document.removeEventListener('visibilitychange', wake);
        reducedMotion.removeEventListener('change', wake);
        scene.dispose();
      };
      if (disposed) cleanup();
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas ref={canvasRef} className={`hero-sky ${ready ? 'is-ready' : ''}`} aria-hidden="true" />;
}
