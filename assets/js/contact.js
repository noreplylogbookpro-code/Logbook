// contact.js — Enhanced with scroll-reveal animations

// Set current year in footer
document.addEventListener('DOMContentLoaded', () => {
  const footerYear = document.getElementById('footerYear');
  if (footerYear) footerYear.innerText = `© ${new Date().getFullYear()}`;

  // ===== Intersection Observer: scroll-reveal animations =====
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -30px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe contact cards with stagger
  const cards = document.querySelectorAll('.contact-card');
  cards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(card);
  });

  // Observe FAQ cards with stagger
  const faqCards = document.querySelectorAll('.faq-card');
  faqCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(card);
  });

  // Observe CTA section
  const cta = document.querySelector('.contact-cta');
  if (cta) observer.observe(cta);

  // Observe contact form container
  const formContainer = document.querySelector('.contact-container');
  if (formContainer) observer.observe(formContainer);

  // Observe section headers
  document.querySelectorAll('.section-header').forEach(el => {
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

  // FAQ Load More Toggle
  const loadMoreBtn = document.getElementById('loadMoreFaqBtn');
  const hiddenFaqs = document.querySelectorAll('.faq-card.hidden-faq');
  
  if (loadMoreBtn) {
    let expanded = false;
    loadMoreBtn.addEventListener('click', () => {
      expanded = !expanded;
      if (expanded) {
        hiddenFaqs.forEach((card, idx) => {
          card.classList.remove('hidden-faq');
          card.style.transitionDelay = `${idx * 0.04}s`;
          // Force layout reflow before adding animate-in class to ensure smooth CSS transition
          void card.offsetHeight;
          card.classList.add('animate-in');
        });
        loadMoreBtn.innerHTML = 'Show Less FAQs <i class="fas fa-chevron-up"></i>';
      } else {
        hiddenFaqs.forEach((card) => {
          card.classList.remove('animate-in');
          card.classList.add('hidden-faq');
        });
        loadMoreBtn.innerHTML = 'Load More FAQs <i class="fas fa-chevron-down"></i>';
        
        // Scroll back to FAQ section header smoothly when collapsing
        const faqHeader = document.querySelector('.faq-section .section-header');
        if (faqHeader) {
          faqHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }
});

// Handle contact form submission (demo / frontend feedback)
const contactForm = document.getElementById('contactForm');
const statusDiv = document.getElementById('formStatus');

if (contactForm) {
  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    // gather form data
    const name = contactForm.querySelector('input[name="name"]').value.trim();
    const email = contactForm.querySelector('input[name="email"]').value.trim();
    const subject = contactForm.querySelector('input[name="subject"]').value.trim();
    const message = contactForm.querySelector('textarea[name="message"]').value.trim();

    if (!name || !email || !subject || !message) {
      statusDiv.innerHTML = '<span style="color:#cc4b3e;"><i class="fas fa-exclamation-circle"></i> Please fill all fields.</span>';
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      statusDiv.innerHTML = '<span style="color:#cc4b3e;"><i class="fas fa-envelope"></i> Enter a valid email address.</span>';
      return;
    }
    if (message.length < 150) {
      statusDiv.innerHTML = '<span style="color:#cc4b3e;"><i class="fas fa-envelope"></i> Message is to short! It must be at least 150 characters long.</span>';
      return;
    }


    // Show loading state
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    statusDiv.innerHTML = '';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });
      const data = await res.json();

      if (res.ok) {
        statusDiv.innerHTML = `<span style="color:#2b7e3a;"><i class="fas fa-check-circle"></i> ${data.message || 'Thank you! Our team will get back to you soon.'}</span>`;
        contactForm.reset();
      } else {
        statusDiv.innerHTML = `<span style="color:#cc4b3e;"><i class="fas fa-times-circle"></i> ${data.error || 'Something went wrong. Please try again.'}</span>`;
      }
    } catch (err) {
      statusDiv.innerHTML = '<span style="color:#cc4b3e;"><i class="fas fa-times-circle"></i> Network error. Please check your connection and try again.</span>';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
      // Clear status message after 6 seconds
      setTimeout(() => {
        if (statusDiv) statusDiv.innerHTML = '';
      }, 6000);
    }
  });
}
