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
  { id: 'home', label: '홈', en: 'HOME', path: '/' },
  { id: 'works', label: '작품', en: 'WORKS', path: '/', hash: 'works' },
  { id: 'archive', label: '아카이브', en: 'ARCHIVE', path: '/archive' },
  { id: 'about', label: '소개', en: 'ABOUT', path: '/about' },
] as const;

export function SiteNavigation({ route, viewport, onNavigate }: SiteNavigationProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isDarkTop = route.view === 'home' && !scrolled;

  const isItemActive = (id: (typeof NAV_ITEMS)[number]['id']): boolean => {
    if (id === 'home') return route.view === 'home';
    if (id === 'works') return route.view === 'project';
    if (id === 'archive') return route.view === 'archive';
    if (id === 'about') return route.view === 'about';
    return false;
  };

  return (
    <>
      <header
        className={`site-header ${isDarkTop ? 'site-header--dark' : 'site-header--light'} ${scrolled ? 'is-scrolled' : ''}`}
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
            <SonaBrandMark size={30} className="site-brand__mark" />
            <span className="site-brand__text">
              <strong className="site-brand__name">SONA</strong>
              <span className="site-brand__sub">양일고 코딩동아리</span>
            </span>
          </a>

          {!viewport.isMobile && (
            <nav className="site-nav" aria-label="주요 내비게이션">
              {NAV_ITEMS.map((item) => {
                const active = isItemActive(item.id);
                const href = 'hash' in item ? `${item.path}#${item.hash}` : item.path;
                return (
                  <a
                    key={item.id}
                    href={href}
                    className={`site-nav__link ${active ? 'is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(item.path, 'hash' in item ? { hash: item.hash } : undefined);
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
          )}

          {viewport.isMobile && (
            <div className="site-header__mobile-badge mono" aria-hidden="true">
              <span className="site-header__pulse-dot" />
              <span>02 WORKS</span>
            </div>
          )}
        </div>
      </header>

      {/* Mobile thumb-zone floating navigation dock */}
      {viewport.isMobile && (
        <nav className="mobile-dock" aria-label="모바일 하단 내비게이션">
          <div className="mobile-dock__pill">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item.id);
              const href = 'hash' in item ? `${item.path}#${item.hash}` : item.path;
              return (
                <a
                  key={item.id}
                  href={href}
                  className={`mobile-dock__item ${active ? 'is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.path, 'hash' in item ? { hash: item.hash } : undefined);
                  }}
                >
                  <span className="mobile-dock__dot" aria-hidden="true" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
