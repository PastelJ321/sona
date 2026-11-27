import * as THREE from 'three';

export interface StudioEnvTextures {
  darkStudio: THREE.WebGLRenderTarget;
  daylightStudio: THREE.WebGLRenderTarget;
  dispose: () => void;
}

/**
 * Virtual Photography Studio Lightformer Environment Rig (V2.0).
 * Bakes wide overhead softboxes, grazing specular strips, warm fill cards,
 * and architectural skylight diffusers into PMREM cubemaps so brushed metal,
 * satin titanium, clearcoat lacquer, and optical crystal glass read unmistakably at a glance.
 */
export function buildStudioEnvironments(renderer: THREE.WebGLRenderer): StudioEnvTextures {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const buildRig = (mode: 'dark' | 'daylight'): THREE.WebGLRenderTarget => {
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(mode === 'dark' ? '#0B0F17' : '#EFECE4');

    const addPanel = (
      colorHex: number,
      intensity: number,
      size: [number, number],
      pos: [number, number, number],
      lookAt: [number, number, number] = [0, 0, 0],
    ) => {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex).multiplyScalar(intensity),
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), mat);
      mesh.position.set(...pos);
      mesh.lookAt(...lookAt);
      envScene.add(mesh);
    };

    if (mode === 'dark') {
      // Primary wide warm-porcelain overhead softbox (crisp long bevel streaks across blades)
      addPanel(0xfff7ec, 4.6, [18, 5.2], [1, 10.5, 3.5]);
      // Front-left key softbox so dark satin gunmetal blades never crush to dead black
      addPanel(0xf3efe6, 3.4, [8.5, 11], [-10, 3.5, 9]);
      // Front-right crisp silver fill strip for dimensional separation
      addPanel(0xdbe5ff, 2.2, [5.5, 9], [10, -1, 8.5]);
      // Razor-sharp Iris-cobalt specular edge strip
      addPanel(0x6982ff, 4.2, [2.8, 13], [11.5, 3.5, 1]);
      // Warm Vermilion architectural bounce card on lower-left rear
      addPanel(0xf4654d, 2.8, [6.5, 4.0], [-9.5, -3.0, -5.5]);
      // Crisp bright rear top-rim strip for dramatic sculptural silhouette separation
      addPanel(0xf6f8ff, 4.2, [16, 2.6], [0, 7.2, -10.5]);
      // Subtle acid-lime micro-highlight strip on upper-right edge
      addPanel(0xd9f56c, 1.9, [2.4, 5.5], [8.5, 6.5, -7.5]);
      // Grounded dark slate studio floor bounce
      addPanel(0x283144, 1.35, [26, 26], [0, -10, 0]);
    } else {
      // High-key warm gallery daylight atelier for Asterism Write
      addPanel(0xfffdf8, 3.8, [20, 14], [0, 11, 2]);
      addPanel(0xfaf7ef, 2.6, [13, 11], [-11, 4, 7]);
      // Cool north-skylight contrast reflector on right for brushed aluminum definition
      addPanel(0xdbe6ff, 2.8, [10, 11], [11.5, 4.5, 4]);
      // Crisp dark architectural flag on far-left to give glossy crystal prism high-contrast edge reflections!
      addPanel(0x1b2232, 0.7, [3.2, 11], [-10, 1, -4]);
      // Cobalt accent strip for subtle glass edge refraction
      addPanel(0x405cc8, 2.4, [3.2, 10], [10, 2.5, -7.5]);
      // Warm alabaster gallery table bounce
      addPanel(0xf2efe6, 1.65, [24, 24], [0, -9.5, 0]);
    }

    const rt = pmrem.fromScene(envScene, 0.028);

    envScene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });

    return rt;
  };

  const darkStudio = buildRig('dark');
  const daylightStudio = buildRig('daylight');
  pmrem.dispose();

  return {
    darkStudio,
    daylightStudio,
    dispose: () => {
      darkStudio.dispose();
      daylightStudio.dispose();
    },
  };
}
