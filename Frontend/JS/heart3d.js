/**
 * heart3d.js — Three.js Cinematic Scroll-Driven 3D Heart
 * 
 * Loads a .glb heart model, renders it on a fixed fullscreen canvas,
 * and uses GSAP to smoothly animate position + rotation as the user
 * scrolls between page sections.
 * 
 * Also reacts to diagnosis results with severity-based visual effects:
 * pulsing heartbeat, emissive glow, vibration, and camera shake.
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

// ── Diagnostic glow light — pulsates near the heart ──
const diagGlowLight = new THREE.PointLight(0xff1111, 0, 10);
diagGlowLight.position.set(0, 0, 2);
scene.add(diagGlowLight);

// ============================================================
//  DIAGNOSIS REACTIVE HEART STATE
// ============================================================

// Current animated values (smoothly interpolated)
const heartState = {
    speed: 0,        // Pulse speed multiplier
    glow: 0,         // Emissive intensity (0 = none)
    vibration: 0,    // Positional jitter amplitude
    glowLightIntensity: 0,  // Diagnostic glow light intensity
    bloodSpeed: 0.1, // Particle speed
    bloodIntensity: 0.1, // Particle glow/opacity
};

// Target values — we lerp towards these
const heartTarget = {
    speed: 0,
    glow: 0,
    vibration: 0,
    glowLightIntensity: 0,
    bloodSpeed: 0.1,
    bloodIntensity: 0.1,
};

// Severity presets
const SEVERITY_PRESETS = {
    LOW: {
        speed: 0.5,
        glow: 0.08,
        vibration: 0,
        glowLightIntensity: 0.3,
        bloodSpeed: 0.2,
        bloodIntensity: 0.2,
    },
    MODERATE: {
        speed: 1.0,
        glow: 0.25,
        vibration: 0.002,
        glowLightIntensity: 0.8,
        bloodSpeed: 0.4,
        bloodIntensity: 0.4,
    },
    HIGH: {
        speed: 1.5,
        glow: 0.5,
        vibration: 0.006,
        glowLightIntensity: 1.5,
        bloodSpeed: 0.7,
        bloodIntensity: 0.7,
    },
    CRITICAL: {
        speed: 3.0,
        glow: 1.4,
        vibration: 0.018,
        glowLightIntensity: 3.5,
        bloodSpeed: 1.2,
        bloodIntensity: 1.0,
    },
    IDLE: {
        speed: 0,
        glow: 0,
        vibration: 0,
        glowLightIntensity: 0,
        bloodSpeed: 0.1,
        bloodIntensity: 0.1,
    },
};

// Interpolation speed (how quickly we lerp to target)
const LERP_SPEED = 0.04;

// Track whether a diagnosis is active
let diagnosisActive = false;

// Store the base camera position for camera shake
const baseCameraPos = new THREE.Vector3(0, 0, 5);

// ============================================================
//  updateHeartState — called when diagnosis completes
// ============================================================
function updateHeartState(level) {
    const preset = SEVERITY_PRESETS[level] || SEVERITY_PRESETS.IDLE;
    heartTarget.speed = preset.speed;
    heartTarget.glow = preset.glow;
    heartTarget.vibration = preset.vibration;
    heartTarget.glowLightIntensity = preset.glowLightIntensity;
    heartTarget.bloodSpeed = preset.bloodSpeed;
    heartTarget.bloodIntensity = preset.bloodIntensity;
    diagnosisActive = level !== 'IDLE';
}

// Expose globally so script.js can call it if needed
window.updateHeartState = updateHeartState;

// Listen for diagnosis events from script.js
window.addEventListener('diagnosisResult', (e) => {
    const { urgency } = e.detail;
    updateHeartState(urgency);
});

window.addEventListener('diagnosisReset', () => {
    updateHeartState('IDLE');
});


// ============================================================
//  DIAGNOSTIC SCAN EFFECT
// ============================================================
let scanPlane = null;

// Expose globally to be triggered on form submit
window.runDiagnosticScan = function() {
    return new Promise((resolve) => {
        if (!scanPlane) {
            // Create a transparent plane (Mesh) using PlaneGeometry
            const geometry = new THREE.PlaneGeometry(0.3, 5);
            
            // Apply a glowing red/white gradient material
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 256, 0);
            gradient.addColorStop(0, "rgba(255, 0, 0, 0)");
            gradient.addColorStop(0.3, "rgba(255, 50, 50, 0.4)");
            gradient.addColorStop(0.5, "rgba(255, 255, 255, 1)");
            gradient.addColorStop(0.7, "rgba(255, 50, 50, 0.4)");
            gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 256, 1);
            
            const tex = new THREE.CanvasTexture(canvas);
            
            const material = new THREE.MeshBasicMaterial({
                map: tex,
                transparent: true,
                opacity: 0,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                color: 0xffffff,
                side: THREE.DoubleSide
            });
            scanPlane = new THREE.Mesh(geometry, material);
        }

        // Place the plane in front of the heart inside its group so it rotates with it
        if (window._heartGroup && !scanPlane.parent) {
            window._heartGroup.add(scanPlane);
        }

        // Position: place in front (z=1.5) and left side (x=-2)
        scanPlane.position.set(-2, 0, 1.5);
        scanPlane.material.opacity = 0.6;
        
        // HEART REACTION: Increase heart emissive intensity during scan
        const originalGlow = heartState.glow;
        heartState.glow += 0.5;

        // OPTIONAL POLISH: Add subtle sound (scan beep)
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const audioCtx = new AudioContext();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 1.5);
                gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime + 1.4);
                gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 1.5);
            }
        } catch (e) {
            console.warn("Audio not supported or allowed", e);
        }

        // OPTIONAL POLISH: Add slight camera zoom during scan
        const originalZoom = camera.zoom;
        gsap.to(camera, { 
            zoom: 1.1, 
            duration: 0.5, 
            onUpdate: () => camera.updateProjectionMatrix() 
        });

        // SCAN ANIMATION: Move the scan plane from left to right
        gsap.fromTo(scanPlane.position, 
            { x: -2 },
            {
                x: 2,
                duration: 1.5,
                ease: "power2.inOut",
                onComplete: () => {
                    // CLEANUP: Hide the scan plane after animation
                    gsap.to(scanPlane.material, { opacity: 0, duration: 0.3 });
                    
                    // Revert camera zoom
                    gsap.to(camera, { 
                        zoom: originalZoom, 
                        duration: 0.5, 
                        onUpdate: () => camera.updateProjectionMatrix() 
                    });
                    
                    // Reset heart glow to normal 
                    heartState.glow = originalGlow;
                    
                    resolve();
                }
            }
        );
    });
};



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
let heartMaterials = []; // All mesh materials for emissive control
let mixer = null;
const clock = new THREE.Clock();
let baseScale = 1; // The normalized scale factor from model loading

// ============================================================
//  BLOOD FLOW ANIMATION SYSTEM
// ============================================================
let bloodParticles = null;
let flowPaths = [];
const particleCount = 250;

function initBloodFlow() {
    // 1. Approximate flow paths around heart
    flowPaths = [
        new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 1.2, 0.6),
            new THREE.Vector3(0.5, 0.8, 0.7),
            new THREE.Vector3(0.8, 0, 0.6),
            new THREE.Vector3(0.4, -0.8, 0.5),
            new THREE.Vector3(0, -1.2, 0.1)
        ]),
        new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.1, 1.3, 0.1),
            new THREE.Vector3(-0.6, 0.9, 0.5),
            new THREE.Vector3(-0.7, 0.2, 0.6),
            new THREE.Vector3(-0.3, -0.6, 0.5),
            new THREE.Vector3(0, -1.1, 0.2)
        ]),
        new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.3, 1.1, -0.5),
            new THREE.Vector3(0.6, 0.5, -0.6),
            new THREE.Vector3(0.6, -0.3, -0.5),
            new THREE.Vector3(0.2, -0.9, -0.2),
            new THREE.Vector3(0, -1.2, -0.1)
        ])
    ];

    // 2 & 8. Create particles and BufferGeometry 
    const positions = new Float32Array(particleCount * 3);
    const geometry = new THREE.BufferGeometry();
    const progress = new Float32Array(particleCount);
    const pathIdx = new Int32Array(particleCount);
    const noiseOffsets = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        pathIdx[i] = i % flowPaths.length;
        progress[i] = Math.random(); // 3. Spread along path
        // 9. Add slight offset to form veins
        noiseOffsets[i * 3] = (Math.random() - 0.5) * 0.15;
        noiseOffsets[i * 3 + 1] = (Math.random() - 0.5) * 0.15;
        noiseOffsets[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('progress', new THREE.BufferAttribute(progress, 1));
    geometry.setAttribute('pathIdx', new THREE.BufferAttribute(pathIdx, 1));
    geometry.setAttribute('noiseOffset', new THREE.BufferAttribute(noiseOffsets, 3));

    // 6. Glowing red particle texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32; pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    pGrad.addColorStop(0, 'rgba(255, 100, 100, 1)');
    pGrad.addColorStop(0.3, 'rgba(255, 46, 46, 0.8)');
    pGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 32, 32);
    const pTex = new THREE.CanvasTexture(pCanvas);

    const material = new THREE.PointsMaterial({
        map: pTex,
        size: 0.1, // 2. small particle size
        color: 0xff2e2e, // 2. bright red
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    bloodParticles = new THREE.Points(geometry, material);
    window._heartGroup.add(bloodParticles);
}

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
        baseScale = desiredSize / maxDim;
        heartModel.scale.setScalar(baseScale);

        // Wrap in a group so we can control position/rotation separately
        window._heartGroup = new THREE.Group();
        window._heartGroup.add(heartModel);
        scene.add(window._heartGroup);

        // Initialize blood flow particles now that heart group is ready
        initBloodFlow();

        // Apply initial state (hero)
        const initial = sectionStates[0];
        window._heartGroup.position.set(initial.position.x, initial.position.y, initial.position.z);
        window._heartGroup.rotation.set(initial.rotation.x, initial.rotation.y, initial.rotation.z);
        window._heartGroup.scale.setScalar(initial.scale);

        // ── Collect all materials for emissive control ──
        heartModel.traverse((child) => {
            if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(mat => {
                    // Enable emissive on materials that support it
                    if (mat.emissive !== undefined) {
                        mat.emissive = new THREE.Color(0xff2020);
                        mat.emissiveIntensity = 0;
                        heartMaterials.push(mat);
                    }
                });
            }
        });

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
//  INTERACTIVE HOVER EFFECT
// ============================================================
const mouse = { x: 0, y: 0 };
const targetRotation = { x: 0, y: 0 };

if (!('ontouchstart' in window)) {
    window.addEventListener("mousemove", (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
}

// ============================================================
//  ANIMATION LOOP — with diagnosis reactive effects
// ============================================================
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Update built-in animations
    if (mixer) mixer.update(delta);

    // ── Smooth interpolation towards target state ──
    heartState.speed += (heartTarget.speed - heartState.speed) * LERP_SPEED;
    heartState.glow += (heartTarget.glow - heartState.glow) * LERP_SPEED;
    heartState.vibration += (heartTarget.vibration - heartState.vibration) * LERP_SPEED;
    heartState.glowLightIntensity += (heartTarget.glowLightIntensity - heartState.glowLightIntensity) * LERP_SPEED;
    heartState.bloodSpeed += (heartTarget.bloodSpeed - heartState.bloodSpeed) * LERP_SPEED;
    heartState.bloodIntensity += (heartTarget.bloodIntensity - heartState.bloodIntensity) * LERP_SPEED;

    if (window._heartGroup) {
        // ── 1. IDLE FLOATING (always active) ──
        // Gentle breathing / floating — additive to GSAP-controlled values
        window._heartGroup.position.y += Math.sin(time * 1.5) * 0.0008;
        window._heartGroup.rotation.y += 0.001; // very slow idle spin

        // ── 2. HEARTBEAT PULSE (severity-driven) ──
        if (heartState.speed > 0.01) {
            // Organic heartbeat using a double-pulse waveform
            const beatPhase = (time * heartState.speed) % (Math.PI * 2);
            const beat1 = Math.max(0, Math.sin(beatPhase * 2)) * 0.7;
            const beat2 = Math.max(0, Math.sin(beatPhase * 2 + 1.2)) * 0.3;
            const pulse = (beat1 + beat2) * 0.06;

            // Apply pulse as scale modulation on the inner model
            const s = baseScale * (1 + pulse);
            heartModel.scale.set(s, s, s);
        } else {
            // Smoothly return to normal scale
            const currentS = heartModel.scale.x;
            const targetS = baseScale;
            const newS = currentS + (targetS - currentS) * 0.05;
            heartModel.scale.set(newS, newS, newS);
        }

        // ── 3. EMISSIVE GLOW (severity-driven) ──
        // Pulsing glow that breathes with the heartbeat
        const glowPulse = heartState.speed > 0.01
            ? 1 + Math.sin(time * heartState.speed * 2) * 0.3
            : 1;
        const currentGlow = heartState.glow * glowPulse;

        heartMaterials.forEach(mat => {
            mat.emissiveIntensity = currentGlow;
        });

        // Update diagnostic glow light
        diagGlowLight.intensity = heartState.glowLightIntensity * glowPulse;
        // Position glow light to follow heart group
        diagGlowLight.position.copy(window._heartGroup.position);
        diagGlowLight.position.z += 1.5;

        // ── 4. VIBRATION (severity-driven, natural feel) ──
        if (heartState.vibration > 0.0005) {
            // Use smooth noise-like vibration instead of pure random
            const vibX = Math.sin(time * 47.3) * Math.cos(time * 31.7) * heartState.vibration;
            const vibY = Math.sin(time * 53.1) * Math.cos(time * 29.3) * heartState.vibration;
            window._heartGroup.position.x += vibX;
            window._heartGroup.position.y += vibY;
        }

        // ── 5. CAMERA SHAKE — CRITICAL only ──
        if (heartTarget.speed >= 2.0) {
            // Intensified sinusoidal camera shake for emergency feel
            const shakeIntensity = (heartState.speed - 1.5) * 0.012;
            camera.position.x = baseCameraPos.x + Math.sin(time * 23.7) * shakeIntensity;
            camera.position.y = baseCameraPos.y + Math.sin(time * 19.3) * shakeIntensity;
            camera.position.z = baseCameraPos.z + Math.sin(time * 17.1) * shakeIntensity * 0.3;
        } else {
            // Smoothly return camera to base position
            camera.position.x += (baseCameraPos.x - camera.position.x) * 0.05;
            camera.position.y += (baseCameraPos.y - camera.position.y) * 0.05;
        }

        // ── 6. RIM LIGHT COLOR SHIFT (severity-driven) ──
        // Shift rim light from subtle red to intense crimson with severity
        const rimIntensity = 0.8 + heartState.glow * 1.5;
        rimLight.intensity = rimIntensity;

        // ── 7. HOVER INTERACTION ──
        if (!('ontouchstart' in window)) {
            targetRotation.y = mouse.x * 0.5;
            targetRotation.x = mouse.y * 0.3;

            heartModel.rotation.y += (targetRotation.y - heartModel.rotation.y) * 0.05;
            heartModel.rotation.x += (targetRotation.x - heartModel.rotation.x) * 0.05;

            heartModel.position.x += (mouse.x * 0.2 - heartModel.position.x) * 0.05;
            heartModel.position.y += (mouse.y * 0.2 - heartModel.position.y) * 0.05;
        }

        // ── 8. BLOOD FLOW ANIMATION ──
        if (bloodParticles && flowPaths.length > 0) {
            const positions = bloodParticles.geometry.attributes.position.array;
            const progress = bloodParticles.geometry.attributes.progress.array;
            const paths = bloodParticles.geometry.attributes.pathIdx.array;
            const noise = bloodParticles.geometry.attributes.noiseOffset.array;
            
            // 7. Sync with heartbeat pulse: base speed + slight speed variation with pulse
            const flowPulse = Math.max(0, Math.sin(time * heartState.speed * 2));
            const baseSpeed = heartState.bloodSpeed;
            const currentSpeed = (baseSpeed * 0.3) + (flowPulse * baseSpeed * 0.1); 
            
            for(let i = 0; i < particleCount; i++) {
                // 3. Move along predefined curves
                progress[i] += currentSpeed * delta;
                if (progress[i] >= 1) progress[i] -= 1; // loop
                
                const path = flowPaths[paths[i]];
                const pt = path.getPointAt(progress[i]);
                
                positions[i*3] = pt.x + noise[i*3];
                positions[i*3+1] = pt.y + noise[i*3+1];
                positions[i*3+2] = pt.z + noise[i*3+2];
            }
            bloodParticles.geometry.attributes.position.needsUpdate = true;
            bloodParticles.geometry.attributes.progress.needsUpdate = true;
            
            // 6. Visual effect opacity responding to intensity
            bloodParticles.material.opacity = 0.3 + heartState.bloodIntensity * 0.7;
        }
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

