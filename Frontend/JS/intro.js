document.addEventListener("DOMContentLoaded", () => {
    // Using a new key so it forces the intro to play even if you tested it before
    const introPlayed = localStorage.getItem("introPlayed_v2");
    const introScreen = document.getElementById("intro-screen");
    const title = document.querySelector(".futuristic-title");
    const titleContainer = document.querySelector(".hero-text");
    const heartCanvas = document.getElementById("heart-3d-canvas");

    // Prevent Replay (Temporarily disabled for testing so you can refresh and see it multiple times)
    /*
    if (introPlayed === "true") {
        if (introScreen) introScreen.remove();
        // Ensure standard animations play if intro is skipped
        if (title) title.style.opacity = 1; 
        return;
    }
    */

    // Instead of elevating z-indexes and risking jumps at the end, 
    // we simply hide the surrounding non-essential elements and fade them in later.
    const elementsToHide = document.querySelectorAll(".subtitle, .scroll-hint, .glow-effect, #particle-canvas, #mouse-glow");
    if (elementsToHide.length) {
        gsap.set(elementsToHide, { opacity: 0 });
    }
    const heroSection = document.getElementById("hero");
    if (heroSection) {
        heroSection.classList.add("hide-hero-bg");
    }

    // Disable CSS animations on the title so GSAP can take over cleanly
    if (title) {
        title.style.animation = "none";
        title.style.opacity = 0;
    }

    // Prepare real heartbeat audio
    let audioPlayed = false;
    const heartbeatAudio = new Audio("assets/audio/heartbeat.mp3");
    
    function playHeartbeat() {
        if(audioPlayed) return;
        
        heartbeatAudio.volume = 0.8;
        // Attempt to play (might be blocked by browser without interaction)
        let playPromise = heartbeatAudio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                audioPlayed = true;
            }).catch(e => {
                console.warn("Heartbeat audio blocked by browser, waiting for user interaction.", e);
                // audioPlayed stays false so click listener can retry
            });
        } else {
            audioPlayed = true;
        }
    }

    // Play heartbeat sound after user interaction (click)
    document.addEventListener("click", () => {
        playHeartbeat();
    }, { once: true });

    // Wait for the 3D heart model to be fully loaded
    window.addEventListener("heart3dReady", () => {
        
        let heartMaterials = [];
        if (window._heartGroup) {
            window._heartGroup.traverse((child) => {
                if (child.isMesh && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(mat => {
                        // Make completely transparent initially safely
                        mat.transparent = true;
                        mat.opacity = 0;
                        mat.needsUpdate = true; // Crucial for Three.js correctly compiling the transparent shader
                        heartMaterials.push(mat);
                    });
                }
            });
        }

        // --- THE TIMELINE ---
        // 1. Fade in heart (0–2s)
        // 2. Play heartbeat (1s) - handled via timing if interaction allowed, else click event
        // 3. Show title (2s)
        // 4. Hold (1s)
        // 5. Fade out intro overlay
        const tl = gsap.timeline({
            onComplete: () => {
                localStorage.setItem("introPlayed_v2", "true");
                
                // EXIT INTRO
                gsap.to("#intro-screen", {
                    opacity: 0,
                    duration: 1.5,
                    onComplete: () => {
                        if (introScreen) introScreen.remove();
                        // Fallback trigger for audio if they missed it during the window
                        playHeartbeat();
                    }
                });

                // Fade back the surrounding elements smoothly
                if (elementsToHide.length) {
                    gsap.to(elementsToHide, { 
                        opacity: 1, 
                        duration: 1.5, 
                        ease: "power2.inOut", 
                        clearProps: "opacity" 
                    });
                }
                if (heroSection) heroSection.classList.remove("hide-hero-bg");
            }
        });

        // Step 2: Fade it in slowly
        if (heartMaterials.length > 0) {
            heartMaterials.forEach((mat) => {
                tl.to(mat, { opacity: 1, duration: 2, ease: "power2.inOut" }, 0);
            });
            
            // Step 5: Subtle glow around heart
            heartMaterials.forEach((mat) => {
                if(mat.emissive !== undefined) {
                    tl.to(mat, { emissiveIntensity: 0.8, duration: 2, ease: "power1.inOut", yoyo: true, repeat: 1 }, 0);
                }
            });
        }

        // Automatic audio trigger at 1s if browser policy allows, otherwise it will just error silently and wait for click
        tl.call(() => {
            playHeartbeat();
        }, null, 1);

        // Step 4: Show title appear at 2s
        if (title) {
            tl.fromTo(title, {
                opacity: 0,
                y: 50
            }, {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: "power2.out"
            }, 2); // Start at exactly 2 seconds
        }

        // Step 6: Hold for 1 second
        tl.to({}, { duration: 1 });
    });

    // If heart3d is already loaded (e.g., from cache) before this listener was attached:
    if (window._heartGroup) {
        window.dispatchEvent(new Event("heart3dReady"));
    }
});
