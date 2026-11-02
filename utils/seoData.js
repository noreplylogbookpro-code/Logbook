// utils/seoData.js
// Centralized SEO Metadata, Structured Data & Semantic Prerendering Registry
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://logbookplus.co.in';
const DEFAULT_OG_IMAGE = `${BASE_URL}/assets/images/app_logo.png`;

// Load blog posts from database or fallback
function getPublishedBlogs() {
  const blogsFile = path.join(__dirname, '..', 'database', 'server_blogs.json');
  try {
    if (fs.existsSync(blogsFile)) {
      const raw = fs.readFileSync(blogsFile, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[seoData] Error reading server_blogs.json:', e.message);
  }
  return [
    {
      id: 'blog_1',
      slug: 'securing-cloud-backups-with-zero-knowledge-encryption',
      title: 'Securing Cloud Backups with Zero-Knowledge Encryption',
      category: 'Security',
      author: 'Logbook Team',
      date: '2026-03-15',
      imageUrl: '/assets/images/security.png',
      excerpt: 'How client-side AES-256-GCM encryption ensures your personal financial logs remain private before leaving your Android device.',
      content: 'Zero-knowledge architecture ensures that encryption keys are derived exclusively on the client side, meaning no plain text or keys ever touch remote servers.'
    },
    {
      id: 'blog_2',
      slug: 'optimizing-nedb-performance',
      title: 'Optimizing NeDB Performance for High-Throughput Applications',
      category: 'Guides',
      author: 'Logbook Team',
      date: '2026-02-28',
      imageUrl: '/assets/images/guides.png',
      excerpt: 'Best practices for index tuning, datafile compaction cycles, and memory management in embedded JavaScript datastores.',
      content: 'Embedded databases require regular compaction and proper indexing to maintain low latency during heavy concurrent transactions.'
    },
    {
      id: 'blog_3',
      slug: 'why-local-first-database-design-matters',
      title: 'Why Local-First Database Design Matters for Personal Finance',
      category: 'Database',
      author: 'Logbook Team',
      date: '2026-07-02',
      imageUrl: '/assets/images/general.png',
      excerpt: 'Analyzing sub-millisecond latency, zero server downtime, and zero-telemetry models using sandboxed on-device SQLite for personal expense tracking.',
      content: 'At Logbook Plus, we believe your financial logs should be completely under your control. By hosting database read and write instances directly on the client device, database write speeds average less than 5 milliseconds with 100% offline functionality.'
    },
    {
      id: 'blog_4',
      slug: 'passphrase-key-derivation-on-mobile-devices',
      title: 'Passphrase Key Derivation on Mobile Devices',
      category: 'Security',
      author: 'Logbook Team',
      date: '2026-06-18',
      imageUrl: '/assets/images/security.png',
      excerpt: 'How PBKDF2 key stretching and iterated SHA-256 rounds protect offline personal expense backup vaults against brute-force attacks on Android.',
      content: 'Using client-side cryptographically secure salts combined with iterated SHA-256 rounds, we derive a 256-bit key that is used as the AES encryption vector.'
    },
    {
      id: 'blog_5',
      slug: 'optimizing-node-builds-in-unix-subshells',
      title: 'Optimizing Node Builds in Unix Subshells',
      category: 'DevOps',
      author: 'Logbook Team',
      date: '2026-05-24',
      imageUrl: '/assets/images/guides.png',
      excerpt: 'A developer guide to executing lightweight Node.js targets and background backup services inside sandboxed subshell environments like Termux.',
      content: 'By optimizing Node.js threads, using lightweight dependencies, and tuning subshell garbage collectors, you can easily host active backup systems with less than 50MB of RAM.'
    }
  ];
}

// Global Entities
const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${BASE_URL}/#organization`,
  name: 'Logbook Plus',
  url: BASE_URL,
  logo: `${BASE_URL}/assets/images/app_logo.png`,
  description: 'Private personal expense tracker with on-device encrypted SQLite database, receipt photo organization, and zero tracker SDKs.',
  sameAs: [
    'https://play.google.com/store/apps/details?id=com.logbookplus',
    'https://github.com/noreplylogbookpro-code/Logbook',
    'https://discord.gg/logbookplus'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@logbookplus.co.in',
    contactType: 'customer support'
  }
};

const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${BASE_URL}/#website`,
  url: BASE_URL,
  name: 'Logbook Plus',
  description: 'Private personal finance and offline expense intelligence that stays yours.',
  publisher: {
    '@id': `${BASE_URL}/#organization`
  }
};

