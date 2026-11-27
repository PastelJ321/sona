import { useEffect, useRef, useState } from 'react';
import { PointerDynamics, SpringValue } from '../studio/SpringPhysics';

export { PointerDynamics, SpringValue };

/**
 * Shared SONA Material Signal Motion Vocabulary constants.
 * Keeps 3D sculptures, 2D generative lamellae, magnetic controls, and editorial reveals
 * synchronized to the exact same physical weight and settling rhythm.
 */
export const SIGNAL_SPRINGS = {
  /** Fast optical / pointer feedback (crown glass, joystick, magnetic buttons) */
  tactile: { stiffness: 185, damping: 18, mass: 0.65 },
  /** Medium kinetic lamellae (blades, folio fans, floating archive previews) */
  lamella: { stiffness: 118, damping: 16, mass: 1.0 },
  /** Heavy architectural framing (studio camera parallax, large stage plates) */
  architectural: { stiffness: 56, damping: 15, mass: 1.6 },
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Narrative Motion: IntersectionObserver hairline-mask reveal.
 * Reveals elements once on viewport entry with crisp geometric unmasking (never repetitive fade-ins).
 */
export function useSignalReveal<T extends HTMLElement = HTMLElement>(threshold = 0.14) {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    const el = ref.current;
    if (!el || revealed) return;

    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      const id = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(id);
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -6% 0px' },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [revealed, threshold]);

  return { ref, revealed };
}

/**
 * Reactive Motion: Subtle spring-damped magnetic displacement for primary interactive links/buttons.
 * Strictly mouse-pointer only (never fights touch scroll or reduced motion).
 */
export function useMagneticSignal<T extends HTMLElement = HTMLElement>(strength = 7) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const sx = new SpringValue(0, SIGNAL_SPRINGS.tactile);
    const sy = new SpringValue(0, SIGNAL_SPRINGS.tactile);
    let rafId = 0;
    let lastTs = 0;
    let active = false;

    const tick = (now: number) => {
      const dt = Math.min(0.04, Math.max(0.008, (now - lastTs) / 1000));
      lastTs = now;
      const x = sx.step(dt);
      const y = sy.step(dt);
      el.style.setProperty('--mag-x', `${x.toFixed(2)}px`);
      el.style.setProperty('--mag-y', `${y.toFixed(2)}px`);

      const settled =
        !active &&
        Math.abs(x) < 0.05 &&
        Math.abs(y) < 0.05 &&
        Math.abs(sx.velocity) < 0.05 &&
        Math.abs(sy.velocity) < 0.05;

      if (settled) {
        el.style.setProperty('--mag-x', '0px');
        el.style.setProperty('--mag-y', '0px');
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const ensureLoop = () => {
      if (!rafId) {
        lastTs = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      active = true;
      sx.setTarget(nx * strength);
      sy.setTarget(ny * strength);
      ensureLoop();
    };

    const onLeave = () => {
      active = false;
      sx.setTarget(0);
      sy.setTarget(0);
      ensureLoop();
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.style.removeProperty('--mag-x');
      el.style.removeProperty('--mag-y');
    };
  }, [strength]);

  return ref;
}

/**
 * Reactive Motion: Tracks scroll progress [0..1] of a target section smoothly for CSS custom properties.
 * Enables DOM typographic shifts & phase transitions coupled directly to scroll without scroll-hijacking.
 */
export function useSectionScrollVar<T extends HTMLElement = HTMLElement>(varName = '--scroll-p') {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const rect = el.getBoundingClientRect();
      const vh = Math.max(1, window.innerHeight);
      const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
      el.style.setProperty(varName, progress.toFixed(4));
    };

    const onScroll = () => {
      if (!rafId) rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [varName]);

  return ref;
}
