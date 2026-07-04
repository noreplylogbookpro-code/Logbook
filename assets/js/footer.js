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
                    <img src="/assets/images/app_logo.png" alt="Logbook Plus">Logbook Plus
                </a>
                <p class="company-info">Secure, local-first backup management for modern teams and individuals.</p>
                <p class="company-info">Contact Us: support@logbookplus.co.in</p>
                <div class="footer-social-download">
                    <div class="download-app">
                        <h4>Download</h4>
                        <div class="app-icons">
                            <i class="fab fa-apple"></i>
                            <a href="https://play.google.com/store/apps/details?id=com.logbookplus" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none; margin-bottom: 0;">
                                <i class="fab fa-google-play"></i>
                            </a>
                        </div>
                    </div>
                    <div class="follow-us">
                        <h4>Follow</h4>
                        <div class="social-icons">
                            <i class="fab fa-twitter"></i>
                            <i class="fab fa-github"></i>
                            <i class="fab fa-linkedin-in"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Column 2: Product -->
            <div class="footer-col">
                <h4>Product</h4>
                <a href="/">Features</a>
                <a href="/pricing/">Pricing</a>
                <a href="/security/">Security</a>
                <a href="/changelog/">Changelog</a>
            </div>

            <!-- Column 3: Company -->
            <div class="footer-col">
                <h4>Company</h4>
                <a href="/about/">About</a>
                <a href="/blog/">Blog</a>
                <a href="/careers/">Careers</a>
                <a href="/contact/">Contact</a>
            </div>

            <!-- Column 4: Support -->
            <div class="footer-col">
                <h4>Support</h4>
                <a href="/help-center/">Help Center</a>
                <a href="/documentation/">Documentation</a>
                <a href="/community/">Community</a>
                <a href="/status/">Status</a>
            </div>

            <!-- Column 5: Legal -->
            <div class="footer-col">
                <h4>Legal</h4>
                <a href="/terms/">Terms &amp; Conditions</a>
                <a href="/privacy/">Privacy Policy</a>
                <a href="/refund/">Refund Policy</a>
                <a href="/cloud-backup-policy/">Cloud Backup Policy</a>
                <a href="/paid-terms/">Paid User Terms</a>
            </div>
        </div>
        <div class="footer-bottom-bar">
            &copy; ${new Date().getFullYear()} Logbook Plus. All rights reserved.
        </div>
    </div>
    `;
});
