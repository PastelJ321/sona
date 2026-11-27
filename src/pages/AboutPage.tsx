import { SonaLamellaCanvas } from '../components/SonaLamellaCanvas';
import { CLUB_INFO } from '../data/club';
import { PROJECTS } from '../data/projects';

interface AboutPageProps {
  onNavigate: (to: string, options?: { hash?: string }) => void;
}

/**
 * Movement 07 — About SONA.
 * Human, authentic student-club monograph anchored by an interactive 2D Generative
 * Lamella Signal Matrix running SONA's exact spring physics without needing WebGL.
 */
export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="about-monograph">
      {/* Dark Architectural Opening + Live Generative SONA Signal Matrix */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero__bar mono">
            <span>[ ABOUT · SONA ]</span>
            <span>양일고등학교 코딩동아리</span>
            <span>sona.quadraj.com</span>
          </div>

          <div className="about-hero__grid">
            <div className="about-hero__copy">
              <h1 className="about-hero__title">
                직접 만들고,
                <br />
                바로 열어보는
                <br />
                코딩동아리.
              </h1>
              <p className="about-hero__lead">{CLUB_INFO.aboutParagraphs[0]}</p>
              <p className="about-hero__sub">{CLUB_INFO.aboutParagraphs[1]}</p>
            </div>

            <div className="about-hero__artwork">
              <div className="about-matrix-frame">
                <SonaLamellaCanvas variant="about" />
                <div className="about-matrix-frame__caption mono">
                  <span>SONA SIGNAL MATRIX</span>
                  <span>MOVE OR TAP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Warm Porcelain Works Ledger & Honest Club Facts */}
      <section className="about-ledger">
        <div className="container about-ledger__grid">
          <div className="about-ledger__works">
            <span className="signal-eyebrow mono">CURRENT WORKS · 2026</span>
            <h2 className="about-ledger__heading">현재 올라온 작업물</h2>

            <ol className="about-works-rows">
              {PROJECTS.map((project) => (
                <li key={project.id} className="about-works-row">
                  <div className="about-works-row__meta mono">
                    <span>{project.indexLabel}</span>
                    <span>·</span>
                    <span>{project.authorshipLabel}</span>
                    <span>·</span>
                    <span>{project.creator}</span>
                  </div>
                  <div className="about-works-row__main">
                    <h3>
                      <button
                        type="button"
                        onClick={() => onNavigate(`/works/${project.slug}`)}
                      >
                        {project.title}
                      </button>
                    </h3>
                    <p>{project.description}</p>
                  </div>
                  <div className="about-works-row__actions mono">
                    <button
                      type="button"
                      className="archive-inline-action"
                      onClick={() => onNavigate(`/works/${project.slug}`)}
                    >
                      전시 보기 →
                    </button>
                    <a
                      href={project.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="archive-inline-action archive-inline-action--ext"
                    >
                      {project.externalLabel} ↗
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="about-ledger__facts">
            <span className="signal-eyebrow mono">COLOPHON</span>
            <dl className="about-facts-list">
              {CLUB_INFO.facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="mono">{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
              <div>
                <dt className="mono">호스팅</dt>
                <dd>
                  <a
                    href={CLUB_INFO.hostPartner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    QuadraJ ↗
                  </a>
                </dd>
              </div>
            </dl>

            <p className="about-facts-notice">{CLUB_INFO.integrityNotice}</p>

            <button
              type="button"
              className="btn btn--dark"
              onClick={() => onNavigate('/')}
            >
              <span>메인 전시로 돌아가기</span>
              <span aria-hidden="true">→</span>
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
}
