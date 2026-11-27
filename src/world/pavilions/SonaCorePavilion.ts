import * as THREE from 'three';
import { WORLD_ZONES } from '../zoneRegistry';

export class SonaCorePavilion {
  public readonly group = new THREE.Group();

  private readonly ringOuter: THREE.Mesh;
  private readonly ringMid: THREE.Mesh;
  private readonly ringInner: THREE.Mesh;
  private readonly crystalCore: THREE.Mesh;
  private readonly coreLight: THREE.PointLight;
  private readonly conduitPulses: { mesh: THREE.Mesh; start: THREE.Vector3; end: THREE.Vector3; speed: number; offset: number }[] = [];

  private surgeEnergy = 0;

  constructor() {
    this.group.name = 'SonaCorePavilion';

    // Materials: Architectural anodized Basalt, Porcelain stone, brushed Iris steel, Acid Lime emitter
    const basaltMat = new THREE.MeshStandardMaterial({
      color: 0x181d27,
      roughness: 0.42,
      metalness: 0.58,
    });
    const porcelainMat = new THREE.MeshStandardMaterial({
      color: 0xece9e1,
      roughness: 0.32,
      metalness: 0.12,
    });
    const irisAlloyMat = new THREE.MeshPhysicalMaterial({
      color: 0x5b75ff,
      roughness: 0.22,
      metalness: 0.82,
      clearcoat: 0.85,
      clearcoatRoughness: 0.18,
    });
    const limeAccentMat = new THREE.MeshStandardMaterial({
      color: 0xd9f56c,
      emissive: 0xd9f56c,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.2,
    });

    // 1. Stepped Amphitheater Plinth
    const baseStep1 = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.9, 0.34, 48), basaltMat);
    baseStep1.position.y = -0.18;
    baseStep1.receiveShadow = true;
    baseStep1.castShadow = true;

    const baseStep2 = new THREE.Mesh(new THREE.CylinderGeometry(3.45, 3.65, 0.26, 48), basaltMat);
    baseStep2.position.y = 0.06;
    baseStep2.receiveShadow = true;
    baseStep2.castShadow = true;

    // Crisp recessed Porcelain inlaid ring on the Core deck
    const porcelainRing = new THREE.Mesh(new THREE.RingGeometry(2.55, 2.74, 64), porcelainMat);
    porcelainRing.rotation.x = -Math.PI / 2;
    porcelainRing.position.y = 0.2;

    const limeInnerRing = new THREE.Mesh(
      new THREE.RingGeometry(1.45, 1.53, 64),
      new THREE.MeshBasicMaterial({ color: 0xd9f56c, side: THREE.DoubleSide }),
    );
    limeInnerRing.rotation.x = -Math.PI / 2;
    limeInnerRing.position.y = 0.205;

    this.group.add(baseStep1, baseStep2, porcelainRing, limeInnerRing);

    // 2. Sculptural Architectural Portal Arch framing the Kinetic Gyro
    const archGeo = new THREE.TorusGeometry(2.65, 0.11, 20, 64, Math.PI);
    const archMesh = new THREE.Mesh(archGeo, porcelainMat);
    archMesh.position.y = 0.22;
    archMesh.castShadow = true;
    archMesh.receiveShadow = true;

    // Twin chamfered pedestal struts anchoring the arch
    const strutGeo = new THREE.BoxGeometry(0.32, 0.72, 0.42);
    const strutL = new THREE.Mesh(strutGeo, basaltMat);
    strutL.position.set(-2.65, 0.42, 0);
    strutL.castShadow = true;
    const strutR = strutL.clone();
    strutR.position.x = 2.65;
    this.group.add(archMesh, strutL, strutR);

    // 3. Tri-Axis Kinetic Living Signal Gyroscope
    const gyroPivot = new THREE.Group();
    gyroPivot.position.y = 2.05;
    this.group.add(gyroPivot);

    this.ringOuter = new THREE.Mesh(new THREE.TorusGeometry(1.58, 0.055, 20, 72), basaltMat);
    this.ringOuter.castShadow = true;

    this.ringMid = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.048, 20, 64), irisAlloyMat);
    this.ringMid.castShadow = true;

    this.ringInner = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.03, 16, 48), limeAccentMat);

    // Central faceted reflective crystal acoustic lens
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xeef3ff,
      emissive: 0x3b52d8,
      emissiveIntensity: 0.42,
      roughness: 0.1,
      metalness: 0.25,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      ior: 1.55,
      reflectivity: 0.95,
    });
    this.crystalCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 1), crystalMat);
    this.crystalCore.castShadow = true;
    this.crystalCore.userData = { kind: 'zone', zoneId: 'core', action: 'surge' };

    // Invisible click target sphere around the Core sculpture for easy interaction
    const coreHit = new THREE.Mesh(
      new THREE.SphereGeometry(1.9, 16, 16),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    coreHit.userData = { kind: 'zone', zoneId: 'core', action: 'surge' };

    gyroPivot.add(this.ringOuter, this.ringMid, this.ringInner, this.crystalCore, coreHit);

    // Core reactive point light
    this.coreLight = new THREE.PointLight(0x7c93ff, 5.2, 16, 1.5);
    this.coreLight.position.set(0, 2.25, 0.4);
    this.group.add(this.coreLight);

    // 4. Angled Architectural Bridges + Luminous Signal Conduits to both Project Pavilions
    this.buildBridge(
      new THREE.Vector3(-2.8, 0.05, -1.7),
      new THREE.Vector3(WORLD_ZONES.arcade.center[0] + 2.8, WORLD_ZONES.arcade.elevation, WORLD_ZONES.arcade.center[2] + 1.8),
      0x5ef2c8,
      basaltMat,
    );
    this.buildBridge(
      new THREE.Vector3(2.8, 0.05, -1.6),
      new THREE.Vector3(WORLD_ZONES.asterism.center[0] - 2.8, WORLD_ZONES.asterism.elevation, WORLD_ZONES.asterism.center[2] + 1.6),
      0x5b75ff,
      basaltMat,
    );
  }

  private buildBridge(
    start: THREE.Vector3,
    end: THREE.Vector3,
    glowHex: number,
    deckMat: THREE.Material,
  ): void {
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.copy(mid);
    bridgeGroup.lookAt(end);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.16, len + 0.5), deckMat);
    deck.receiveShadow = true;
    deck.castShadow = true;

    const railMat = new THREE.MeshBasicMaterial({ color: glowHex });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, len + 0.3), railMat);
    railL.position.set(-0.72, 0.09, 0);
    const railR = railL.clone();
    railR.position.x = 0.72;

    const centerStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.025, len + 0.3),
      new THREE.MeshBasicMaterial({ color: 0xf0eee8, transparent: true, opacity: 0.45 }),
    );
    centerStrip.position.y = 0.085;

    bridgeGroup.add(deck, railL, railR, centerStrip);
    this.group.add(bridgeGroup);

    // Animated light packets traveling along the bridge conduit
    for (let i = 0; i < 2; i++) {
      const packet = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.07, 0.52),
        new THREE.MeshBasicMaterial({ color: glowHex }),
      );
      packet.lookAt(end);
      this.group.add(packet);
      this.conduitPulses.push({
        mesh: packet,
        start: start.clone().add(new THREE.Vector3(0, 0.14, 0)),
        end: end.clone().add(new THREE.Vector3(0, 0.14, 0)),
        speed: 0.34,
        offset: i * 0.5,
      });
    }
  }

  public triggerSurge(): void {
    this.surgeEnergy = 1.0;
  }

  public update(dt: number, elapsed: number, reducedMotion: boolean): void {
    this.surgeEnergy = Math.max(0, this.surgeEnergy - dt * 1.15);

    if (!reducedMotion) {
      const spinBoost = 1 + this.surgeEnergy * 3.8;
      this.ringOuter.rotation.y += dt * 0.28 * spinBoost;
      this.ringOuter.rotation.x = Math.sin(elapsed * 0.35) * 0.22;

      this.ringMid.rotation.x += dt * 0.42 * spinBoost;
      this.ringMid.rotation.z += dt * 0.25 * spinBoost;

      this.ringInner.rotation.y -= dt * 0.65 * spinBoost;
      this.ringInner.rotation.z = Math.cos(elapsed * 0.6) * 0.45;

      this.crystalCore.rotation.y += dt * 0.55 * spinBoost;
      this.crystalCore.rotation.x += dt * 0.32;
      const scale = 1 + Math.sin(elapsed * 2.1) * 0.05 + this.surgeEnergy * 0.22;
      this.crystalCore.scale.setScalar(scale);

      for (const pulse of this.conduitPulses) {
        const u = (elapsed * pulse.speed + pulse.offset) % 1;
        pulse.mesh.position.lerpVectors(pulse.start, pulse.end, u);
      }
    }

    this.coreLight.intensity = 5.2 + Math.sin(elapsed * 2.0) * 0.6 + this.surgeEnergy * 7.5;
  }
}
