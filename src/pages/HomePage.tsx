import { useCallback, useEffect, useRef, useState } from 'react';
import { ArchiveIndex } from '../components/ArchiveIndex';
import { SignalHorizon } from '../components/SignalHorizon';
import { PROJECTS } from '../data/projects';
import type { ViewportProfile } from '../hooks/useViewportProfile';
import type { MaterialSignalStudio, ScrollChapters } from '../studio/MaterialSignalStudio';

interface HomePageProps {
  viewport: ViewportProfile;
  onNavigate: (to: string, options?: { hash?: string }) => void;
  onHeaderPolarityChange?: (isLightSurface: boolean) => void;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function smoothRange(v: number, edge0: number, edge1: number): number {
  const t = clamp01((v - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function HomePage({
  viewport,
  onNavigate,
  onHeaderPolarityChange,
}: HomePageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const studioRef = useRef<MaterialSignalStudio | null>(null);
  const chaptersWrapRef = useRef<HTMLDivElement | null>(null);
  const heroSecRef = useRef<HTMLElement | null>(null);
  const arcadeSecRef = useRef<HTMLElement | null>(null);
  const asterismSecRef = useRef<HTMLElement | null>(null);

  const [arcadeShot, setArcadeShot] = useState(0);
  const [asterismShot, setAsterismShot] = useState(0);
  const [webglFailed, setWebglFailed] = useState(false);

  const arcadeProject = PROJECTS[0];
  const asterismProject = PROJECTS[1];

  // Compute exact scroll-choreography blend weights directly from real DOM section geometry
  const computeScrollChapters = useCallback((): ScrollChapters => {
    const vh = Math.max(1, window.innerHeight);
    const heroRect = heroSecRef.current?.getBoundingClientRect();
    const arcadeRect = arcadeSecRef.current?.getBoundingClientRect();
    const asterismRect = asterismSecRef.current?.getBoundingClientRect();

    // Hero exits completely before Exhibition 01 settles into center stage
    const heroExit = heroRect ? smoothRange(-heroRect.top / vh, 0.08, 0.66) : 0;

    // Arcade reaches 1.0 when centered and exits cleanly to 0 before Asterism enters
    let arcadeFocus = 0;
    if (arcadeRect) {
      const centerDist = Math.abs(arcadeRect.top + arcadeRect.height * 0.5 - vh * 0.5) / vh;
      arcadeFocus = 1 - smoothRange(centerDist, 0.14, 0.54);
    }

    // Asterism reaches 1.0 when centered and triggers bright daylight studio polarity
    let asterismFocus = 0;
    let daylightBlend = 0;
    if (asterismRect) {
      const centerDist = Math.abs(asterismRect.top + asterismRect.height * 0.5 - vh * 0.5) / vh;
      asterismFocus = 1 - smoothRange(centerDist, 0.14, 0.58);
      daylightBlend = smoothRange(1 - asterismRect.top / vh, 0.3, 0.72);
    }

    return { heroExit, arcadeFocus, asterismFocus, daylightBlend };
  }, []);

  // Lazy-load the Three.js Material Signal Photographic Studio
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = chaptersWrapRef.current;
    if (!canvas || !wrap) return;

    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let onVisibility: (() => void) | null = null;
    let rafScroll = 0;

    const syncScroll = () => {
      cancelAnimationFrame(rafScroll);
      rafScroll = requestAnimationFrame(() => {
        const chapters = computeScrollChapters();
        studioRef.current?.setScrollChapters(chapters);
        onHeaderPolarityChange?.(chapters.daylightBlend > 0.52);
      });
    };

    void import('../studio/MaterialSignalStudio')
      .then(({ MaterialSignalStudio }) => {
        if (cancelled) return;
        const studio = new MaterialSignalStudio({
          canvas,
          deviceClass: viewport.deviceClass,
          prefersReducedMotion: viewport.prefersReducedMotion,
          onWebGLFailed: () => setWebglFailed(true),
        });
        studioRef.current = studio;
        syncScroll();

        ro = new ResizeObserver(() => {
          studio.resize();
          syncScroll();
        });
        ro.observe(canvas);

        io = new IntersectionObserver(
          (entries) => {
            studio.setVisible(Boolean(entries[0]?.isIntersecting) && !document.hidden);
          },
          { threshold: 0.01 },
        );
        io.observe(wrap);

        onVisibility = () => studio.setVisible(!document.hidden);
        document.addEventListener('visibilitychange', onVisibility);
      })
      .catch(() => {
        if (!cancelled) setWebglFailed(true);
      });

    window.addEventListener('scroll', syncScroll, { passive: true });
    window.addEventListener('resize', syncScroll, { passive: true });

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      studioRef.current?.setPointer(
        e.clientX / Math.max(1, window.innerWidth),
        e.clientY / Math.max(1, window.innerHeight),
      );
    };
    const onPointerLeave = () => studioRef.current?.clearPointer();

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafScroll);
      ro?.disconnect();
      io?.disconnect();
      if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('scroll', syncScroll);
      window.removeEventListener('resize', syncScroll);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
      studioRef.current?.dispose();
      studioRef.current = null;
      onHeaderPolarityChange?.(false);
    };
    // Initial studio mount; deviceClass/reducedMotion handled in effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeScrollChapters, onHeaderPolarityChange]);

  useEffect(() => {
    studioRef.current?.updateEnvironment({
      deviceClass: viewport.deviceClass,
      prefersReducedMotion: viewport.prefersReducedMotion,
    });
  }, [viewport.deviceClass, viewport.prefersReducedMotion]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: viewport.prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const handleStageTap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.target instanceof Element && e.target.closest('a, button')) return;
    studioRef.current?.setPointer(
      e.clientX / Math.max(1, window.innerWidth),
      e.clientY / Math.max(1, window.innerHeight),
    );
    studioRef.current?.handleClick(e.clientX, e.clientY);
  };

