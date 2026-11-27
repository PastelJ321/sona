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
  phaseSpring: SpringValue;
}

/**
 * SONA — MATERIAL SIGNAL 2.0 Hero Kinetic Sculpture ("Harmonic Resonator")
 *
 * Monumental studio-scaled kinetic sculpture: 23 chamfered brushed-aluminum & satin-titanium
 * acoustic lamellae suspended along twin tensioned chrome rails, cradling a refractive crown-glass
 * optical lens with an illuminated helical signal filament and glowing pearl resonator core.
 *
 * Scroll choreography opens the 23 blades dramatically into a sweeping radial phase fan
 * during Movement 02 (Hero -> Works transformation).
 */
export class HeroSignalSculpture {
  public readonly group = new THREE.Group();
  public readonly hitMesh: THREE.Mesh;

  private readonly outerFrame = new THREE.Group();
  private readonly bladeRack = new THREE.Group();
  private readonly opticalAssembly = new THREE.Group();
  private readonly blades: ArticulatedBlade[] = [];
  private readonly filamentMat: THREE.MeshStandardMaterial;
  private readonly coreGlowMat: THREE.MeshStandardMaterial;
  private readonly lensMesh: THREE.Mesh;
  private readonly shadowPlane: THREE.Mesh;

  private clickWaveTime = 10;
  private clickWaveStrength = 0;

