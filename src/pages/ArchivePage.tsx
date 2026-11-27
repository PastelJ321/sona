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
            <span className="eyebrow mono">DIGITAL ARCHIVE // INDEX</span>
            <h1 className="subpage-title">SONA 아카이브</h1>
          </div>
          <div className="subpage-hero__meta">
            <p className="subpage-lead">
              양일고등학교 코딩동아리 SONA에서 완성하고 공개한 디지털 프로젝트를
              연도와 분야별로 정리해 보관합니다.
            </p>
            <div className="subpage-stats mono">
              <span>REGISTERED: 0{PROJECTS.length}</span>
              <span>·</span>
              <span>ACTIVE YEAR: 2026</span>
            </div>
          </div>
        </div>
      </section>

      <SignalHorizon tone="light" accent="#5B75FF" label="ARCHIVE // FILTERABLE INDEX" />

      <section className="subpage-body">
        <div className="container">
          <ArchiveIndex onOpenProject={(slug) => onNavigate(`/works/${slug}`)} />
        </div>
      </section>
    </div>
  );
}
