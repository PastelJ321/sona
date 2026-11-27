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
            <span className="eyebrow mono">ABOUT // YANGIL HIGH SCHOOL</span>
            <h1 className="subpage-title">
              직접 만들어 보고,
              <br />
              공유하는 동아리
            </h1>
          </div>
          <div className="subpage-hero__meta">
            <p className="subpage-lead">{CLUB_INFO.aboutSummary[0]}</p>
          </div>
        </div>
      </section>

      <SignalHorizon tone="light" accent="#F4654D" label="SONA // CLUB STATEMENT" />

      <section className="subpage-body">
        <div className="container about-layout">
          <div className="about-col-main">
            <h2>SONA가 기록하는 방식</h2>
            <p className="about-paragraph">{CLUB_INFO.aboutSummary[1]}</p>

            <div className="about-principles">
              {CLUB_INFO.principles.map((p) => (
                <article key={p.index} className="about-principle-card">
                  <span className="mono about-principle-card__num">{p.index}</span>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="about-sidebar">
            <div className="about-info-box">
              <span className="mono about-info-box__label">ATELIER SPEC</span>
              <dl>
                <div>
                  <dt>동아리</dt>
                  <dd>양일고등학교 코딩동아리 SONA</dd>
                </div>
                <div>
                  <dt>등록 작품</dt>
                  <dd>{PROJECTS.length}개 (서준이네 오락실, Asterism Write)</dd>
                </div>
                <div>
                  <dt>목표 도메인</dt>
                  <dd className="mono">sona.quadraj.com</dd>
                </div>
                <div>
                  <dt>웹 구축 · 호스팅</dt>
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
              <p>지금 전시 중인 두 작품을 바로 살펴보세요.</p>
              <button
                type="button"
                className="btn btn--dark"
                onClick={() => onNavigate('/', { hash: 'works' })}
              >
                <span>전시 작품 보러 가기</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