  const handleSelectArcadeShot = (idx: number) => {
    setArcadeShot(idx);
    const shot = arcadeProject.screenshots[idx];
    if (shot) studioRef.current?.setArcadeScreen(shot.src, idx);
  };

  const handleSelectAsterismShot = (idx: number) => {
    setAsterismShot(idx);
    const shot = asterismProject.screenshots[idx];
    if (shot) studioRef.current?.setAsterismScreen(shot.src);
  };

  return (
    <div className="home-monograph">
      {/* Scroll-Choreographed 3D Photographic Studio Wrapper */}
      <div
        ref={chaptersWrapRef}
        className={`studio-chapters ${webglFailed ? 'is-fallback' : ''}`}
        onPointerUp={handleStageTap}
      >
        {!webglFailed && (
          <div className="studio-canvas-pin" aria-hidden="true">
            <canvas ref={canvasRef} className="studio-canvas" />
          </div>
        )}

        {/* CHAPTER 1 — HERO: Kinetic Signal Sculpture + Asymmetric Editorial Typography */}
        <section
          ref={heroSecRef}
          className="chapter chapter--hero"
          aria-labelledby="sona-hero-title"
        >
          <div className="container chapter-hero__layout">
            <div className="chapter-hero__top-meta mono">
              <span>양일고등학교 코딩동아리</span>
              <span>2026 · 02 WORKS</span>
            </div>

            <div className="chapter-hero__bottom">
              <div className="chapter-hero__wordmark-col">
                <h1 id="sona-hero-title" className="hero-display">
                  SONA
                </h1>
              </div>

              <div className="chapter-hero__editorial-col">
                <p className="hero-statement">
                  우리가 만든 게임과 프로그램을 모았습니다.
                </p>

                <div className="hero-quick-links">
                  <button
                    type="button"
                    className="hero-index-link"
                    onClick={() => scrollToSection('work-seojun-arcade')}
                  >
                    <span className="mono">01</span>
                    <span>서준이네 오락실</span>
                    <span aria-hidden="true">↓</span>
                  </button>
                  <button
                    type="button"
                    className="hero-index-link"
                    onClick={() => scrollToSection('work-asterism-write')}
                  >
                    <span className="mono">02</span>
                    <span>Asterism Write</span>
                    <span aria-hidden="true">↓</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 2 — EXHIBITION 01: 서준이네 오락실 (Velvet Indigo Studio, Left Editorial) */}
        <section
          ref={arcadeSecRef}
          id="work-seojun-arcade"
          className="chapter chapter--exhibition chapter--arcade"
          aria-labelledby="arcade-heading"
        >
          <div className="container chapter-exhibition__grid chapter-exhibition__grid--left">
            <div className="exhibition-sheet exhibition-sheet--dark">
              <div className="exhibition-sheet__eyebrow mono">
                <span>01 / 02</span>
                <span>·</span>
                <span>{arcadeProject.creator}</span>
                <span>·</span>
                <span>{arcadeProject.authorshipLabel}</span>
              </div>

              <h2 id="arcade-heading" className="exhibition-sheet__title">
                {arcadeProject.title}
              </h2>

              <p className="exhibition-sheet__lead">
                염서준이 만든 웹게임 모음.
              </p>
              <p className="exhibition-sheet__body">
                탭 클리커 〈키 키우기〉와 학교생활 시뮬레이션 〈나는 이번생은
                양일고다!〉를 설치 없이 브라우저에서 바로 할 수 있습니다.
              </p>

              {/* Fallback static image when WebGL is unavailable */}
              {webglFailed && (
                <figure className="exhibition-fallback-shot">
                  <img
                    src={arcadeProject.screenshots[arcadeShot]?.src}
                    alt={arcadeProject.screenshots[arcadeShot]?.alt}
                  />
                </figure>
              )}

              {/* Tactile screen tabs drive the real 3D CRT monitor & button physics */}
              <div
                className="studio-tabs studio-tabs--arcade"
                role="tablist"
                aria-label="서준이네 오락실 화면 선택"
              >
                {arcadeProject.screenshots.map((shot, idx) => (
                  <button
                    key={shot.id}
                    type="button"
                    role="tab"
                    aria-selected={arcadeShot === idx}
                    className={`studio-tab ${arcadeShot === idx ? 'is-active' : ''}`}
                    onClick={() => handleSelectArcadeShot(idx)}
                  >
                    {shot.label}
                  </button>
                ))}
              </div>

