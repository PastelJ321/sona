import * as THREE from 'three';
import type { SignalMode } from '../engine/LivingSignalEngine';

const MAX_NODES = 6;
const MAX_PULSES = 6;

const TERRAIN_VERT = `
uniform float u_time;
uniform float u_mode;
uniform float u_surge;
uniform vec4 u_nodes[${MAX_NODES}];   // xz = world pos, y = freq, w = strength
uniform vec4 u_pulses[${MAX_PULSES}]; // xz = world pos, y = age, w = strength
uniform vec3 u_probe;                 // xz = probe pos, y = active

varying vec3 v_worldPos;
varying float v_height;
varying float v_slope;

float evalWave(vec2 xz, float t) {
  float rCenter = length(xz);
  // Calm under central terraces so architecture seats cleanly, dramatic wave field everywhere around
  float terraceMask = smoothstep(3.4, 8.2, rCenter);

  float mInterf = clamp(1.0 - abs(u_mode - 0.0), 0.0, 1.0);
  float mReson  = clamp(1.0 - abs(u_mode - 1.0), 0.0, 1.0);
  float mWave   = clamp(1.0 - abs(u_mode - 2.0), 0.0, 1.0);

  float h = 0.0;

  // Multi-source concentric signal interference
  float emSum = 0.0;
  for (int i = 0; i < ${MAX_NODES}; i++) {
    vec4 nd = u_nodes[i];
    if (nd.w > 0.01) {
      float d = length(xz - nd.xz);
      float env = exp(-d * 0.095) / (0.65 + d * 0.18);
      emSum += sin(d * (1.25 * nd.y) - t * (2.0 + nd.y * 0.35)) * env * nd.w;
    }
  }

  // Expanding 3D impulse rings (clicks, probe wake, resonance surge)
  float plSum = 0.0;
  for (int i = 0; i < ${MAX_PULSES}; i++) {
    vec4 pl = u_pulses[i];
    if (pl.w > 0.01) {
      float d = length(xz - pl.xz);
      float rad = pl.y * 8.5;
      float ring = d - rad;
      if (abs(ring) < 3.6) {
        float env = exp(-ring * ring * 0.42) * exp(-pl.y * 0.85) * pl.w;
        plSum += cos(ring * 2.8) * env;
      }
    }
  }

  // Chladni standing-wave symmetry
  float n = 0.32 + sin(t * 0.14) * 0.04;
  float m = 0.54 + cos(t * 0.11) * 0.05;
  float chladni = (cos(n * xz.x) * cos(m * xz.y) - cos(m * xz.x) * cos(n * xz.y)) * 0.55;

  // Sculptural acoustic swell
  float swell = sin(xz.x * 0.36 + t * 0.65) * cos(xz.y * 0.32 - t * 0.52) * 0.42;

  h += mInterf * (emSum * 0.62 + swell * 0.34 + chladni * 0.16);
  h += mReson  * (chladni * 0.92 + emSum * 0.38);
  h += mWave   * (swell * 0.78 + emSum * 0.56);

  // Probe gentle depression & bow wave
  if (u_probe.y > 0.01) {
    float dp = length(xz - u_probe.xz);
    h += sin(dp * 2.4 - t * 6.0) * exp(-dp * 0.48) * 0.36 * u_probe.y;
  }

  // Radial resonance surge boost
  float surgeWave = sin(rCenter * 1.15 - u_surge * 14.0) * exp(-abs(rCenter - u_surge * 24.0) * 0.28) * (1.0 - u_surge);
  h += plSum * 0.72 + surgeWave * 0.85 * step(0.001, u_surge);

  return h * (0.28 + 0.72 * terraceMask);
}

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float h = evalWave(wp.xz, u_time);
  float hx = evalWave(wp.xz + vec2(0.28, 0.0), u_time);
  float hz = evalWave(wp.xz + vec2(0.0, 0.28), u_time);

  wp.y += h * 0.68;
  v_worldPos = wp.xyz;
  v_height = h;
  v_slope = length(vec2(hx - h, hz - h)) / 0.28;

  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const TERRAIN_FRAG = `
uniform float u_time;
uniform float u_mode;
uniform float u_surge;
uniform vec3 u_fogColor;
uniform vec3 u_accent;

varying vec3 v_worldPos;
varying float v_height;
varying float v_slope;

