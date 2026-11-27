import { ArchiveIndex } from '../components/ArchiveIndex';
import { SignalHorizon } from '../components/SignalHorizon';
import { SonaWorldViewport } from '../components/SonaWorldViewport';
import type { ViewportProfile } from '../hooks/useViewportProfile';

interface HomePageProps {
  viewport: ViewportProfile;
  onNavigate: (to: string, options?: { hash?: string }) => void;
}

export function HomePage({ viewport, onNavigate }: HomePageProps) {
  return (
    <div className="home-page">
      {/* Primary Explorable 3D Signal World (Core, Seojun Arcade, Asterism Studio) */}
      <SonaWorldViewport viewport={viewport} onNavigate={onNavigate} />

      {/* Crisp Scrollable HTML Archive Strip below the 3D stage (Are.na spirit + non-3D access) */}
      <SignalHorizon tone="light" accent="#5B75FF" label="SONA · 2026 INDEX" />

      <section id="works" className="home-archive" aria-labelledby="home-archive-heading">
        <div className="container">
          <div className="home-archive__head">
            <div>
              <span className="eyebrow mono">PROJECTS · 2026</span>
              <h2 id="home-archive-heading" className="section-title">
                우리가 만든 것들
              </h2>
            </div>
            <p className="home-archive__sub">
              위 3D 공간에서 작품을 둘러보거나, 아래 목록에서 바로 열어 볼 수
              있습니다.
            </p>
          </div>

          <ArchiveIndex
            compact
            onOpenProject={(slug) => onNavigate(`/works/${slug}`)}
            onOpenFullArchive={() => onNavigate('/archive')}
          />
        </div>
      </section>
    </div>
  );
}
