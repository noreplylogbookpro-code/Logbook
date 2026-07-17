import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, BookOpen, Scale, Landmark, RefreshCcw,
  ScrollText, Calendar, ArrowLeft, History, Mail,
  MessageSquare, Bug, Lightbulb, Activity, CheckCircle,
  Users, Briefcase, FileCode, ChevronDown, Search
} from 'lucide-react';

export default function PolicyView({ initialDoc = 'security', onNavigate }) {
  const [activeDoc, setActiveDoc] = useState(initialDoc);
  const [contactSubject, setContactSubject] = useState('General Inquiry');
  const [contactSent, setContactSent] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [dynamicBlogs, setDynamicBlogs] = useState([]);
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    // Map URL endpoints dynamically to state
    const cleanPath = window.location.pathname.replace(/^\/|\/$/g, '');
    if (policies[cleanPath]) {
      setActiveDoc(cleanPath);
    }

    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/blogs');
        if (res.ok) {
          const data = await res.json();
          setDynamicBlogs(data);
        }
      } catch (err) {
        console.error('Failed to load dynamic blogs:', err);
      }
    };
    fetchBlogs();
  }, []);

  const handleDocChange = (key) => {
    setActiveDoc(key);
    setSelectedBlog(null);
    setFaqSearch('');
    setExpandedFaq(null);
    // Silent URL path rewrite without page refreshes
    window.history.pushState(null, '', `/${key}/`);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
    }, 4000);
  };

  const fallbackBlogs = [
    {
      title: 'Why Local-First Database Design Matters',
      category: 'Database',
      date: 'July 2, 2026',
      excerpt: 'Analyzing latency, server down-time resilience, and zero-telemetry models using sandboxed client-side SQLite targets.',
      content: `At Logbook Plus, we believe that your financial logs should be completely under your control. Standard modern software architecture relies heavily on third-party cloud hosting, which makes your apps dependent on active internet connections, introduces latency, and exposes your telemetry data to server breaches.
      
      Local-first design turns this model on its head. By hosting database read and write instances directly on the client sandbox (e.g. SQLite or NeDB), database write paint speeds average less than 5 milliseconds. Additionally, since all calculations run client-side, the app remains fully functional in offline scenarios (such as flights or remote zones). 
      
      When backups are required, the client encrypts the database locally using military-grade AES-256 before transmitting the payload to the server. The server acts purely as an opaque storage repository, meaning even we cannot decrypt your records. This ensures absolute security and total ownership.`
    },
    {
      title: 'Passphrase Key Derivation on Mobile Devices',
      category: 'Security',
      date: 'June 18, 2026',
      excerpt: 'How we stretch key passwords using cryptographic salts and SHA-256 iterations to ensure secure offline vaults before sync.',
      content: `Passwords by themselves are typically vulnerable to brute-force dictionaries. When you create a password for your encrypted database, standard hashing is not enough. We implement key stretching algorithms to convert standard credentials into mathematically complex encryption keys.
      
      Using client-side cryptographically secure salts combined with iterated SHA-256 rounds, we derive a 256-bit key that is used as the AES encryption vector. This stretching process makes automated GPU-accelerated dictionary attacks computationally expensive and unfeasible.
      
      All key-derivation processes execute locally in sandboxed environment spaces. Your plain-text password is never cached in memory variables and is never transmitted over any network routes. This ensures that even if your device backup is intercepted, the attacker cannot decrypt it without guessing the master password.`
    },
    {
      title: 'Optimizing Node Builds in Unix Subshells',
      category: 'DevOps',
      date: 'May 24, 2026',
      excerpt: 'Guide to running lightweight developer targets and background backup endpoints inside native Unix subshells like Termux.',
      content: `Running local servers on mobile devices or tiny micro-controllers (like Raspberry Pi) requires extreme efficiency. Standard enterprise setups require substantial RAM allocations and daemon configurations that are not available in sandboxed environments.
      
      By optimization of Node.js threads, using lightweight dependencies (such as NeDB instead of MongoDB), and tuning subshell garbage collectors, you can easily host active backup systems with less than 50MB of RAM.
      
      This article guides you through configuring subshell scripts, setting up environment parameters, and establishing clean database compaction routines to keep performance running optimally on low-power devices.`
    }
  ];

  const allBlogs = dynamicBlogs.length > 0 ? dynamicBlogs : fallbackBlogs;

  const policies = {
    security: {
      title: 'Security Policy',
      updated: 'July 4, 2026',
      icon: ShieldAlert,
      content: (
        <div className="space-y-6">
          <p>At <strong>Logbook Plus</strong>, security is built into our core architecture. We employ a <strong>local-first</strong> approach to personal expense tracking and backup logging, ensuring your records never leave your control without your explicit request.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>AES-256 Client-Side Encryption</h3>
          <p>All database logs and entry photos created within the Logbook Plus app are locally encrypted at rest on your device. We use standard military-grade AES-256 encryption. Your master password/keys are hashed cryptographically and are never transmitted to our servers.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>Secure Cloud Backups</h3>
          <p>If you subscribe to our Cloud Backup API, your backups are encrypted on your local device before transmission. The data remains fully encrypted during transit (TLS 1.3) and is stored in our secure, isolated cloud vault as an opaque, encrypted blob. Since we do not store your private keys, our team cannot read your logs or decrypt your records.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>Reporting Vulnerabilities</h3>
          <p>We welcome security reports from independent analysts. If you find a potential vulnerability, please reach out to us at: <a href="mailto:support@logbookplus.co.in" className="text-accent-blue hover:underline">support@logbookplus.co.in</a>.</p>
        </div>
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
      updated: 'June 4, 2026',
      icon: ScrollText,
      content: (
        <div className="space-y-6">
          <p>Thank you for using <strong>Logbook Plus</strong>. We are committed to protecting your privacy and being transparent about how we handle your data.</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>1. Information We Collect</h3>
          <p><strong>Logbook Plus does not collect, store, transmit, or share any personal data</strong> with the developer or with third parties. The application works entirely offline and does not require an account, login, or internet connection for its core functionality.</p>
          <p>For users who choose to purchase premium features or subscriptions via the Android app, transaction processing is handled securely by Google Play. We do not collect, store, or have access to your credit card, bank account, or billing details. We only receive purchase verification tokens and transaction IDs from Google Play to unlock paid features on your device.</p>
          <p>All information you enter in the app (such as expense logs, notes, and attached media) is stored <strong>only on your device or your personal cloud storage</strong> (if you choose to enable encrypted backups).</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>2. Data Stored on Your Device</h3>
          <p>The app stores your data locally in its private storage area. This may include expense log entries, attached images, backup archives, and app settings. Your data is <strong>never uploaded</strong> to our servers or any external service unless you explicitly configure your own cloud destination (e.g., WebDAV, Nextcloud).</p>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>3. Backup and Restore</h3>
          <p>Logbook Plus provides optional backup and restore features so you can protect your data. All backups are encrypted with <strong>AES-256</strong> before leaving your device if you enable encryption. No backup data is ever sent to Logbook Plus infrastructure.</p>
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
          <p>Premium users are allocated up to 240 MB of cloud storage for backup files. This limit applies to the total size of all backup files stored in the cloud for your account.</p>
          <p>If you reach the 240 MB limit, you must delete older backups before uploading new ones. The app will notify you when you are approaching or have reached the storage limit.</p>

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

          <h3 className="text-lg font-bold text-white mt-6">1. Premium Subscription Features</h3>
          <p>By purchasing a premium subscription, you gain access to the following features:</p>
          <ul className="list-disc pl-5 space-y-2" style={{ color: 'var(--text-secondary)' }}>
            <li>Unlimited daily log entries</li>
            <li>Unlimited monthly exports (Excel, Word, PDF)</li>
            <li>PDF export format</li>
            <li>Premium Analytics Dashboard</li>
            <li>Cloud backup (up to 240 MB)</li>
            <li>Up to 10 photos per entry</li>
            <li>Tags & categories for entries</li>
          </ul>

          <h3 className="text-lg font-bold mt-6" style={{ color: 'var(--text-primary)' }}>2. Subscription Period & Renewal</h3>
          <p>Your premium subscription is billed and processed securely through the Google Play Store. Subscriptions automatically renew at the end of each billing period (monthly or annual, as selected) unless cancelled at least 24 hours before the renewal date.</p>
          <p>You may cancel or manage your subscription at any time through your Google Play Store account settings under "Subscriptions".</p>
        </div>
      )
    },
    changelog: {
      title: 'Changelog History',
      updated: 'December 2025',
      icon: History,
      content: (
        <div className="space-y-8">
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
              <li>Integrated Google Play Billing Client 7</li>
              <li>Added profile picture upload and editing features</li>
              <li>Added Hindi, Marathi, and Urdu language layouts</li>
            </ul>
          </div>

          <div className="border-l-2 pl-4 space-y-2" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold" style={{ color: 'var(--text-muted)' }}>v2.0.8</span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>October 2025</span>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              <li>Optimized SQLite cache writing times (Sub-5ms paint times)</li>
              <li>Implemented dynamic bento showcase cards</li>
              <li>Added multi-format export indicators</li>
            </ul>
          </div>
        </div>
      )
    },
    status: {
      title: 'Systems Status',
      updated: 'Live Uptime',
      icon: Activity,
      content: (
        <div className="space-y-6">
          <p>We monitor systems around the clock to ensure reliable encrypted backup synchronizations.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Cloud Backup Relay', status: 'Operational', uptime: '99.98%' },
              { name: 'License Validation API', status: 'Operational', uptime: '100.00%' },
              { name: 'Secure SQLite Vaults', status: 'Operational', uptime: '99.99%' },
              { name: 'WebDAV Sync Gateway', status: 'Operational', uptime: '99.95%' },
            ].map((node) => (
              <div key={node.name} className="p-4 rounded-xl flex flex-col justify-between" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                <span className="text-md font-mono font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{node.name}</span>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {node.status}
                  </span>
                  <span className="text-sm text-emerald-400 font-mono">{node.uptime} Uptime</span>
                </div>
              </div>
            ))}
          </div>
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
      updated: 'Weekly updates',
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

          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-accent-blue text-xs font-semibold uppercase tracking-wider">
              {selectedBlog.category || 'Guides'}
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight mt-2" style={{ color: 'var(--text-primary)' }}>
              {selectedBlog.title}
            </h2>
            <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              Published on {selectedBlog.date || (selectedBlog.createdAt ? new Date(selectedBlog.createdAt).toLocaleDateString() : 'July 2026')}
            </div>
          </div>

          {selectedBlog.imageUrl && !selectedBlog.imageUrl.includes('blog_hero.png') && (
            <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-input)' }}>
              <img
                src={selectedBlog.imageUrl}
                alt={selectedBlog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-4 text-sm md:text-base leading-relaxed border-t pt-6" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
            {selectedBlog.content.split('\n').map((para, i) => (
              <p key={i}>{para.trim()}</p>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {allBlogs.map((post) => (
              <div
                key={post.slug || post.title}
                onClick={() => setSelectedBlog(post)}
                className="p-5 rounded-2xl text-left space-y-2 hover:border-accent-blue/30 transition-all cursor-pointer group" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}
              >
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{post.date || (post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '')}</span>
                  <span className="text-[10px] font-bold text-accent-blue bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">{post.category || 'Guides'}</span>
                </div>
                <h4 className="text-base font-bold group-hover:text-accent-blue transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {post.title}
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{post.excerpt || (post.content ? post.content.slice(0, 120) + '...' : '')}</p>
                <div className="text-xs font-semibold text-accent-blue flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Read full article →
                </div>
              </div>
            ))}
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
              { name: 'Discord Server', label: 'Join Chat', desc: 'Interact live with core builders.', link: 'https://discord.gg/bKgS6ERyZ' },
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
                <label className="text-sm font-bold uppercase block pl-1" style={{ color: 'var(--text-muted)' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="name@company.com"
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
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      )
    }
  };

  const DocInfo = policies[activeDoc] || policies.security;
  const ActiveIcon = DocInfo.icon;

  return (
    <div className="py-12 md:py-20 w-full max-w-[95%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 md:px-20 relative">

      {/* Mobile Dropdown Nav */}
      <div className="md:hidden mb-6">
        <select
          value={activeDoc}
          onChange={(e) => handleDocChange(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-blue cursor-pointer"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          {Object.keys(policies).map((key) => (
            <option key={key} value={key} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
              {policies[key].title}
            </option>
          ))}
        </select>
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
