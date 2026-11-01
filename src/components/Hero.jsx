import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Coffee, ShoppingBag, ArrowDownLeft, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '../useLanguage.js';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>

      {/* Ambient Background Glow Blobs (Clean Neutral Blue/Indigo) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-blue-500/5 dark:bg-blue-600/10 blur-[90px] sm:blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-24 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-indigo-500/5 dark:bg-indigo-600/10 blur-[90px] sm:blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-purple-500/5 dark:bg-purple-600/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">

        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium mb-8 backdrop-blur-md border shadow-xs"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)'
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </span>
          <span>Local First &bull; Client Encrypted &bull; Zero Telemetry</span>
        </motion.div>

        {/* Hero Title with Dual-Mode Gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 max-w-5xl leading-[1.08] text-center"
          style={{ color: 'var(--text-light)' }}
        >
          Expense Intelligence <br className="hidden sm:inline" />
          <span className="text-gradient-hero">
            That Stays Yours.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="text-base sm:text-lg md:text-xl mb-10 max-w-2xl leading-relaxed text-center"
          style={{ color: 'var(--text-muted)' }}
        >
          Stop trading your financial behavior for cloud convenience. Take back control with an offline-first, locally encrypted personal ledger engineered for absolute data custody.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-16 sm:mb-20"
        >
          <a
            href="https://play.google.com/store/apps/details?id=com.logbookplus"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-lg cursor-pointer"
            style={{
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-base)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}
          >
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6 l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z" />
            </svg>
            <span>Download for Android</span>
          </a>

          <a
            href="/app/"
            className="btn-secondary transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>Launch Web Vault</span>
            <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
          </a>
        </motion.div>

        {/* Interactive / Visual App Dashboard Mockup Card */}
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl relative"
        >
          {/* Subtle Outer Glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-purple-500/15 blur-xl opacity-70 dark:opacity-50 pointer-events-none" />

          {/* Main Glass Shell */}
          <div
            className="relative rounded-2xl sm:rounded-3xl border backdrop-blur-xl p-3 sm:p-5 md:p-6 shadow-2xl overflow-hidden text-left"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)'
            }}
          >
            {/* Mockup Window Top Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
                <span className="ml-2 text-xs font-mono font-semibold hidden sm:inline-block" style={{ color: 'var(--text-muted)' }}>
                  vault.logbook.sqlite &bull; AES-256 GCM
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono px-2.5 py-1 rounded-full border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>OFFLINE_FIRST</span>
              </div>
            </div>

            {/* Mockup Dashboard Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4">

              {/* Balance & Spending Bar Chart Preview (8 cols on desktop) */}
              <div
                className="md:col-span-7 rounded-2xl border p-5 sm:p-6 flex flex-col justify-between space-y-6"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border)'
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                      Current Ledger Balance
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      +14.2% this month
                    </span>
                  </div>
                  <p className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight mt-1" style={{ color: 'var(--text-primary)' }}>
                    $12,450.00
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Locally aggregated across 4 personal budget accounts
                  </p>
                </div>

                {/* Simulated Financial Cashflow Bar Chart */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    <span>Weekly Inflow / Outflow</span>
                    <span>100% Client-Computed</span>
                  </div>
                  <div className="flex items-end gap-2 sm:gap-3 h-28 w-full pt-3">
                    {[
                      { label: 'Mon', h: '38%', active: false },
                      { label: 'Tue', h: '62%', active: false },
                      { label: 'Wed', h: '48%', active: false },
                      { label: 'Thu', h: '82%', active: false },
                      { label: 'Fri', h: '68%', active: false },
                      { label: 'Sat', h: '94%', active: true },
                      { label: 'Sun', h: '55%', active: false }
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-300 group-hover:scale-105 ${bar.active
                            ? 'bg-blue-600 dark:bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                            : 'bg-zinc-300 dark:bg-zinc-700/80 hover:bg-zinc-400 dark:hover:bg-zinc-600'
                            }`}
                          style={{ height: bar.h }}
                        />
                        <span className="text-[10px] font-mono font-medium" style={{ color: 'var(--text-muted)' }}>
                          {bar.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Transactions List (5 cols on desktop) */}
              <div
                className="md:col-span-5 rounded-2xl border p-5 sm:p-6 flex flex-col justify-between space-y-4"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border)'
                }}
              >
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                  <h4 className="text-xs font-mono uppercase tracking-wider font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Recent Transactions
                  </h4>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>3 of 142</span>
                </div>

                <div className="space-y-3.5 divide-y" style={{ borderColor: 'var(--border)' }}>
                  {/* Tx 1 */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                          Coffee Roasters
                        </p>
                        <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Today &bull; Food & Drinks</p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                      -$4.50
                    </span>
                  </div>

                  {/* Tx 2 */}
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                          Supermarket Supplies
                        </p>
                        <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Yesterday &bull; Grocery</p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                      -$82.10
                    </span>
                  </div>

                  {/* Tx 3 */}
                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                          Direct Deposit Salary
                        </p>
                        <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>12 Oct &bull; Income</p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +$4,200.00
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t text-center" style={{ borderColor: 'var(--border)' }}>
                  <a href="/app/" className="text-xs font-bold text-accent-blue hover:underline inline-flex items-center gap-1">
                    Open Full Database View &rarr;
                  </a>
                </div>
              </div>

            </div>

            {/* Floating E2E Encrypted Badge */}
            <div
              className="mt-4 sm:mt-5 px-3.5 py-1.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-mono"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)'
              }}
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold">AES-256 Zero-Knowledge Vault</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hidden sm:inline-block">
                &bull; Zero Plaintext Transmission
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
