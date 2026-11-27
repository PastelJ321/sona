import * as THREE from 'three';
import type { MaterialLibrary } from '../MaterialLibrary';
import { PointerDynamics, SpringValue } from '../SpringPhysics';

interface ArticulatedBlade {
  pivot: THREE.Group;
  mesh: THREE.Mesh;
  index: number;
  normalized: number; // -1..1 along the spine
  baseZ: number;
  baseTwist: number;
  baseRadius: number;
  phaseSpring: SpringValue;
}

/**
 * SONA — MATERIAL SIGNAL Hero Kinetic Sculpture ("Harmonic Resonator")
 *
 * A precision-machined array of 23 chamfered brushed-aluminum & anodized-basalt
 * acoustic lamellae suspended along twin tensioned chrome rails, cradling a
 * custom-lathed optical crown-glass lens with an internal glowing signal filament.
 *
 * Moving the pointer propagates an inertial physical wave across every blade.
 */
export class HeroSignalSculpture {
  public readonly group = new THREE.Group();
  public readonly hitMesh: THREE.Mesh;

  private readonly outerFrame = new THREE.Group();
  private readonly bladeRack = new THREE.Group();
  private readonly opticalAssembly = new THREE.Group();
  private readonly blades: ArticulatedBlade[] = [];
  private readonly filamentMat: THREE.MeshStandardMaterial;
  private readonly lensMesh: THREE.Mesh;
  private readonly shadowPlane: THREE.Mesh;

  private clickWaveTime = 10;
  private clickWaveStrength = 0;

