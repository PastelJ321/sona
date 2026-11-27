import { useEffect, useState } from 'react';
import type { ViewportProfile } from '../hooks/useViewportProfile';
import type { RouteMatch } from '../lib/router';
import { SonaBrandMark } from './SonaBrandMark';

interface SiteNavigationProps {
  route: RouteMatch;
  viewport: ViewportProfile;
  onNavigate: (to: string, options?: { hash?: string }) => void;
}

const NAV_ITEMS = [
  { id: 'home', label: '공간', en: 'WORLD', path: '/' },
  { id: 'archive', label: '기록', en: 'ARCHIVE', path: '/archive' },
  { id: 'about', label: '소개', en: 'ABOUT', path: '/about' },
] as const;

export function SiteNavigation({ route, viewport, onNavigate }: SiteNavigationProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.72);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isDarkTop = route.view === 'home' && !scrolled;

  const isItemActive = (id: (typeof NAV_ITEMS)[number]['id']): boolean => {
    if (id === 'home') return route.view === 'home';
    if (id === 'archive') return route.view === 'archive' || route.view === 'project';
    if (id === 'about') return route.view === 'about';
    return false;
  };

  return (
    <header
      className={`site-header ${isDarkTop ? 'site-header--dark' : 'site-header--light'} ${
        scrolled ? 'is-scrolled' : ''
      }`}
    >
      <div className="container site-header__inner">
        <a
          href="/"
          className="site-brand"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/');
          }}
          aria-label="SONA 홈으로 이동"
        >
          <SonaBrandMark size={28} className="site-brand__mark" />
          <span className="site-brand__text">
            <strong className="site-brand__name">SONA</strong>
            <span className="site-brand__sub">양일고 코딩동아리</span>
          </span>
        </a>

        <nav className="site-nav" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item.id);
            return (
              <a
                key={item.id}
                href={item.path}
                className={`site-nav__link ${active ? 'is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.path);
                }}
              >
                <span>{item.label}</span>
                {viewport.isDesktop && (
                  <span className="site-nav__en mono">{item.en}</span>
                )}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
