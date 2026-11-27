import { useState } from 'react';
import { SignalHorizon } from '../components/SignalHorizon';
import { PROJECTS, getProjectBySlug } from '../data/projects';

interface ProjectDetailPageProps {
  slug: string;
  onNavigate: (to: string, options?: { hash?: string }) => void;
}

export function ProjectDetailPage({ slug, onNavigate }: ProjectDetailPageProps) {
  const project = getProjectBySlug(slug) ?? PROJECTS[0];
  const [selectedShot, setSelectedShot] = useState(0);

  const currentShot = project.screenshots[selectedShot] ?? project.screenshots[0];
  const nextProject =
    PROJECTS[(PROJECTS.findIndex((p) => p.id === project.id) + 1) % PROJECTS.length];

  return (
    <div
      className={`project-detail project-detail--${project.theme.polarity}`}
      style={
        {
          '--pd-surface': project.theme.surface,
          '--pd-elevated': project.theme.surfaceElevated,
          '--pd-ink': project.theme.ink,
          '--pd-muted': project.theme.muted,
          '--pd-accent': project.theme.accent,
          '--pd-accent-ink': project.theme.accentInk,
          '--pd-border': project.theme.border,
          '--pd-badge-bg': project.theme.badgeBg,
          '--pd-badge-ink': project.theme.badgeInk,
          '--ex-ink': project.theme.ink,
          '--ex-accent': project.theme.accent,
          '--ex-accent-ink': project.theme.accentInk,
          '--ex-border': project.theme.border,
          '--ex-badge-bg': project.theme.badgeBg,
          '--ex-badge-ink': project.theme.badgeInk,
        } as React.CSSProperties
      }
    >
      <section className="pd-hero">
        <div className="container">
          <div className="pd-breadcrumb">
            <button
              type="button"
              className="pd-back mono"
              onClick={() => onNavigate('/')}
            >
              ← 홈으로
            </button>
            <span className="mono pd-index">
              {project.indexLabel} / {String(PROJECTS.length).padStart(2, '0')}
            </span>
          </div>

          <div className="pd-hero__grid">
            <div className="pd-hero__main">
              <div className="pd-tags">
                <span className="exhibition__pill">{project.authorshipLabel}</span>
                <span className="mono pd-status">{project.status}</span>
              </div>

              {project.artwork.wordmarkSrc ? (
                <div className="pd-wordmark-wrap">
                  <h1 className="sr-only">{project.title}</h1>
                  <div className="exhibition__wordmark-plate exhibition__wordmark-plate--lg">
                    <img
                      src={project.artwork.wordmarkSrc}
                      alt={project.artwork.wordmarkAlt ?? project.title}
                      width={420}
                      height={140}
                      className="exhibition__wordmark-img"
                    />
                  </div>
                </div>
              ) : (
                <h1 className="pd-title">{project.title}</h1>
              )}

              <p className="pd-tagline">{project.tagline}</p>

              <div className="pd-hero__actions">
                <a
                  href={project.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn exhibition__btn-primary"
                >
                  <span>{project.externalLabel}</span>
                  <span aria-hidden="true">↗</span>
                </a>
                {project.secondaryLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn exhibition__btn-secondary"
                  >
                    <span>{link.label}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            </div>

            <dl className="pd-spec-card">
              <div>
                <dt className="mono">제작</dt>
                <dd>
                  <strong>{project.creator}</strong>
                  <span>{project.creatorRole}</span>
                </dd>
              </div>
              <div>
                <dt className="mono">분야</dt>
                <dd>
                  <strong>{project.category}</strong>
                </dd>
              </div>
              <div>
                <dt className="mono">연도</dt>
                <dd>
                  <strong className="mono">{project.year}</strong>
                </dd>
              </div>
              <div>
                <dt className="mono">주소</dt>
                <dd>
                  <a
                    href={project.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pd-url mono"
                  >
                    {project.externalUrl.replace(/^https?:\/\//, '')} ↗
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="pd-gallery">
            <div className="pd-gallery__stage">
              <div
                className={`pd-gallery__viewport ${
                  currentShot.height > currentShot.width ? 'is-tall' : ''
                }`}
              >
                <img
                  key={currentShot.id}
                  src={currentShot.src}
                  alt={currentShot.alt}
                  width={currentShot.width}
                  height={currentShot.height}
                />
              </div>
              <div className="pd-gallery__caption-bar">
                <span className="mono pd-gallery__badge">{currentShot.badge}</span>
                <p>{currentShot.caption}</p>
              </div>
            </div>

            <div className="pd-gallery__thumbs" role="tablist" aria-label="화면 선택">
              {project.screenshots.map((shot, idx) => (
                <button
                  key={shot.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === selectedShot}
                  className={`pd-thumb ${idx === selectedShot ? 'is-active' : ''}`}
                  onClick={() => setSelectedShot(idx)}
                >
                  <img src={shot.src} alt="" loading="lazy" />
                  <div>
                    <span className="mono">0{idx + 1}</span>
                    <strong>{shot.label}</strong>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SignalHorizon
        tone="light"
        accent={project.id === 'seojun-arcade' ? '#F4654D' : '#5B75FF'}
        label={project.englishTitle}
      />

      <section className="pd-essay">
        <div className="container pd-essay__grid">
          <div>
            <span className="eyebrow mono">INFO</span>
            <h2 className="section-title">소개</h2>
            <div className="pd-essay__paragraphs">
              {project.extendedDescription.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {project.subItems && (
              <div className="pd-subitems">
                <span className="eyebrow mono">GAMES</span>
                <div className="pd-subitems__list">
                  {project.subItems.map((game) => (
                    <div key={game.title} className="pd-subitem-card">
                      <span className="mono pd-subitem-card__genre">{game.genre}</span>
                      <h3>{game.title}</h3>
                      <p>{game.summary}</p>
                      <a
                        href={game.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn--dark btn--sm"
                      >
                        <span>{game.ctaLabel}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {project.formatIcons && (
              <div className="pd-formats">
                <span className="eyebrow mono">FORMATS</span>
                <div className="format-strip format-strip--essay">
                  {project.formatIcons.map((fmt) => (
                    <div key={fmt.code} className="format-chip format-chip--essay">
                      <img src={fmt.src} alt={`${fmt.code} 아이콘`} width={40} height={40} />
                      <div>
                        <strong className="mono">{fmt.code}</strong>
                        <span>{fmt.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pd-highlights">
            <span className="eyebrow mono">DETAILS</span>
            <h2 className="section-title">특징</h2>
            <dl className="pd-highlight-list">
              {project.highlights.map((hl) => (
                <div key={hl.index} className="pd-highlight-item">
                  <dt>
                    <span className="mono">{hl.index}</span>
                    {hl.title}
                  </dt>
                  <dd>{hl.body}</dd>
                </div>
              ))}
            </dl>

            {project.honestNotes && project.honestNotes.length > 0 && (
              <div className="pd-honest-box">
                <span className="mono pd-honest-box__label">참고</span>
                <ul>
                  {project.honestNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="pd-next">
        <div className="container pd-next__inner">
          <div>
            <span className="eyebrow mono">NEXT</span>
            <h2 className="pd-next__title">{nextProject.title}</h2>
            <p className="pd-next__sub">
              {nextProject.creator} · {nextProject.tagline}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--dark"
            onClick={() => {
              setSelectedShot(0);
              onNavigate(`/works/${nextProject.slug}`);
            }}
          >
            <span>다음 작품 보기</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
    </div>
  );
}
