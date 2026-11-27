import type { ViewportProfile } from '../hooks/useViewportProfile';
import type { RouteMatch } from '../lib/router';
import type { HomeChapterId } from '../pages/HomePage';
import { SonaBrandMark } from './SonaBrandMark';

interface SiteNavigationProps {
  route: RouteMatch;
  viewport: ViewportProfile;
  headerTone: 'dark' | 'dark-solid' | 'light';
  activeHomeChapter: HomeChapterId;
  onNavigate: (to: string, options?: { hash?: string }) => void;
}

const NAV_ITEMS = [
  { id: 'works', label: '작품', en: 'WORKS', path: '/', hash: 'work-seojun-arcade' },
  { id: 'archive', label: '기록', en: 'ARCHIVE', path: '/archive' },
  { id: 'about', label: '소개', en: 'ABOUT', path: '/about' },
] as const;

const CHAPTER_LABELS: Record<HomeChapterId, { code: string; name: string }> = {
  hero: { code: '00', name: 'SONA' },
  arcade: { code: '01', name: 'SEOJUN ARCADE' },
  asterism: { code: '02', name: 'ASTERISM WRITE' },
  archive: { code: '03', name: 'ARCHIVE' },
};

export function SiteNavigation({
  route,
  viewport,
  headerTone,
  activeHomeChapter,
  onNavigate,
}: SiteNavigationProps) {
  const isItemActive = (id: (typeof NAV_ITEMS)[number]['id']): boolean => {
    if (id === 'works') return route.view === 'project';
    if (id === 'archive') return route.view === 'archive';
    if (id === 'about') return route.view === 'about';
    return false;
  };

  const chapterInfo = CHAPTER_LABELS[activeHomeChapter];

  return (
    <header className={`site-header site-header--${headerTone}`}>
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
            <span className="site-brand__sub">양일고등학교 코딩동아리</span>
          </span>
        </a>

        {viewport.isDesktop && route.view === 'home' && (
          <div className="site-header__chapter mono" aria-live="polite">
            <span className="chapter-lamella-bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="site-header__chapter-code">{chapterInfo.code}</span>
            <span>{chapterInfo.name}</span>
          </div>
        )}

        <nav className="site-nav" aria-label="주요 메뉴">
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
      </div>
    </header>
  );
}
