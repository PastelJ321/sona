import { ArchiveIndex } from '../components/ArchiveIndex';
import { SonaLamellaCanvas } from '../components/SonaLamellaCanvas';
import { PROJECTS } from '../data/projects';

interface ArchivePageProps {
  onNavigate: (to: string, options?: { hash?: string }) => void;
}

export function ArchivePage({ onNavigate }: ArchivePageProps) {
  return (
    <div className="subpage subpage--archive">
      <section className="editorial-opener">
        <div className="container">
          <div className="editorial-opener__bar mono">
            <span>[ SONA ARCHIVE ]</span>
            <span>2026 · {String(PROJECTS.length).padStart(2, '0')} WORKS</span>
          </div>

          <div className="editorial-opener__grid">
            <h1 className="editorial-opener__title">
              프로젝트
              <br />
              기록
            </h1>
            <div className="editorial-opener__aside">
              <p className="editorial-opener__lead">
                양일고등학교 코딩동아리 소나 부원들이 만든 게임과 프로그램을
                연도별로 모아 둡니다.
              </p>
              <div className="editorial-opener__strip" aria-hidden="true">
                <SonaLamellaCanvas variant="archive" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="subpage-body subpage-body--archive">
        <div className="container">
          <ArchiveIndex onOpenProject={(slug) => onNavigate(`/works/${slug}`)} />
        </div>
      </section>
    </div>
  );
}
