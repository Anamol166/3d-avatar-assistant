import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';

const BONE_DATA = {
    L_Arm: { x: 0.02, y: 0.07, z: 1.29 },
    R_Arm: { x: 0.19, y: -0.36, z: -1.25 }
};

const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();

// 1. SETUP RENDERER & CAMERA
const camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 1000);
// Set alpha to false since we are using a background image/color now
const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: false, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(0, 1.4, 0); 
camera.position.set(0, 1.4, 4.5); 

const loader = new GLTFLoader();
loader.load('/assets/character.glb', (gltf) => {
    const model = gltf.scene;

    model.rotation.y = Math.PI; 

    model.traverse((node) => {
        if (node.isBone) {
            if (node.name === "J_Bip_L_UpperArm") {
                node.rotation.set(BONE_DATA.L_Arm.x, BONE_DATA.L_Arm.y, BONE_DATA.L_Arm.z);
            }
            if (node.name === "J_Bip_R_UpperArm") {
                node.rotation.set(BONE_DATA.R_Arm.x, BONE_DATA.R_Arm.y, BONE_DATA.R_Arm.z);
            }
        }
    });

 
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -center.y + 0.90, -center.z);

    scene.add(model);
});


function animate() {
    requestAnimationFrame(animate);
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

    // 1. Show User Message
    chatBox.innerHTML += `<div class="user-msg"><b>YOU:</b> ${text}</div>`;
    input.value = '';

    // 2. Create "Thinking" Placeholder
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "ai-msg";
    loadingDiv.innerHTML = "<b>AI:</b> <i>Thinking...</i>";
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        
        const data = await res.json();

        // 3. Replace "Thinking" with actual response
        loadingDiv.innerHTML = `<b>AI:</b> ${data.response}`;
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (e) {
        loadingDiv.innerHTML = `<b style="color:red">AI:</b> Connection error. Check app.py`;
    }
};
