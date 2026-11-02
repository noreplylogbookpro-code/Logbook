import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, ShieldCheck, Database, FileSpreadsheet, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../useLanguage.js';
import { useSystemTheme } from '../hooks/useSystemTheme.js';

export default function Hero() {
  const { t } = useLanguage();
  const { theme } = useSystemTheme();

  const heroScreenshot = theme === 'dark'
    ? '/assets/images/screenshots/dark_02_dashboard.webp'
    : '/assets/images/screenshots/light_02_dashboard.webp';

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative min-h-[88vh] flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 pt-12 pb-16 md:pt-16 md:pb-24 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Ambient Background Glow Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-[90px] sm:blur-[120px]" />
        <div className="absolute top-1/3 -right-24 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-[90px] sm:blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-blue-600/5 dark:bg-blue-600/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">

        {/* Verified Status Pill */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium mb-6 sm:mb-8 backdrop-blur-md border shadow-xs"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)'
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Native Android App &bull; 100% Offline SQLite &bull; Zero Ad Trackers</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          id="hero-title"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 max-w-5xl leading-[1.08] text-center"
          style={{ color: 'var(--text-primary)' }}
        >
          Expense Intelligence <br className="hidden sm:inline" />
          <span className="text-[#2467B9] dark:text-blue-400">
            That Stays Yours.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg md:text-xl mb-10 max-w-2xl leading-relaxed text-center"
          style={{ color: 'var(--text-muted)' }}
        >
          The private personal expense logbook for Android. Track daily expenses offline, attach receipt photos, filter custom date ranges, and export Excel & PDF reports with 100% on-device data ownership.
        </motion.p>

        {/* Prominent CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 w-full sm:w-auto mb-14 sm:mb-16"
        >
          {/* Primary Google Play Download Button */}
          <a
            href="https://play.google.com/store/apps/details?id=com.logbookplus"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary min-h-[52px] px-7 py-3.5 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-lg cursor-pointer"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              boxShadow: '0 8px 24px rgba(36, 103, 185, 0.28)'
            }}
          >
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
            </svg>
            <div className="text-left leading-tight">
              <span className="block text-[10px] uppercase font-mono tracking-wider opacity-85">Get it on</span>
              <span className="text-sm font-extrabold tracking-tight">Google Play</span>
            </div>
          </a>

          {/* Secondary Action: Explore Features */}
          <a
            href="#showcase"
            className="btn-secondary min-h-[52px] px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <span>See App Screenshots</span>
            <ArrowRight className="w-4 h-4 ml-0.5 opacity-70" />
          </a>

          {/* Optional Web Vault Link */}
          <a
            href="/app"
            className="btn-secondary min-h-[52px] px-5 py-3.5 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-secondary)'
            }}
          >
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>Launch Web Vault</span>
          </a>
        </motion.div>

        {/* Real Android App Device Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl relative mx-auto"
        >
          {/* Outer Ambient Glow */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-500/20 via-indigo-500/15 to-blue-600/20 blur-2xl opacity-70 pointer-events-none" />

          {/* Device Showcase Container */}
          <div
            className="relative rounded-3xl border backdrop-blur-xl p-4 sm:p-6 md:p-8 shadow-2xl text-left"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

              {/* Smartphone Frame with Real Android Screenshot (5 cols) */}
              <div className="md:col-span-5 flex justify-center order-2 md:order-1">
                <div className="relative w-[240px] sm:w-[270px] md:w-[280px]">
                  {/* Phone Bezel */}
                  <div
                    className="relative rounded-[38px] p-2.5 shadow-2xl border transition-all duration-300"
                    style={{
                      backgroundColor: theme === 'dark' ? '#0b1120' : '#f8fafc',
                      borderColor: 'var(--border)'
                    }}
                  >
                    {/* Punch Hole Camera */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-3 bg-zinc-900 rounded-full z-20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-zinc-800" />
                    </div>

                    {/* App Screen */}
                    <div className="relative rounded-[28px] overflow-hidden bg-black aspect-[9/20] w-full">
                      <img
                        src={heroScreenshot}
                        alt="Logbook Plus Android app dashboard displaying real balance, cashflow trends, and category breakdown"
                        width={720}
                        height={1600}
                        fetchPriority="high"
                        decoding="async"
                        className="w-full h-full object-cover object-top select-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Capabilities & Architecture Specs (7 cols) */}
              <div className="md:col-span-7 space-y-4 order-1 md:order-2">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#2467B9] dark:text-blue-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Real Android App Architecture</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Fast, Local, and Completely Independent
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    Unlike ordinary finance apps that sync your private banking and shopping habits to third-party ad networks, Logbook Plus stores everything inside an on-device SQLite database.
                  </p>
                </div>

                {/* Spec Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div
                    className="p-4 rounded-xl border space-y-1.5"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#2467B9] dark:text-blue-400" />
                      <span className="text-xs font-bold font-mono" style={{ color: 'var(--text-primary)' }}>On-Device SQLite</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      Jetpack Room database with sub-millisecond local reads and writes.
                    </p>
                  </div>

                  <div
                    className="p-4 rounded-xl border space-y-1.5"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold font-mono" style={{ color: 'var(--text-primary)' }}>Multi-Format Export</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      Direct export to Microsoft Excel (.xlsx), CSV, and PDF reports.
                    </p>
                  </div>
                </div>

                {/* Verified Points */}
                <div className="pt-2 space-y-2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Zero account registration or personal email required to start logging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Paper receipts and invoice photos attached directly to log entries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Dynamic Material 3 UI with adaptive List / Staggered Grid switcher</span>
                  </div>
                </div>

                {/* Google Play Trust Strip */}
                <div
                  className="p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}
                >
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Google Play Verified
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    &bull; Android 8.0+ Compatible (~17 MB)
                  </span>
                </div>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
