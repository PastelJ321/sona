import { useEffect, useRef } from 'react';
import { SIGNAL_SPRINGS, SpringValue, prefersReducedMotion } from '../motion/SignalMotion';

interface SonaLamellaCanvasProps {
  variant?: 'about' | 'fallback' | 'archive';
  className?: string;
}

interface BladeNode {
  u: number; // 0..1 column
  v: number; // 0..1 row
  baseAngle: number;
  spring: SpringValue;
}

/**
 * Generative 2D manifestation of SONA's Material Signal Lamella Grammar.
 * Runs the exact same 2nd-order damped spring physics as the 3D Hero Kinetic Resonator,
 * proving SONA's visual identity remains unmistakable even without WebGL.
 */
export function SonaLamellaCanvas({
  variant = 'about',
  className = '',
}: SonaLamellaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = prefersReducedMotion();
    const cols = variant === 'archive' ? 15 : 13;
    const rows = variant === 'archive' ? 3 : 7;

    const nodes: BladeNode[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = c / (cols - 1);
        const v = r / (rows - 1);
        const dx = u - 0.5;
        const dy = v - 0.5;
        const baseAngle = Math.atan2(dy * 0.7, dx + 0.001) * 0.35 + (u - 0.5) * 0.85;
        nodes.push({
          u,
          v,
          baseAngle,
          spring: new SpringValue(0, {
            stiffness: SIGNAL_SPRINGS.lamella.stiffness,
            damping: SIGNAL_SPRINGS.lamella.damping,
            mass: 0.85 + Math.hypot(dx, dy) * 0.45,
          }),
        });
      }
    }

    let width = 1;
    let height = 1;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let pointerActive = false;
    let pointerEnergy = 0;
    let pulseTime = 10;
    let pulseOriginX = 0.5;
    let pulseOriginY = 0.5;
    let elapsed = 0;
    let lastTs = performance.now();
    let rafId = 0;
    let visible = true;

    const isDark = variant !== 'archive';

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0.016);
    };

    const draw = (dt: number) => {
      elapsed += dt;
      pulseTime += dt;
      pointerEnergy *= Math.exp(-dt * 3.4);

      ctx.clearRect(0, 0, width, height);

      // Subtle architectural backdrop field
      if (isDark) {
        const bgGrad = ctx.createRadialGradient(
          width * (0.58 + (pointerX - 0.5) * 0.14),
          height * (0.45 + (pointerY - 0.5) * 0.12),
          12,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.78,
        );
        bgGrad.addColorStop(0, '#182034');
        bgGrad.addColorStop(0.55, '#0F131C');
        bgGrad.addColorStop(1, '#090C11');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      const padX = Math.max(24, width * 0.08);
      const padY = Math.max(22, height * 0.12);
      const spanW = Math.max(1, width - padX * 2);
      const spanH = Math.max(1, height - padY * 2);
      const cellW = spanW / Math.max(1, cols - 1);
      const cellH = spanH / Math.max(1, rows - 1);
      const bladeLen = Math.min(cellW * 0.88, Math.max(22, cellH * 0.78));
      const bladeThick = Math.max(3.2, Math.min(7.5, bladeLen * 0.19));

      // Delicate harmonic coordinate lines connecting center spine
      ctx.strokeStyle = isDark ? 'rgba(240, 238, 232, 0.07)' : 'rgba(17, 20, 26, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, height * 0.5);
      ctx.lineTo(width - padX, height * 0.5);
      ctx.stroke();

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const px = padX + n.u * spanW;
        const py = padY + n.v * spanH;

        const distPtr = Math.hypot(n.u - pointerX, (n.v - pointerY) * (height / Math.max(1, width)));
        const ptrPull = pointerActive ? Math.exp(-distPtr * distPtr * 9.5) : 0;

        const distPulse = Math.hypot(n.u - pulseOriginX, n.v - pulseOriginY);
        const waveFront = distPulse - pulseTime * 0.95;
        const pluck = Math.exp(-waveFront * waveFront * 42) * Math.exp(-pulseTime * 1.4) * 1.35;

        const ambient = reduced
          ? 0
          : Math.sin(n.u * 5.2 + n.v * 2.4 - elapsed * 1.15) * 0.24;

        const targetAngle =
          n.baseAngle +
          ambient +
          ptrPull * (Math.atan2(pointerY - n.v, pointerX - n.u) - n.baseAngle) * 0.75 +
          pluck;

        n.spring.setTarget(targetAngle);
        const ang = reduced ? n.baseAngle : n.spring.step(dt);

        const highlight = Math.min(1, ptrPull * (0.65 + pointerEnergy) + Math.abs(pluck));
        const isCenterNode =
          Math.abs(n.u - 0.5) < 0.09 && Math.abs(n.v - 0.5) < 0.18;
        const isIrisNode = !isCenterNode && i % 9 === 4;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ang);

        const len = bladeLen * (0.76 + highlight * 0.36);
        const halfL = len * 0.5;
        const halfT = bladeThick * 0.5;

        // Slotted machined blade silhouette (capsule with subtle inner aperture notch)
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfT, len, bladeThick, halfT);

        if (isCenterNode) {
          ctx.fillStyle = '#F4654D';
        } else if (isIrisNode) {
          ctx.fillStyle = highlight > 0.35 ? '#D9F56C' : '#5B75FF';
        } else if (isDark) {
          const lum = Math.round(145 + highlight * 100);
          ctx.fillStyle =
            highlight > 0.45
              ? `rgba(217, 245, 108, ${0.42 + highlight * 0.5})`
              : `rgba(${lum}, ${lum + 6}, ${Math.min(255, lum + 18)}, ${0.34 + highlight * 0.58})`;
        } else {
          ctx.fillStyle =
            highlight > 0.35
              ? `rgba(64, 92, 200, ${0.5 + highlight * 0.45})`
              : `rgba(17, 20, 26, ${0.18 + highlight * 0.5})`;
        }
        ctx.fill();

        // Inner machined optical slit on prominent blades
        if (len > 26 && (isCenterNode || highlight > 0.25)) {
          ctx.fillStyle = isDark ? '#090C11' : '#F4F2EC';
          ctx.beginPath();
          ctx.roundRect(-halfL * 0.36, -halfT * 0.28, len * 0.36, bladeThick * 0.28, 1);
          ctx.fill();
        }

        ctx.restore();
      }
    };

    const tick = (now: number) => {
      if (!visible || reduced) return;
      const dt = Math.min(0.04, Math.max(0.008, (now - lastTs) / 1000));
      lastTs = now;
      draw(dt);
      rafId = requestAnimationFrame(tick);
    };

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const nx = (clientX - rect.left) / Math.max(1, rect.width);
      const ny = (clientY - rect.top) / Math.max(1, rect.height);
      const speed = Math.hypot(nx - pointerX, ny - pointerY);
      pointerX = Math.max(0, Math.min(1, nx));
      pointerY = Math.max(0, Math.min(1, ny));
      pointerActive = true;
      pointerEnergy = Math.min(1.4, pointerEnergy + speed * 8);
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY);
      pulseOriginX = pointerX;
      pulseOriginY = pointerY;
      pulseTime = 0;
      for (const n of nodes) {
        const d = Math.hypot(n.u - pulseOriginX, n.v - pulseOriginY);
        n.spring.impulse((1 - Math.min(1, d)) * 6.0);
      }
      if (reduced) draw(0.016);
    };

    const onPointerLeave = () => {
      pointerActive = false;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        visible = Boolean(entries[0]?.isIntersecting);
        if (visible && !reduced && !rafId) {
          lastTs = performance.now();
          rafId = requestAnimationFrame(tick);
        } else if (!visible && rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);

    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave);

    resize();
    if (!reduced) {
      lastTs = performance.now();
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className={`sona-lamella-canvas sona-lamella-canvas--${variant} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
