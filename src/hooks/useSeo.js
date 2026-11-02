// src/hooks/useSeo.js
import { useEffect } from 'react';

const BASE_URL = 'https://logbookplus.co.in';
const DEFAULT_OG_IMAGE = `${BASE_URL}/assets/images/app_logo.png`;

const CLIENT_SEO = {
  '/': {
    title: 'Logbook Plus | Offline Expense Tracker & Private Personal Finance',
    description: 'Private, offline-first personal expense tracker for Android. Local encrypted SQLite database, receipt photo organization, zero tracker SDKs, and transparent cash flow control.',
    canonical: `${BASE_URL}/`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/pricing': {
    title: 'Pricing & Plans | Free Offline Tracker & Premium Cloud Backups — Logbook Plus',
    description: 'Transparent, honest pricing for Logbook Plus. Free offline personal expense tracking forever, with optional encrypted cloud backups and self-hosted WebDAV sync.',
    canonical: `${BASE_URL}/pricing`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/about': {
    title: 'About Logbook Plus | Local-First Architecture & Data Sovereignty Philosophy',
    description: 'Discover why Logbook Plus was built: a zero-telemetry personal expense logbook engineered with on-device SQLite storage and client-side AES-256 encryption.',
    canonical: `${BASE_URL}/about`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/contact': {
    title: 'Contact Support & Feedback | Logbook Plus Helpdesk',
    description: 'Get in touch with the Logbook Plus engineering and support team. Submit general inquiries, bug reports, feature ideas, or security vulnerability disclosures.',
    canonical: `${BASE_URL}/contact`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/blog': {
    title: 'Engineering Blog & Privacy Guides | Logbook Plus',
    description: 'Articles, cryptographic teardowns, and architecture guides covering local-first databases, client-side AES-256 encryption, and self-hosted personal finance.',
    canonical: `${BASE_URL}/blog`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/help-center': {
    title: 'Help Center & FAQ | Offline Tracking, Exports & Backups — Logbook Plus',
    description: 'Find answers to common questions about Logbook Plus: offline expense tracking, receipt photo attachments, Excel and PDF exports, and vault restore procedures.',
    canonical: `${BASE_URL}/help-center`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/changelog': {
    title: 'Product Changelog & Release Notes | Logbook Plus',
    description: 'Explore the latest features, security hardening, database optimizations, and Android releases for Logbook Plus.',
    canonical: `${BASE_URL}/changelog`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/careers': {
    title: 'Careers at Logbook Plus | Build Sovereign Personal Finance Tools',
    description: 'Join our team building privacy-preserving, local-first personal accounting tools. Explore open engineering and design roles.',
    canonical: `${BASE_URL}/careers`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/documentation': {
    title: 'Documentation & Protocols | WebDAV, AES-256 & SQLite Specs — Logbook Plus',
    description: 'Technical specifications and protocol documentation for Logbook Plus: local SQLite engine, AES-256-GCM encryption, WebDAV sync, and developer APIs.',
    canonical: `${BASE_URL}/documentation`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/community': {
    title: 'Community & Open Channels | GitHub, Discord & Bug Bounty — Logbook Plus',
    description: 'Join the Logbook Plus community. Collaborate on GitHub, participate in Discord discussions, audit source code, and submit vulnerability reports.',
    canonical: `${BASE_URL}/community`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/security': {
    title: 'Security Policy & Cryptographic Architecture | Logbook Plus',
    description: 'Details on Logbook Plus cryptographic protocols: on-device AES-256 encryption at rest, TLS 1.3 in transit, and vulnerability disclosure policies.',
    canonical: `${BASE_URL}/security`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/privacy': {
    title: 'Privacy Policy | Zero-Telemetry Personal Expense Tracking — Logbook Plus',
    description: 'Our DPDP and GDPR compliant privacy policy: zero tracker SDKs, local on-device database storage, and explicit consent controls.',
    canonical: `${BASE_URL}/privacy`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/terms': {
    title: 'Terms of Use & Service Agreement | Logbook Plus',
    description: 'Terms of use for Logbook Plus personal expense tracking app, web vault dashboard, and synchronization services.',
    canonical: `${BASE_URL}/terms`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/cookie': {
    title: 'Cookie Policy & Storage Disclosures | Logbook Plus',
    description: 'Learn about essential cookies and local storage tokens used for session authentication and theme preferences in Logbook Plus.',
    canonical: `${BASE_URL}/cookie`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/refund': {
    title: 'Refund Policy & Google Play Billing Terms | Logbook Plus',
    description: 'Information regarding refund requests, subscription cancellations, and Google Play billing for Logbook Plus premium plans.',
    canonical: `${BASE_URL}/refund`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/cloud-backup-policy': {
    title: 'Cloud Backup & Vault Retention Policy | Logbook Plus',
    description: 'Understand how encrypted cloud backups are stored, automated retention periods, and zero-knowledge decryption key responsibility.',
    canonical: `${BASE_URL}/cloud-backup-policy`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/paid-terms': {
    title: 'Paid Subscription Terms & Commercial Licensing | Logbook Plus',
    description: 'Commercial terms, recurring subscription details, and service level commitments for Logbook Plus paid tiers.',
    canonical: `${BASE_URL}/paid-terms`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/delete-account': {
    title: 'Delete Account & Permanent Data Erasure Request | Logbook Plus',
    description: 'Instructions and self-service tools for permanently deleting your Logbook Plus account and erasing all encrypted vault backups.',
    canonical: `${BASE_URL}/delete-account`,
    ogType: 'article',
    ogImage: DEFAULT_OG_IMAGE
  },
  '/app': {
    title: 'Launch Web Vault | Sign In & Secure Cloud Sync — Logbook Plus',
    description: 'Sign in to access your encrypted Logbook Plus cloud vault backups, manage subscription licenses, or link mobile devices.',
    canonical: `${BASE_URL}/app`,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE
  }
};

