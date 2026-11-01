import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Database, Lock, Cpu, Users, ArrowUpRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../useLanguage.js';

export default function AboutView() {
  const { t } = useLanguage();

  return (
    <div className="py-10 sm:py-16 md:py-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-left overflow-hidden">
      
      {/* Ambient Background Glow Blobs (Clean Neutral Blue/Indigo - Zero Green) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-500/5 dark:bg-blue-600/10 blur-[100px] animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-indigo-500/5 dark:bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full space-y-12 sm:space-y-16">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          {/* Status Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border shadow-xs bg-zinc-100 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 relative flex">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            </span>
            Our Philosophy • Zero Data Telemetry
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
            {t('philosophyTitle') || 'Financial Software Built on Absolute Privacy'}
          </h1>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-2xl">
            {t('philosophySubtitle') || 'We believe personal accounting should never turn you into a product. Logbook Plus was built from the ground up to guarantee mathematical data sovereignty.'}
          </p>
        </motion.div>

        {/* Mission & Purpose - Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="group rounded-3xl border p-6 sm:p-8 md:p-10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-zinc-200/90 dark:border-zinc-800 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/10 text-accent-blue flex items-center justify-center border border-blue-500/20 transition-transform duration-300 group-hover:scale-110">
                <Database className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent-blue block">
                Mission
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                {t('ourMission') || 'Guaranteed Data Sovereignty'}
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                {t('missionDesc') || 'To provide individuals and small operations with an uncompromised financial tracking engine that operates completely independently of ad networks and corporate clouds.'}
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>Client-Side SQLite</span>
              <span className="text-emerald-500 font-semibold">✓ 100% Offline Capable</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="group rounded-3xl border p-6 sm:p-8 md:p-10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-zinc-200/90 dark:border-zinc-800 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 transition-transform duration-300 group-hover:scale-110">
                <Lock className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-500 block">
                Security Invariant
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                {t('sovereigntyShield') || 'Zero Knowledge Architecture'}
              </h2>
              <p className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                {t('sovereigntyDesc') || 'Encryption keys never touch our servers. Every byte stored on device or sent to your optional backup destination is sealed with AES-256-GCM before transport.'}
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>PBKDF2 SHA-256</span>
              <span className="text-indigo-500 font-semibold">Client-Side Keys</span>
            </div>
          </motion.div>
        </div>

        {/* Core Values 2x2 Bento Grid */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              {t('coreValues') || 'Engineering Invariants'}
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">
              {t('coreValuesDesc') || 'The technical principles that govern every pull request and line of code.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 sm:p-8 rounded-3xl border backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-accent-blue flex items-center justify-center border border-blue-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                {t('valuePrivacyTitle') || 'Zero Analytics & Tracker SDKs'}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {t('valuePrivacyDesc') || 'No Google Analytics, no Facebook Pixel, and no telemetry pings. We do not inspect your income, transactions, or balance sheets.'}
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl border backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                {t('valueCloudTitle') || 'Self-Host & Cloud Agnostic'}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {t('valueCloudDesc') || 'Sync to your own private Nextcloud, WebDAV, or self-hosted Docker vault with 100% feature parity.'}
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl border backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                {t('valueLocalTitle') || 'Local-First Persistence'}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {t('valueLocalDesc') || 'Your ledger lives inside an encrypted SQLite file on your physical hardware. It boots instantly and operates without internet connectivity.'}
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl border backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                Open Formats & Interoperability
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Ledger data is serialized in standard SQLite and CSV tables. You are never trapped inside a proprietary database engine or subscription wall.
              </p>
            </div>
          </div>
        </div>

        {/* Governance & Open Source Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Governance & Engineering
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">
              Maintained by core software engineers and supported by independent privacy advocates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 sm:p-8 rounded-3xl border backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-mono tracking-wider uppercase px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                  System Architecture
                </span>
                <span className="text-xs font-mono text-zinc-500">Lead Dev</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Architected the zero-knowledge PBKDF2/AES-GCM encryption layer, SQLite local persistence engine, and Kotlin Ktor client pipelines across desktop and mobile clients.
              </p>
              <div className="pt-2 font-mono text-xs flex gap-2 flex-wrap text-zinc-500">
                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">React</span>
                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">Kotlin</span>
                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">SQLite</span>
                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">Express</span>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl border backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-mono tracking-wider uppercase px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
                  Open Standards
                </span>
                <span className="text-xs font-mono text-zinc-500">Community</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Supported by community contributors auditing security patches, reviewing REST API schemas, and maintaining production Docker templates.
              </p>
              <div className="pt-2 font-mono text-xs flex gap-4 text-zinc-500">
                <a
                  href="https://github.com/noreplylogbookpro-code/Logbook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent-blue hover:underline font-semibold"
                >
                  GitHub Repository <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://discord.gg/28xCSvTUkw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-500 hover:underline font-semibold"
                >
                  Discord Community <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
