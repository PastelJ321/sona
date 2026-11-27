import { useRef, useState } from 'react';
import type { ProjectEntry } from '../data/projects';
import type { ViewportProfile } from '../hooks/useViewportProfile';

interface ProjectExhibitionProps {
  project: ProjectEntry;
  viewport: ViewportProfile;
  onOpenDetail: (slug: string) => void;
}

export function ProjectExhibition({
  project,
  viewport,
  onOpenDetail,
}: ProjectExhibitionProps) {
  const [activeShotIndex, setActiveShotIndex] = useState(0);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const activeShot = project.screenshots[activeShotIndex] ?? project.screenshots[0];
  const isArcade = project.id === 'seojun-arcade';
  const isTabletLandscape = viewport.deviceClass === 'tablet-landscape';

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (viewport.isTouch || viewport.prefersReducedMotion || viewport.isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
    const ny = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
    setTilt({
      rx: -ny * 4.5,
      ry: nx * 5.5,
    });
  };

  const handleStagePointerLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const handleMobileScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const slideWidth = el.clientWidth;
    if (slideWidth <= 0) return;
    const nextIdx = Math.round(el.scrollLeft / slideWidth);
    if (nextIdx !== activeShotIndex && nextIdx >= 0 && nextIdx < project.screenshots.length) {
      setActiveShotIndex(nextIdx);
    }
  };

  const scrollToSlide = (idx: number) => {
    setActiveShotIndex(idx);
    if (viewport.isMobile && carouselRef.current) {
      carouselRef.current.scrollTo({
        left: idx * carouselRef.current.clientWidth,
        behavior: viewport.prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  };

  return (
    <article
      className={`exhibition exhibition--${project.id} ${
        project.theme.polarity === 'dark' ? 'exhibition--dark' : 'exhibition--light'
      } ${isTabletLandscape ? 'exhibition--tablet-split' : ''}`}
      style={
        {
          '--ex-surface': project.theme.surface,
          '--ex-elevated': project.theme.surfaceElevated,
          '--ex-ink': project.theme.ink,
          '--ex-muted': project.theme.muted,
          '--ex-accent': project.theme.accent,
          '--ex-accent-ink': project.theme.accentInk,
          '--ex-accent-2': project.theme.accentSecondary,
          '--ex-border': project.theme.border,
          '--ex-badge-bg': project.theme.badgeBg,
          '--ex-badge-ink': project.theme.badgeInk,
        } as React.CSSProperties
      }
      aria-labelledby={`exhibition-title-${project.id}`}
    >
      <div className="container exhibition__shell">
        {/* Top exhibition catalog bar */}
        <header className="exhibition__topbar">
          <div className="exhibition__catalog mono">
            <span className="exhibition__num">EXHIBITION {project.indexLabel} / 02</span>
            <span aria-hidden="true">·</span>
            <span>{project.categoryEn}</span>
            <span aria-hidden="true">·</span>
            <span>{project.year}</span>
          </div>
          <div className="exhibition__authorship">
            <span className="exhibition__pill">{project.authorshipLabel}</span>
            <span className="exhibition__status mono">{project.status}</span>
          </div>
        </header>

        {/* Main adaptive layout grid */}
        <div className="exhibition__grid">
          {/* Editorial Column */}
          <div className="exhibition__info">
            {project.artwork.wordmarkSrc ? (
              <div className="exhibition__wordmark-wrap">
                <h3 id={`exhibition-title-${project.id}`} className="sr-only">
                  {project.title}
                </h3>
                <div className="exhibition__wordmark-plate">
                  <img
                    src={project.artwork.wordmarkSrc}
                    alt={project.artwork.wordmarkAlt ?? project.title}
                    width={320}
                    height={107}
                    className="exhibition__wordmark-img"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            ) : (
              <div className="exhibition__title-block">
                <span className="exhibition__arcade-tag mono">PRESS START // PORTAL</span>
                <h3 id={`exhibition-title-${project.id}`} className="exhibition__title">
                  {project.title}
                </h3>
              </div>
            )}

            <p className="exhibition__tagline">{project.tagline}</p>
            <p className="exhibition__description">{project.description}</p>

            {/* Creator & Metadata spec table */}
            <dl className="exhibition__meta">
              <div>
                <dt className="mono">CREATOR</dt>
                <dd>
                  <strong>{project.creator}</strong>
                  <span>{project.creatorRole}</span>
                </dd>
              </div>
              <div>
                <dt className="mono">CATEGORY</dt>
                <dd>
                  <strong>{project.category}</strong>
                  <span>{project.tags.slice(0, 3).join(' · ')}</span>
                </dd>
              </div>
            </dl>

            {/* Project-specific authentic content block */}
            {isArcade && project.subItems && (
              <div className="exhibition__subgames" aria-label="수록 게임 목록">
                <p className="exhibition__sublabel mono">FEATURED GAMES IN PORTAL</p>
                <div className="subgames-grid">
                  {project.subItems.map((game) => (
                    <a
                      key={game.title}
                      href={game.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="subgame-card"
                      style={{ '--game-accent': game.accent } as React.CSSProperties}
                    >
                      <div className="subgame-card__head">
                        <span className="subgame-card__genre mono">{game.genre}</span>
                        <span className="subgame-card__arrow" aria-hidden="true">
                          ↗
                        </span>
                      </div>
                      <strong className="subgame-card__title">{game.title}</strong>
                      <p className="subgame-card__summary">{game.summary}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {!isArcade && project.formatIcons && (
              <div className="exhibition__formats" aria-label="지원 문서 형식">
                <p className="exhibition__sublabel mono">SUPPORTED DOCUMENT FORMATS</p>
                <div className="format-strip">
                  {project.formatIcons.map((fmt) => (
                    <div key={fmt.code} className="format-chip">
                      <img
                        src={fmt.src}
                        alt={`${fmt.code} 문서 아이콘`}
                        width={36}
                        height={36}
                        loading="lazy"
                        decoding="async"
                      />
                      <div>
                        <strong className="mono">{fmt.code}</strong>
                        <span>{fmt.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Primary & Direct External Actions (zero delay on external links) */}
            <div className="exhibition__actions">
              <a
                href={project.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn exhibition__btn-primary"
              >
                <span>{project.externalLabel}</span>
                <span aria-hidden="true">↗</span>
              </a>

              {!isArcade && (
                <a
                  href="https://asterism.quadraj.com/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn exhibition__btn-secondary"
                >
                  <span>웹 편집기 바로 열기</span>
                  <span aria-hidden="true">↗</span>
                </a>
              )}

              <button
                type="button"
                className="btn exhibition__btn-detail"
                onClick={() => onOpenDetail(project.slug)}
              >
                <span>전시 자세히 보기</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          {/* Interactive Media Stage Column */}
          <div className="exhibition__stage-col">
            {/* Desktop & Tablet interactive switchable stage */}
            {!viewport.isMobile ? (
              <div
                className="exhibition__stage"
                onPointerMove={handleStagePointerMove}
                onPointerLeave={handleStagePointerLeave}
              >
                <div
                  className="exhibition__frame"
                  style={{
                    transform:
                      tilt.rx === 0 && tilt.ry === 0
                        ? undefined
                        : `perspective(1100px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                  }}
                >
                  <div className="exhibition__frame-bar">
                    <div className="exhibition__frame-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="exhibition__frame-url mono">
                      {activeShot.badge} · {project.externalUrl.replace(/^https?:\/\//, '')}
                    </span>
                    {project.artwork.iconSrc && (
                      <img
                        src={project.artwork.iconSrc}
                        alt=""
                        width={22}
                        height={22}
                        className="exhibition__frame-icon"
                        loading="lazy"
                      />
                    )}
                  </div>

                  <div
                    className={`exhibition__viewport ${
                      activeShot.height > activeShot.width ? 'is-tall' : ''
                    }`}
                  >
                    <img
                      key={activeShot.id}
                      src={activeShot.src}
                      alt={activeShot.alt}
                      width={activeShot.width}
                      height={activeShot.height}
                      className="exhibition__img"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>

                {/* Screen Switcher Controls */}
                <div className="exhibition__switcher" role="tablist" aria-label={`${project.title} 화면 전환`}>
                  {project.screenshots.map((shot, idx) => {
                    const selected = idx === activeShotIndex;
                    return (
                      <button
                        key={shot.id}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        className={`exhibition__tab ${selected ? 'is-active' : ''}`}
                        onClick={() => scrollToSlide(idx)}
                      >
                        <span className="exhibition__tab-idx mono">0{idx + 1}</span>
                        <span className="exhibition__tab-label">{shot.label}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="exhibition__caption">{activeShot.caption}</p>
              </div>
            ) : (
              /* Mobile-bespoke tactile scroll-snap carousel */
              <div className="exhibition__mobile-gallery">
                <div
                  ref={carouselRef}
                  className="exhibition__carousel"
                  onScroll={handleMobileScroll}
                  aria-label={`${project.title} 스크린샷 슬라이드`}
                >
                  {project.screenshots.map((shot) => (
                    <figure key={shot.id} className="exhibition__slide">
                      <div className="exhibition__slide-head mono">
                        <span>{shot.badge}</span>
                        <span>{shot.label}</span>
                      </div>
                      <div className="exhibition__slide-img-wrap">
                        <img
                          src={shot.src}
                          alt={shot.alt}
                          width={shot.width}
                          height={shot.height}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <figcaption>{shot.caption}</figcaption>
                    </figure>
                  ))}
                </div>

                <div className="exhibition__dots" role="tablist" aria-label="슬라이드 선택">
                  {project.screenshots.map((shot, idx) => (
                    <button
                      key={shot.id}
                      type="button"
                      role="tab"
                      aria-selected={idx === activeShotIndex}
                      aria-label={`${shot.label} 화면 보기`}
                      className={`exhibition__dot-btn ${idx === activeShotIndex ? 'is-active' : ''}`}
                      onClick={() => scrollToSlide(idx)}
                    >
                      <span>{shot.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
