import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { MaterialLibrary } from '../MaterialLibrary';
import { PointerDynamics, SpringValue } from '../SpringPhysics';

/**
 * Generates an organically curved heavyweight archival cotton-paper folio
 * with natural spine curvature and delicately lifted corner.
 */
function createCurvedPaperGeometry(
  width: number,
  height: number,
  curlAmount: number,
  phase = 0,
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, 28, 36);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = x / (width * 0.5);
    const ny = y / (height * 0.5);

    const spineBend = Math.sin(nx * 1.55 + phase) * 0.052 * curlAmount;
    const cornerLift =
      Math.max(0, nx + 0.25) * Math.max(0, -ny + 0.25) * 0.16 * curlAmount;
    const drape = -Math.pow(ny, 2) * 0.036 * curlAmount;
    pos.setZ(i, spineBend + cornerLift + drape);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a faceted optical-glass triangular drafting prism bar
 * (replaces generic gray rectangle with unmistakable architectural crystal geometry).
 */
function createFacetedPrismGeometry(length: number, radius: number): THREE.BufferGeometry {
  const tri = new THREE.Shape();
  tri.moveTo(-radius, -radius * 0.58);
  tri.lineTo(radius, -radius * 0.58);
  tri.lineTo(0, radius * 1.05);
  tri.closePath();

  const geo = new THREE.ExtrudeGeometry(tri, {
    depth: length,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.022,
    bevelThickness: 0.022,
  });
  geo.center();
  geo.rotateY(Math.PI / 2);
  return geo;
}

/**
 * High-Key Architectural Daylight Print Atelier for 〈Asterism Write〉 (V2.0).
 * Replaces the generic desktop monitor mockup with an art-directed physical drafting sculpture:
 * - Floating ultra-thin machined brushed-aluminum gallery proof plate (no monitor stand!)
 * - 5 sweeping S-curved cotton-paper editorial folios with real procedural print typography
 * - Warm matte stone drafting block, calibrated aluminum scale ruler & faceted crystal prism
 */
export class AsterismSculpture {
  public readonly group = new THREE.Group();
  public readonly hitMesh: THREE.Mesh;

  private readonly rig = new THREE.Group();
  private readonly proofPlate = new THREE.Group();
  private readonly screenMat: THREE.MeshBasicMaterial;
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly textureLoader: THREE.TextureLoader;

  private readonly folios: {
    group: THREE.Group;
    baseRotY: number;
    baseRotZ: number;
    baseZ: number;
    spring: SpringValue;
  }[] = [];
  private readonly prismMesh: THREE.Mesh;
  private readonly shadowPlane: THREE.Mesh;