function updateMetaTag(selector, attribute, value) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [attrName, attrVal] = selector.replace('meta[', '').replace(']', '').split('=');
    el.setAttribute(attrName, attrVal.replace(/["']/g, ''));
    document.head.appendChild(el);
  }
  el.setAttribute(attribute, value);
}

function updateLinkTag(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useSeo(currentPath, activeBlog = null) {
  useEffect(() => {
    let clean = (currentPath || '/').split('?')[0].replace(/\/+$/, '') || '/';
    if (!clean.startsWith('/')) clean = '/' + clean;

    let seo = CLIENT_SEO[clean];

    if (activeBlog || clean.startsWith('/blog/')) {
      const blogTitle = activeBlog?.title || 'Logbook Tech Article';
      const blogExcerpt = activeBlog?.excerpt || 'Deep dive into local-first personal finance architecture.';
      const blogImage = activeBlog?.imageUrl ? (activeBlog.imageUrl.startsWith('http') ? activeBlog.imageUrl : `${BASE_URL}${activeBlog.imageUrl}`) : DEFAULT_OG_IMAGE;
      const canonical = activeBlog?.slug ? `${BASE_URL}/blog/${activeBlog.slug}` : `${BASE_URL}${clean}`;

      seo = {
        title: `${blogTitle} | Logbook Plus Tech Blog`,
        description: blogExcerpt.slice(0, 160),
        canonical: canonical,
        ogType: 'article',
        ogImage: blogImage
      };
    }

    if (!seo) {
      if (clean === '/app/dashboard') {
        seo = {
          title: 'Web Vault Dashboard | Logbook Plus',
          description: 'Manage your private encrypted backup vaults and personal subscription keys.',
          canonical: `${BASE_URL}/app/dashboard`,
          ogType: 'website',
          ogImage: DEFAULT_OG_IMAGE
        };
      } else {
        seo = CLIENT_SEO['/'];
      }
    }

    // Document Title
    document.title = seo.title;

    // Meta Description
    updateMetaTag('meta[name="description"]', 'content', seo.description);

    // Canonical Link
    updateLinkTag('canonical', seo.canonical);

    // Ensure conventional absolute sitemap link
    updateLinkTag('sitemap', `${BASE_URL}/sitemap.xml`);

    // Open Graph
    updateMetaTag('meta[property="og:title"]', 'content', seo.title);
    updateMetaTag('meta[property="og:description"]', 'content', seo.description);
    updateMetaTag('meta[property="og:url"]', 'content', seo.canonical);
    updateMetaTag('meta[property="og:type"]', 'content', seo.ogType || 'website');
    updateMetaTag('meta[property="og:image"]', 'content', seo.ogImage || DEFAULT_OG_IMAGE);

    // Twitter Card
    updateMetaTag('meta[name="twitter:title"]', 'content', seo.title);
    updateMetaTag('meta[name="twitter:description"]', 'content', seo.description);
    updateMetaTag('meta[name="twitter:url"]', 'content', seo.canonical);
    updateMetaTag('meta[name="twitter:image"]', 'content', seo.ogImage || DEFAULT_OG_IMAGE);

  }, [currentPath, activeBlog]);
}

