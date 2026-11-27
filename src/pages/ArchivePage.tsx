import { ArchiveIndex } from '../components/ArchiveIndex';
import { SignalHorizon } from '../components/SignalHorizon';
import { PROJECTS } from '../data/projects';

interface ArchivePageProps {
  onNavigate: (to: string, options?: { hash?: string }) => void;
}

export function ArchivePage({ onNavigate }: ArchivePageProps) {
  return (
    <div className="subpage">
      <section className="subpage-hero">
        <div className="container subpage-hero__grid">
          <div>
            <span className="eyebrow mono">SONA · ARCHIVE</span>
            <h1 className="subpage-title">프로젝트 기록</h1>
          </div>
          <div className="subpage-hero__meta">
            <p className="subpage-lead">
              부원들이 만든 게임과 프로그램을 연도별로 모아 두었습니다.
            </p>
            <div className="subpage-stats mono">
              <span>{PROJECTS.length}개 등록</span>
              <span>·</span>
              <span>2026</span>
            </div>
          </div>
        </div>
      </section>

      <SignalHorizon tone="light" accent="#5B75FF" label="ARCHIVE · 2026" />

      <section className="subpage-body">
        <div className="container">
          <ArchiveIndex onOpenProject={(slug) => onNavigate(`/works/${slug}`)} />
        </div>
      </section>
    </div>
  );
}
