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
  arcadeFocus: number;     // 0..1 bell curve for 서준이네 오락실
  asterismFocus: number;   // 0..1 bell curve for Asterism Write
  daylightBlend: number;   // 0 = dark studio, 1 = bright daylight cyclorama
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
 * Quiet photographic studio cyclorama backdrop with subtle Living Signal harmonic sheen.
 * Transitions seamlessly between Basalt dark studio, Velvet Indigo, and Bright Daylight Porcelain.
 */
const BACKDROP_FRAG = `
uniform float u_time;
uniform vec3 u_bgTop;
uniform vec3 u_bgBot;
uniform vec3 u_accent;
uniform float u_daylight;
uniform vec2 u_pointer;

varying vec2 v_uv;

void main() {
  vec2 uv = v_uv;
  vec3 col = mix(u_bgBot, u_bgTop, smoothstep(0.0, 1.0, uv.y));

  // Soft studio cyclorama key vignette falloff
  vec2 c = uv - vec2(0.54 + u_pointer.x * 0.06, 0.52 - u_pointer.y * 0.05);
  float glow = exp(-dot(c, c) * 3.6);
  col += u_accent * glow * mix(0.14, 0.05, u_daylight);

  // Subtle architectural Living Signal contour whisper in background depth
  float wave = sin((uv.x * 7.5 + sin(uv.y * 4.2 - u_time * 0.25) * 0.65) + u_time * 0.18);
  float line = 1.0 - smoothstep(0.0, 0.032, abs(wave));
  vec3 lineCol = mix(vec3(0.94, 0.93, 0.91), vec3(0.25, 0.36, 0.78), u_daylight);
  col = mix(col, lineCol, line * mix(0.045, 0.032, u_daylight));

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

  private readonly pointer = new PointerDynamics();
  private readonly raycaster = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();

  private deviceClass: DeviceClass;
  private prefersReducedMotion: boolean;
  private activeEnvMode: 'dark' | 'daylight' = 'dark';

  private targetChapters: ScrollChapters = {
    heroExit: 0,
    arcadeFocus: 0,
    asterismFocus: 0,
    daylightBlend: 0,
  };
  private smoothChapters: ScrollChapters = { ...this.targetChapters };

  private readonly colHeroTop = new THREE.Color('#090C12');
  private readonly colHeroBot = new THREE.Color('#131823');
  private readonly colArcadeTop = new THREE.Color('#120D29');
  private readonly colArcadeBot = new THREE.Color('#21174A');
  private readonly colDayTop = new THREE.Color('#F7F8FA');
  private readonly colDayBot = new THREE.Color('#ECEEF4');

  private readonly colAccentHero = new THREE.Color('#5B75FF');
  private readonly colAccentArcade = new THREE.Color('#FF7EB6');
  private readonly colAccentDay = new THREE.Color('#5B75FF');
  private readonly tmpColA = new THREE.Color();
  private readonly tmpColB = new THREE.Color();
  private readonly tmpAccent = new THREE.Color();

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
      renderer.toneMappingExposure = 1.08;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.transmissionResolutionScale = isMobile ? 0.35 : 0.5;
      renderer.shadowMap.enabled = !isMobile;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer = renderer;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color('#0B0E14');

      // Bake Virtual Photographic Softbox Environments (Dark Industrial + Bright Daylight)
      this.envTextures = buildStudioEnvironments(renderer);
      this.scene.environment = this.envTextures.darkStudio.texture;
      this.scene.environmentIntensity = 1.15;

      // Photographic Prime Lens FOV (34deg telephoto look = flatter, refined product perspective!)
      this.camera = new THREE.PerspectiveCamera(34, 16 / 9, 0.2, 60);
      this.camera.position.set(0, 0.25, 9.2);
      this.camera.lookAt(0, 0, 0);

      // Studio Cyclorama Backdrop Plane anchored safely behind all sculptures
      this.backdropMat = new THREE.ShaderMaterial({
        depthWrite: false,
        uniforms: {
          u_time: { value: 0 },
          u_bgTop: { value: this.colHeroTop.clone() },
          u_bgBot: { value: this.colHeroBot.clone() },
          u_accent: { value: this.colAccentHero.clone() },
          u_daylight: { value: 0 },
          u_pointer: { value: new THREE.Vector2(0, 0) },
        },
        vertexShader: BACKDROP_VERT,
        fragmentShader: BACKDROP_FRAG,
      });
      const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(42, 26), this.backdropMat);
      backdrop.position.set(0, 0, -9.5);
      this.scene.add(backdrop);

      // Three-Point Virtual Photo Studio Rig
      this.hemiLight = new THREE.HemisphereLight(0xdce6ff, 0x161a24, 0.65);
      this.scene.add(this.hemiLight);

      this.keyLight = new THREE.DirectionalLight(0xfff6ea, 2.6);
      this.keyLight.position.set(5.5, 7.5, 7.0);
      if (!isMobile) {
        this.keyLight.castShadow = true;
        this.keyLight.shadow.mapSize.set(1024, 1024);
        this.keyLight.shadow.camera.near = 1;
        this.keyLight.shadow.camera.far = 26;
        this.keyLight.shadow.camera.left = -6.5;
        this.keyLight.shadow.camera.right = 6.5;
        this.keyLight.shadow.camera.top = 6.5;
        this.keyLight.shadow.camera.bottom = -6.5;
        this.keyLight.shadow.bias = -0.0004;
      }
      this.scene.add(this.keyLight);

      this.fillLight = new THREE.DirectionalLight(0x6d87ff, 1.15);
      this.fillLight.position.set(-7.0, 2.2, 4.0);
      this.scene.add(this.fillLight);

      this.rimLight = new THREE.DirectionalLight(0xf4654d, 1.35);
      this.rimLight.position.set(-3.5, 4.8, -6.5);
      this.scene.add(this.rimLight);

      // Material Library & Sculptures
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
    // Widen camera slightly on narrow portrait screens so full sculptural silhouette breathes cleanly
    this.camera.fov = aspect < 0.78 ? 44 : aspect < 1.1 ? 39 : 34;
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

    this.pointer.triggerClickImpulse(0.95);
    this.raycaster.setFromCamera(this.ndc, this.camera);

    const activeTargets: THREE.Object3D[] = [];
    if (this.heroSculpture.group.visible) activeTargets.push(this.heroSculpture.hitMesh);
    if (this.arcadeSculpture.group.visible) activeTargets.push(this.arcadeSculpture.hitMesh);
    if (this.asterismSculpture.group.visible) activeTargets.push(this.asterismSculpture.hitMesh);

    const hits = this.raycaster.intersectObjects(activeTargets, false);
    const hitKind = hits[0]?.object?.userData?.sculpture;

    if (hitKind === 'hero' || this.smoothChapters.heroExit < 0.45) {
      this.heroSculpture.triggerPluck(1.1);
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

    // Step smooth scroll choreography (responsive damping, zero lag on instant section jumps)
    const chLerp = this.prefersReducedMotion ? 1 : Math.min(1, dt * 13.5);
    this.smoothChapters.heroExit +=
      (this.targetChapters.heroExit - this.smoothChapters.heroExit) * chLerp;
    this.smoothChapters.arcadeFocus +=
      (this.targetChapters.arcadeFocus - this.smoothChapters.arcadeFocus) * chLerp;
    this.smoothChapters.asterismFocus +=
      (this.targetChapters.asterismFocus - this.smoothChapters.asterismFocus) * chLerp;
    this.smoothChapters.daylightBlend +=
      (this.targetChapters.daylightBlend - this.smoothChapters.daylightBlend) * chLerp;

    this.pointer.update(dt);

    const { heroExit, arcadeFocus, asterismFocus, daylightBlend } = this.smoothChapters;
    const isPortrait = this.deviceClass === 'mobile' || this.deviceClass === 'tablet-portrait';
    const isTabletLand = this.deviceClass === 'tablet-landscape';

    // Swap baked PMREM Softbox Environment cleanly between Dark Studio & Bright Daylight Studio
    const desiredEnv: 'dark' | 'daylight' = daylightBlend > 0.5 ? 'daylight' : 'dark';
    if (desiredEnv !== this.activeEnvMode && this.envTextures) {
      this.activeEnvMode = desiredEnv;
      this.scene.environment =
        desiredEnv === 'daylight'
          ? this.envTextures.daylightStudio.texture
          : this.envTextures.darkStudio.texture;
    }

    // Morph studio backdrop, lighting & rim color smoothly across chapters
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
    this.backdropMat.uniforms.u_time.value = this.elapsed;
    (this.backdropMat.uniforms.u_pointer.value as THREE.Vector2).set(
      this.pointer.heavyX.value,
      this.pointer.heavyY.value,
    );
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(this.tmpColB);
    }

    // Studio Light Rig Adaptation (Dark dramatic key/rim -> Bright soft daylight cyclorama)
    this.keyLight.intensity = THREE.MathUtils.lerp(2.6, 2.2, daylightBlend);
    this.hemiLight.intensity = THREE.MathUtils.lerp(0.62, 1.35, daylightBlend);
    this.fillLight.color
      .setHex(0x6d87ff)
      .lerp(new THREE.Color(0x5ef2c8), arcadeFocus * 0.7)
      .lerp(new THREE.Color(0xffffff), daylightBlend * 0.85);
    this.rimLight.color
      .setHex(0xf4654d)
      .lerp(new THREE.Color(0xffd23f), arcadeFocus * 0.85)
      .lerp(new THREE.Color(0x5b75ff), daylightBlend * 0.9);
    this.rimLight.intensity = THREE.MathUtils.lerp(1.4, 0.95, daylightBlend);

    // Subtle photographic camera dolly + pointer parallax (capped, weighty, never dizzy)
    const camZ = isPortrait ? 10.6 : isTabletLand ? 9.8 : 9.0;
    const targetCamX = this.pointer.heavyX.value * (isPortrait ? 0.16 : 0.42);
    const targetCamY = 0.24 - this.pointer.heavyY.value * (isPortrait ? 0.12 : 0.28);
    this.camera.position.set(targetCamX, targetCamY, camZ - arcadeFocus * 0.45 - asterismFocus * 0.35);
    this.camera.lookAt(0, isPortrait ? -0.15 : 0.02, 0);

    // Per-device deliberate asymmetric spatial offsets for all 3 sculptures!
    const heroX = isPortrait ? 0 : isTabletLand ? 0.9 : 1.2;
    const heroY = isPortrait ? 0.95 : 0.22;
    this.heroSculpture.group.position.x = heroX;
    this.heroSculpture.update(dt, this.elapsed, this.pointer, heroExit, this.prefersReducedMotion);
    this.heroSculpture.group.position.y += heroY;

    // Exhibition 01 (Arcade): Right side on Desktop/Tablet Landscape, upper stage on Portrait
    const arcadeX = isPortrait ? 0 : isTabletLand ? 1.45 : 1.72;
    const arcadeY = isPortrait ? 1.08 : 0.05;
    this.arcadeSculpture.update(
      dt,
      this.elapsed,
      this.pointer,
      arcadeFocus,
      arcadeX,
      arcadeY,
      this.prefersReducedMotion,
    );

    // Exhibition 02 (Asterism): Left side on Desktop/Tablet Landscape (asymmetric rhythm!), upper stage on Portrait
    const asterismX = isPortrait ? 0 : isTabletLand ? -1.42 : -1.72;
    const asterismY = isPortrait ? 1.05 : 0.08;
    this.asterismSculpture.update(
      dt,
      this.elapsed,
      this.pointer,
      asterismFocus,
      asterismX,
      asterismY,
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
