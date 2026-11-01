import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../useLanguage.js';

export default function BentoFeatures() {
  const { t } = useLanguage();

  const pillars = [
    {
      title: 'Private Local Database (SQLite3)',
      category: 'DATA CUSTODY',
      desc: 'Your personal income, expenses, and transaction logs live directly in a private encrypted SQLite database stored on your physical device. Zero tracking, zero telemetry, zero surveillance.',
      detail: 'Local SQLite3 vault · Strict client custody · Complete offline autonomy'
    },
    {
      title: 'Zero-Knowledge Client Encryption',
      category: 'CRYPTOGRAPHIC PRIVACY',
      desc: 'Financial entries and receipt notes are locally encrypted with AES-256 GCM using keys derived from your passphrase. No third party or remote server can decrypt your records.',
      detail: 'AES-256 client cipher · PBKDF2 passphrase hashing · Zero plaintext exposure'
    },
    {
      title: 'Personal Cash Flow & Budget Control',
      category: 'FINANCIAL INTELLIGENCE',
      desc: 'Categorize spending, monitor monthly surplus, track savings goals, and understand personal cash flow without exposing your bank accounts to third-party data aggregators.',
      detail: 'Granular budget heads · Instant offline balance summaries · Verified transaction trails'
    },
    {
      title: 'Sovereign Multi-Target Sync',
      category: 'DATA INDEPENDENCE',
      desc: 'Easily backup and restore your encrypted private database to your personal WebDAV or self-hosted server. You maintain absolute ownership with no proprietary lock-in.',
      detail: 'WebDAV & self-host ready · One-click recovery · Portable JSON/CSV exports'
    }
  ];

  return (
    <section className="py-20 px-4 md:px-8 border-t" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border)' }}>
      <div className="w-full max-w-[95%] xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mb-14 text-left space-y-3"
        >
          <span className="text-xs font-semibold tracking-wider uppercase font-mono" style={{ color: 'var(--text-muted)' }}>
            System Architecture
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Engineered for personal finance with complete private data custody.
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Logbook Plus replaces cloud-tracking fintech apps with an offline-first private database, giving you 100% control over your financial records.
          </p>
        </motion.div>

        {/* Structured 2x2 Architectural Grid (No icon boxes, no blur, no gradients) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 rounded-xl border flex flex-col justify-between space-y-6 transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="space-y-3">
                <span className="text-[11px] font-semibold tracking-wider font-mono px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800" style={{ color: 'var(--text-secondary)' }}>
                  {pillar.category}
                </span>
                <h3 className="text-xl md:text-2xl font-bold pt-1" style={{ color: 'var(--text-primary)' }}>
                  {pillar.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {pillar.desc}
                </p>
              </div>

              <div
                className="pt-4 border-t font-mono text-xs flex items-center justify-between"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                <span>{pillar.detail}</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
