import { useCallback, useEffect, useRef, useState } from 'react';
import { ArchiveIndex } from '../components/ArchiveIndex';
import { SonaLamellaCanvas } from '../components/SonaLamellaCanvas';
import { PROJECTS } from '../data/projects';
import type { ViewportProfile } from '../hooks/useViewportProfile';
import { useMagneticSignal, useSectionScrollVar } from '../motion/SignalMotion';
import type { MaterialSignalStudio, ScrollChapters } from '../studio/MaterialSignalStudio';

export type HomeChapterId = 'hero' | 'arcade' | 'asterism' | 'archive';

interface HomePageProps {
  viewport: ViewportProfile;
  onNavigate: (to: string, options?: { hash?: string }) => void;
  onHeaderPolarityChange?: (isLightSurface: boolean) => void;
  onActiveChapterChange?: (chapter: HomeChapterId) => void;
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
  onActiveChapterChange,
}: HomePageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const studioRef = useRef<MaterialSignalStudio | null>(null);
  const chaptersWrapRef = useRef<HTMLDivElement | null>(null);
  const heroSecRef = useRef<HTMLElement | null>(null);
  const interludeRef = useSectionScrollVar<HTMLElement>('--bridge-p');
  const arcadeSecRef = useRef<HTMLElement | null>(null);
  const asterismSecRef = useRef<HTMLElement | null>(null);
  const archiveWrapRef = useRef<HTMLDivElement | null>(null);

  const arcadeCtaRef = useMagneticSignal<HTMLAnchorElement>(6);
  const asterismCtaRef = useMagneticSignal<HTMLAnchorElement>(6);

  const [arcadeShot, setArcadeShot] = useState(0);
  const [asterismShot, setAsterismShot] = useState(0);
  const [webglFailed, setWebglFailed] = useState(false);

  const arcadeProject = PROJECTS[0];
  const asterismProject = PROJECTS[1];

  const computeScrollChapters = useCallback((): {
    chapters: ScrollChapters;
    activeChapter: HomeChapterId;
    isLightHeader: boolean;
  } => {
    const vh = Math.max(1, window.innerHeight);
    const heroRect = heroSecRef.current?.getBoundingClientRect();
    const interludeRect = interludeRef.current?.getBoundingClientRect();
    const arcadeRect = arcadeSecRef.current?.getBoundingClientRect();
    const asterismRect = asterismSecRef.current?.getBoundingClientRect();
    const archiveRect = archiveWrapRef.current?.getBoundingClientRect();

    // Movement 01 -> 02: Hero sculpture fans wide open and clears before Arcade enters
    const heroExit = heroRect ? smoothRange(-heroRect.top / vh, 0.08, 0.78) : 0;

    // Movement 02: Signal Transformation typographic bridge between Hero & Exhibition 01
    let interludeFocus = 0;
    if (interludeRect) {
      const centerDist =
        Math.abs(interludeRect.top + interludeRect.height * 0.5 - vh * 0.5) / vh;
      interludeFocus = 1 - smoothRange(centerDist, 0.16, 0.62);
    }

    // Movement 04: Asterism Write (decisive transition into warm alabaster gallery daylight)
    let asterismFocus = 0;
    let daylightBlend = 0;
    if (asterismRect) {
      const centerDist = Math.abs(asterismRect.top + asterismRect.height * 0.5 - vh * 0.5) / vh;
      asterismFocus = 1 - smoothRange(centerDist, 0.14, 0.56);
      daylightBlend = smoothRange(1 - asterismRect.top / vh, 0.14, 0.44);
    }

    // Movement 03: 서준이네 오락실 — guaranteed fully exited once Daylight Asterism enters
    let arcadeFocus = 0;
    if (arcadeRect) {
      const centerDist = Math.abs(arcadeRect.top + arcadeRect.height * 0.5 - vh * 0.5) / vh;
      const rawArcade = 1 - smoothRange(centerDist, 0.12, 0.48);
      arcadeFocus = rawArcade * (1 - smoothRange(daylightBlend, 0.05, 0.38));
    }

    const inArchive = Boolean(archiveRect && archiveRect.top < vh * 0.35);

    let activeChapter: HomeChapterId = 'hero';
    if (inArchive) activeChapter = 'archive';
    else if (asterismFocus > 0.35 || daylightBlend > 0.4) activeChapter = 'asterism';
    else if (arcadeFocus > 0.32) activeChapter = 'arcade';

    return {
      chapters: { heroExit, interludeFocus, arcadeFocus, asterismFocus, daylightBlend },
      activeChapter,
      isLightHeader: daylightBlend > 0.18 || inArchive,
    };
  }, [interludeRef]);

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
        const { chapters, activeChapter, isLightHeader } = computeScrollChapters();
        studioRef.current?.setScrollChapters(chapters);
        onHeaderPolarityChange?.(isLightHeader);
        onActiveChapterChange?.(activeChapter);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computeScrollChapters, onHeaderPolarityChange, onActiveChapterChange]);

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
        {!webglFailed ? (
          <div className="studio-canvas-pin" aria-hidden="true">
            <canvas ref={canvasRef} className="studio-canvas" />
          </div>
        ) : (
          <div className="studio-canvas-pin studio-canvas-pin--fallback" aria-hidden="true">
            <SonaLamellaCanvas variant="fallback" />
          </div>
        )}

        {/* MOVEMENT 01 — ARRIVAL / SONA HERO */}
        <section
          ref={heroSecRef}
          className="chapter chapter--hero"
          aria-labelledby="sona-hero-title"
        >
          <div className="container chapter-hero__layout">
            <div className="chapter-hero__top-meta mono">
              <span className="meta-bracket">[ 양일고등학교 코딩동아리 ]</span>
              <span className="chapter-hero__top-mid">MATERIAL SIGNAL · 2026</span>
              <span>02 WORKS</span>
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
                    <span className="hero-index-link__name">서준이네 오락실</span>
                    <span className="hero-index-link__meta mono">염서준 ↓</span>
                  </button>
                  <button
                    type="button"
                    className="hero-index-link"
                    onClick={() => scrollToSection('work-asterism-write')}
                  >
                    <span className="mono">02</span>
                    <span className="hero-index-link__name">Asterism Write</span>
                    <span className="hero-index-link__meta mono">편집기 ↓</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MOVEMENT 02 — SIGNAL TRANSFORMATION (Hero -> Works Phase Bridge) */}
        <section
          ref={interludeRef}
          className="chapter-bridge"
          aria-label="작품 전시 도입"
        >
          <div className="container chapter-bridge__inner">
            <div className="chapter-bridge__rail" aria-hidden="true">
              <span className="chapter-bridge__slit" />
              <span className="chapter-bridge__slit" />
              <span className="chapter-bridge__slit chapter-bridge__slit--accent" />
              <span className="chapter-bridge__slit" />
              <span className="chapter-bridge__slit" />
            </div>

            <div className="chapter-bridge__copy">
              <span className="mono chapter-bridge__code">SELECTED WORKS · 01 — 02</span>
              <p className="chapter-bridge__statement">우리가 만든 것들.</p>
            </div>
          </div>
        </section>

        {/* MOVEMENT 03 — SEOJUN ARCADE (Borderless Monopo-Style Editorial × Full-Bleed 3D Stage) */}
        <section
          ref={arcadeSecRef}
          id="work-seojun-arcade"
          className="chapter chapter--exhibition chapter--arcade"
          aria-labelledby="arcade-heading"
        >
          <div className="container chapter-exhibition__grid chapter-exhibition__grid--left">
            <div className="editorial-stage editorial-stage--arcade">
              <div className="editorial-stage__top mono">
                <span className="editorial-stage__num">01</span>
                <span className="editorial-stage__rule" aria-hidden="true" />
                <span>{arcadeProject.creator} · {arcadeProject.authorshipLabel}</span>
              </div>

              <h2 id="arcade-heading" className="editorial-stage__title editorial-stage__title--arcade">
                <span>서준이네</span>
                <span>오락실</span>
              </h2>

              <p className="editorial-stage__lead">
                염서준이 만든 웹게임 모음.
              </p>
              <p className="editorial-stage__body">
                탭 클리커 〈키 키우기〉와 학교생활 시뮬레이션 〈나는 이번생은
                양일고다!〉를 설치 없이 브라우저에서 바로 할 수 있습니다.
              </p>

              {webglFailed && (
                <figure className="exhibition-fallback-shot">
                  <img
                    src={arcadeProject.screenshots[arcadeShot]?.src}
                    alt={arcadeProject.screenshots[arcadeShot]?.alt}
                  />
                </figure>
              )}

              {/* Tactile Hairline Screen Selector driving real 3D CRT monitor & button physics */}
              <div
                className="signal-tabs signal-tabs--arcade"
                role="tablist"
                aria-label="서준이네 오락실 화면 선택"
              >
                {arcadeProject.screenshots.map((shot, idx) => (
                  <button
                    key={shot.id}
                    type="button"
                    role="tab"
                    aria-selected={arcadeShot === idx}
                    className={`signal-tab ${arcadeShot === idx ? 'is-active' : ''}`}
                    onClick={() => handleSelectArcadeShot(idx)}
                  >
                    <span className="mono signal-tab__idx">0{idx + 1}</span>
                    <span>{shot.label}</span>
                  </button>
                ))}
              </div>

              {/* Ruled Direct Game Launchers */}
              <div className="ruled-sublinks">
                {arcadeProject.subItems?.map((game) => (
                  <a
                    key={game.title}
                    href={game.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ruled-sublink"
                  >
                    <span className="ruled-sublink__title">{game.title}</span>
                    <span className="ruled-sublink__meta mono">{game.genre} ↗</span>
                  </a>
                ))}
              </div>

              <div className="editorial-stage__actions">
                <a
                  ref={arcadeCtaRef}
                  href={arcadeProject.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--arcade-primary magnetic-target"
                >
                  <span>사이트 열기</span>
                  <span aria-hidden="true">↗</span>
                </a>
                <button
                  type="button"
                  className="editorial-text-link editorial-text-link--light"
                  onClick={() => onNavigate(`/works/${arcadeProject.slug}`)}
                >
                  <span>전시 자세히 보기</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* MOVEMENT 04 — ASTERISM WRITE (Warm Alabaster Daylight Print Atelier, Borderless Editorial) */}
        <section
          ref={asterismSecRef}
          id="work-asterism-write"
          className="chapter chapter--exhibition chapter--asterism"
          aria-labelledby="asterism-heading"
        >
          <div className="container chapter-exhibition__grid chapter-exhibition__grid--right">
            <div className="editorial-stage editorial-stage--asterism">
              <div className="editorial-stage__top mono">
                <span className="editorial-stage__num">02</span>
                <span className="editorial-stage__rule" aria-hidden="true" />
                <span>{asterismProject.creator} · 1.0.0-rc.1</span>
              </div>

              {/* Unmodified official Asterism Write wordmark resting directly on luminous gallery ground */}
              <div className="asterism-atelier-wordmark">
                <h2 id="asterism-heading" className="sr-only">
                  {asterismProject.title}
                </h2>
                <img
                  src={asterismProject.artwork.wordmarkSrc}
                  alt={asterismProject.artwork.wordmarkAlt}
                  width={290}
                  height={96}
                />
              </div>

              <p className="editorial-stage__lead editorial-stage__lead--dark">
                문서 작성과 PDF 작업을 위한 편집기.
              </p>
              <p className="editorial-stage__body editorial-stage__body--dark">
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

              {/* Tactile Proof-Sheet Tabs swapping 3D Aluminum Proof Plate & fanning 5 curved cotton folios */}
              <div
                className="signal-tabs signal-tabs--asterism"
                role="tablist"
                aria-label="Asterism Write 화면 선택"
              >
                {asterismProject.screenshots.map((shot, idx) => (
                  <button
                    key={shot.id}
                    type="button"
                    role="tab"
                    aria-selected={asterismShot === idx}
                    className={`signal-tab ${asterismShot === idx ? 'is-active' : ''}`}
                    onClick={() => handleSelectAsterismShot(idx)}
                  >
                    <span className="mono signal-tab__idx">0{idx + 1}</span>
                    <span>{shot.label}</span>
                  </button>
                ))}
              </div>

              {asterismProject.formatIcons && (
                <div className="atelier-format-rail" aria-label="지원 문서 형식">
                  {asterismProject.formatIcons.map((fmt) => (
                    <div key={fmt.code} className="atelier-format-item">
                      <img src={fmt.src} alt="" width={22} height={22} loading="lazy" />
                      <span className="mono">{fmt.code}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="editorial-stage__actions">
                <a
                  ref={asterismCtaRef}
                  href={asterismProject.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--asterism-primary magnetic-target"
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
                  className="editorial-text-link editorial-text-link--dark"
                  onClick={() => onNavigate(`/works/${asterismProject.slug}`)}
                >
                  <span>전시 자세히 보기</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* MOVEMENT 05 — SOLID WARM PORCELAIN ARCHIVE MONOGRAPH */}
      <div ref={archiveWrapRef} className="monograph-archive-surface">
        <section id="works" className="home-archive" aria-labelledby="home-archive-heading">
          <div className="container">
            <div className="home-archive__head">
              <div>
                <span className="signal-eyebrow mono">ARCHIVE · 2026</span>
                <h2 id="home-archive-heading" className="archive-display-title">
                  프로젝트 기록
                </h2>
              </div>
              <p className="home-archive__sub">
                부원들이 완성한 게임과 프로그램을 연도별로 이어서 남깁니다.
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
