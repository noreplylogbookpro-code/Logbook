import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListFilter,
  LayoutGrid,
  Camera,
  PieChart,
  FileSpreadsheet,
  CheckCircle2,
  Download,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { useSystemTheme } from '../hooks/useSystemTheme.js';

export default function AppShowcase() {
  const { theme } = useSystemTheme();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      id: 'ledger',
      label: 'Expense Ledger',
      icon: ListFilter,
      title: 'Effortless Daily Expense Tracking',
      badge: 'Core Feature',
      darkImage: '/assets/images/screenshots/dark_03_home.webp',
      lightImage: '/assets/images/screenshots/light_03_home.webp',
      alt: 'Logbook Plus Android app showing daily transaction list with categories, tags, and amounts',
      desc: 'Log expenses and income with single-tap speed. Filter by categories, date ranges, or tags. Instant calculations happen directly in your local on-device SQLite database with zero cloud delay.',
      highlights: [
        'Single-column list with date headings and color-coded transaction amounts',
        'Custom category tags (Food, Travel, Utilities, Income, and custom)',
        'Settlement status badges to track settled and pending expenses',
        '100% functional without cellular reception or Wi-Fi'
      ]
    },
    {
      id: 'grid',
      label: 'Staggered Grid',
      icon: LayoutGrid,
      title: 'Adaptive Staggered Grid Layout',
      badge: 'Material 3 Dynamic',
      darkImage: '/assets/images/screenshots/dark_10_grid.webp',
      lightImage: '/assets/images/screenshots/light_10_grid.webp',
      alt: 'Logbook Plus Android app staggered grid view displaying responsive cards with amounts and tags',
      desc: 'Switch between traditional single-column list mode and a space-saving multi-column staggered grid (Google Keep style). Cards automatically stack dates, tags, and amounts vertically for maximum glanceability.',
      highlights: [
        'Smooth dynamic list/grid toggle right in the top app bar',
        'Auto-hiding floating action button (FAB) for unobstructed browsing',
        'Shared element bounds transitions when opening and editing entries',
        'Persistent view preferences stored on-device via Android DataStore'
      ]
    },
    {
      id: 'receipts',
      label: 'Receipt Photos',
      icon: Camera,
      title: 'Attach Paper Bills & Digital Receipts',
      badge: 'On-Device Sandbox',
      darkImage: '/assets/images/screenshots/dark_11_edit_entry.webp',
      lightImage: '/assets/images/screenshots/light_11_edit_entry.webp',
      alt: 'Logbook Plus Android edit entry screen with receipt photo attachment, date picker, and category chips',
      desc: 'Snap receipt photos or attach invoice images directly to your expense records. Images are isolated in your sandboxed app storage and preserved seamlessly during encrypted backup and restore operations.',
      highlights: [
        'Camera capture or gallery image attachment directly per transaction',
        'Photos stored securely in isolated Android app-specific sandbox',
        'Automatic inclusion in password-protected encrypted ZIP backups',
        'Zero cloud photo uploading without explicit user sync action'
      ]
    },
    {
      id: 'analytics',
      label: 'Cash Flow Dashboard',
      icon: PieChart,
      title: 'Visual Financial Analytics at a Glance',
      badge: 'Sub-Millisecond Engine',
      darkImage: '/assets/images/screenshots/dark_02_dashboard.webp',
      lightImage: '/assets/images/screenshots/light_02_dashboard.webp',
      alt: 'Logbook Plus Android analytics dashboard showing income, expense totals, and category breakdown',
      desc: 'Understand your spending trends with clear visual charts. See income versus expenditure, month-over-month balances, and category distributions computed instantly on your smartphone.',
      highlights: [
        'Total ledger balance, monthly inflow, and outflow totals',
        'Interactive spending category distribution and cashflow trends',
        'Multi-currency support for 180+ global currencies and system locales',
        'All analytics computed locally on-device without remote servers'
      ]
    },
    {
      id: 'export',
      label: 'Export & Backup',
      icon: FileSpreadsheet,
      title: 'Excel / PDF Reports & Encrypted Backup',
      badge: 'Data Sovereignty',
      darkImage: '/assets/images/screenshots/dark_04_export.webp',
      lightImage: '/assets/images/screenshots/light_04_export.webp',
      alt: 'Logbook Plus Android export screen showing custom date picker, format options, and category selection',
      desc: 'Export clean accounting reports for tax filing, business reimbursement, or personal records in Microsoft Excel (.xlsx), CSV, or PDF. Back up your full encrypted database to file or optional WebDAV.',
      highlights: [
        'Export custom date ranges (monthly, quarterly, or custom dates)',
        'Smart category filtering (only displays categories with entries in range)',
        'Direct SQLite database restore or password-protected encrypted ZIP backup',
        'Optional cloud backup to Google Drive, WebDAV, or self-hosted server'
      ]
    }
  ];

  const current = tabs[activeTab];
  const activeImage = theme === 'dark' ? current.darkImage : current.lightImage;

  return (
    <section
      id="showcase"
      aria-labelledby="showcase-heading"
      className="py-20 sm:py-28 px-4 sm:px-6 md:px-8 border-t relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border)' }}
    >
      {/* Background Soft Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/5 dark:bg-blue-600/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-center mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider font-mono bg-blue-500/10 text-[#2467B9] dark:text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-4 h-4" />
            Verified Android App Experience
          </div>
          <h2
            id="showcase-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Built for Real Life on Android
          </h2>
          <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Explore actual screenshots from Logbook Plus. Native Material 3 UI, sub-millisecond SQLite performance, and zero cloud tracking.
          </p>
        </div>

        {/* Accessible Tabs Bar */}
        <div
          role="tablist"
          aria-label="App features screenshots"
          className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-4 mb-10 sm:mb-14 no-scrollbar scroll-smooth"
        >
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isSelected = activeTab === idx;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isSelected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer min-h-[44px] ${
                  isSelected
                    ? 'bg-[#2467B9] text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
                style={{
                  backgroundColor: isSelected ? 'var(--btn-primary-bg)' : 'var(--bg-surface)',
                  color: isSelected ? 'var(--btn-primary-text)' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--btn-primary-border)' : '1px solid var(--border)'
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Panel Content Showcase */}
        <div
          id={`panel-${current.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${current.id}`}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
        >
          {/* Smartphone Mockup Frame (5 cols on desktop) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-[280px] sm:w-[320px] md:w-[340px]">
              {/* Outer Phone Bezel */}
              <div
                className="relative rounded-[42px] p-3 shadow-2xl border transition-all duration-300"
                style={{
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                  borderColor: 'var(--border)',
                  boxShadow: theme === 'dark'
                    ? '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(59, 130, 246, 0.15)'
                    : '0 25px 60px -15px rgba(0, 0, 0, 0.2)'
                }}
              >
                {/* Top Notch / Camera Punchhole */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-900 rounded-full z-20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 mr-2" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                </div>

                {/* Screen Container */}
                <div className="relative rounded-[32px] overflow-hidden bg-black aspect-[9/20] w-full">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`${current.id}-${theme}`}
                      src={activeImage}
                      alt={current.alt}
                      width={720}
                      height={1600}
                      loading="lazy"
                      decoding="async"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="w-full h-full object-cover object-top select-none"
                    />
                  </AnimatePresence>
                </div>

                {/* Bottom Home Indicator Bar */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full bg-zinc-400 dark:bg-zinc-600 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Feature Breakdown & Value Props (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-semibold bg-blue-500/10 text-[#2467B9] dark:text-blue-400 border border-blue-500/20">
                {current.badge}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {current.title}
              </h3>
              <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {current.desc}
              </p>
            </div>

            {/* Verified Feature Checklist */}
            <div
              className="p-6 rounded-2xl border space-y-3.5 backdrop-blur-sm"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold" style={{ color: 'var(--text-muted)' }}>
                Verified Capabilities
              </h4>
              <ul className="space-y-2.5">
                {current.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Direct Google Play Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <a
                href="https://play.google.com/store/apps/details?id=com.logbookplus"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary min-h-[48px] px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)'
                }}
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Install Logbook Plus from Google Play</span>
              </a>

              <a
                href="/pricing"
                className="btn-secondary min-h-[48px] px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                <span>View Free & Cloud Plans</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

