import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';

export const avatarData = {
    model: null,
    bones: {
        leftArm: null,
        rightArm: null,
        leftLowerArm: null,
        rightLowerArm: null,
        rightHand: null,
        rightShoulder: null,
        head: null
    },
    blinkMesh: null,
    lifeTime: 0
};

export function loadAvatar(scene, BONE_DATA) {
    const loader = new GLTFLoader();
    
    loader.load('/assets/character.glb', (gltf) => {
        avatarData.model = gltf.scene;
        avatarData.model.rotation.y = Math.PI;
        avatarData.model.scale.set(1.5, 1.5, 1.5); 
        avatarData.model.position.set(0,0,0)
        avatarData.model.traverse((node) => {
            if (node.isBone) {
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
                if (node.morphTargetDictionary['Blink'] !== undefined || 
                    node.morphTargetDictionary['Fcl_EYE_Close'] !== undefined) {
                    avatarData.blinkMesh = node;
                }
            }
        });

        if (avatarData.bones.leftArm) {
            avatarData.bones.leftArm.rotation.set(BONE_DATA.L_Arm.x, BONE_DATA.L_Arm.y, BONE_DATA.L_Arm.z);
        }
        if (avatarData.bones.rightArm) {
            avatarData.bones.rightArm.rotation.set(BONE_DATA.R_Arm.x, BONE_DATA.R_Arm.y, BONE_DATA.R_Arm.z);
        }

        avatarData.model.updateMatrixWorld(true);
        
        const box = new THREE.Box3().setFromObject(avatarData.model);
        const center = box.getCenter(new THREE.Vector3());
        avatarData.model.position.set(-center.x, -center.y + 0.9, -center.z);

        scene.add(avatarData.model);
        console.log("Avatar Loaded & Bones Mapped", avatarData.bones);
    });
}