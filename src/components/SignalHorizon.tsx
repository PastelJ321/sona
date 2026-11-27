import { useEffect, useRef } from 'react';

interface SignalHorizonProps {
  tone?: 'dark-to-light' | 'light-to-dark' | 'light';
  accent?: string;
  label?: string;
}

/**
 * Scroll-coupled & pointer-reactive vector acoustic ribbon.
 * Bridges DOM sections with SONA's Living Signal visual continuity (14islands-inspired).
 */
export function SignalHorizon({
  tone = 'light',
  accent = '#5B75FF',
  label,
}: SignalHorizonProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 1;
    let height = 56;
    let phase = 0;
    let scrollEnergy = 0;
    let lastScrollY = window.scrollY;
    let pointerX = 0.5;
    let pointerInfluence = 0;
    let rafId = 0;
    let visible = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(40, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const midY = height * 0.5;
      const amp = 5 + Math.min(13, scrollEnergy * 0.65) + pointerInfluence * 7;

      const baseStroke =
        tone === 'light-to-dark' ? 'rgba(240, 238, 232, 0.24)' : 'rgba(17, 20, 26, 0.16)';

      // Two harmonically interfering thin strands
      const strands = [
        { freq: 0.011, speed: 1, color: baseStroke, lw: 1.1, mult: 0.72 },
        { freq: 0.016, speed: -1.35, color: accent, lw: 1.4, mult: 1.0 },
      ];

      for (const s of strands) {
        ctx.beginPath();
        const step = width < 600 ? 6 : 4;
        for (let x = 0; x <= width; x += step) {
          const nx = x / width;
          const env = Math.sin(nx * Math.PI);
          const ptrDist = Math.abs(nx - pointerX);
          const ptrBoost = Math.exp(-ptrDist * ptrDist * 26) * pointerInfluence;
          const y =
            midY +
            Math.sin(x * s.freq + phase * s.speed) *
              Math.cos(x * 0.0045 - phase * 0.45) *
              (amp * s.mult * env + ptrBoost * 10);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.lw;
        ctx.stroke();
      }
    };

    const tick = () => {
      if (!visible || prefersReduced) return;
      phase += 0.022 + Math.min(0.08, scrollEnergy * 0.004);
      scrollEnergy *= 0.91;
      pointerInfluence *= 0.94;
      draw();
      rafId = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      const dy = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
      scrollEnergy = Math.min(26, scrollEnergy + dy * 0.22);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (e.clientY >= rect.top - 80 && e.clientY <= rect.bottom + 80) {
        pointerX = (e.clientX - rect.left) / Math.max(1, rect.width);
        pointerInfluence = Math.min(1, pointerInfluence + 0.18);
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        visible = Boolean(entries[0]?.isIntersecting);
        if (visible && !prefersReduced && !rafId) {
          rafId = requestAnimationFrame(tick);
        } else if (!visible && rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    resize();

    if (!prefersReduced) {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [accent, tone]);

  return (
    <div className={`signal-horizon signal-horizon--${tone}`} aria-hidden="true">
      <div className="container signal-horizon__wrap">
        {label && <span className="signal-horizon__label mono">{label}</span>}
        <canvas ref={canvasRef} className="signal-horizon__canvas" />
      </div>
    </div>
  );
}
