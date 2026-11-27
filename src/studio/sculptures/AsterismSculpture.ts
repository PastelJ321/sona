import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { MaterialLibrary } from '../MaterialLibrary';
import { PointerDynamics, SpringValue } from '../SpringPhysics';

/**
 * Generates an organic curved heavyweight paper sheet with subtle S-wave drape
 * and gently lifted corner (replaces flat white boxes with believable paper curvature).
 */
function createCurvedPaperGeometry(
  width: number,
  height: number,
  curlAmount: number,
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, 28, 36);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = x / (width * 0.5); // -1..1
    const ny = y / (height * 0.5); // -1..1

    // Gentle organic paper wave + lifted top-right corner
    const spineBend = Math.sin(nx * 1.45) * 0.045 * curlAmount;
    const cornerLift =
      Math.max(0, nx + 0.3) * Math.max(0, -ny + 0.2) * 0.14 * curlAmount;
    const drape = -Math.pow(ny, 2) * 0.032 * curlAmount;
    pos.setZ(i, spineBend + cornerLift + drape);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Architectural Daylight Studio Composition for 〈Asterism Write〉.
 * Pairs a brushed-aluminum precision studio display (showing unaltered official editor/PDF UI)
 * with 3 organically curved cotton-paper folios that fan open with spring physics
 * and a refractive optical-glass paperweight prism.
 */
export class AsterismSculpture {
  public readonly group = new THREE.Group();
  public readonly hitMesh: THREE.Mesh;

  private readonly rig = new THREE.Group();
  private readonly screenMat: THREE.MeshBasicMaterial;
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly textureLoader: THREE.TextureLoader;

  private readonly folios: { group: THREE.Group; baseAngle: number; baseZ: number; spring: SpringValue }[] = [];
  private readonly prismMesh: THREE.Mesh;
  private readonly shadowPlane: THREE.Mesh;

