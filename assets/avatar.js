import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const avatarData = {
    model: null,
    bones: {},
    boneMap: {},
    blinkMesh: null,
    lifeTime: 0
};

export function loadAvatar(scene, BONE_DATA) {
    const selection = window.selectedCharacter;
    let modelPath = '';

    if (selection === 'female') {
        modelPath = '/assets/female.glb';
    } else if (selection === 'male') {
        modelPath = '/assets/male.glb';
    } else{}
    const loader = new GLTFLoader();
    if (avatarData.model) {
        scene.remove(avatarData.model);
        avatarData.bones = {};
        avatarData.boneMap = {};
    }
    loader.load(modelPath, (gltf) => {
        avatarData.model = gltf.scene;
        avatarData.model.rotation.y = Math.PI;
        avatarData.model.scale.set(1.5, 1.5, 1.5); 
        avatarData.model.position.set(0, 0, 0);
        avatarData.model.traverse((node) => {
            if (node.isBone) {
                avatarData.boneMap[node.name] = node;
                avatarData.bones[node.name] = node;
                if (node.name === "J_Bip_L_UpperArm") avatarData.bones.leftArm = node;
                if (node.name === "J_Bip_R_UpperArm") avatarData.bones.rightArm = node;
                if (node.name === "J_Bip_L_LowerArm") avatarData.bones.leftLowerArm = node;
                if (node.name === "J_Bip_R_LowerArm") avatarData.bones.rightLowerArm = node;
                if (node.name === "J_Bip_R_Hand") avatarData.bones.rightHand = node;
                if (node.name === "J_Bip_R_Shoulder") avatarData.bones.rightShoulder = node;
                if (node.name.toLowerCase().includes("head") && !node.name.includes("End")) {
                    avatarData.bones.head = node;
                }
            }
            
            if (node.isMesh && node.morphTargetDictionary) {
                const dict = node.morphTargetDictionary;
                if (dict['Blink'] !== undefined || dict['Fcl_EYE_Close'] !== undefined) {
                    avatarData.blinkMesh = node;
                }
            }
        });

        for (const boneName in BONE_DATA) {
            if (avatarData.boneMap[boneName]) {
                avatarData.boneMap[boneName].rotation.set(
                    BONE_DATA[boneName].x,
                    BONE_DATA[boneName].y,
                    BONE_DATA[boneName].z
                );
            }
        }

        avatarData.model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(avatarData.model);
        const center = box.getCenter(new THREE.Vector3());
        avatarData.model.position.set(-center.x, -center.y + 0.9, -center.z);

        scene.add(avatarData.model);
        
        console.log(`Avatar Loaded from selection: ${selection}`);
    }, undefined, (err) => {})
}