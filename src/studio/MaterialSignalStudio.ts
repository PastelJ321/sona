import * as THREE from 'three';
import type { DeviceClass } from '../hooks/useViewportProfile';
import { MaterialLibrary } from './MaterialLibrary';
import { PointerDynamics } from './SpringPhysics';
import { buildStudioEnvironments, type StudioEnvTextures } from './StudioEnvironment';
import { ArcadeSculpture } from './sculptures/ArcadeSculpture';
import { AsterismSculpture } from './sculptures/AsterismSculpture';
import { HeroSignalSculpture } from './sculptures/HeroSignalSculpture';

export interface ScrollChapters {
  heroExit: number;        // 0 = Hero, 1 = exited Hero
  interludeFocus: number;  // 0..1 Movement 02 Signal Transformation bridge
  arcadeFocus: number;     // 0..1 서준이네 오락실
  asterismFocus: number;   // 0..1 Asterism Write
  daylightBlend: number;   // 0 = dark studio, 1 = warm daylight atelier
}

export interface StudioEngineOptions {
  canvas: HTMLCanvasElement;
  deviceClass: DeviceClass;
  prefersReducedMotion: boolean;
  onWebGLFailed: () => void;
}

const BACKDROP_VERT = `
varying vec2 v_uv;
void main() {
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Photographic Studio Cyclorama Backdrop (V2.0).
 * Seamlessly shifts from Obsidian Basalt -> Velvet Indigo -> Warm Alabaster Gallery Daylight
 * with subtle architectural lamella light bands responding to cursor position.
 */
const BACKDROP_FRAG = `
uniform float u_time;
uniform vec3 u_bgTop;
uniform vec3 u_bgBot;
uniform vec3 u_accent;
uniform float u_daylight;
uniform float u_interlude;
uniform vec2 u_pointer;

varying vec2 v_uv;

