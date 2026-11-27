import { useEffect } from 'react';
import { SiteFooter } from './components/SiteFooter';
import { SiteNavigation } from './components/SiteNavigation';
import { getProjectBySlug } from './data/projects';
import { useViewportProfile } from './hooks/useViewportProfile';
import { useRouter } from './lib/router';
import { AboutPage } from './pages/AboutPage';
import { ArchivePage } from './pages/ArchivePage';
import { HomePage } from './pages/HomePage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';

export function App() {
  const viewport = useViewportProfile();
  const { route, navigate, isTransitioning } = useRouter();

  useEffect(() => {
    if (route.view === 'home') {
      document.title = 'SONA — 양일고등학교 코딩동아리 디지털 아카이브';
    } else if (route.view === 'archive') {
      document.title = '아카이브 — SONA 양일고등학교 코딩동아리';
    } else if (route.view === 'about') {
      document.title = '소개 — SONA 양일고등학교 코딩동아리';
    } else if (route.view === 'project') {
      const p = getProjectBySlug(route.slug);
      document.title = p ? `${p.title} — SONA 전시` : '작품 전시 — SONA';
    }
  }, [route]);

  return (
    <div
      className={`app-shell app-shell--${viewport.deviceClass} ${
        isTransitioning ? 'is-transitioning' : ''
      }`}
    >
      <a href="#main-content" className="skip-link">
        본문으로 바로가기
      </a>

      <SiteNavigation route={route} viewport={viewport} onNavigate={navigate} />

      <main id="main-content" className="app-main" tabIndex={-1}>
        {route.view === 'home' && <HomePage viewport={viewport} onNavigate={navigate} />}
        {route.view === 'project' && (
          <ProjectDetailPage slug={route.slug} onNavigate={navigate} />
        )}
        {route.view === 'archive' && <ArchivePage onNavigate={navigate} />}
        {route.view === 'about' && <AboutPage onNavigate={navigate} />}
      </main>

      <SiteFooter onNavigate={navigate} />

      {/* Subtle Signal Curtain during internal route switches (never delays external links) */}
      <div
        className={`route-curtain ${isTransitioning ? 'is-visible' : ''}`}
        aria-hidden="true"
      />
    </div>
  );
}

export default App;
