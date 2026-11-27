import * as THREE from 'three';
import {
  RELAY_BEACONS,
  detectClosestZone,
  sampleDeckElevation,
  type ZoneId,
} from './zoneRegistry';

export interface ProbeCallbacks {
  onWakePulse: (x: number, z: number, strength: number) => void;
  onProximityChange: (zone: ZoneId | null) => void;
  onRelayDiscovered: (discoveredCount: number, total: number, label: string) => void;
}

interface RelayRuntime {
  id: string;
  label: string;
  pos: THREE.Vector3;
  group: THREE.Group;
  crystal: THREE.Mesh;
  ring: THREE.Mesh;
  discovered: boolean;
}

/**
 * SONA Hovering Signal Probe — optional Bruno Simon-inspired free exploration craft
 * with smooth spring acceleration, banking turns, ramp elevation riding, and relay discovery.
 */
export class SignalProbe {
  public readonly group = new THREE.Group();
  public readonly relaysGroup = new THREE.Group();

  public readonly position = new THREE.Vector3(0, 0.72, 6.2);
  public heading = Math.PI; // Facing north toward SONA Core

  private readonly velocity = new THREE.Vector3();
  private readonly craftMesh = new THREE.Group();
  private readonly gyroRing: THREE.Mesh;
  private readonly thrusterMat: THREE.MeshBasicMaterial;
  private readonly hoverLight: THREE.PointLight;

  private readonly keys = new Set<string>();
  private joystickX = 0;
  private joystickY = 0;

  private active = false;
  private wakeTimer = 0;
  private boostEnergy = 0;
  private lastProximityZone: ZoneId | null = null;
  private readonly relays: RelayRuntime[] = [];
  private readonly callbacks: ProbeCallbacks;

