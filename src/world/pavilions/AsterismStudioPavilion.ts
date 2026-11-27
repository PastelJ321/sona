import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { PROJECTS } from '../../data/projects';
import { WORLD_ZONES } from '../zoneRegistry';

export class AsterismStudioPavilion {
  public readonly group = new THREE.Group();

  private readonly screenMat: THREE.MeshBasicMaterial;
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly textureLoader: THREE.TextureLoader;
  private readonly paperSheets: THREE.Mesh[] = [];
  private readonly iconPlinth: THREE.Mesh;
  private readonly spotLight: THREE.SpotLight;

  private unfoldProgress = 0;
  private activeFocus = false;

  constructor(textureLoader: THREE.TextureLoader) {
    this.textureLoader = textureLoader;
    this.group.name = 'AsterismStudioPavilion';

    const cfg = WORLD_ZONES.asterism;
    this.group.position.set(cfg.center[0], cfg.elevation, cfg.center[2]);
    this.group.rotation.y = -Math.PI * 0.15;

    // Materials: Architectural Porcelain, Brushed Titanium Aluminum, Cobalt Glass
    const terracePorcelain = new THREE.MeshStandardMaterial({
      color: 0xe9edf5,
      roughness: 0.34,
      metalness: 0.08,
    });
    const darkSlateTrim = new THREE.MeshStandardMaterial({
      color: 0x1b2232,
      roughness: 0.38,
      metalness: 0.65,
    });
    const brushedMetal = new THREE.MeshPhysicalMaterial({
      color: 0xcad4e4,
      roughness: 0.22,
      metalness: 0.88,
      clearcoat: 0.45,
    });
    const cobaltMat = new THREE.MeshStandardMaterial({
      color: 0x405cc8,
      emissive: 0x2f48ad,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.3,
    });
    const frostedGlass = new THREE.MeshPhysicalMaterial({
      color: 0xdbe6ff,
      roughness: 0.18,
      metalness: 0.05,
      transparent: true,
      opacity: 0.42,
      clearcoat: 0.9,
    });

    // 1. Raised Stepped Porcelain & Brushed-Metal Studio Terrace
    const basePlinth = new THREE.Mesh(
      new RoundedBoxGeometry(7.6, 0.56, 6.0, 4, 0.12),
      darkSlateTrim,
    );
    basePlinth.position.y = -0.34;
    basePlinth.receiveShadow = true;
    basePlinth.castShadow = true;

    const topDeck = new THREE.Mesh(
      new RoundedBoxGeometry(7.2, 0.14, 5.6, 3, 0.05),
      terracePorcelain,
    );
    topDeck.position.y = -0.02;
    topDeck.receiveShadow = true;

    const cobaltEdge = new THREE.Mesh(
      new THREE.BoxGeometry(7.3, 0.04, 5.7),
      new THREE.MeshBasicMaterial({ color: 0x5b75ff }),
    );
    cobaltEdge.position.y = -0.09;

    this.group.add(basePlinth, topDeck, cobaltEdge);

    // 2. Hero Architectural Studio Display Easel (displays real unmodified editor/properties/pdf UI)
    const displayGroup = new THREE.Group();
    displayGroup.position.set(0.15, 0, -0.45);
    this.group.add(displayGroup);

    // Brushed aluminum vertical frame rails
    const railGeo = new THREE.BoxGeometry(0.1, 3.25, 0.14);
    const railL = new THREE.Mesh(railGeo, brushedMetal);
    railL.position.set(-1.75, 1.64, -0.1);
    railL.castShadow = true;
    const railR = railL.clone();
    railR.position.x = 1.75;

    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(3.62, 0.1, 0.16), brushedMetal);
    crossBar.position.set(0, 3.22, -0.1);
    displayGroup.add(railL, railR, crossBar);

    // Main high-clarity studio monitor chassis
    const monitorChassis = new THREE.Mesh(
      new RoundedBoxGeometry(3.38, 2.24, 0.12, 3, 0.04),
      darkSlateTrim,
    );
    monitorChassis.position.set(0, 1.85, 0.04);
    monitorChassis.rotation.x = -0.06;
    monitorChassis.castShadow = true;

