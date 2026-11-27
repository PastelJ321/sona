export type SignalMode = 'interference' | 'resonance' | 'wavefront';

export interface SignalEmitter {
  id: number;
  x: number; // 0..1 normalized viewport
  y: number; // 0..1 normalized viewport (top=0)
  freq: number;
  birth: number;
  isAmbient: boolean;
}

export interface SignalPulse {
  x: number;
  y: number;
  birth: number;
  strength: number;
}

export interface SignalEngineStats {
  renderer: 'webgl' | 'canvas2d';
  emitterCount: number;
  userEmitterCount: number;
  activeMode: SignalMode;
  fps: number;
}

export interface LivingSignalOptions {
  glCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  isMobile: boolean;
  isTablet: boolean;
  prefersReducedMotion: boolean;
  onStatsChange?: (stats: SignalEngineStats) => void;
}

const MAX_EMITTERS = 6;
const MAX_PULSES = 8;

const VERTEX_SHADER_SRC = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/**
 * Single-pass analytical height + exact gradient (vec3(h, dh/dx, dh/dy)) GLSL shader.
 * Avoids 3x finite-difference evaluations per pixel for locked 60fps across desktop,
 * tablet, and mobile GPUs while keeping sculptural optical lighting mathematically crisp.
 */
const FRAGMENT_SHADER_SRC = `
precision mediump float;

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_mode;        // 0 = interference, 1 = resonance, 2 = wavefront
uniform float u_mobile;      // 1.0 mobile, 0.5 tablet, 0.0 desktop
uniform float u_scroll;      // 0..1 scroll progress
uniform vec4 u_pointer;      // xy = normalized pos (y top-down), z = velocity, w = active
uniform vec4 u_emitters[${MAX_EMITTERS}]; // xy = pos (y top-down), z = freq, w = strength
uniform vec4 u_pulses[${MAX_PULSES}];     // xy = pos (y top-down), z = age, w = strength

vec3 evalFieldGrad(vec2 uv, float t) {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  float zoom = mix(1.0, 0.78, u_mobile);
  vec2 scale = vec2(aspect * zoom, zoom);
  vec2 p = (uv - 0.5) * scale;

  // Pointer tactile lens & gentle warp
  vec2 ptrUv = vec2(u_pointer.x, 1.0 - u_pointer.y);
  vec2 ptrF = (ptrUv - 0.5) * scale;
  vec2 dPtr = p - ptrF;
  float rPtr2 = dot(dPtr, dPtr);
  float ptrLens = exp(-rPtr2 * 5.4) * u_pointer.w;
  vec2 pw = p - dPtr * (0.08 * ptrLens * (0.6 + u_pointer.z * 1.2));

  float mInterf = clamp(1.0 - abs(u_mode - 0.0), 0.0, 1.0);
  float mReson  = clamp(1.0 - abs(u_mode - 1.0), 0.0, 1.0);
  float mWave   = clamp(1.0 - abs(u_mode - 2.0), 0.0, 1.0);

  float h = 0.0;
  vec2 grad = vec2(0.0);

  // 1. Multi-source concentric emitter wave interference (exact analytical derivative)
  float emWeight = mInterf * 0.78 + mReson * 0.44 + mWave * 0.62;
  for (int i = 0; i < ${MAX_EMITTERS}; i++) {
    vec4 em = u_emitters[i];
    if (em.w > 0.01) {
      vec2 emUv = vec2(em.x, 1.0 - em.y);
      vec2 emF = (emUv - 0.5) * scale;
      vec2 dv = pw - emF;
      float d = length(dv) + 0.0001;
      vec2 dir = dv / d;
      float k = em.z * 14.2;
      float ph = d * k - t * (1.85 + em.z * 0.45);
      float env = exp(-d * 1.42) / (0.28 + d * 1.32);
      float s = sin(ph);
      float c = cos(ph);
      float amp = env * em.w * emWeight;
      h += s * amp;
      float dEnv = -(1.42 + 1.32 / (0.28 + d * 1.32)) * env;
      grad += dir * ((c * k * env + s * dEnv) * em.w * emWeight);
    }
  }

  // 2. Propagating impulse wave packets (pointer wake & taps)
  float plWeight = mInterf * 1.15 + mReson * 1.15 + mWave * 1.38;
  for (int i = 0; i < ${MAX_PULSES}; i++) {
    vec4 pl = u_pulses[i];
    if (pl.w > 0.01) {
      vec2 plUv = vec2(pl.x, 1.0 - pl.y);
      vec2 plF = (plUv - 0.5) * scale;
      vec2 dv = p - plF;
      float d = length(dv) + 0.0001;
      float radius = pl.z * 0.56;
      float ring = d - radius;
      if (abs(ring) < 0.34) {
        vec2 dir = dv / d;
        float env = exp(-ring * ring * 64.0) * exp(-pl.z * 1.18) * pl.w * plWeight;
        float c = cos(ring * 40.0);
        float s = sin(ring * 40.0);
        h += c * env;
        grad += dir * ((-s * 40.0 - 128.0 * ring * c) * env);
      }
    }
  }

  // 3. Cymatic Chladni standing wave pattern
  float resWeight = mInterf * 0.22 + mReson * 0.94;
  if (resWeight > 0.01) {
    float scrollPhase = u_scroll * 1.6;
    float n1 = 3.0 + sin(t * 0.14 + scrollPhase) * 0.45;
    float m1 = 5.0 + cos(t * 0.11 - scrollPhase) * 0.55;
    vec2 cp = pw * 2.35;
    float cnx = cos(n1 * cp.x), snx = sin(n1 * cp.x);
    float cmy = cos(m1 * cp.y), smy = sin(m1 * cp.y);
    float cmx = cos(m1 * cp.x), smx = sin(m1 * cp.x);
    float cny = cos(n1 * cp.y), sny = sin(n1 * cp.y);

    float chladni = (cnx * cmy - cmx * cny) * 0.62;
    float dChX = (-n1 * snx * cmy + m1 * smx * cny) * 0.62 * 2.35;
    float dChY = (-m1 * cnx * smy + n1 * cmx * sny) * 0.62 * 2.35;

    h += chladni * resWeight;
    grad += vec2(dChX, dChY) * resWeight;
  }

  // 4. Sculptural acoustic carrier swell
  float swWeight = mInterf * 0.45 + mWave * 0.88;
  if (swWeight > 0.01) {
    float a1 = pw.x * 5.0 + t * 0.42;
    float a2 = pw.y * 5.8 - t * 0.36;
    float s1 = sin(a1 + sin(pw.y * 2.8 - t * 0.25) * 0.65);
    float c1 = cos(a1 + sin(pw.y * 2.8 - t * 0.25) * 0.65);
    float s2 = cos(a2 + cos(pw.x * 2.6 + t * 0.21) * 0.6);
    float c2 = -sin(a2 + cos(pw.x * 2.6 + t * 0.21) * 0.6);

    h += (s1 * 0.28 + s2 * 0.22) * swWeight;
    grad += vec2(c1 * 5.0 * 0.28 - c2 * sin(pw.x * 2.6 + t * 0.21) * 1.56 * 0.22,
                 c2 * 5.8 * 0.22 + c1 * cos(pw.y * 2.8 - t * 0.25) * 1.82 * 0.28) * swWeight;
  }

  // Pointer gentle physical dome
  float ptrAmp = 0.22 + u_pointer.z * 0.26;
  h += ptrLens * ptrAmp;
  grad += -10.8 * dPtr * ptrLens * ptrAmp;

  return vec3(h, grad);
}

void main() {
  vec2 uv = v_uv;
  float t = u_time;

  vec3 fg = evalFieldGrad(uv, t);
  float h = fg.x;
  vec2 grad = fg.yz * 0.14;
  float slope = length(grad);
  vec3 normal = normalize(vec3(-grad.x * 0.55, -grad.y * 0.55, 1.0));

  // Refined SONA Atelier Palette: deep slate basalt + porcelain + iris + vermilion + acid lime
  vec3 basalt    = vec3(0.058, 0.070, 0.095); // deeper crisp #0F1218 anchor
  vec3 basaltHi  = vec3(0.118, 0.142, 0.198);
  vec3 porcelain = vec3(0.941, 0.933, 0.910); // #F0EEE8
  vec3 iris      = vec3(0.357, 0.459, 1.000); // #5B75FF
  vec3 vermilion = vec3(0.957, 0.396, 0.302); // #F4654D
  vec3 acidLime  = vec3(0.851, 0.961, 0.424); // #D9F56C

  // Sculptural gallery studio lights
  vec3 keyDir = normalize(vec3(-0.38, 0.64, 0.66));
  vec3 rimDir = normalize(vec3(0.76, -0.34, 0.55));
  vec3 viewDir = vec3(0.0, 0.0, 1.0);

  float diffKey = max(dot(normal, keyDir), 0.0);
  float specKey = pow(max(dot(reflect(-keyDir, normal), viewDir), 0.0), 30.0);
  float specRim = pow(max(dot(reflect(-rimDir, normal), viewDir), 0.0), 20.0);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);

  vec3 col = mix(basalt, basaltHi, diffKey * 0.68 + fresnel * 0.42);

  // Asymmetric subtle architectural light wash (off-center right + lower left)
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float rightBloom = exp(-dot(p - vec2(0.34, 0.08), p - vec2(0.34, 0.08)) * 1.7);
  col += iris * rightBloom * 0.11;

  // Clean spectral separation (Iris on positive crests, Vermilion on grazing rim highlights)
  float crest = smoothstep(0.14, 1.02, h);
  float ridge = smoothstep(0.42, 2.2, slope);
  col += iris * (crest * 0.25 + specKey * 0.48 + fresnel * 0.24);
  col += vermilion * (specRim * 0.34 + ridge * 0.09);

  // Wavefront mode accentuates crisp chromatic dispersion along crests
  float mWave = clamp(1.0 - abs(u_mode - 2.0), 0.0, 1.0);
  col += mix(iris, vermilion, smoothstep(-0.3, 0.5, grad.x)) * specKey * 0.42 * mWave;

  // Crisp topographic iso-contour ridges
  float mReson = clamp(1.0 - abs(u_mode - 1.0), 0.0, 1.0);
  float contourFreq = mix(5.2, 7.0, mReson);
  float distToLine = abs(fract(h * contourFreq - 0.5) - 0.5);
  float lineWidth = clamp(slope * 0.068 + 0.022, 0.022, 0.13);
  float contour = 1.0 - smoothstep(0.0, lineWidth, distToLine);

  // Nodal zero-crossing resonance curve
  float zeroLine = 1.0 - smoothstep(0.0, clamp(slope * 0.032 + 0.015, 0.015, 0.075), abs(h));

  // Acid Lime sparks strictly at constructive interference summits
  float peak = smoothstep(0.68, 1.18, h) * (1.0 - smoothstep(0.22, 1.35, slope));

  vec3 contourCol = mix(porcelain, iris, 0.32 + 0.32 * sin(h * 2.4));
  col = mix(col, contourCol, contour * mix(0.24, 0.44, crest));

  vec3 nodalCol = mix(porcelain, acidLime, 0.38 + 0.38 * mReson);
  col = mix(col, nodalCol, zeroLine * mix(0.26, 0.58, mReson));
  col += acidLime * peak * 0.42;

  // Fine architectural hairline grid etched into the basalt stage
  float gridStep = mix(0.16, 0.24, u_mobile);
  vec2 g = abs(fract(p / gridStep - 0.5) - 0.5) * gridStep;
  float gridLine = 1.0 - smoothstep(0.0, 0.0014, min(g.x, g.y));
  col += porcelain * gridLine * 0.036;

  // Editorial legibility scrim on left text column & bottom console anchor
  float leftScrim = smoothstep(0.56, 0.0, uv.x) * (1.0 - u_mobile * 0.52);
  col = mix(col, basalt * 0.92, leftScrim * 0.52);
  float bottomScrim = smoothstep(0.22, 0.0, uv.y);
  col = mix(col, basalt, bottomScrim * 0.52);

  // Micro dithering prevents 8-bit gradient banding
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.01;

  gl_FragColor = vec4(col, 1.0);
}
`;

