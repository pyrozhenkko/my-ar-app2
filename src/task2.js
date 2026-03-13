import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- Scene Setup ---
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  40
);
camera.position.set(0, 1, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// --- AR Button ---
const arButton = ARButton.createButton(renderer);
document.body.appendChild(arButton);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);

const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362d1b, 0.6);
scene.add(hemisphereLight);

// --- Loading Indicator ---
const loadingDiv = document.createElement('div');
loadingDiv.id = 'loading';
loadingDiv.style.cssText =
  'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
  'color:#fff;font-size:20px;font-family:monospace;z-index:100;';
loadingDiv.textContent = 'Loading city model...';
document.body.appendChild(loadingDiv);

// --- GLTF Model Loading ---
const loader = new GLTFLoader();
let model = null;
let mixer = null;

// URL to city GLTF model — placed in public/models/
const MODEL_URL = '/models/rauma_town_hall.glb';

loader.load(
  MODEL_URL,
  (gltf) => {
    model = gltf.scene;

    // Scale & position for Rauma Town Hall
    model.scale.set(0.0016, 0.0016, 0.0016); // 3x smaller as requested
    model.position.set(0, 0, -10); // Placed on the floor and at a distance

    // Traverse and enhance materials
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {
          child.material.side = THREE.FrontSide;
          child.material.needsUpdate = true;
        }
      }
    });

    scene.add(model);

    // Setup animation mixer if model has animations
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
    }

    // Remove loading indicator
    loadingDiv.remove();
    console.log('City model loaded successfully!');
  },
  (progress) => {
    const percent = Math.round((progress.loaded / progress.total) * 100);
    loadingDiv.textContent = `Loading city model... ${percent}%`;
  },
  (error) => {
    console.error('Error loading model:', error);
    loadingDiv.textContent = 'Error loading model!';
    loadingDiv.style.color = '#ff4444';
  }
);

// --- Animation ---
const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // Update animation mixer (for built-in GLTF animations)
  if (mixer) {
    mixer.update(delta);
  }

  // Custom animation: gentle rotation + floating
  if (model) {
    model.rotation.y = elapsed * 0.3;
    model.position.y = 0; // Placed on the floor as requested
  }

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
