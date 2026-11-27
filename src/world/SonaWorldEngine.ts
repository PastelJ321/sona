import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { SignalMode } from '../engine/LivingSignalEngine';
import type { DeviceClass } from '../hooks/useViewportProfile';
import { AsterismStudioPavilion } from './pavilions/AsterismStudioPavilion';
import { SeojunArcadePavilion } from './pavilions/SeojunArcadePavilion';
import { SonaCorePavilion } from './pavilions/SonaCorePavilion';
import { SignalProbe } from './SignalProbe';
import { SignalTerrain } from './SignalTerrain';
import { WORLD_ZONES, ZONE_ORDER, type ZoneId } from './zoneRegistry';

export interface ProjectedAnchor {
  id: ZoneId;
  x: number;
  y: number;
  visible: boolean;
}

export interface WorldEngineCallbacks {
  onZoneChange: (zone: ZoneId) => void;
  onExploreModeChange: (freeExplore: boolean) => void;
  onProximityZoneChange: (zone: ZoneId | null) => void;
  onUserNodesChange: (count: number) => void;
  onRelayDiscovered: (count: number, total: number, label: string) => void;
  onAnchorsFrame: (anchors: ProjectedAnchor[]) => void;
  onHarmonicPing: (intensity?: number, pitchNorm?: number) => void;
  onWebGLFailed: () => void;
}

export interface WorldEngineOptions {
  canvas: HTMLCanvasElement;
  deviceClass: DeviceClass;
  prefersReducedMotion: boolean;
  callbacks: WorldEngineCallbacks;
}