const MODE_INDEX: Record<SignalMode, number> = {
  interference: 0,
  resonance: 1,
  wavefront: 2,
};

function createAmbientEmitters(isMobile: boolean): SignalEmitter[] {
  if (isMobile) {
    return [
      { id: 1, x: 0.72, y: 0.32, freq: 1.05, birth: 0, isAmbient: true },
      { id: 2, x: 0.26, y: 0.62, freq: 0.88, birth: 0, isAmbient: true },
    ];
  }
  return [
    { id: 1, x: 0.68, y: 0.42, freq: 1.12, birth: 0, isAmbient: true },
    { id: 2, x: 0.48, y: 0.64, freq: 0.94, birth: 0, isAmbient: true },
  ];
}

export class LivingSignalEngine {
  private glCanvas: HTMLCanvasElement;
  private overlayCanvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;
  private fallbackCtx: CanvasRenderingContext2D | null = null;

  private uniforms: Record<string, WebGLUniformLocation | null> = {};
  private vertexBuffer: WebGLBuffer | null = null;

  private renderer: 'webgl' | 'canvas2d' = 'canvas2d';
  private isMobile: boolean;
  private isTablet: boolean;
  private prefersReducedMotion: boolean;
  private onStatsChange?: (stats: SignalEngineStats) => void;