              <div className="exhibition-sublinks">
                {arcadeProject.subItems?.map((game) => (
                  <a
                    key={game.title}
                    href={game.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="exhibition-sublink"
                  >
                    <span>{game.title}</span>
                    <span className="mono">{game.genre} ↗</span>
                  </a>
                ))}
              </div>

              <div className="exhibition-sheet__actions">
                <a
                  href={arcadeProject.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--arcade-primary"
                >
                  <span>사이트 열기</span>
                  <span aria-hidden="true">↗</span>
                </a>
                <button
                  type="button"
                  className="btn btn--ghost-light"
                  onClick={() => onNavigate(`/works/${arcadeProject.slug}`)}
                >
                  <span>자세히 보기</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 3 — EXHIBITION 02: Asterism Write (Bright Daylight Studio, Right Editorial) */}
        <section
          ref={asterismSecRef}
          id="work-asterism-write"
          className="chapter chapter--exhibition chapter--asterism"
          aria-labelledby="asterism-heading"
        >
          <div className="container chapter-exhibition__grid chapter-exhibition__grid--right">
            <div className="exhibition-sheet exhibition-sheet--light">
              <div className="exhibition-sheet__eyebrow mono">
                <span>02 / 02</span>
                <span>·</span>
                <span>{asterismProject.creator}</span>
                <span>·</span>
                <span>1.0.0-rc.1 개발 중</span>
              </div>

              <div className="asterism-wordmark-lockup">
                <h2 id="asterism-heading" className="sr-only">
                  {asterismProject.title}
                </h2>
                <img
                  src={asterismProject.artwork.wordmarkSrc}
                  alt={asterismProject.artwork.wordmarkAlt}
                  width={260}
                  height={86}
                />
              </div>

              <p className="exhibition-sheet__lead">
                문서 작성과 PDF 작업을 위한 편집기.
              </p>
              <p className="exhibition-sheet__body">
                보고서와 표, 수식을 편집하고 PDF에 펜·형광펜으로 필기할 수
                있습니다. 웹에서 로그인 없이 바로 열 수 있고, 데스크톱 버전은
                준비 중입니다.
              </p>

              {webglFailed && (
                <figure className="exhibition-fallback-shot">
                  <img
                    src={asterismProject.screenshots[asterismShot]?.src}
                    alt={asterismProject.screenshots[asterismShot]?.alt}
                  />
                </figure>
              )}

              {/* Tactile screen tabs swap the real 3D aluminum display & fan curved paper */}
              <div
                className="studio-tabs studio-tabs--asterism"
                role="tablist"
                aria-label="Asterism Write 화면 선택"
              >
                {asterismProject.screenshots.map((shot, idx) => (
                  <button
                    key={shot.id}
                    type="button"
                    role="tab"
                    aria-selected={asterismShot === idx}
                    className={`studio-tab ${asterismShot === idx ? 'is-active' : ''}`}
                    onClick={() => handleSelectAsterismShot(idx)}
                  >
                    {shot.label}
                  </button>
                ))}
              </div>

              {asterismProject.formatIcons && (
                <div className="asterism-format-row" aria-label="지원 문서 형식">
                  {asterismProject.formatIcons.map((fmt) => (
                    <div key={fmt.code} className="asterism-format-badge">
                      <img src={fmt.src} alt="" width={24} height={24} loading="lazy" />
                      <span className="mono">{fmt.code}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="exhibition-sheet__actions">
                <a
                  href={asterismProject.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--asterism-primary"
                >
                  <span>공식 사이트</span>
                  <span aria-hidden="true">↗</span>
                </a>
                <a
                  href="https://asterism.quadraj.com/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--outline-dark"
                >
                  <span>웹에서 열기</span>
                  <span aria-hidden="true">↗</span>
                </a>
                <button
                  type="button"
                  className="btn btn--asterism-detail"
                  onClick={() => onNavigate(`/works/${asterismProject.slug}`)}
                >
                  <span>자세히 →</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* CHAPTER 4 — Solid Porcelain Archive Strip */}
      <div className="monograph-archive-surface">
        <SignalHorizon tone="light" accent="#405CC8" label="2026 · INDEX" />
        <section id="works" className="home-archive" aria-labelledby="home-archive-heading">
          <div className="container">
            <div className="home-archive__head">
              <div>
                <span className="eyebrow mono">PROJECTS · 2026</span>
                <h2 id="home-archive-heading" className="section-title">
                  우리가 만든 것들.
                </h2>
              </div>
              <p className="home-archive__sub">
                양일고등학교 코딩동아리 소나 부원들이 만든 게임과 소프트웨어 목록입니다.
              </p>
            </div>

            <ArchiveIndex
              compact
              onOpenProject={(slug) => onNavigate(`/works/${slug}`)}
              onOpenFullArchive={() => onNavigate('/archive')}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
