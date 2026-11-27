import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LivingSignalEngine,
  type SignalEngineStats,
  type SignalMode,
} from '../engine/LivingSignalEngine';
import { SignalAudioSynth } from '../engine/SignalAudio';
import type { ViewportProfile } from '../hooks/useViewportProfile';

interface LivingSignalStageProps {
  viewport: ViewportProfile;
  onExploreWorks: () => void;
  onOpenArchive: () => void;
}

const MODE_LABELS: { id: SignalMode; label: string; en: string }[] = [
  { id: 'interference', label: '간섭장', en: 'INTERFERENCE' },
  { id: 'resonance', label: '공명격자', en: 'RESONANCE' },
  { id: 'wavefront', label: '파면', en: 'WAVEFRONT' },
];

export function LivingSignalStage({
  viewport,
  onExploreWorks,
  onOpenArchive,
}: LivingSignalStageProps) {
  const stageRef = useRef<HTMLElement | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<LivingSignalEngine | null>(null);
  const audioRef = useRef<SignalAudioSynth | null>(null);

  // Track pointer drag vs tap so mobile vertical scroll is never hijacked
  const pointerDownPosRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const [mode, setMode] = useState<SignalMode>('interference');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [stats, setStats] = useState<SignalEngineStats>({
    renderer: 'webgl',
    emitterCount: 2,
    userEmitterCount: 0,
    activeMode: 'interference',
    fps: 60,
  });

  // Mount WebGL/Canvas2D engine once
  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const stageEl = stageRef.current;
    if (!glCanvas || !overlayCanvas || !stageEl) return;

    const audio = new SignalAudioSynth();
    audioRef.current = audio;

    const engine = new LivingSignalEngine({
      glCanvas,
      overlayCanvas,
      isMobile: viewport.isMobile,
      isTablet: viewport.isTablet,
      prefersReducedMotion: viewport.prefersReducedMotion,
      onStatsChange: setStats,
    });
    engineRef.current = engine;

    const resizeObserver = new ResizeObserver(() => {
      engine.resize();
    });
    resizeObserver.observe(stageEl);

    // Pause render loop automatically when hero scrolls offscreen
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        engine.setVisible(Boolean(entry?.isIntersecting) && !document.hidden);
      },
      { threshold: 0.02 },
    );
    io.observe(stageEl);

    const handleVisibility = () => {
      engine.setVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const handleScroll = () => {
      const h = Math.max(1, stageEl.offsetHeight);
      engine.setScrollProgress(Math.min(1, window.scrollY / h));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      resizeObserver.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('scroll', handleScroll);
      engine.dispose();
      audio.dispose();
      engineRef.current = null;
      audioRef.current = null;
    };
    // Initial mount only; viewport updates handled cleanly in separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.updateEnvironment({
      isMobile: viewport.isMobile,
      isTablet: viewport.isTablet,
      prefersReducedMotion: viewport.prefersReducedMotion,
    });
  }, [viewport.isMobile, viewport.isTablet, viewport.prefersReducedMotion]);

  const getNormalizedCoords = useCallback((clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return { x: 0.5, y: 0.5 };
    const rect = el.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / Math.max(1, rect.width),
      y: (clientY - rect.top) / Math.max(1, rect.height),
    };
  }, []);

  const isInteractiveTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('button, a, [data-signal-ui="true"]'));
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'touch' && viewport.isMobile) {
        // On mobile, preserve smooth vertical scrolling; only emit subtle wake if dragging horizontally
        const down = pointerDownPosRef.current;
        if (down) {
          const dx = Math.abs(e.clientX - down.x);
          const dy = Math.abs(e.clientY - down.y);
          if (dx > dy * 1.15 && dx > 10) {
            const { x, y } = getNormalizedCoords(e.clientX, e.clientY);
            engineRef.current?.updatePointer(x, y, true, true);
          }
        }
        return;
      }

      const { x, y } = getNormalizedCoords(e.clientX, e.clientY);
      engineRef.current?.updatePointer(x, y, true, true);
    },
    [getNormalizedCoords, viewport.isMobile],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (isInteractiveTarget(e.target)) return;
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
      const { x, y } = getNormalizedCoords(e.clientX, e.clientY);
      engineRef.current?.updatePointer(x, y, true, false);
    },
    [getNormalizedCoords],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (isInteractiveTarget(e.target)) {
        pointerDownPosRef.current = null;
        return;
      }
      const down = pointerDownPosRef.current;
      pointerDownPosRef.current = null;

      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const elapsed = performance.now() - down.time;

      // Clean click / tap drops a new persistent harmonic Signal Node!
      if (moved < 14 && elapsed < 420) {
        const { x, y } = getNormalizedCoords(e.clientX, e.clientY);
        engineRef.current?.addUserEmitter(x, y);
        audioRef.current?.playHarmonic(y, 0.72);
      }
    },
    [getNormalizedCoords],
  );

  const handlePointerLeave = useCallback(() => {
    engineRef.current?.clearPointer();
    pointerDownPosRef.current = null;
  }, []);

  const handleModeChange = (nextMode: SignalMode) => {
    setMode(nextMode);
    engineRef.current?.setMode(nextMode);
    audioRef.current?.playHarmonic(
      nextMode === 'interference' ? 0.6 : nextMode === 'resonance' ? 0.42 : 0.25,
      0.55,
    );
  };

  const handlePulse = () => {
    engineRef.current?.triggerResonancePulse(
      viewport.isMobile ? 0.56 : 0.68,
      viewport.isMobile ? 0.42 : 0.46,
      1.35,
    );
    audioRef.current?.playPulseChord();
  };

  const handleReset = () => {
    engineRef.current?.resetEmitters();
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioRef.current?.setEnabled(next);
  };

  const interactionHint = viewport.isMobile
    ? '빈 공간을 탭해 파동 노드 생성'
    : viewport.isTablet
      ? '화면을 탭하거나 손가락으로 쓸어 파동 간섭을 만들어 보세요'
      : '포인터를 움직이거나 클릭해 공명 노드를 배치해 보세요';

  return (
    <section
      ref={stageRef}
      className="signal-stage"
      aria-label="SONA 리빙 시그널 인터랙티브 스테이지"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {/* Dual-layer WebGL shader surface + HiDPI architectural vector overlay */}
      <canvas ref={glCanvasRef} className="signal-stage__gl" aria-hidden="true" />
      <canvas ref={overlayCanvasRef} className="signal-stage__overlay" aria-hidden="true" />

      <div className="signal-stage__inner container">
        {/* Top live status strip */}
        <div className="signal-stage__meta-row">
          <div className="signal-pill">
            <span className="signal-pill__dot" aria-hidden="true" />
            <span className="mono">YANGIL HIGH SCHOOL · CODING ATELIER</span>
          </div>
          <div className="signal-telemetry mono" aria-live="polite">
            <span>SIGNAL / {MODE_LABELS.find((m) => m.id === mode)?.en}</span>
            <span className="signal-telemetry__sep" aria-hidden="true">
              ·
            </span>
            <span>NODES 0{stats.emitterCount}</span>
          </div>
        </div>

        {/* Main asymmetric editorial hero composition */}
        <div className="signal-stage__hero-grid">
          <div className="signal-stage__copy">
            <p className="signal-stage__kicker mono">
              LIVING SIGNAL ARCHIVE · 2026
            </p>
            <h1 className="signal-stage__title">
              <span className="signal-stage__wordmark">SONA</span>
              <span className="signal-stage__subhead">
                직접 만들고 실험하는
                <br />
                양일고 코딩동아리 아카이브
              </span>
            </h1>
            <p className="signal-stage__lead">
              게임, 문서 편집기, 웹 실험까지 — 학생들이 직접 코드로 구현한 실제
              디지털 창작물을 전시하고 작품의 현장으로 바로 연결합니다.
            </p>

            <div className="signal-stage__actions" data-signal-ui="true">
              <button
                type="button"
                className="btn btn--lime"
                onClick={onExploreWorks}
              >
                <span>전시 작품 보기</span>
                <span className="btn__count mono">02</span>
                <span aria-hidden="true">↓</span>
              </button>
              <button
                type="button"
                className="btn btn--ghost-light"
                onClick={onOpenArchive}
              >
                <span>아카이브 인덱스</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>

          {/* Right side stays open as an interactive tactile canvas space on desktop/tablet */}
          <div className="signal-stage__canvas-cue" aria-hidden="true">
            <div className="signal-cue-card">
              <span className="mono signal-cue-card__code">FIELD // INTERACTIVE</span>
              <p>{interactionHint}</p>
            </div>
          </div>
        </div>

        {/* Bottom tactile Harmonic Instrument Bar — optional creative toy */}
        <div
          className="signal-console"
          data-signal-ui="true"
          role="region"
          aria-label="리빙 시그널 파형 조작 패널"
        >
          <div className="signal-console__modes" role="group" aria-label="시그널 모드 선택">
            {MODE_LABELS.map((item) => {
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`signal-mode-btn ${active ? 'is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => handleModeChange(item.id)}
                >
                  <span>{item.label}</span>
                  {!viewport.isMobile && (
                    <span className="signal-mode-btn__en mono">{item.en}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="signal-console__tools">
            <button
              type="button"
              className="signal-tool-btn"
              onClick={handlePulse}
              title="화면 전체에 공명 파동 보내기"
            >
              <span className="signal-tool-btn__dot" aria-hidden="true" />
              <span>공명 펄스</span>
            </button>

            {stats.userEmitterCount > 0 && (
              <button
                type="button"
                className="signal-tool-btn"
                onClick={handleReset}
                title="배치한 노드 초기화"
              >
                <span>
                  {viewport.isMobile
                    ? `초기화 (${stats.userEmitterCount})`
                    : `노드 초기화 (${stats.userEmitterCount})`}
                </span>
              </button>
            )}

            <button
              type="button"
              className={`signal-tool-btn ${soundEnabled ? 'is-active' : ''}`}
              aria-pressed={soundEnabled}
              onClick={handleToggleSound}
              title="파동 생성 시 배음 사운드 켜기 또는 끄기"
            >
              <span>{soundEnabled ? '소리 켬' : '소리 끔'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
