import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, ChevronDown, HelpCircle, Mail, ArrowRight, ShieldCheck, Database, FileSpreadsheet } from 'lucide-react';

export default function HelpCenterView({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const faqs = [
    {
      category: 'General',
      q: "What is Logbook Plus?",
      a: "Logbook Plus is a digital logbook and ledger application for securely tracking income and expense entries with receipt photos, tags, and multi-currency details. It operates with a local-first philosophy, meaning your financial logs reside on your physical smartphone."
    },
    {
      category: 'Security',
      q: "Is my financial data secure?",
      a: "Yes. All local ledger records and receipt photos are stored on-device and encrypted using military-grade AES-256 encryption. We enforce zero-knowledge principles—we never store or transmit your master decryption password."
    },
    {
      category: 'Export',
      q: "How do I export my data?",
      a: "Open the app, navigate to Export in the navigation bar, choose your date range, and select your preferred format: Microsoft Excel (.xlsx), Microsoft Word (.docx), or PDF (Premium). You can share or archive the generated reports directly."
    },
    {
      category: 'General',
      q: "Can I attach receipt photos?",
      a: "Yes. You can attach multiple receipt images and invoice snapshots to every log entry. Images are stored inside your device's isolated app storage and included in encrypted backups."
    },
    {
      category: 'Backup',
      q: "Does Logbook Plus support cloud and local backups?",
      a: "Both automatic and manual backups are supported. Free users can create unlimited local backups on device storage. Premium subscribers can enable encrypted cloud backups or connect their own self-hosted WebDAV / Nextcloud server."
    },
    {
      category: 'General',
      q: "Is dark mode available?",
      a: "Yes. Both sleek dark mode and clean light mode are supported across the mobile application and web dashboard. The theme synchronizes automatically with your system preference or can be toggled manually in Settings."
    },
    {
      category: 'Backup',
      q: "How can I restore my data on a new phone?",
      a: "Install Logbook Plus on your new device, go to Settings → Backup & Restore, and select 'Import Backup'. Select your saved encrypted backup file or download your vault backup from Cloud Storage, then enter your encryption password to restore all transactions and photos instantly."
    },
    {
      category: 'General',
      q: "Is an internet connection required to use the app?",
      a: "No. The core application is 100% offline-first. You can record transactions, organize categories, attach receipts, and view charts anywhere without cellular reception or Wi-Fi."
    },
    {
      category: 'General',
      q: "How can I contact technical support?",
      a: "You can submit an inquiry via our Contact Support page at /contact/ or email our dedicated support engineering desk directly at support@logbookplus.co.in."
    },
    {
      category: 'General',
      q: "Is Logbook Plus free to use?",
      a: "Yes. Core offline expense tracking, unlimited local transactions, receipt photo attachments, and standard exports are completely free. Optional cloud backups and advanced business analytics are available via low-cost premium plans."
    },
    {
      category: 'Export',
      q: "Which file formats are supported for export?",
      a: "Logbook Plus supports Microsoft Excel (.xlsx), Microsoft Word (.docx), PDF reports, and raw encrypted database archive formats (.sqlite/.enc)."
    },
    {
      category: 'General',
      q: "How do I add an expense entry?",
      a: "Tap the floating '+' button on the home screen, select Income or Expense, enter the amount, select category, attach receipt photos if needed, and tap Save."
    },
    {
      category: 'Backup',
      q: "How do I export an encrypted backup file?",
      a: "Go to Settings → Backup → Export Backup. You will be prompted to set or confirm a backup password. An encrypted archive will be saved to your device's Documents or Downloads folder."
    },
    {
      category: 'Security',
      q: "Can I encrypt my backup files?",
      a: "Yes. All backup archives can be password-protected with AES-256 encryption. Without your password, the archive cannot be decompressed or viewed by anyone."
    },
    {
      category: 'Security',
      q: "Can I change my backup encryption password?",
      a: "Yes. You can update your backup encryption password anytime inside Settings → Security & Backups. Future backup exports will use your updated passphrase."
    },
    {
      category: 'General',
      q: "Can I delete or edit entries?",
      a: "Yes. Tap any entry in your transaction list to view details and tap Edit, or long-press an entry to select and delete one or multiple records."
    },
    {
      category: 'General',
      q: "Where are receipt photos saved?",
      a: "Photos are stored in Android's secure application-specific private directory. They are never uploaded to third-party public CDNs without your explicit permission."
    },
    {
      category: 'Backup',
      q: "Can I share my encrypted backup to another device via AirDrop or Nearby Share?",
      a: "Yes. Once an encrypted backup archive is generated, you can transmit it securely via Nearby Share, Bluetooth, email attachment, or USB transfer."
    }
  ];

  const categories = ['All', 'General', 'Security', 'Backup', 'Export'];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCat = activeCategory === 'All' || faq.category === activeCategory;
    const matchesQuery = searchQuery === '' ||
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="py-8 sm:py-12 md:py-20 w-full max-w-[95%] xl:max-w-[1200px] 2xl:max-w-[1300px] mx-auto px-4 sm:px-6 md:px-8 relative text-left">
      {/* Centered Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto space-y-4 mb-8 sm:mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-mono bg-blue-500/10 text-accent-blue border border-blue-500/20">
          <BookOpen className="w-3.5 h-3.5" />
          Documentation & Help
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
          Help Center & FAQ
        </h1>
        <p className="text-sm sm:text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Answers to commonly asked questions about client-side encryption, local SQLite storage, backup restoration, and export formats.
        </p>
      </motion.div>

      {/* Centered Search Bar & Quick Categories */}
      <div className="max-w-4xl mx-auto space-y-4 mb-10 w-full">
        <div className="relative w-full">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExpandedIndex(null);
            }}
            placeholder="Search questions (e.g. backup, encryption, export, receipts)..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm sm:text-base focus:outline-none focus:border-accent-blue transition-colors shadow-sm"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  activeCategory === cat ? 'shadow-sm' : 'hover:scale-105'
                }`}
                style={activeCategory === cat
                  ? { backgroundColor: 'var(--text-primary)', color: 'var(--bg-base)' }
                  : { backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                {cat}
              </button>
            ))}
          </div>
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            Showing {filteredFaqs.length} of {faqs.length} questions
          </span>
        </div>
      </div>

      {/* Centered FAQ Accordion List */}
      <div className="space-y-3 max-w-4xl mx-auto w-full">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 rounded-2xl text-center space-y-3 border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
            <HelpCircle className="w-8 h-8 mx-auto text-zinc-400" />
            <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>No matching questions found</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Try different search terms or reach out to our support team.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
              className="btn-primary-unified px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Show All Questions
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm"
                style={isExpanded
                  ? { borderColor: 'rgba(96,165,250,0.4)', background: 'rgba(96,165,250,0.04)' }
                  : { borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold transition-colors cursor-pointer gap-4"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span className="text-sm sm:text-base leading-snug">{faq.q}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border hidden sm:inline-block" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      {faq.category}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180 text-accent-blue' : ''
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 sm:p-5 pt-0 border-t"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Centered Still need help CTA */}
      <div
        className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto w-full"
        style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Can't find the answer you are looking for?
          </h3>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
            Our engineering and customer support team responds within 24 hours.
          </p>
        </div>

        <a
          href="/contact/"
          className="btn-primary-unified inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          <Mail className="w-4 h-4" />
          Contact Support Desk
        </a>
      </div>
    </div>
  );
}
