import React from 'react';
import { motion } from 'framer-motion';
import { FileCode, Database, Shield, Lock, Terminal, Cloud, ArrowRight, ExternalLink } from 'lucide-react';

export default function DocumentationView({ onNavigate }) {
  const sections = [
    {
      icon: Database,
      title: 'Local-First Architecture',
      description: 'Logbook Plus uses on-device SQLite storage for all ledger transactions, receipt photos, and category balances. Read and write latencies are sub-millisecond, with zero dependency on active internet connection.',
      spec: 'Driver: SQLite3 • Cache: In-Memory WAL'
    },
    {
      icon: Shield,
      title: 'Cryptographic Security & AES-256',
      description: 'Backup archives are serialized into encrypted zip containers using AES-256-GCM authenticated encryption. Your master password is never transmitted to any external server.',
      spec: 'Cipher: AES-256-GCM • KDF: PBKDF2'
    },
    {
      icon: Cloud,
      title: 'WebDAV & Nextcloud Sync',
      description: 'Configure standard WebDAV endpoints to synchronize encrypted backups directly to your personal Nextcloud, Synology NAS, or private cloud storage allocation without vendor lock-in.',
      spec: 'Protocol: RFC 4918 • TLS 1.3'
    },
    {
      icon: Terminal,
      title: 'Developer REST APIs',
      description: 'Access programmable endpoints for vault synchronization, automated ledger backups, healthchecks, and helpdesk ticketing automation.',
      spec: 'Format: OpenAPI 3.0 • JSON REST'
    }
  ];

  return (
    <div className="py-10 sm:py-16 md:py-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-left overflow-hidden">



      <div className="relative z-10 w-full space-y-12 sm:space-y-16">

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
            <span>Engineering Specifications &bull; WebDAV &bull; Client Cryptography</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]" style={{ color: 'var(--text-primary)' }}>
            Documentation <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
              & Protocols.
            </span>
          </h1>

          <p className="text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>
            Comprehensive guides covering client-side cryptographic vaults, local-first SQLite operations, backup formats, and developer API endpoints.
          </p>
        </motion.div>

        {/* Overview Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {sections.map((sec, i) => (
            <motion.div
              key={sec.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="p-7 sm:p-8 rounded-3xl border flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 shadow-xs"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                  <sec.icon className="w-6 h-6 text-accent-blue" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {sec.title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {sec.description}
                </p>
              </div>

              <div className="pt-3 border-t font-mono text-[11px]" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{sec.spec}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Developer Portal CTA */}
        <div
          className="p-8 sm:p-10 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
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
            className="btn-primary-unified inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 shadow-md"
          >
            <Terminal className="w-4 h-4" />
            Open Dev Portal
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
