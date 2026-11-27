import { useCallback, useEffect, useRef, useState } from 'react';
import { CLUB_INFO } from '../data/club';
import { PROJECTS, getProjectByZoneId } from '../data/projects';
import type { SignalMode } from '../engine/LivingSignalEngine';
import { SignalAudioSynth } from '../engine/SignalAudio';
import type { ViewportProfile } from '../hooks/useViewportProfile';
import type { ProjectedAnchor, SonaWorldEngine } from '../world/SonaWorldEngine';
import { WORLD_ZONES, ZONE_ORDER, type ZoneId } from '../world/zoneRegistry';
import { TouchJoystick } from './TouchJoystick';

interface SonaWorldViewportProps {
  viewport: ViewportProfile;
  onNavigate: (to: string, options?: { hash?: string }) => void;
}

const SIGNAL_MODES: { id: SignalMode; label: string }[] = [
  { id: 'interference', label: '간섭장' },
  { id: 'resonance', label: '공명격자' },
  { id: 'wavefront', label: '파면' },
];

export function SonaWorldViewport({ viewport, onNavigate }: SonaWorldViewportProps) {
  const stageRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SonaWorldEngine | null>(null);
  const audioRef = useRef<SignalAudioSynth | null>(null);

  // Direct DOM refs for 3D->2D projected waypoints (zero React re-renders per frame!)
  const anchorRefs = useRef<Record<ZoneId, HTMLButtonElement | null>>({
    core: null,
    arcade: null,
    asterism: null,
  });

  // Gesture state for clean drag-orbit vs click vs mobile horizontal swipe
  const gestureRef = useRef<{
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    time: number;
    pointerType: string;
    active: boolean;
  }>({ x: 0, y: 0, lastX: 0, lastY: 0, time: 0, pointerType: 'mouse', active: false });

  const [activeZone, setActiveZone] = useState<ZoneId>('core');
  const [freeExplore, setFreeExplore] = useState(false);
  const [proximityZone, setProximityZone] = useState<ZoneId | null>(null);
  const [signalMode, setSignalMode] = useState<SignalMode>('interference');
  const [userNodes, setUserNodes] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [relaysFound, setRelaysFound] = useState(0);
  const [relayToast, setRelayToast] = useState<string | null>(null);
  const [activeShots, setActiveShots] = useState<Record<'arcade' | 'asterism', number>>({
    arcade: 0,
    asterism: 0,
  });
  const [webglFailed, setWebglFailed] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

  const activeProject =
    activeZone === 'arcade' || activeZone === 'asterism'
      ? getProjectByZoneId(activeZone)
      : undefined;

  const updateAnchorDOM = useCallback((anchors: ProjectedAnchor[]) => {
    for (const a of anchors) {
      const el = anchorRefs.current[a.id];
      if (!el) continue;
      if (!a.visible) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      } else {
        el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      }
    }
  }, []);

  // Dynamically load Three.js World Engine so initial paint stays instant
  useEffect(() => {
    const canvas = canvasRef.current;
    const stageEl = stageRef.current;
    if (!canvas || !stageEl) return;

    let cancelled = false;
    const audio = new SignalAudioSynth();
    audioRef.current = audio;

    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let handleVisibility: (() => void) | null = null;

    void import('../world/SonaWorldEngine')
      .then(({ SonaWorldEngine }) => {
        if (cancelled) return;

        const engine = new SonaWorldEngine({
          canvas,
          deviceClass: viewport.deviceClass,
          prefersReducedMotion: viewport.prefersReducedMotion,
          callbacks: {
            onZoneChange: setActiveZone,
            onExploreModeChange: setFreeExplore,
            onProximityZoneChange: setProximityZone,
            onUserNodesChange: setUserNodes,
            onRelayDiscovered: (count, total, label) => {
              setRelaysFound(count);
              setRelayToast(`${label} 연결 (${count}/${total})`);
              window.setTimeout(() => setRelayToast(null), 2600);
            },
            onAnchorsFrame: updateAnchorDOM,
            onHarmonicPing: (intensity = 0.6, pitchNorm = 0.5) => {
              audioRef.current?.playHarmonic(pitchNorm, intensity);
            },
            onWebGLFailed: () => setWebglFailed(true),
          },
        });

        engineRef.current = engine;
        setEngineReady(true);

        ro = new ResizeObserver(() => engine.resize());
        ro.observe(stageEl);

        io = new IntersectionObserver(
          (entries) => {
            engine.setVisible(Boolean(entries[0]?.isIntersecting) && !document.hidden);
          },
          { threshold: 0.05 },
        );
        io.observe(stageEl);

        handleVisibility = () => engine.setVisible(!document.hidden);
        document.addEventListener('visibilitychange', handleVisibility);
      })
      .catch(() => {
        if (!cancelled) setWebglFailed(true);
      });

    return () => {
      cancelled = true;
      ro?.disconnect();
      io?.disconnect();
      if (handleVisibility) document.removeEventListener('visibilitychange', handleVisibility);
      engineRef.current?.dispose();
      engineRef.current = null;
      audio.dispose();
      audioRef.current = null;
    };
    // Mount once; viewport profile changes synced in effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateAnchorDOM]);

  useEffect(() => {
    engineRef.current?.updateEnvironment({
      deviceClass: viewport.deviceClass,
      prefersReducedMotion: viewport.prefersReducedMotion,
    });
  }, [viewport.deviceClass, viewport.prefersReducedMotion]);

  const selectZone = useCallback((zone: ZoneId) => {
    engineRef.current?.flyToZone(zone);
  }, []);

  const cycleZone = useCallback(
    (dir: 1 | -1) => {
      const idx = ZONE_ORDER.indexOf(activeZone);
      const next = ZONE_ORDER[(idx + dir + ZONE_ORDER.length) % ZONE_ORDER.length];
      engineRef.current?.flyToZone(next);
    },
    [activeZone],
  );

  const handleModeChange = (mode: SignalMode) => {
    setSignalMode(mode);
    engineRef.current?.setSignalMode(mode);
  };

  const handlePulse = () => {
    engineRef.current?.triggerResonanceSurge();
    audioRef.current?.playPulseChord();
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioRef.current?.setEnabled(next);
  };

  const handleToggleExplore = () => {
    engineRef.current?.setFreeExplore(!freeExplore);
  };

  const handleSwitchProjectScreen = (zone: 'arcade' | 'asterism', shotIdx: number) => {
    setActiveShots((prev) => ({ ...prev, [zone]: shotIdx }));
    const project = getProjectByZoneId(zone);
    const shot = project?.screenshots[shotIdx];
    if (!shot) return;
    if (zone === 'arcade') engineRef.current?.setArcadeScreen(shot.src);
    else engineRef.current?.setAsterismScreen(shot.src);
  };

  const isOverlayUI = (target: EventTarget | null): boolean => {
    return target instanceof Element && Boolean(target.closest('[data-world-ui="true"]'));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (isOverlayUI(e.target)) return;
    gestureRef.current = {
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      time: performance.now(),
      pointerType: e.pointerType,
      active: true,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const stageEl = stageRef.current;
    if (stageEl && e.pointerType === 'mouse' && !freeExplore) {
      const rect = stageEl.getBoundingClientRect();
      engineRef.current?.setPointerParallax(
        (e.clientX - rect.left) / Math.max(1, rect.width),
        (e.clientY - rect.top) / Math.max(1, rect.height),
      );
    }

    const g = gestureRef.current;
    if (!g.active || freeExplore) return;

    const dx = e.clientX - g.lastX;
    const dy = e.clientY - g.lastY;
    g.lastX = e.clientX;
    g.lastY = e.clientY;

    // On Desktop & Tablet, dragging gently orbits the camera around the active pavilion
    if (!viewport.isMobile) {
      engineRef.current?.addOrbitDrag(dx, dy);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const g = gestureRef.current;
    gestureRef.current.active = false;
    if (!g.active || isOverlayUI(e.target)) return;

    const totalDx = e.clientX - g.x;
    const totalDy = e.clientY - g.y;
    const moved = Math.hypot(totalDx, totalDy);
    const elapsed = performance.now() - g.time;

    // Mobile horizontal swipe smoothly switches zones without interfering with vertical scroll
    if (viewport.isMobile && !freeExplore && Math.abs(totalDx) > 48 && Math.abs(totalDx) > Math.abs(totalDy) * 1.35) {
      cycleZone(totalDx < 0 ? 1 : -1);
      return;
    }

    // Crisp click or tap raycasts the 3D scene (select pavilion or drop 3D signal beacon)
    if (moved < 12 && elapsed < 380) {
      engineRef.current?.handleCanvasClick(e.clientX, e.clientY);
    }
  };

  // WebGL-unavailable clean HTML fallback
  if (webglFailed) {
    return (
      <section className="world-fallback">
        <div className="container world-fallback__inner">
          <span className="eyebrow eyebrow--light mono">SONA · 양일고등학교 코딩동아리</span>
          <h1>SONA</h1>
          <p>{CLUB_INFO.shortLine}</p>
          <div className="world-fallback__grid">
            {PROJECTS.map((project) => (
              <article key={project.id} className="world-fallback__card">
                <img src={project.artwork.coverSrc} alt={project.artwork.coverAlt} />
                <div className="world-fallback__body">
                  <span className="mono">{project.creator} · {project.category}</span>
                  <h2>{project.title}</h2>
                  <p>{project.description}</p>
                  <div className="world-fallback__actions">
                    <a
                      href={project.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--lime btn--sm"
                    >
                      {project.externalLabel} ↗
                    </a>
                    <button
                      type="button"
                      className="btn btn--ghost-light btn--sm"
                      onClick={() => onNavigate(`/works/${project.slug}`)}
                    >
                      상세 보기 →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={stageRef}
      className={`world-stage world-stage--${viewport.deviceClass} ${
        freeExplore ? 'is-free-explore' : ''
      } ${activeZone !== 'core' ? 'is-zone-focused' : ''}`}
      aria-label="SONA 3D 인터랙티브 공간"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        gestureRef.current.active = false;
      }}
    >
      <canvas ref={canvasRef} className="world-stage__canvas" aria-hidden="true" />

      {/* 3D->2D Projected Spatial Waypoints */}
      <div className="world-anchors" aria-label="공간 내 구역 바로가기">
        {ZONE_ORDER.map((zoneId) => {
          const z = WORLD_ZONES[zoneId];
          const hiddenBecauseActive = !freeExplore && activeZone === zoneId;
          return (
            <button
              key={zoneId}
              ref={(el) => {
                anchorRefs.current[zoneId] = el;
              }}
              type="button"
              data-world-ui="true"
              className={`world-pin world-pin--${zoneId} ${
                hiddenBecauseActive ? 'is-hidden' : ''
              }`}
              onClick={() => selectZone(zoneId)}
            >
              <span className="world-pin__dot" aria-hidden="true" />
              <span className="world-pin__label">{z.label}</span>
              <span className="world-pin__arrow" aria-hidden="true">
                →
              </span>
            </button>
          );
        })}
      </div>

      {/* Relay discovery toast */}
      {relayToast && (
        <div className="world-toast mono" role="status" aria-live="polite">
          {relayToast}
        </div>
      )}

      {/* A. SONA Core Intro Overlay (Guided Mode @ Core) */}
      {activeZone === 'core' && !freeExplore && (
        <div className="world-core-overlay" data-world-ui="true">
          <div className="world-core-card">
            <p className="world-core-card__kicker mono">양일고등학교 코딩동아리</p>
            <h1 className="world-core-card__title">SONA</h1>
            <p className="world-core-card__desc">{CLUB_INFO.shortLine}</p>

            <div className="world-core-card__actions">
              <button
                type="button"
                className="btn btn--lime btn--sm"
                onClick={() => selectZone('arcade')}
              >
                <span>01 서준이네 오락실</span>
                <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                className="btn btn--ghost-light btn--sm"
                onClick={() => selectZone('asterism')}
              >
                <span>02 Asterism Write</span>
                <span aria-hidden="true">→</span>
              </button>
              <button
                type="button"
                className="btn btn--explore btn--sm"
                onClick={handleToggleExplore}
              >
                <span>자유 탐험</span>
              </button>
            </div>

            {!viewport.isMobile && (
              <p className="world-core-card__hint mono">
                공간 클릭: 파동 노드 배치 · 드래그: 시점 회전 · 공간 선택으로 바로 이동
              </p>
            )}
            {viewport.isMobile && (
              <p className="world-core-card__hint mono">
                좌우 스와이프로 작품 이동 · 화면 탭으로 파동 생성
              </p>
            )}
          </div>
        </div>
      )}

      {/* B. Focused Project Exhibition Inspector (Arcade / Asterism Studio) */}
      {activeProject && !freeExplore && (
        <aside
          data-world-ui="true"
          className={`world-inspector world-inspector--${activeProject.theme.polarity} world-inspector--${activeProject.zoneId}`}
          aria-label={`${activeProject.title} 작품 정보`}
        >
          <div className="world-inspector__head">
            <div className="world-inspector__meta mono">
              <span>{activeProject.indexLabel} / 02</span>
              <span>·</span>
              <span>{activeProject.authorshipLabel}</span>
            </div>
            <button
              type="button"
              className="world-inspector__close mono"
              onClick={() => selectZone('core')}
            >
              ← 코어로
            </button>
          </div>

          {activeProject.artwork.wordmarkSrc ? (
            <div className="world-inspector__wordmark">
              <h2 className="sr-only">{activeProject.title}</h2>
              <img
                src={activeProject.artwork.wordmarkSrc}
                alt={activeProject.artwork.wordmarkAlt ?? activeProject.title}
                width={240}
                height={80}
              />
            </div>
          ) : (
            <h2 className="world-inspector__title">{activeProject.title}</h2>
          )}

          <p className="world-inspector__creator">
            <strong>{activeProject.creator}</strong>
            <span>· {activeProject.status}</span>
          </p>

          <p className="world-inspector__desc">{activeProject.description}</p>

          {/* Live 3D Display Screen Switcher */}
          <div className="world-inspector__screens">
            <span className="world-inspector__label mono">3D 화면 전환</span>
            <div className="world-screen-tabs" role="tablist" aria-label="3D 디스플레이 화면 선택">
              {activeProject.screenshots.map((shot, idx) => {
                const selected = activeShots[activeProject.zoneId] === idx;
                return (
                  <button
                    key={shot.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className={`world-screen-tab ${selected ? 'is-active' : ''}`}
                    onClick={() => handleSwitchProjectScreen(activeProject.zoneId, idx)}
                  >
                    {shot.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project-specific quick links (Games or Formats) */}
          {activeProject.subItems && !viewport.isMobile && (
            <div className="world-inspector__subgames">
              {activeProject.subItems.map((game) => (
                <a
                  key={game.title}
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="world-subgame-link"
                >
                  <div>
                    <strong>{game.title}</strong>
                    <span>{game.genre}</span>
                  </div>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          )}

          {activeProject.formatIcons && !viewport.isMobile && (
            <div className="world-inspector__formats">
              {activeProject.formatIcons.slice(0, 4).map((fmt) => (
                <div key={fmt.code} className="world-format-pill">
                  <img src={fmt.src} alt="" width={22} height={22} />
                  <span className="mono">{fmt.code}</span>
                </div>
              ))}
            </div>
          )}

          {/* Direct External + Detail CTAs */}
          <div className="world-inspector__actions">
            <a
              href={activeProject.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn world-inspector__primary"
            >
              <span>{activeProject.externalLabel}</span>
              <span aria-hidden="true">↗</span>
            </a>

            {activeProject.zoneId === 'asterism' && (
              <a
                href="https://asterism.quadraj.com/app"
                target="_blank"
                rel="noopener noreferrer"
                className="btn world-inspector__secondary"
              >
                <span>웹에서 열기</span>
                <span aria-hidden="true">↗</span>
              </a>
            )}

            <button
              type="button"
              className="btn world-inspector__detail"
              onClick={() => onNavigate(`/works/${activeProject.slug}`)}
            >
              <span>자세히 →</span>
            </button>
          </div>
        </aside>
      )}

      {/* C. Free Exploration HUD & Proximity Prompt */}
      {freeExplore && (
        <>
          <div className="world-pilot-hud" data-world-ui="true">
            <div className="world-pilot-hud__info">
              <span className="world-pilot-hud__dot" aria-hidden="true" />
              <strong className="mono">FREE EXPLORE</strong>
              <span className="world-pilot-hud__keys mono">
                {viewport.isTouch
                  ? '조이스틱으로 탐사체 이동'
                  : 'WASD / 방향키 이동 · Space 펄스 · ESC 종료'}
              </span>
              <span className="world-pilot-hud__relay mono">중계기 {relaysFound}/3</span>
            </div>
            <button
              type="button"
              className="world-pilot-hud__exit"
              onClick={handleToggleExplore}
            >
              탐험 종료
            </button>
          </div>

          {proximityZone && proximityZone !== 'core' && (
            <div className="world-proximity-prompt" data-world-ui="true">
              <span>{WORLD_ZONES[proximityZone].label} 구역</span>
              <button
                type="button"
                className="btn btn--lime btn--sm"
                onClick={() => selectZone(proximityZone)}
              >
                공간 들어가기 →
              </button>
            </div>
          )}

          {viewport.isTouch && (
            <div className="world-touch-controls" data-world-ui="true">
              <TouchJoystick onVectorChange={(x, y) => engineRef.current?.setJoystick(x, y)} />
              <button
                type="button"
                className="world-touch-boost"
                onClick={handlePulse}
              >
                펄스
              </button>
            </div>
          )}
        </>
      )}

      {/* D. Bottom Spatial Dock: Always-accessible Zone Switcher + Living Signal Controls */}
      <div className="world-dock" data-world-ui="true" role="region" aria-label="공간 이동 및 시그널 제어">
        <div className="world-dock__zones" role="group" aria-label="전시 공간 선택">
          {ZONE_ORDER.map((zId) => {
            const z = WORLD_ZONES[zId];
            const isCurrent = !freeExplore && activeZone === zId;
            return (
              <button
                key={zId}
                type="button"
                className={`world-dock__zone-btn ${isCurrent ? 'is-active' : ''}`}
                aria-pressed={isCurrent}
                onClick={() => selectZone(zId)}
              >
                <span>{viewport.isMobile ? z.shortLabel : z.label}</span>
              </button>
            );
          })}
        </div>

        <div className="world-dock__controls">
          {!viewport.isMobile && (
            <div className="world-dock__modes" role="group" aria-label="신호 모드">
              {SIGNAL_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`world-dock__chip ${signalMode === m.id ? 'is-active' : ''}`}
                  aria-pressed={signalMode === m.id}
                  onClick={() => handleModeChange(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {viewport.isMobile && (
            <button
              type="button"
              className="world-dock__chip"
              onClick={() => {
                const idx = SIGNAL_MODES.findIndex((m) => m.id === signalMode);
                handleModeChange(SIGNAL_MODES[(idx + 1) % SIGNAL_MODES.length].id);
              }}
              title="신호 모드 전환"
            >
              {SIGNAL_MODES.find((m) => m.id === signalMode)?.label}
            </button>
          )}

          <button type="button" className="world-dock__chip" onClick={handlePulse}>
            <span className="world-dock__pulse-dot" aria-hidden="true" />
            <span>펄스</span>
          </button>

          {userNodes > 0 && !viewport.isMobile && (
            <button
              type="button"
              className="world-dock__chip"
              onClick={() => engineRef.current?.clearUserBeacons()}
            >
              초기화 ({userNodes})
            </button>
          )}

          <button
            type="button"
            className={`world-dock__chip ${soundEnabled ? 'is-active' : ''}`}
            aria-pressed={soundEnabled}
            onClick={handleToggleSound}
          >
            {soundEnabled ? '소리 켬' : '소리 끔'}
          </button>

          <button
            type="button"
            className={`world-dock__chip world-dock__chip--explore ${
              freeExplore ? 'is-active' : ''
            }`}
            aria-pressed={freeExplore}
            onClick={handleToggleExplore}
          >
            {freeExplore ? '탐험 중' : '자유 탐험'}
          </button>
        </div>
      </div>

      {!engineReady && <div className="world-loading-veil" aria-hidden="true" />}
    </section>
  );
}
