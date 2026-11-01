import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../useLanguage.js';

export default function AboutView() {
  const { t } = useLanguage();

  return (
    <div className="py-12 md:py-20 w-full max-w-[95%] xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-8 md:px-12 relative text-left">
      
      {/* Editorial Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-3xl space-y-4 mb-16"
      >
        <span className="text-xs font-semibold tracking-wider uppercase font-mono" style={{ color: 'var(--text-muted)' }}>
          {t('ourPhilosophy')}
        </span>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
          {t('philosophyTitle')}
        </h1>
        <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {t('philosophySubtitle')}
        </p>
      </motion.div>

      {/* Mission & Purpose - Clean 2-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="p-8 rounded-xl border space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider font-mono" style={{ color: 'var(--text-muted)' }}>
            Mission
          </span>
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('ourMission')}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {t('missionDesc')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }}
          className="p-8 rounded-xl border space-y-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider font-mono" style={{ color: 'var(--text-muted)' }}>
            Security Invariant
          </span>
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('sovereigntyShield')}
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {t('sovereigntyDesc')}
          </p>
        </motion.div>
      </div>

      {/* Core Engineering Principles - Systematic 2x2 grid instead of 3 icon boxes in a row */}
      <div className="space-y-6 mb-16">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {t('coreValues')}
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('coreValuesDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="p-6 rounded-xl border space-y-2"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('valuePrivacyTitle')}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t('valuePrivacyDesc')}
            </p>
          </div>

          <div
            className="p-6 rounded-xl border space-y-2"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('valueCloudTitle')}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t('valueCloudDesc')}
            </p>
          </div>

          <div
            className="p-6 rounded-xl border space-y-2"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('valueLocalTitle')}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t('valueLocalDesc')}
            </p>
          </div>

          <div
            className="p-6 rounded-xl border space-y-2"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              Open Formats & Interoperability
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Ledger data is serialized in standard SQLite and CSV tables. You are never trapped inside a proprietary database engine or subscription wall.
            </p>
          </div>
        </div>
      </div>

      {/* Team & Governance - Clean, solid cards without gradient overlays */}
      <div className="space-y-6 mb-16">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Governance & Engineering
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Maintained by core software engineers and supported by independent privacy advocates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="p-6 rounded-xl border space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold font-mono tracking-wider uppercase px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800" style={{ color: 'var(--text-secondary)' }}>
                System Architecture
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Lead Dev</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Architected the zero-knowledge PBKDF2/AES-GCM encryption layer, SQLite local persistence engine, and Kotlin Ktor client pipelines across desktop and mobile clients.
            </p>
            <div className="pt-2 font-mono text-xs flex gap-2 flex-wrap" style={{ color: 'var(--text-muted)' }}>
              <span>React</span> · <span>Express</span> · <span>Kotlin</span> · <span>SQLite</span>
            </div>
          </div>

          <div
            className="p-6 rounded-xl border space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold font-mono tracking-wider uppercase px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800" style={{ color: 'var(--text-secondary)' }}>
                Open Standards
              </span>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Community</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Supported by community contributors auditing security patches, reviewing REST API schemas, and maintaining production Docker templates.
            </p>
            <div className="pt-2 font-mono text-xs flex gap-4" style={{ color: 'var(--text-muted)' }}>
              <a href="https://github.com/noreplylogbookpro-code/Logbook" target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold" style={{ color: 'var(--text-primary)' }}>
                GitHub Repository
              </a>
              <a href="https://discord.gg/28xCSvTUkw" target="_blank" rel="noopener noreferrer" className="hover:underline font-semibold" style={{ color: 'var(--text-primary)' }}>
                Discord Community
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
