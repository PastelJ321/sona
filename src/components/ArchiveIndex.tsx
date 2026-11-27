import { useMemo, useState } from 'react';
import {
  PROJECTS,
  getArchiveYears,
  type ProjectAuthorship,
  type ProjectEntry,
} from '../data/projects';

interface ArchiveIndexProps {
  compact?: boolean;
  onOpenProject: (slug: string) => void;
  onOpenFullArchive?: () => void;
}

type CategoryFilter = 'all' | '게임' | '소프트웨어';
type AuthorshipFilter = 'all' | ProjectAuthorship;
type LayoutMode = 'index' | 'board';

/**
 * Movement 05 — Editorial Typographic Archive (Are.na clarity × monopo london scale × 14islands motion).
 * Replaces generic rounded pill filters & small boxed rows with oversized interactive titles,
 * live hover preview stage with aperture reveal, and clean hairline year indexing.
 */
export function ArchiveIndex({
  compact = false,
  onOpenProject,
  onOpenFullArchive,
}: ArchiveIndexProps) {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [authorship, setAuthorship] = useState<AuthorshipFilter>('all');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('index');
  const [hoveredId, setHoveredId] = useState<string>(PROJECTS[0]?.id ?? '');
  const [previewTilt, setPreviewTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const years = useMemo(() => getArchiveYears(), []);

  const filtered = useMemo(() => {
    return PROJECTS.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (authorship !== 'all' && p.authorship !== authorship) return false;
      return true;
    });
  }, [category, authorship]);

  const groupedByYear = useMemo(() => {
    return years
      .map((year) => ({
        year,
        items: filtered.filter((p) => p.year === year),
      }))
      .filter((group) => group.items.length > 0);
  }, [filtered, years]);

  const activePreview: ProjectEntry | undefined =
    filtered.find((p) => p.id === hoveredId) ?? filtered[0] ?? PROJECTS[0];

  const handleRowMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    setPreviewTilt({ x: nx * 5, y: ny * 4 });
  };

  return (
    <div className="archive-monograph">
      {/* Minimal Are.na-inspired Underline Filter Rail */}
      <div className="archive-rail">
        <div className="archive-rail__group" role="group" aria-label="분야 필터">
          <span className="archive-rail__label mono">TYPE</span>
          {(['all', '게임', '소프트웨어'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`archive-filter-tab ${category === cat ? 'is-active' : ''}`}
              aria-pressed={category === cat}
              onClick={() => setCategory(cat)}
            >
              {cat === 'all' ? '전체' : cat}
            </button>
          ))}
        </div>

        <div className="archive-rail__right">
          <div className="archive-rail__group" role="group" aria-label="제작 구분">
            <span className="archive-rail__label mono">KIND</span>
            {(
              [
                { id: 'all', label: '모두' },
                { id: 'individual', label: '개인 작품' },
                { id: 'member-linked', label: '연계 프로젝트' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`archive-filter-tab ${authorship === item.id ? 'is-active' : ''}`}
                aria-pressed={authorship === item.id}
                onClick={() => setAuthorship(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {!compact && (
            <div className="archive-rail__group" role="group" aria-label="보기 방식">
              <span className="archive-rail__label mono">VIEW</span>
              <button
                type="button"
                className={`archive-filter-tab ${layoutMode === 'index' ? 'is-active' : ''}`}
                aria-pressed={layoutMode === 'index'}
                onClick={() => setLayoutMode('index')}
              >
                목록
              </button>
              <button
                type="button"
                className={`archive-filter-tab ${layoutMode === 'board' ? 'is-active' : ''}`}
                aria-pressed={layoutMode === 'board'}
                onClick={() => setLayoutMode('board')}
              >
                보드
              </button>
            </div>
          )}
        </div>
      </div>

      {groupedByYear.length === 0 ? (
        <div className="archive-empty-state">
          <p>조건에 맞는 작품이 없습니다.</p>
          <button
            type="button"
            className="editorial-text-link editorial-text-link--dark"
            onClick={() => {
              setCategory('all');
              setAuthorship('all');
            }}
          >
            <span>필터 초기화 →</span>
          </button>
        </div>
      ) : layoutMode === 'index' || compact ? (
        <div className="archive-stage-grid">
          <div className="archive-years-col">
            {groupedByYear.map(({ year, items }) => (
              <div key={year} className="archive-year-block">
                <div className="archive-year-marker">
                  <span className="archive-year-marker__num mono">{year}</span>
                  <span className="archive-year-marker__count mono">
                    [ {String(items.length).padStart(2, '0')} ]
                  </span>
                </div>

                <ol className="archive-typo-list">
                  {items.map((project) => {
                    const isFocused = activePreview?.id === project.id;
                    return (
                      <li
                        key={project.id}
                        className={`archive-typo-row ${isFocused ? 'is-focused' : ''}`}
                        onPointerEnter={() => setHoveredId(project.id)}
                        onPointerMove={handleRowMove}
                        onPointerLeave={() => setPreviewTilt({ x: 0, y: 0 })}
                      >
                        <div className="archive-typo-row__top mono">
                          <span className="archive-typo-row__idx">{project.indexLabel}</span>
                          <span>{project.category}</span>
                          <span>·</span>
                          <span>{project.creator}</span>
                          <span className="archive-typo-row__status">{project.status}</span>
                        </div>

                        <div className="archive-typo-row__main">
                          <h3 className="archive-typo-row__title">
                            <button
                              type="button"
                              className="archive-typo-row__btn"
                              onFocus={() => setHoveredId(project.id)}
                              onClick={() => onOpenProject(project.slug)}
                            >
                              <span>{project.title}</span>
                              <span className="archive-typo-row__arrow" aria-hidden="true">
                                →
                              </span>
                            </button>
                          </h3>
                          <p className="archive-typo-row__tagline">{project.tagline}</p>
                        </div>

                        {/* Mobile/Tablet inline editorial plate */}
                        <button
                          type="button"
                          className="archive-typo-row__mobile-thumb"
                          onClick={() => onOpenProject(project.slug)}
                          aria-label={`${project.title} 자세히 보기`}
                        >
                          <img
                            src={project.artwork.coverSrc}
                            alt={project.artwork.coverAlt}
                            loading="lazy"
                            decoding="async"
                          />
                        </button>

                        <div className="archive-typo-row__links mono">
                          <button
                            type="button"
                            className="archive-inline-action"
                            onClick={() => onOpenProject(project.slug)}
                          >
                            자세히 보기 →
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
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>

          {/* Desktop Kinetic Aperture Preview Stage */}
          {activePreview && (
            <aside className="archive-preview-stage" aria-label="선택된 작품 미리보기">
              <div
                className="archive-preview-frame"
                style={
                  {
                    '--tilt-x': `${previewTilt.x.toFixed(2)}deg`,
                    '--tilt-y': `${(-previewTilt.y).toFixed(2)}deg`,
                    '--preview-accent': activePreview.theme.accent,
                  } as React.CSSProperties
                }
              >
                <div className="archive-preview-frame__bar mono">
                  <span>FIG. {activePreview.indexLabel}</span>
                  <span>{activePreview.englishTitle}</span>
                </div>
                <button
                  type="button"
                  className="archive-preview-frame__media"
                  onClick={() => onOpenProject(activePreview.slug)}
                  aria-label={`${activePreview.title} 상세 페이지로 이동`}
                >
                  <img
                    key={activePreview.id}
                    src={activePreview.artwork.coverSrc}
                    alt={activePreview.artwork.coverAlt}
                  />
                </button>
                <div className="archive-preview-frame__foot">
                  <div className="archive-preview-frame__tags mono">
                    {activePreview.tags.map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                  <p>{activePreview.description}</p>
                </div>
              </div>
            </aside>
          )}
        </div>
      ) : (
        /* Editorial Asymmetric Plate Board View on /archive */
        <div className="archive-editorial-board">
          {groupedByYear.map(({ year, items }) => (
            <div key={year} className="archive-year-block">
              <div className="archive-year-marker">
                <span className="archive-year-marker__num mono">{year}</span>
                <span className="archive-year-marker__count mono">
                  [ {String(items.length).padStart(2, '0')} ]
                </span>
              </div>
              <div className="archive-plate-grid">
                {items.map((project, idx) => (
                  <article
                    key={project.id}
                    className={`archive-plate ${idx % 2 === 1 ? 'archive-plate--offset' : ''}`}
                  >
                    <button
                      type="button"
                      className="archive-plate__media"
                      onClick={() => onOpenProject(project.slug)}
                      aria-label={`${project.title} 자세히 보기`}
                    >
                      <span className="archive-plate__corner mono">{project.indexLabel}</span>
                      <img
                        src={project.artwork.coverSrc}
                        alt={project.artwork.coverAlt}
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                    <div className="archive-plate__body">
                      <div className="archive-plate__meta mono">
                        <span>{project.category}</span>
                        <span>·</span>
                        <span>{project.creator}</span>
                      </div>
                      <h3>
                        <button
                          type="button"
                          onClick={() => onOpenProject(project.slug)}
                        >
                          {project.title}
                        </button>
                      </h3>
                      <p>{project.tagline}</p>
                      <div className="archive-plate__actions mono">
                        <button
                          type="button"
                          className="archive-inline-action"
                          onClick={() => onOpenProject(project.slug)}
                        >
                          상세 →
                        </button>
                        <a
                          href={project.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="archive-inline-action archive-inline-action--ext"
                        >
                          열기 ↗
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiet Hairline Footnote */}
      <div className="archive-footnote">
        <p className="mono">
          새 작업물이 완성되면 같은 연도 색인에 이어서 등록합니다.
        </p>
        {compact && onOpenFullArchive && (
          <button
            type="button"
            className="editorial-text-link editorial-text-link--dark"
            onClick={onOpenFullArchive}
          >
            <span>전체 기록 페이지 열기</span>
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
