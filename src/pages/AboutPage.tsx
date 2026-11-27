import { SignalHorizon } from '../components/SignalHorizon';
import { CLUB_INFO } from '../data/club';
import { PROJECTS } from '../data/projects';

interface AboutPageProps {
  onNavigate: (to: string, options?: { hash?: string }) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="subpage">
      <section className="subpage-hero">
        <div className="container subpage-hero__grid">
          <div>
            <span className="eyebrow mono">SONA · 양일고등학교</span>
            <h1 className="subpage-title">소나 소개</h1>
          </div>
          <div className="subpage-hero__meta">
            <p className="subpage-lead">{CLUB_INFO.aboutParagraphs[0]}</p>
          </div>
        </div>
      </section>

      <SignalHorizon tone="light" accent="#F4654D" label="SONA · ABOUT" />

      <section className="subpage-body">
        <div className="container about-layout">
          <div className="about-col-main">
            <h2>우리가 만드는 것들</h2>
            <p className="about-paragraph">{CLUB_INFO.aboutParagraphs[1]}</p>

            <div className="about-works-list">
              {PROJECTS.map((project) => (
                <article key={project.id} className="about-work-item">
                  <div className="about-work-item__meta mono">
                    <span>{project.year}</span>
                    <span>·</span>
                    <span>{project.authorshipLabel}</span>
                    <span>·</span>
                    <span>{project.creator}</span>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <div className="about-work-item__links">
                    <button
                      type="button"
                      className="btn btn--outline-dark btn--sm"
                      onClick={() => onNavigate(`/works/${project.slug}`)}
                    >
                      <span>상세 보기 →</span>
                    </button>
                    <a
                      href={project.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--dark btn--sm"
                    >
                      <span>{project.externalLabel} ↗</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="about-sidebar">
            <div className="about-info-box">
              <span className="mono about-info-box__label">INFO</span>
              <dl>
                {CLUB_INFO.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
                <div>
                  <dt>웹 호스팅</dt>
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
              <p className="about-info-box__notice">{CLUB_INFO.integrityNotice}</p>
            </div>

            <div className="about-cta-box">
              <p>3D 공간에서 두 작품을 둘러볼 수 있습니다.</p>
              <button
                type="button"
                className="btn btn--dark"
                onClick={() => onNavigate('/')}
              >
                <span>공간으로 돌아가기</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