  constructor(materials: MaterialLibrary, textureLoader: THREE.TextureLoader) {
    this.textureLoader = textureLoader;
    this.group.name = 'AsterismSculpture';
    this.group.add(this.rig);

    // 1. Floating Ultra-Thin Brushed-Aluminum Architectural Proof Plate (zero computer stand!)
    this.proofPlate.position.set(0.32, 0.22, 0.05);
    this.proofPlate.rotation.set(-0.04, 0.06, 0.0);
    this.rig.add(this.proofPlate);

    const chassis = new THREE.Mesh(
      new RoundedBoxGeometry(2.96, 2.02, 0.052, 4, 0.018),
      materials.brushedAluminum,
    );
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    this.proofPlate.add(chassis);

    // Razor-thin anodized hairline inner frame
    const bezel = new THREE.Mesh(
      new RoundedBoxGeometry(2.86, 1.92, 0.058, 3, 0.01),
      materials.anodizedBasalt,
    );
    this.proofPlate.add(bezel);

    // Unaltered official Asterism Write UI capture (toneMapped: false preserves pure editorial crispness)
    const editorTex = this.loadTexture('/assets/projects/asterism-write/editor.webp');
    this.screenMat = new THREE.MeshBasicMaterial({ map: editorTex, toneMapped: false });
    const displayPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.86), this.screenMat);
    displayPlane.position.z = 0.032;
    this.proofPlate.add(displayPlane);

    // 4 subtle machined brass/aluminum gallery registration pins on the outer chamfer
    const pinGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.064, 14);
    pinGeo.rotateX(Math.PI / 2);
    const pinCoords: [number, number][] = [
      [-1.44, 0.96],
      [1.44, 0.96],
      [-1.44, -0.96],
      [1.44, -0.96],
    ];
    for (const [px, py] of pinCoords) {
      const pin = new THREE.Mesh(pinGeo, materials.machinedChrome);
      pin.position.set(px, py, 0.002);
      this.proofPlate.add(pin);
    }

    // 2. Five Cascading S-Curved Archival Cotton Folios (fanning diagonally left & behind plate)
    const paperStack = new THREE.Group();
    paperStack.position.set(-1.12, -0.14, 0.36);
    this.rig.add(paperStack);

    const folioConfigs: {
      mat: THREE.Material;
      pos: [number, number, number];
      rot: [number, number, number];
      size: [number, number];
      curl: number;
    }[] = [
      {
        mat: materials.archivalPaperGrid,
        pos: [-0.26, 0.14, -0.44],
        rot: [-0.06, 0.16, 0.11],
        size: [1.22, 1.66],
        curl: 0.72,
      },
      {
        mat: materials.archivalPaper,
        pos: [-0.14, 0.06, -0.22],
        rot: [-0.07, 0.22, 0.06],
        size: [1.22, 1.66],
        curl: 0.88,
      },
      {
        mat: materials.archivalPaperFormula,
        pos: [0.0, -0.02, 0.0],
        rot: [-0.08, 0.28, 0.01],
        size: [1.2, 1.62],
        curl: 1.05,
      },
      {
        mat: materials.archivalPaperManuscript,
        pos: [0.14, -0.08, 0.22],
        rot: [-0.09, 0.36, -0.04],
        size: [1.18, 1.58],
        curl: 1.22,
      },
      {
        mat: materials.archivalPaper,
        pos: [2.56, 0.28, -0.82],
        rot: [-0.04, -0.18, -0.14],
        size: [1.06, 1.48],
        curl: 0.9,
      },
    ];

    folioConfigs.forEach((cfg, i) => {
      const fGroup = new THREE.Group();
      fGroup.position.set(...cfg.pos);
      fGroup.rotation.set(...cfg.rot);

      const sheetGeo = createCurvedPaperGeometry(cfg.size[0], cfg.size[1], cfg.curl, i * 0.4);
      const sheet = new THREE.Mesh(sheetGeo, cfg.mat);
      sheet.castShadow = true;
      sheet.receiveShadow = true;
      fGroup.add(sheet);

      paperStack.add(fGroup);
      this.folios.push({
        group: fGroup,
        baseRotY: cfg.rot[1],
        baseRotZ: cfg.rot[2],
        baseZ: cfg.pos[2],
        spring: new SpringValue(0, { stiffness: 102, damping: 14, mass: 0.76 + i * 0.14 }),
      });
    });

    // 3. Architectural Matte Stone Pedestal Slab + Calibrated Aluminum Drafting Scale + Faceted Crystal Prism
    const stonePlinth = new THREE.Mesh(
      new RoundedBoxGeometry(2.65, 0.16, 0.86, 4, 0.02),
      materials.matteStudioStone,
    );
    stonePlinth.position.set(0.28, -1.16, 0.42);
    stonePlinth.receiveShadow = true;
    stonePlinth.castShadow = true;
    this.rig.add(stonePlinth);

    // Calibrated brushed-aluminum drafting ruler with incised index strip
    const scaleBar = new THREE.Mesh(
      new RoundedBoxGeometry(2.42, 0.042, 0.17, 3, 0.01),
      materials.brushedAluminum,
    );
    scaleBar.position.set(0.24, -1.06, 0.66);
    scaleBar.castShadow = true;
    scaleBar.receiveShadow = true;
    this.rig.add(scaleBar);

    // Precision Cobalt anodized calibration index bar embedded along the drafting scale
    const cobaltBar = new THREE.Mesh(
      new RoundedBoxGeometry(0.68, 0.014, 0.03, 2, 0.005),
      materials.anodizedIris,
    );
    cobaltBar.position.set(-0.56, -1.036, 0.66);
    this.rig.add(cobaltBar);

    // Sculpted Faceted Triangular Optical-Glass Paperweight Prism refracting daylight + cobalt!
    this.prismMesh = new THREE.Mesh(
      createFacetedPrismGeometry(1.06, 0.23),
      materials.crystalPrismGlass,
    );
    this.prismMesh.position.set(0.76, -0.92, 0.56);
    this.prismMesh.rotation.set(0.0, -0.26, 0.0);
    this.prismMesh.castShadow = true;
    this.rig.add(this.prismMesh);

    // Subtle cobalt magnetic disc inside the stone tray
    const cobaltMarker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.068, 0.042, 28),
      materials.anodizedIris,
    );
    cobaltMarker.position.set(-0.74, -1.06, 0.36);
    cobaltMarker.castShadow = true;
    this.rig.add(cobaltMarker);

    // Warm gallery studio soft contact shadow
    this.shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 3.8),
      new THREE.MeshBasicMaterial({
        map: materials.contactShadowTex,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    );
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -1.26;
    this.group.add(this.shadowPlane);

    this.hitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 2.9, 1.8),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.hitMesh.userData = { sculpture: 'asterism' };
    this.group.add(this.hitMesh);
  }

  private loadTexture(src: string): THREE.Texture {
    const cached = this.textures.get(src);
    if (cached) return cached;
    const tex = this.textureLoader.load(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.textures.set(src, tex);
    return tex;
  }

  public setScreen(src: string): void {
    const tex = this.loadTexture(src);
    this.screenMat.map = tex;
    this.screenMat.needsUpdate = true;
    this.triggerPageFan();
  }

  public triggerPageFan(): void {
    this.folios.forEach((f, idx) => {
      const dir = idx === 4 ? -1.4 : (idx - 1.5) * 1.35 + 0.45;
      f.spring.impulse(dir);
    });
  }

  public update(
    dt: number,
    elapsed: number,
    pointer: PointerDynamics,
    presence: number,
    offsetX: number,
    offsetY: number,
    baseScale: number,
    reducedMotion: boolean,
  ): void {
    this.group.visible = presence > 0.04;
    if (!this.group.visible) return;

    const inv = 1 - presence;
    this.group.position.set(offsetX, offsetY - inv * 2.2, -inv * 1.9);
    this.group.scale.setScalar(baseScale * (0.82 + presence * 0.18));

    const baseYRot = offsetX < 0 ? 0.22 : 0.08;
    this.rig.rotation.set(
      0.06 + pointer.heavyY.value * 0.11,
      baseYRot + pointer.heavyX.value * 0.22 - inv * 0.34,
      -pointer.heavyX.value * 0.025,
    );

    // Proof plate floats gently with crisp architectural stillness
    this.proofPlate.position.y = 0.22 + (reducedMotion ? 0 : Math.sin(elapsed * 0.95) * 0.032);

    // Curved paper folios fan gracefully with spring physics
    this.folios.forEach((folio, idx) => {
      const sign = idx === 4 ? -1 : 1;
      const targetFan =
        sign * ((idx - 1.5) * (0.065 + pointer.energy.value * 0.14) + pointer.midX.value * 0.06);
      folio.spring.setTarget(targetFan);
      const val = reducedMotion ? 0 : folio.spring.step(dt);
      const breathe = reducedMotion ? 0 : Math.sin(elapsed * 1.0 + idx * 0.72) * 0.022;

      folio.group.rotation.y = folio.baseRotY + val + breathe;
      folio.group.rotation.z = folio.baseRotZ + val * 0.16;
      folio.group.position.z = folio.baseZ + val * 0.18;
    });

    this.prismMesh.rotation.y = -0.26 + pointer.lightX.value * 0.22;
    this.prismMesh.rotation.z = pointer.lightY.value * 0.06;
    (this.shadowPlane.material as THREE.MeshBasicMaterial).opacity = 0.22 * presence;
  }
}
