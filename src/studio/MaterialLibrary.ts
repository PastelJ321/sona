import * as THREE from 'three';

/**
 * Deterministic PRNG so procedural surface micro-textures are reproducible & artifact-free.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Converts a 2D height grid into a tangent-space RGB NormalMap CanvasTexture.
 */
function buildNormalTextureFromHeight(
  height: Float32Array,
  size: number,
  strength: number,
  repeat: [number, number] = [1, 1],
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  const sample = (x: number, y: number) => {
    const wx = ((x % size) + size) % size;
    const wy = ((y % size) + size) % size;
    return height[wy * size + wx];
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (sample(x + 1, y) - sample(x - 1, y)) * strength;
      const dy = (sample(x, y + 1) - sample(x, y - 1)) * strength;
      const nx = -dx;
      const ny = -dy;
      const nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);

      const idx = (y * size + x) * 4;
      data[idx] = Math.round((nx * invLen * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.round((ny * invLen * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.round((nz * invLen * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 4;
  return tex;
}

function buildGrayTexture(
  values: Float32Array,
  size: number,
  minVal: number,
  maxVal: number,
  repeat: [number, number] = [1, 1],
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  for (let i = 0; i < size * size; i++) {
    const v = Math.round((minVal + values[i] * (maxVal - minVal)) * 255);
    const idx = i * 4;
    data[idx] = v;
    data[idx + 1] = v;
    data[idx + 2] = v;
    data[idx + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 4;
  return tex;
}

/**
 * Generates directional brushed metal height map (fine anisotropic machining streaks).
 */
function generateBrushedHeight(size: number): Float32Array {
  const rand = mulberry32(4201);
  const height = new Float32Array(size * size);

  // Horizontal brushed streaks with subtle vertical drift
  for (let y = 0; y < size; y++) {
    const rowBase = (rand() - 0.5) * 0.45;
    const fineFreq = 0.08 + rand() * 0.14;
    const phase = rand() * Math.PI * 2;
    for (let x = 0; x < size; x++) {
      const micro = (rand() - 0.5) * 0.16;
      const streak = Math.sin(x * fineFreq + phase) * 0.18;
      height[y * size + x] = Math.max(0, Math.min(1, 0.5 + rowBase + streak + micro));
    }
  }
  return height;
}

/**
 * Generates fine bead-blasted ceramic / cotton paper micro-grain height field.
 */
function generateMicroGrainHeight(size: number, seed: number): Float32Array {
  const rand = mulberry32(seed);
  const raw = new Float32Array(size * size);
  for (let i = 0; i < raw.length; i++) {
    raw[i] = rand();
  }
  // Single gentle 3x3 box blur so normal gradients feel tactile rather than noisy pixels
  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const wy = (y + dy + size) % size;
        for (let dx = -1; dx <= 1; dx++) {
          const wx = (x + dx + size) % size;
          sum += raw[wy * size + wx];
        }
      }
      out[y * size + x] = sum / 9;
    }
  }
  return out;
}

export function createSoftContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 12, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(5, 8, 14, 0.58)');
  grad.addColorStop(0.45, 'rgba(5, 8, 14, 0.24)');
  grad.addColorStop(1, 'rgba(5, 8, 14, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class MaterialLibrary {
  private readonly textures: THREE.Texture[] = [];
  private readonly materials: THREE.Material[] = [];

  public readonly brushedAluminum: THREE.MeshPhysicalMaterial;
  public readonly anodizedBasalt: THREE.MeshPhysicalMaterial;
  public readonly anodizedIris: THREE.MeshPhysicalMaterial;
  public readonly machinedVermilion: THREE.MeshPhysicalMaterial;
  public readonly machinedChrome: THREE.MeshPhysicalMaterial;
  public readonly opticalGlass: THREE.MeshPhysicalMaterial;
  public readonly frostedGlass: THREE.MeshPhysicalMaterial;
  public readonly porcelainCeramic: THREE.MeshPhysicalMaterial;
  public readonly archivalPaper: THREE.MeshStandardMaterial;
  public readonly lacqueredIndigo: THREE.MeshPhysicalMaterial;
  public readonly lacqueredYellow: THREE.MeshPhysicalMaterial;
  public readonly lacqueredPink: THREE.MeshPhysicalMaterial;
  public readonly lacqueredMint: THREE.MeshPhysicalMaterial;
  public readonly contactShadowTex: THREE.CanvasTexture;

  constructor() {
    const texSize = 256;
    const brushedH = generateBrushedHeight(texSize);
    const grainH = generateMicroGrainHeight(texSize, 9103);
    const paperH = generateMicroGrainHeight(texSize, 3371);

    const brushedNormal = buildNormalTextureFromHeight(brushedH, texSize, 1.35, [2, 2]);
    const brushedRough = buildGrayTexture(brushedH, texSize, 0.16, 0.34, [2, 2]);

    const beadNormal = buildNormalTextureFromHeight(grainH, texSize, 0.9, [3, 3]);
    const beadRough = buildGrayTexture(grainH, texSize, 0.26, 0.44, [3, 3]);

    const paperBump = buildGrayTexture(paperH, texSize, 0.2, 0.85, [2, 2]);
    const paperRough = buildGrayTexture(paperH, texSize, 0.72, 0.88, [2, 2]);

    this.contactShadowTex = createSoftContactShadowTexture();

    this.textures.push(
      brushedNormal,
      brushedRough,
      beadNormal,
      beadRough,
      paperBump,
      paperRough,
      this.contactShadowTex,
    );

    this.brushedAluminum = new THREE.MeshPhysicalMaterial({
      color: 0xd9dfe9,
      metalness: 0.94,
      roughness: 1.0,
      roughnessMap: brushedRough,
      normalMap: brushedNormal,
      normalScale: new THREE.Vector2(0.32, 0.32),
      anisotropy: 0.72,
      clearcoat: 0.22,
      clearcoatRoughness: 0.28,
    });

    this.anodizedBasalt = new THREE.MeshPhysicalMaterial({
      color: 0x1b202b,
      metalness: 0.84,
      roughness: 1.0,
      roughnessMap: beadRough,
      normalMap: beadNormal,
      normalScale: new THREE.Vector2(0.24, 0.24),
      clearcoat: 0.32,
      clearcoatRoughness: 0.3,
    });

    this.anodizedIris = new THREE.MeshPhysicalMaterial({
      color: 0x4c67f5,
      metalness: 0.88,
      roughness: 1.0,
      roughnessMap: brushedRough,
      normalMap: brushedNormal,
      normalScale: new THREE.Vector2(0.28, 0.28),
      anisotropy: 0.65,
      clearcoat: 0.55,
      clearcoatRoughness: 0.16,
    });

    this.machinedVermilion = new THREE.MeshPhysicalMaterial({
      color: 0xee5d45,
      metalness: 0.72,
      roughness: 1.0,
      roughnessMap: beadRough,
      normalMap: beadNormal,
      normalScale: new THREE.Vector2(0.2, 0.2),
      clearcoat: 0.6,
      clearcoatRoughness: 0.18,
    });

    this.machinedChrome = new THREE.MeshPhysicalMaterial({
      color: 0xf4f7fc,
      metalness: 0.98,
      roughness: 0.08,
      normalMap: brushedNormal,
      normalScale: new THREE.Vector2(0.08, 0.08),
      clearcoat: 0.8,
      clearcoatRoughness: 0.06,
    });

    // Genuine refractive optical crown glass (NOT opacity: 0.4!)
    this.opticalGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.04,
      transmission: 0.93,
      ior: 1.52,
      thickness: 1.85,
      attenuationColor: new THREE.Color(0xcbd9ff),
      attenuationDistance: 4.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.45,
    });

    this.frostedGlass = new THREE.MeshPhysicalMaterial({
      color: 0xf3f6ff,
      metalness: 0.0,
      roughness: 0.24,
      transmission: 0.78,
      ior: 1.48,
      thickness: 0.85,
      attenuationColor: new THREE.Color(0xdbe5ff),
      attenuationDistance: 3.0,
      clearcoat: 0.65,
      clearcoatRoughness: 0.14,
    });

    this.porcelainCeramic = new THREE.MeshPhysicalMaterial({
      color: 0xf0eee8,
      metalness: 0.04,
      roughness: 1.0,
      roughnessMap: beadRough,
      normalMap: beadNormal,
      normalScale: new THREE.Vector2(0.14, 0.14),
      clearcoat: 0.55,
      clearcoatRoughness: 0.18,
    });

    this.archivalPaper = new THREE.MeshStandardMaterial({
      color: 0xfaf9f5,
      metalness: 0.0,
      roughness: 1.0,
      roughnessMap: paperRough,
      bumpMap: paperBump,
      bumpScale: 0.008,
      side: THREE.DoubleSide,
    });

    this.lacqueredIndigo = new THREE.MeshPhysicalMaterial({
      color: 0x221954,
      metalness: 0.14,
      roughness: 0.22,
      normalMap: beadNormal,
      normalScale: new THREE.Vector2(0.06, 0.06),
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    this.lacqueredYellow = new THREE.MeshPhysicalMaterial({
      color: 0xffd13b,
      metalness: 0.08,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
    });

    this.lacqueredPink = new THREE.MeshPhysicalMaterial({
      color: 0xff77b3,
      metalness: 0.06,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    this.lacqueredMint = new THREE.MeshPhysicalMaterial({
      color: 0x4deac0,
      metalness: 0.08,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
    });

    this.materials.push(
      this.brushedAluminum,
      this.anodizedBasalt,
      this.anodizedIris,
      this.machinedVermilion,
      this.machinedChrome,
      this.opticalGlass,
      this.frostedGlass,
      this.porcelainCeramic,
      this.archivalPaper,
      this.lacqueredIndigo,
      this.lacqueredYellow,
      this.lacqueredPink,
      this.lacqueredMint,
    );
  }

  public dispose(): void {
    for (const m of this.materials) m.dispose();
    for (const t of this.textures) t.dispose();
  }
}
