import { useCallback, useEffect, useState } from 'react';

export type RouteMatch =
  | { view: 'home' }
  | { view: 'project'; slug: string }
  | { view: 'archive' }
  | { view: 'about' };

export function parseRoute(pathname: string): RouteMatch {
  const clean = pathname.replace(/\/+$/, '') || '/';

  if (clean === '/' || clean === '/index.html') {
    return { view: 'home' };
  }
  if (clean === '/archive') {
    return { view: 'archive' };
  }
  if (clean === '/about') {
    return { view: 'about' };
  }
  if (clean.startsWith('/works/')) {
    const slug = decodeURIComponent(clean.slice('/works/'.length));
    if (slug) {
      return { view: 'project', slug };
    }
  }
  return { view: 'home' };
}

export function useRouter() {
  const [pathname, setPathname] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/',
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string, options?: { hash?: string }) => {
    const targetUrl = options?.hash ? `${to}#${options.hash}` : to;
    const currentFull = `${window.location.pathname}${window.location.hash}`;

    if (to === window.location.pathname && options?.hash) {
      const el = document.getElementById(options.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', targetUrl);
      }
      return;
    }

    if (currentFull === targetUrl) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      window.history.pushState(null, '', targetUrl);
      setPathname(to);
      if (options?.hash) {
        requestAnimationFrame(() => {
          document.getElementById(options.hash!)?.scrollIntoView({ behavior: 'auto' });
        });
      } else {
        window.scrollTo(0, 0);
      }
      return;
    }

    setIsTransitioning(true);
    window.setTimeout(() => {
      window.history.pushState(null, '', targetUrl);
      setPathname(to);
      if (options?.hash) {
        requestAnimationFrame(() => {
          document.getElementById(options.hash!)?.scrollIntoView({ behavior: 'smooth' });
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
      window.setTimeout(() => {
        setIsTransitioning(false);
      }, 170);
    }, 140);
  }, []);

  return {
    pathname,
    route: parseRoute(pathname),
    navigate,
    isTransitioning,
  };
}
