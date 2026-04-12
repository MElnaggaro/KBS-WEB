/**
 * Custom Cursor Implementation
 * Enhances interactivity and syncs with the medical heartbeat effect.
 */

const cursor = document.getElementById("custom-cursor");

// Check if device supports hover (not a touch device)
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (!isTouchDevice && cursor) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    
    // Smooth interpolation targets
    let cursorX = mouseX;
    let cursorY = mouseY;
    
    // Listen to mousemove to get target coordinates
    window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    // Check if we are hovering over an interactive element
    let isHovering = false;
    
    // Function to check and update hover state
    const addHoverListeners = () => {
        const interactables = document.querySelectorAll('button, a, input, select, label, .progress-step');
        
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => isHovering = true);
            el.addEventListener('mouseleave', () => isHovering = false);
        });
    };
    
    // Initial listeners
    addHoverListeners();
    
    // Re-bind listeners if DOM changes (optional, but good for dynamic apps)
    const observer = new MutationObserver(() => {
        addHoverListeners();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Ensure cursor is positioned relative to top left for transform translate3d to work perfectly
    cursor.style.left = '0px';
    cursor.style.top = '0px';

    // Animation loop
    const animateCursor = (time) => {
        // 1. Smooth interpolation
        // Speed up the lerp so it follows closely but stays smooth
        cursorX += (mouseX - cursorX) * 0.2;
        cursorY += (mouseY - cursorY) * 0.2;
        
        // 2. Pulse sync with heartState
        // time is passed by requestAnimationFrame (in ms)
        const t = time * 0.001; // convert to seconds
        
        // Use heartState.speed (or default to 0.5) to sync pulse
        let pulseSpeed = 0.5;
        if (window.heartState && window.heartState.speed) {
            pulseSpeed = window.heartState.speed;
        }

        // Calculate a pulse based on the same beat logic as the heart model
        // heartmodel uses double beat, but a simple sin wave works well for the cursor
        // Or closely matching the heart beat phase
        const beatPhase = (t * pulseSpeed) % (Math.PI * 2);
        const beat1 = Math.max(0, Math.sin(beatPhase * 2)) * 0.7;
        const beat2 = Math.max(0, Math.sin(beatPhase * 2 + 1.2)) * 0.3;
        
        // Final pulse multiplier
        const pulse = pulseSpeed > 0.01 ? (beat1 + beat2) * 0.3 : 0;
        
        // 3. Hover effect
        const hoverScale = isHovering ? 1.5 : 1;
        
        // Combine scales
        const finalScale = hoverScale * (1 + pulse);
        
        // Apply transform via translate3d for hardware acceleration, avoiding costly top/left reflows
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%) scale(${finalScale})`;
        
        requestAnimationFrame(animateCursor);
    };
    
    requestAnimationFrame(animateCursor);
} else if (cursor) {
    // Hide cursor on touch devices to be safe
    cursor.style.display = 'none';
}
