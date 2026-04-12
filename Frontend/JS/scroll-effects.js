/**
 * Scroll-Based UI Effects
 * - Scroll progress bar
 * - Element reveal animations on scroll
 * - Showcase step reveals
 * - Parallax on hero text
 * - Scroll hint fade
 */
(function () {
    // ---- Scroll Progress Bar ----
    const progressBar = document.createElement('div');
    progressBar.id = 'scroll-progress';
    document.body.prepend(progressBar);

    function onScroll() {
        const scrollY = window.scrollY;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;

        // Update scroll progress bar
        progressBar.style.transform = `scaleX(${progress})`;

        // Fade scroll hint
        const scrollHint = document.getElementById('scroll-hint');
        if (scrollHint) {
            scrollHint.style.opacity = Math.max(0, 1 - scrollY / 200);
        }
    }

    // ---- Intersection Observer for Scroll Reveals ----
    const revealElements = document.querySelectorAll('.scroll-reveal');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // ---- Showcase Section: Text Steps Reveal ----
    const showcaseItems = document.querySelectorAll('.showcase-text-item');

    const showcaseObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('step-visible');
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -80px 0px'
    });

    showcaseItems.forEach(el => showcaseObserver.observe(el));

    // ---- Parallax on Hero Elements ----
    function parallaxHero() {
        const scrollY = window.scrollY;
        const heroText = document.querySelector('.hero-text');

        if (heroText && scrollY < window.innerHeight) {
            const factor = scrollY / window.innerHeight;
            heroText.style.transform = `translateY(${scrollY * 0.3}px) scale(${1 - factor * 0.1})`;
            heroText.style.opacity = 1 - factor * 1.2;
        }
    }

    // ---- Combine Scroll Handlers ----
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                onScroll();
                parallaxHero();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // ---- Initialize ----
    onScroll();
})();
