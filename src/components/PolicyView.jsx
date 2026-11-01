import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, BookOpen, Scale, Landmark, RefreshCcw,
  ScrollText, Calendar, ArrowLeft, UserX, Cookie, ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function PolicyView({ initialDoc = 'security', onNavigate }) {
  const [activeDoc, setActiveDoc] = useState(initialDoc);

  useEffect(() => {
    if (initialDoc) {
      setActiveDoc(initialDoc);
    }
  }, [initialDoc]);

  useEffect(() => {
    const cleanPath = window.location.pathname.replace(/^\/|\/$/g, '');
    if (cleanPath) {
      const validPolicyKeys = [
        'security', 'terms', 'privacy', 'cookie', 'refund',
        'cloud-backup-policy', 'paid-terms', 'delete-account'
      ];
      if (cleanPath === 'delete-account-policy' || cleanPath === 'account-deletion') {
        setActiveDoc('delete-account');
      } else if (cleanPath === 'cookie-policy' || cleanPath === 'cookies') {
        setActiveDoc('cookie');
      } else if (validPolicyKeys.includes(cleanPath)) {
        setActiveDoc(cleanPath);
      }
    }
  }, []);


  const policies = {
    security: {
      title: 'Security Policy',
      shortTitle: 'Security',
      updated: 'July 4, 2026',
      icon: ShieldAlert,
      content: (
        <div className="space-y-6">
          <p>
            At <strong>Logbook Plus</strong>, security is built into our core architecture. While an initial account login is required to get started, we employ a <strong>local-first</strong> approach to personal expense tracking and data management, ensuring your records never leave your control without your explicit request.
          </p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>AES-256 Client-Side Encryption</h3>
          <p>
            All database logs and entry photos created within the Logbook Plus app are locally encrypted at rest on your device using standard military-grade AES-256 encryption. Your authentication credentials and keys are handled securely, and your encryption keys are never transmitted to our servers.
          </p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>Secure Cloud Backups & Self-Hosting</h3>
          <p>
            If you have a premium plan and choose to use our cloud backup service, your backups are encrypted on your local device before transmission. The data remains fully encrypted during transit (TLS 1.3) and is stored in our secure, isolated cloud vault. Alternatively, self-hosted users may configure and utilize their own servers (such as WebDAV or Nextcloud) for backup and restore functions.
          </p>
          <div className="p-4 rounded-xl border space-y-2 text-xs sm:text-sm" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
            <p className="font-bold text-amber-500">User Responsibility Notice</p>
            <p style={{ color: 'var(--text-secondary)' }}>
              You are solely responsible for protecting your backup files and encryption passwords. Uploading unencrypted backup files or failing to secure your password can result in data exposure or a security breach, for which you assume full responsibility. Because client-side encryption is utilized and we do not store your private keys, our team cannot recover your password, read your logs, or decrypt your records if lost.
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>Reporting Vulnerabilities</h3>
          <p>
            We welcome security reports from independent analysts. If you find a potential vulnerability, please reach out to us at: <a href="mailto:support@logbookplus.co.in" className="text-accent-blue hover:underline">support@logbookplus.co.in</a>.
          </p>
        </div>
      )
    },
    terms: {
      title: 'Terms of Use',
      shortTitle: 'Terms',
      updated: 'June 4, 2026',
      icon: Scale,
      content: (
        <div className="space-y-6">
          <p>
            Welcome to <strong>Logbook Plus</strong>. By downloading, installing, accessing, or using this application, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use the app.
          </p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>About Logbook Plus</h3>
          <p>
            Logbook Plus is an application developed and maintained by an individual developer. The app is provided to users to manage and maintain expense log entries, encrypted backups, and multi-policy data storage. All core functionality works offline, with optional cloud backup to your personal server.
          </p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>User Data and Responsibility</h3>
          <p>
            You are responsible for the accuracy and security of the data you enter into the app. Logbook Plus is not responsible for data loss resulting from device issues, app removal, system resets, or user actions. We strongly recommend regularly backing up your data using the built-in encrypted backup feature.
          </p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>Paid Options & Subscriptions</h3>
          <p>
            Logbook Plus offers paid options and subscriptions within the Android application (e.g., to unlock cloud backup features, extended quota, or other premium functionalities). All paid transactions, in-app purchases, and subscriptions are securely processed through the Google Play Billing system. Your purchases are subject to Google Play’s Terms of Service.
          </p>
          <p>
            Subscriptions auto-renew automatically unless cancelled in your Google Play Account settings at least 24 hours before the end of the current billing cycle. Refunds are governed by Google Play Store refund policies and must be requested through Google Play.
          </p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>Limitation of Liability</h3>
          <p>
            Logbook Plus is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, the developer shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the app.
          </p>
        </div>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      shortTitle: 'Privacy',
      updated: 'October 29, 2026',
      icon: ScrollText,
      content: (
        <div className="space-y-6">
          <p>
            Welcome to <strong>Logbook Plus</strong>. We are committed to safeguarding personal data and respecting your right to privacy in accordance with <strong>India's Digital Personal Data Protection (DPDP) Act, 2023</strong>, the <strong>General Data Protection Regulation (GDPR)</strong>, and the <strong>California Consumer Privacy Act / CPRA (CCPA)</strong>.
          </p>

          <div className="p-4 sm:p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-2">
            <h4 className="text-xs sm:text-sm font-bold text-accent-blue uppercase tracking-wider font-mono">Data Fiduciary / Controller Information</h4>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <strong>Legal Entity:</strong> Aamir Shaikh <br />
              <strong>Operating Domain:</strong> logbookplus.co.in | helpdesk.logbookplus.co.in | re.logbookplus.co.in<br />
              <strong>Jurisdiction:</strong> Republic of India (Governed by DPDP Act, 2023 & Information Technology Act, 2000)
            </p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>1. Designated Grievance Redressal Officer (DPDP Act, 2023)</h3>
          <p>
            Pursuant to Section 5(1)(ii) and Section 8(9) of the Digital Personal Data Protection Act, 2023, Logbook Plus has designated a Grievance Redressal Officer to address queries, consent withdrawals, and complaints from Data Principals:
          </p>
          <div className="p-4 rounded-2xl border space-y-1.5 text-xs font-mono" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
            <p><strong>Designation:</strong> Data Protection & Grievance Redressal Officer</p>
            <p><strong>Contact Email:</strong> <a href="mailto:support@logbookplus.co.in" className="text-accent-blue hover:underline">support@logbookplus.co.in</a></p>
            <p><strong>Postal Address:</strong> 319, Janseva CHS, Khindipada, Mulund West, Maharashtra, India - 400082</p>
            <p><strong>Statutory Redressal Timeline:</strong> Formal acknowledgment within 48 business hours; complete investigation and redressal within <strong>30 calendar days</strong> (well within the statutory 90-day ceiling).</p>
            <p><strong>Appeals & Regulatory Oversight:</strong> If your grievance is unresolved within 30 days, or if you are dissatisfied with our response, you have the statutory right under Section 13(3) of the DPDP Act to file a complaint before the <strong>Data Protection Board of India (DPBI)</strong> via its digital portal.</p>
          </div>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>2. Itemized Notice & Personal Data Collected (DPDP Sec 5 & GDPR Art 13)</h3>
          <p>
            We collect and process only the minimal personal data strictly necessary for providing our sovereign logging and cloud backup services:
          </p>
          <div className="overflow-x-auto -mx-2 px-2 my-4 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-xs text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-input)' }}>
                  <th className="py-2.5 px-3">Data Category</th>
                  <th className="py-2.5 px-3">Specific Purpose</th>
                  <th className="py-2.5 px-3">GDPR Lawful Basis</th>
                  <th className="py-2.5 px-3">Retention Period</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">Account Credentials (Username, Email, Hashed Password, Hashed Security Answer)</td>
                  <td className="py-2.5 px-3">Authentication, account recovery, session management, and access controls.</td>
                  <td className="py-2.5 px-3">Art. 6(1)(b) Contract Performance</td>
                  <td className="py-2.5 px-3">Until account deletion by user.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">Encrypted Cloud Backups (.enc / .sqlite)</td>
                  <td className="py-2.5 px-3">User-requested remote backup synchronization (Premium subscribers only). Client-side encrypted.</td>
                  <td className="py-2.5 px-3">Art. 6(1)(b) Contract Performance</td>
                  <td className="py-2.5 px-3">Active subscription + 30-day grace period post-cancellation.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">Server Security Logs (IP Address, Endpoint, HTTP Status, Method)</td>
                  <td className="py-2.5 px-3">DDoS defense, intrusion detection, API rate limiting, and system diagnostic integrity.</td>
                  <td className="py-2.5 px-3">Art. 6(1)(f) Legitimate Interests</td>
                  <td className="py-2.5 px-3">365 calendar days (1 year) pursuant to CERT-In Directions 2022 & IT Act Sec 70B.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">Newsletter Email Address</td>
                  <td className="py-2.5 px-3">Sending product feature updates and security changelogs.</td>
                  <td className="py-2.5 px-3">Art. 6(1)(a) Freely Given Consent</td>
                  <td className="py-2.5 px-3">Until user unsubscribes or requests deletion.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">Helpdesk Tickets & Inquiries (Name, Phone, Email, Campus/Room)</td>
                  <td className="py-2.5 px-3">Facilitating customer technical support, troubleshooting, and campus IT resolutions.</td>
                  <td className="py-2.5 px-3">Art. 6(1)(b) Service Contract</td>
                  <td className="py-2.5 px-3">180 days following ticket resolution.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>3. Children's Data & Age Verification (DPDP Act Section 9)</h3>
          <p>
            Under Section 9 of the DPDP Act, 2023, an individual below the age of <strong>18 years</strong> is legally designated as a child.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>Logbook Plus does not knowingly collect, process, or monitor personal data of children under 18 without <strong>verifiable parental consent</strong>.</li>
            <li>All individuals registering an account on Logbook Plus must affirmatively declare they are 18 years of age or older during signup.</li>
            <li>We strictly adhere to Section 9(3) prohibition against undertaking tracking, behavioral profiling, or targeted advertising directed at minors.</li>
            <li>For school/campus helpdesk modules, support requests concerning minor students must be submitted solely by authorized school faculty or parents/legal guardians. If we discover any personal data of a minor collected without verified consent, it is immediately purged from our servers.</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>4. Data Principal & Data Subject Rights</h3>
          <p>
            Users in India (under DPDP Sections 11–14), the European Union (GDPR Articles 15–22), and California (CCPA/CPRA) enjoy the following actionable statutory rights:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li><strong>Right of Access & Portability (DSAR):</strong> You may inspect your personal data and download a machine-readable JSON copy through your Account Dashboard under <em>"Export Personal Data (DSAR)"</em> or via written request to our Grievance Officer.</li>
            <li><strong>Right to Correction & Completion:</strong> You may correct inaccurate or incomplete credentials directly in settings or via verified support request.</li>
            <li><strong>Right to Erasure / Deletion:</strong> You have an absolute right to permanently delete your account, encrypted vault files, and profile credentials. Self-service instant deletion is available at <a href="/delete-account/" className="text-accent-blue hover:underline">/delete-account/</a>.</li>
            <li><strong>Right to Withdraw Consent:</strong> You may withdraw consent at any time. Withdrawal of newsletter consent is instantaneous via our one-click unsubscribe mechanism.</li>
            <li><strong>Right of Nomination (DPDP Sec 14):</strong> You have the right to nominate another individual who shall, in the event of death or incapacity, exercise your Data Principal rights.</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>5. Third-Party Sub-Processors & International Data Transfers</h3>
          <p>
            We do not sell, rent, or trade your personal data. We utilize selected third-party service providers solely for essential operational capabilities:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li><strong>Google Play Billing (Google LLC):</strong> In-app purchase verification and subscription token management. Operates under Google's enterprise privacy framework.</li>
            <li><strong>Cloudflare Inc.:</strong> Edge CDN and DDoS network defense. Traffic is filtered over encrypted TLS 1.3 tunnels.</li>
            <li><strong>Telegram Bot API:</strong> Real-time automated server security alerts and critical error telemetry. Personal identifiers are anonymized/redacted before transmission.</li>
            <li><strong>WhatsApp Cloud / Notification Webhooks:</strong> Transmitting opt-in helpdesk ticket status updates to administrators and requesters.</li>
          </ul>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Any international cross-border transfer of data conforms to Section 16 of the DPDP Act and Standard Contractual Clauses (SCCs) under GDPR Chapter V.
          </p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>6. Security Safeguards & Breach Notification Policy</h3>
          <p>
            In compliance with Section 8(6) of the DPDP Act, Indian CERT-In directions, and GDPR Article 33:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>All data in transit is encrypted using <strong>TLS 1.3 / HTTPS</strong>. Vault backups are protected locally with user-defined <strong>AES-256</strong> client-side encryption.</li>
            <li>Passwords and security answers are stored using salted one-way <strong>bcrypt hashes</strong> (factor 10).</li>
            <li>In the event of a confirmed personal data security breach, Logbook Plus will notify the <strong>Data Protection Board of India</strong>, the Indian Computer Emergency Response Team (CERT-In) within 6 hours of discovery, and affected Data Principals without undue delay.</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>7. California Privacy Disclosures (CCPA / CPRA Notice at Collection)</h3>
          <p>
            Under the California Consumer Privacy Act (CCPA) as amended by the CPRA:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li><strong>No Sale or Sharing of Personal Information:</strong> We do NOT sell your personal data or share it with third parties for cross-context behavioral advertising.</li>
            <li><strong>Sensitive Personal Information (SPI):</strong> We collect account credentials and security questions solely to secure your account. We do not use or disclose SPI for purposes other than performing the requested service.</li>
            <li><strong>Non-Discrimination:</strong> We do not discriminate against any user for exercising any CCPA/CPRA rights.</li>
          </ul>
        </div>
      )
    },
    cookie: {
      title: 'Cookie & Storage Policy',
      shortTitle: 'Cookies',
      updated: 'November 2026',
      icon: Cookie,
      content: (
        <div className="space-y-6">
          <p>
            At <strong>Logbook Plus</strong>, we hold an uncompromising commitment to privacy by design. We do <strong>NOT</strong> deploy tracking cookies, advertising pixels (e.g. Meta, TikTok), or behavioral tracking scripts. All browser storage used is strictly necessary for basic system operation and offline expense tracking.
          </p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>1. What Storage Mechanisms We Use</h3>
          <p>
            Unlike typical web apps that place invasive cross-site identifiers on your browser, Logbook Plus utilizes modern browser storage strictly for local-first utility:
          </p>
          <div className="overflow-x-auto -mx-2 px-2 my-4 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-xs text-left border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)', background: 'var(--bg-input)' }}>
                  <th className="py-2.5 px-3">Storage Item</th>
                  <th className="py-2.5 px-3">Mechanism</th>
                  <th className="py-2.5 px-3">Purpose</th>
                  <th className="py-2.5 px-3">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">logbook_session_token</td>
                  <td className="py-2.5 px-3 font-mono">Secure Cookie / LocalStorage</td>
                  <td className="py-2.5 px-3">Maintains authenticated user session for private dashboard access.</td>
                  <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">Strictly Essential</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">theme</td>
                  <td className="py-2.5 px-3 font-mono">LocalStorage</td>
                  <td className="py-2.5 px-3">Remembers user preference for Dark Mode or Light Mode.</td>
                  <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">Strictly Essential</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">logbook_selected_lang</td>
                  <td className="py-2.5 px-3 font-mono">LocalStorage</td>
                  <td className="py-2.5 px-3">Preserves your preferred language selection across visits.</td>
                  <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">Strictly Essential</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">privacy_notice_acknowledged</td>
                  <td className="py-2.5 px-3 font-mono">LocalStorage</td>
                  <td className="py-2.5 px-3">Remembers that you have reviewed the storage & privacy notice.</td>
                  <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">Strictly Essential</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-200">Private Database (IndexedDB)</td>
                  <td className="py-2.5 px-3 font-mono">IndexedDB</td>
                  <td className="py-2.5 px-3">Stores encrypted personal ledger entries locally on your device for offline access.</td>
                  <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">Strictly Essential</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>2. Zero Advertising & Tracking Cookies</h3>
          <p>
            In compliance with the <strong>DPDP Act, 2023 (India)</strong> and <strong>ePrivacy Directive / GDPR (EU)</strong>, we do not require a deceptive cookie consent wall because:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>We do not set third-party marketing or profiling cookies.</li>
            <li>We do not build cross-device advertising graphs or sell browsing analytics to data brokers.</li>
            <li>All stored preferences reside strictly on your own hardware.</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>3. Third-Party SDK & Resource Audit</h3>
          <p>
            We periodically audit all client-side dependencies to prevent unauthorized data telemetry:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li><strong>Fonts (SIL Open Font License):</strong> Google Fonts serves <em>Plus Jakarta Sans</em> and <em>JetBrains Mono</em> strictly as static stylesheets; requests are unauthenticated and contain no tracking cookies.</li>
            <li><strong>Icons:</strong> Open-source SVG vectors (Lucide) rendered directly in React components without external network beacons.</li>
            <li><strong>Google Play Billing:</strong> In-app purchase validation on Android is processed through official Google Play OS APIs; no third-party marketing trackers are packaged.</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>4. How to Clear Local Storage</h3>
          <p>
            You have full control over your local device storage. You can purge all tokens, preferences, and cached assets at any time:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>In Chrome/Edge: <em>Settings → Privacy and security → Delete browsing data → Cookies and other site data</em>.</li>
            <li>In Firefox: <em>Settings → Privacy & Security → Cookies and Site Data → Clear Data</em>.</li>
            <li>In Safari: <em>Settings → Privacy → Manage Website Data → Remove All</em>.</li>
            <li>In Android App: <em>Settings → Apps → Logbook Plus → Storage & Cache → Clear Storage</em>.</li>
          </ul>
        </div>
      )
    },
    refund: {
      title: 'Refund Policy',
      shortTitle: 'Refunds',
      updated: 'June 4, 2026',
      icon: RefreshCcw,
      content: (
        <div className="space-y-6">
          <p>We want to ensure you have a secure experience with our premium features. Below are our policies regarding refunds.</p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>1. Subscription Refunds</h3>
          <p>Subscriptions purchased via our Android application are processed securely by Google Play. We offer a 7-day refund window from the date of your initial purchase. If you are not satisfied with the premium features within the first 7 days, you may request a full refund.</p>
          <p>Refunds are subject to Google Play's refund policies. After the 7-day window, subscriptions are non-refundable and partial refunds for unused subscription periods will not be issued.</p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>2. How to Request a Refund</h3>
          <p>To request a refund, you can use the Google Play Store's built-in refund flow. Alternatively, you can contact us at <a href="mailto:support@logbookplus.co.in" className="text-accent-blue hover:underline">support@logbookplus.co.in</a> with your Google Play Transaction ID (GPA.XXXX-XXXX-XXXX-XXXXX). Eligible refund requests submitted within our 7-day window will be processed by us via the Google Play Console within 5–10 business days.</p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>3. One-Time License Refunds</h3>
          <p>One-time license purchases (e.g., Self-Hosted License) are non-refundable once the license key has been issued or activated. Please carefully review the features before purchasing.</p>
        </div>
      )
    },
    'cloud-backup-policy': {
      title: 'Backup Policy',
      shortTitle: 'Cloud Backup',
      updated: 'June 4, 2025',
      icon: Landmark,
      content: (
        <div className="space-y-6">
          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>1. Cloud Backup Availability</h3>
          <p>Cloud backup is a premium feature available exclusively to users with an active premium subscription. Free users can use local backup (device storage) at no cost and without restrictions.</p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>2. Storage Limit</h3>
          <p>Premium users are allocated up to 100 MB of cloud storage for backup files. This limit applies to the total size of all backup files stored in the cloud for your account.</p>
          <p>If you reach the 100 MB limit, you must delete older backups before uploading new ones. The app will notify you when you are approaching or have reached the storage limit.</p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>3. Data Retention</h3>
          <p>Your cloud backups are retained for as long as your premium subscription remains active. Upon expiry or cancellation of your subscription, you will have a 30-day grace period to download your backups. After the 30-day grace period, cloud backup data may be permanently deleted.</p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>4. Data Security</h3>
          <p>All cloud backup files are transmitted over encrypted HTTPS connections. We do not access the content of your backup files. You may optionally enable AES-256 password encryption for your backups for additional security.</p>
        </div>
      )
    },
    'paid-terms': {
      title: 'Paid User Terms',
      shortTitle: 'Paid Terms',
      updated: 'June 4, 2026',
      icon: BookOpen,
      content: (
        <div className="space-y-6">
          <p>These Paid User Terms supplement our general Terms of Service and apply specifically to users who have purchased a premium subscription or self-hosted license.</p>
          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>1. Premium Subscription Features</h3>
          <p>By purchasing a premium subscription, you gain access to the following features:</p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>Unlimited daily log entries</li>
            <li>Unlimited monthly exports (Excel, Word, PDF)</li>
            <li>PDF export format</li>
            <li>Premium Analytics Dashboard</li>
            <li>Cloud backup (up to 100 MB)</li>
            <li>Up to 10 photos per entry</li>
            <li>Tags & categories for entries</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>2. Subscription Period & Renewal</h3>
          <p>Your premium subscription is billed and processed securely through the Google Play Store. Subscriptions automatically renew at the end of each billing period (monthly or annual, as selected) unless cancelled at least 24 hours before the renewal date.</p>
          <p>You may cancel or manage your subscription at any time through your Google Play Store account settings under "Subscriptions".</p>
        </div>
      )
    },
    'delete-account': {
      title: 'Account Deletion Policy',
      shortTitle: 'Delete Account',
      updated: 'October 2026',
      icon: UserX,
      content: (
        <div className="space-y-6">
          <p>
            At <strong>Logbook Plus</strong>, we prioritize user autonomy and transparency regarding data retention. In strict compliance with global privacy regulations and Google Play Account Deletion guidelines, we provide users with simple, self-service tools to permanently delete their account and wipe all stored cloud data at any time.
          </p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>1. Methods to Request Account Deletion</h3>
          <p>You can execute or request account deletion through any of the following channels:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>
              <strong>Self-Service via Web Vault Dashboard:</strong> Log in to your vault at <a href="/app/" className="text-accent-blue hover:underline">logbookplus.co.in/app</a>, open the <strong>Account Manager</strong> menu in the navigation bar, and click <strong>Delete Account</strong>.
            </li>
            <li>
              <strong>Self-Service via Android App:</strong> Open Logbook Plus on your device, navigate to <em>Settings → Account Security → Delete Account</em>.
            </li>
            <li>
              <strong>Manual Support Request:</strong> If you no longer have access to the app or device, contact our privacy team at <a href="mailto:support@logbookplus.co.in" className="text-accent-blue hover:underline">support@logbookplus.co.in</a> from your registered email with the subject <em>"Account Deletion Request"</em>. Manual requests are verified and processed within 48 to 72 business hours.
            </li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>2. Security Verification Steps</h3>
          <p>
            To prevent unauthorized account takeovers or accidental data loss, the account deletion procedure requires two-step identity confirmation:
          </p>
          <ol className="list-decimal pl-5 mt-2 space-y-2 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>
              <strong>Email Verification OTP:</strong> A single-use 6-digit confirmation code is generated and dispatched to your registered account email. This OTP expires after 10 minutes.
            </li>
            <li>
              <strong>Second-Factor Identity Challenge:</strong> Depending on your account security setup, you will be prompted for:
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Your <strong>6-digit Authenticator 2FA code</strong> (if Two-Factor Authentication is active), or</li>
                <li>Your registered <strong>Security Question Answer</strong> (if 2FA is not active), or</li>
                <li>Your account <strong>Password</strong> (if recovery questions are not configured).</li>
              </ul>
            </li>
          </ol>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>3. What Data Is Permanently Purged</h3>
          <p>Once identity verification succeeds, our system immediately purges the following data from our cloud infrastructure:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li><strong>Account Identity:</strong> User ID, username, email address, profile avatar, and credentials.</li>
            <li><strong>Encrypted Vault Backups:</strong> All client-side encrypted backup files (.enc, .zip archives) stored in your cloud storage allocation.</li>
            <li><strong>Security Keys:</strong> Hashed passwords, encrypted TOTP secrets, sequence counters, and security questions.</li>
            <li><strong>Active Sessions & Tracking:</strong> Live session tokens, network records, and online activity logs.</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>4. Local Device Data</h3>
          <p>
            Because Logbook Plus utilizes a <strong>local-first</strong> offline architecture, account deletion purges all cloud-based copies and tokens. Expense records, logs, and receipt images stored locally on your physical smartphone remain on your device until you clear the app storage or uninstall the application.
          </p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>5. Retention & Grace Periods</h3>
          <p>
            Account deletion is <strong>instantaneous and irreversible</strong>. We maintain zero shadow archives or residual profile snapshots. If you maintain an active Google Play subscription, please cancel it via Google Play Store (under <em>Account → Subscriptions</em>) prior to deleting your account.
          </p>

          <h3 className="text-lg sm:text-xl font-bold mt-6" style={{ color: 'var(--text-primary)' }}>6. Contact & Support</h3>
          <p>
            If you have questions regarding this policy or need assistance deleting your account, reach out to: <a href="mailto:support@logbookplus.co.in" className="text-accent-blue hover:underline">support@logbookplus.co.in</a>.
          </p>
        </div>
      )
    }
  };

  const currentDocKey = policies[activeDoc] ? activeDoc : (policies[initialDoc] ? initialDoc : 'security');
  const DocInfo = policies[currentDocKey];
  const ActiveIcon = DocInfo?.icon || ShieldAlert;

  return (
    <div className="py-10 sm:py-16 md:py-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-left">
      {/* Ambient background glow */}
      <div className="absolute top-10 left-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none -z-10 bg-indigo-500/10 dark:bg-indigo-500/15" />
      <div className="absolute top-20 right-1/4 w-80 h-80 rounded-full blur-[100px] pointer-events-none -z-10 bg-blue-500/10 dark:bg-blue-500/15" />

      {/* Centered Status Pill Badge */}
      <div className="max-w-4xl mx-auto w-full mb-6 flex">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border shadow-xs bg-zinc-100 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 relative flex">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          </span>
          Statutory Document • DPDP Act (India)
        </div>
      </div>

      {/* Main Standalone Policy Content Container */}
      <motion.div
        key={currentDocKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto w-full rounded-3xl border p-6 sm:p-8 md:p-12 space-y-6 sm:space-y-8 shadow-sm backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-zinc-200/90 dark:border-zinc-800 transition-all duration-300 hover:shadow-xl"
      >
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 sm:pb-8 border-zinc-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-accent-blue border border-blue-500/20 shrink-0 transition-transform duration-300 hover:scale-105">
              <ActiveIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-blue block">
                Official Governance
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
                {DocInfo.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border w-fit" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-input)' }}>
            <Calendar className="w-3.5 h-3.5 text-accent-blue" />
            <span>Last Updated: {DocInfo.updated}</span>
          </div>
        </div>

        {/* Document Body */}
        <div className="text-xs sm:text-sm md:text-base leading-relaxed space-y-6 max-w-none" style={{ color: 'var(--text-secondary)' }}>
          {DocInfo.content}
        </div>

        {/* Footer verification note */}
        <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono border-zinc-200/80 dark:border-zinc-800" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Audited & DPDP Compliant (Republic of India)</span>
          </div>
          <span>support@logbookplus.co.in</span>
        </div>
      </motion.div>
    </div>
  );
}