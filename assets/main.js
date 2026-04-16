import * as THREE from 'three';
import { initScene } from './scene.js'; 
import { loadAvatar, avatarData } from './avatar.js';
import { setThinking, setMood } from './core/emotion.js';
import { sendMessage } from './core/chat.js';

// Bones
const BONE_DATA = {
  J_Bip_L_UpperArm: { x: 0, y: -0.03, z: 1.18 },
  J_Bip_L_LowerArm: { x: -0.44, y: -0.32, z: 0.09 },
  J_Bip_L_Hand: { x: 0, y: -0.03, z: 0.43 },
  J_Bip_R_UpperArm: { x: 0, y: 0.03, z: -1.18 },
  J_Bip_R_LowerArm: { x: 0, y: 0.33, z: -0.18 },
  J_Bip_R_Hand: { x: -0.18, y: 0.28, z: -0.51 }
};

const SAD_POSE = {
  "J_Bip_C_Neck": { x: -0.44, y: -0.06, z: -0.08 }
}

const THINKING_POSE = {
  "J_Bip_C_Head": { x: 0.02, y: -0.06, z: -0.01 },
  "J_Bip_R_Shoulder": { x: -0.03, y: 0.57, z: -0.13 },
  "J_Bip_R_UpperArm": { x: 0, y: 0.14, z: -0.60 },
  "J_Bip_R_LowerArm": { x: 0.26, y: 2.39, z: 0.04 },
  "J_Bip_R_Hand": { x: 1.71, y: 0.07, z: -0.71 },
  "J_Bip_R_Index1": { x: 0, y: 0, z: 0 },
  "J_Bip_R_Index2": { x: 0, y: 0, z: 0 },
  "J_Bip_R_Index3": { x: 0.09, y: 0, z: -0.01 },
  "J_Bip_R_Middle1": { x: 0.09, y: 0, z: -1.63 },
  "J_Bip_R_Middle2": { x: 0.09, y: 0, z: -1.12 },
  "J_Bip_R_Middle3": { x: 0.09, y: 0, z: -1.0 },
  "J_Bip_R_Ring1": { x: 0.09, y: 0, z: -1.75 },
  "J_Bip_R_Ring2": { x: 0.09, y: 0, z: -1.36 },
  "J_Bip_R_Ring3": { x: 0.09, y: 0, z: -0.54 },
  "J_Bip_R_Little1": { x: 0.09, y: 0, z: -1.34 },
  "J_Bip_R_Little2": { x: 0.09, y: 0, z: -1.63 },
  "J_Bip_R_Little3": { x: 0.09, y: 0, z: -0.42 },
  "J_Bip_R_Thumb1": { x: 0.23, y: 0.16, z: 0.26 },
  "J_Bip_R_Thumb2": { x: -0.1, y: -1.34, z: -0.64 },
  "J_Bip_R_Thumb3": { x: -0.1, y: -0.85, z: 0.26 }
};

//Names
let currentMood = "Neutral";
let thinking = false;
let t = 0;
let lastGazeChange = 0;
let lastBlinkTime = 0;
let gazeTarget = new THREE.Vector3(0, 1.4, 4);
let isMouseActive = false;
let mouseTimer;
let basePoseCaptured = false;
let basePose = {}; 

const { scene, camera, renderer, controls } = initScene();
loadAvatar(scene, BONE_DATA);
const lerp = (a, b, t) => a + (b - a) * t;
function captureBasePose() {
    if (!avatarData.boneMap) return;
    Object.keys(avatarData.boneMap).forEach(name => {
        const bone = avatarData.boneMap[name];
        basePose[name] = {
            x: bone.rotation.x,
            y: bone.rotation.y,
            z: bone.rotation.z
        };
    });
    basePoseCaptured = true;
    console.log("✓ Base pose captured for all bones.");
}

function syncMood(mood) { currentMood = mood; }
function syncThinking(state) { thinking = state; }

window.addEventListener('mousemove', (event) => {
    isMouseActive = true;
    const mouseYPercent = event.clientY / window.innerHeight;
    const mouseXPercent = event.clientX / window.innerWidth;
    gazeTarget.x = (mouseXPercent - 0.5) * 4;
    gazeTarget.y = 1.2 + (mouseYPercent * 1.6); 
    gazeTarget.z = 2; 
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => { isMouseActive = false; }, 3000);
});

