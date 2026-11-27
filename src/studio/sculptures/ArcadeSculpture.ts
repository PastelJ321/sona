import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { MaterialLibrary } from '../MaterialLibrary';
import { PointerDynamics, SpringValue } from '../SpringPhysics';

/**
 * Sculpted Retro-Modern Tabletop Arcade Object for 〈서준이네 오락실〉.
 * Replaces blocky game primitives with a curved multi-profile beveled lacquered shell,
 * brushed aluminum side plates, optical-glass CRT bezel, machined chrome joystick,
 * and physically spring-damped concave candy buttons.
 */
export class ArcadeSculpture {
  public readonly group = new THREE.Group();
  public readonly hitMesh: THREE.Mesh;

  private readonly rig = new THREE.Group();
  private readonly screenMat: THREE.MeshBasicMaterial;
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly textureLoader: THREE.TextureLoader;

  private readonly stickPivot = new THREE.Group();
  private readonly stickSpringX = new SpringValue(0, { stiffness: 190, damping: 14, mass: 0.7 });
  private readonly stickSpringZ = new SpringValue(0, { stiffness: 190, damping: 14, mass: 0.7 });
  private readonly buttons: { mesh: THREE.Mesh; baseY: number; spring: SpringValue }[] = [];
  private readonly shadowPlane: THREE.Mesh;