void main() {
  vec2 uv = v_uv;
  vec3 col = mix(u_bgBot, u_bgTop, smoothstep(0.0, 1.0, uv.y));

  // Photographic cyclorama softbox spill tracking pointer subtly
  vec2 c = uv - vec2(0.56 + u_pointer.x * 0.08, 0.54 - u_pointer.y * 0.06);
  float glow = exp(-dot(c, c) * 3.1);
  col += u_accent * glow * mix(0.18, 0.04, u_daylight);

  // Subtle warm top-light gallery gradient in daylight mode
  float topLight = smoothstep(0.35, 1.0, uv.y) * u_daylight * 0.045;
  col += vec3(1.0, 0.99, 0.96) * topLight;

  // Architectural Living Signal phased contour lines (intensify subtly during Movement 02 bridge)
  float freq = mix(6.8, 10.5, u_interlude);
  float wave = sin((uv.x * freq + sin(uv.y * 3.8 - u_time * 0.22) * 0.55) + u_time * 0.16);
  float line = 1.0 - smoothstep(0.0, 0.026, abs(wave));
  vec3 lineCol = mix(vec3(0.95, 0.94, 0.91), vec3(0.25, 0.36, 0.78), u_daylight);
  float lineStrength = mix(0.048, 0.024, u_daylight) + u_interlude * 0.045;
  col = mix(col, lineCol, line * lineStrength);

  gl_FragColor = vec4(col, 1.0);
}
`;

export class MaterialSignalStudio {
  private readonly canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;

  private envTextures: StudioEnvTextures | null = null;
  private materials: MaterialLibrary | null = null;

  private heroSculpture!: HeroSignalSculpture;
  private arcadeSculpture!: ArcadeSculpture;
  private asterismSculpture!: AsterismSculpture;

  private backdropMat!: THREE.ShaderMaterial;
  private keyLight!: THREE.DirectionalLight;
  private fillLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private pointerLight!: THREE.PointLight;

  private readonly pointer = new PointerDynamics();
  private readonly raycaster = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();

  private deviceClass: DeviceClass;
  private prefersReducedMotion: boolean;
  private activeEnvMode: 'dark' | 'daylight' = 'dark';

  private targetChapters: ScrollChapters = {
    heroExit: 0,
    interludeFocus: 0,
    arcadeFocus: 0,
    asterismFocus: 0,
    daylightBlend: 0,
  };
  private smoothChapters: ScrollChapters = { ...this.targetChapters };

  private readonly colHeroTop = new THREE.Color('#080B10');
  private readonly colHeroBot = new THREE.Color('#131926');
  private readonly colArcadeTop = new THREE.Color('#120C2B');
  private readonly colArcadeBot = new THREE.Color('#22164D');
  // Bright warm alabaster gallery porcelain (harmonizes directly with SONA's #F2EFE8 ground!)
  private readonly colDayTop = new THREE.Color('#FAF8F3');
  private readonly colDayBot = new THREE.Color('#F0ECE3');

  private readonly colAccentHero = new THREE.Color('#5B75FF');
  private readonly colAccentArcade = new THREE.Color('#FF7EB6');
  private readonly colAccentDay = new THREE.Color('#405CC8');
  private readonly tmpColA = new THREE.Color();
  private readonly tmpColB = new THREE.Color();
  private readonly tmpAccent = new THREE.Color();
  private readonly tmpLightColor = new THREE.Color();

  private rafId = 0;
  private isRunning = false;
  private isVisible = true;
  private disposed = false;
  private elapsed = 0;
  private lastTs = 0;

  constructor(options: StudioEngineOptions) {
    this.canvas = options.canvas;
    this.deviceClass = options.deviceClass;
    this.prefersReducedMotion = options.prefersReducedMotion;

    if (!this.init()) {
      options.onWebGLFailed();
      return;
    }

    this.bindEvents();
    this.resize();

    if (this.prefersReducedMotion) {
      this.renderFrame(0.016);
    } else {
      this.start();
    }
  }

  private init(): boolean {
    try {
      const isMobile = this.deviceClass === 'mobile';
      const renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.transmissionResolutionScale = isMobile ? 0.35 : 0.5;
      renderer.shadowMap.enabled = !isMobile;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer = renderer;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color('#0B0F17');

      this.envTextures = buildStudioEnvironments(renderer);
      this.scene.environment = this.envTextures.darkStudio.texture;
      this.scene.environmentIntensity = 1.24;

      // Photographic Prime Lens FOV (33deg = crisp editorial sculpture proportion)
      this.camera = new THREE.PerspectiveCamera(33, 16 / 9, 0.2, 60);
      this.camera.position.set(0, 0.22, 8.2);
      this.camera.lookAt(0, 0, 0);

      this.backdropMat = new THREE.ShaderMaterial({
        depthWrite: false,
        uniforms: {
          u_time: { value: 0 },
          u_bgTop: { value: this.colHeroTop.clone() },
          u_bgBot: { value: this.colHeroBot.clone() },
          u_accent: { value: this.colAccentHero.clone() },
          u_daylight: { value: 0 },
          u_interlude: { value: 0 },
          u_pointer: { value: new THREE.Vector2(0, 0) },
        },
        vertexShader: BACKDROP_VERT,
        fragmentShader: BACKDROP_FRAG,
      });
      const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(46, 28), this.backdropMat);
      backdrop.position.set(0, 0, -9.8);
      this.scene.add(backdrop);

      // Virtual Photography Studio Four-Point Light Rig + Cursor-Tracking Specular Point Light
      this.hemiLight = new THREE.HemisphereLight(0xe4ecff, 0x192030, 0.72);
      this.scene.add(this.hemiLight);

      this.keyLight = new THREE.DirectionalLight(0xfff6e8, 2.85);
      this.keyLight.position.set(5.2, 7.6, 7.4);
      if (!isMobile) {
        this.keyLight.castShadow = true;
        this.keyLight.shadow.mapSize.set(1024, 1024);
        this.keyLight.shadow.camera.near = 1;
        this.keyLight.shadow.camera.far = 26;
        this.keyLight.shadow.camera.left = -6.8;
        this.keyLight.shadow.camera.right = 6.8;
        this.keyLight.shadow.camera.top = 6.8;
        this.keyLight.shadow.camera.bottom = -6.8;
        this.keyLight.shadow.bias = -0.0004;
      }
      this.scene.add(this.keyLight);

      this.fillLight = new THREE.DirectionalLight(0x7c95ff, 1.35);
      this.fillLight.position.set(-7.5, 2.5, 4.8);
      this.scene.add(this.fillLight);

      this.rimLight = new THREE.DirectionalLight(0xf4654d, 1.65);
      this.rimLight.position.set(-3.2, 5.2, -6.5);
      this.scene.add(this.rimLight);

      // Lusion-inspired real-time cursor specular accent light gliding across metal & glass surfaces
      this.pointerLight = new THREE.PointLight(0x9fb5ff, 6.5, 16, 1.6);
      this.pointerLight.position.set(1.5, 1.2, 4.2);
      this.scene.add(this.pointerLight);

      this.materials = new MaterialLibrary();
      const loadingManager = new THREE.LoadingManager(() => {
        if (this.prefersReducedMotion && !this.disposed) {
          this.renderFrame(0.016);
        }
      });
      const texLoader = new THREE.TextureLoader(loadingManager);

      this.heroSculpture = new HeroSignalSculpture(this.materials);
      this.arcadeSculpture = new ArcadeSculpture(this.materials, texLoader);
      this.asterismSculpture = new AsterismSculpture(this.materials, texLoader);

      this.arcadeSculpture.group.visible = false;
      this.asterismSculpture.group.visible = false;

      this.scene.add(
        this.heroSculpture.group,
        this.arcadeSculpture.group,
        this.asterismSculpture.group,
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
    else this.renderFrame(0.016);
  };

  private bindEvents(): void {
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);
  }

  public updateEnvironment(env: {
    deviceClass: DeviceClass;
    prefersReducedMotion: boolean;
  }): void {
    const motionChanged = env.prefersReducedMotion !== this.prefersReducedMotion;
    this.deviceClass = env.deviceClass;
    this.prefersReducedMotion = env.prefersReducedMotion;
    this.resize();

    if (motionChanged) {
      if (this.prefersReducedMotion) {
        this.stop();
        this.renderFrame(0.016);
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

    const maxDpr = this.deviceClass === 'mobile' ? 1.35 : w >= 1600 ? 1.25 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.renderer.setSize(w, h, false);

    const aspect = w / h;
    this.camera.aspect = aspect;
    this.camera.fov = aspect < 0.78 ? 43 : aspect < 1.1 ? 38 : 33;
    this.camera.updateProjectionMatrix();

    if (this.prefersReducedMotion) {
      this.renderFrame(0.016);
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

  public setScrollChapters(next: ScrollChapters): void {
    this.targetChapters = next;
    if (this.prefersReducedMotion) {
      this.smoothChapters = { ...next };
      this.renderFrame(0.016);
    }
  }

  public setPointer(normX: number, normY: number): void {
    this.pointer.setNormalized(normX, normY);
  }

  public clearPointer(): void {
    this.pointer.release();
  }

  public handleClick(clientX: number, clientY: number): void {
    if (!this.renderer) return;
    const rect = this.canvas.getBoundingClientRect();
    this.ndc.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    this.ndc.y = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;

    this.pointer.triggerClickImpulse(1.0);
    this.raycaster.setFromCamera(this.ndc, this.camera);

    const activeTargets: THREE.Object3D[] = [];
    if (this.heroSculpture.group.visible) activeTargets.push(this.heroSculpture.hitMesh);
    if (this.arcadeSculpture.group.visible) activeTargets.push(this.arcadeSculpture.hitMesh);
    if (this.asterismSculpture.group.visible) activeTargets.push(this.asterismSculpture.hitMesh);

    const hits = this.raycaster.intersectObjects(activeTargets, false);
    const hitKind = hits[0]?.object?.userData?.sculpture;

    if (hitKind === 'hero' || this.smoothChapters.heroExit < 0.45) {
      this.heroSculpture.triggerPluck(1.18);
    } else if (hitKind === 'arcade' || this.smoothChapters.arcadeFocus > 0.4) {
      this.arcadeSculpture.triggerTactilePress(Math.floor(Math.random() * 4));
    } else if (hitKind === 'asterism' || this.smoothChapters.asterismFocus > 0.4) {
      this.asterismSculpture.triggerPageFan();
    }

    if (this.prefersReducedMotion) {
      this.renderFrame(0.016);
    }
  }

  public setArcadeScreen(src: string, idx: number): void {
    this.arcadeSculpture.setScreen(src, idx);
    if (this.prefersReducedMotion) this.renderFrame(0.016);
  }

  public setAsterismScreen(src: string): void {
    this.asterismSculpture.setScreen(src);
    if (this.prefersReducedMotion) this.renderFrame(0.016);
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
    const rawMs = Math.min(48, Math.max(4, now - this.lastTs));
    this.lastTs = now;
    this.renderFrame(rawMs / 1000);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private renderFrame(dt: number): void {
    if (!this.renderer) return;
    this.elapsed += dt;

    const maxDelta = Math.max(
      Math.abs(this.targetChapters.heroExit - this.smoothChapters.heroExit),
      Math.abs(this.targetChapters.arcadeFocus - this.smoothChapters.arcadeFocus),
      Math.abs(this.targetChapters.asterismFocus - this.smoothChapters.asterismFocus),
      Math.abs(this.targetChapters.daylightBlend - this.smoothChapters.daylightBlend),
    );
    const chLerp = this.prefersReducedMotion ? 1 : Math.min(1, dt * (maxDelta > 0.38 ? 28.0 : 15.0));
    this.smoothChapters.heroExit +=
      (this.targetChapters.heroExit - this.smoothChapters.heroExit) * chLerp;
    this.smoothChapters.interludeFocus +=
      (this.targetChapters.interludeFocus - this.smoothChapters.interludeFocus) * chLerp;
    this.smoothChapters.arcadeFocus +=
      (this.targetChapters.arcadeFocus - this.smoothChapters.arcadeFocus) * chLerp;
    this.smoothChapters.asterismFocus +=
      (this.targetChapters.asterismFocus - this.smoothChapters.asterismFocus) * chLerp;
    this.smoothChapters.daylightBlend +=
      (this.targetChapters.daylightBlend - this.smoothChapters.daylightBlend) * chLerp;

    if (this.targetChapters.arcadeFocus < 0.02 && this.smoothChapters.daylightBlend > 0.35) {
      this.smoothChapters.arcadeFocus = 0;
    }

    this.pointer.update(dt);

    const { heroExit, interludeFocus, arcadeFocus, asterismFocus, daylightBlend } =
      this.smoothChapters;
    const isPortrait = this.deviceClass === 'mobile' || this.deviceClass === 'tablet-portrait';
    const isTabletLand = this.deviceClass === 'tablet-landscape';

    // Swap baked PMREM Softbox Environment cleanly between Dark Studio & Warm Daylight Atelier
    const desiredEnv: 'dark' | 'daylight' = daylightBlend > 0.5 ? 'daylight' : 'dark';
    if (desiredEnv !== this.activeEnvMode && this.envTextures) {
      this.activeEnvMode = desiredEnv;
      this.scene.environment =
        desiredEnv === 'daylight'
          ? this.envTextures.daylightStudio.texture
          : this.envTextures.darkStudio.texture;
    }

    // Morph studio backdrop across chapters
    this.tmpColA
      .copy(this.colHeroTop)
      .lerp(this.colArcadeTop, arcadeFocus)
      .lerp(this.colDayTop, daylightBlend);
    this.tmpColB
      .copy(this.colHeroBot)
      .lerp(this.colArcadeBot, arcadeFocus)
      .lerp(this.colDayBot, daylightBlend);
    this.tmpAccent
      .copy(this.colAccentHero)
      .lerp(this.colAccentArcade, arcadeFocus)
      .lerp(this.colAccentDay, daylightBlend);

    (this.backdropMat.uniforms.u_bgTop.value as THREE.Color).copy(this.tmpColA);
    (this.backdropMat.uniforms.u_bgBot.value as THREE.Color).copy(this.tmpColB);
    (this.backdropMat.uniforms.u_accent.value as THREE.Color).copy(this.tmpAccent);
    this.backdropMat.uniforms.u_daylight.value = daylightBlend;
    this.backdropMat.uniforms.u_interlude.value = interludeFocus;
    this.backdropMat.uniforms.u_time.value = this.elapsed;
    (this.backdropMat.uniforms.u_pointer.value as THREE.Vector2).set(
      this.pointer.heavyX.value,
      this.pointer.heavyY.value,
    );
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(this.tmpColB);
    }

    // Lighting adaptation across obsidian, velvet indigo, and warm gallery daylight
    this.keyLight.intensity = THREE.MathUtils.lerp(2.85, 2.35, daylightBlend);
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.72, 1.45, daylightBlend);
    this.fillLight.color
      .setHex(0x7c95ff)
      .lerp(this.tmpLightColor.setHex(0x5ef2c8), arcadeFocus * 0.72)
      .lerp(this.tmpLightColor.setHex(0xfff9f0), daylightBlend * 0.88);
    this.rimLight.color
      .setHex(0xf4654d)
      .lerp(this.tmpLightColor.setHex(0xffd23f), arcadeFocus * 0.85)
      .lerp(this.tmpLightColor.setHex(0x405cc8), daylightBlend * 0.9);
    this.rimLight.intensity = THREE.MathUtils.lerp(1.65, 1.0, daylightBlend);

    // Cursor-tracking studio specular point light
    this.pointerLight.position.set(
      this.pointer.midX.value * 4.2,
      0.8 - this.pointer.midY.value * 2.6,
      4.4,
    );
    this.pointerLight.color
      .setHex(0x9eb4ff)
      .lerp(this.tmpLightColor.setHex(0xff92c8), arcadeFocus * 0.75)
      .lerp(this.tmpLightColor.setHex(0xfff6e5), daylightBlend * 0.9);
    this.pointerLight.intensity = THREE.MathUtils.lerp(
      6.8 + this.pointer.energy.value * 3.8,
      2.6,
      daylightBlend,
    );

    // Photographic camera dolly: closer, bolder Lusion-style scale on desktop, breathing room on portrait
    const baseCamZ = isPortrait ? 10.4 : isTabletLand ? 9.1 : 8.1;
    const camZ =
      baseCamZ + interludeFocus * 0.85 - arcadeFocus * 0.2 - asterismFocus * 0.15;
    const targetCamX = this.pointer.heavyX.value * (isPortrait ? 0.14 : 0.44);
    const targetCamY = 0.2 - this.pointer.heavyY.value * (isPortrait ? 0.1 : 0.28);
    this.camera.position.set(targetCamX, targetCamY, camZ);
    this.camera.lookAt(0, isPortrait ? -0.18 : 0.02, 0);

    // Monumental Hero Sculpture: bold right-center cropping on desktop, centered crown on portrait
    const heroScale = isPortrait ? 1.04 : isTabletLand ? 1.08 : 1.18;
    const heroX = isPortrait ? 0 : isTabletLand ? 0.85 : 1.08;
    const heroY = isPortrait ? 1.08 : 0.24;
    this.heroSculpture.group.position.x = heroX;
    this.heroSculpture.update(
      dt,
      this.elapsed,
      this.pointer,
      heroExit,
      heroScale,
      this.prefersReducedMotion,
    );
    this.heroSculpture.group.position.y += heroY;

    // Exhibition 01 (Arcade): Commands right 58% on Desktop, clean upper stage on Portrait
    const arcadeScale = isPortrait ? 0.88 : isTabletLand ? 0.9 : 1.08;
    const arcadeX = isPortrait ? 0 : isTabletLand ? 1.54 : 1.56;
    const arcadeY = isPortrait ? 1.52 : 0.04;
    this.arcadeSculpture.update(
      dt,
      this.elapsed,
      this.pointer,
      arcadeFocus,
      arcadeX,
      arcadeY,
      arcadeScale,
      this.prefersReducedMotion,
    );

    // Exhibition 02 (Asterism): Commands left 58% on Desktop, clean upper stage on Portrait
    const asterismScale = isPortrait ? 0.82 : isTabletLand ? 0.84 : 1.04;
    const asterismX = isPortrait ? 0 : isTabletLand ? -1.6 : -1.56;
    const asterismY = isPortrait ? 1.72 : 0.06;
    this.asterismSculpture.update(
      dt,
      this.elapsed,
      this.pointer,
      asterismFocus,
      asterismX,
      asterismY,
      asterismScale,
      this.prefersReducedMotion,
    );

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.disposed = true;
    this.stop();
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    this.scene?.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (m && m !== this.backdropMat) {
            const std = m as THREE.MeshStandardMaterial;
            std.map?.dispose();
          }
        }
      }
    });
    this.backdropMat?.dispose();
    this.materials?.dispose();
    this.envTextures?.dispose();
    this.renderer?.dispose();
    this.renderer = null;
  }
}
