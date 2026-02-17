import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';

export function loadAnimatedCharacter(scene, path) {
    const loader = new GLTFLoader();

    loader.load(path, (gltf) => {
        const model = gltf.scene;
        scene.add(model);

        // This function looks through all 600 bones
        model.traverse((object) => {
            if (object.isBone) {
                // Lower the arms (adjust names based on your specific model)
                if (object.name.includes('UpperArm_L')) {
                    object.rotation.z = -1.2; // Rotates arm down
                }
                if (object.name.includes('UpperArm_R')) {
                    object.rotation.z = 1.2;  // Rotates arm down
                }
            }
        });
        
        console.log("✓ Character bones adjusted from T-Pose");
    });
}