  constructor(materials: MaterialLibrary, textureLoader: THREE.TextureLoader) {
    this.textureLoader = textureLoader;
    this.group.name = 'AsterismSculpture';
    this.group.add(this.rig);

    // 1. Machined Brushed-Aluminum Architectural Display Frame
    const frameGroup = new THREE.Group();
    frameGroup.position.set(0.28, 0.24, -0.18);
    this.rig.add(frameGroup);

    const chassis = new THREE.Mesh(
      new RoundedBoxGeometry(2.86, 1.94, 0.075, 4, 0.025),
      materials.brushedAluminum,
    );
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    frameGroup.add(chassis);

    const innerBezel = new THREE.Mesh(
      new RoundedBoxGeometry(2.74, 1.82, 0.082, 3, 0.012),
      materials.anodizedBasalt,
    );
    frameGroup.add(innerBezel);

    // Unaltered real Asterism Write UI capture (toneMapped: false preserves crisp white fidelity)
    const editorTex = this.loadTexture('/assets/projects/asterism-write/editor.webp');
    this.screenMat = new THREE.MeshBasicMaterial({ map: editorTex, toneMapped: false });
    const displayPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.68, 1.76), this.screenMat);
    displayPlane.position.z = 0.044;
    frameGroup.add(displayPlane);

    // Minimalist L-profile anodized aluminum easel stand
    const standNeck = new THREE.Mesh(
      new RoundedBoxGeometry(0.46, 0.62, 0.055, 3, 0.015),
      materials.brushedAluminum,
    );
    standNeck.position.set(0, -1.12, -0.14);
    standNeck.rotation.x = 0.16;
    standNeck.castShadow = true;

    const standFoot = new THREE.Mesh(
      new RoundedBoxGeometry(1.18, 0.042, 0.66, 3, 0.015),
      materials.brushedAluminum,
    );
    standFoot.position.set(0, -1.36, -0.02);
    standFoot.castShadow = true;
    standFoot.receiveShadow = true;
    frameGroup.add(standNeck, standFoot);

    // 2. Three Organically Curved Archival Cotton Paper Folios (Left Foreground)
    const paperStack = new THREE.Group();
    paperStack.position.set(-1.26, -0.22, 0.42);
    this.rig.add(paperStack);

    const cobaltLineMat = new THREE.MeshBasicMaterial({ color: 0x405cc8 });
    const inkLineMat = new THREE.MeshBasicMaterial({ color: 0x8b95a8 });

    for (let i = 0; i < 3; i++) {
      const fGroup = new THREE.Group();
      const baseAngle = 0.24 + (i - 1) * 0.1;
      const baseZ = (i - 1) * 0.11;
      fGroup.position.set(i * 0.06, -i * 0.04, baseZ);
      fGroup.rotation.set(-0.08, baseAngle, 0.02 * (i - 1));

      const sheetGeo = createCurvedPaperGeometry(1.16, 1.58, 0.85 + i * 0.25);
      const sheet = new THREE.Mesh(sheetGeo, materials.archivalPaper);
      sheet.castShadow = true;
      sheet.receiveShadow = true;
      fGroup.add(sheet);

      // Subtle ruled typography header + line bars on frontmost curved sheet
      if (i === 2) {
        const heading = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.045), cobaltLineMat);
        heading.position.set(-0.18, 0.48, 0.025);
        fGroup.add(heading);
        for (let ln = 0; ln < 5; ln++) {
          const w = ln === 4 ? 0.48 : 0.78;
          const line = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.014), inkLineMat);
          line.position.set(-0.46 + w * 0.5, 0.3 - ln * 0.12, 0.02);
          fGroup.add(line);
        }
      }

      paperStack.add(fGroup);
      this.folios.push({
        group: fGroup,
        baseAngle,
        baseZ,
        spring: new SpringValue(0, { stiffness: 95, damping: 14, mass: 0.8 + i * 0.2 }),
      });
    }

    // 3. Refractive Optical Crown-Glass Paperweight Bar & Calibrated Silver Scale
    const scaleBar = new THREE.Mesh(
      new RoundedBoxGeometry(2.3, 0.042, 0.16, 3, 0.012),
      materials.brushedAluminum,
    );
    scaleBar.position.set(0.32, -1.08, 0.68);
    scaleBar.castShadow = true;
    scaleBar.receiveShadow = true;
    this.rig.add(scaleBar);

    // Optical crown-glass prism bar refracting daylight & cobalt highlights
    this.prismMesh = new THREE.Mesh(
      new RoundedBoxGeometry(0.92, 0.24, 0.26, 4, 0.045),
      materials.opticalGlass,
    );
    this.prismMesh.position.set(0.86, -0.94, 0.72);
    this.prismMesh.rotation.y = -0.22;
    this.prismMesh.castShadow = true;
    this.rig.add(this.prismMesh);

    // Subtle anodized cobalt marker bead inside the drafting setup
    const cobaltMarker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.05, 24),
      materials.anodizedIris,
    );
    cobaltMarker.position.set(-0.62, -1.04, 0.68);
    this.rig.add(cobaltMarker);

    // Soft daylight contact shadow plane
    this.shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 3.6),
      new THREE.MeshBasicMaterial({
        map: materials.contactShadowTex,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      }),
    );
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -1.38;
    this.group.add(this.shadowPlane);

    this.hitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 2.8, 1.8),
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
      f.spring.impulse((idx - 1) * 1.65 + 0.5);
    });
  }

  public update(
    dt: number,
    elapsed: number,
    pointer: PointerDynamics,
    presence: number,
    offsetX: number,
    offsetY: number,
    reducedMotion: boolean,
  ): void {
    this.group.visible = presence > 0.04;
    if (!this.group.visible) return;

    const inv = 1 - presence;
    this.group.position.set(offsetX, offsetY - inv * 2.2, -inv * 2.0);
    this.group.scale.setScalar(0.8 + presence * 0.2);

    // Clean editorial three-quarter angle facing the right-hand copy column
    const baseYRot = offsetX < 0 ? 0.26 : 0.12;
    this.rig.rotation.set(
      0.06 + pointer.heavyY.value * 0.11,
      baseYRot + pointer.heavyX.value * 0.22 - inv * 0.35,
      -pointer.heavyX.value * 0.025,
    );

    // Curved paper folios gently fan open with pointer movement & spring damping
    this.folios.forEach((folio, idx) => {
      const targetFan =
        (idx - 1) * (0.08 + pointer.energy.value * 0.14) +
        pointer.midX.value * 0.08 * (idx + 1) * 0.4;
      folio.spring.setTarget(targetFan);
      const val = reducedMotion ? 0 : folio.spring.step(dt);
      const breathe = reducedMotion ? 0 : Math.sin(elapsed * 1.05 + idx * 0.8) * 0.02;

      folio.group.rotation.y = folio.baseAngle + val + breathe;
      folio.group.position.z = folio.baseZ + val * 0.22;
    });

    this.prismMesh.rotation.y = -0.22 + pointer.lightX.value * 0.14;
    (this.shadowPlane.material as THREE.MeshBasicMaterial).opacity = 0.24 * presence;
  }
}
