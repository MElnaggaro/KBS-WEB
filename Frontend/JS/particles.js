/**
 * Interactive Particle Background
 * Creates a network of particles that react to mouse movement
 */
(function () {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const mouseGlow = document.getElementById('mouse-glow');

    let width, height;
    let mouse = { x: -1000, y: -1000, radius: 180 };
    let particles = [];
    let animationId;

    const CONFIG = {
        particleCount: 120,
        maxSpeed: 0.3,
        particleSize: { min: 1, max: 2.5 },
        connectionDistance: 160,
        mouseRepelRadius: 180,
        mouseRepelForce: 0.08,
        mouseAttractRadius: 300,
        baseColor: { r: 255, g: 46, b: 46 },     // #FF2E2E (Secondary glow red)
        accentColor: { r: 255, g: 107, b: 107 },  // #FF6B6B (Highlight red)
        dimColor: { r: 139, g: 0, b: 0 },         // #8B0000 (Deep blood red)
        lineOpacity: 0.08,
        particleOpacity: { min: 0.1, max: 0.5 },
    };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * CONFIG.maxSpeed;
            this.vy = (Math.random() - 0.5) * CONFIG.maxSpeed;
            this.size = CONFIG.particleSize.min + Math.random() * (CONFIG.particleSize.max - CONFIG.particleSize.min);
            this.baseOpacity = CONFIG.particleOpacity.min + Math.random() * (CONFIG.particleOpacity.max - CONFIG.particleOpacity.min);
            this.opacity = this.baseOpacity;
            this.pulseOffset = Math.random() * Math.PI * 2;
            this.pulseSpeed = 0.005 + Math.random() * 0.01;
        }

        update(time) {
            // Mouse interaction
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONFIG.mouseRepelRadius) {
                // Repel from mouse
                const force = (CONFIG.mouseRepelRadius - dist) / CONFIG.mouseRepelRadius;
                const angle = Math.atan2(dy, dx);
                this.vx += Math.cos(angle) * force * CONFIG.mouseRepelForce;
                this.vy += Math.sin(angle) * force * CONFIG.mouseRepelForce;
                // Brighten near mouse
                this.opacity = Math.min(1, this.baseOpacity + force * 0.5);
            } else if (dist < CONFIG.mouseAttractRadius) {
                // Slight attraction at distance
                const force = (dist - CONFIG.mouseRepelRadius) / (CONFIG.mouseAttractRadius - CONFIG.mouseRepelRadius) * 0.003;
                const angle = Math.atan2(dy, dx);
                this.vx -= Math.cos(angle) * force;
                this.vy -= Math.sin(angle) * force;
                this.opacity = this.baseOpacity;
            } else {
                this.opacity += (this.baseOpacity - this.opacity) * 0.05;
            }

            // Pulse
            this.opacity += Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.05;

            // Damping
            this.vx *= 0.99;
            this.vy *= 0.99;

            // Speed limit
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > CONFIG.maxSpeed * 2) {
                this.vx = (this.vx / speed) * CONFIG.maxSpeed * 2;
                this.vy = (this.vy / speed) * CONFIG.maxSpeed * 2;
            }

            this.x += this.vx;
            this.y += this.vy;

            // Wrap edges
            if (this.x < -10) this.x = width + 10;
            if (this.x > width + 10) this.x = -10;
            if (this.y < -10) this.y = height + 10;
            if (this.y > height + 10) this.y = -10;
        }

        draw() {
            const { r, g, b } = CONFIG.baseColor;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
            ctx.fill();

            // Glow
            if (this.opacity > 0.5) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(this.opacity - 0.5) * 0.15})`;
                ctx.fill();
            }
        }
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < CONFIG.particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function drawConnections() {
        const { r, g, b } = CONFIG.accentColor;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.connectionDistance) {
                    const opacity = (1 - dist / CONFIG.connectionDistance) * CONFIG.lineOpacity;

                    // Boost opacity near mouse
                    const midX = (particles[i].x + particles[j].x) / 2;
                    const midY = (particles[i].y + particles[j].y) / 2;
                    const mouseDist = Math.sqrt(
                        (midX - mouse.x) ** 2 + (midY - mouse.y) ** 2
                    );
                    const mouseBoost = mouseDist < CONFIG.mouseAttractRadius
                        ? (1 - mouseDist / CONFIG.mouseAttractRadius) * 0.25
                        : 0;

                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity + mouseBoost})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    let time = 0;
    function animate() {
        time++;
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => p.update(time));
        drawConnections();
        particles.forEach(p => p.draw());

        animationId = requestAnimationFrame(animate);
    }

    // Mouse tracking
    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        // Move the mouse glow element
        if (mouseGlow) {
            mouseGlow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
            mouseGlow.style.opacity = '1';
        }
    });

    document.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
        if (mouseGlow) {
            mouseGlow.style.opacity = '0';
        }
    });

    window.addEventListener('resize', () => {
        resize();
    });

    // Init
    resize();
    createParticles();
    animate();
})();
