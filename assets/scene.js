import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js';

export function initScene() {
    const canvas = document.getElementById('three-canvas');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.4, 2.5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.target.set(0, 1.2, 0);
    controls.maxDistance = 3.5;
    controls.enablePan = false;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Load Room
    const roomLoader = new GLTFLoader();
    roomLoader.load('/assets/textures/room.glb', (gltf) => {
        const room = gltf.scene;
        room.position.set(1.45, 0.10, -6.20);
        room.scale.set(0.50, 0.50, 0.50);
        room.traverse(n => { if(n.isMesh) n.receiveShadow = true; });
        scene.add(room);
    });

    return { scene, camera, renderer, controls };
}