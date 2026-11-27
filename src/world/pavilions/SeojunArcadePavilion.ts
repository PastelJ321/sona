import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { WORLD_ZONES } from '../zoneRegistry';

export class SeojunArcadePavilion {
  public readonly group = new THREE.Group();

  private readonly screenMat: THREE.MeshBasicMaterial;
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly textureLoader: THREE.TextureLoader;
  private readonly joystickPivot: THREE.Group;
  private readonly buttons: THREE.Mesh[] = [];
  private readonly floatingTokens: THREE.Mesh[] = [];
  private readonly heightBar: THREE.Mesh;
  private readonly flagMesh: THREE.Mesh;
  private readonly spotLight: THREE.SpotLight;

  private buttonBounce = 0;
  private activeFocus = false;

  constructor(textureLoader: THREE.TextureLoader) {
    this.textureLoader = textureLoader;
    this.group.name = 'SeojunArcadePavilion';

    const cfg = WORLD_ZONES.arcade;
    this.group.position.set(cfg.center[0], cfg.elevation, cfg.center[2]);
    this.group.rotation.y = Math.PI * 0.16;

    // Materials tailored to 서준이네 오락실 (#1B1640, #FFD23F, #5EF2C8, #FF7EB6)
    const terraceMat = new THREE.MeshStandardMaterial({
      color: 0x1d1744,
      roughness: 0.46,
      metalness: 0.35,
    });
    const cabinetMat = new THREE.MeshPhysicalMaterial({
      color: 0x261d5b,
      roughness: 0.28,
      metalness: 0.24,
      clearcoat: 0.72,
      clearcoatRoughness: 0.22,
    });
    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xffd23f,
      emissive: 0xffb700,
      emissiveIntensity: 0.38,
      roughness: 0.25,
      metalness: 0.15,
    });
    const mintMat = new THREE.MeshStandardMaterial({
      color: 0x5ef2c8,
      emissive: 0x2fd8a8,
      emissiveIntensity: 0.42,
      roughness: 0.22,
      metalness: 0.15,
    });
    const pinkMat = new THREE.MeshStandardMaterial({
      color: 0xff7eb6,
      emissive: 0xe64d8f,
      emissiveIntensity: 0.35,
      roughness: 0.26,
      metalness: 0.12,
    });

    // 1. Raised Stepped Indigo Arcade Terrace (dark indigo deck catches crisp cabinet shadows; mint glows cleanly along outer rim!)
    const baseDeck = new THREE.Mesh(
      new RoundedBoxGeometry(7.2, 0.5, 5.8, 4, 0.12),
      terraceMat,
    );
    baseDeck.position.y = -0.25;
    baseDeck.receiveShadow = true;
    baseDeck.castShadow = true;

    const rimLightStrip = new THREE.Mesh(
      new THREE.BoxGeometry(7.36, 0.06, 5.96),
      new THREE.MeshBasicMaterial({ color: 0x5ef2c8 }),
    );
    rimLightStrip.position.y = -0.24;

    const playMat = new THREE.Mesh(
      new RoundedBoxGeometry(5.6, 0.04, 4.1, 2, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x261d58, roughness: 0.52, metalness: 0.2 }),
    );
    playMat.position.set(0, 0.02, 0.1);
    playMat.receiveShadow = true;

    this.group.add(baseDeck, rimLightStrip, playMat);

    // 2. Hero Sculptural Arcade Cabinet (Center Stage)
    const cabinetGroup = new THREE.Group();
    cabinetGroup.position.set(0, 0.03, -0.35);
    this.group.add(cabinetGroup);

    const body = new THREE.Mesh(
      new RoundedBoxGeometry(2.75, 3.15, 1.45, 4, 0.16),
      cabinetMat,
    );
    body.position.y = 1.58;
    body.castShadow = true;
    body.receiveShadow = true;

    // Sun-Yellow Marquee Crown
    const marquee = new THREE.Mesh(
      new RoundedBoxGeometry(2.82, 0.42, 1.55, 3, 0.08),
      yellowMat,
    );
    marquee.position.set(0, 3.24, 0.08);
    marquee.castShadow = true;

    // Real Live Screen Display (portal.webp default, switchable to growth.webp / yangil.webp)
    const portalTex = this.loadScreenTexture('/assets/projects/seojun-arcade/portal.webp');
    this.screenMat = new THREE.MeshBasicMaterial({ map: portalTex, toneMapped: false });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.36, 1.47), this.screenMat);
    screen.position.set(0, 2.2, 0.81);
    screen.rotation.x = -0.04;
    screen.userData = { kind: 'zone', zoneId: 'arcade' };

    // Crisp recessed screen bezel frame sitting cleanly proud of cabinet body
    const bezel = new THREE.Mesh(
      new RoundedBoxGeometry(2.54, 1.64, 0.12, 3, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x0e0b22, roughness: 0.35, metalness: 0.6 }),
    );
    bezel.position.set(0, 2.2, 0.74);
    bezel.rotation.x = -0.04;

    // Control Console Shelf with Physical Joystick & Tactile Candy Buttons
    const deck = new THREE.Mesh(
      new RoundedBoxGeometry(2.72, 0.28, 0.92, 3, 0.08),
      cabinetMat,
    );
    deck.position.set(0, 1.12, 0.95);
    deck.rotation.x = 0.18;
    deck.castShadow = true;

    this.joystickPivot = new THREE.Group();
    this.joystickPivot.position.set(-0.72, 1.28, 1.02);
    const stickShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.28, 12),
      new THREE.MeshStandardMaterial({ color: 0xe6ecf5, metalness: 0.9, roughness: 0.15 }),
    );
    stickShaft.position.y = 0.14;
    const stickBall = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 20), pinkMat);
    stickBall.position.y = 0.3;
    this.joystickPivot.add(stickShaft, stickBall);

    const btnColors = [mintMat, yellowMat, pinkMat, new THREE.MeshStandardMaterial({ color: 0x6ec8ff, emissive: 0x3b9ae8, emissiveIntensity: 0.35 })];
    btnColors.forEach((mat, idx) => {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.115, 0.09, 20), mat);
      btn.position.set(0.12 + (idx % 2) * 0.32, 1.27 - Math.floor(idx / 2) * 0.04, 0.88 + Math.floor(idx / 2) * 0.28);
      btn.userData = { kind: 'arcade-button', zoneId: 'arcade' };
      this.buttons.push(btn);
      cabinetGroup.add(btn);
    });

    cabinetGroup.add(body, marquee, bezel, screen, deck, this.joystickPivot);

    // 3. Companion Left Display: 키 키우기 (Growth-/) + Kinetic Height Gauge
    const leftStand = new THREE.Group();
    leftStand.position.set(-2.35, 0, 0.35);
    leftStand.rotation.y = 0.34;

    const growthTex = this.loadScreenTexture('/assets/projects/seojun-arcade/growth.webp');
    const leftFrame = new THREE.Mesh(new RoundedBoxGeometry(1.62, 1.3, 0.18, 3, 0.06), pinkMat);
    leftFrame.position.y = 1.48;
    leftFrame.castShadow = true;

    const leftScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.44, 0.92),
      new THREE.MeshBasicMaterial({ map: growthTex, toneMapped: false }),
    );
    leftScreen.position.set(0, 1.48, 0.1);
    leftScreen.userData = { kind: 'zone', zoneId: 'arcade' };

    const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.9, 16), terraceMat);
    leftPillar.position.y = 0.45;

    // Animated rising ruler gauge bar beside 키 키우기
    this.heightBar = new THREE.Mesh(new RoundedBoxGeometry(0.16, 1.0, 0.16, 2, 0.04), mintMat);
    this.heightBar.position.set(-0.96, 0.5, 0.1);
    leftStand.add(leftFrame, leftScreen, leftPillar, this.heightBar);
    this.group.add(leftStand);

    // 4. Companion Right Display: 나는 이번생은 양일고다! (yangil/) + Miniature Flag Finial
    const rightStand = new THREE.Group();
    rightStand.position.set(2.35, 0, 0.35);
    rightStand.rotation.y = -0.34;

    const yangilTex = this.loadScreenTexture('/assets/projects/seojun-arcade/yangil.webp');
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8d6342, roughness: 0.65 });
    const rightFrame = new THREE.Mesh(new RoundedBoxGeometry(1.62, 1.3, 0.18, 3, 0.06), woodMat);
    rightFrame.position.y = 1.48;
    rightFrame.castShadow = true;

    const rightScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.44, 0.92),
      new THREE.MeshBasicMaterial({ map: yangilTex, toneMapped: false }),
    );
    rightScreen.position.set(0, 1.48, 0.1);
    rightScreen.userData = { kind: 'zone', zoneId: 'arcade' };

    const rightPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.9, 16), terraceMat);
    rightPillar.position.y = 0.45;

    // Miniature geometric school flag echoing the real game artwork
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.72, 10),
      new THREE.MeshStandardMaterial({ color: 0x3b3556, metalness: 0.6 }),
    );
    pole.position.set(0.6, 2.48, 0);
    this.flagMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.03), yellowMat);
    this.flagMesh.position.set(0.8, 2.68, 0);
    rightStand.add(rightFrame, rightScreen, rightPillar, pole, this.flagMesh);
    this.group.add(rightStand);

    // 5. Floating Playful Arcade Tokens
    const tokenPositions: [number, number, number][] = [
      [-1.7, 3.3, -0.7],
      [1.85, 3.45, -0.5],
      [0.1, 3.9, -0.8],
    ];
    tokenPositions.forEach(([x, y, z], i) => {
      const token = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.15, 0),
        i === 0 ? pinkMat : i === 1 ? mintMat : yellowMat,
      );
      token.position.set(x, y, z);
      this.floatingTokens.push(token);
      this.group.add(token);
    });

    // Invisible zone click hit volume
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(6.8, 3.8, 4.4),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitBox.position.set(0, 1.9, 0);
    hitBox.userData = { kind: 'zone', zoneId: 'arcade' };
    this.group.add(hitBox);

    // Dedicated warm playful spotlight & mint rim accent
    this.spotLight = new THREE.SpotLight(0xffe082, 16, 16, Math.PI * 0.36, 0.55, 1.4);
    this.spotLight.position.set(0.6, 6.2, 3.2);
    this.spotLight.target = body;
    const mintRim = new THREE.PointLight(0x5ef2c8, 4.2, 11, 1.6);
    mintRim.position.set(-2.8, 2.6, 2.0);
    this.group.add(this.spotLight, mintRim);
  }

  private loadScreenTexture(src: string): THREE.Texture {
    const cached = this.textures.get(src);
    if (cached) return cached;
    const tex = this.textureLoader.load(src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.textures.set(src, tex);
    return tex;
  }

  public setScreen(src: string): void {
    const tex = this.loadScreenTexture(src);
    this.screenMat.map = tex;
    this.screenMat.needsUpdate = true;
    this.triggerButtonBounce();
  }

  public setFocused(focused: boolean): void {
    this.activeFocus = focused;
  }

  public triggerButtonBounce(): void {
    this.buttonBounce = 1.0;
  }

  public update(dt: number, elapsed: number, reducedMotion: boolean): void {
    this.buttonBounce = Math.max(0, this.buttonBounce - dt * 3.2);

    if (!reducedMotion) {
      this.joystickPivot.rotation.z = Math.sin(elapsed * 2.1) * (this.activeFocus ? 0.24 : 0.12);
      this.joystickPivot.rotation.x = Math.cos(elapsed * 1.7) * 0.14;

      this.buttons.forEach((btn, idx) => {
        const wave = Math.sin(elapsed * 3.2 + idx * 1.1) * 0.012;
        const press = this.buttonBounce * 0.045;
        btn.position.y = 1.27 - Math.floor(idx / 2) * 0.04 + wave - press;
      });

      const barScale = 0.65 + (0.5 + 0.5 * Math.sin(elapsed * 1.4)) * 1.05;
      this.heightBar.scale.y = barScale;
      this.heightBar.position.y = barScale * 0.5;

      this.flagMesh.rotation.y = Math.sin(elapsed * 3.0) * 0.22;

      this.floatingTokens.forEach((tk, i) => {
        tk.rotation.y += dt * (1.1 + i * 0.25);
        tk.position.y += Math.sin(elapsed * 1.8 + i * 1.9) * dt * 0.18;
      });
    }

    const targetIntensity = this.activeFocus ? 22 : 14;
    this.spotLight.intensity += (targetIntensity - this.spotLight.intensity) * Math.min(1, dt * 4);
  }
}