export class SonaWorldEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly callbacks: WorldEngineCallbacks;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private pmremGenerator: THREE.PMREMGenerator | null = null;
  private envRT: THREE.WebGLRenderTarget | null = null;

  private terrain!: SignalTerrain;
  private corePavilion!: SonaCorePavilion;
  private arcadePavilion!: SeojunArcadePavilion;
  private asterismPavilion!: AsterismStudioPavilion;
  private probe!: SignalProbe;

  private hemiLight!: THREE.HemisphereLight;
  private keyLight!: THREE.DirectionalLight;
  private fog!: THREE.FogExp2;
  private skyMat!: THREE.ShaderMaterial;
  private signalDust!: THREE.Points;

  private deviceClass: DeviceClass;
  private prefersReducedMotion: boolean;

  private activeZone: ZoneId = 'core';
  private freeExplore = false;

  // Curved Bézier Cinematic Camera State
  private readonly camPos = new THREE.Vector3();
  private readonly camTarget = new THREE.Vector3();
  private readonly flightStartPos = new THREE.Vector3();
  private readonly flightControlPos = new THREE.Vector3();
  private readonly flightEndPos = new THREE.Vector3();
  private readonly flightStartTarget = new THREE.Vector3();
  private readonly flightEndTarget = new THREE.Vector3();
  private flightStartFov = 40;
  private flightEndFov = 40;
  private flightProgress = 1;
  private flightDuration = 1.25;

  // Gentle interactive look-around / orbit inspection offsets
  private pointerParallaxX = 0;
  private pointerParallaxY = 0;
  private orbitYaw = 0;
  private orbitPitch = 0;
  private targetOrbitYaw = 0;
  private targetOrbitPitch = 0;

  // Atmosphere lerp targets
  private readonly targetFogColor = new THREE.Color('#101522');
  private readonly targetSkyTopColor = new THREE.Color('#090C14');
  private readonly targetHemiSky = new THREE.Color('#9CB0FF');

  // Raycasting & projection scratch vectors (zero per-frame allocations)
  private readonly raycaster = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly projVec = new THREE.Vector3();
  private readonly tmpVecA = new THREE.Vector3();
  private readonly tmpVecB = new THREE.Vector3();

  private width = 1;
  private height = 1;
  private rafId = 0;
  private isRunning = false;
  private isVisible = true;
  private disposed = false;
  private elapsed = 0;
  private lastTs = 0;
  private frameDeltaAvg = 16.6;
  private dynamicDprScale = 1;

  constructor(options: WorldEngineOptions) {
    this.canvas = options.canvas;
    this.deviceClass = options.deviceClass;
    this.prefersReducedMotion = options.prefersReducedMotion;
    this.callbacks = options.callbacks;

    if (!this.initScene()) {
      this.callbacks.onWebGLFailed();
      return;
    }

    this.bindEvents();
    this.resize();
    this.snapCameraToZone('core');

    if (this.prefersReducedMotion) {
      this.renderOnce(0.016);
    } else {
      this.start();
    }
  }

  private initScene(): boolean {
    try {
      const isMobile = this.deviceClass === 'mobile';
      const renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = !isMobile;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer = renderer;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color('#101522');
      this.fog = new THREE.FogExp2('#101522', 0.0185);
      this.scene.fog = this.fog;

      // Atmospheric Studio Sky Dome (rich horizon depth, zero flat black void)
      this.skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          u_top: { value: new THREE.Color('#090C14') },
          u_horizon: { value: new THREE.Color('#182138') },
          u_accent: { value: new THREE.Color('#5B75FF') },
        },
        vertexShader: `
          varying vec3 v_dir;
          void main() {
            v_dir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 u_top;
          uniform vec3 u_horizon;
          uniform vec3 u_accent;
          varying vec3 v_dir;
          void main() {
            float h = clamp(v_dir.y * 1.45, 0.0, 1.0);
            vec3 col = mix(u_horizon, u_top, pow(h, 0.65));
            float band = exp(-abs(v_dir.y - 0.06) * 8.5);
            col += u_accent * band * 0.14;
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      });
      const skyDome = new THREE.Mesh(new THREE.SphereGeometry(56, 24, 16), this.skyMat);
      this.scene.add(skyDome);

      // Single-draw-call Signal Particle Constellation drifting subtly across the sanctuary
      const dustCount = isMobile ? 90 : 170;
      const dustPos = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) {
        const angle = (i / dustCount) * Math.PI * 2 * 3.7;
        const rad = 3.5 + ((i * 19.3) % 19.5);
        dustPos[i * 3] = Math.cos(angle) * rad;
        dustPos[i * 3 + 1] = 0.8 + ((i * 7.13) % 8.5);
        dustPos[i * 3 + 2] = Math.sin(angle) * rad - 2.0;
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      const dustMat = new THREE.PointsMaterial({
        color: 0xd9f56c,
        size: isMobile ? 0.11 : 0.09,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      });
      this.signalDust = new THREE.Points(dustGeo, dustMat);
      this.scene.add(this.signalDust);

      // Studio PBR Environment Reflections (procedural — zero external HDR download!)
      this.pmremGenerator = new THREE.PMREMGenerator(renderer);
      const roomEnv = new RoomEnvironment();
      this.envRT = this.pmremGenerator.fromScene(roomEnv, 0.04);
      this.scene.environment = this.envRT.texture;
      this.scene.environmentIntensity = 0.65;
      roomEnv.dispose();

      // Perspective Camera
      const initialPose = WORLD_ZONES.core.camera[this.deviceClass];
      this.camera = new THREE.PerspectiveCamera(initialPose.fov, 16 / 9, 0.25, 110);

      // Cinematic Three-Point + Hemisphere Studio Lighting
      this.hemiLight = new THREE.HemisphereLight(0x9ab0ff, 0x161a24, 0.95);
      this.scene.add(this.hemiLight);

      this.keyLight = new THREE.DirectionalLight(0xfff5e8, 2.2);
      this.keyLight.position.set(11, 18, 13);
      if (!isMobile) {
        this.keyLight.castShadow = true;
        this.keyLight.shadow.mapSize.set(1024, 1024);
        this.keyLight.shadow.camera.near = 2;
        this.keyLight.shadow.camera.far = 48;
        this.keyLight.shadow.camera.left = -18;
        this.keyLight.shadow.camera.right = 18;
        this.keyLight.shadow.camera.top = 18;
        this.keyLight.shadow.camera.bottom = -18;
        this.keyLight.shadow.bias = -0.0005;
      }
      this.scene.add(this.keyLight);

      const rimLight = new THREE.DirectionalLight(0xf4654d, 0.85);
      rimLight.position.set(-14, 9, -15);
      this.scene.add(rimLight);

      // Construct World Geometry (redraw once textures decode in reduced-motion mode)
      const loadingManager = new THREE.LoadingManager(() => {
        if (this.prefersReducedMotion && !this.disposed) {
          this.renderOnce(0.016);
        }
      });
      const textureLoader = new THREE.TextureLoader(loadingManager);

      this.terrain = new SignalTerrain(isMobile);
      this.corePavilion = new SonaCorePavilion();
      this.arcadePavilion = new SeojunArcadePavilion(textureLoader);
      this.asterismPavilion = new AsterismStudioPavilion(textureLoader);

      this.probe = new SignalProbe({
        onWakePulse: (x, z, str) => this.terrain.emitPulse(x, z, str),
        onProximityChange: (zone) => {
          this.arcadePavilion.setFocused(zone === 'arcade');
          this.asterismPavilion.setFocused(zone === 'asterism');
          this.callbacks.onProximityZoneChange(zone);
        },
        onRelayDiscovered: (count, total, label) => {
          this.corePavilion.triggerSurge();
          this.callbacks.onHarmonicPing(0.85, 0.22 + count * 0.22);
          this.callbacks.onRelayDiscovered(count, total, label);
        },
      });

      this.scene.add(
        this.terrain.group,
        this.corePavilion.group,
        this.arcadePavilion.group,
        this.asterismPavilion.group,
        this.probe.group,
        this.probe.relaysGroup,
      );

      return true;
    } catch {
      return false;
    }
  }

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.stop();
  };

  private handleContextRestored = (): void => {
    if (this.disposed) return;
    this.resize();
    if (!this.prefersReducedMotion) this.start();
    else this.renderOnce(0.016);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.code === 'KeyE') {
      this.setFreeExplore(!this.freeExplore);
      return;
    }
    if (e.code === 'Escape' && this.freeExplore) {
      this.setFreeExplore(false);
      return;
    }
    if (e.code === 'Space' && !this.freeExplore) {
      e.preventDefault();
      this.triggerResonanceSurge();
      return;
    }
    if (this.probe.onKeyDown(e.code)) {
      if (!this.freeExplore) {
        this.setFreeExplore(true);
      }
      if (e.code.startsWith('Arrow') || e.code === 'Space') {
        e.preventDefault();
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.probe.onKeyUp(e.code);
  };

  private bindEvents(): void {
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public updateEnvironment(env: {
    deviceClass: DeviceClass;
    prefersReducedMotion: boolean;
  }): void {
    const deviceChanged = env.deviceClass !== this.deviceClass;
    const motionChanged = env.prefersReducedMotion !== this.prefersReducedMotion;
    this.deviceClass = env.deviceClass;
    this.prefersReducedMotion = env.prefersReducedMotion;
    this.resize();

    if (deviceChanged && !this.freeExplore) {
      this.flyToZone(this.activeZone, true);
    }
    if (motionChanged) {
      if (this.prefersReducedMotion) {
        this.stop();
        this.renderOnce(0.016);
      } else if (this.isVisible) {
        this.start();
      }
    }
  }

  public resize(): void {
    if (!this.renderer) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    this.width = w;
    this.height = h;

    const maxDpr = this.deviceClass === 'mobile' ? 1.5 : this.deviceClass === 'desktop' ? 1.35 : 1.35;
    const baseDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const dpr = Math.max(this.deviceClass === 'mobile' ? 1.2 : 0.9, baseDpr * this.dynamicDprScale);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    if (this.prefersReducedMotion) {
      this.renderOnce(0.016);
    }
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    if (visible && !this.prefersReducedMotion) {
      this.start();
    } else if (!visible) {
      this.stop();
    }
  }

  private snapCameraToZone(zoneId: ZoneId): void {
    const zone = WORLD_ZONES[zoneId];
    const pose = zone.camera[this.deviceClass];
    this.camPos.set(...pose.position);
    this.camTarget.set(...pose.target);
    this.flightEndPos.copy(this.camPos);
    this.flightEndTarget.copy(this.camTarget);
    this.camera.position.copy(this.camPos);
    this.camera.fov = pose.fov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.camTarget);
    this.flightProgress = 1;
    this.targetFogColor.set(zone.fogColor);
    this.targetSkyTopColor.set(zone.skyTopColor);
    this.targetHemiSky.set(zone.ambientTint);
    (this.skyMat.uniforms.u_accent.value as THREE.Color).set(zone.accentHex);
    this.terrain.setAtmosphere(zone.fogColor, zone.accentHex);
  }

  public flyToZone(zoneId: ZoneId, instant = false): void {
    if (this.freeExplore) {
      this.freeExplore = false;
      this.probe.setActive(false);
      this.callbacks.onExploreModeChange(false);
    }

    this.activeZone = zoneId;
    this.arcadePavilion.setFocused(zoneId === 'arcade');
    this.asterismPavilion.setFocused(zoneId === 'asterism');
    this.targetOrbitYaw = 0;
    this.targetOrbitPitch = 0;

    const zone = WORLD_ZONES[zoneId];
    const pose = zone.camera[this.deviceClass];

    this.targetFogColor.set(zone.fogColor);
    this.targetSkyTopColor.set(zone.skyTopColor);
    this.targetHemiSky.set(zone.ambientTint);
    (this.skyMat.uniforms.u_accent.value as THREE.Color).set(zone.accentHex);
    this.terrain.setAtmosphere(zone.fogColor, zone.accentHex);

    if (instant || this.prefersReducedMotion) {
      this.snapCameraToZone(zoneId);
      if (this.prefersReducedMotion) this.renderOnce(0.016);
    } else {
      // Curved cinematic quadratic Bézier path arching smoothly above deck height
      this.flightStartPos.copy(this.camPos);
      this.flightEndPos.set(...pose.position);

      this.flightControlPos
        .addVectors(this.flightStartPos, this.flightEndPos)
        .multiplyScalar(0.5);
      const dist = this.flightStartPos.distanceTo(this.flightEndPos);
      this.flightControlPos.y += Math.min(3.8, dist * 0.22);
      // Slight lateral arc for spatial depth & parallax
      this.flightControlPos.z += dist * 0.14;

      this.flightStartTarget.copy(this.camTarget);
      this.flightEndTarget.set(...pose.target);
      this.flightStartFov = this.camera.fov;
      this.flightEndFov = pose.fov;
      this.flightDuration = Math.max(0.75, Math.min(1.1, 0.65 + dist * 0.024));
      this.flightProgress = 0;
    }

    this.terrain.emitPulse(zone.center[0], zone.center[2], 1.1);
    this.callbacks.onZoneChange(zoneId);
    this.callbacks.onHarmonicPing(0.5, zoneId === 'core' ? 0.5 : zoneId === 'arcade' ? 0.72 : 0.34);
  }

  public setFreeExplore(enabled: boolean): void {
    if (enabled === this.freeExplore) return;
    this.freeExplore = enabled;
    this.probe.setActive(enabled, this.activeZone);
    this.callbacks.onExploreModeChange(enabled);

    if (!enabled) {
      this.flyToZone(this.activeZone);
    } else {
      this.callbacks.onHarmonicPing(0.7, 0.65);
    }
  }

  public setJoystick(x: number, y: number): void {
    this.probe.setJoystick(x, y);
  }

  public setSignalMode(mode: SignalMode): void {
    this.terrain.setMode(mode);
    this.corePavilion.triggerSurge();
    this.callbacks.onHarmonicPing(0.55, mode === 'interference' ? 0.6 : mode === 'resonance' ? 0.4 : 0.25);
    if (this.prefersReducedMotion) this.renderOnce(0.016);
  }

  public triggerResonanceSurge(): void {
    this.terrain.triggerSurge();
    this.corePavilion.triggerSurge();
    if (this.freeExplore) this.probe.triggerBoost();
    this.callbacks.onHarmonicPing(0.9, 0.5);
    if (this.prefersReducedMotion) this.renderOnce(0.016);
  }

  public clearUserBeacons(): void {
    this.terrain.clearUserBeacons();
    this.callbacks.onUserNodesChange(0);
    if (this.prefersReducedMotion) this.renderOnce(0.016);
  }

  public setArcadeScreen(src: string): void {
    this.arcadePavilion.setScreen(src);
    if (this.prefersReducedMotion) this.renderOnce(0.016);
  }

  public setAsterismScreen(src: string): void {
    this.asterismPavilion.setScreen(src);
    if (this.prefersReducedMotion) this.renderOnce(0.016);
  }

  public setPointerParallax(normX: number, normY: number): void {
    this.pointerParallaxX = (normX - 0.5) * 2;
    this.pointerParallaxY = (normY - 0.5) * 2;
  }

  public addOrbitDrag(deltaX: number, deltaY: number): void {
    this.targetOrbitYaw = THREE.MathUtils.clamp(this.targetOrbitYaw - deltaX * 0.0048, -0.58, 0.58);
    this.targetOrbitPitch = THREE.MathUtils.clamp(this.targetOrbitPitch - deltaY * 0.0032, -0.22, 0.3);
  }

  public handleCanvasClick(clientX: number, clientY: number): void {
    if (!this.renderer) return;
    const rect = this.canvas.getBoundingClientRect();
    this.ndc.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    this.ndc.y = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;

    this.raycaster.setFromCamera(this.ndc, this.camera);

    // 1. Check pavilions & interactive buttons first
    const hits = this.raycaster.intersectObjects(
      [this.corePavilion.group, this.arcadePavilion.group, this.asterismPavilion.group],
      true,
    );

    for (const hit of hits) {
      const data = hit.object.userData;
      if (data?.kind === 'arcade-button') {
        this.arcadePavilion.triggerButtonBounce();
        this.callbacks.onHarmonicPing(0.65, 0.78);
        if (this.activeZone !== 'arcade') this.flyToZone('arcade');
        return;
      }
      if (data?.kind === 'zone') {
        const targetZone = data.zoneId as ZoneId;
        if (targetZone === 'core' && this.activeZone === 'core') {
          this.triggerResonanceSurge();
        } else {
          this.flyToZone(targetZone);
        }
        return;
      }
    }

    // 2. Otherwise raycast Living Signal ground plane to drop a 3D Signal Beacon!
    const groundHits = this.raycaster.intersectObject(this.terrain.hitPlane, false);
    if (groundHits.length > 0) {
      const pt = groundHits[0].point;
      if (Math.hypot(pt.x, pt.z) < 19) {
        const count = this.terrain.addUserBeacon(pt.x, pt.z);
        this.callbacks.onUserNodesChange(count);
        this.callbacks.onHarmonicPing(0.65, 0.5 - pt.z * 0.02);
      }
    }
  }

  public start(): void {
    if (this.isRunning || this.disposed || this.prefersReducedMotion) return;
    this.isRunning = true;
    this.lastTs = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private tick = (now: number): void => {
    if (!this.isRunning || this.disposed) return;

    const rawMs = Math.min(50, Math.max(4, now - this.lastTs));
    this.lastTs = now;
    const dt = rawMs / 1000;

    // Adaptive DPR scaling for smooth responsiveness on slower GPUs
    this.frameDeltaAvg = this.frameDeltaAvg * 0.92 + rawMs * 0.08;
    if (this.frameDeltaAvg > 32 && this.dynamicDprScale > 0.72) {
      this.dynamicDprScale = Math.max(0.72, this.dynamicDprScale - 0.08);
      this.resize();
    }

    this.renderOnce(dt);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private renderOnce(dt: number): void {
    if (!this.renderer) return;
    this.elapsed += dt;

    // Update world elements
    this.probe.update(dt, this.elapsed);
    this.terrain.setProbePosition(
      this.probe.position.x,
      this.probe.position.z,
      this.probe.isActive(),
    );
    this.terrain.update(dt);
    this.corePavilion.update(dt, this.elapsed, this.prefersReducedMotion);
    this.arcadePavilion.update(dt, this.elapsed, this.prefersReducedMotion);
    this.asterismPavilion.update(dt, this.elapsed, this.prefersReducedMotion);

    // Smooth atmospheric fog, sky gradient & lighting transition across zones
    const atmLerp = Math.min(1, dt * 2.4);
    this.fog.color.lerp(this.targetFogColor, atmLerp);
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(this.fog.color);
    }
    (this.skyMat.uniforms.u_horizon.value as THREE.Color).lerp(this.targetFogColor, atmLerp);
    (this.skyMat.uniforms.u_top.value as THREE.Color).lerp(this.targetSkyTopColor, atmLerp);
    this.hemiLight.color.lerp(this.targetHemiSky, atmLerp);
    if (!this.prefersReducedMotion && this.signalDust) {
      this.signalDust.rotation.y += dt * 0.025;
    }

    // Camera Update: Free Probe Chase OR Curved Guided Spline
    if (this.freeExplore) {
      const backDist = this.deviceClass === 'mobile' ? 6.8 : 6.0;
      const heightOff = this.deviceClass === 'mobile' ? 4.4 : 3.8;
      const desiredX = this.probe.position.x - Math.sin(this.probe.heading) * backDist;
      const desiredZ = this.probe.position.z - Math.cos(this.probe.heading) * backDist;
      const desiredY = this.probe.position.y + heightOff;

      this.tmpVecA.set(desiredX, desiredY, desiredZ);
      this.camPos.lerp(this.tmpVecA, Math.min(1, dt * 7.2));

      this.tmpVecB.set(
        this.probe.position.x + Math.sin(this.probe.heading) * 0.6,
        this.probe.position.y + (this.deviceClass === 'mobile' ? -0.35 : 0.2),
        this.probe.position.z + Math.cos(this.probe.heading) * 0.6,
      );
      this.camTarget.lerp(this.tmpVecB, Math.min(1, dt * 8.5));

      this.camera.position.copy(this.camPos);
      this.camera.lookAt(this.camTarget);
    } else {
      if (this.flightProgress < 1) {
        this.flightProgress = Math.min(1, this.flightProgress + dt / this.flightDuration);
        // Smooth quintic ease-in-out
        const t =
          this.flightProgress < 0.5
            ? 4 * this.flightProgress * this.flightProgress * this.flightProgress
            : 1 - Math.pow(-2 * this.flightProgress + 2, 3) / 2;
        const inv = 1 - t;

        // Quadratic Bézier position curve
        this.camPos.set(
          inv * inv * this.flightStartPos.x +
            2 * inv * t * this.flightControlPos.x +
            t * t * this.flightEndPos.x,
          inv * inv * this.flightStartPos.y +
            2 * inv * t * this.flightControlPos.y +
            t * t * this.flightEndPos.y,
          inv * inv * this.flightStartPos.z +
            2 * inv * t * this.flightControlPos.z +
            t * t * this.flightEndPos.z,
        );

        this.camTarget.lerpVectors(this.flightStartTarget, this.flightEndTarget, t);
        const nextFov = THREE.MathUtils.lerp(this.flightStartFov, this.flightEndFov, t);
        if (Math.abs(this.camera.fov - nextFov) > 0.05) {
          this.camera.fov = nextFov;
          this.camera.updateProjectionMatrix();
        }
      }

      // Apply subtle interactive orbit drag + gentle desktop mouse parallax
      this.orbitYaw += (this.targetOrbitYaw - this.orbitYaw) * Math.min(1, dt * 6);
      this.orbitPitch += (this.targetOrbitPitch - this.orbitPitch) * Math.min(1, dt * 6);

      const offset = this.tmpVecA.subVectors(this.camPos, this.camTarget);
      const yaw =
        this.orbitYaw + (this.deviceClass === 'desktop' ? -this.pointerParallaxX * 0.09 : 0);
      const pitch =
        this.orbitPitch + (this.deviceClass === 'desktop' ? -this.pointerParallaxY * 0.045 : 0);

      offset.applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
      offset.y = Math.max(1.2, offset.y + pitch * offset.length() * 0.4);

      this.camera.position.copy(this.camTarget).add(offset);
      this.camera.lookAt(this.camTarget);
    }

    this.renderer.render(this.scene, this.camera);
    this.projectSpatialAnchors();
  }

  private projectSpatialAnchors(): void {
    const anchors: ProjectedAnchor[] = ZONE_ORDER.map((id) => {
      const cfg = WORLD_ZONES[id];
      this.projVec.set(cfg.anchor3D[0], cfg.anchor3D[1], cfg.anchor3D[2]);
      this.projVec.project(this.camera);

      const inFront = this.projVec.z < 1 && this.projVec.z > -1;
      const x = (this.projVec.x * 0.5 + 0.5) * this.width;
      const y = (-this.projVec.y * 0.5 + 0.5) * this.height;
      const inBounds = x > 24 && x < this.width - 24 && y > 68 && y < this.height - 96;

      return { id, x, y, visible: inFront && inBounds };
    });

    this.callbacks.onAnchorsFrame(anchors);
  }

  public dispose(): void {
    this.disposed = true;
    this.stop();
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    this.scene?.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (!m) continue;
          const std = m as THREE.MeshStandardMaterial;
          std.map?.dispose();
          m.dispose();
        }
      }
    });

    this.envRT?.dispose();
    this.pmremGenerator?.dispose();
    this.renderer?.dispose();
    this.renderer = null;
  }
}