    const editorTex = this.loadTexture('/assets/projects/asterism-write/editor.webp');
    this.screenMat = new THREE.MeshBasicMaterial({ map: editorTex, toneMapped: false });
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.18, 2.04), this.screenMat);
    screenMesh.position.set(0, 1.85, 0.11);
    screenMesh.rotation.x = -0.06;
    screenMesh.userData = { kind: 'zone', zoneId: 'asterism' };

    // Official unaltered Asterism Write Wordmark Header Plate (crisp pure white plate, zero filter)
    const wordmarkPlate = new THREE.Mesh(
      new RoundedBoxGeometry(2.35, 0.68, 0.08, 3, 0.04),
      new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
    );
    wordmarkPlate.position.set(0, 3.45, 0.1);
    wordmarkPlate.castShadow = true;

    const wordmarkTex = this.loadTexture('/assets/projects/asterism-write/wordmark.webp');
    const wordmarkMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.05, 0.68),
      new THREE.MeshBasicMaterial({ map: wordmarkTex, transparent: true, toneMapped: false }),
    );
    wordmarkMesh.position.set(0, 3.45, 0.145);

    displayGroup.add(monitorChassis, screenMesh, wordmarkPlate, wordmarkMesh);

    // 3. Kinetic Layered Porcelain Paper Folios (Left Side — unfold when focused)
    const paperStand = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 1.65), darkSlateTrim);
    paperStand.position.set(-2.45, 0.11, 0.65);
    paperStand.receiveShadow = true;
    this.group.add(paperStand);

    const sheetTints = [0xdce4f4, 0xedf2fa, 0xffffff];
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x9aa6bf });
    for (let i = 0; i < 3; i++) {
      const sheetMat = new THREE.MeshStandardMaterial({
        color: sheetTints[i],
        roughness: 0.42,
        metalness: 0.04,
      });
      const sheet = new THREE.Mesh(new RoundedBoxGeometry(1.18, 1.62, 0.032, 2, 0.012), sheetMat);
      sheet.position.set(-2.45 + i * 0.12, 1.05 + i * 0.14, 0.65 - i * 0.18);
      sheet.rotation.y = 0.35 - i * 0.08;
      sheet.rotation.x = -0.14;
      sheet.castShadow = true;
      sheet.receiveShadow = true;

      // Subtle ruled typography header + body lines on front sheet
      if (i === 2) {
        const headerRule = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.06, 0.04), cobaltMat);
        headerRule.position.set(-0.08, 0.52, 0.01);
        sheet.add(headerRule);
        for (let ln = 0; ln < 4; ln++) {
          const w = ln === 3 ? 0.54 : 0.84;
          const rule = new THREE.Mesh(new THREE.BoxGeometry(w, 0.024, 0.038), lineMat);
          rule.position.set(-0.46 + w * 0.5, 0.28 - ln * 0.16, 0.01);
          sheet.add(rule);
        }
      }

      this.paperSheets.push(sheet);
      this.group.add(sheet);
    }

    // 4. Official App Icon Frosted Glass Monolith + 6 Official Format Tiles (Right Side)
    const iconPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 0.42, 32), darkSlateTrim);
    iconPedestal.position.set(2.55, 0.24, 0.72);
    iconPedestal.castShadow = true;
    this.group.add(iconPedestal);

    const iconTex = this.loadTexture('/assets/projects/asterism-write/app-icon.webp');
    this.iconPlinth = new THREE.Mesh(
      new RoundedBoxGeometry(0.92, 0.92, 0.16, 4, 0.08),
      [
        frostedGlass,
        frostedGlass,
        frostedGlass,
        frostedGlass,
        new THREE.MeshBasicMaterial({ map: iconTex, transparent: true, toneMapped: false }),
        frostedGlass,
      ],
    );
    this.iconPlinth.position.set(2.55, 1.18, 0.72);
    this.iconPlinth.rotation.y = -0.35;
    this.iconPlinth.castShadow = true;
    this.group.add(this.iconPlinth);

    // Calibrated Metallic Ruler Beam + 6 Official Format Tiles along front architectural ledge
    const rulerBeam = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.08, 0.28), brushedMetal);
    rulerBeam.position.set(0.1, 0.12, 1.82);
    rulerBeam.receiveShadow = true;
    this.group.add(rulerBeam);

    const asterismProject = PROJECTS.find((p) => p.id === 'asterism-write');
    const formats = asterismProject?.formatIcons ?? [];
    formats.forEach((fmt, idx) => {
      const fTex = this.loadTexture(fmt.src);
      const tile = new THREE.Mesh(
        new THREE.PlaneGeometry(0.48, 0.48),
        new THREE.MeshBasicMaterial({ map: fTex, transparent: true, toneMapped: false }),
      );
      tile.position.set(-1.55 + idx * 0.66, 0.44, 1.82);
      tile.rotation.x = -0.22;
      this.group.add(tile);
    });

    // Invisible zone click hit volume
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 4.0, 4.8),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitBox.position.set(0, 2.0, 0);
    hitBox.userData = { kind: 'zone', zoneId: 'asterism' };
    this.group.add(hitBox);

    // Crisp daylight gallery spotlight + Asterism Cobalt architectural rim
    this.spotLight = new THREE.SpotLight(0xf6f9ff, 18, 17, Math.PI * 0.38, 0.52, 1.35);
    this.spotLight.position.set(-0.6, 6.8, 3.6);
    this.spotLight.target = monitorChassis;
    const cobaltRim = new THREE.PointLight(0x5b75ff, 4.5, 12, 1.6);
    cobaltRim.position.set(3.2, 2.8, 1.6);
    this.group.add(this.spotLight, cobaltRim);
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
  }

  public setFocused(focused: boolean): void {
    this.activeFocus = focused;
  }

  public update(dt: number, elapsed: number, reducedMotion: boolean): void {
    const targetUnfold = this.activeFocus ? 1 : 0;
    this.unfoldProgress += (targetUnfold - this.unfoldProgress) * Math.min(1, dt * 3.8);

    if (!reducedMotion) {
      // Fan out the layered porcelain paper folios smoothly when entering the Studio
      this.paperSheets.forEach((sheet, i) => {
        const fan = (i - 1) * (0.12 + this.unfoldProgress * 0.22);
        sheet.rotation.y = 0.32 + fan + Math.sin(elapsed * 0.9 + i) * 0.03;
        sheet.position.y =
          1.05 + i * (0.14 + this.unfoldProgress * 0.09) + Math.sin(elapsed * 1.4 + i) * 0.04;
      });

      this.iconPlinth.position.y = 1.18 + Math.sin(elapsed * 1.6) * 0.07;
      this.iconPlinth.rotation.y = -0.35 + Math.sin(elapsed * 0.7) * 0.16;
    }

    const targetIntensity = this.activeFocus ? 24 : 15;
    this.spotLight.intensity += (targetIntensity - this.spotLight.intensity) * Math.min(1, dt * 4);
  }
}
