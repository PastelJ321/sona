import * as THREE from 'three';

export interface StudioEnvTextures {
  darkStudio: THREE.WebGLRenderTarget;
  daylightStudio: THREE.WebGLRenderTarget;
  dispose: () => void;
}

/**
 * Virtual Photography Studio Lightformer Environment Rig.
 * Bakes elongated commercial softboxes, bounce cards, and rim light strips into PMREM cubemaps
 * so brushed aluminum, optical glass, and glossy lacquer catch realistic studio reflections.
 */
export function buildStudioEnvironments(renderer: THREE.WebGLRenderer): StudioEnvTextures {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const buildRig = (mode: 'dark' | 'daylight'): THREE.WebGLRenderTarget => {
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(mode === 'dark' ? '#07090F' : '#EAECEF');

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
      // Overhead wide warm-porcelain softbox (creates crisp metallic bevel strips)
      addPanel(0xfff5e8, 3.8, [16, 4.5], [0, 10, 2]);
      // Front-left angled key softbox
      addPanel(0xf4f1ea, 2.8, [7, 11], [-10, 4, 8]);
      // Crisp narrow Iris-blue edge strip on right
      addPanel(0x637dff, 3.4, [3.2, 12], [11, 3, 2]);
      // Subtle warm Vermilion lower-left rim bounce card
      addPanel(0xf4654d, 2.2, [5.5, 3.2], [-9, -3.5, -6]);
      // Rear bright rim strip to separate dark basalt & glass silhouettes
      addPanel(0xeef3ff, 3.2, [14, 2.2], [0, 6.5, -11]);
      // Subtle cool studio floor bounce
      addPanel(0x22293a, 1.0, [24, 24], [0, -10, 0]);
    } else {
      // High-key architectural daylight studio for Asterism Write
      addPanel(0xffffff, 3.4, [18, 12], [0, 10, 1]);
      addPanel(0xf8faff, 2.2, [12, 10], [-11, 3, 6]);
      addPanel(0xdde7ff, 2.4, [9, 10], [11, 4, 4]);
      addPanel(0x5b75ff, 1.6, [3, 9], [10, 2, -7]);
      addPanel(0xf0eee8, 1.3, [22, 22], [0, -9, 0]);
    }

    const rt = pmrem.fromScene(envScene, 0.03);

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
