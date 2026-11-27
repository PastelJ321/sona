import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { MaterialLibrary } from '../MaterialLibrary';
import { PointerDynamics, SpringValue } from '../SpringPhysics';

/**
 * Generates an authentic backlit retro-modern arcade marquee graphic texture
 * (replaces a blank yellow strip with crisp physical backlit signage).
 */
function createMarqueeTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 160;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, '#FFCC33');
  grad.addColorStop(0.5, '#FFE066');
  grad.addColorStop(1, '#FFCC33');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle horizontal backlit diffuser ribs
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  for (let y = 0; y < h; y += 8) {
    ctx.fillRect(0, y, w, 2);
  }

  // Framing border lines
  ctx.strokeStyle = '#1B1446';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, w - 36, h - 36);

  // Left & right accent badges
  ctx.fillStyle = '#FF5E9C';
  ctx.fillRect(36, 36, 22, h - 72);
  ctx.fillStyle = '#38E0B4';
  ctx.fillRect(w - 58, 36, 22, h - 72);

  // Crisp backlit title
  ctx.fillStyle = '#18123D';
  ctx.font = '700 54px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SEOJUN ARCADE  ·  01', w / 2, h / 2 + 3);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Sculpted Retro-Modern Tabletop Arcade Object for 〈서준이네 오락실〉 (V2.0).
 * Upgrades: backlit custom marquee fascia, SONA-motif machined speaker slits,
 * tack-sharp zero-haze authentic CRT display, coin-return ruby LED accent,
 * and responsive spring-damped candy buttons + chrome joystick.
 */
export class ArcadeSculpture {
  public readonly group = new THREE.Group();
  public readonly hitMesh: THREE.Mesh;

  private readonly rig = new THREE.Group();
  private readonly screenMat: THREE.MeshBasicMaterial;
  private readonly marqueeTex: THREE.CanvasTexture;
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly textureLoader: THREE.TextureLoader;

  private readonly stickPivot = new THREE.Group();
  private readonly stickSpringX = new SpringValue(0, { stiffness: 195, damping: 14, mass: 0.68 });
  private readonly stickSpringZ = new SpringValue(0, { stiffness: 195, damping: 14, mass: 0.68 });
  private readonly buttons: { mesh: THREE.Mesh; baseY: number; spring: SpringValue }[] = [];
  private readonly shadowPlane: THREE.Mesh;

