import React from 'react';
import { motion } from 'framer-motion';
import { FileCode, Database, Shield, Lock, Terminal, Cloud, ArrowRight, ExternalLink } from 'lucide-react';

export default function DocumentationView({ onNavigate }) {
  const sections = [
    {
      icon: Database,
      title: 'Local-First Architecture',
      description: 'Logbook Plus uses on-device SQLite storage for all ledger transactions, receipt photos, and category balances. Read and write latencies are sub-millisecond, with zero dependency on active internet connection.'
    },
    {
      icon: Shield,
      title: 'Cryptographic Security & AES-256',
      description: 'Backup archives are serialized into encrypted zip containers using AES-256-GCM authenticated encryption. Your master password is never transmitted to any external server.'
    },
    {
      icon: Cloud,
      title: 'WebDAV & Nextcloud Sync',
      description: 'Configure standard WebDAV endpoints to synchronize encrypted backups directly to your personal Nextcloud, Synology NAS, or private cloud storage allocation without vendor lock-in.'
    },
    {
      icon: Terminal,
      title: 'Developer REST APIs',
      description: 'Access programmable endpoints for vault synchronization, automated ledger backups, healthchecks, and helpdesk ticketing automation.'
    }
  ];

  return (
    <div className="py-8 sm:py-12 md:py-20 w-full max-w-[95%] xl:max-w-[1200px] 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 relative text-left">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl space-y-4 mb-10 sm:mb-14"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-mono bg-blue-500/10 text-accent-blue border border-blue-500/20">
          <FileCode className="w-3.5 h-3.5" />
          Engineering & User Docs
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
          Documentation & Protocols
        </h1>
        <p className="text-sm sm:text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Comprehensive guides covering client-side cryptographic vaults, local-first SQLite operations, backup formats, and developer API endpoints.
        </p>
      </motion.div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 sm:mb-16">
        {sections.map((sec, i) => (
          <motion.div
            key={sec.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="p-6 sm:p-7 rounded-2xl border space-y-3"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-accent-blue flex items-center justify-center border border-blue-500/20">
              <sec.icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {sec.title}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {sec.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Developer Portal CTA */}
      <div
        className="p-8 sm:p-10 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6"
        style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1.5 text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Looking for REST API Endpoints & Schemas?
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            Explore authentication headers, rate limits, schema models, and interactive API requests inside our Developer Portal.
          </p>
        </div>

        <a
          href="/dev/"
          className="btn-primary-unified inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          <Terminal className="w-4 h-4" />
          Open Dev Portal
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
