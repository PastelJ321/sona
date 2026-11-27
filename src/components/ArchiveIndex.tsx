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

export function ArchiveIndex({
  compact = false,
  onOpenProject,
  onOpenFullArchive,
}: ArchiveIndexProps) {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [authorship, setAuthorship] = useState<AuthorshipFilter>('all');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('index');

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

  return (
    <div className="archive-block">
      <div className="archive-controls">
        <div className="archive-filters" role="group" aria-label="카테고리 필터">
          {(['all', '게임', '소프트웨어'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-pill ${category === cat ? 'is-active' : ''}`}
              aria-pressed={category === cat}
              onClick={() => setCategory(cat)}
            >
              {cat === 'all' ? '전체 분야' : cat}
            </button>
          ))}
        </div>

        <div className="archive-controls__right">
          <div className="archive-filters" role="group" aria-label="제작 구분 필터">
            {(
              [
                { id: 'all', label: '전체 구분' },
                { id: 'individual', label: '개인 작품' },
                { id: 'member-linked', label: '부원·연계' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`filter-pill filter-pill--subtle ${
                  authorship === item.id ? 'is-active' : ''
                }`}
                aria-pressed={authorship === item.id}
                onClick={() => setAuthorship(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {!compact && (
            <div className="archive-view-toggle" role="group" aria-label="보기 방식">
              <button
                type="button"
                className={`filter-pill filter-pill--subtle ${
                  layoutMode === 'index' ? 'is-active' : ''
                }`}
                aria-pressed={layoutMode === 'index'}
                onClick={() => setLayoutMode('index')}
              >
                인덱스
              </button>
              <button
                type="button"
                className={`filter-pill filter-pill--subtle ${
                  layoutMode === 'board' ? 'is-active' : ''
                }`}
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
        <div className="archive-empty">
          <p className="mono">NO MATCHING ENTRIES</p>
          <p>선택한 조건에 해당하는 등록 작품이 없습니다.</p>
          <button
            type="button"
            className="btn btn--outline-dark"
            onClick={() => {
              setCategory('all');
              setAuthorship('all');
            }}
          >
            필터 초기화
          </button>
        </div>
      ) : (
        groupedByYear.map(({ year, items }) => (
          <div key={year} className="archive-year-group">
            <div className="archive-year-head">
              <span className="archive-year-head__year mono">{year}</span>
              <span className="archive-year-head__line" aria-hidden="true" />
              <span className="archive-year-head__count mono">
                {String(items.length).padStart(2, '0')} REGISTERED
              </span>
            </div>

            {layoutMode === 'index' || compact ? (
              <ol className="archive-rows">
                {items.map((project) => (
                  <ArchiveRow
                    key={project.id}
                    project={project}
                    onOpenProject={onOpenProject}
                  />
                ))}
              </ol>
            ) : (
              <div className="archive-board">
                {items.map((project) => (
                  <article key={project.id} className="archive-board-card">
                    <button
                      type="button"
                      className="archive-board-card__media"
                      onClick={() => onOpenProject(project.slug)}
                      aria-label={`${project.title} 전시 상세 페이지 열기`}
                    >
                      <img
                        src={project.artwork.coverSrc}
                        alt={project.artwork.coverAlt}
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                    <div className="archive-board-card__body">
                      <div className="archive-board-card__meta mono">
                        <span>{project.indexLabel}</span>
                        <span>{project.category}</span>
                        <span>{project.authorshipLabel}</span>
                      </div>
                      <h3>{project.title}</h3>
                      <p>{project.tagline}</p>
                      <div className="archive-board-card__foot">
                        <span className="archive-board-card__creator">{project.creator}</span>
                        <div className="archive-board-card__links">
                          <button
                            type="button"
                            className="text-action"
                            onClick={() => onOpenProject(project.slug)}
                          >
                            상세 →
                          </button>
                          <a
                            href={project.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-action"
                          >
                            방문 ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {/* Honest open-archive note — never filled with fake projects */}
      <div className="archive-colophon">
        <div>
          <span className="mono archive-colophon__code">ARCHIVE ARCHITECTURE // EXTENSIBLE</span>
          <p>
            현재 {PROJECTS.length}개의 실제 작품이 등재되어 있습니다. 앞으로 SONA 부원들이
            완성하는 새 게임과 소프트웨어는 이 연도별 아카이브 구조에 순차적으로 기록됩니다.
          </p>
        </div>
        {compact && onOpenFullArchive && (
          <button
            type="button"
            className="btn btn--outline-dark"
            onClick={onOpenFullArchive}
          >
            <span>전체 아카이브 열기</span>
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}

function ArchiveRow({
  project,
  onOpenProject,
}: {
  project: ProjectEntry;
  onOpenProject: (slug: string) => void;
}) {
  return (
    <li className="archive-row">
      <div className="archive-row__thumb">
        <img
          src={project.artwork.coverSrc}
          alt={project.artwork.coverAlt}
          width={160}
          height={100}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="archive-row__main">
        <div className="archive-row__meta mono">
          <span>NO.{project.indexLabel}</span>
          <span>·</span>
          <span>{project.category}</span>
          <span>·</span>
          <span>{project.authorshipLabel}</span>
        </div>
        <h3 className="archive-row__title">
          <button
            type="button"
            className="archive-row__title-btn"
            onClick={() => onOpenProject(project.slug)}
          >
            {project.title}
          </button>
        </h3>
        <p className="archive-row__desc">{project.tagline}</p>
      </div>

      <div className="archive-row__creator">
        <span className="mono">CREATOR</span>
        <strong>{project.creator}</strong>
        <span className="archive-row__status">{project.status}</span>
      </div>

      <div className="archive-row__actions">
        <button
          type="button"
          className="btn btn--outline-dark btn--sm"
          onClick={() => onOpenProject(project.slug)}
        >
          <span>전시 보기</span>
          <span aria-hidden="true">→</span>
        </button>
        <a
          href={project.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--dark btn--sm"
        >
          <span>열기</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </li>
  );
}
