import * as THREE from 'three';

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

function generateBrushedHeight(size: number): Float32Array {
  const rand = mulberry32(4201);
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const rowBase = (rand() - 0.5) * 0.45;
    const fineFreq = 0.08 + rand() * 0.14;
    const phase = rand() * Math.PI * 2;
    for (let x = 0; x < size; x++) {
      const micro = (rand() - 0.5) * 0.15;
      const streak = Math.sin(x * fineFreq + phase) * 0.2;
      height[y * size + x] = Math.max(0, Math.min(1, 0.5 + rowBase + streak + micro));
    }
  }
  return height;
}

function generateMicroGrainHeight(size: number, seed: number): Float32Array {
  const rand = mulberry32(seed);
  const raw = new Float32Array(size * size);
  for (let i = 0; i < raw.length; i++) raw[i] = rand();
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

/**
 * Generates an editorial cotton-paper print texture with fine Swiss grid registration marks,
 * delicate ruled lines, and subtle paper tooth for Asterism Write's curved 3D folios.
 */
function createEditorialFolioTexture(variant: 'grid' | 'manuscript' | 'formula'): THREE.CanvasTexture {
  const w = 512;
  const h = 680;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Warm heavyweight cotton paper stock
  ctx.fillStyle = '#FAF8F3';
  ctx.fillRect(0, 0, w, h);

  // Subtle paper fiber mottling
  const rand = mulberry32(variant === 'grid' ? 771 : variant === 'manuscript' ? 882 : 993);
  for (let i = 0; i < 1600; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const alpha = 0.015 + rand() * 0.025;
    ctx.fillStyle = rand() > 0.5 ? `rgba(110,104,92,${alpha})` : `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, 2 + rand() * 4, 1);
  }

  // Fine margin frame & crop marks
  ctx.strokeStyle = 'rgba(23, 28, 40, 0.1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(42, 46, w - 84, h - 92);

  // Cobalt editorial index header
  ctx.fillStyle = '#405CC8';
  ctx.fillRect(58, 70, 68, 4);
  ctx.fillStyle = 'rgba(23, 28, 40, 0.42)';
  ctx.font = '500 13px monospace';
  ctx.fillText(
    variant === 'manuscript' ? 'ASTW · 01' : variant === 'formula' ? 'PDF · NOTE' : 'GRID · A4',
    w - 134,
    78,
  );

  if (variant === 'manuscript') {
    // Crisp editorial document columns + hairline rules
    ctx.fillStyle = '#1B2232';
    ctx.fillRect(58, 108, 220, 11);
    ctx.fillStyle = 'rgba(27, 34, 50, 0.18)';
    for (let i = 0; i < 11; i++) {
      const y = 148 + i * 24;
      const lineW = i === 4 || i === 10 ? 240 : 376;
      ctx.fillRect(58, y, lineW, 3);
    }
    // Delicate table diagram at bottom half
    ctx.strokeStyle = 'rgba(64, 92, 200, 0.25)';
    ctx.strokeRect(58, 438, 394, 140);
    ctx.beginPath();
    ctx.moveTo(58, 476);
    ctx.lineTo(452, 476);
    ctx.moveTo(190, 438);
    ctx.lineTo(190, 578);
    ctx.moveTo(322, 438);
    ctx.lineTo(322, 578);
    ctx.stroke();
  } else if (variant === 'formula') {
    // Architectural margin notes + cobalt highlighter stroke + equation frame
    ctx.fillStyle = 'rgba(64, 92, 200, 0.14)';
    ctx.fillRect(58, 134, 340, 34);
    ctx.fillStyle = '#405CC8';
    ctx.fillRect(58, 134, 4, 34);

    ctx.strokeStyle = 'rgba(23, 28, 40, 0.12)';
    for (let row = 0; row < 12; row++) {
      const y = 212 + row * 30;
      ctx.beginPath();
      ctx.moveTo(58, y);
      ctx.lineTo(w - 58, y);
      ctx.stroke();
    }
    // Delicate cobalt pen curve (echoing PDF annotation)
    ctx.strokeStyle = 'rgba(64, 92, 200, 0.65)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(88, 354);
    ctx.bezierCurveTo(160, 312, 240, 408, 368, 326);
    ctx.stroke();
  } else {
    // Precision drafting millimeter dot grid
    ctx.fillStyle = 'rgba(23, 28, 40, 0.15)';
    for (let gy = 110; gy < h - 70; gy += 28) {
      for (let gx = 64; gx < w - 58; gx += 28) {
        ctx.fillRect(gx, gy, 1.5, 1.5);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createSoftContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(5, 8, 14, 0.65)');
  grad.addColorStop(0.42, 'rgba(5, 8, 14, 0.28)');
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
  public readonly machinedLime: THREE.MeshPhysicalMaterial;
  public readonly machinedChrome: THREE.MeshPhysicalMaterial;
  public readonly opticalGlass: THREE.MeshPhysicalMaterial;
  public readonly crystalPrismGlass: THREE.MeshPhysicalMaterial;
  public readonly porcelainCeramic: THREE.MeshPhysicalMaterial;
  public readonly matteStudioStone: THREE.MeshPhysicalMaterial;
  public readonly archivalPaper: THREE.MeshStandardMaterial;
  public readonly archivalPaperManuscript: THREE.MeshStandardMaterial;
  public readonly archivalPaperFormula: THREE.MeshStandardMaterial;
  public readonly archivalPaperGrid: THREE.MeshStandardMaterial;
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

    const brushedNormal = buildNormalTextureFromHeight(brushedH, texSize, 1.45, [2, 2]);
    const brushedRough = buildGrayTexture(brushedH, texSize, 0.14, 0.3, [2, 2]);

    const beadNormal = buildNormalTextureFromHeight(grainH, texSize, 0.95, [3, 3]);
    const beadRough = buildGrayTexture(grainH, texSize, 0.2, 0.36, [3, 3]);

    const paperBump = buildGrayTexture(paperH, texSize, 0.2, 0.85, [2, 2]);
    const paperRough = buildGrayTexture(paperH, texSize, 0.76, 0.9, [2, 2]);

    const texManuscript = createEditorialFolioTexture('manuscript');
    const texFormula = createEditorialFolioTexture('formula');
    const texGrid = createEditorialFolioTexture('grid');

    this.contactShadowTex = createSoftContactShadowTexture();

    this.textures.push(
      brushedNormal,
      brushedRough,
      beadNormal,
      beadRough,
      paperBump,
      paperRough,
      texManuscript,
      texFormula,
      texGrid,
      this.contactShadowTex,
    );

    this.brushedAluminum = new THREE.MeshPhysicalMaterial({
      color: 0xe3e8f1,
      metalness: 0.95,
      roughness: 1.0,
      roughnessMap: brushedRough,
      normalMap: brushedNormal,
      normalScale: new THREE.Vector2(0.34, 0.34),
      anisotropy: 0.8,
      clearcoat: 0.28,
      clearcoatRoughness: 0.22,
    });

    // Satin gunmetal titanium (calibrated so beveled edges catch crisp warm key & rim highlights)
    this.anodizedBasalt = new THREE.MeshPhysicalMaterial({
      color: 0x2b3344,
      metalness: 0.88,
      roughness: 1.0,
      roughnessMap: beadRough,
      normalMap: beadNormal,
      normalScale: new THREE.Vector2(0.24, 0.24),
      clearcoat: 0.45,
      clearcoatRoughness: 0.22,
    });

    this.anodizedIris = new THREE.MeshPhysicalMaterial({
      color: 0x546eff,
      metalness: 0.88,
      roughness: 1.0,
      roughnessMap: brushedRough,
      normalMap: brushedNormal,
      normalScale: new THREE.Vector2(0.28, 0.28),
      anisotropy: 0.72,
      clearcoat: 0.65,
      clearcoatRoughness: 0.14,
    });

    this.machinedVermilion = new THREE.MeshPhysicalMaterial({
      color: 0xf4654d,
      metalness: 0.74,
      roughness: 1.0,
      roughnessMap: beadRough,
      normalMap: beadNormal,
      normalScale: new THREE.Vector2(0.2, 0.2),
      clearcoat: 0.7,
      clearcoatRoughness: 0.15,
    });

    this.machinedLime = new THREE.MeshPhysicalMaterial({
      color: 0xd9f56c,
      metalness: 0.58,
      roughness: 0.24,
      clearcoat: 0.72,
      clearcoatRoughness: 0.14,
    });

    this.machinedChrome = new THREE.MeshPhysicalMaterial({
      color: 0xf6f8fd,
      metalness: 0.99,
      roughness: 0.06,
      normalMap: brushedNormal,
      normalScale: new THREE.Vector2(0.06, 0.06),
      clearcoat: 0.9,
      clearcoatRoughness: 0.04,
    });

    // High-clarity crown glass tuned for dark-studio luminous caustic refraction
    this.opticalGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.0,
      roughness: 0.03,
      transmission: 0.95,
      ior: 1.54,
      thickness: 2.1,
      attenuationColor: new THREE.Color(0xcde0ff),
      attenuationDistance: 3.4,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      specularIntensity: 1.0,
      envMapIntensity: 1.75,
    });

    // High-contrast daylight crystal prism glass with crisp cobalt refraction tint
    this.crystalPrismGlass = new THREE.MeshPhysicalMaterial({
      color: 0xf2f6ff,
      metalness: 0.02,
      roughness: 0.02,
      transmission: 0.9,
      ior: 1.62,
      thickness: 1.4,
      attenuationColor: new THREE.Color(0x7c97ff),
      attenuationDistance: 1.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      specularIntensity: 1.0,
      envMapIntensity: 1.85,
    });

    this.porcelainCeramic = new THREE.MeshPhysicalMaterial({
      color: 0xf2f0ea,
      metalness: 0.04,
      roughness: 1.0,
      roughnessMap: beadRough,
      normalMap: beadNormal,
      normalScale: new THREE.Vector2(0.14, 0.14),
      clearcoat: 0.55,
      clearcoatRoughness: 0.18,
    });

    this.matteStudioStone = new THREE.MeshPhysicalMaterial({
      color: 0xdedad0,
      metalness: 0.0,
      roughness: 1.0,
      roughnessMap: paperRough,
      normalMap: beadNormal,
      normalScale: new THREE.Vector2(0.28, 0.28),
      clearcoat: 0.08,
    });

    this.archivalPaper = new THREE.MeshStandardMaterial({
      color: 0xfaf8f3,
      metalness: 0.0,
      roughness: 1.0,
      roughnessMap: paperRough,
      bumpMap: paperBump,
      bumpScale: 0.008,
      side: THREE.DoubleSide,
    });

    this.archivalPaperManuscript = new THREE.MeshStandardMaterial({
      map: texManuscript,
      metalness: 0.0,
      roughness: 1.0,
      roughnessMap: paperRough,
      bumpMap: paperBump,
      bumpScale: 0.007,
      side: THREE.DoubleSide,
    });

    this.archivalPaperFormula = new THREE.MeshStandardMaterial({
      map: texFormula,
      metalness: 0.0,
      roughness: 1.0,
      roughnessMap: paperRough,
      bumpMap: paperBump,
      bumpScale: 0.007,
      side: THREE.DoubleSide,
    });

    this.archivalPaperGrid = new THREE.MeshStandardMaterial({
      map: texGrid,
      metalness: 0.0,
      roughness: 1.0,
      roughnessMap: paperRough,
      bumpMap: paperBump,
      bumpScale: 0.007,
      side: THREE.DoubleSide,
    });

    this.lacqueredIndigo = new THREE.MeshPhysicalMaterial({
      color: 0x241a5e,
      metalness: 0.16,
      roughness: 0.2,
      normalMap: beadNormal,
      normalScale: new THREE.Vector2(0.05, 0.05),
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    });

    this.lacqueredYellow = new THREE.MeshPhysicalMaterial({
      color: 0xffd23f,
      metalness: 0.08,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    this.lacqueredPink = new THREE.MeshPhysicalMaterial({
      color: 0xff77b3,
      metalness: 0.06,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    });

    this.lacqueredMint = new THREE.MeshPhysicalMaterial({
      color: 0x5ef2c8,
      metalness: 0.08,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    });

    this.materials.push(
      this.brushedAluminum,
      this.anodizedBasalt,
      this.anodizedIris,
      this.machinedVermilion,
      this.machinedLime,
      this.machinedChrome,
      this.opticalGlass,
      this.crystalPrismGlass,
      this.porcelainCeramic,
      this.matteStudioStone,
      this.archivalPaper,
      this.archivalPaperManuscript,
      this.archivalPaperFormula,
      this.archivalPaperGrid,
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
