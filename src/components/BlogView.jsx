import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, ArrowLeft, Calendar, User, Clock, ArrowRight, Search, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useSeo } from '../hooks/useSeo.js';

export default function BlogView({ onNavigate, blogSlug }) {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Dynamically update SEO metadata when viewing a blog post
  useSeo(selectedBlog ? `/blog/${selectedBlog.slug || selectedBlog.id}` : '/blog', selectedBlog);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('/api/blogs');
        if (res.ok) {
          const data = await res.json();
          const list = (Array.isArray(data) && data.length > 0) ? data : fallbackBlogs;
          setBlogs(list);
          if (blogSlug) {
            const found = list.find(b => b.slug === blogSlug || String(b.id) === blogSlug || String(b._id) === blogSlug);
            if (found) setSelectedBlog(found);
          }
        } else {
          setBlogs(fallbackBlogs);
          if (blogSlug) {
            const found = fallbackBlogs.find(b => b.slug === blogSlug || String(b.id) === blogSlug || String(b._id) === blogSlug);
            if (found) setSelectedBlog(found);
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic blogs:', err);
        setBlogs(fallbackBlogs);
        if (blogSlug) {
          const found = fallbackBlogs.find(b => b.slug === blogSlug || String(b.id) === blogSlug || String(b._id) === blogSlug);
          if (found) setSelectedBlog(found);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [blogSlug]);

  useEffect(() => {
    if (blogs.length > 0) {
      if (blogSlug) {
        const found = blogs.find(b => b.slug === blogSlug || String(b.id) === blogSlug || String(b._id) === blogSlug);
        if (found) setSelectedBlog(found);
      } else {
        setSelectedBlog(null);
      }
    }
  }, [blogSlug, blogs]);

  const getDefaultBlogImage = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('sec') || cat.includes('crypto')) return '/assets/images/Security.png';
    if (cat.includes('guide') || cat.includes('tutorial') || cat.includes('doc')) return '/assets/images/Guides.png';
    return '/assets/images/General.png';
  };

  const categories = ['All', ...Array.from(new Set(blogs.map(b => b.category || 'General')))];

  const filteredBlogs = blogs.filter(post => {
    const matchesCategory = activeCategory === 'All' || (post.category || 'General') === activeCategory;
    const matchesSearch = searchQuery === '' ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-10 sm:py-16 md:py-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-left overflow-hidden">

      {/* Ambient Background Glow Blobs */}


      <div className="relative z-10">
        {selectedBlog ? (
          /* Blog Reader View */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <button
              onClick={() => {
                setSelectedBlog(null);
                if (onNavigate) {
                  onNavigate('/blog');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Articles
            </button>

            <div className="space-y-4 pt-2">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 text-accent-blue text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                {selectedBlog.category || 'Guides'}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                {selectedBlog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 border-b pb-6" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2.5">
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
                      Author & Security Researcher
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono ml-auto" style={{ color: 'var(--text-muted)' }}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {selectedBlog.date || (selectedBlog.createdAt ? new Date(selectedBlog.createdAt).toLocaleDateString() : 'July 2026')}
                  </span>
                </div>
              </div>
            </div>

            {(selectedBlog.imageUrl || selectedBlog.category) && (
              <div className="w-full max-h-[380px] rounded-2xl overflow-hidden my-6 shadow-md border flex items-center justify-center" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                <img
                  src={selectedBlog.imageUrl || getDefaultBlogImage(selectedBlog.category)}
                  alt={selectedBlog.title}
                  className="w-full h-full object-cover max-h-[380px]"
                  onError={(e) => { e.target.src = getDefaultBlogImage(selectedBlog.category); }}
                />
              </div>
            )}

            <div
              className="prose prose-zinc dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-4 pt-4 border-t"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedBlog.content || ''}
              </ReactMarkdown>
            </div>

            <div className="pt-10 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => {
                  setSelectedBlog(null);
                  if (onNavigate) {
                    onNavigate('/blog');
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer w-full sm:w-auto justify-center"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              >
                <ArrowLeft className="w-4 h-4" />
                All Articles
              </button>
              <span className="text-xs text-muted">Logbook Plus Engineering &bull; Privacy First</span>
            </div>
          </motion.div>
        ) : (
          /* Blog List View */
          <div className="space-y-8 sm:space-y-12 w-full">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4 text-center sm:text-left"
            >
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium border shadow-xs"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                </span>
                <span>Engineering Journal &bull; Cryptography &bull; Local-First Architecture</span>
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]" style={{ color: 'var(--text-primary)' }}>
                Logbook Tech Blog <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
                  Architecture & Privacy.
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>
                Deep dives into sovereign offline architectures, client-side cryptographic vaults, and local-first personal cloud innovations.
              </p>
            </motion.div>

            {/* Search & Category Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${activeCategory === cat ? 'shadow-sm' : 'hover:scale-105'
                      }`}
                    style={activeCategory === cat
                      ? { backgroundColor: 'var(--text-primary)', color: 'var(--bg-base)' }
                      : { backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent-blue transition-colors"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            {/* Blog Cards Grid */}
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Loading articles...</p>
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="p-10 rounded-2xl text-center space-y-3 border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                <ScrollText className="w-8 h-8 mx-auto text-zinc-400" />
                <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>No articles match your search</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or search keywords.</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                  className="btn-primary-unified px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredBlogs.map((post, idx) => (
                  <motion.div
                    key={post._id || post.id || post.slug || idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    onClick={() => {
                      setSelectedBlog(post);
                      if (onNavigate) {
                        onNavigate(`/blog/${post.slug || post.id || post._id}`);
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="rounded-2xl border p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                  >
                    <div className="space-y-4">
                      <div className="w-full h-44 rounded-xl overflow-hidden border relative" style={{ borderColor: 'var(--border)', background: 'var(--bg-input)' }}>
                        <img
                          src={post.imageUrl || getDefaultBlogImage(post.category)}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.target.src = getDefaultBlogImage(post.category); }}
                        />
                        <span className="absolute top-3 left-3 text-[10px] font-bold text-accent-blue bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-blue-500/30">
                          {post.category || 'Guides'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {post.date || (post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'July 2026')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {post.readTime || '4 min read'}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold tracking-tight line-clamp-2 group-hover:text-accent-blue transition-colors leading-snug" style={{ color: 'var(--text-primary)' }}>
                        {post.title}
                      </h3>

                      <p className="text-xs sm:text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                        {post.excerpt || (post.content ? post.content.slice(0, 150) + '...' : '')}
                      </p>
                    </div>

                    <div className="pt-5 mt-5 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-2">
                        <img
                          src={post.authorAvatar || '/assets/images/app_logo.webp'}
                          alt={post.author || 'Logbook Team'}
                          className="w-6 h-6 rounded-full object-cover border border-zinc-200 dark:border-white/10 shrink-0"
                          onError={(e) => { e.target.src = '/assets/images/app_logo.webp'; }}
                        />
                        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {post.author || 'Logbook Team'}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1 text-xs font-bold text-accent-blue group-hover:translate-x-1 transition-transform">
                        Read
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const fallbackBlogs = [
  {
    id: 1,
    title: 'Why Local-First Architecture is the Future of Personal Accounting',
    category: 'Architecture',
    author: 'Logbook Team',
    authorAvatar: '/assets/images/app_logo.webp',
    date: 'July 14, 2026',
    readTime: '5 min read',
    imageUrl: '/assets/images/General.png',
    excerpt: 'Centralized servers hold vast amounts of financial logs vulnerable to third-party data breaches. Here is how Logbook Plus keeps your financial life strictly on your hardware.',
    content: `## The Problem with Cloud Accounting

When accounting applications store financial records in shared database clusters, users trade sovereignty for convenience. Every invoice snapshot, bank reference number, and receipt is vulnerable to server misconfigurations, unauthorized employee inspection, and third-party API compromises.

## The Local-First Invariant

Logbook Plus was architected with a non-negotiable invariant: **all transactions, ledger metadata, and receipt images reside primarily on your local device**. 

1. **Instant Offline Read/Write**: Operations execute in sub-millisecond latencies against a local database without waiting for network round-trips.
2. **End-to-End Encryption**: When remote cloud backup is enabled, files are encrypted with military-grade AES-256 before leaving your handset.
3. **Zero Telemetry on Financial Balances**: We have no visibility into how much you earn, spend, or categorize.`
  },
  {
    id: 2,
    title: 'Client-Side AES-256 Encryption: Protecting Offline Backup Vaults',
    category: 'Security',
    author: 'Security Core',
    authorAvatar: '/assets/images/app_logo.webp',
    date: 'June 28, 2026',
    readTime: '6 min read',
    imageUrl: '/assets/images/Security.png',
    excerpt: 'An inside look at our cryptographic implementation that guarantees your backups remain mathematically unbreakable even if a cloud host is compromised.',
    content: `## Zero-Knowledge Encryption Model

Most services advertise "encryption at rest", but retain the decryption keys in their key management systems. In contrast, Logbook Plus implements a **zero-knowledge model**:

- **Key Derivation**: Your master backup passphrase is fed through PBKDF2 with SHA-256 and high iteration counts to derive a 256-bit symmetric encryption key.
- **Payload Encryption**: Backup archives are sealed using AES-256-GCM, providing both confidentiality and cryptographic integrity verification.
- **Zero Server Key Storage**: Decryption keys are never stored, transmitted, or cached on our cloud servers.`
  },
  {
    id: 3,
    title: 'Self-Hosting Your Logbook: WebDAV & Nextcloud Synchronization',
    category: 'Guides',
    author: 'Engineering',
    authorAvatar: '/assets/images/app_logo.webp',
    date: 'May 19, 2026',
    readTime: '4 min read',
    imageUrl: '/assets/images/Guides.png',
    excerpt: 'Step-by-step instructions for configuring private WebDAV endpoints and self-hosted Nextcloud instances for sovereign backup synchronization.',
    content: `## Absolute Data Sovereignty

For privacy advocates and enterprise professionals who prefer to run their own infrastructure, Logbook Plus supports direct backup synchronization to any standard WebDAV endpoint.

### Recommended Self-Hosted Targets
- **Nextcloud / ownCloud**: Native WebDAV sync with revision history.
- **Synology NAS / QNAP**: Private cloud appliances inside your home LAN.
- **MinIO / S3-Compatible Storage**: Encrypted bucket storage for distributed setups.`
  }
];
