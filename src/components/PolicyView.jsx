import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, BookOpen, Scale, Landmark, RefreshCcw,
  ScrollText, Calendar, ArrowLeft, History, Mail,
  MessageSquare, Bug, Lightbulb, Activity, CheckCircle,
  Users, Briefcase, FileCode, ChevronDown, Search, UserX
} from 'lucide-react';
import CustomSelect from './DropdownMenu.jsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function PolicyView({ initialDoc = 'security', onNavigate }) {
  const [activeDoc, setActiveDoc] = useState(initialDoc);
  const [contactSubject, setContactSubject] = useState('General Inquiry');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactConsent, setContactConsent] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [dynamicBlogs, setDynamicBlogs] = useState([]);
  const [dynamicChangelogs, setDynamicChangelogs] = useState([]);
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    if (initialDoc) {
      setActiveDoc(initialDoc);
      setSelectedBlog(null);
    }
  }, [initialDoc]);

  useEffect(() => {
    const cleanPath = window.location.pathname.replace(/^\/|\/$/g, '');
    if (cleanPath) {
      const validKeys = [
        'security', 'terms', 'privacy', 'refund', 'cloud-backup-policy',
        'paid-terms', 'delete-account', 'changelog', 'careers', 'blog',
        'help-center', 'documentation', 'community', 'contact'
      ];
      if (cleanPath === 'delete-account-policy' || cleanPath === 'account-deletion') {
        setActiveDoc('delete-account');
      } else if (validKeys.includes(cleanPath)) {
        setActiveDoc(cleanPath);
      }
    }

    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/blogs');
        if (res.ok) {
          const data = await res.json();
          setDynamicBlogs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load dynamic blogs:', err);
      }
    };

    const fetchChangelogs = async () => {
      try {
        const res = await fetch('/api/changelogs');
        if (res.ok) {
          const data = await res.json();
          setDynamicChangelogs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load dynamic changelogs:', err);
      }
    };

    fetchBlogs();
    fetchChangelogs();
  }, []);

  const handleDocChange = (key) => {
    setActiveDoc(key);
    setSelectedBlog(null);
    setFaqSearch('');
    setExpandedFaq(null);
    if (typeof onNavigate === 'function') {
      onNavigate(`/${key}/`);
    } else {
      window.history.pushState(null, '', `/${key}/`);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactConsent) {
      alert('Please confirm your privacy consent before submitting.');
      return;
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          subject: contactSubject,
          message: contactMessage.trim(),
          consentGiven: true
        })
      });
      if (res.ok) {
        setContactSent(true);
        setContactName('');
        setContactEmail('');
        setContactMessage('');
        setContactConsent(false);
        setTimeout(() => setContactSent(false), 5000);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit inquiry.');
      }
    } catch {
      setContactSent(true);
      setTimeout(() => setContactSent(false), 4000);
    }
  };

  const blogs = dynamicBlogs;

  const getDefaultBlogImage = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('sec') || cat.includes('crypto')) return '/assets/images/Security.png';
    if (cat.includes('guide') || cat.includes('tutorial') || cat.includes('doc')) return '/assets/images/Guides.png';
    return '/assets/images/General.png';
  };

  const policies = {
    security: {
      title: 'Security Policy',
      updated: 'July 4, 2026',
      icon: ShieldAlert,
      content: (
        <div className="space-y-6">
          <p>At <strong>Logbook Plus</strong>, security is built into our core architecture. While an initial account login is required to get started, we employ a <strong>local-first</strong> approach to personal expense tracking and data management, ensuring your records never leave your control without your explicit request.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>AES-256 Client-Side Encryption</h3>
          <p>All database logs and entry photos created within the Logbook Plus app are locally encrypted at rest on your device using standard military-grade AES-256 encryption. Your authentication credentials and keys are handled securely, and your encryption keys are never transmitted to our servers.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>Secure Cloud Backups & Self-Hosting</h3>
          <p>If you have a premium plan and choose to use our cloud backup service, your backups are encrypted on your local device before transmission. The data remains fully encrypted during transit (TLS 1.3) and is stored in our secure, isolated cloud vault. Alternatively, self-hosted users may configure and utilize their own servers (such as WebDAV or Nextcloud) for backup and restore functions.</p>
          <p><strong>User Responsibility:</strong> You are solely responsible for protecting your backup files and encryption passwords. Uploading unencrypted backup files or failing to secure your password can result in data exposure or a security breach, for which you assume full responsibility. Because client-side encryption is utilized and we do not store your private keys, our team cannot recover your password, read your logs, or decrypt your records if lost.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>Reporting Vulnerabilities</h3>
          <p>We welcome security reports from independent analysts. If you find a potential vulnerability, please reach out to us at: <a href="mailto:support@logbookplus.co.in" className="text-accent-blue hover:underline">support@logbookplus.co.in</a>.</p> </div>
      )
    },
    terms: {
      title: 'Terms of Use',
      updated: 'June 4, 2026',
      icon: Scale,
      content: (
        <div className="space-y-6">
          <p>Welcome to <strong>Logbook Plus</strong>. By downloading, installing, accessing, or using this application, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use the app.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>About Logbook Plus</h3>
          <p>Logbook Plus is an application developed and maintained by an individual developer. The app is provided to users to manage and maintain expense log entries, encrypted backups, and multi-policy data storage. All core functionality works offline, with optional cloud backup to your personal server.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>User Data and Responsibility</h3>
          <p>You are responsible for the accuracy and security of the data you enter into the app. Logbook Plus is not responsible for data loss resulting from device issues, app removal, system resets, or user actions. We strongly recommend regularly backing up your data using the built-in encrypted backup feature.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>Paid Options & Subscriptions</h3>
          <p>Logbook Plus offers paid options and subscriptions within the Android application (e.g., to unlock cloud backup features, extended quota, or other premium functionalities). All paid transactions, in-app purchases, and subscriptions are securely processed through the Google Play Billing system. Your purchases are subject to Google Play’s Terms of Service.</p>
          <p>Subscriptions auto-renew automatically unless cancelled in your Google Play Account settings at least 24 hours before the end of the current billing cycle. Refunds are governed by Google Play Store refund policies and must be requested through Google Play.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>Limitation of Liability</h3>
          <p>Logbook Plus is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, the developer shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the app.</p>
        </div>
      )
    },
    privacy: {
      title: 'Privacy Policy',
      updated: 'October 29, 2026',
      icon: ScrollText,
      content: (
        <div className="space-y-6">
          <p>
            Welcome to <strong>Logbook Plus</strong>. We are committed to safeguarding personal data and respecting your right to privacy in accordance with <strong>India's Digital Personal Data Protection (DPDP) Act, 2023</strong> (and its phased 2025/2026/2027 Rules), the <strong>General Data Protection Regulation (GDPR)</strong>, and the <strong>California Consumer Privacy Act / CPRA (CCPA)</strong>.
          </p>

          <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-2">
            <h4 className="text-sm font-bold text-accent-blue uppercase tracking-wider">Data Fiduciary / Controller Information</h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <strong>Legal Entity:</strong> Aamir Shaikh <br />
              <strong>Operating Domain:</strong> logbookplus.co.in | helpdesk.logbookplus.co.in | re.logbookplus.co.in<br />
              <strong>Jurisdiction:</strong> Republic of India (Governed by DPDP Act, 2023 & Information Technology Act, 2000)
            </p>
          </div>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>1. Designated Grievance Redressal Officer (DPDP Act, 2023)</h3>
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

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>2. Itemized Notice & Personal Data Collected (DPDP Sec 5 & GDPR Art 13)</h3>
          <p>
            We collect and process only the minimal personal data strictly necessary for providing our sovereign logging and cloud backup services:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse" style={{ borderColor: 'var(--border)' }}>
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
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

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>3. Children's Data & Age Verification (DPDP Act Section 9)</h3>
          <p>
            Under Section 9 of the DPDP Act, 2023, an individual below the age of <strong>18 years</strong> is legally designated as a child.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>Logbook Plus does not knowingly collect, process, or monitor personal data of children under 18 without <strong>verifiable parental consent</strong>.</li>
            <li>All individuals registering an account on Logbook Plus must affirmative-declare they are 18 years of age or older during signup.</li>
            <li>We strictly adhere to Section 9(3) prohibition against undertaking tracking, behavioral profiling, or targeted advertising directed at minors.</li>
            <li>For school/campus helpdesk modules, support requests concerning minor students must be submitted solely by authorized school faculty or parents/legal guardians. If we discover any personal data of a minor collected without verified consent, it is immediately purged from our servers.</li>
          </ul>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>4. Data Principal & Data Subject Rights</h3>
          <p>
            Users in India (under DPDP Sections 11–14), the European Union (GDPR Articles 15–22), and California (CCPA/CPRA) enjoy the following actionable statutory rights:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li><strong>Right of Access & Portability (DSAR):</strong> You may inspect your personal data and download a machine-readable JSON copy through your Account Dashboard under <em>"Export Personal Data (DSAR)"</em> or via written request to our Grievance Officer.</li>
            <li><strong>Right to Correction & Completion:</strong> You may correct inaccurate or incomplete credentials directly in settings or via verified support request.</li>
            <li><strong>Right to Erasure / Deletion:</strong> You have an absolute right to permanently delete your account, encrypted vault files, and profile credentials. Self-service instant deletion is available at <a href="/delete-account/" className="text-accent-blue hover:underline">/delete-account/</a>.</li>
            <li><strong>Right to Withdraw Consent:</strong> You may withdraw consent at any time. Withdrawal of newsletter consent is instantaneous via our one-click unsubscribe mechanism.</li>
            <li><strong>Right of Nomination (DPDP Sec 14):</strong> You have the right to nominate another individual who shall, in the event of death or incapacity, exercise your Data Principal rights.</li>
          </ul>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>5. Third-Party Sub-Processors & International Data Transfers</h3>
          <p>
            We do not sell, rent, or trade your personal data. We utilize selected third-party service providers solely for essential operational capabilities:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li><strong>Google Play Billing (Google LLC):</strong> In-app purchase verification and subscription token management. Operates under Google's enterprise privacy framework.</li>
            <li><strong>Cloudflare Inc.:</strong> Edge CDN and DDoS network defense. Traffic is filtered over encrypted TLS 1.3 tunnels.</li>
            <li><strong>Telegram Bot API:</strong> Real-time automated server security alerts and critical error telemetry. Personal identifiers are anonymized/redacted before transmission.</li>
            <li><strong>WhatsApp Cloud / Notification Webhooks:</strong> Transmitting opt-in helpdesk ticket status updates to administrators and requesters.</li>
          </ul>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Any international cross-border transfer of data conforms to Section 16 of the DPDP Act and Standard Contractual Clauses (SCCs) under GDPR Chapter V.
          </p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>6. Security Safeguards & Breach Notification Policy</h3>
          <p>
            In compliance with Section 8(6) of the DPDP Act, Indian CERT-In directions, and GDPR Article 33:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li>All data in transit is encrypted using <strong>TLS 1.3 / HTTPS</strong>. Vault backups are protected locally with user-defined <strong>AES-256</strong> client-side encryption.</li>
            <li>Passwords and security answers are stored using salted one-way <strong>bcrypt hashes</strong> (factor 10).</li>
            <li>In the event of a confirmed personal data security breach, Logbook Plus will notify the <strong>Data Protection Board of India</strong>, the Indian Computer Emergency Response Team (CERT-In) within 6 hours of discovery, and affected Data Principals without undue delay.</li>
          </ul>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>7. California Privacy Disclosures (CCPA / CPRA Notice at Collection)</h3>
          <p>
            Under the California Consumer Privacy Act (CCPA) as amended by the CPRA:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <li><strong>No Sale or Sharing of Personal Information:</strong> We do NOT sell your personal data or share it with third parties for cross-context behavioral advertising.</li>
            <li><strong>Sensitive Personal Information (SPI):</strong> We collect account credentials and security questions solely to secure your account. We do not use or disclose SPI for purposes other than performing the requested service.</li>
            <li><strong>Non-Discrimination:</strong> We do not discriminate against any user for exercising any CCPA/CPRA rights.</li>
          </ul>
        </div>
      )
    },
    refund: {
      title: 'Refund Policy',
      updated: 'June 4, 2026',
      icon: RefreshCcw,
      content: (
        <div className="space-y-6">
          <p>We want to ensure you have a secure experience with our premium features. Below are our policies regarding refunds.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>1. Subscription Refunds</h3>
          <p>Subscriptions purchased via our Android application are processed securely by Google Play. We offer a 7-day refund window from the date of your initial purchase. If you are not satisfied with the premium features within the first 7 days, you may request a full refund.</p>
          <p>Refunds are subject to Google Play's refund policies. After the 7-day window, subscriptions are non-refundable and partial refunds for unused subscription periods will not be issued.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>2. How to Request a Refund</h3>
          <p>To request a refund, you can use the Google Play Store's built-in refund flow. Alternatively, you can contact us at <a href="mailto:support@logbookplus.co.in" className="text-accent-blue hover:underline">support@logbookplus.co.in</a> with your Google Play Transaction ID (GPA.XXXX-XXXX-XXXX-XXXXX). Eligible refund requests submitted within our 7-day window will be processed by us via the Google Play Console within 5–10 business days.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>3. One-Time License Refunds</h3>
          <p>One-time license purchases (e.g., Self-Hosted License) are non-refundable once the license key has been issued or activated. Please carefully review the features before purchasing.</p>
        </div>
      )
    },
    'cloud-backup-policy': {
      title: 'Backup Policy',
      updated: 'June 4, 2025',
      icon: Landmark,
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>1. Cloud Backup Availability</h3>
          <p>Cloud backup is a premium feature available exclusively to users with an active premium subscription. Free users can use local backup (device storage) at no cost and without restrictions.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>2. Storage Limit</h3>
          <p>Premium users are allocated up to 100 MB of cloud storage for backup files. This limit applies to the total size of all backup files stored in the cloud for your account.</p>
          <p>If you reach the 100 MB limit, you must delete older backups before uploading new ones. The app will notify you when you are approaching or have reached the storage limit.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>3. Data Retention</h3>
          <p>Your cloud backups are retained for as long as your premium subscription remains active. Upon expiry or cancellation of your subscription, you will have a 30-day grace period to download your backups. After the 30-day grace period, cloud backup data may be permanently deleted.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>4. Data Security</h3>
          <p>All cloud backup files are transmitted over encrypted HTTPS connections. We do not access the content of your backup files. You may optionally enable AES-256 password encryption for your backups for additional security.</p>
        </div>
      )
    },
    'paid-terms': {
      title: 'Paid User Terms',
      updated: 'June 4, 2026',
      icon: BookOpen,
      content: (
        <div className="space-y-6">
          <p>These Paid User Terms supplement our general Terms of Service and apply specifically to users who have purchased a premium subscription or self-hosted license.</p>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-6">1. Premium Subscription Features</h3>
          <p>By purchasing a premium subscription, you gain access to the following features:</p>
          <ul className="list-disc pl-5 space-y-2 text-zinc-900 dark:text-zinc-400">
            <li>Unlimited daily log entries</li>
            <li>Unlimited monthly exports (Excel, Word, PDF)</li>
            <li>PDF export format</li>
            <li>Premium Analytics Dashboard</li>
            <li>Cloud backup (up to 100 MB)</li>
            <li>Up to 10 photos per entry</li>
            <li>Tags & categories for entries</li>
          </ul>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>2. Subscription Period & Renewal</h3>
          <p>Your premium subscription is billed and processed securely through the Google Play Store. Subscriptions automatically renew at the end of each billing period (monthly or annual, as selected) unless cancelled at least 24 hours before the renewal date.</p>
          <p>You may cancel or manage your subscription at any time through your Google Play Store account settings under "Subscriptions".</p>
        </div>
      )
    },
    'delete-account': {
      title: 'Account Deletion Policy',
      updated: 'October 2026',
      icon: UserX,
      content: (
        <div className="space-y-6">
          <p>
            At <strong>Logbook Plus</strong>, we prioritize user autonomy and transparency regarding data retention. In strict compliance with global privacy regulations and Google Play Account Deletion guidelines, we provide users with simple, self-service tools to permanently delete their account and wipe all stored cloud data at any time.
          </p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>1. Methods to Request Account Deletion</h3>
          <p>You can execute or request account deletion through any of the following channels:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
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

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>2. Security Verification Steps</h3>
          <p>
            To prevent unauthorized account takeovers or accidental data loss, the account deletion procedure requires two-step identity confirmation:
          </p>
          <ol className="list-decimal pl-5 mt-2 space-y-2">
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

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>3. What Data Is Permanently Purged</h3>
          <p>Once identity verification succeeds, our system immediately purges the following data from our cloud infrastructure:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li><strong>Account Identity:</strong> User ID, username, email address, profile avatar, and credentials.</li>
            <li><strong>Encrypted Vault Backups:</strong> All client-side encrypted backup files (.enc, .zip archives) stored in your cloud storage allocation.</li>
            <li><strong>Security Keys:</strong> Hashed passwords, encrypted TOTP secrets, sequence counters, and security questions.</li>
            <li><strong>Active Sessions & Tracking:</strong> Live session tokens, network records, and online activity logs.</li>
          </ul>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>4. Local Device Data</h3>
          <p>
            Because Logbook Plus utilizes a <strong>local-first</strong> offline architecture, account deletion purges all cloud-based copies and tokens. Expense records, logs, and receipt images stored locally on your physical smartphone remain on your device until you clear the app storage or uninstall the application.
          </p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>5. Retention & Grace Periods</h3>
          <p>
            Account deletion is <strong>instantaneous and irreversible</strong>. We maintain zero shadow archives or residual profile snapshots. If you maintain an active Google Play subscription, please cancel it via Google Play Store (under <em>Account → Subscriptions</em>) prior to deleting your account.
          </p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>6. Contact & Support</h3>
          <p>
            If you have questions regarding this policy or need assistance deleting your account, reach out to: <a href="mailto:support@logbookplus.co.in" className="text-accent-blue hover:underline">support@logbookplus.co.in</a>.
          </p>
        </div>
      )
    },
    changelog: {
      title: 'Changelog History',
      updated: dynamicChangelogs[0]?.date || 'Latest Releases',
      icon: History,
      content: (
        <div className="space-y-8">
          {dynamicChangelogs.length > 0 ? (
            dynamicChangelogs.map((item, idx) => (
              <div key={item._id || idx} className={`border-l-2 pl-4 space-y-2 ${idx === 0 ? 'border-accent-purple' : ''}`} style={idx === 0 ? {} : { borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{item.version}</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{item.date}</span>
                  {item.isMajor && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-purple-500/10 text-purple-400 rounded-md border border-purple-500/20">
                      Major Release
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{item.description}</p>
                )}
                {Array.isArray(item.items) && item.items.length > 0 && (
                  <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {item.items.map((bullet, bIdx) => (
                      <li key={bIdx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          ) : (
            <div className="border-l-2 border-accent-purple pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>v2.0.9</span>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>December 2025</span>
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>Added cloud backup support (WebDAV / Nextcloud)</li>
                <li>Added self-hosted server backup sync protocols</li>
                <li>Added Two-Factor Authentication (2FA) for admin dashboard consoles</li>
                <li>Added security questions for local recovery verification</li>
              </ul>
            </div>
          )}
        </div>
      )
    },
    careers: {
      title: 'Careers',
      updated: 'July 2026',
      icon: Briefcase,
      content: (
        <div className="space-y-6">
          <p>We are a distributed team working on sovereign personal cloud products. Join us in building tools that protect financial transparency.</p>

          <div className="p-6 rounded-2xl text-center space-y-4 max-w-lg mx-auto mt-4" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
            <Briefcase className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
            <div className="space-y-1.5">
              <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>No Active Openings</h4>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                We do not have any openings yet.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="mailto:careers@logbookplus.co.in"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                Send Open Application
              </a>
            </div>
          </div>
        </div>
      )
    },
    blog: {
      title: 'Tech Blog',
      updated: 'Regular Updates',
      icon: ScrollText,
      content: selectedBlog ? (
        <div className="space-y-6 text-left">
          <button
            onClick={() => setSelectedBlog(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer mb-2" style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Articles
          </button>

          <div className="space-y-3">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-accent-blue text-xs font-semibold uppercase tracking-wider">
              {selectedBlog.category || 'Guides'}
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight mt-2" style={{ color: 'var(--text-primary)' }}>
              {selectedBlog.title}
            </h2>
            <div className="flex items-center gap-3 pt-2">
              <img
                src={selectedBlog.authorAvatar || '/assets/images/app_logo.webp'}
                alt={selectedBlog.author || 'Logbook Team'}
                className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-white/10 shadow-sm shrink-0"
                onError={(e) => { e.target.src = '/assets/images/app_logo.webp'; }}
              />
              <div>
                <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  {selectedBlog.author || 'Logbook Team'}
                </p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  Published on {selectedBlog.date || (selectedBlog.createdAt ? new Date(selectedBlog.createdAt).toLocaleDateString() : 'July 2026')}
                </p>
              </div>
            </div>
          </div>

          {(selectedBlog.imageUrl || selectedBlog.category) && (
            <div className="w-48 h-48 sm:w-60 sm:h-60 aspect-square rounded-2xl overflow-hidden mx-auto my-4 shadow-md flex items-center justify-center border border-zinc-200 dark:border-white/10" style={{ background: 'var(--bg-input)' }}>
              <img
                src={selectedBlog.imageUrl || getDefaultBlogImage(selectedBlog.category)}
                alt={selectedBlog.title}
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => { e.target.src = getDefaultBlogImage(selectedBlog.category); }}
              />
            </div>
          )}

          <div className="space-y-4 text-sm md:text-base leading-relaxed border-t pt-6 whitespace-pre-wrap" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {selectedBlog.content || ''}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {blogs.length === 0 ? (
              <div className="p-8 rounded-2xl text-center space-y-2" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No blog posts available</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Check back soon for new articles and engineering updates.</p>
              </div>
            ) : (
              blogs.map((post) => (
                <div
                  key={post._id || post.id || post.slug || post.title}
                  onClick={() => setSelectedBlog(post)}
                  className="p-5 rounded-2xl text-left hover:border-accent-blue/30 transition-all cursor-pointer group flex flex-col sm:flex-row gap-4 items-start" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}
                >
                  <div className="w-18 h-18 sm:w-20 sm:h-20 aspect-square rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-zinc-800">
                    <img
                      src={post.imageUrl || getDefaultBlogImage(post.category)}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = getDefaultBlogImage(post.category); }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{post.date || (post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '')}</span>
                      <span className="text-[10px] font-bold text-accent-blue bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">{post.category || 'Guides'}</span>
                    </div>
                    <h4 className="text-base font-bold group-hover:text-accent-blue transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {post.title}
                    </h4>
                    <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--text-muted)' }}>{post.excerpt || (post.content ? post.content.slice(0, 120) + '...' : '')}</p>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <img
                          src={post.authorAvatar || '/assets/images/app_logo.webp'}
                          alt={post.author || 'Logbook Team'}
                          className="w-5 h-5 rounded-full object-cover border border-zinc-200 dark:border-white/10 shrink-0"
                          onError={(e) => { e.target.src = '/assets/images/app_logo.webp'; }}
                        />
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                          {post.author || 'Logbook Team'}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-accent-blue flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Read full article →
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )
    },
    'help-center': {
      title: 'Help Center',
      updated: 'July 2026',
      icon: BookOpen,
      content: (
        <div className="space-y-6">
          <p>Search help resources or view the most common questions regarding Logbook Plus backup recovery.</p>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => {
                setFaqSearch(e.target.value);
                setExpandedFaq(null);
              }}
              placeholder="Search questions or topics..."
              className="w-full rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue/50 transition-colors" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="space-y-3">
            {[
              { q: "What is Logbook Plus?", a: "Logbook Plus is a digital logbook for tracking entries with photos and financial details." },
              { q: "Is my data secure?", a: "Your data is encrypted using AES-256 encryption." },
              { q: "How do I export my data?", a: "Select date range then select to export data in Excel (.xlsx) and Word (.docx)" },
              { q: "Can I attach receipts?", a: "Yes, you can attach multiple receipts to each entry." },
              { q: "Does it support backups?", a: "Both automatic and manual backups are supported." },
              { q: "Is dark mode available?", a: "Yes, dark and light themes are available." },
              { q: "Can I restore data?", a: "You can restore data from encrypted backups." },
              { q: "Is internet required?", a: "No, the app works fully offline." },
              { q: "How can I contact support?", a: "Contact us at support@logbookplus.co.in" },
              { q: "Is the app free?", a: "Yes, core features are free." },
              { q: "Which formats are supported?", a: "Excel (.xlsx) and Word (.docx)." },
              { q: "How do I add an entry?", a: "Tap the + button and fill in the details." },
              { q: "How do I export a backup?", a: "Go to Export → Select date range → Export." },
              { q: "How do I restore a backup?", a: "Go to Settings → Backup → Import Backup." },
              { q: "Where are photos stored?", a: "Photos are stored in app-specific storage and included in backups." },
              { q: "Can I delete an entry?", a: "Yes, long-press an entry and select Delete." },
              { q: "Can I add multiple entries?", a: "No, entries can be added one at a time." },
              { q: "Can I delete multiple entries?", a: "Yes, long-press and select multiple entries to delete." },
              { q: "Can I share my backup?", a: "Yes, backups can be shared securely." },
              { q: "Can I encrypt my backup?", a: "Yes, backups can be encrypted." },
              { q: "Can I change my backup password?", a: "Yes, you can change your backup password anytime." }
            ]
              .filter(faq =>
                faq.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
                faq.a.toLowerCase().includes(faqSearch.toLowerCase())
              )
              .map((faq, index) => {
                const isExpanded = expandedFaq === index;
                return (
                  <div
                    key={index}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden`}
                    style={isExpanded
                      ? { borderColor: 'rgba(96,165,250,0.3)', background: 'rgba(96,165,250,0.05)' }
                      : { borderColor: 'var(--border)', background: 'var(--bg-input)' }}
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : index)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold transition-colors cursor-pointer" style={{ color: 'var(--text-primary)' }}
                    >
                      <span className="text-sm md:text-base leading-snug">{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-accent-blue' : ''
                          }`}
                      />
                    </button>

                    <div
                      className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-48 opacity-100 p-5' : 'max-h-0 opacity-0 pointer-events-none'}`}
                      style={isExpanded ? { borderTop: '1px solid var(--border)' } : {}}
                    >
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{faq.a}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )
    },
    documentation: {
      title: 'API Documentation',
      updated: 'v2.1 API',
      icon: FileCode,
      content: (
        <div className="space-y-6">
          <p>Developers can query sync data and back up SQLite files using our REST endpoint schemas.</p>
          <div className="space-y-4 font-mono text-sm">
            <div className="p-4 rounded-xl space-y-2" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">POST</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>/api/backup/upload</span>
              </div>
              <p className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>Upload an encrypted database file to active backup slot.</p>
              <pre className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Header: Authorization: Bearer &lt;Token&gt;</pre>
            </div>

            <div className="p-4 rounded-xl space-y-2" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-accent-blue text-xs font-bold">GET</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>/api/backup/download</span>
              </div>
              <p className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>Fetch the latest encrypted SQLite backup archive.</p>
            </div>
          </div>
        </div>
      )
    },
    community: {
      title: 'Community channels',
      updated: 'Active channels',
      icon: Users,
      content: (
        <div className="space-y-6">
          <p>Interact with other developers, request feature patches, and help review code packages.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'Discord Server', label: 'Join Chat', desc: 'Interact live with core builders.', link: 'https://discord.gg/dRtT67ehK' },
              { name: 'GitHub Repositories', label: 'Contribute', desc: 'Review open-source client sync plugins.', link: 'https://github.com/noreplylogbookpro-code/Logbook' },
            ].map((node) => (
              <div key={node.name} className="p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-accent-purple/20 transition-all" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                <div className="space-y-1">
                  <h4 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{node.name}</h4>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{node.desc}</p>
                </div>
                <a
                  href={node.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 rounded-xl text-sm font-semibold transition-colors text-center block"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  {node.label}
                </a>
              </div>
            ))}
          </div>
        </div>
      )
    },
    contact: {
      title: 'Contact support',
      updated: '7d Support',
      icon: Mail,
      content: (
        <div className="space-y-6">
          <p>Get in touch with support regarding billing, bug logs, or features.</p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { name: 'Bug Report', icon: Bug },
              { name: 'Feature idea', icon: Lightbulb },
              { name: 'General Support', icon: MessageSquare }
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => setContactSubject(item.name)}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all`}
                style={contactSubject === item.name
                  ? { borderColor: '#60a5fa', background: 'rgba(96,165,250,0.1)', color: 'var(--text-primary)' }
                  : { borderColor: 'var(--border)', background: 'var(--bg-input)', color: 'var(--text-muted)' }}
              >
                <item.icon className="w-6 h-6 text-accent-blue" />
                <span className="text-sm font-semibold">{item.name}</span>
              </button>
            ))}
          </div>

          {contactSent ? (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold text-center animate-pulse">
              Message submitted successfully. Our support team will reply within 24 hours.
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold uppercase block pl-1" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold uppercase block pl-1" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold uppercase block pl-1" style={{ color: 'var(--text-muted)' }}>Message Subject</label>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold uppercase block pl-1" style={{ color: 'var(--text-muted)' }}>Details</label>
                <textarea
                  rows="4"
                  placeholder="Describe your request..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              {/* DPDP / GDPR Affirmative Consent Checkbox */}
              <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <label className="flex items-start gap-2.5 text-xs text-left cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={contactConsent}
                    onChange={(e) => setContactConsent(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-700 accent-blue-500 cursor-pointer"
                    required
                  />
                  <span>
                    I consent to the collection and processing of my name, email address, and inquiry details by Logbook Plus solely for addressing this request in accordance with the <a href="/privacy/" className="text-accent-blue hover:underline">Privacy Policy</a>.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!contactConsent}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      )
    }
  };

  const DocInfo = policies[activeDoc] || policies[initialDoc] || policies.security || Object.values(policies)[0];
  const ActiveIcon = DocInfo?.icon || ShieldAlert;

  return (
    <div className="py-12 md:py-20 w-full max-w-[95%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 md:px-20 relative">

      {/* Mobile Dropdown Nav */}
      <div className="md:hidden mb-6">
        <CustomSelect
          value={activeDoc}
          onChange={(val) => handleDocChange(val)}
          options={Object.keys(policies).map((key) => ({
            value: key,
            label: policies[key].title
          }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
        {/* Sidebar Nav — desktop only */}
        <div className="hidden md:block md:col-span-4 space-y-4">
          <span className="text-md font-bold uppercase tracking-wider block text-left pl-2" style={{ color: 'var(--text-muted)' }}>
            Legal & Documentation
          </span>
          <div className="p-2 rounded-2xl space-y-1 text-left" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
            {Object.keys(policies).map((key) => {
              const item = policies[key];
              const ItemIcon = item.icon;
              const isActive = activeDoc === key;
              return (
                <button
                  key={key}
                  onClick={() => handleDocChange(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all`}
                  style={isActive
                    ? { background: 'linear-gradient(to right, rgba(96,165,250,0.15), rgba(192,132,252,0.15))', color: 'var(--text-primary)', border: '1px solid rgba(96,165,250,0.3)' }
                    : { color: 'var(--text-muted)', border: '1px solid transparent' }}
                >
                  <ItemIcon className={`w-4 h-4 ${isActive ? 'text-accent-blue' : ''}`} style={isActive ? {} : { color: 'var(--text-muted)' }} />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Panel */}
        <div className="col-span-12 md:col-span-8 glass-card rounded-3xl p-6 md:p-8 space-y-6 text-left relative overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-transparent pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-accent-blue border border-blue-500/10">
                <ActiveIcon className="w-5 h-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {DocInfo.title}
              </h1>
            </div>

            <div className="flex items-center gap-1.5 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{DocInfo.updated}</span>
            </div>
          </div>

          <div className="text-sm md:text-base leading-relaxed space-y-4" style={{ color: 'var(--text-secondary)' }}>
            {DocInfo.content}
          </div>
        </div>
      </div>
    </div>
  );
}