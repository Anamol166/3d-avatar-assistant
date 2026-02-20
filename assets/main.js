import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { initScene } from './scene.js'; 
import { loadAvatar, avatarData } from './avatar.js';
import { updateMoodUI } from './core/emotion.js';
import { sendMessage } from './core/chat.js';

const BONE_DATA = {
    L_Arm: { x: 0.02, y: 0.07, z: 1.29 },
    R_Arm: { x: 0.19, y: -0.36, z: -1.25 }
};

const EMOTIONS = {
    Joy: { color: "#4caf50", name: "HAPPY" },
    Fun: { color: "#ffeb3b", name: "LAUGH" },
    Angry: { color: "#f44336", name: "ANGRY" },
    Sorrow: { color: "#2196f3", name: "SAD" },
    Neutral: { color: "#00d4ff", name: "NEUTRAL" }
};

let currentEmotion = "Neutral";
let thinking = false;
let thinkingTimer = 0;
let t = 0;

const { scene, camera, renderer, controls } = initScene();
loadAvatar(scene, BONE_DATA);

const lerp = (a, b, t) => a + (b - a) * t;
let lastGazeChange = 0;
let lastBlinkTime = 0;
let gazeTarget = new THREE.Vector3(0, 1.4, 4);
let isMouseActive = false;
let mouseTimer;

window.addEventListener('mousemove', (event) => {
    isMouseActive = true;
    const mouseYPercent = event.clientY / window.innerHeight;
    const mouseXPercent = event.clientX / window.innerWidth;
    gazeTarget.x = (mouseXPercent - 0.5) * 4;
    gazeTarget.y = 1.2 + (mouseYPercent * 1.6); 
    gazeTarget.z = 2; 
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => {
        isMouseActive = false;
    }, 3000);
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
    // Detect standard VRM or GLTF naming for blinks
    const dict = faceMesh.morphTargetDictionary;
    const blinkKey = dict['Blink'] !== undefined ? 'Blink' : 'Fcl_EYE_Close';
    const blinkIdx = dict[blinkKey];

    if (now - lastBlinkTime > 4000) {
        let progress = (now - lastBlinkTime - 4000) / 150; // 150ms blink speed
        
        if (progress <= 1) {
            faceMesh.morphTargetInfluences[blinkIdx] = Math.sin(progress * Math.PI);
        } else {
            faceMesh.morphTargetInfluences[blinkIdx] = 0;
            lastBlinkTime = now + (Math.random() * 2000); // Randomize gap between blinks
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    t += 0.05;
    if (avatarData.model && avatarData.bones.rightArm) {
        avatarData.lifeTime += 0.03;
        const b = avatarData.bones; 
        const speed = 0.08;
        const breath = Math.sin(avatarData.lifeTime) * 0.02;
        updateBlink(avatarData.blinkMesh);
        updateMoodUI(currentEmotion, thinking);

        let target = (thinking || thinkingTimer > 0) ? {
            rx: 1.17, ry: -0.58, rz: -0.73,
            rlz: -2.12, hx: -0.32, hy: -0.05, hz: 0.03
        } : {
            rx: BONE_DATA.R_Arm.x, ry: BONE_DATA.R_Arm.y, rz: BONE_DATA.R_Arm.z,
            rlz: 0, hx: 0, hy: 0, hz: 0
        };

        if (thinkingTimer > 0) thinkingTimer -= 0.05;
        if (b.rightArm) {
            b.rightArm.rotation.x = lerp(b.rightArm.rotation.x, target.rx, speed);
            b.rightArm.rotation.y = lerp(b.rightArm.rotation.y, target.ry, speed);
            b.rightArm.rotation.z = lerp(b.rightArm.rotation.z, target.rz + breath, speed);
        }
        
        if (b.rightLowerArm) {
            b.rightLowerArm.rotation.z = lerp(b.rightLowerArm.rotation.z, target.rlz, speed);
        }

        if (b.head) {
            if (!thinking && thinkingTimer <= 0) {
                // PASS the bone to the function
                updateGaze(b.head); 
            } else {
                // Manual thinking rotation
                b.head.rotation.x = lerp(b.head.rotation.x, target.hx + (Math.sin(t * 2) * 0.05), speed);
                b.head.rotation.y = lerp(b.head.rotation.y, target.hy, speed);
                b.head.rotation.z = lerp(b.head.rotation.z, target.hz, speed);
            }
        }

        if (b.leftArm) {
            b.leftArm.rotation.x = lerp(b.leftArm.rotation.x, BONE_DATA.L_Arm.x + breath, speed);
        }
        avatarData.model.rotation.z = Math.sin(avatarData.lifeTime * 0.5) * 0.01;
        avatarData.model.rotation.x = Math.cos(avatarData.lifeTime * 0.3) * 0.01;
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();

document.getElementById('sendBtn').onclick = async () => {
    const input = document.getElementById('userInput');
    const chatBox = document.getElementById('chat-messages');
    const text = input.value.trim();
    if (!text) return;

    chatBox.innerHTML += `<div class="user-msg"><b>You:</b> ${text}</div>`;
    input.value = '';
    thinking = true;
    thinkingTimer = 10;

    const data = await sendMessage(text);
    const responseText = data.response.toLowerCase();

    if (responseText.includes("haha") || responseText.includes("lol")) currentEmotion = "Fun";
    else if (responseText.includes("happy")) currentEmotion = "Joy";
    else if (responseText.includes("sorry")) currentEmotion = "Sorrow";
    else if (responseText.includes("I am angry") || responseText.includes("angry")) currentEmotion = "Angry";
    else currentEmotion = "Neutral";

    thinking = false;
    chatBox.innerHTML += `<div class="ai-msg"><b>Luna:</b> ${data.response}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
};

window.handleCommand = (cmd) => {
    document.getElementById('userInput').value = cmd;
    document.getElementById('sendBtn').click();
    document.getElementById('command-menu').classList.remove('active');
};