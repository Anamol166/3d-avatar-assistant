import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';

const BONE_DATA = {
    L_Arm: { x: 0.02, y: 0.07, z: 1.29 },
    R_Arm: { x: 0.19, y: -0.36, z: -1.25 }
};

const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.4, 4.5);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 1.4, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

let avatarModel;
let leftArm, rightArm, leftLowerArm, rightLowerArm, rightHand, head, rightShoulder;
let blinkMesh = null; 
let lastBlinkTime = 0;
let blinkDuration = 0.15;
const loader = new GLTFLoader();
loader.load('/assets/character.glb', (gltf) => {
    avatarModel = gltf.scene;
    avatarModel.rotation.y = Math.PI;
    avatarModel.scale.set(1.5, 1.5, 1.5); 
    avatarModel.traverse((node) => {
      if (node.isBone) {
            if (node.name === "J_Bip_L_UpperArm") leftArm = node;
            if (node.name === "J_Bip_R_UpperArm") rightArm = node;
            if (node.name === "J_Bip_L_LowerArm") leftLowerArm = node;
            if (node.name === "J_Bip_R_LowerArm") rightLowerArm = node;
            if (node.name === "J_Bip_R_Hand") rightHand = node;
            if (node.name === "J_Bip_R_Shoulder") rightShoulder = node;
            if (node.name.toLowerCase().includes("head")) head = node;
        }
        if (node.isMesh && node.morphTargetDictionary) {
            if (node.morphTargetDictionary['Blink'] !== undefined || node.morphTargetDictionary['Fcl_EYE_Close'] !== undefined) {
                blinkMesh = node;
            }
        }
        }
    );

    if (leftArm) leftArm.rotation.set(BONE_DATA.L_Arm.x, BONE_DATA.L_Arm.y, BONE_DATA.L_Arm.z);
    if (rightArm) rightArm.rotation.set(BONE_DATA.R_Arm.x, BONE_DATA.R_Arm.y, BONE_DATA.R_Arm.z);
 
    const box = new THREE.Box3().setFromObject(avatarModel);
    const center = box.getCenter(new THREE.Vector3());
    avatarModel.position.set(-center.x, -center.y + 0.9, -center.z);

    scene.add(avatarModel);
});

let lifeTime = 0;
function applyLife() {
    lifeTime += 0.03; 

    if (avatarModel) {
        const breath = Math.sin(lifeTime) * 0.02;
        if (rightArm) rightArm.rotation.z += breath;
        if (leftArm) leftArm.rotation.z -= breath;
        avatarModel.rotation.z = Math.sin(lifeTime * 0.5) * 0.01;
        avatarModel.rotation.x = Math.cos(lifeTime * 0.3) * 0.01;
    }
} 

let gazeTarget = new THREE.Vector3(0, 1.4, 4);
let lastGazeChange = 0;

function updateGaze() {
  
    if (Date.now() - lastGazeChange > 3000 + Math.random() * 2000) {
        gazeTarget.x = (Math.random() - 0.5) * 1.5; 
        gazeTarget.y = 1.3 + (Math.random() * 0.3); 
        lastGazeChange = Date.now();
    }

    if (head) {
     
        const localTarget = gazeTarget.clone();
        const dummy = new THREE.Object3D();
        dummy.position.copy(head.getWorldPosition(new THREE.Vector3()));
        dummy.lookAt(localTarget);
        head.quaternion.slerp(dummy.quaternion, 0.02);
    }
}
let t = 0;
let thinking = false;
let thinkingTimer = 0;

const lerp = (a, b, t) => a + (b - a) * t;
function updateBlink() {
    if (!blinkMesh) return;

    const now = Date.now();
    const blinkKey = blinkMesh.morphTargetDictionary['Blink'] !== undefined ? 'Blink' : 'Fcl_EYE_Close';
    const blinkIdx = blinkMesh.morphTargetDictionary[blinkKey];

    if (now - lastBlinkTime > 4000) {
        let progress = (now - lastBlinkTime - 4000) / (blinkDuration * 1000);
        
        if (progress <= 1) {
            // This creates a smooth open/close motion
            blinkMesh.morphTargetInfluences[blinkIdx] = Math.sin(progress * Math.PI);
        } else {
            blinkMesh.morphTargetInfluences[blinkIdx] = 0;
            // Adds a bit of randomness so she doesn't blink like a robot
            lastBlinkTime = now + (Math.random() * 2000); 
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    t += 0.05;

    if (avatarModel) {
        lifeTime += 0.03; 
        const speed = 0.08; 
        const breath = Math.sin(lifeTime) * 0.02;
        updateBlink(); 
     
        let target = {
            rx: BONE_DATA.R_Arm.x, ry: BONE_DATA.R_Arm.y, rz: BONE_DATA.R_Arm.z,
            rlx: 0, rly: 0, rlz: 0,
            rhx: 0, rhz: 0,
            hx: 0, hy: 0, hz: 0
        };

        if (thinking || thinkingTimer > 0) {
            target = {
                rx: 1.17, ry: -0.58, rz: -0.73,
                rlx: 0.21, rly: 0, rlz: -2.12,
                rhx: -0.37, rhz: -0.37,
                hx: -0.32, hy: -0.05, hz: 0.03
            };
            if (thinkingTimer > 0) thinkingTimer -= 0.05;
        }
        if (rightArm) {
            rightArm.rotation.x = lerp(rightArm.rotation.x, target.rx, speed);
            rightArm.rotation.y = lerp(rightArm.rotation.y, target.ry, speed);
            rightArm.rotation.z = lerp(rightArm.rotation.z, target.rz + breath, speed);
        }

        if (rightLowerArm) {
            // Snappy movement for the elbow
            rightLowerArm.rotation.z = lerp(rightLowerArm.rotation.z, target.rlz, speed);
        }

        if (head) {
            if (!thinking && thinkingTimer <= 0) {
                updateGaze(); // Look around when idle
            } else {
                const jitter = Math.sin(t * 2) * 0.05;
                head.rotation.x = lerp(head.rotation.x, target.hx + jitter, speed);
                head.rotation.y = lerp(head.rotation.y, target.hy, speed);
                head.rotation.z = lerp(head.rotation.z, target.hz, speed);
            }
        }

        if (leftArm) {
            // Subtle breathing on the idle arm
            leftArm.rotation.x = lerp(leftArm.rotation.x, BONE_DATA.L_Arm.x + breath, speed);
        }
        avatarModel.rotation.z = Math.sin(lifeTime * 0.5) * 0.01;
        avatarModel.rotation.x = Math.cos(lifeTime * 0.3) * 0.01;
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('sendBtn').onclick = async () => {
    const input = document.getElementById('userInput');
    const chatBox = document.getElementById('chat-messages');
    const text = input.value.trim();
    if (!text) return;

    chatBox.innerHTML += `<div class="user-msg"><b>YOU:</b> ${text}</div>`;
    input.value = '';

    const loadingDiv = document.createElement("div");
    loadingDiv.className = "ai-msg";
    loadingDiv.innerHTML = "<b>AI:</b> <i>Thinking...</i>";
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    thinking = true; 
    thinkingTimer = 10; 

    try {
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        
        const data = await res.json();
        thinking = false; 
        loadingDiv.innerHTML = `<b>AI:</b> ${data.response}`;
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) {
        thinking = false;
        loadingDiv.innerHTML = `<b style="color:red">AI:</b> Connection error. Check app.py`;
    }
};
