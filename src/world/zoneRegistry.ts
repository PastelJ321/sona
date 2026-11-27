import type { DeviceClass } from '../hooks/useViewportProfile';

export type ZoneId = 'core' | 'arcade' | 'asterism';

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export interface ZoneConfig {
  id: ZoneId;
  label: string;
  shortLabel: string;
  enLabel: string;
  projectSlug?: string;
  center: [number, number, number];
  elevation: number;
  radius: number;
  anchor3D: [number, number, number];
  fogColor: string;
  skyTopColor: string;
  ambientTint: string;
  accentHex: string;
  camera: Record<DeviceClass, CameraPose>;
}

export interface RelayBeaconConfig {
  id: string;
  label: string;
  position: [number, number, number];
  color: string;
}

export const WORLD_ZONES: Record<ZoneId, ZoneConfig> = {
  core: {
    id: 'core',
    label: 'SONA Core',
    shortLabel: '코어',
    enLabel: 'CORE',
    center: [0, 0, 0],
    elevation: 0,
    radius: 5.2,
    anchor3D: [0, 4.35, 0],
    fogColor: '#101522',
    skyTopColor: '#090C14',
    ambientTint: '#9CB0FF',
    accentHex: '#D9F56C',
    camera: {
      desktop: { position: [0.6, 8.1, 16.2], target: [0, 1.35, -2.0], fov: 40 },
      'tablet-landscape': { position: [0.4, 8.7, 17.6], target: [0, 1.25, -2.0], fov: 43 },
      'tablet-portrait': { position: [0, 9.6, 20.6], target: [0, -0.35, -2.0], fov: 47 },
      // Lower target.y pushes the 3D Core & bridges heroically into the upper half above the mobile card
      mobile: { position: [0, 9.8, 22.8], target: [0, -1.65, -2.2], fov: 48 },
    },
  },
  arcade: {
    id: 'arcade',
    label: '서준이네 오락실',
    shortLabel: '오락실',
    enLabel: 'SEOJUN ARCADE',
    projectSlug: 'seojun-arcade',
    center: [-9.2, 0.55, -5.6],
    elevation: 0.55,
    radius: 4.5,
    anchor3D: [-9.2, 5.15, -5.6],
    fogColor: '#171138',
    skyTopColor: '#0D0A22',
    ambientTint: '#A99BFF',
    accentHex: '#FFD23F',
    camera: {
      desktop: { position: [-4.4, 3.6, 1.75], target: [-7.95, 1.9, -5.5], fov: 38 },
      'tablet-landscape': { position: [-4.2, 3.75, 2.25], target: [-7.85, 1.9, -5.5], fov: 41 },
      'tablet-portrait': { position: [-5.1, 4.35, 3.3], target: [-9.1, 1.0, -5.6], fov: 45 },
      mobile: { position: [-5.1, 4.4, 4.75], target: [-9.2, 0.35, -5.6], fov: 48 },
    },
  },
  asterism: {
    id: 'asterism',
    label: 'Asterism Write',
    shortLabel: 'Asterism',
    enLabel: 'ASTERISM STUDIO',
    projectSlug: 'asterism-write',
    center: [9.2, 0.9, -5.2],
    elevation: 0.9,
    radius: 4.6,
    anchor3D: [9.2, 5.65, -5.2],
    fogColor: '#1A243B',
    skyTopColor: '#0F1524',
    ambientTint: '#C2D6FF',
    accentHex: '#5B75FF',
    camera: {
      desktop: { position: [4.1, 4.15, 2.1], target: [10.45, 2.25, -5.1], fov: 38 },
      'tablet-landscape': { position: [3.9, 4.25, 2.6], target: [10.55, 2.2, -5.1], fov: 41 },
      'tablet-portrait': { position: [4.8, 4.85, 3.85], target: [9.2, 1.2, -5.2], fov: 45 },
      mobile: { position: [4.9, 4.95, 5.3], target: [9.2, 0.55, -5.2], fov: 48 },
    },
  },
};

export const ZONE_ORDER: ZoneId[] = ['core', 'arcade', 'asterism'];

export const RELAY_BEACONS: RelayBeaconConfig[] = [
  { id: 'relay-west', label: '서쪽 신호 중계기', position: [-5.2, 0.3, -3.1], color: '#5EF2C8' },
  { id: 'relay-east', label: '동쪽 신호 중계기', position: [5.2, 0.48, -2.9], color: '#5B75FF' },
  { id: 'relay-north', label: '북쪽 공명 첨탑', position: [0, 0.15, -8.8], color: '#D9F56C' },
];

function smoothstep(x: number, min: number, max: number): number {
  if (x <= min) return 0;
  if (x >= max) return 1;
  const t = (x - min) / (max - min);
  return t * t * (3 - 2 * t);
}

/**
 * Smooth height map used by the Free-Explore Signal Probe so it rides up ramps
 * smoothly onto both elevated project pavilions without needing a heavy physics engine.
 */
export function sampleDeckElevation(x: number, z: number): number {
  const arcade = WORLD_ZONES.arcade;
  const asterism = WORLD_ZONES.asterism;

  const dArcade = Math.hypot(x - arcade.center[0], z - arcade.center[2]);
  const dAsterism = Math.hypot(x - asterism.center[0], z - asterism.center[2]);

  const wArcade = 1 - smoothstep(dArcade, 3.3, 6.8);
  const wAsterism = 1 - smoothstep(dAsterism, 3.4, 7.0);

  return Math.max(0, wArcade * arcade.elevation, wAsterism * asterism.elevation);
}

export function detectClosestZone(x: number, z: number): ZoneId | null {
  for (const id of ZONE_ORDER) {
    const zone = WORLD_ZONES[id];
    const dist = Math.hypot(x - zone.center[0], z - zone.center[2]);
    if (dist <= zone.radius + 1.15) {
      return id;
    }
  }
  return null;
}
