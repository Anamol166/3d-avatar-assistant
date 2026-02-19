import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';
//Data//
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
//---------------//
//Camera//
const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);


const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.4, 2.5); 

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 1.2, 0);
controls.minDistance = 1.0;   
controls.maxDistance = 3.5;  
controls.enablePan = false;   
controls.maxPolarAngle = Math.PI / 2; 
controls.minPolarAngle = 0.5;

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);
//-------------------//
//Command open bar//
const cmdBtn = document.getElementById('commandBtn');
const cmdMenu = document.getElementById('command-menu');

cmdBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    cmdMenu.classList.toggle('active');
});
document.addEventListener('click', () => {
    cmdMenu.classList.remove('active');
});

window.handleCommand = (commandText) => {
    const input = document.getElementById('userInput');
    input.value = commandText;
    cmdMenu.classList.remove('active');

    document.getElementById('sendBtn').click();
};
//-----------------//
//Model//
let avatarModel;
let leftArm, rightArm, leftLowerArm, rightLowerArm, rightHand, head, rightShoulder;
let blinkMesh = null; 
let lastBlinkTime = 0;
let blinkDuration = 0.15;

const roomLoader = new GLTFLoader();
roomLoader.load('/assets/textures/room.glb', (gltf) => {
    const room = gltf.scene;
    room.position.set(1.45, 0.10, -6.20);
    room.scale.set(0.50, 0.50, 0.50);
    room.traverse((node) => {
        if (node.isMesh) {
            node.receiveShadow = true;
            node.castShadow = true;
            if(node.material.map) node.material.map.encoding = THREE.sRGBEncoding;
        }
    });

    scene.add(room);
});
const loader = new GLTFLoader();
loader.load('/assets/character.glb', (gltf) => {
    avatarModel = gltf.scene;
    avatarModel.rotation.y = Math.PI;
    avatarModel.scale.set(1.5, 1.5, 1.5); 
    avatarModel.position.set(0.0, 0.0, 0.0);
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
//----------------------//
let lifeTime = 0;
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
            blinkMesh.morphTargetInfluences[blinkIdx] = Math.sin(progress * Math.PI);
        } else {
            blinkMesh.morphTargetInfluences[blinkIdx] = 0;
            lastBlinkTime = now + (Math.random() * 2000); 
        }
    }
}

let currentEmotion = "Neutral";

const EMOTION_LIST = ["Joy", "Angry", "Sorrow", "Fun"]; 
function updateFacialExpressions() {
    if (!blinkMesh) return; 

    const dictionary = blinkMesh.morphTargetDictionary;
    const influences = blinkMesh.morphTargetInfluences;

    EMOTION_LIST.forEach(name => {
        const index = dictionary[name];
        if (index === undefined) return;
        const targetValue = (currentEmotion === name) ? 1.0 : 0.0;
        influences[index] = THREE.MathUtils.lerp(influences[index], targetValue, 0.1);
    });
}
function updateMoodUI() {
    const fill = document.getElementById('mood-fill');
    const statusText = document.getElementById('status-text'); // HTML ID
    const moodDisplay = document.getElementById('mood-display'); // HTML ID
    const panel = document.getElementById('ai-mood-panel');

    if (!fill || !statusText || !moodDisplay) return;

    const config = EMOTIONS[currentEmotion] || EMOTIONS.Neutral;

    statusText.innerText = thinking ? "THINKING..." : "IDLE";
    statusText.style.color = thinking ? "#ffeb3b" : "#00d4ff";
    
    moodDisplay.innerText = config.name;
    moodDisplay.style.color = config.color;
    

    fill.style.backgroundColor = config.color;
    panel.style.borderLeftColor = config.color;
    
    if (thinking) {
        fill.style.width = "30%";
    } else {
        fill.style.width = (currentEmotion === "Neutral") ? "60%" : "100%";
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
        updateFacialExpressions(); 
        updateMoodUI();

        let target = (thinking || thinkingTimer > 0) ? {
            rx: 1.17, ry: -0.58, rz: -0.73,
            rlz: -2.12, hx: -0.32, hy: -0.05, hz: 0.03
        } : {
            rx: BONE_DATA.R_Arm.x, ry: BONE_DATA.R_Arm.y, rz: BONE_DATA.R_Arm.z,
            rlz: 0, hx: 0, hy: 0, hz: 0
        };

        if (thinkingTimer > 0) thinkingTimer -= 0.05;
        if (rightArm) {
            rightArm.rotation.x = lerp(rightArm.rotation.x, target.rx, speed);
            rightArm.rotation.y = lerp(rightArm.rotation.y, target.ry, speed);
            rightArm.rotation.z = lerp(rightArm.rotation.z, target.rz + breath, speed);
        }
        if (rightLowerArm) rightLowerArm.rotation.z = lerp(rightLowerArm.rotation.z, target.rlz, speed);

        if (head) {
            if (!thinking && thinkingTimer <= 0) {
                updateGaze(); 
            } else {
                head.rotation.x = lerp(head.rotation.x, target.hx + (Math.sin(t * 2) * 0.05), speed);
                head.rotation.y = lerp(head.rotation.y, target.hy, speed);
                head.rotation.z = lerp(head.rotation.z, target.hz, speed);
            }
        }

        if (leftArm) leftArm.rotation.x = lerp(leftArm.rotation.x, BONE_DATA.L_Arm.x + breath, speed);
        avatarModel.rotation.z = Math.sin(lifeTime * 0.5) * 0.01;
        avatarModel.rotation.x = Math.cos(lifeTime * 0.3) * 0.01;
    }

    controls.update();
    renderer.render(scene, camera);
}
animate()

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

    chatBox.innerHTML += `<div class="user-msg"><b>You:</b> ${text}</div>`;
    input.value = '';

    const loadingDiv = document.createElement("div");
    loadingDiv.className = "ai-msg";
    loadingDiv.innerHTML = "<b>Luna:</b> <i>Thinking...</i>";
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    thinking = true; 
    thinkingTimer = 10; 
    currentEmotion = "Neutral"; 

    try {
      
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        
        const data = await res.json();
        const responseText = data.response.toLowerCase();
        if (responseText.includes("haha") || responseText.includes("funny") || responseText.includes("lol")) {
            currentEmotion = "Fun";
        } else if (responseText.includes("happy") || responseText.includes("glad") || responseText.includes("wonderful")) {
            currentEmotion = "Joy";
        } else if (responseText.includes("angry") || responseText.includes("stop") || responseText.includes("mad")) {
            currentEmotion = "Angry";
        } else if (responseText.includes("sorry") || responseText.includes("sad") || responseText.includes("unfortunate")) {
            currentEmotion = "Sorrow";
        } else {
            currentEmotion = "Neutral";
        }

        thinking = false; 
        loadingDiv.innerHTML = `<b>AI:</b> ${data.response}`;
        chatBox.scrollTop = chatBox.scrollHeight;
        
        updateMoodUI(); 

    } catch (e) {
        thinking = false;
        loadingDiv.innerHTML = `<b style="color:red">AI:</b> Connection error.`;
    }
};