  constructor(materials: MaterialLibrary, textureLoader: THREE.TextureLoader) {
    this.textureLoader = textureLoader;
    this.group.name = 'ArcadeSculpture';
    this.group.add(this.rig);

    // 1. Curved Multi-Profile Extruded Lacquered Cabinet Shell
    const profile = new THREE.Shape();
    profile.moveTo(-0.78, -1.25);
    profile.lineTo(0.86, -1.25);
    profile.quadraticCurveTo(1.06, -1.25, 1.06, -1.02);
    profile.lineTo(1.06, -0.52);
    profile.quadraticCurveTo(1.06, -0.34, 0.84, -0.32);
    profile.lineTo(0.42, -0.26);
    profile.lineTo(0.28, 0.96);
    profile.lineTo(0.78, 1.12);
    profile.quadraticCurveTo(0.88, 1.18, 0.86, 1.35);
    profile.lineTo(0.8, 1.5);
    profile.quadraticCurveTo(0.75, 1.58, 0.56, 1.58);
    profile.lineTo(-0.56, 1.58);
    profile.quadraticCurveTo(-0.84, 1.58, -0.86, 1.24);
    profile.lineTo(-0.88, -1.04);
    profile.quadraticCurveTo(-0.88, -1.25, -0.78, -1.25);

    const shellGeo = new THREE.ExtrudeGeometry(profile, {
      depth: 2.32,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.068,
      bevelThickness: 0.068,
    });
    shellGeo.center();
    shellGeo.rotateY(-Math.PI / 2);

    const shellMesh = new THREE.Mesh(shellGeo, materials.lacqueredIndigo);
    shellMesh.castShadow = true;
    shellMesh.receiveShadow = true;
    this.rig.add(shellMesh);

    // 2. Machined Brushed-Aluminum Side Cheek Plates with crisp bevel reveal
    const cheekGeo = new RoundedBoxGeometry(0.06, 2.42, 1.4, 4, 0.025);
    const cheekL = new THREE.Mesh(cheekGeo, materials.brushedAluminum);
    cheekL.position.set(-1.23, -0.08, -0.14);
    cheekL.castShadow = true;
    const cheekR = cheekL.clone();
    cheekR.position.x = 1.23;
    this.rig.add(cheekL, cheekR);

    // 3. Backlit Arcade Marquee Box + Illuminated Graphic Fascia (proud of upper brow, zero clipping)
    const marqueeHousing = new THREE.Mesh(
      new RoundedBoxGeometry(2.22, 0.36, 0.48, 4, 0.055),
      materials.anodizedBasalt,
    );
    marqueeHousing.position.set(0, 1.34, 0.64);
    marqueeHousing.rotation.x = 0.04;
    marqueeHousing.castShadow = true;
    this.rig.add(marqueeHousing);

    this.marqueeTex = createMarqueeTexture();
    const marqueeFace = new THREE.Mesh(
      new THREE.PlaneGeometry(2.08, 0.27),
      new THREE.MeshBasicMaterial({ map: this.marqueeTex, toneMapped: false }),
    );
    marqueeFace.position.set(0, 1.34, 0.892);
    marqueeFace.rotation.x = 0.04;
    this.rig.add(marqueeFace);

    // 4. SONA-Motif Acoustic Speaker Grille Slits along the recessed canopy apron
    const slitGeo = new RoundedBoxGeometry(0.18, 0.016, 0.03, 2, 0.006);
    for (let s = -3; s <= 3; s++) {
      const slit = new THREE.Mesh(slitGeo, materials.machinedChrome);
      slit.position.set(s * 0.26, 1.02, 0.52);
      this.rig.add(slit);
    }

    // Mint precision trim strip along control lip
    const mintTrim = new THREE.Mesh(
      new RoundedBoxGeometry(2.24, 0.036, 0.065, 2, 0.014),
      materials.lacqueredMint,
    );
    mintTrim.position.set(0, -0.43, 0.98);
    this.rig.add(mintTrim);

    // Front recessed coin-return detail + warm ruby power LED
    const coinFrame = new THREE.Mesh(
      new RoundedBoxGeometry(0.46, 0.28, 0.06, 3, 0.02),
      materials.anodizedBasalt,
    );
    coinFrame.position.set(0.62, -0.92, 0.98);
    const coinLed = new THREE.Mesh(
      new RoundedBoxGeometry(0.11, 0.14, 0.03, 2, 0.01),
      new THREE.MeshStandardMaterial({
        color: 0xff6e54,
        emissive: 0xff4f38,
        emissiveIntensity: 2.2,
        roughness: 0.2,
      }),
    );
    coinLed.position.set(0.52, -0.92, 1.01);
    const coinSlot = new THREE.Mesh(
      new RoundedBoxGeometry(0.14, 0.03, 0.03, 2, 0.008),
      materials.machinedChrome,
    );
    coinSlot.position.set(0.73, -0.92, 1.01);
    this.rig.add(coinFrame, coinLed, coinSlot);

    // 5. Crisp Recessed Monitor Hood + Tack-Sharp Real Game Screenshot (NO milky white veil!)
    const hood = new THREE.Mesh(
      new RoundedBoxGeometry(2.12, 1.36, 0.14, 4, 0.042),
      materials.anodizedBasalt,
    );
    hood.position.set(0, 0.34, 0.35);
    hood.rotation.x = -0.1;
    this.rig.add(hood);

    const portalTex = this.loadTexture('/assets/projects/seojun-arcade/portal.webp');
    this.screenMat = new THREE.MeshBasicMaterial({ map: portalTex, toneMapped: false });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.96, 1.22), this.screenMat);
    screen.position.set(0, 0.34, 0.43);
    screen.rotation.x = -0.1;
    this.rig.add(screen);

    // Ultra-crisp subtle edge sheen (opacity 0.035 keeps screenshot vibrant and tack-sharp)
    const screenGlaze = new THREE.Mesh(
      new THREE.PlaneGeometry(1.98, 1.24),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.04,
        metalness: 0.0,
        transparent: true,
        opacity: 0.035,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
      }),
    );
    screenGlaze.position.set(0, 0.34, 0.442);
    screenGlaze.rotation.x = -0.1;
    this.rig.add(screenGlaze);

    // 6. Machined Control Deck: Chrome Joystick + Sculpted Candy Buttons
    const deckPlate = new THREE.Mesh(
      new RoundedBoxGeometry(2.08, 0.052, 0.58, 3, 0.02),
      materials.anodizedBasalt,
    );
    deckPlate.position.set(0, -0.4, 0.69);
    deckPlate.rotation.x = 0.08;
    deckPlate.receiveShadow = true;
    this.rig.add(deckPlate);

    const washer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.18, 0.028, 28),
      materials.brushedAluminum,
    );
    washer.position.set(-0.58, -0.37, 0.69);
    washer.rotation.x = 0.08;
    this.rig.add(washer);

    this.stickPivot.position.set(-0.58, -0.36, 0.69);
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.032, 0.29, 20),
      materials.machinedChrome,
    );
    shaft.position.y = 0.145;
    const ballTop = new THREE.Mesh(new THREE.SphereGeometry(0.125, 32, 32), materials.lacqueredPink);
    ballTop.position.y = 0.32;
    ballTop.castShadow = true;
    this.stickPivot.add(shaft, ballTop);
    this.rig.add(this.stickPivot);

    const buttonMats = [
      materials.lacqueredMint,
      materials.lacqueredYellow,
      materials.lacqueredPink,
      materials.anodizedIris,
    ];
    const buttonCoords: [number, number][] = [
      [0.14, 0.63],
      [0.45, 0.6],
      [0.24, 0.81],
      [0.55, 0.78],
    ];
    const bezelGeo = new THREE.TorusGeometry(0.098, 0.017, 12, 28);
    bezelGeo.rotateX(Math.PI / 2);

    buttonCoords.forEach(([bx, bz], i) => {
      const by = -0.36 - (bz - 0.63) * 0.07;
      const collar = new THREE.Mesh(bezelGeo, materials.brushedAluminum);
      collar.position.set(bx, by - 0.01, bz);
      collar.rotation.x = 0.08;
      this.rig.add(collar);

      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.092, 0.058, 24),
        buttonMats[i],
      );
      cap.position.set(bx, by + 0.012, bz);
      cap.rotation.x = 0.08;
      cap.castShadow = true;
      this.rig.add(cap);

      this.buttons.push({
        mesh: cap,
        baseY: by + 0.012,
        spring: new SpringValue(0, { stiffness: 270, damping: 16, mass: 0.58 }),
      });
    });

    // Grounded soft studio shadow
    this.shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 4.2),
      new THREE.MeshBasicMaterial({
        map: materials.contactShadowTex,
        transparent: true,
        opacity: 0.74,
        depthWrite: false,
      }),
    );
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -1.55;
    this.group.add(this.shadowPlane);

    this.hitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 3.1, 2.1),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.hitMesh.userData = { sculpture: 'arcade' };
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

  public setScreen(src: string, buttonIdx = 0): void {
    const tex = this.loadTexture(src);
    this.screenMat.map = tex;
    this.screenMat.needsUpdate = true;
    this.triggerTactilePress(buttonIdx);
  }

  public triggerTactilePress(index = 0): void {
    const btn = this.buttons[index % this.buttons.length];
    if (btn) btn.spring.impulse(-1.55);
    this.stickSpringX.impulse((index % 2 === 0 ? 1 : -1) * 4.2);
    this.stickSpringZ.impulse(2.6);
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
    this.group.position.set(offsetX, offsetY - inv * 2.4, -inv * 2.2);
    this.group.scale.setScalar(baseScale * (0.82 + presence * 0.18));

    const baseYRot = offsetX > 0 ? -0.32 : -0.14;
    const hoverTiltY = pointer.heavyX.value * 0.28;
    const hoverTiltX = 0.07 + pointer.heavyY.value * 0.14;
    const breatheY = reducedMotion ? 0 : Math.sin(elapsed * 1.1) * 0.04;

    this.rig.rotation.set(
      hoverTiltX,
      baseYRot + hoverTiltY + inv * 0.42,
      -pointer.heavyX.value * 0.032,
    );
    this.rig.position.y = breatheY;

    this.stickSpringX.setTarget(pointer.lightX.value * 0.26);
    this.stickSpringZ.setTarget(pointer.lightY.value * 0.22);
    const sx = reducedMotion ? 0 : this.stickSpringX.step(dt);
    const sz = reducedMotion ? 0 : this.stickSpringZ.step(dt);
    this.stickPivot.rotation.z = -sx;
    this.stickPivot.rotation.x = sz;

    for (const btn of this.buttons) {
      const dy = reducedMotion ? 0 : btn.spring.step(dt);
      btn.mesh.position.y = btn.baseY + Math.max(-0.045, Math.min(0.01, dy * 0.036));
    }

    (this.shadowPlane.material as THREE.MeshBasicMaterial).opacity = 0.74 * presence;
  }
}