  private width = 1;
  private height = 1;
  private dpr = 1;
  private dynamicScale = 1;

  private rafId = 0;
  private isRunning = false;
  private isVisible = true;
  private disposed = false;

  private time = 0;
  private lastTs = 0;
  private frameDeltaAvg = 16.6;
  private statsAccumulator = 0;

  private targetMode = 0;
  private currentMode = 0;
  private activeModeName: SignalMode = 'interference';

  private scrollProgress = 0;

  private pointerTargetX = 0.66;
  private pointerTargetY = 0.44;
  private pointerX = 0.66;
  private pointerY = 0.44;
  private pointerVel = 0;
  private pointerActive = 0;
  private pointerActiveTarget = 0;
  private lastWakeTime = 0;

  private nextEmitterId = 10;
  private emitters: SignalEmitter[] = [];
  private pulses: SignalPulse[] = [];

  private emitterData = new Float32Array(MAX_EMITTERS * 4);
  private pulseData = new Float32Array(MAX_PULSES * 4);

  constructor(options: LivingSignalOptions) {
    this.glCanvas = options.glCanvas;
    this.overlayCanvas = options.overlayCanvas;
    this.isMobile = options.isMobile;
    this.isTablet = options.isTablet;
    this.prefersReducedMotion = options.prefersReducedMotion;
    this.onStatsChange = options.onStatsChange;

    this.overlayCtx = this.overlayCanvas.getContext('2d');
    this.emitters = createAmbientEmitters(this.isMobile);

    this.initWebGL();
    this.bindContextEvents();
    this.resize();
    this.emitStats();

    if (this.prefersReducedMotion) {
      this.renderFrame(0.016);
    } else {
      this.start();
    }
  }

