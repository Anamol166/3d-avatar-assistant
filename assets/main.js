import { initScene } from './scene.js'; 
import { loadAvatar, avatarData } from './avatar.js';
import { updateMoodUI } from './core/emotion.js';
import { sendMessage } from './core/chat.js';

const BONE_DATA = {
    L_Arm: { x: 0.02, y: 0.07, z: 1.29 },
    R_Arm: { x: 0.19, y: -0.36, z: -1.25 }
};

const EMOTION_LIST = ["Joy", "Angry", "Sorrow", "Fun"];
let currentEmotion = "Neutral";
let thinking = false;
let thinkingTimer = 0;
let t = 0;

// Initialize
const { scene, camera, renderer, controls } = initScene();
loadAvatar(scene, BONE_DATA);

const lerp = (a, b, t) => a + (b - a) * t;

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    t += 0.05;

    if (avatarData.model && avatarData.bones.rightArm) {
        avatarData.lifeTime += 0.03;
        const speed = 0.08;
        const breath = Math.sin(avatarData.lifeTime) * 0.02;

        // Run Blink Logic
        if (avatarData.blinkMesh) {
            const now = Date.now();
            const blinkKey = avatarData.blinkMesh.morphTargetDictionary['Blink'] || 'Fcl_EYE_Close';
            const blinkIdx = avatarData.blinkMesh.morphTargetDictionary[blinkKey];
            if (now - (avatarData.lastBlinkTime || 0) > 4000) {
                let progress = (now - (avatarData.lastBlinkTime || 0) - 4000) / 150;
                if (progress <= 1) {
                    avatarData.blinkMesh.morphTargetInfluences[blinkIdx] = Math.sin(progress * Math.PI);
                } else {
                    avatarData.blinkMesh.morphTargetInfluences[blinkIdx] = 0;
                    avatarData.lastBlinkTime = now + (Math.random() * 2000);
                }
            }
        }

        // Run Mood logic
        updateMoodUI(currentEmotion, thinking);

        // Pose logic
        let target = (thinking || thinkingTimer > 0) ? {
            rx: 1.17, ry: -0.58, rz: -0.73, rlz: -2.12
        } : {
            rx: BONE_DATA.R_Arm.x, ry: BONE_DATA.R_Arm.y, rz: BONE_DATA.R_Arm.z, rlz: 0
        };

        if (thinkingTimer > 0) thinkingTimer -= 0.05;

        // Apply to Bones
        const b = avatarData.bones;
        b.rightArm.rotation.x = lerp(b.rightArm.rotation.x, target.rx, speed);
        b.rightArm.rotation.y = lerp(b.rightArm.rotation.y, target.ry, speed);
        b.rightArm.rotation.z = lerp(b.rightArm.rotation.z, target.rz + breath, speed);
        if (b.rightLowerArm) b.rightLowerArm.rotation.z = lerp(b.rightLowerArm.rotation.z, target.rlz, speed);
        if (b.leftArm) b.leftArm.rotation.x = lerp(b.leftArm.rotation.x, BONE_DATA.L_Arm.x + breath, speed);

        // Body Sway
        avatarData.model.rotation.z = Math.sin(avatarData.lifeTime * 0.5) * 0.01;
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();

// --- Chat Trigger ---
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

    // Emotion logic
    if (responseText.includes("haha") || responseText.includes("lol")) currentEmotion = "Fun";
    else if (responseText.includes("happy")) currentEmotion = "Joy";
    else if (responseText.includes("sorry")) currentEmotion = "Sorrow";
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