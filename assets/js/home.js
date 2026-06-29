// home.js
// Dynamic footer year
document.addEventListener('DOMContentLoaded', () => {
    const footerYear = document.getElementById('footerYear');
    if (footerYear) footerYear.innerText = `© ${new Date().getFullYear()}`;

    // ===== Intersection Observer: animate cards & CTA on scroll =====
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe feature cards with stagger
    const cards = document.querySelectorAll('.modern-card');
    cards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.12}s`;
        observer.observe(card);
    });

    // Observe CTA section
    const cta = document.querySelector('.cta-modern');
    if (cta) observer.observe(cta);

    // Observe section headers
    document.querySelectorAll('.section-header').forEach(el => {
        el.classList.add('reveal-on-scroll');
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    sectionObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        sectionObserver.observe(el);
    });

    // ===== Animated stat number counter =====
    const statNumbers = document.querySelectorAll('.stat-number');
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const text = el.textContent.trim();
                // Extract number portion
                const match = text.match(/^(\d+)/);
                if (match) {
                    const target = parseInt(match[1]);
                    const suffix = text.replace(match[1], '');
                    animateCounter(el, 0, target, suffix, 1200);
                }
                statObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(num => statObserver.observe(num));

    function animateCounter(el, start, end, suffix, duration) {
        const startTime = performance.now();
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * eased);
            el.textContent = current + suffix;
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    }

    // ===== Parallax-lite for hero orbs (on mouse move) =====
    const hero = document.querySelector('.hero-modern');
    if (hero) {
        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            hero.style.setProperty('--mx', `${x * 30}px`);
            hero.style.setProperty('--my', `${y * 20}px`);
        });
    }

    // ===== Dynamic website page setup configurations =====
    fetch('/api/site-settings')
        .then(res => res.json())
        .then(settings => {
            if (settings.heroBadge) {
                const badgeEl = document.getElementById('hero-badge');
                if (badgeEl) badgeEl.innerHTML = `<i class="fas fa-shield-alt"></i> ${settings.heroBadge}`;
            }
            if (settings.heroTitle) {
                const titleEl = document.getElementById('hero-title');
                if (titleEl) titleEl.innerHTML = settings.heroTitle;
            }
            if (settings.heroDesc) {
                const descEl = document.getElementById('hero-desc');
                if (descEl) descEl.textContent = settings.heroDesc;
            }
            if (settings.featuresTitle) {
                const fTitleEl = document.getElementById('features-title');
                if (fTitleEl) fTitleEl.textContent = settings.featuresTitle;
            }
            if (settings.featuresDesc) {
                const fDescEl = document.getElementById('features-desc');
                if (fDescEl) fDescEl.textContent = settings.featuresDesc;
            }
        })
        .catch(err => console.error('Failed to load site settings:', err));
});