  constructor(materials: MaterialLibrary, textureLoader: THREE.TextureLoader) {
    this.textureLoader = textureLoader;
    this.group.name = 'ArcadeSculpture';
    this.group.add(this.rig);

    // 1. Sweeping Curved Side-Profile Extruded Cabinet Shell (Teenage Engineering × Retro Arcade)
    const profile = new THREE.Shape();
    profile.moveTo(-0.78, -1.25);
    profile.lineTo(0.86, -1.25);
    profile.quadraticCurveTo(1.06, -1.25, 1.06, -1.02);
    // Front ergonomic control deck lip
    profile.lineTo(1.06, -0.52);
    profile.quadraticCurveTo(1.06, -0.34, 0.84, -0.32);
    profile.lineTo(0.42, -0.26);
    // Angled recessed display bay
    profile.lineTo(0.28, 0.96);
    // Sweeping marquee visor brow
    profile.lineTo(0.76, 1.12);
    profile.quadraticCurveTo(0.86, 1.18, 0.84, 1.34);
    profile.lineTo(0.78, 1.48);
    profile.quadraticCurveTo(0.74, 1.56, 0.56, 1.56);
    profile.lineTo(-0.56, 1.56);
    profile.quadraticCurveTo(-0.84, 1.56, -0.86, 1.24);
    profile.lineTo(-0.88, -1.04);
    profile.quadraticCurveTo(-0.88, -1.25, -0.78, -1.25);

    const shellGeo = new THREE.ExtrudeGeometry(profile, {
      depth: 2.24,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.065,
      bevelThickness: 0.065,
    });
    shellGeo.center();
    // Rotate so profile faces +Z (viewer)
    shellGeo.rotateY(-Math.PI / 2);

    const shellMesh = new THREE.Mesh(shellGeo, materials.lacqueredIndigo);
    shellMesh.castShadow = true;
    shellMesh.receiveShadow = true;
    this.rig.add(shellMesh);

    // 2. Machined Brushed-Aluminum Side Trim Cheek Plates (adds genuine industrial hardware joinery)
    const cheekGeo = new RoundedBoxGeometry(0.055, 2.38, 1.36, 4, 0.024);
    const cheekL = new THREE.Mesh(cheekGeo, materials.brushedAluminum);
    cheekL.position.set(-1.19, -0.08, -0.14);
    cheekL.castShadow = true;
    const cheekR = cheekL.clone();
    cheekR.position.x = 1.19;
    this.rig.add(cheekL, cheekR);

    // 3. Glossy Sun-Yellow Beveled Marquee Crown + Subtle Accent Strip
    const marqueeGeo = new RoundedBoxGeometry(2.14, 0.28, 0.42, 4, 0.055);
    const marquee = new THREE.Mesh(marqueeGeo, materials.lacqueredYellow);
    marquee.position.set(0, 1.22, 0.58);
    marquee.rotation.x = 0.08;
    marquee.castShadow = true;
    this.rig.add(marquee);

    const mintTrim = new THREE.Mesh(
      new RoundedBoxGeometry(2.18, 0.036, 0.06, 2, 0.014),
      materials.lacqueredMint,
    );
    mintTrim.position.set(0, -0.43, 0.96);
    this.rig.add(mintTrim);

    // 4. Precision Dark Anodized Monitor Hood + Real Live Screen + Optical Glass Glaze
    const hood = new THREE.Mesh(
      new RoundedBoxGeometry(2.04, 1.32, 0.14, 4, 0.04),
      materials.anodizedBasalt,
    );
    hood.position.set(0, 0.34, 0.35);
    hood.rotation.x = -0.11;
    this.rig.add(hood);

    const portalTex = this.loadTexture('/assets/projects/seojun-arcade/portal.webp');
    this.screenMat = new THREE.MeshBasicMaterial({ map: portalTex, toneMapped: false });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.18), this.screenMat);
    screen.position.set(0, 0.34, 0.43);
    screen.rotation.x = -0.11;
    this.rig.add(screen);

    // Whisper-thin studio glass reflection cover over the CRT monitor
    const screenGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.94, 1.22),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.06,
        metalness: 0.0,
        transparent: true,
        opacity: 0.14,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
      }),
    );
    screenGlass.position.set(0, 0.34, 0.445);
    screenGlass.rotation.x = -0.11;
    this.rig.add(screenGlass);

    // 5. Machined Control Deck: Chrome Joystick + Chamfered Washer + Sculpted Candy Buttons
    const deckPlate = new THREE.Mesh(
      new RoundedBoxGeometry(2.02, 0.05, 0.56, 3, 0.02),
      materials.anodizedBasalt,
    );
    deckPlate.position.set(0, -0.4, 0.68);
    deckPlate.rotation.x = 0.08;
    deckPlate.receiveShadow = true;
    this.rig.add(deckPlate);

    const washer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.17, 0.026, 28),
      materials.brushedAluminum,
    );
    washer.position.set(-0.56, -0.37, 0.68);
    washer.rotation.x = 0.08;
    this.rig.add(washer);

    this.stickPivot.position.set(-0.56, -0.36, 0.68);
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.03, 0.28, 20),
      materials.machinedChrome,
    );
    shaft.position.y = 0.14;
    const ballTop = new THREE.Mesh(new THREE.SphereGeometry(0.115, 28, 28), materials.lacqueredPink);
    ballTop.position.y = 0.31;
    ballTop.castShadow = true;
    this.stickPivot.add(shaft, ballTop);
    this.rig.add(this.stickPivot);

    // Sculpted concave arcade buttons seated in brushed-aluminum bezels
    const buttonMats = [
      materials.lacqueredMint,
      materials.lacqueredYellow,
      materials.lacqueredPink,
      materials.anodizedIris,
    ];
    const buttonCoords: [number, number][] = [
      [0.14, 0.62],
      [0.44, 0.59],
      [0.24, 0.8],
      [0.54, 0.77],
    ];
    const bezelGeo = new THREE.TorusGeometry(0.095, 0.016, 12, 28);
    bezelGeo.rotateX(Math.PI / 2);

    buttonCoords.forEach(([bx, bz], i) => {
      const by = -0.36 - (bz - 0.62) * 0.07;
      const collar = new THREE.Mesh(bezelGeo, materials.brushedAluminum);
      collar.position.set(bx, by - 0.01, bz);
      collar.rotation.x = 0.08;
      this.rig.add(collar);

      const cap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.082, 0.088, 0.055, 24),
        buttonMats[i],
      );
      cap.position.set(bx, by + 0.012, bz);
      cap.rotation.x = 0.08;
      cap.castShadow = true;
      this.rig.add(cap);

      this.buttons.push({
        mesh: cap,
        baseY: by + 0.012,
        spring: new SpringValue(0, { stiffness: 260, damping: 16, mass: 0.6 }),
      });
    });

    // Grounded soft studio contact shadow
    this.shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 3.6),
      new THREE.MeshBasicMaterial({
        map: materials.contactShadowTex,
        transparent: true,
        opacity: 0.68,
        depthWrite: false,
      }),
    );
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -1.52;
    this.group.add(this.shadowPlane);

    this.hitMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 3.0, 2.0),
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
    if (btn) btn.spring.impulse(-1.4);
    this.stickSpringX.impulse((index % 2 === 0 ? 1 : -1) * 3.8);
    this.stickSpringZ.impulse(2.4);
  }

  public update(
    dt: number,
    elapsed: number,
    pointer: PointerDynamics,
    presence: number, // 0 = offstage, 1 = centered in focus
    offsetX: number,
    offsetY: number,
    reducedMotion: boolean,
  ): void {
    this.group.visible = presence > 0.04;
    if (!this.group.visible) return;

    // Smooth cinematic reveal: glides from depth offset into photographic hero pose
    const inv = 1 - presence;
    this.group.position.set(offsetX, offsetY - inv * 2.4, -inv * 2.2);
    this.group.scale.setScalar(0.78 + presence * 0.22);

    // Subtle three-quarter product photography angle reacting with weighty inertia to pointer
    const baseYRot = offsetX > 0 ? -0.34 : -0.18;
    const hoverTiltY = pointer.heavyX.value * 0.26;
    const hoverTiltX = 0.08 + pointer.heavyY.value * 0.14;
    const breatheY = reducedMotion ? 0 : Math.sin(elapsed * 1.1) * 0.04;

    this.rig.rotation.set(hoverTiltX, baseYRot + hoverTiltY + inv * 0.45, -pointer.heavyX.value * 0.03);
    this.rig.position.y = breatheY;

    // Joystick follows pointer velocity organically with spring rebound
    this.stickSpringX.setTarget(pointer.lightX.value * 0.24);
    this.stickSpringZ.setTarget(pointer.lightY.value * 0.2);
    const sx = reducedMotion ? 0 : this.stickSpringX.step(dt);
    const sz = reducedMotion ? 0 : this.stickSpringZ.step(dt);
    this.stickPivot.rotation.z = -sx;
    this.stickPivot.rotation.x = sz;

    for (const btn of this.buttons) {
      const dy = reducedMotion ? 0 : btn.spring.step(dt);
      btn.mesh.position.y = btn.baseY + Math.max(-0.042, Math.min(0.01, dy * 0.035));
    }

    (this.shadowPlane.material as THREE.MeshBasicMaterial).opacity = 0.68 * presence;
  }
}