  constructor(materials: MaterialLibrary) {
    this.group.name = 'HeroSignalSculpture';

    this.group.add(this.outerFrame);
    this.outerFrame.add(this.bladeRack, this.opticalAssembly);

    // 1. Custom Airfoil-Tapered Machined Lamella Geometry (chamfered ExtrudeGeometry)
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(-1.32, 0);
    bladeShape.bezierCurveTo(-0.75, 0.34, 0.72, 0.38, 1.38, 0.06);
    bladeShape.quadraticCurveTo(1.5, 0, 1.38, -0.06);
    bladeShape.bezierCurveTo(0.72, -0.34, -0.75, -0.3, -1.32, 0);

    // Precision cutout aperture through each blade so the central optical lens breathes through the metal
    const hole = new THREE.Path();
    hole.absellipse(0.06, 0, 0.56, 0.16, 0, Math.PI * 2, false, 0);
    bladeShape.holes.push(hole);

    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
      depth: 0.044,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.016,
      bevelThickness: 0.016,
    });
    bladeGeo.center();

    // 2. Arrange 23 Articulated Machined Lamellae along a Graceful Helical Spine
    const count = 23;
    const spacing = 0.185;
    const collarGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.072, 16);
    collarGeo.rotateX(Math.PI / 2);

    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) * 2 - 1; // -1..1
      const z = t * ((count - 1) * spacing * 0.5);
      const envelope = Math.cos(t * Math.PI * 0.44);
      const scaleX = 0.58 + 0.52 * envelope;
      const scaleY = 0.72 + 0.42 * envelope;

      // Deliberate material rhythm: dark satin basalt outer shells, brushed aluminum middle,
      // crisp anodized Iris & single Vermilion index blade at harmonic nodes
      let bladeMat: THREE.Material = materials.anodizedBasalt;
      if (i === 11) {
        bladeMat = materials.machinedVermilion;
      } else if (i === 8 || i === 14) {
        bladeMat = materials.anodizedIris;
      } else if (i % 2 === 1) {
        bladeMat = materials.brushedAluminum;
      }

      const pivot = new THREE.Group();
      pivot.position.set(0, 0, z);

      const mesh = new THREE.Mesh(bladeGeo, bladeMat);
      mesh.scale.set(scaleX, scaleY, 1);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Machined stainless spacer collars on each blade junction
      const collarL = new THREE.Mesh(collarGeo, materials.machinedChrome);
      collarL.position.set(-0.82 * scaleX, 0, 0);
      const collarR = new THREE.Mesh(collarGeo, materials.machinedChrome);
      collarR.position.set(0.82 * scaleX, 0, 0);

      pivot.add(mesh, collarL, collarR);
      this.bladeRack.add(pivot);

      const baseTwist = t * 1.18;
      pivot.rotation.z = baseTwist;

      this.blades.push({
        pivot,
        mesh,
        index: i,
        normalized: t,
        baseZ: z,
        baseTwist,
        baseRadius: scaleX,
        phaseSpring: new SpringValue(0, { stiffness: 135, damping: 14, mass: 0.9 + Math.abs(t) * 0.3 }),
      });
    }

    // 3. Twin Helical Tensioned Steel Rails locking the sculptural spine together
    const railPtsA: THREE.Vector3[] = [];
    const railPtsB: THREE.Vector3[] = [];
    for (let s = 0; s <= 40; s++) {
      const t = (s / 40) * 2 - 1;
      const z = t * ((count - 1) * spacing * 0.5 + 0.25);
      const env = Math.cos(t * Math.PI * 0.44);
      const r = (0.58 + 0.52 * env) * 0.82;
      const ang = t * 1.18;
      railPtsA.push(new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, z));
      railPtsB.push(new THREE.Vector3(-Math.cos(ang) * r, -Math.sin(ang) * r, z));
    }
    const railGeoA = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPtsA), 64, 0.022, 12, false);
    const railGeoB = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPtsB), 64, 0.022, 12, false);
    const railA = new THREE.Mesh(railGeoA, materials.machinedChrome);
    const railB = new THREE.Mesh(railGeoB, materials.machinedChrome);
    this.bladeRack.add(railA, railB);

    // 4. Precision Lathed Optical Crown-Glass Acoustic Lens cradling the core
    const lensProfile: THREE.Vector2[] = [];
    for (let k = 0; k <= 24; k++) {
      const u = (k / 24) * Math.PI;
      const rx = Math.sin(u) * 0.78;
      // Subtle concave pinch waist like an acoustic resonator lens
      const pinch = 1 - 0.14 * Math.pow(Math.cos(u * 2), 2);
      const ry = -Math.cos(u) * 1.12;
      lensProfile.push(new THREE.Vector2(Math.max(0.002, rx * pinch), ry));
    }
    const lensGeo = new THREE.LatheGeometry(lensProfile, 48);
    lensGeo.rotateX(Math.PI / 2);
    this.lensMesh = new THREE.Mesh(lensGeo, materials.opticalGlass);
    this.opticalAssembly.add(this.lensMesh);

    // 5. Internal Delicate Living-Signal Luminous Filament inside the Optical Glass
    const filPts: THREE.Vector3[] = [];
    for (let k = 0; k <= 64; k++) {
      const t = (k / 64) * 2 - 1;
      const z = t * 1.65;
      const rad = 0.22 * (1 - t * t * 0.65);
      const ang = t * Math.PI * 3.2;
      filPts.push(new THREE.Vector3(Math.cos(ang) * rad, Math.sin(ang) * rad, z));
    }
    const filGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(filPts), 72, 0.018, 10, false);
    this.filamentMat = new THREE.MeshStandardMaterial({
      color: 0xf0eee8,
      emissive: 0x708bff,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });
    const filament = new THREE.Mesh(filGeo, this.filamentMat);
    this.opticalAssembly.add(filament);

    // Precision anodized titanium collar rings framing the lens ends
    const endCapRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 16, 48), materials.porcelainCeramic);
    endCapRing.position.z = 1.05;
    const endCapRingBack = endCapRing.clone();
    endCapRingBack.position.z = -1.05;
    this.opticalAssembly.add(endCapRing, endCapRingBack);

    // Grounded soft contact shadow plane below the sculpture
    this.shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 5.6),
      new THREE.MeshBasicMaterial({
        map: materials.contactShadowTex,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      }),
    );
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -2.05;
    this.group.add(this.shadowPlane);

    // Generous invisible raycast volume for tactile click plucking
    this.hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 16, 16),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.hitMesh.userData = { sculpture: 'hero' };
    this.group.add(this.hitMesh);

    // Sculptural hero diagonal studio orientation (asymmetric, architectural silhouette)
    this.outerFrame.rotation.set(0.28, -0.52, -0.22);
  }

  public triggerPluck(intensity = 1.0): void {
    this.clickWaveTime = 0;
    this.clickWaveStrength = Math.min(1.4, intensity);
    for (const blade of this.blades) {
      const dist = Math.abs(blade.normalized);
      blade.phaseSpring.impulse((1 - dist * 0.5) * 4.2 * intensity);
    }
  }

  public update(
    dt: number,
    elapsed: number,
    pointer: PointerDynamics,
    heroScrollOut: number, // 0 = Hero center stage, 1 = Transitioned out toward Exhibition 01
    reducedMotion: boolean,
  ): void {
    this.clickWaveTime += dt;
    this.clickWaveStrength *= Math.exp(-dt * 2.1);

    // 1. Heavy structural frame responds with deep inertia + subtle scroll lift/fan-out
    const baseRotX = 0.28 + pointer.heavyY.value * 0.22 + heroScrollOut * 0.55;
    const baseRotY = -0.52 + pointer.heavyX.value * 0.34 + heroScrollOut * 0.85;
    const baseRotZ = -0.22 - pointer.heavyX.value * 0.08;
    this.outerFrame.rotation.set(baseRotX, baseRotY, baseRotZ);

    // 2. Optical crown glass & internal signal filament respond with swift, light inertia
    this.opticalAssembly.position.set(
      pointer.lightX.value * 0.14,
      -pointer.lightY.value * 0.11,
      0,
    );
    this.opticalAssembly.rotation.z = reducedMotion ? 0 : elapsed * 0.18 + pointer.lightX.value * 0.35;
    this.lensMesh.rotation.y = pointer.lightX.value * 0.18;
    this.filamentMat.emissiveIntensity =
      1.6 + pointer.energy.value * 1.2 + this.clickWaveStrength * 1.4;

    // 3. Living Signal travelling physical wave across all 23 machined aluminum blades
    const breathAmp = reducedMotion ? 0 : 0.085;
    const velWave = pointer.energy.value * 0.42;

    for (const blade of this.blades) {
      const t = blade.normalized;
      // Smooth travelling harmonic wave across the spine
      const breathe = Math.sin(t * 3.4 - elapsed * 1.25) * breathAmp;
      // Velocity-driven tactile ripple when user sweeps cursor rapidly
      const ptrRipple =
        Math.sin(t * 5.2 - pointer.midX.value * 3.2 - elapsed * 2.6) * velWave;
      // Radial click pluck pulse
      const pluckDist = Math.abs(t) - this.clickWaveTime * 1.85;
      const pluck =
        Math.exp(-pluckDist * pluckDist * 18.0) * this.clickWaveStrength * 0.48;

      // Scroll choreography: blades fan cleanly outward as Hero transitions to Works
      const scrollSpread = heroScrollOut * (0.45 + Math.abs(t) * 0.55);

      blade.phaseSpring.setTarget(breathe + ptrRipple + pluck + scrollSpread);
      const disp = reducedMotion ? scrollSpread : blade.phaseSpring.step(dt);

      blade.pivot.rotation.z = blade.baseTwist + disp + pointer.midX.value * 0.12 * t;
      blade.pivot.position.z = blade.baseZ * (1 + heroScrollOut * 0.55);
      blade.pivot.position.y = Math.sin(t * 2.6 - elapsed * 0.9) * (reducedMotion ? 0 : 0.045) + disp * 0.12;
    }

    // Smooth vertical exit & clean vanish during Hero -> Exhibition 01 transition
    this.group.position.y = heroScrollOut * 7.2;
    this.group.scale.setScalar(Math.max(0.001, 1 - heroScrollOut * 0.42));
    this.group.visible = heroScrollOut < 0.92;
    (this.shadowPlane.material as THREE.MeshBasicMaterial).opacity =
      Math.max(0, 0.62 * (1 - heroScrollOut * 1.8));
  }
}
