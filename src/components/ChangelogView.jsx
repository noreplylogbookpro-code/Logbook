import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Sparkles, CheckCircle2, Tag, Calendar, ChevronRight } from 'lucide-react';

export default function ChangelogView({ onNavigate }) {
  const [changelogs, setChangelogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChangelogs = async () => {
      try {
        const res = await fetch('/api/changelogs');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setChangelogs(data);
          } else {
            setChangelogs(fallbackChangelogs);
          }
        } else {
          setChangelogs(fallbackChangelogs);
        }
      } catch (err) {
        console.error('Failed to load dynamic changelogs:', err);
        setChangelogs(fallbackChangelogs);
      } finally {
        setLoading(false);
      }
    };

    fetchChangelogs();
  }, []);

  return (
    <div className="py-10 sm:py-16 md:py-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-left overflow-hidden">
      
      {/* Ambient Background Glow Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-500/5 dark:bg-blue-600/10 blur-[100px] animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-indigo-500/5 dark:bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-12 sm:space-y-16">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-4 text-center sm:text-left"
        >
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium border shadow-xs"
               style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </span>
            <span>Release Engineering &bull; Continuous Delivery &bull; Audit Trail</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]" style={{ color: 'var(--text-primary)' }}>
            Product Changelog <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
              & Milestone Releases.
            </span>
          </h1>

          <p className="text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>
            Detailed record of releases, cryptographic protocol updates, bug patches, and performance optimizations across Android and Web Vault.
          </p>
        </motion.div>

        {/* Timeline */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-accent-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Loading release records...</p>
          </div>
        ) : (
          <div className="relative border-l-2 ml-2 sm:ml-4 space-y-8 sm:space-y-12" style={{ borderColor: 'var(--border)' }}>
            {changelogs.map((item, idx) => (
              <motion.div
                key={item._id || item.version || idx}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="relative pl-6 sm:pl-10"
              >
                {/* Glowing Indicator Dot */}
                <div
                  className="absolute -left-[9px] top-2 w-4 h-4 rounded-full border-2 transition-transform duration-300 hover:scale-125"
                  style={{
                    backgroundColor: item.isMajor ? '#3b82f6' : 'var(--bg-surface)',
                    borderColor: item.isMajor ? '#60a5fa' : 'var(--border)',
                    boxShadow: item.isMajor ? '0 0 12px rgba(59, 130, 246, 0.6)' : 'none'
                  }}
                />

                <div
                  className="p-6 sm:p-8 rounded-3xl border space-y-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  {/* Release Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono" style={{ color: 'var(--text-primary)' }}>
                        {item.version}
                      </span>
                      {item.isMajor && (
                        <span className="px-3 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full bg-blue-500/10 text-accent-blue border border-blue-500/30 flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-3 h-3" />
                          Major Release
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      <Calendar className="w-3.5 h-3.5 text-accent-blue" />
                      <span>{item.date}</span>
                    </div>
                  </div>

                  {/* Release Description */}
                  {item.description && (
                    <p className="text-sm sm:text-base font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {item.description}
                    </p>
                  )}

                  {/* Release Highlights / Bullets */}
                  {Array.isArray(item.items) && item.items.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <span className="text-xs font-mono uppercase tracking-wider block font-bold text-accent-blue">
                        Key Updates & Enhancements
                      </span>
                      <ul className="space-y-2.5 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {item.items.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2.5 leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const fallbackChangelogs = [
  {
    version: 'v2.2.0',
    date: 'November 2026',
    isMajor: true,
    description: 'Statutory DPDP Act 2023 compliance integration, automated DSAR export workflows, and refreshed responsive views.',
    items: [
      'Added fully responsive standalone pages for Blog, Changelog, Careers, Help Center, and Contact.',
      'Completed statutory compliance with India DPDP Act 2023 (Section 5 itemized notices, Section 9 minor protections).',
      'Added DSAR machine-readable JSON data export mechanism inside user account dashboard.',
      'Removed legacy mobile dropdown navigation in favor of direct responsive views.',
      'Added route loading visual transitions and scroll reveal micro-animations.'
    ]
  },
  {
    version: 'v2.1.0',
    date: 'October 2026',
    isMajor: false,
    description: 'Account Deletion flow enhancements and expanded cookie-less local storage privacy.',
    items: [
      'Self-service instant account deletion flow with OTP confirmation code and 2FA challenge.',
      'Zero-cookie strict audit: verified zero third-party telemetry, ad pixels, or trackers.',
      'Added multi-lingual UI switcher supporting English and regional preferences.',
      'Enhanced local database indexing for instant searches across 10,000+ transaction records.'
    ]
  },
  {
    version: 'v2.0.9',
    date: 'August 2026',
    isMajor: true,
    description: 'Cloud backup support, WebDAV protocols, and client-side AES-256 encryption.',
    items: [
      'Added cloud backup support (WebDAV / Nextcloud / isolated sovereign cloud vault).',
      'Client-side AES-256 encryption for all backup zip archives prior to network transmission.',
      'Two-Factor Authentication (2FA) with TOTP authenticator app support.',
      'Added encrypted security questions for offline account recovery fallback.'
    ]
  },
  {
    version: 'v2.0.0',
    date: 'May 2026',
    isMajor: true,
    description: 'Initial release of Logbook Plus sovereign expense tracking suite for Android & Web.',
    items: [
      'Local-first SQLite database architecture with zero network dependencies.',
      'Multi-currency ledger entries, receipt image attachments, and customizable categories.',
      'Export financial logs to Excel (.xlsx) and Word (.docx) formats.',
      'Dark mode and light mode system theme synchronization.'
    ]
  }
];
