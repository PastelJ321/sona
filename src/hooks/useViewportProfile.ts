import { useEffect, useState } from 'react';

export type DeviceClass = 'mobile' | 'tablet-portrait' | 'tablet-landscape' | 'desktop';

export interface ViewportProfile {
  width: number;
  height: number;
  deviceClass: DeviceClass;
  isTouch: boolean;
  isCoarsePointer: boolean;
  prefersReducedMotion: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

function readViewportProfile(): ViewportProfile {
  if (typeof window === 'undefined') {
    return {
      width: 1440,
      height: 900,
      deviceClass: 'desktop',
      isTouch: false,
      isCoarsePointer: false,
      prefersReducedMotion: false,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isTouch = isCoarsePointer || navigator.maxTouchPoints > 0;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let deviceClass: DeviceClass;
  if (width < 768) {
    deviceClass = 'mobile';
  } else if (width < 1024) {
    deviceClass = 'tablet-portrait';
  } else if (width <= 1180 && isTouch) {
    deviceClass = 'tablet-landscape';
  } else if (width <= 1080 && height <= 840) {
    deviceClass = 'tablet-landscape';
  } else {
    deviceClass = 'desktop';
  }

  return {
    width,
    height,
    deviceClass,
    isTouch,
    isCoarsePointer,
    prefersReducedMotion,
    isMobile: deviceClass === 'mobile',
    isTablet: deviceClass === 'tablet-portrait' || deviceClass === 'tablet-landscape',
    isDesktop: deviceClass === 'desktop',
  };
}

export function useViewportProfile(): ViewportProfile {
  const [profile, setProfile] = useState<ViewportProfile>(() => readViewportProfile());

  useEffect(() => {
    let rafId = 0;
    const handleChange = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setProfile(readViewportProfile());
      });
    };

    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerMq = window.matchMedia('(pointer: coarse)');

    window.addEventListener('resize', handleChange, { passive: true });
    window.addEventListener('orientationchange', handleChange, { passive: true });
    motionMq.addEventListener('change', handleChange);
    pointerMq.addEventListener('change', handleChange);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleChange);
      window.removeEventListener('orientationchange', handleChange);
      motionMq.removeEventListener('change', handleChange);
      pointerMq.removeEventListener('change', handleChange);
    };
  }, []);

  return profile;
}