function updateGaze(headBone) {
    if (!headBone) return;
    if (!isMouseActive) {
        if (Date.now() - lastGazeChange > 3000 + Math.random() * 2000) {
            gazeTarget.x = (Math.random() - 0.5) * 2;
            gazeTarget.y = 1.2 + (Math.random() * 0.4);
            gazeTarget.z = 4; 
            lastGazeChange = Date.now();
        }
    }
    const dummy = new THREE.Object3D();
    const worldPos = new THREE.Vector3();
    headBone.getWorldPosition(worldPos);
    dummy.position.copy(worldPos);
    dummy.lookAt(gazeTarget);
    const followSpeed = isMouseActive ? 0.05 : 0.02;
    headBone.quaternion.slerp(dummy.quaternion, followSpeed);
}

function updateBlink(faceMesh) {
    if (!faceMesh) return;
    const now = Date.now();
    const dict = faceMesh.morphTargetDictionary;
    const blinkKey = dict['Blink'] !== undefined ? 'Blink' : 'Fcl_EYE_Close';
    const blinkIdx = dict[blinkKey];
    if (now - lastBlinkTime > 4000) {
        let progress = (now - lastBlinkTime - 4000) / 150; 
        if (progress <= 1) {
            faceMesh.morphTargetInfluences[blinkIdx] = Math.sin(progress * Math.PI);
        } else {
            faceMesh.morphTargetInfluences[blinkIdx] = 0;
            lastBlinkTime = now + (Math.random() * 2000); 
        }
    }
}

function applyPose(targetPose, t = 0.1) {
    const bones = avatarData.boneMap;
    if (!bones) return;

    for (const boneName in targetPose) {
        const bone = bones[boneName];
        if (bone) {
            const target = targetPose[boneName];
            bone.rotation.x = lerp(bone.rotation.x, target.x, t);
            bone.rotation.y = lerp(bone.rotation.y, target.y, t);
            bone.rotation.z = lerp(bone.rotation.z, target.z, t);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    t += 0.05;

    if (avatarData.model) {
        if (!basePoseCaptured && Object.keys(avatarData.boneMap).length > 0) {
            captureBasePose();
        }
        avatarData.lifeTime += 0.03;
        updateBlink(avatarData.blinkMesh);
        const b = avatarData.bones;
        if (thinking) {
            applyPose(THINKING_POSE, 0.08);
            if (b.head) {
                b.head.rotation.x = lerp(b.head.rotation.x, -0.3, 0.1);
                b.head.rotation.y = lerp(b.head.rotation.y, -0.1, 0.1);
            }
        } else if (basePoseCaptured) {
            applyPose(basePose, 0.06);
            if (b.head) {
                if (currentMood === "Neutral") {
                    updateGaze(b.head);
                } else if (currentMood === "Joy") {
                    b.head.rotation.x = lerp(b.head.rotation.x, -0.2, 0.15);
                    b.head.rotation.z = lerp(b.head.rotation.z, 0.25, 0.15);
                } else if (currentMood === "Angry") {
                    b.head.rotation.x = lerp(b.head.rotation.x, 0.4, 0.2);
                    b.head.rotation.y = Math.sin(t * 8) * 0.08;
                } else if (currentMood === "Sorrow") {
                    applyPose(SAD_POSE, 0.08);
                } else if (currentMood === "Fun") {
                    b.head.rotation.z = Math.sin(t * 6) * 0.3;
                    b.head.rotation.x = -0.1;
                }
            }
        }
        avatarData.model.rotation.z = Math.sin(avatarData.lifeTime * 0.5) * 0.01;
        avatarData.model.rotation.x = Math.cos(avatarData.lifeTime * 0.3) * 0.01;
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();

// UI Handling
document.getElementById('sendBtn').onclick = async () => {
    const input = document.getElementById('userInput');
    const chatBox = document.getElementById('chat-messages');
    const text = input.value.trim();

    if (!text) return;

    chatBox.innerHTML += `<div class="user-msg"><b>You:</b> ${text}</div>`;
    input.value = '';

    syncThinking(true);
    setThinking(true);

    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const data = await sendMessage(text);

        syncThinking(false);
        setThinking(false);

        setMood(data.mood);
        syncMood(data.mood);

        chatBox.innerHTML += `<div class="ai-msg"><b>Luna:</b> ${data.response}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (err) {
        syncThinking(false);
        setThinking(false);

        chatBox.innerHTML += `<div class="ai-msg">Error: Luna is offline 😢</div>`;
    }
};
window.handleCommand = (cmd) => {
    document.getElementById('userInput').value = cmd;
    document.getElementById('sendBtn').click();
    document.getElementById('command-menu').classList.remove('active');
};
