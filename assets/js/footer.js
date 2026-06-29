// footer.js - Unified footer renderer for Logbook Plus
document.addEventListener("DOMContentLoaded", function () {
    // 1. Inject footer stylesheet
    if (!document.querySelector('link[href="/assets/css/footer.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/assets/css/footer.css";
        document.head.appendChild(link);
    }

    // 2. Render footer markup
    const sharedFooter = document.getElementById("shared-footer");
    if (!sharedFooter) return;

    sharedFooter.outerHTML = `
    <div class="modern-dark-footer" role="contentinfo">
        <div class="footer-grid-container">
            <!-- Column 1: Brand & Socials -->
            <div class="footer-col brand-col">
                <a href="/" class="footer-brand-logo">
                    <img src="/assets/images/app_logo.png" alt="Logbook Plus"> Logbook Plus
                </a>
                <p class="company-info">Company Name: LOGBOOK PLUS TECHNOLOGY LTD.</p>
                <p class="company-info">Company Address: 319, Janseva CHS, Khindipada, Mulund Goregaon Link Road, Mulund-West, Mumbai, Maharashtra-400082</p>
                <p class="company-info">Contact Us: noreply.logbookpro@gmail.com</p>
                <div class="footer-social-download">
                    <div class="download-app">
                        <h4>Download app</h4>
                        <div class="app-icons">
                            <a href=https://play.google.com/store/apps/details?id=com.logbookplus target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">
                                <i class="fab fa-google-play"></i>
                            </a>
                        </div>
                    </div>
                    <div class="follow-us">
                        <h4>Follow Us</h4>
                        <div class="social-icons">
                            <i class="fa-brands fa-x-twitter"></i>
                            <i class="fab fa-telegram-plane"></i>
                            <i class="fab fa-linkedin-in"></i>
                            <i class="fab fa-youtube"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Column 2: Products -->
            <div class="footer-col">
                <h4>Products</h4>
                <a href="/app/">App</a>
                <a href="/pricing/">Pricing</a>
            </div>

            <!-- Column 3: Resources -->
            <div class="footer-col">
                <h4>Resources</h4>
                <a href="/contact/">Help Center</a>
                <a href="/contact/">FAQ</a>
                <a href="/blog/">Blog</a>
            </div>

            <!-- Column 4: Company -->
            <div class="footer-col">
                <h4>Company</h4>
                <a href="/about/">About Us</a>
                <a href="/privacy/">Privacy Policy</a>
                <a href="/terms/">Terms &amp; Conditions</a>
                <a href="/refund/">Refund Policy</a>
                <a href="/cloud-backup-policy/">Cloud Backup Policy</a>
                <a href="/paid-terms/">Paid User Terms</a>
            </div>
        </div>
        <div class="footer-bottom-bar">
            &copy; ${new Date().getFullYear()} Logbook Plus Technology LTD. All rights reserved.
        </div>
    </div>
    `;
});
