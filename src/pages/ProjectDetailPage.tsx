import { useState } from 'react';
import { PROJECTS, getProjectBySlug, type ProjectEntry } from '../data/projects';
import { useMagneticSignal } from '../motion/SignalMotion';

interface ProjectDetailPageProps {
  slug: string;
  onNavigate: (to: string, options?: { hash?: string }) => void;
}

/**
 * Movement 06 — Project-Specific Curated Digital Exhibitions.
 * Each project uses its own personality & visual rhythm (Arcade: Playful Velvet-Indigo Stage
 * with 2-Up Playable Posters; Asterism: High-Key Architectural Editorial Proof Atelier)
 * united by SONA's shared hairline grammar, mono coordinates, and kinetic transitions.
 */
export function ProjectDetailPage({ slug, onNavigate }: ProjectDetailPageProps) {
  const project = getProjectBySlug(slug) ?? PROJECTS[0];
  const nextProject =
    PROJECTS[(PROJECTS.findIndex((p) => p.id === project.id) + 1) % PROJECTS.length];

  if (project.id === 'asterism-write') {
    return (
      <AsterismExhibitionPage
        key={project.id}
        project={project}
        nextProject={nextProject}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <ArcadeExhibitionPage
      key={project.id}
      project={project}
      nextProject={nextProject}
      onNavigate={onNavigate}
    />
  );
}

interface ExhibitionPageProps {
  project: ProjectEntry;
  nextProject: ProjectEntry;
  onNavigate: (to: string, options?: { hash?: string }) => void;
}

/* ============================================================================
   EXHIBITION 01 — SEOJUN ARCADE (Playful Kinetic Dark-Indigo Digital Poster)
   ============================================================================ */
function ArcadeExhibitionPage({ project, nextProject, onNavigate }: ExhibitionPageProps) {
  const [selectedShot, setSelectedShot] = useState(0);
  const primaryCtaRef = useMagneticSignal<HTMLAnchorElement>(6);
  const currentShot = project.screenshots[selectedShot] ?? project.screenshots[0];

  return (
    <article className="case-exhibition case-exhibition--arcade">
      <section className="arcade-case-hero">
        <div className="container">
          <div className="case-topbar mono">
            <button
              type="button"
              className="case-back-btn"
              onClick={() => onNavigate('/')}
            >
              ← SONA 홈
            </button>
            <span>EXHIBITION {project.indexLabel} / 02</span>
            <span>{project.creator} · {project.year}</span>
          </div>

          <div className="arcade-case-hero__head">
            <div className="arcade-case-hero__title-col">
              <span className="arcade-case-kicker mono">
                {project.authorshipLabel} · {project.status}
              </span>
              <h1 className="case-display-title">{project.title}</h1>
            </div>

            <div className="arcade-case-hero__lead-col">
              <p className="case-lead">{project.tagline}</p>
              <div className="case-actions">
                <a
                  ref={primaryCtaRef}
                  href={project.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--arcade-primary magnetic-target"
                >
                  <span>{project.externalLabel}</span>
                  <span aria-hidden="true">↗</span>
                </a>
                {project.secondaryLinks
                  .filter((l) => l.kind === 'repo')
                  .map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--ghost-light"
                    >
                      <span>{link.label}</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  ))}
              </div>
            </div>
          </div>

          {/* Monumental Interactive Cinema Screen Stage */}
          <div className="arcade-cinema">
            <div className="arcade-cinema__frame">
              <div className="arcade-cinema__chrome mono">
                <span>CRT FEED · {currentShot.badge}</span>
                <span>{project.externalUrl.replace(/^https?:\/\//, '')}</span>
              </div>
              <div className="arcade-cinema__viewport">
                <img
                  key={currentShot.id}
                  src={currentShot.src}
                  alt={currentShot.alt}
                  width={currentShot.width}
                  height={currentShot.height}
                />
              </div>
              <div className="arcade-cinema__caption">
                <span className="mono">0{selectedShot + 1}</span>
                <p>{currentShot.caption}</p>
              </div>
            </div>

            <div className="arcade-cinema__switcher" role="tablist" aria-label="오락실 화면 선택">
              {project.screenshots.map((shot, idx) => (
                <button
                  key={shot.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === selectedShot}
                  className={`arcade-switch-btn ${idx === selectedShot ? 'is-active' : ''}`}
                  onClick={() => setSelectedShot(idx)}
                >
                  <span className="mono">0{idx + 1} · {shot.badge}</span>
                  <strong>{shot.label}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Playable 2-Up Poster Spread for the Two Games */}
      {project.subItems && (
        <section className="arcade-posters" aria-label="수록 게임">
          <div className="container">
            <div className="arcade-posters__head">
              <span className="signal-eyebrow mono">PLAYABLE LINEUP</span>
              <h2>포털에서 바로 실행하는 게임 두 편.</h2>
            </div>

            <div className="arcade-posters__grid">
              {project.subItems.map((game, idx) => (
                <a
                  key={game.title}
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`game-poster game-poster--${idx === 0 ? 'mint' : 'yellow'}`}
                >
                  <div className="game-poster__top mono">
                    <span>GAME 0{idx + 1}</span>
                    <span>{game.genre}</span>
                  </div>
                  <h3 className="game-poster__title">{game.title}</h3>
                  <p className="game-poster__summary">{game.summary}</p>
                  <div className="game-poster__cta mono">
                    <span>{game.ctaLabel}</span>
                    <span aria-hidden="true">↗</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Concise Editorial Ledger */}
      <section className="case-editorial-band">
        <div className="container case-editorial-grid">
          <div>
            <span className="signal-eyebrow mono">ABOUT THE PROJECT</span>
            <div className="case-paragraphs">
              {project.extendedDescription.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          <div className="case-facts-col">
            <dl className="case-ruled-list">
              <div>
                <dt className="mono">제작</dt>
                <dd>{project.creator} ({project.creatorRole})</dd>
              </div>
              <div>
                <dt className="mono">주소</dt>
                <dd>
                  <a href={project.externalUrl} target="_blank" rel="noopener noreferrer">
                    {project.externalUrl.replace(/^https?:\/\//, '')} ↗
                  </a>
                </dd>
              </div>
              {project.highlights.map((hl) => (
                <div key={hl.index}>
                  <dt className="mono">{hl.index} · {hl.title}</dt>
                  <dd>{hl.body}</dd>
                </div>
              ))}
            </dl>

            {project.honestNotes && (
              <p className="case-marginalia mono">{project.honestNotes[0]}</p>
            )}
          </div>
        </div>
      </section>

      <NextWorkCurtain nextProject={nextProject} onNavigate={onNavigate} />
    </article>
  );
}

/* ============================================================================
   EXHIBITION 02 — ASTERISM WRITE (Luminous Architectural Editorial Proof Sheet)
   ============================================================================ */
function AsterismExhibitionPage({ project, nextProject, onNavigate }: ExhibitionPageProps) {
  const [selectedShot, setSelectedShot] = useState(0);
  const primaryCtaRef = useMagneticSignal<HTMLAnchorElement>(6);
  const currentShot = project.screenshots[selectedShot] ?? project.screenshots[0];
  const isTallPdf = currentShot.height > currentShot.width;

  return (
    <article className="case-exhibition case-exhibition--asterism">
      <section className="asterism-case-hero">
        <div className="container">
          <div className="case-topbar case-topbar--light mono">
            <button
              type="button"
              className="case-back-btn case-back-btn--light"
              onClick={() => onNavigate('/')}
            >
              ← SONA 홈
            </button>
            <span>EXHIBITION {project.indexLabel} / 02</span>
            <span>{project.status}</span>
          </div>

          <div className="asterism-case-spread">
            <div className="asterism-case-spread__brand">
              <h1 className="sr-only">{project.title}</h1>
              {project.artwork.wordmarkSrc && (
                <img
                  src={project.artwork.wordmarkSrc}
                  alt={project.artwork.wordmarkAlt ?? project.title}
                  width={380}
                  height={126}
                  className="asterism-case-wordmark"
                />
              )}
              <p className="asterism-case-tagline">{project.tagline}</p>
            </div>

            <div className="asterism-case-spread__meta">
              <dl className="asterism-spec-rail">
                <div>
                  <dt className="mono">CREATOR</dt>
                  <dd>{project.creator}</dd>
                </div>
                <div>
                  <dt className="mono">RELEASE</dt>
                  <dd>{project.status}</dd>
                </div>
                <div>
                  <dt className="mono">URL</dt>
                  <dd>
                    <a href={project.externalUrl} target="_blank" rel="noopener noreferrer">
                      {project.externalUrl.replace(/^https?:\/\//, '')} ↗
                    </a>
                  </dd>
                </div>
              </dl>

              <div className="case-actions">
                <a
                  ref={primaryCtaRef}
                  href={project.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--asterism-primary magnetic-target"
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
                    className="btn btn--outline-dark"
                  >
                    <span>{link.label}</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Architectural Editorial Proof Sheet Viewer */}
          <div className="proof-viewer">
            <div className="proof-viewer__tabs" role="tablist" aria-label="편집기 화면 선택">
              {project.screenshots.map((shot, idx) => (
                <button
                  key={shot.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === selectedShot}
                  className={`proof-tab ${idx === selectedShot ? 'is-active' : ''}`}
                  onClick={() => setSelectedShot(idx)}
                >
                  <span className="mono">FIG. 0{idx + 1}</span>
                  <strong>{shot.label}</strong>
                  <small>{shot.badge}</small>
                </button>
              ))}
            </div>

            <figure className={`proof-viewer__plate ${isTallPdf ? 'is-tall' : ''}`}>
              <img
                key={currentShot.id}
                src={currentShot.src}
                alt={currentShot.alt}
                width={currentShot.width}
                height={currentShot.height}
              />
              <figcaption className="proof-viewer__caption">
                <span className="mono">FIG. 0{selectedShot + 1} · {currentShot.badge}</span>
                <span>{currentShot.caption}</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Swiss Document Format Matrix + Editorial Architecture */}
      <section className="case-editorial-band case-editorial-band--asterism">
        <div className="container">
          {project.formatIcons && (
            <div className="swiss-format-section">
              <div className="swiss-format-section__head">
                <span className="signal-eyebrow mono">SUPPORTED FORMATS</span>
                <p className="mono">LOCAL BROWSER ENGINE · RUST / WASM</p>
              </div>
              <div className="swiss-format-grid">
                {project.formatIcons.map((fmt) => (
                  <div key={fmt.code} className="swiss-format-cell">
                    <img src={fmt.src} alt={`${fmt.code} 아이콘`} width={38} height={38} />
                    <div>
                      <strong className="mono">{fmt.code}</strong>
                      <span>{fmt.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="case-editorial-grid">
            <div>
              <span className="signal-eyebrow mono">OVERVIEW</span>
              <div className="case-paragraphs">
                {project.extendedDescription.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            <div className="case-facts-col">
              <dl className="case-ruled-list">
                {project.highlights.map((hl) => (
                  <div key={hl.index}>
                    <dt className="mono">{hl.index} · {hl.title}</dt>
                    <dd>{hl.body}</dd>
                  </div>
                ))}
              </dl>

              {project.honestNotes && project.honestNotes.length > 0 && (
                <div className="asterism-marginalia">
                  <span className="mono">NOTES · 1.0.0-RC.1</span>
                  <ul>
                    {project.honestNotes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <NextWorkCurtain nextProject={nextProject} onNavigate={onNavigate} />
    </article>
  );
}

/* ============================================================================
   SHARED FULL-BLEED KINETIC NEXT WORK CURTAIN
   ============================================================================ */
function NextWorkCurtain({
  nextProject,
  onNavigate,
}: {
  nextProject: ProjectEntry;
  onNavigate: (to: string, options?: { hash?: string }) => void;
}) {
  return (
    <section
      className={`next-curtain next-curtain--${nextProject.id}`}
      aria-label="다음 작품으로 이동"
    >
      <button
        type="button"
        className="next-curtain__trigger"
        onClick={() => onNavigate(`/works/${nextProject.slug}`)}
      >
        <div className="container next-curtain__inner">
          <div className="next-curtain__meta mono">
            <span>NEXT EXHIBITION · {nextProject.indexLabel}</span>
            <span>{nextProject.creator}</span>
          </div>
          <div className="next-curtain__row">
            <h2 className="next-curtain__title">{nextProject.title}</h2>
            <span className="next-curtain__arrow" aria-hidden="true">
              →
            </span>
          </div>
          <p className="next-curtain__sub">{nextProject.tagline}</p>
        </div>
      </button>
    </section>
  );
}
