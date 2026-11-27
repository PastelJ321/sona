import { ArchiveIndex } from '../components/ArchiveIndex';
import { LivingSignalStage } from '../components/LivingSignalStage';
import { ProjectExhibition } from '../components/ProjectExhibition';
import { SignalHorizon } from '../components/SignalHorizon';
import { CLUB_INFO } from '../data/club';
import { PROJECTS } from '../data/projects';
import type { ViewportProfile } from '../hooks/useViewportProfile';

interface HomePageProps {
  viewport: ViewportProfile;
  onNavigate: (to: string, options?: { hash?: string }) => void;
}

export function HomePage({ viewport, onNavigate }: HomePageProps) {
  const scrollToWorks = () => {
    const el = document.getElementById('works');
    if (el) {
      el.scrollIntoView({
        behavior: viewport.prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <div className="home-page">
      {/* Movement I: Basalt Interactive Living Signal Stage */}
      <LivingSignalStage
        viewport={viewport}
        onExploreWorks={scrollToWorks}
        onOpenArchive={() => onNavigate('/archive')}
      />

      {/* Scroll-reactive Signal Horizon transition */}
      <SignalHorizon tone="light" accent="#5B75FF" label="LIVING SIGNAL // MANIFESTO" />

      {/* Movement II: Porcelain Editorial Manifesto */}
      <section className="manifesto-section" aria-labelledby="manifesto-heading">
        <div className="container manifesto-grid">
          <div className="manifesto-head">
            <span className="eyebrow mono">01 // DIGITAL ATELIER</span>
            <h2 id="manifesto-heading" className="manifesto-title">
              작은 신호가 모여
              <br />
              하나의 작품이 됩니다.
            </h2>
          </div>
          <div className="manifesto-body">
            <p className="manifesto-lead">
              SONA는 양일고등학교의 학생들이 직접 게임과 소프트웨어, 실험적인
              인터페이스를 만들고 공개하는 코딩동아리입니다.
            </p>
            <p className="manifesto-sub">
              단순한 소개 글을 나열하는 대신, 지금 실제로 실행해 볼 수 있는
              학생들의 창작물을 충분한 공간으로 전시하고 원본 프로젝트로 바로
              연결합니다.
            </p>
            <div className="manifesto-pillars">
              {CLUB_INFO.principles.map((item) => (
                <div key={item.index} className="manifesto-pillar">
                  <span className="mono manifesto-pillar__idx">{item.index}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Movement III: Curated Exhibition Hall */}
      <section id="works" className="works-hall" aria-labelledby="works-heading">
        <div className="container works-hall__header">
          <div>
            <span className="eyebrow mono">02 // CURATED EXHIBITIONS</span>
            <h2 id="works-heading" className="section-title">
              현재 전시 중인 작품
            </h2>
          </div>
          <p className="works-hall__intro">
            각 작품의 고유한 색감과 인터페이스를 유지한 채 SONA의 전시 체계
            안에서 소개합니다. 화면 탭을 전환해 실제 실행 모습을 확인하고,
            버튼을 눌러 바로 방문할 수 있습니다.
          </p>
        </div>

        <div className="works-hall__list">
          {PROJECTS.map((project, idx) => (
            <div key={project.id}>
              <ProjectExhibition
                project={project}
                viewport={viewport}
                onOpenDetail={(slug) => onNavigate(`/works/${slug}`)}
              />
              {idx === 0 && (
                <SignalHorizon
                  tone="light"
                  accent="#F4654D"
                  label="EXHIBITION 01 → 02 // PHASE SHIFT"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Movement IV: Scalable Yearly Digital Archive Preview */}
      <section className="home-archive" aria-labelledby="home-archive-heading">
        <div className="container">
          <div className="home-archive__head">
            <div>
              <span className="eyebrow mono">03 // DIGITAL ARCHIVE</span>
              <h2 id="home-archive-heading" className="section-title">
                연도별 프로젝트 인덱스
              </h2>
            </div>
            <p className="home-archive__sub">
              학생 개인 작품과 부원·연계 프로젝트를 구분해 기록하며, 새 작업물이
              완성될 때마다 같은 구조로 확장됩니다.
            </p>
          </div>

          <ArchiveIndex
            compact
            onOpenProject={(slug) => onNavigate(`/works/${slug}`)}
            onOpenFullArchive={() => onNavigate('/archive')}
          />
        </div>
      </section>

      {/* Movement V: Concise About Callout */}
      <section className="home-about-band" aria-labelledby="home-about-heading">
        <div className="container home-about-band__grid">
          <div>
            <span className="eyebrow eyebrow--light mono">04 // ABOUT SONA</span>
            <h2 id="home-about-heading" className="home-about-band__title">
              양일고등학교 코딩동아리 SONA
            </h2>
          </div>
          <div className="home-about-band__body">
            <p>{CLUB_INFO.aboutSummary[0]}</p>
            <button
              type="button"
              className="btn btn--lime"
              onClick={() => onNavigate('/about')}
            >
              <span>동아리 소개 더 보기</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