void main() {
  vec3 basalt    = vec3(0.062, 0.078, 0.116);
  vec3 basaltHi  = vec3(0.128, 0.162, 0.245);
  vec3 porcelain = vec3(0.941, 0.933, 0.910);
  vec3 iris      = vec3(0.357, 0.459, 1.000);
  vec3 vermilion = vec3(0.957, 0.396, 0.302);
  vec3 acidLime  = vec3(0.851, 0.961, 0.424);

  float crest = smoothstep(-0.08, 0.65, v_height);
  float ridge = smoothstep(0.14, 0.85, v_slope);

  vec3 col = mix(basalt, basaltHi, crest * 0.72 + ridge * 0.38);
  col += iris * (crest * 0.42 + ridge * 0.16);
  col += vermilion * (smoothstep(0.3, 0.98, v_slope) * 0.28);

  // Topographic iso-contour lines inherited from Living Signal V1
  float mReson = clamp(1.0 - abs(u_mode - 1.0), 0.0, 1.0);
  float freq = mix(4.8, 6.4, mReson);
  float frac = abs(fract(v_height * freq - 0.5) - 0.5);
  float contour = 1.0 - smoothstep(0.0, 0.085, frac);
  float zeroLine = 1.0 - smoothstep(0.0, 0.055, abs(v_height));

  vec3 contourCol = mix(porcelain, iris, 0.38);
  col = mix(col, contourCol, contour * (0.34 + crest * 0.34));
  col = mix(col, mix(porcelain, acidLime, 0.55 + 0.38 * mReson), zeroLine * (0.32 + 0.42 * mReson));

  // Architectural floor coordinate grid
  vec2 g = abs(fract(v_worldPos.xz * 0.35 - 0.5) - 0.5);
  float gridLine = 1.0 - smoothstep(0.0, 0.028, min(g.x, g.y));
  col += porcelain * gridLine * 0.075;

  // Radial Resonance Surge luminous ring
  float r = length(v_worldPos.xz);
  if (u_surge > 0.001 && u_surge < 0.999) {
    float waveFront = exp(-abs(r - u_surge * 24.0) * 0.65) * (1.0 - u_surge);
    col += mix(acidLime, u_accent, 0.45) * waveFront * 0.95;
  }

  // Distance atmospheric fade into horizon fog
  float distFade = smoothstep(16.0, 40.0, r);
  col = mix(col, u_fogColor, distFade);

  gl_FragColor = vec4(col, 1.0);
}
`;

interface TerrainNode {
  x: number;
  z: number;
  freq: number;
  strength: number;
  isAmbient: boolean;
  beaconGroup?: THREE.Group;
}

interface TerrainPulse {
  x: number;
  z: number;
  birth: number;
  strength: number;
}

const MODE_IDX: Record<SignalMode, number> = {
  interference: 0,
  resonance: 1,
  wavefront: 2,
};

export class SignalTerrain {
  public readonly group = new THREE.Group();
  public readonly hitPlane: THREE.Mesh;

  private readonly material: THREE.ShaderMaterial;
  private readonly pylons: THREE.InstancedMesh;
  private readonly pylonBases: { x: number; z: number; baseH: number; phase: number }[] = [];
  private readonly dummy = new THREE.Object3D();
  private readonly tmpColor = new THREE.Color();

  private readonly nodes: TerrainNode[] = [];
  private pulses: TerrainPulse[] = [];
  private readonly beaconsGroup = new THREE.Group();

  private time = 0;
  private currentMode = 0;
  private targetMode = 0;
  private surgeProgress = 0;
  private surgeActive = false;

  constructor(isMobile: boolean) {
    this.group.name = 'SignalTerrain';

    // 1. Displaced 3D Living Signal Membrane
    const segments = isMobile ? 64 : 112;
    const planeGeo = new THREE.PlaneGeometry(78, 78, segments, segments);
    planeGeo.rotateX(-Math.PI / 2);

    const nodeUniforms = Array.from({ length: MAX_NODES }, () => new THREE.Vector4(0, 1, 0, 0));
    const pulseUniforms = Array.from({ length: MAX_PULSES }, () => new THREE.Vector4(0, 0, 0, 0));

    this.material = new THREE.ShaderMaterial({
      vertexShader: TERRAIN_VERT,
      fragmentShader: TERRAIN_FRAG,
      uniforms: {
        u_time: { value: 0 },
        u_mode: { value: 0 },
        u_surge: { value: 0 },
        u_fogColor: { value: new THREE.Color('#0E121A') },
        u_accent: { value: new THREE.Color('#D9F56C') },
        u_nodes: { value: nodeUniforms },
        u_pulses: { value: pulseUniforms },
        u_probe: { value: new THREE.Vector3(0, 0, 0) },
      },
    });

    const mesh = new THREE.Mesh(planeGeo, this.material);
    mesh.position.y = -0.45;
    this.group.add(mesh);

    // Invisible click-raycast ground plane at y = -0.2
    const hitGeo = new THREE.PlaneGeometry(66, 66);
    hitGeo.rotateX(-Math.PI / 2);
    this.hitPlane = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
    this.hitPlane.position.y = -0.2;
    this.hitPlane.userData = { kind: 'ground' };
    this.group.add(this.hitPlane);

    // 2. Single-draw-call InstancedMesh of Architectural Resonator Pylons framing the sanctuary
    const pylonGeo = new THREE.BoxGeometry(0.16, 1.0, 0.16);
    pylonGeo.translate(0, 0.5, 0);
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.72,
    });

    const count = isMobile ? 64 : 104;
    this.pylons = new THREE.InstancedMesh(pylonGeo, pylonMat, count);
    this.pylons.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < count; i++) {
      const ring = i < count * 0.6 ? 15.8 : 21.2;
      const angle = ((i % (count * 0.6)) / (count * 0.6)) * Math.PI * 2 + (ring > 18 ? 0.12 : 0);
      const x = Math.cos(angle) * ring + Math.sin(angle * 3) * 0.9;
      const z = Math.sin(angle) * ring * 0.85 - 2.2;
      const baseH = ring > 18 ? 1.15 + (i % 5) * 0.32 : 0.55 + (i % 4) * 0.24;
      this.pylonBases.push({ x, z, baseH, phase: i * 0.35 });
    }
    this.group.add(this.pylons);
    this.group.add(this.beaconsGroup);

    // Default 2 ambient signal nodes
    this.nodes.push(
      { x: 5.5, z: 3.8, freq: 1.05, strength: 0.85, isAmbient: true },
      { x: -6.2, z: 3.4, freq: 0.92, strength: 0.8, isAmbient: true },
    );
  }

  public setMode(mode: SignalMode): void {
    this.targetMode = MODE_IDX[mode];
    this.triggerSurge();
  }

  public setAtmosphere(fogHex: string, accentHex: string): void {
    (this.material.uniforms.u_fogColor.value as THREE.Color).set(fogHex);
    (this.material.uniforms.u_accent.value as THREE.Color).set(accentHex);
  }

  public setProbePosition(x: number, z: number, active: boolean): void {
    (this.material.uniforms.u_probe.value as THREE.Vector3).set(x, active ? 1 : 0, z);
  }

  public emitPulse(x: number, z: number, strength = 1.1): void {
    this.pulses.push({ x, z, birth: this.time, strength });
    if (this.pulses.length > MAX_PULSES) {
      this.pulses.shift();
    }
  }

  public triggerSurge(): void {
    this.surgeActive = true;
    this.surgeProgress = 0.002;
    this.emitPulse(0, 0, 1.35);
  }

  public addUserBeacon(x: number, z: number): number {
    const userNodes = this.nodes.filter((n) => !n.isAmbient);
    if (userNodes.length >= 4) {
      const oldest = userNodes[0];
      if (oldest.beaconGroup) {
        this.beaconsGroup.remove(oldest.beaconGroup);
      }
      const idx = this.nodes.indexOf(oldest);
      if (idx >= 0) this.nodes.splice(idx, 1);
    }

    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(x, -0.25, z);

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd9f56c,
      transparent: true,
      opacity: 0.78,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.42, 32), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.06;

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xd9f56c,
      transparent: true,
      opacity: 0.42,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.06, 2.2, 12), beamMat);
    beam.position.y = 1.1;

    const cap = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshStandardMaterial({
        color: 0xf4654d,
        emissive: 0xf4654d,
        emissiveIntensity: 0.9,
        roughness: 0.25,
      }),
    );
    cap.position.y = 2.28;

    beaconGroup.add(ring, beam, cap);
    this.beaconsGroup.add(beaconGroup);

    this.nodes.push({
      x,
      z,
      freq: 0.95 + (Math.abs(x + z) % 0.6),
      strength: 1.0,
      isAmbient: false,
      beaconGroup,
    });
    this.emitPulse(x, z, 1.25);

    return this.getUserNodeCount();
  }

  public clearUserBeacons(): void {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i];
      if (!n.isAmbient) {
        if (n.beaconGroup) this.beaconsGroup.remove(n.beaconGroup);
        this.nodes.splice(i, 1);
      }
    }
    this.emitPulse(0, 0, 0.9);
  }

  public getUserNodeCount(): number {
    return this.nodes.filter((n) => !n.isAmbient).length;
  }

  public update(dt: number): void {
    this.time += dt;
    this.currentMode += (this.targetMode - this.currentMode) * Math.min(1, dt * 4.2);

    if (this.surgeActive) {
      this.surgeProgress += dt * 0.62;
      if (this.surgeProgress >= 1) {
        this.surgeActive = false;
        this.surgeProgress = 0;
      }
    }

    // Gently orbit the 2 ambient signal nodes
    if (this.nodes[0]?.isAmbient) {
      this.nodes[0].x = Math.cos(this.time * 0.22) * 6.5;
      this.nodes[0].z = Math.sin(this.time * 0.19) * 5.2 + 2.2;
    }
    if (this.nodes[1]?.isAmbient) {
      this.nodes[1].x = Math.sin(this.time * 0.25) * 6.8;
      this.nodes[1].z = Math.cos(this.time * 0.21) * 5.0 - 2.0;
    }

    this.pulses = this.pulses.filter((p) => this.time - p.birth < 3.6);

    const uNodes = this.material.uniforms.u_nodes.value as THREE.Vector4[];
    for (let i = 0; i < MAX_NODES; i++) {
      const nd = this.nodes[i];
      if (nd) {
        uNodes[i].set(nd.x, nd.freq, nd.z, nd.strength);
        if (nd.beaconGroup) {
          const cap = nd.beaconGroup.children[2];
          if (cap) cap.rotation.y += dt * 1.8;
          const ring = nd.beaconGroup.children[0];
          if (ring) {
            const s = 0.9 + Math.sin(this.time * 3.2 + i) * 0.18;
            ring.scale.setScalar(s);
          }
        }
      } else {
        uNodes[i].set(0, 1, 0, 0);
      }
    }

    const uPulses = this.material.uniforms.u_pulses.value as THREE.Vector4[];
    for (let i = 0; i < MAX_PULSES; i++) {
      const pl = this.pulses[i];
      if (pl) {
        uPulses[i].set(pl.x, Math.max(0, this.time - pl.birth), pl.z, pl.strength);
      } else {
        uPulses[i].set(0, 0, 0, 0);
      }
    }

    this.material.uniforms.u_time.value = this.time;
    this.material.uniforms.u_mode.value = this.currentMode;
    this.material.uniforms.u_surge.value = this.surgeProgress;

    // Update instanced perimeter resonator pylons
    const surgeRadius = this.surgeProgress * 24.0;
    for (let i = 0; i < this.pylonBases.length; i++) {
      const p = this.pylonBases[i];
      const dist = Math.hypot(p.x, p.z);
      const surgeHit = this.surgeActive
        ? Math.exp(-Math.abs(dist - surgeRadius) * 0.45) * (1 - this.surgeProgress)
        : 0;
      const waveH =
        p.baseH + Math.sin(this.time * 1.45 + p.phase) * 0.28 + surgeHit * 1.65;

      this.dummy.position.set(p.x, -0.5, p.z);
      this.dummy.scale.set(1, Math.max(0.3, waveH), 1);
      this.dummy.updateMatrix();
      this.pylons.setMatrixAt(i, this.dummy.matrix);

      // Subtle dark basalt → Iris / Acid Lime resonance shift
      if (surgeHit > 0.12) {
        this.tmpColor.setHex(0x28324a).lerp(new THREE.Color(0xd9f56c), Math.min(1, surgeHit * 1.3));
      } else {
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 1.2 + p.phase);
        this.tmpColor.setHex(0x1f2636).lerp(new THREE.Color(0x4c62cc), pulse * 0.32);
      }
      this.pylons.setColorAt(i, this.tmpColor);
    }
    this.pylons.instanceMatrix.needsUpdate = true;
    if (this.pylons.instanceColor) this.pylons.instanceColor.needsUpdate = true;
  }
}