  constructor(materials: MaterialLibrary) {
    this.group.name = 'HeroSignalSculpture';
    this.group.add(this.outerFrame);
    this.outerFrame.add(this.bladeRack, this.opticalAssembly);

    // 1. Precision Airfoil-Tapered Machined Lamella Geometry with central optical aperture
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(-1.42, 0);
    bladeShape.bezierCurveTo(-0.82, 0.37, 0.78, 0.41, 1.48, 0.065);
    bladeShape.quadraticCurveTo(1.62, 0, 1.48, -0.065);
    bladeShape.bezierCurveTo(0.78, -0.37, -0.82, -0.33, -1.42, 0);

    const hole = new THREE.Path();
    hole.absellipse(0.06, 0, 0.62, 0.18, 0, Math.PI * 2, false, 0);
    bladeShape.holes.push(hole);

    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
      depth: 0.048,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.018,
      bevelThickness: 0.018,
    });
    bladeGeo.center();

    // 2. Arrange 23 Articulated Machined Lamellae along a Helical Spine
    const count = 23;
    const spacing = 0.195;
    const collarGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.078, 18);
    collarGeo.rotateX(Math.PI / 2);

    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) * 2 - 1;
      const z = t * ((count - 1) * spacing * 0.5);
      const envelope = Math.cos(t * Math.PI * 0.43);
      const scaleX = 0.6 + 0.54 * envelope;
      const scaleY = 0.76 + 0.44 * envelope;

      // Material rhythm: alternating brushed aluminum & satin titanium, Iris harmonic pair,
      // single Vermilion index blade at center, Acid-Lime precision accents on terminals
      let bladeMat: THREE.Material = materials.anodizedBasalt;
      if (i === 11) {
        bladeMat = materials.machinedVermilion;
      } else if (i === 7 || i === 15) {
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

      const collarMat =
        i === 0 || i === count - 1 ? materials.machinedLime : materials.machinedChrome;
      const collarL = new THREE.Mesh(collarGeo, collarMat);
      collarL.position.set(-0.88 * scaleX, 0, 0);
      const collarR = new THREE.Mesh(collarGeo, collarMat);
      collarR.position.set(0.88 * scaleX, 0, 0);

      pivot.add(mesh, collarL, collarR);
      this.bladeRack.add(pivot);

      const baseTwist = t * 1.24;
      pivot.rotation.z = baseTwist;

      this.blades.push({
        pivot,
        mesh,
        index: i,
        normalized: t,
        baseZ: z,
        baseTwist,
        phaseSpring: new SpringValue(0, {
          stiffness: 132,
          damping: 14,
          mass: 0.88 + Math.abs(t) * 0.32,
        }),
      });
    }

    // 3. Twin Tensioned Brushed-Chrome Helical Spine Rails
    const railPtsA: THREE.Vector3[] = [];
    const railPtsB: THREE.Vector3[] = [];
    for (let s = 0; s <= 44; s++) {
      const t = (s / 44) * 2 - 1;
      const z = t * ((count - 1) * spacing * 0.5 + 0.28);
      const env = Math.cos(t * Math.PI * 0.43);
      const r = (0.6 + 0.54 * env) * 0.88;
      const ang = t * 1.24;
      railPtsA.push(new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, z));
      railPtsB.push(new THREE.Vector3(-Math.cos(ang) * r, -Math.sin(ang) * r, z));
    }
    const railA = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPtsA), 72, 0.024, 12, false),
      materials.machinedChrome,
    );
    const railB = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPtsB), 72, 0.024, 12, false),
      materials.machinedChrome,
    );
    this.bladeRack.add(railA, railB);

    // 4. Sculpted Refractive Crown-Glass Acoustic Lens cradling a luminous signal core
    const lensProfile: THREE.Vector2[] = [];
    for (let k = 0; k <= 28; k++) {
      const u = (k / 28) * Math.PI;
      const rx = Math.sin(u) * 0.84;
      const pinch = 1 - 0.16 * Math.pow(Math.cos(u * 2), 2);
      const ry = -Math.cos(u) * 1.24;
      lensProfile.push(new THREE.Vector2(Math.max(0.002, rx * pinch), ry));
    }
    const lensGeo = new THREE.LatheGeometry(lensProfile, 52);
    lensGeo.rotateX(Math.PI / 2);
    this.lensMesh = new THREE.Mesh(lensGeo, materials.opticalGlass);
    this.opticalAssembly.add(this.lensMesh);

    // Luminous inner acoustic resonator pearl + helical filament (gives optical glass genuine inner glow!)
    this.coreGlowMat = new THREE.MeshStandardMaterial({
      color: 0xfff8ed,
      emissive: 0x6a86ff,
      emissiveIntensity: 1.5,
      roughness: 0.15,
      metalness: 0.1,
    });
    const innerCore = new THREE.Mesh(new THREE.SphereGeometry(0.24, 28, 28), this.coreGlowMat);
    innerCore.scale.set(0.95, 0.95, 1.85);
    this.opticalAssembly.add(innerCore);

    const filPts: THREE.Vector3[] = [];
    for (let k = 0; k <= 72; k++) {
      const t = (k / 72) * 2 - 1;
      const z = t * 1.85;
      const rad = 0.28 * (1 - t * t * 0.58);
      const ang = t * Math.PI * 3.4;
      filPts.push(new THREE.Vector3(Math.cos(ang) * rad, Math.sin(ang) * rad, z));
    }
    this.filamentMat = new THREE.MeshStandardMaterial({
      color: 0xf7f5ef,
      emissive: 0x9eb2ff,
      emissiveIntensity: 2.3,
      roughness: 0.15,
    });
    const filament = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(filPts), 80, 0.022, 10, false),
      this.filamentMat,
    );
    this.opticalAssembly.add(filament);

    // Machined porcelain-ceramic & chrome aperture rings framing the glass lens
    const endCapRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.028, 16, 52),
      materials.porcelainCeramic,
    );
    endCapRing.position.z = 1.15;
    const endCapRingBack = endCapRing.clone();
    endCapRingBack.position.z = -1.15;
    this.opticalAssembly.add(endCapRing, endCapRingBack);

    // Grounded soft studio shadow below the sculpture
    this.shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 6.8),
      new THREE.MeshBasicMaterial({
        map: materials.contactShadowTex,
        transparent: true,
        opacity: 0.68,
        depthWrite: false,
      }),
    );
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -2.25;
    this.group.add(this.shadowPlane);

    this.hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.45, 16, 16),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.hitMesh.userData = { sculpture: 'hero' };
    this.group.add(this.hitMesh);

    // Confident monumental architectural angle
    this.outerFrame.rotation.set(0.24, -0.46, -0.2);
  }

  public triggerPluck(intensity = 1.0): void {
    this.clickWaveTime = 0;
    this.clickWaveStrength = Math.min(1.5, intensity);
    for (const blade of this.blades) {
      const dist = Math.abs(blade.normalized);
      blade.phaseSpring.impulse((1 - dist * 0.45) * 4.8 * intensity);
    }
  }

  public update(
    dt: number,
    elapsed: number,
    pointer: PointerDynamics,
    heroScrollOut: number,
    baseScale: number,
    reducedMotion: boolean,
  ): void {
    this.clickWaveTime += dt;
    this.clickWaveStrength *= Math.exp(-dt * 2.0);

    // 1. Heavy structural frame responds with deep inertia + sculptural scroll rotation
    const baseRotX = 0.24 + pointer.heavyY.value * 0.24 + heroScrollOut * 0.62;
    const baseRotY = -0.46 + pointer.heavyX.value * 0.38 + heroScrollOut * 0.95;
    const baseRotZ = -0.2 - pointer.heavyX.value * 0.09 - heroScrollOut * 0.28;
    this.outerFrame.rotation.set(baseRotX, baseRotY, baseRotZ);

    // 2. Refractive glass lens & internal filament respond swiftly
    this.opticalAssembly.position.set(
      pointer.lightX.value * 0.16,
      -pointer.lightY.value * 0.12,
      0,
    );
    this.opticalAssembly.rotation.z = reducedMotion ? 0 : elapsed * 0.2 + pointer.lightX.value * 0.36;
    this.lensMesh.rotation.y = pointer.lightX.value * 0.2;
    this.filamentMat.emissiveIntensity =
      2.1 + pointer.energy.value * 1.4 + this.clickWaveStrength * 1.6;
    this.coreGlowMat.emissiveIntensity =
      1.35 + pointer.energy.value * 0.9 + this.clickWaveStrength * 1.1;

    // 3. Living Signal travelling physical wave across all 23 blades
    const breathAmp = reducedMotion ? 0 : 0.09;
    const velWave = pointer.energy.value * 0.46;

    for (const blade of this.blades) {
      const t = blade.normalized;
      const breathe = Math.sin(t * 3.5 - elapsed * 1.25) * breathAmp;
      const ptrRipple =
        Math.sin(t * 5.2 - pointer.midX.value * 3.4 - elapsed * 2.6) * velWave;
      const pluckDist = Math.abs(t) - this.clickWaveTime * 1.9;
      const pluck =
        Math.exp(-pluckDist * pluckDist * 18.0) * this.clickWaveStrength * 0.52;

      // Expressive phase transformation: blades fan wide open during Hero -> Works scroll
      const scrollSpread = heroScrollOut * (0.72 + Math.abs(t) * 0.88);

      blade.phaseSpring.setTarget(breathe + ptrRipple + pluck + scrollSpread);
      const disp = reducedMotion ? scrollSpread : blade.phaseSpring.step(dt);

      blade.pivot.rotation.z = blade.baseTwist + disp + pointer.midX.value * 0.14 * t;
      blade.pivot.position.z = blade.baseZ * (1 + heroScrollOut * 0.85);
      blade.pivot.position.y =
        Math.sin(t * 2.6 - elapsed * 0.9) * (reducedMotion ? 0 : 0.048) + disp * 0.14;
    }

    // Sweeping upward/diagonal exit cleanly clearing the viewport before Exhibition 01
    this.group.position.y = heroScrollOut * 7.6;
    this.group.scale.setScalar(Math.max(0.001, baseScale * (1 - heroScrollOut * 0.38)));
    this.group.visible = heroScrollOut < 0.94;
    (this.shadowPlane.material as THREE.MeshBasicMaterial).opacity =
      Math.max(0, 0.68 * (1 - heroScrollOut * 1.9));
  }
}
