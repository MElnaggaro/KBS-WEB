/**
 * heart3d.js — Three.js Cinematic Scroll-Driven 3D Heart
 * 
 * Loads a .glb heart model, renders it on a fixed fullscreen canvas,
 * and uses GSAP to smoothly animate position + rotation as the user
 * scrolls between page sections.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ============================================================
//  SCENE SETUP
// ============================================================
const canvas = document.getElementById('heart-3d-canvas');
const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);

// ============================================================
//  LIGHTING — medical / cinematic feel
// ============================================================
// Soft ambient fill with warm red tint
const ambientLight = new THREE.AmbientLight(0xffa0a0, 0.6);
scene.add(ambientLight);

// Key light — warm directional
const keyLight = new THREE.DirectionalLight(0xfff0f0, 1.8);
keyLight.position.set(5, 5, 5);
scene.add(keyLight);

// Rim light — subtle red glow from behind
const rimLight = new THREE.DirectionalLight(0xff3333, 0.8);
rimLight.position.set(-3, -2, -4);
scene.add(rimLight);

// Fill light — cool tone from below
const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
fillLight.position.set(-2, -5, 2);
scene.add(fillLight);

// Subtle point light for depth
const pointLight = new THREE.PointLight(0xff2020, 0.5, 15);
pointLight.position.set(0, 0, 3);
scene.add(pointLight);

// ============================================================
//  SECTION STATES — position & rotation for each scroll section
// ============================================================
const sectionStates = [
    {
        // Hero — centered, slightly tilted, prominent
        id: 'hero',
        position: { x: 0.8, y: 0, z: 0 },
        rotation: { x: -0.2, y: 0.3, z: 0 },
        scale: 1.0,
    },
    {
        // Showcase — slide to right, rotate to show side
        id: 'heart-showcase',
        position: { x: 2.2, y: 0.3, z: 0.5 },
        rotation: { x: -0.1, y: -1.2, z: 0.15 },
        scale: 1.1,
    },
    {
        // CTA — center stage, dramatic angle
        id: 'cta-section',
        position: { x: -1.5, y: -0.2, z: 0.3 },
        rotation: { x: 0.3, y: 2.0, z: -0.1 },
        scale: 1.15,
    },
    {
        // Assessment — small, tucked to left
        id: 'assessment',
        position: { x: -2.5, y: 0.5, z: -1 },
        rotation: { x: 0.1, y: 3.5 + Math.PI * 8, z: 0.2 },
        scale: 0.7,
    },
    {
        // Results — center but pulled back
        id: 'results',
        position: { x: 2.0, y: -0.3, z: -0.5 },
        rotation: { x: -0.3, y: 5.0 + Math.PI * 8, z: -0.15 },
        scale: 0.8,
    },
];

// ============================================================
//  MODEL LOADING
// ============================================================
let heartModel = null;
let mixer = null;
const clock = new THREE.Clock();

const loader = new GLTFLoader();

loader.load(
    'models/heart.glb',
    (gltf) => {
        heartModel = gltf.scene;

        // Center the model geometry
        const box = new THREE.Box3().setFromObject(heartModel);
        const center = box.getCenter(new THREE.Vector3());
        heartModel.position.sub(center); // center at origin

        // Calculate scale to normalize model size
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const desiredSize = 2.5;
        const scaleFactor = desiredSize / maxDim;
        heartModel.scale.setScalar(scaleFactor);

        // Wrap in a group so we can control position/rotation separately
        window._heartGroup = new THREE.Group();
        window._heartGroup.add(heartModel);
        scene.add(window._heartGroup);

        // Apply initial state (hero)
        const initial = sectionStates[0];
        window._heartGroup.position.set(initial.position.x, initial.position.y, initial.position.z);
        window._heartGroup.rotation.set(initial.rotation.x, initial.rotation.y, initial.rotation.z);
        window._heartGroup.scale.setScalar(initial.scale);

        // If the model has animations, play them
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(heartModel);
            gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                action.play();
            });
        }

        // Signal ready
        window.dispatchEvent(new CustomEvent('heart3dReady'));
        console.log('♥ 3D Heart model loaded and ready');
    },
    (progress) => {
        const pct = ((progress.loaded / progress.total) * 100).toFixed(0);
        console.log(`Loading heart model: ${pct}%`);
    },
    (error) => {
        console.error('Failed to load heart model:', error);
    }
);

// ============================================================
//  SCROLL → GSAP ANIMATION
// ============================================================
let currentStateId = null;

function getActiveSection() {
    // Check all section states; find the one most visible in viewport
    let bestMatch = null;
    let bestScore = -Infinity;

    for (const state of sectionStates) {
        const el = document.getElementById(state.id);
        if (!el) continue;

        // Skip hidden sections
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        const rect = el.getBoundingClientRect();
        const viewportH = window.innerHeight;

        // Score: how much of the section is in the viewport center
        const sectionCenter = rect.top + rect.height / 2;
        const viewportCenter = viewportH / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);
        const score = -distance; // closer to center = better

        // Only consider sections partially visible
        if (rect.bottom > 0 && rect.top < viewportH) {
            if (score > bestScore) {
                bestScore = score;
                bestMatch = state;
            }
        }
    }

    return bestMatch;
}

function animateToState(state) {
    if (!window._heartGroup || !state || currentStateId === state.id) return;
    currentStateId = state.id;

    // Animate position
    gsap.to(window._heartGroup.position, {
        x: state.position.x,
        y: state.position.y,
        z: state.position.z,
        duration: 1.2,
        ease: 'power3.out',
        overwrite: true,
    });

    // Animate rotation
    gsap.to(window._heartGroup.rotation, {
        x: state.rotation.x,
        y: state.rotation.y,
        z: state.rotation.z,
        duration: 1.2,
        ease: 'power3.out',
        overwrite: true,
    });

    // Animate scale
    gsap.to(window._heartGroup.scale, {
        x: state.scale,
        y: state.scale,
        z: state.scale,
        duration: 1.2,
        ease: 'power3.out',
        overwrite: true,
    });
}

// Throttled scroll handler
let scrollTicking = false;
window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(() => {
            const activeState = getActiveSection();
            if (activeState) {
                animateToState(activeState);
            }
            scrollTicking = false;
        });
        scrollTicking = true;
    }
}, { passive: true });

// Also listen for section visibility changes (assessment/results toggle)
const sectionObserver = new MutationObserver(() => {
    const activeState = getActiveSection();
    if (activeState) animateToState(activeState);
});

// Observe display changes on hidden sections
['assessment', 'results'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        sectionObserver.observe(el, { attributes: true, attributeFilter: ['class', 'style'] });
    }
});

// ============================================================
//  ANIMATION LOOP
// ============================================================
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Update built-in animations
    if (mixer) mixer.update(delta);

    // Subtle idle floating effect
    if (window._heartGroup) {
        const time = clock.getElapsedTime();
        // Gentle breathing / floating — additive to GSAP-controlled values
        window._heartGroup.position.y += Math.sin(time * 1.5) * 0.0008;
        window._heartGroup.rotation.y += 0.001; // very slow idle spin
    }

    renderer.render(scene, camera);
}

animate();

// ============================================================
//  RESPONSIVENESS
// ============================================================
window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
