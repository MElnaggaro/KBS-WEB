document.addEventListener("DOMContentLoaded", () => {
    // Force scroll to top on refresh to ensure intro starts at the correct position
    window.scrollTo(0, 0);
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    // Using a new key so it forces the intro to play even if you tested it before
    const introPlayed = localStorage.getItem("introPlayed_v2");
    const introScreen = document.getElementById("intro-screen");
    const title = document.querySelector(".futuristic-title");
    const heartCanvas = document.getElementById("heart-3d-canvas");
    const introPromptContainer = document.querySelector(".intro-click-prompt");
    const introPromptText = document.getElementById("intro-status-text");

    const elementsToHide = document.querySelectorAll(".subtitle, .scroll-hint, .glow-effect, #particle-canvas, #mouse-glow");
    if (elementsToHide.length) {
        gsap.set(elementsToHide, { opacity: 0 });
    }
    const heroSection = document.getElementById("hero");
    if (heroSection) {
        heroSection.classList.add("hide-hero-bg");
    }

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
        let playPromise = heartbeatAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => { audioPlayed = true; }).catch(e => { console.warn("Audio play failed:", e); });
        } else {
            audioPlayed = true;
        }
    }

    let isHeartReady = false;
    let hasClicked = false;
    let introStarted = false;
    let heartMaterials = [];

    function checkStartCondition() {
        if (isHeartReady && hasClicked && !introStarted) {
            introStarted = true;
            
            if (introPromptText) introPromptText.textContent = "INITIALIZING...";
            if (introPromptContainer) introPromptContainer.classList.remove("ready");
            
            gsap.to(introPromptContainer, {
                opacity: 0,
                duration: 0.5,
                delay: 0.1,
                onComplete: () => {
                    // Drop z-index to 0 so the heart is drawn above the black background
                    if (introScreen) introScreen.style.zIndex = "0"; 
                    startIntroTimeline();
                }
            });
        }
    }

    // Audio unlock explicitly inside real click handler
    document.addEventListener("click", () => {
        if (!hasClicked && isHeartReady) {
            hasClicked = true;
            
            // Unlocking AudioContext in Safari/Chrome by explicitly playing from user gesture
            heartbeatAudio.volume = 0;
            heartbeatAudio.play().then(() => {
                heartbeatAudio.pause();
                heartbeatAudio.currentTime = 0;
            }).catch(() => {});

            checkStartCondition();
        }
    });

    // Wait for the 3D heart model to be fully loaded
    window.addEventListener("heart3dReady", () => {
        if (window._heartGroup) {
            window._heartGroup.traverse((child) => {
                if (child.isMesh && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(mat => {
                        mat.transparent = true;
                        mat.opacity = 0;
                        mat.needsUpdate = true; 
                        heartMaterials.push(mat);
                    });
                }
            });
        }
        
        isHeartReady = true;

        if (!hasClicked && introPromptText) {
            introPromptText.textContent = "SYSTEM READY - TAP TO INITIALIZE";
            if (introPromptContainer) introPromptContainer.classList.add("ready");
        }
    });

    function startIntroTimeline() {
        const tl = gsap.timeline({
            onComplete: () => {
                localStorage.setItem("introPlayed_v2", "true");
                
                // EXIT INTRO
                gsap.to("#intro-screen", {
                    opacity: 0,
                    duration: 1.5,
                    onComplete: () => {
                        if (introScreen) introScreen.remove();
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

        // Fade it in slowly
        if (heartMaterials.length > 0) {
            heartMaterials.forEach((mat) => {
                tl.to(mat, { opacity: 1, duration: 2, ease: "power2.inOut" }, 0);
                if(mat.emissive !== undefined) {
                    tl.to(mat, { emissiveIntensity: 0.8, duration: 2, ease: "power1.inOut", yoyo: true, repeat: 1 }, 0);
                }
            });
        }

        // Automatic audio trigger exactly at 1s
        tl.call(() => {
            playHeartbeat();
        }, null, 1);

        // Show title appear
        if (title) {
            tl.fromTo(title, {
                opacity: 0,
                y: 50
            }, {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: "power2.out"
            }, 1.5); // Started at 1.5s
        }

        // Hold for 1 second
        tl.to({}, { duration: 1 });
    }

    // If heart3d is already loaded (e.g., from cache) before this listener was attached:
    if (window._heartGroup) {
        window.dispatchEvent(new Event("heart3dReady"));
    }
});