  private initWebGL(): void {
    try {
      const gl =
        (this.glCanvas.getContext('webgl', {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }) as WebGLRenderingContext | null) ||
        (this.glCanvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

      if (!gl) {
        this.activateCanvasFallback();
        return;
      }

      const vs = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
      const fs = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
      if (!vs || !fs) {
        this.activateCanvasFallback();
        return;
      }

      const program = gl.createProgram();
      if (!program) {
        this.activateCanvasFallback();
        return;
      }

      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        this.activateCanvasFallback();
        return;
      }

      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );

      const posLoc = gl.getAttribLocation(program, 'a_pos');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      this.gl = gl;
      this.program = program;
      this.vertexBuffer = buffer;
      this.renderer = 'webgl';

      this.uniforms = {
        u_resolution: gl.getUniformLocation(program, 'u_resolution'),
        u_time: gl.getUniformLocation(program, 'u_time'),
        u_mode: gl.getUniformLocation(program, 'u_mode'),
        u_mobile: gl.getUniformLocation(program, 'u_mobile'),
        u_scroll: gl.getUniformLocation(program, 'u_scroll'),
        u_pointer: gl.getUniformLocation(program, 'u_pointer'),
        u_emitters: gl.getUniformLocation(program, 'u_emitters[0]'),
        u_pulses: gl.getUniformLocation(program, 'u_pulses[0]'),
      };
    } catch {
      this.activateCanvasFallback();
    }
  }

  private compileShader(
    gl: WebGLRenderingContext,
    type: number,
    src: string,
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private activateCanvasFallback(): void {
    this.gl = null;
    this.program = null;
    this.renderer = 'canvas2d';
    this.fallbackCtx = this.glCanvas.getContext('2d');
  }

  private handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.stop();
  };

  private handleContextRestored = (): void => {
    if (this.disposed) return;
    this.initWebGL();
    this.resize();
    if (!this.prefersReducedMotion) {
      this.start();
    } else {
      this.renderFrame(0.016);
    }
  };

  private bindContextEvents(): void {
    this.glCanvas.addEventListener('webglcontextlost', this.handleContextLost, false);
    this.glCanvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);
  }

  public updateEnvironment(env: {
    isMobile: boolean;
    isTablet: boolean;
    prefersReducedMotion: boolean;
  }): void {
    const motionChanged = env.prefersReducedMotion !== this.prefersReducedMotion;
    this.isMobile = env.isMobile;
    this.isTablet = env.isTablet;
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
    const rect = this.glCanvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const maxDpr = this.isMobile ? 1.2 : this.isTablet ? 1.25 : 1.35;
    const baseDpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    this.width = w;
    this.height = h;
    this.dpr = baseDpr;

    // Cap continuous shader field internal pixel budget to <= 1080px wide for silky 60fps
    // while keeping the 2D architectural vector overlay at native HiDPI resolution!
    const rawGlW = w * baseDpr * this.dynamicScale;
    const capRatio = rawGlW > 1080 ? 1080 / rawGlW : 1;
    const glW = Math.max(1, Math.round(rawGlW * capRatio));
    const glH = Math.max(1, Math.round(h * baseDpr * this.dynamicScale * capRatio));

    if (this.glCanvas.width !== glW || this.glCanvas.height !== glH) {
      this.glCanvas.width = glW;
      this.glCanvas.height = glH;
    }

    const overlayDpr = Math.min(window.devicePixelRatio || 1, 2);
    const ovW = Math.max(1, Math.round(w * overlayDpr));
    const ovH = Math.max(1, Math.round(h * overlayDpr));
    if (this.overlayCanvas.width !== ovW || this.overlayCanvas.height !== ovH) {
      this.overlayCanvas.width = ovW;
      this.overlayCanvas.height = ovH;
    }

    if (this.gl) {
      this.gl.viewport(0, 0, glW, glH);
    }

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

  public setMode(mode: SignalMode): void {
    this.activeModeName = mode;
    this.targetMode = MODE_INDEX[mode];
    this.triggerResonancePulse(0.62, 0.48, 0.9);
    this.emitStats();
    if (this.prefersReducedMotion) {
      this.currentMode = this.targetMode;
      this.renderFrame(0.016);
    }
  }

  public setScrollProgress(progress: number): void {
    this.scrollProgress = Math.max(0, Math.min(1, progress));
  }

  public updatePointer(normX: number, normY: number, isActive: boolean, emitWake = true): void {
    const nx = Math.max(0, Math.min(1, normX));
    const ny = Math.max(0, Math.min(1, normY));
    const dx = nx - this.pointerTargetX;
    const dy = ny - this.pointerTargetY;
    const dist = Math.hypot(dx, dy);

    this.pointerTargetX = nx;
    this.pointerTargetY = ny;
    this.pointerActiveTarget = isActive ? 1 : 0;

    if (isActive && emitWake && dist > 0.018 && this.time - this.lastWakeTime > 0.075) {
      this.lastWakeTime = this.time;
      this.pushPulse(nx, ny, Math.min(0.85, 0.28 + dist * 6.0));
    }
  }

  public clearPointer(): void {
    this.pointerActiveTarget = 0;
  }

  public addUserEmitter(normX: number, normY: number): SignalEmitter {
    const nx = Math.max(0.05, Math.min(0.95, normX));
    const ny = Math.max(0.08, Math.min(0.9, normY));

    const userEmitters = this.emitters.filter((e) => !e.isAmbient);
    const ambientEmitters = this.emitters.filter((e) => e.isAmbient);

    const trimmedUser = userEmitters.length >= 4 ? userEmitters.slice(1) : userEmitters;
    const freq = 0.85 + (1 - ny) * 0.72;
    const emitter: SignalEmitter = {
      id: this.nextEmitterId++,
      x: nx,
      y: ny,
      freq,
      birth: this.time,
      isAmbient: false,
    };

    this.emitters = [...ambientEmitters, ...trimmedUser, emitter];
    this.pushPulse(nx, ny, 1.25);
    this.emitStats();

    if (this.prefersReducedMotion) {
      this.renderFrame(0.016);
    }
    return emitter;
  }

  public triggerResonancePulse(normX = 0.64, normY = 0.46, strength = 1.25): void {
    this.pushPulse(normX, normY, strength);
    for (const em of this.emitters) {
      if (!em.isAmbient) {
        this.pushPulse(em.x, em.y, 0.95);
      }
    }
    if (this.prefersReducedMotion) {
      this.renderFrame(0.016);
    }
  }

  public resetEmitters(): void {
    this.emitters = createAmbientEmitters(this.isMobile);
    this.pulses = [];
    this.pushPulse(0.64, 0.46, 0.95);
    this.emitStats();
    if (this.prefersReducedMotion) {
      this.renderFrame(0.016);
    }
  }

  private pushPulse(x: number, y: number, strength: number): void {
    this.pulses.push({ x, y, birth: this.time, strength });
    if (this.pulses.length > MAX_PULSES) {
      this.pulses.shift();
    }
  }

  private emitStats(): void {
    if (!this.onStatsChange) return;
    const userEmitterCount = this.emitters.filter((e) => !e.isAmbient).length;
    this.onStatsChange({
      renderer: this.renderer,
      emitterCount: this.emitters.length,
      userEmitterCount,
      activeMode: this.activeModeName,
      fps: Math.round(1000 / Math.max(8, this.frameDeltaAvg)),
    });
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

    const rawDeltaMs = Math.min(50, Math.max(4, now - this.lastTs));
    this.lastTs = now;
    const dt = rawDeltaMs / 1000;

    this.frameDeltaAvg = this.frameDeltaAvg * 0.92 + rawDeltaMs * 0.08;
    if (this.frameDeltaAvg > 28 && this.dynamicScale > 0.6) {
      this.dynamicScale = Math.max(0.6, this.dynamicScale - 0.1);
      this.resize();
    }

    this.renderFrame(dt);

    this.statsAccumulator += rawDeltaMs;
    if (this.statsAccumulator > 900) {
      this.statsAccumulator = 0;
      this.emitStats();
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  private renderFrame(dt: number): void {
    this.time += dt;

    const modeLerp = Math.min(1, dt * 4.5);
    this.currentMode += (this.targetMode - this.currentMode) * modeLerp;

    const prevX = this.pointerX;
    const prevY = this.pointerY;
    const pLerp = Math.min(1, dt * 9.5);
    this.pointerX += (this.pointerTargetX - this.pointerX) * pLerp;
    this.pointerY += (this.pointerTargetY - this.pointerY) * pLerp;
    this.pointerActive += (this.pointerActiveTarget - this.pointerActive) * Math.min(1, dt * 6);

    const instantVel =
      Math.hypot(this.pointerX - prevX, this.pointerY - prevY) / Math.max(dt, 0.008);
    this.pointerVel = this.pointerVel * 0.86 + Math.min(1.8, instantVel) * 0.14;

    const ambients = this.emitters.filter((e) => e.isAmbient);
    if (ambients[0]) {
      const baseX = this.isMobile ? 0.68 : 0.7;
      const baseY = this.isMobile ? 0.32 : 0.4;
      ambients[0].x = baseX + Math.sin(this.time * 0.24) * 0.06;
      ambients[0].y = baseY + Math.cos(this.time * 0.19) * 0.06;
    }
    if (ambients[1]) {
      const baseX = this.isMobile ? 0.3 : 0.5;
      const baseY = this.isMobile ? 0.62 : 0.64;
      ambients[1].x = baseX + Math.cos(this.time * 0.21) * 0.07;
      ambients[1].y = baseY + Math.sin(this.time * 0.26) * 0.05;
    }

    this.pulses = this.pulses.filter((p) => this.time - p.birth < 3.2);

    if (this.renderer === 'webgl' && this.gl && this.program) {
      this.renderWebGL();
    } else {
      this.renderCanvas2DFallback();
    }

    this.renderOverlay2D();
  }

  private renderWebGL(): void {
    const gl = this.gl!;
    gl.useProgram(this.program);

    gl.uniform2f(this.uniforms.u_resolution, this.glCanvas.width, this.glCanvas.height);
    gl.uniform1f(this.uniforms.u_time, this.time);
    gl.uniform1f(this.uniforms.u_mode, this.currentMode);
    gl.uniform1f(this.uniforms.u_mobile, this.isMobile ? 1.0 : this.isTablet ? 0.5 : 0.0);
    gl.uniform1f(this.uniforms.u_scroll, this.scrollProgress);
    gl.uniform4f(
      this.uniforms.u_pointer,
      this.pointerX,
      this.pointerY,
      this.pointerVel,
      this.pointerActive,
    );

    this.emitterData.fill(0);
    for (let i = 0; i < Math.min(MAX_EMITTERS, this.emitters.length); i++) {
      const em = this.emitters[i];
      const age = Math.max(0, this.time - em.birth);
      const fadeIn = em.isAmbient ? 0.72 : Math.min(1, age * 3.5);
      this.emitterData[i * 4] = em.x;
      this.emitterData[i * 4 + 1] = em.y;
      this.emitterData[i * 4 + 2] = em.freq;
      this.emitterData[i * 4 + 3] = fadeIn;
    }
    gl.uniform4fv(this.uniforms.u_emitters, this.emitterData);

    this.pulseData.fill(0);
    for (let i = 0; i < Math.min(MAX_PULSES, this.pulses.length); i++) {
      const pl = this.pulses[i];
      this.pulseData[i * 4] = pl.x;
      this.pulseData[i * 4 + 1] = pl.y;
      this.pulseData[i * 4 + 2] = Math.max(0, this.time - pl.birth);
      this.pulseData[i * 4 + 3] = pl.strength;
    }
    gl.uniform4fv(this.uniforms.u_pulses, this.pulseData);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private renderCanvas2DFallback(): void {
    const ctx = this.fallbackCtx;
    if (!ctx) return;

    const w = this.glCanvas.width;
    const h = this.glCanvas.height;
    ctx.fillStyle = '#0F1218';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    for (const em of this.emitters) {
      const cx = em.x * w;
      const cy = em.y * h;
      const ringCount = this.isMobile ? 7 : 11;
      for (let r = 1; r <= ringCount; r++) {
        const radius =
          ((r * 46 + this.time * 28 * em.freq) % (ringCount * 46)) * (this.dpr * 0.85);
        const alpha = Math.max(0, 1 - radius / (ringCount * 46 * this.dpr)) * 0.28;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = em.isAmbient
          ? `rgba(91, 117, 255, ${alpha.toFixed(3)})`
          : `rgba(217, 245, 108, ${(alpha * 1.15).toFixed(3)})`;
        ctx.lineWidth = Math.max(1, this.dpr);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private renderOverlay2D(): void {
    const ctx = this.overlayCtx;
    if (!ctx) return;

    const w = this.overlayCanvas.width;
    const h = this.overlayCanvas.height;
    const scale = w / Math.max(1, this.width);

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.scale(scale, scale);

    const userEmitters = this.emitters.filter((e) => !e.isAmbient);

    // 1. Reactive vector field ticks around pointer on desktop/tablet
    if (this.pointerActive > 0.05 && !this.isMobile) {
      const px = this.pointerX * this.width;
      const py = this.pointerY * this.height;
      const spacing = 44;
      const radius = 175;
      const startX = Math.floor((px - radius) / spacing) * spacing;
      const endX = px + radius;
      const startY = Math.floor((py - radius) / spacing) * spacing;
      const endY = py + radius;

      ctx.lineWidth = 1;
      for (let gx = startX; gx <= endX; gx += spacing) {
        for (let gy = startY; gy <= endY; gy += spacing) {
          const dx = gx - px;
          const dy = gy - py;
          const dist = Math.hypot(dx, dy);
          if (dist < 16 || dist > radius) continue;

          const falloff = (1 - dist / radius) * this.pointerActive;
          const angle = Math.atan2(dy, dx) + Math.sin(dist * 0.04 - this.time * 2.4) * 0.55;
          const len = 5 + falloff * 7;

          ctx.strokeStyle = `rgba(240, 238, 232, ${(falloff * 0.28).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(gx - Math.cos(angle) * len * 0.5, gy - Math.sin(angle) * len * 0.5);
          ctx.lineTo(gx + Math.cos(angle) * len * 0.5, gy + Math.sin(angle) * len * 0.5);
          ctx.stroke();
        }
      }
    }

    // 2. Interference chords between user-placed nodes
    if (userEmitters.length >= 2) {
      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1;
      for (let i = 0; i < userEmitters.length; i++) {
        for (let j = i + 1; j < userEmitters.length; j++) {
          const a = userEmitters[i];
          const b = userEmitters[j];
          const ax = a.x * this.width;
          const ay = a.y * this.height;
          const bx = b.x * this.width;
          const by = b.y * this.height;
          if (Math.hypot(bx - ax, by - ay) < Math.max(this.width, this.height) * 0.65) {
            ctx.strokeStyle = 'rgba(217, 245, 108, 0.28)';
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    // 3. Ambient crosshairs & user node reticles with smart edge-flip labels
    for (let i = 0; i < this.emitters.length; i++) {
      const em = this.emitters[i];
      const cx = em.x * this.width;
      const cy = em.y * this.height;

      if (em.isAmbient) {
        ctx.strokeStyle = 'rgba(240, 238, 232, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy);
        ctx.lineTo(cx + 7, cy);
        ctx.moveTo(cx, cy - 7);
        ctx.lineTo(cx, cy + 7);
        ctx.stroke();
        continue;
      }

      const userIndex = userEmitters.indexOf(em) + 1;
      const pulsePhase = (this.time * 1.1 + userIndex * 0.4) % 1;
      const ringRadius = 11 + pulsePhase * 22;
      const ringAlpha = (1 - pulsePhase) * 0.48;

      ctx.strokeStyle = `rgba(217, 245, 108, ${ringAlpha.toFixed(3)})`;
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(240, 238, 232, 0.84)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = userIndex % 2 === 1 ? '#D9F56C' : '#F4654D';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.8, 0, Math.PI * 2);
      ctx.fill();

      const hz = (em.freq * 2.8).toFixed(1);
      const label = `N-0${userIndex} · ${hz}Hz`;
      ctx.font = '500 10px "IBM Plex Mono", ui-monospace, monospace';
      ctx.fillStyle = 'rgba(240, 238, 232, 0.88)';
      const flipLeft = cx > this.width - 115;
      ctx.textAlign = flipLeft ? 'right' : 'left';
      ctx.fillText(label, flipLeft ? cx - 14 : cx + 14, cy + 3.5);
      ctx.textAlign = 'left';
    }

    // 4. Crisp propagating tap confirmation rings
    for (const pl of this.pulses) {
      const age = this.time - pl.birth;
      if (age > 0.72 || pl.strength < 0.9) continue;
      const progress = age / 0.72;
      const r = 10 + progress * 68;
      const alpha = (1 - progress) * 0.44;
      ctx.strokeStyle = `rgba(240, 238, 232, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pl.x * this.width, pl.y * this.height, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  public dispose(): void {
    this.disposed = true;
    this.stop();
    this.glCanvas.removeEventListener('webglcontextlost', this.handleContextLost);
    this.glCanvas.removeEventListener('webglcontextrestored', this.handleContextRestored);

    if (this.gl) {
      if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer);
      if (this.program) this.gl.deleteProgram(this.program);
      this.gl = null;
    }
  }
}
