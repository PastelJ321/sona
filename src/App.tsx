import { useEffect, useState } from 'react';
import { SignalShutter } from './components/SignalShutter';
import { SiteFooter } from './components/SiteFooter';
import { SiteNavigation } from './components/SiteNavigation';
import { getProjectBySlug } from './data/projects';
import { useViewportProfile } from './hooks/useViewportProfile';
import { useRouter } from './lib/router';
import { AboutPage } from './pages/AboutPage';
import { ArchivePage } from './pages/ArchivePage';
import { HomePage, type HomeChapterId } from './pages/HomePage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';

export function App() {
  const viewport = useViewportProfile();
  const { route, navigate, isTransitioning } = useRouter();
  const [isLightHomeSurface, setIsLightHomeSurface] = useState(false);
  const [activeHomeChapter, setActiveHomeChapter] = useState<HomeChapterId>('hero');

  useEffect(() => {
    if (route.view === 'home') {
      document.title = 'SONA — 양일고등학교 코딩동아리';
    } else if (route.view === 'archive') {
      document.title = '프로젝트 기록 — SONA';
    } else if (route.view === 'about') {
      document.title = '소개 — SONA';
    } else if (route.view === 'project') {
      const p = getProjectBySlug(route.slug);
      document.title = p ? `${p.title} — SONA` : '작품 — SONA';
    }
  }, [route]);

  const headerTone: 'dark' | 'dark-solid' | 'light' =
    route.view === 'home'
      ? isLightHomeSurface
        ? 'light'
        : 'dark'
      : route.view === 'about' ||
          (route.view === 'project' && route.slug === 'seojun-arcade')
        ? 'dark-solid'
        : 'light';

  return (
    <div
      className={`app-shell app-shell--${viewport.deviceClass} ${
        isTransitioning ? 'is-transitioning' : ''
      }`}
    >
      <a href="#main-content" className="skip-link">
        본문으로 바로가기
      </a>

      <SiteNavigation
        route={route}
        viewport={viewport}
        headerTone={headerTone}
        activeHomeChapter={activeHomeChapter}
        onNavigate={navigate}
      />

      <main id="main-content" className="app-main" tabIndex={-1}>
        {route.view === 'home' && (
          <HomePage
            viewport={viewport}
            onNavigate={navigate}
            onHeaderPolarityChange={setIsLightHomeSurface}
            onActiveChapterChange={setActiveHomeChapter}
          />
        )}
        {route.view === 'project' && (
          <ProjectDetailPage slug={route.slug} onNavigate={navigate} />
        )}
        {route.view === 'archive' && <ArchivePage onNavigate={navigate} />}
        {route.view === 'about' && <AboutPage onNavigate={navigate} />}
      </main>

      <SiteFooter onNavigate={navigate} />

      <SignalShutter visible={isTransitioning} />
    </div>
  );
}

export default App;