const SOFTWARE_APPLICATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${BASE_URL}/#softwareapplication`,
  name: 'Logbook Plus',
  operatingSystem: 'Android',
  applicationCategory: 'FinanceApplication',
  description: 'Offline expense tracker and personal expense logbook for Android. Features local encrypted SQLite storage, receipt photo organization, Excel/PDF exports, and private backups.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR'
  },
  installUrl: 'https://play.google.com/store/apps/details?id=com.logbookplus',
  author: {
    '@id': `${BASE_URL}/#organization`
  }
};

function createBreadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url
    }))
  };
}

// Static Route Metadata Registry
const STATIC_ROUTES = {
  '/': {
    title: 'Logbook Plus | Offline Expense Tracker & Private Personal Finance',
    description: 'Private, offline-first personal expense tracker for Android. Local encrypted SQLite database, receipt photo organization, zero tracker SDKs, and transparent cash flow control.',
    canonical: `${BASE_URL}/`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Expense Intelligence That Stays Yours.',
    lastmod: '2026-11-01',
    changefreq: 'daily',
    priority: '1.0',
    structuredData: [ORGANIZATION_SCHEMA, WEBSITE_SCHEMA, SOFTWARE_APPLICATION_SCHEMA],
    semanticContent: `
      <header class="sr-only">
        <h1>Logbook Plus - Offline Android Expense Tracker & Personal Finance</h1>
      </header>
      <section class="max-w-4xl mx-auto p-6 text-center space-y-4">
        <h1 class="text-4xl font-extrabold tracking-tight">Expense Intelligence That Stays Yours.</h1>
        <p class="text-lg text-zinc-400">The private personal expense logbook for Android. Track expenses offline, organize receipt photos, generate Excel & PDF reports, and retain 100% data ownership with client-side encrypted backups.</p>
        <div class="flex gap-4 justify-center pt-4">
          <a href="https://play.google.com/store/apps/details?id=com.logbookplus" class="btn-primary">Download for Android on Google Play</a>
          <a href="/app" class="btn-secondary">Launch Web Vault</a>
        </div>
      </section>
      <section class="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <article class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <h2 class="text-xl font-bold mb-2">Local Encrypted Database</h2>
          <p class="text-sm text-zinc-400">Your financial history never leaves your device unencrypted. We utilize AES-256 local database encryption on top of standard platform security.</p>
        </article>
        <article class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <h2 class="text-xl font-bold mb-2">Zero Tracker SDKs</h2>
          <p class="text-sm text-zinc-400">No Google Analytics, no Facebook Pixels, and no ad beacons. The app binary is entirely free of third-party telemetry.</p>
        </article>
        <article class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <h2 class="text-xl font-bold mb-2">Offline Expense Tracking</h2>
          <p class="text-sm text-zinc-400">Sub-millisecond read/write speeds with on-device SQLite. Record transactions and attach receipt photos anywhere without an internet connection.</p>
        </article>
      </section>
      <section class="max-w-4xl mx-auto p-6 space-y-4">
        <h2 class="text-2xl font-bold">Frequently Asked Questions</h2>
        <div class="space-y-3 text-left">
          <div>
            <h3 class="font-bold">Does Logbook Plus require an internet connection to work?</h3>
            <p class="text-sm text-zinc-400">No. Logbook Plus is an offline-first Android application. All expense and income records are stored directly on your phone in an on-device SQLite database.</p>
          </div>
          <div>
            <h3 class="font-bold">How do backups and data recovery work if I switch phones?</h3>
            <p class="text-sm text-zinc-400">You can generate encrypted ZIP backup archives at any time from Settings and restore them seamlessly onto any Android device.</p>
          </div>
          <div>
            <h3 class="font-bold">What file formats can I export my financial reports in?</h3>
            <p class="text-sm text-zinc-400">Logbook Plus exports accounting reports in Microsoft Excel (.xlsx), standard CSV, and PDF formats with custom date range filtering.</p>
          </div>
        </div>
      </section>
    `
  },
  '/pricing': {
    title: 'Pricing & Plans | Free Offline Tracker & Premium Cloud Backups — Logbook Plus',
    description: 'Transparent, honest pricing for Logbook Plus. Free offline personal expense tracking forever, with optional encrypted cloud backups and self-hosted WebDAV sync.',
    canonical: `${BASE_URL}/pricing`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Transparent Pricing For Personal Sovereignty.',
    lastmod: '2026-11-01',
    changefreq: 'weekly',
    priority: '0.9',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Pricing', url: `${BASE_URL}/pricing` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 text-center space-y-4">
        <h1 class="text-4xl font-extrabold tracking-tight">Transparent Pricing For Personal Sovereignty</h1>
        <p class="text-lg text-zinc-400">Core personal expense tracking is completely free. Upgrade anytime for encrypted cloud sync and self-hosted WebDAV integration.</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-left">
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h2 class="text-xl font-bold">Free Offline</h2>
            <p class="text-3xl font-extrabold my-2">₹0 <span class="text-sm font-normal text-zinc-400">forever</span></p>
            <p class="text-xs text-zinc-400 mb-4">Unlimited offline transactions, receipt photos, Excel export, and local backups.</p>
          </div>
          <div class="p-6 rounded-2xl border border-blue-500/40 bg-zinc-900/80">
            <h2 class="text-xl font-bold text-blue-400">Premium Vault</h2>
            <p class="text-3xl font-extrabold my-2">₹50 <span class="text-sm font-normal text-zinc-400">/ month</span></p>
            <p class="text-xs text-zinc-400 mb-4">Zero-knowledge AES-256 cloud backup vault, PDF export, multi-device restore.</p>
          </div>
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h2 class="text-xl font-bold">Self-Hosted</h2>
            <p class="text-3xl font-extrabold my-2">₹199 <span class="text-sm font-normal text-zinc-400">/ month</span></p>
            <p class="text-xs text-zinc-400 mb-4">Sync directly to your personal Nextcloud, Synology NAS, or private WebDAV server.</p>
          </div>
        </div>
      </section>
    `
  },
  '/about': {
    title: 'About Logbook Plus | Local-First Architecture & Data Sovereignty Philosophy',
    description: 'Discover why Logbook Plus was built: a zero-telemetry personal expense logbook engineered with on-device SQLite storage and client-side AES-256 encryption.',
    canonical: `${BASE_URL}/about`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Financial Software Built on Absolute Privacy',
    lastmod: '2026-11-01',
    changefreq: 'monthly',
    priority: '0.8',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'About', url: `${BASE_URL}/about` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Financial Software Built on Absolute Privacy</h1>
        <p class="text-lg text-zinc-400">We believe personal accounting should never turn you into a product. Logbook Plus guarantees mathematical data sovereignty through local-first architecture.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h2 class="text-xl font-bold mb-2">Our Mission</h2>
            <p class="text-sm text-zinc-400">To provide individuals with an uncompromised financial tracking engine that operates completely independently of ad networks and corporate clouds.</p>
          </div>
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h2 class="text-xl font-bold mb-2">Zero Knowledge Architecture</h2>
            <p class="text-sm text-zinc-400">Encryption keys never touch our servers. Every byte stored on device or sent to backup is sealed with AES-256-GCM before transport.</p>
          </div>
        </div>
      </section>
    `
  },
  '/contact': {
    title: 'Contact Support & Feedback | Logbook Plus Helpdesk',
    description: 'Get in touch with the Logbook Plus engineering and support team. Submit general inquiries, bug reports, feature ideas, or security vulnerability disclosures.',
    canonical: `${BASE_URL}/contact`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Get in Touch with Engineering & Support',
    lastmod: '2026-11-01',
    changefreq: 'monthly',
    priority: '0.8',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Contact', url: `${BASE_URL}/contact` }
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'Contact Logbook Plus Support',
        url: `${BASE_URL}/contact`,
        mainEntity: {
          '@type': 'Organization',
          name: 'Logbook Plus',
          email: 'support@logbookplus.co.in'
        }
      }
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Contact Engineering & Support</h1>
        <p class="text-lg text-zinc-400">Have questions about offline backups, feature suggestions, or security disclosures? Reach out to our dedicated team.</p>
        <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-3">
          <p><strong>Support Email:</strong> <a href="mailto:support@logbookplus.co.in" class="text-blue-400 underline">support@logbookplus.co.in</a></p>
          <p><strong>Security Reports:</strong> <a href="mailto:support@logbookplus.co.in?subject=Security%20Vulnerability" class="text-blue-400 underline">support@logbookplus.co.in</a></p>
          <p><strong>Response SLA:</strong> Verified inquiries answered within 24 to 48 business hours.</p>
        </div>
      </section>
    `
  },
  '/blog': {
    title: 'Engineering Blog & Privacy Guides | Logbook Plus',
    description: 'Articles, cryptographic teardowns, and architecture guides covering local-first databases, client-side AES-256 encryption, and self-hosted personal finance.',
    canonical: `${BASE_URL}/blog`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Engineering, Security & Architecture Blog',
    lastmod: '2026-11-01',
    changefreq: 'weekly',
    priority: '0.8',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Blog', url: `${BASE_URL}/blog` }
      ])
    ],
    semanticContent: `
      <section class="max-w-5xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Engineering, Security & Architecture Blog</h1>
        <p class="text-lg text-zinc-400">Deep dives into sovereign offline architectures, client-side cryptographic vaults, and local-first personal finance.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <article class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-2">
            <span class="text-xs font-mono text-blue-400 font-bold uppercase">Database</span>
            <h2 class="text-xl font-bold"><a href="/blog/why-local-first-database-design-matters" class="hover:text-blue-400">Why Local-First Database Design Matters for Personal Finance</a></h2>
            <p class="text-sm text-zinc-400">Analyzing sub-millisecond latency, zero server downtime, and zero-telemetry models using sandboxed on-device SQLite.</p>
          </article>
          <article class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-2">
            <span class="text-xs font-mono text-blue-400 font-bold uppercase">Security</span>
            <h2 class="text-xl font-bold"><a href="/blog/securing-cloud-backups-with-zero-knowledge-encryption" class="hover:text-blue-400">Securing Cloud Backups with Zero-Knowledge Encryption</a></h2>
            <p class="text-sm text-zinc-400">How client-side AES-256-GCM encryption guarantees your personal financial backups remain completely private before transit.</p>
          </article>
          <article class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-2">
            <span class="text-xs font-mono text-blue-400 font-bold uppercase">Security</span>
            <h2 class="text-xl font-bold"><a href="/blog/passphrase-key-derivation-on-mobile-devices" class="hover:text-blue-400">Passphrase Key Derivation on Mobile Devices</a></h2>
            <p class="text-sm text-zinc-400">Learn how PBKDF2 key stretching and iterated SHA-256 rounds protect offline backup vaults against brute-force attacks on Android.</p>
          </article>
          <article class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-2">
            <span class="text-xs font-mono text-blue-400 font-bold uppercase">Guides</span>
            <h2 class="text-xl font-bold"><a href="/blog/optimizing-nedb-performance" class="hover:text-blue-400">Optimizing NeDB Performance for High-Throughput Applications</a></h2>
            <p class="text-sm text-zinc-400">Best practices for datastore index tuning, compaction cycles, and memory management in embedded JavaScript databases.</p>
          </article>
        </div>
      </section>
    `
  },
  '/help-center': {
    title: 'Help Center & FAQ | Offline Tracking, Exports & Backups — Logbook Plus',
    description: 'Find answers to common questions about Logbook Plus: offline expense tracking, receipt photo attachments, Excel and PDF exports, and vault restore procedures.',
    canonical: `${BASE_URL}/help-center`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Help Center & Knowledge Base',
    lastmod: '2026-11-01',
    changefreq: 'weekly',
    priority: '0.8',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Help Center', url: `${BASE_URL}/help-center` }
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Logbook Plus?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Logbook Plus is a digital logbook and ledger application for securely tracking income and expense entries with receipt photos, tags, and multi-currency details. It operates with a local-first philosophy, meaning your financial logs reside on your physical smartphone.'
            }
          },
          {
            '@type': 'Question',
            name: 'Is an internet connection required to use Logbook Plus?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. The core application is 100% offline-first. You can record transactions, organize categories, attach receipts, and view charts anywhere without cellular reception or Wi-Fi.'
            }
          },
          {
            '@type': 'Question',
            name: 'Can I attach receipt photos to expense entries?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. You can attach multiple receipt images and invoice snapshots to every log entry. Images are stored inside your device isolated app storage and included in encrypted backups.'
            }
          },
          {
            '@type': 'Question',
            name: 'How do I export expense reports?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Open the app, navigate to Export, select your date range, and choose your preferred format: Microsoft Excel (.xlsx), Microsoft Word (.docx), or PDF (Premium).'
            }
          },
          {
            '@type': 'Question',
            name: 'How can I restore my data on a new phone?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Install Logbook Plus on your new device, go to Settings → Backup & Restore, and select Import Backup. Choose your saved encrypted backup file or pull your vault from cloud storage, then enter your encryption password to restore all transactions and photos instantly.'
            }
          }
        ]
      }
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Help Center & Knowledge Base</h1>
        <p class="text-lg text-zinc-400">Everything you need to know about offline tracking, receipt management, Excel exports, and cryptographic backups.</p>
        <div class="space-y-4 pt-4">
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h2 class="text-lg font-bold">What is Logbook Plus?</h2>
            <p class="text-sm text-zinc-400 mt-2">Logbook Plus is a digital logbook and ledger application for securely tracking income and expense entries with receipt photos, tags, and multi-currency details. It operates with a local-first philosophy on Android.</p>
          </div>
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h2 class="text-lg font-bold">Is an internet connection required?</h2>
            <p class="text-sm text-zinc-400 mt-2">No. The core application is 100% offline-first. You can record transactions, organize categories, attach receipts, and view charts anywhere without cellular reception.</p>
          </div>
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h2 class="text-lg font-bold">How do I export my data?</h2>
            <p class="text-sm text-zinc-400 mt-2">Open the app, navigate to Export in the navigation bar, choose your date range, and select your preferred format: Microsoft Excel (.xlsx), Microsoft Word (.docx), or PDF.</p>
          </div>
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h2 class="text-lg font-bold">How can I restore my data on a new phone?</h2>
            <p class="text-sm text-zinc-400 mt-2">Install Logbook Plus on your new device, go to Settings → Backup & Restore, and select Import Backup. Enter your encryption password to restore all transactions and photos instantly.</p>
          </div>
        </div>
      </section>
    `
  },
  '/changelog': {
    title: 'Product Changelog & Release Notes | Logbook Plus',
    description: 'Explore the latest features, security hardening, database optimizations, and Android releases for Logbook Plus.',
    canonical: `${BASE_URL}/changelog`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Product Updates & Engineering Changelog',
    lastmod: '2026-11-01',
    changefreq: 'weekly',
    priority: '0.8',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Changelog', url: `${BASE_URL}/changelog` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Product Updates & Engineering Changelog</h1>
        <p class="text-lg text-zinc-400">Track continuous releases, performance tuning, and security enhancements across Logbook Plus mobile and web consoles.</p>
        <div class="space-y-4 pt-4">
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <span class="text-xs font-mono text-emerald-400 font-bold">v2.17.0 • Production Stable</span>
            <h2 class="text-xl font-bold mt-1">SEO Architecture, Zero-Knowledge Backup Hardening & Performance</h2>
            <p class="text-sm text-zinc-400 mt-2">Enhanced static HTML prerendering, canonical routing, trailing-slash consolidation, automated WebDAV synchronization stability, and DPDP consent alignment.</p>
          </div>
        </div>
      </section>
    `
  },
  '/careers': {
    title: 'Careers at Logbook Plus | Build Sovereign Personal Finance Tools',
    description: 'Join our team building privacy-preserving, local-first personal accounting tools. Explore open engineering and design roles.',
    canonical: `${BASE_URL}/careers`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Build the Future of Sovereign Finance',
    lastmod: '2026-11-01',
    changefreq: 'monthly',
    priority: '0.7',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Careers', url: `${BASE_URL}/careers` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Build the Future of Sovereign Finance</h1>
        <p class="text-lg text-zinc-400">We are an engineering-driven team crafting local-first, mathematically private personal finance tools. Interested in contributing? Reach out to careers@logbookplus.co.in.</p>
      </section>
    `
  },
  '/documentation': {
    title: 'Documentation & Protocols | WebDAV, AES-256 & SQLite Specs — Logbook Plus',
    description: 'Technical specifications and protocol documentation for Logbook Plus: local SQLite engine, AES-256-GCM encryption, WebDAV sync, and developer APIs.',
    canonical: `${BASE_URL}/documentation`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Documentation & Protocols',
    lastmod: '2026-11-01',
    changefreq: 'weekly',
    priority: '0.8',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Documentation', url: `${BASE_URL}/documentation` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Documentation & Protocols</h1>
        <p class="text-lg text-zinc-400">Comprehensive guides covering on-device SQLite operations, client-side AES-256 encryption, and WebDAV sync protocols.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h2 class="text-xl font-bold mb-2">Local SQLite Engine</h2>
            <p class="text-sm text-zinc-400">SQLite3 with Write-Ahead Logging (WAL) ensures sub-millisecond writes, atomic ACID transactions, and zero internet dependency.</p>
          </div>
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h2 class="text-xl font-bold mb-2">WebDAV & Nextcloud Sync</h2>
            <p class="text-sm text-zinc-400">Connect any RFC 4918 compatible WebDAV endpoint to synchronize encrypted backups directly to your personal NAS or cloud instance.</p>
          </div>
        </div>
      </section>
    `
  },
  '/community': {
    title: 'Community & Open Channels | GitHub, Discord & Bug Bounty — Logbook Plus',
    description: 'Join the Logbook Plus community. Collaborate on GitHub, participate in Discord discussions, audit source code, and submit vulnerability reports.',
    canonical: `${BASE_URL}/community`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Community & Open Channels',
    lastmod: '2026-11-01',
    changefreq: 'monthly',
    priority: '0.7',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Community', url: `${BASE_URL}/community` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Community & Open Channels</h1>
        <p class="text-lg text-zinc-400">Connect with privacy advocates, audit open-source code repositories, and contribute to sovereign personal finance tools.</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h2 class="text-xl font-bold mb-2">Discord Server</h2>
            <p class="text-sm text-zinc-400">Live chat, architecture discussions, and community support.</p>
          </div>
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h2 class="text-xl font-bold mb-2">GitHub Repository</h2>
            <p class="text-sm text-zinc-400">Review open source components, track releases, and file issues.</p>
          </div>
          <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
            <h2 class="text-xl font-bold mb-2">Security Bug Bounty</h2>
            <p class="text-sm text-zinc-400">Report vulnerabilities responsibly to support@logbookplus.co.in.</p>
          </div>
        </div>
      </section>
    `
  },
  '/security': {
    title: 'Security Policy & Cryptographic Architecture | Logbook Plus',
    description: 'Details on Logbook Plus cryptographic protocols: on-device AES-256 encryption at rest, TLS 1.3 in transit, and vulnerability disclosure policies.',
    canonical: `${BASE_URL}/security`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Security Policy',
    lastmod: '2026-11-01',
    changefreq: 'monthly',
    priority: '0.7',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Security Policy', url: `${BASE_URL}/security` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Security Policy</h1>
        <p class="text-lg text-zinc-400">At Logbook Plus, security is built into our core architecture. We employ a local-first approach to personal expense tracking, ensuring your financial records never leave your control unencrypted.</p>
        <h2 class="text-2xl font-bold mt-6">AES-256 Client-Side Encryption</h2>
        <p class="text-sm text-zinc-400">All database logs and receipt photos created within the Logbook Plus app are locally encrypted at rest on your device using authenticated AES-256 encryption.</p>
      </section>
    `
  },
  '/privacy': {
    title: 'Privacy Policy | Zero-Telemetry Personal Expense Tracking — Logbook Plus',
    description: 'Our DPDP and GDPR compliant privacy policy: zero tracker SDKs, local on-device database storage, and explicit consent controls.',
    canonical: `${BASE_URL}/privacy`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Privacy Policy',
    lastmod: '2026-11-01',
    changefreq: 'monthly',
    priority: '0.7',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Privacy Policy', url: `${BASE_URL}/privacy` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p class="text-lg text-zinc-400">Logbook Plus operates on a strict zero-telemetry invariant. We do not sell, monetize, or inspect your personal ledger records. All income, expense, and receipt data resides on your physical hardware.</p>
      </section>
    `
  },
  '/terms': {
    title: 'Terms of Use & Service Agreement | Logbook Plus',
    description: 'Terms of use for Logbook Plus personal expense tracking app, web vault dashboard, and synchronization services.',
    canonical: `${BASE_URL}/terms`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Terms of Use',
    lastmod: '2026-11-01',
    changefreq: 'monthly',
    priority: '0.7',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Terms of Use', url: `${BASE_URL}/terms` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Terms of Use</h1>
        <p class="text-lg text-zinc-400">Terms and conditions governing the use of Logbook Plus personal finance software, mobile applications, and cloud vault services.</p>
      </section>
    `
  },
  '/cookie': {
    title: 'Cookie Policy & Storage Disclosures | Logbook Plus',
    description: 'Learn about essential cookies and local storage tokens used for session authentication and theme preferences in Logbook Plus.',
    canonical: `${BASE_URL}/cookie`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Cookie Policy',
    lastmod: '2026-11-01',
    changefreq: 'monthly',
    priority: '0.7',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Cookie Policy', url: `${BASE_URL}/cookie` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Cookie Policy</h1>
        <p class="text-lg text-zinc-400">Logbook Plus utilizes only strictly necessary first-party cookies and local storage items for authenticating sessions and saving theme preferences. We do not use third-party tracking or advertising cookies.</p>
      </section>
    `
  },
  '/refund': {
    title: 'Refund Policy & Google Play Billing Terms | Logbook Plus',
    description: 'Information regarding refund requests, subscription cancellations, and Google Play billing for Logbook Plus premium plans.',
    canonical: `${BASE_URL}/refund`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Refund Policy',
    lastmod: '2026-11-01',
    changefreq: 'monthly',
    priority: '0.6',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Refund Policy', url: `${BASE_URL}/refund` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Refund Policy</h1>
        <p class="text-lg text-zinc-400">Refund and cancellation policies for Logbook Plus subscriptions processed through Google Play Console or direct licensing.</p>
      </section>
    `
  },
  '/cloud-backup-policy': {
    title: 'Cloud Backup & Vault Retention Policy | Logbook Plus',
    description: 'Understand how encrypted cloud backups are stored, automated retention periods, and zero-knowledge decryption key responsibility.',
    canonical: `${BASE_URL}/cloud-backup-policy`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Cloud Backup Policy',
    lastmod: '2026-11-01',
    changefreq: 'monthly',
    priority: '0.6',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Cloud Backup Policy', url: `${BASE_URL}/cloud-backup-policy` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Cloud Backup Policy</h1>
        <p class="text-lg text-zinc-400">Specifications on zero-knowledge cloud backup encryption, retention schedules, and self-hosted WebDAV targets.</p>
      </section>
    `
  },
  '/paid-terms': {
    title: 'Paid Subscription Terms & Commercial Licensing | Logbook Plus',
    description: 'Commercial terms, recurring subscription details, and service level commitments for Logbook Plus paid tiers.',
    canonical: `${BASE_URL}/paid-terms`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Paid Terms',
    lastmod: '2026-11-01',
    changefreq: 'monthly',
    priority: '0.6',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Paid Terms', url: `${BASE_URL}/paid-terms` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Paid Terms</h1>
        <p class="text-lg text-zinc-400">Commercial terms governing premium licenses, server quotas, and WebDAV access.</p>
      </section>
    `
  },
  '/delete-account': {
    title: 'Delete Account & Permanent Data Erasure Request | Logbook Plus',
    description: 'Instructions and self-service tools for permanently deleting your Logbook Plus account and erasing all encrypted vault backups.',
    canonical: `${BASE_URL}/delete-account`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Delete Account & Data Erasure Policy',
    lastmod: '2026-11-01',
    changefreq: 'monthly',
    priority: '0.6',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Delete Account', url: `${BASE_URL}/delete-account` }
      ])
    ],
    semanticContent: `
      <section class="max-w-4xl mx-auto p-6 space-y-6">
        <h1 class="text-4xl font-extrabold tracking-tight">Delete Account & Data Erasure Policy</h1>
        <p class="text-lg text-zinc-400">You have an absolute right to permanent erasure of your account, profile credentials, and remote vault backups. Self-service deletion is available in the Web Vault Account Manager.</p>
      </section>
    `
  },
  '/app': {
    title: 'Launch Web Vault | Sign In & Secure Cloud Sync — Logbook Plus',
    description: 'Sign in to access your encrypted Logbook Plus cloud vault backups, manage subscription licenses, or link mobile devices.',
    canonical: `${BASE_URL}/app`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    h1: 'Launch Web Vault',
    lastmod: '2026-11-01',
    changefreq: 'monthly',
    priority: '0.7',
    structuredData: [
      createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Web Vault', url: `${BASE_URL}/app` }
      ])
    ],
    semanticContent: `
      <section class="max-w-md mx-auto p-6 text-center space-y-4">
        <h1 class="text-3xl font-extrabold tracking-tight">Launch Web Vault</h1>
        <p class="text-sm text-zinc-400">Sign in to manage encrypted backup vaults, subscription licenses, and mobile pairing.</p>
      </section>
    `
  }
};

// Aliases mapping -> canonical URL
const ROUTE_ALIASES = {
  '/faq': '/help-center',
  '/docs': '/documentation',
  '/contact-us': '/contact',
  '/cookie-policy': '/cookie',
  '/cookies': '/cookie',
  '/delete-account-policy': '/delete-account',
  '/account-deletion': '/delete-account'
};

function getSeoForPath(reqPath) {
  if (!reqPath) return null;
  let clean = reqPath.split('?')[0].trim();
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.replace(/\/+$/, '');
  }
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }

  // Check static routes
  if (STATIC_ROUTES[clean]) {
    return { ...STATIC_ROUTES[clean], path: clean };
  }

  // Check dynamic blog route: /blog/:slug
  if (clean.startsWith('/blog/')) {
    const slug = clean.replace('/blog/', '').trim();
    const blogs = getPublishedBlogs();
    const blog = blogs.find(b => b.slug === slug || String(b.id) === slug || String(b._id) === slug);

    if (blog) {
      const canonicalUrl = `${BASE_URL}/blog/${blog.slug || slug}`;
      const ogImage = blog.imageUrl ? (blog.imageUrl.startsWith('http') ? blog.imageUrl : `${BASE_URL}${blog.imageUrl}`) : DEFAULT_OG_IMAGE;
      const pubDate = blog.date || (blog.createdAt ? new Date(blog.createdAt).toISOString().split('T')[0] : '2026-03-15');

      const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: blog.title,
        description: blog.excerpt || blog.title,
        image: ogImage,
        datePublished: pubDate,
        dateModified: pubDate,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl
        },
        author: {
          '@type': 'Organization',
          name: blog.author || 'Logbook Team',
          url: BASE_URL
        },
        publisher: {
          '@id': `${BASE_URL}/#organization`
        }
      };

      const breadcrumb = createBreadcrumbSchema([
        { name: 'Home', url: `${BASE_URL}/` },
        { name: 'Blog', url: `${BASE_URL}/blog` },
        { name: blog.title, url: canonicalUrl }
      ]);

      return {
        path: clean,
        title: `${blog.title} | Logbook Plus Tech Blog`,
        description: blog.excerpt ? blog.excerpt.slice(0, 160) : `Read "${blog.title}" on the Logbook Plus engineering and cryptography blog.`,
        canonical: canonicalUrl,
        ogType: 'article',
        ogImage: ogImage,
        h1: blog.title,
        lastmod: pubDate,
        changefreq: 'monthly',
        priority: '0.8',
        structuredData: [breadcrumb, articleSchema],
        semanticContent: `
          <article class="max-w-4xl mx-auto p-6 space-y-6">
            <header class="space-y-3">
              <span class="text-xs font-mono text-blue-400 font-bold uppercase">${blog.category || 'Guides'}</span>
              <h1 class="text-4xl font-extrabold tracking-tight">${blog.title}</h1>
              <p class="text-xs text-zinc-400 font-mono">Published: ${pubDate} by ${blog.author || 'Logbook Team'}</p>
            </header>
            <div class="prose prose-invert max-w-none text-zinc-300 space-y-4 pt-4 border-t border-zinc-800">
              <p>${blog.excerpt || ''}</p>
              <div>${blog.content ? blog.content.replace(/\n\n/g, '<br/><br/>') : ''}</div>
            </div>
            <footer class="pt-8 border-t border-zinc-800">
              <a href="/blog" class="text-blue-400 hover:underline">← Back to all articles</a>
            </footer>
          </article>
        `
      };
    }
  }

  return null;
}

module.exports = {
  BASE_URL,
  DEFAULT_OG_IMAGE,
  STATIC_ROUTES,
  ROUTE_ALIASES,
  getPublishedBlogs,
  getSeoForPath,
  ORGANIZATION_SCHEMA,
  WEBSITE_SCHEMA,
  SOFTWARE_APPLICATION_SCHEMA,
  createBreadcrumbSchema
};