  constructor(callbacks: ProbeCallbacks) {
    this.callbacks = callbacks;
    this.group.name = 'SignalProbe';
    this.group.visible = false;

    // Sculpted Porcelain + Basalt Hovering Probe Body
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0eee8,
      roughness: 0.25,
      metalness: 0.35,
      clearcoat: 0.85,
    });
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x161b24,
      roughness: 0.35,
      metalness: 0.78,
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x5b75ff,
      emissive: 0x5b75ff,
      emissiveIntensity: 0.9,
      roughness: 0.15,
    });

    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.18, 6), bodyMat);
    hull.rotation.x = Math.PI / 2;
    hull.scale.set(1.15, 1, 0.56);
    hull.castShadow = true;

    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.74), chassisMat);
    spine.position.set(0, 0.08, -0.04);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.09, 0.22), visorMat);
    visor.position.set(0, 0.11, 0.24);

    this.gyroRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.032, 12, 36),
      new THREE.MeshBasicMaterial({ color: 0xd9f56c }),
    );
    this.gyroRing.rotation.x = Math.PI / 2;

    this.thrusterMat = new THREE.MeshBasicMaterial({ color: 0xf4654d });
    const thruster = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), this.thrusterMat);
    thruster.position.set(0, 0, -0.56);

    this.craftMesh.add(hull, spine, visor, this.gyroRing, thruster);
    this.craftMesh.scale.setScalar(1.3);
    this.group.add(this.craftMesh);

    this.hoverLight = new THREE.PointLight(0xd9f56c, 3.2, 7.5, 1.6);
    this.hoverLight.position.set(0, -0.25, 0);
    this.group.add(this.hoverLight);

    // Subtle ground hover shadow ring
    const floorHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.52, 28),
      new THREE.MeshBasicMaterial({
        color: 0xd9f56c,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      }),
    );
    floorHalo.rotation.x = -Math.PI / 2;
    floorHalo.position.y = -0.48;
    this.group.add(floorHalo);

    this.buildRelays();
  }

  private buildRelays(): void {
    for (const cfg of RELAY_BEACONS) {
      const grp = new THREE.Group();
      grp.position.set(cfg.position[0], cfg.position[1], cfg.position[2]);

      const col = new THREE.Color(cfg.color);
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28, 0),
        new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.45,
          roughness: 0.22,
          metalness: 0.5,
        }),
      );
      crystal.position.y = 0.9;
      crystal.castShadow = true;

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.36, 0.16, 16),
        new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.4, metalness: 0.7 }),
      );
      base.position.y = 0.08;

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.46, 0.56, 32),
        new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;

      grp.add(base, crystal, ring);
      this.relaysGroup.add(grp);

      this.relays.push({
        id: cfg.id,
        label: cfg.label,
        pos: new THREE.Vector3(cfg.position[0], cfg.position[1], cfg.position[2]),
        group: grp,
        crystal,
        ring,
        discovered: false,
      });
    }
  }

  public setActive(nextActive: boolean, startNearZone?: ZoneId): void {
    this.active = nextActive;
    this.group.visible = nextActive;
    if (nextActive) {
      if (startNearZone === 'arcade') {
        this.position.set(-5.2, 0.85, -1.2);
        this.heading = Math.PI * 0.8;
      } else if (startNearZone === 'asterism') {
        this.position.set(5.2, 1.0, -1.0);
        this.heading = -Math.PI * 0.8;
      } else {
        this.position.set(0, 0.82, 8.8);
        this.heading = Math.PI;
      }
      this.velocity.set(0, 0, 0);
      this.group.position.copy(this.position);
    } else {
      this.keys.clear();
      this.joystickX = 0;
      this.joystickY = 0;
      if (this.lastProximityZone !== null) {
        this.lastProximityZone = null;
        this.callbacks.onProximityChange(null);
      }
    }
  }

  public isActive(): boolean {
    return this.active;
  }

  public onKeyDown(code: string): boolean {
    if (
      code === 'KeyW' ||
      code === 'KeyA' ||
      code === 'KeyS' ||
      code === 'KeyD' ||
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight'
    ) {
      this.keys.add(code);
      return true;
    }
    if (code === 'Space' && this.active) {
      this.triggerBoost();
      return true;
    }
    return false;
  }

  public onKeyUp(code: string): void {
    this.keys.delete(code);
  }

  public setJoystick(x: number, y: number): void {
    this.joystickX = Math.max(-1, Math.min(1, x));
    this.joystickY = Math.max(-1, Math.min(1, y));
  }

  public triggerBoost(): void {
    this.boostEnergy = 1.0;
    this.velocity.x += Math.sin(this.heading) * 6.5;
    this.velocity.z += Math.cos(this.heading) * 6.5;
    this.callbacks.onWakePulse(this.position.x, this.position.z, 1.35);
  }

  public getDiscoveredCount(): number {
    return this.relays.filter((r) => r.discovered).length;
  }

  public update(dt: number, elapsed: number): void {
    // Animate relays subtly even in Guided Mode
    for (let i = 0; i < this.relays.length; i++) {
      const r = this.relays[i];
      r.crystal.rotation.y += dt * (r.discovered ? 2.4 : 0.9);
      r.crystal.position.y = 0.88 + Math.sin(elapsed * 2.1 + i * 1.4) * 0.1;
      const pulse = r.discovered ? 1.15 + Math.sin(elapsed * 3.5 + i) * 0.15 : 1;
      r.ring.scale.setScalar(pulse);
    }

    if (!this.active) return;

    this.boostEnergy = Math.max(0, this.boostEnergy - dt * 2.2);

    // Combine keyboard + virtual joystick inputs
    let forward = 0;
    let turn = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) forward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) forward -= 0.78;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) turn += 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) turn -= 1;

    // Joystick uses screen-space vector relative to probe heading (intuitive one-thumb control!)
    const joyMag = Math.hypot(this.joystickX, this.joystickY);
    if (joyMag > 0.08) {
      const desiredAngle = Math.atan2(this.joystickX, this.joystickY);
      let diff = desiredAngle - this.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.heading += diff * Math.min(1, dt * 6.5);
      forward = Math.max(forward, Math.min(1, joyMag));
    } else {
      this.heading += turn * dt * 2.65;
    }

    // Apply physical acceleration & natural damping
    const accel = 18.5 + this.boostEnergy * 10;
    this.velocity.x += Math.sin(this.heading) * forward * accel * dt;
    this.velocity.z += Math.cos(this.heading) * forward * accel * dt;

    const drag = Math.exp(-dt * 3.4);
    this.velocity.multiplyScalar(drag);

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;

    // Soft sanctuary perimeter containment (bounce smoothly inside radius 15.2)
    const r = Math.hypot(this.position.x, this.position.z + 2.0);
    if (r > 15.0) {
      const pullX = -this.position.x / r;
      const pullZ = -(this.position.z + 2.0) / r;
      this.position.x = -pullX * 15.0;
      this.position.z = -pullZ * 15.0 - 2.0;
      this.velocity.multiplyScalar(-0.35);
    }

    // Smooth elevation riding up ramps & pavilions + hover bob
    const deckY = sampleDeckElevation(this.position.x, this.position.z);
    const targetY = deckY + 0.68 + Math.sin(elapsed * 3.8) * 0.06;
    this.position.y += (targetY - this.position.y) * Math.min(1, dt * 8.5);

    this.group.position.copy(this.position);
    this.group.rotation.y = this.heading;

    // Banking lean & pitch response
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    const targetPitch = Math.min(0.24, speed * 0.025) * (forward >= 0 ? 1 : -0.6);
    const targetRoll = -turn * 0.28;
    this.craftMesh.rotation.x += (targetPitch - this.craftMesh.rotation.x) * Math.min(1, dt * 8);
    this.craftMesh.rotation.z += (targetRoll - this.craftMesh.rotation.z) * Math.min(1, dt * 8);
    this.gyroRing.rotation.z += dt * (1.8 + speed * 0.55);

    this.thrusterMat.color.setHex(this.boostEnergy > 0.1 ? 0xd9f56c : 0xf4654d);

    // Emit wake ripples on Living Signal floor when moving
    this.wakeTimer += dt;
    if (speed > 1.2 && this.wakeTimer > 0.24) {
      this.wakeTimer = 0;
      this.callbacks.onWakePulse(this.position.x, this.position.z, Math.min(0.9, speed * 0.09));
    }

    // Check Relay Beacon discovery
    for (const relay of this.relays) {
      if (!relay.discovered) {
        const d = Math.hypot(this.position.x - relay.pos.x, this.position.z - relay.pos.z);
        if (d < 1.85) {
          relay.discovered = true;
          const mat = relay.crystal.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 1.65;
          (relay.ring.material as THREE.MeshBasicMaterial).opacity = 0.92;
          this.callbacks.onWakePulse(relay.pos.x, relay.pos.z, 1.4);
          this.callbacks.onRelayDiscovered(
            this.getDiscoveredCount(),
            this.relays.length,
            relay.label,
          );
        }
      }
    }

    // Check Zone Proximity
    const nearZone = detectClosestZone(this.position.x, this.position.z);
    if (nearZone !== this.lastProximityZone) {
      this.lastProximityZone = nearZone;
      this.callbacks.onProximityChange(nearZone);
    }
  }
}
