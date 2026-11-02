import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

export default function HomeFaq() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: 'Does Logbook Plus require an internet connection to work?',
      a: 'No. Logbook Plus is an offline-first Android application. All expense and income records, category totals, and receipt photos are stored directly on your phone in an on-device SQLite database. You can create, edit, filter, and review entries without Wi-Fi, cellular reception, or an account.'
    },
    {
      q: 'How do backups and data recovery work if I switch phones?',
      a: 'You can generate encrypted ZIP backup archives at any time from Settings. Save the backup to your device storage, an SD card, or export via your file manager. On your new Android device, install Logbook Plus and select "Restore Backup" to recover 100% of your records, tags, settlement statuses, and receipt photos.'
    },
    {
      q: 'What file formats can I export my financial reports in?',
      a: 'Logbook Plus exports accounting reports in Microsoft Excel (.xlsx), standard CSV, and PDF formats. You can select custom date ranges (this month, last quarter, or custom dates) and filter by specific expense categories for personal budgeting or tax filing.'
    },
    {
      q: 'Can I attach receipts and bill photos to my transactions?',
      a: 'Yes. You can take a photo with your camera or select an existing receipt image from your gallery for any transaction. Attached images are isolated within the app-specific Android sandbox and are preserved inside your encrypted backup archives.'
    },
    {
      q: 'Which Android devices and versions are supported?',
      a: 'Logbook Plus is compatible with Android phones and tablets running Android 8.0 (API level 26) through the latest Android 15 and 16. The native app download is compact (~17 MB) and includes responsive typography and Material 3 light and dark themes.'
    },
    {
      q: 'Is my financial data kept strictly private?',
      a: 'Yes. The core application runs locally with zero tracking SDKs, zero advertising networks, and zero telemetry beacons. Optional cloud backup sync (Google Drive or WebDAV) encrypts archives on your device with AES-256 before upload. Plaintext records are never sent to remote servers.'
    }
  ];

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="py-20 sm:py-28 px-4 sm:px-6 md:px-8 border-t relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border)' }}
    >
      <div className="w-full max-w-5xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16 text-center mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider font-mono bg-blue-500/10 text-[#2467B9] dark:text-blue-400 border border-blue-500/20">
            <HelpCircle className="w-4 h-4" />
            Common Questions
          </div>
          <h2
            id="faq-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Clear answers about offline storage, backups, report exports, and device compatibility.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5 max-w-3xl mx-auto" role="region" aria-label="Frequently Asked Questions Accordion">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border transition-all duration-200 overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: isOpen ? 'var(--primary)' : 'var(--border)'
                }}
              >
                <button
                  type="button"
                  id={`faq-btn-${idx}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  onClick={() => toggle(idx)}
                  className="w-full py-4.5 px-6 flex items-center justify-between text-left gap-4 cursor-pointer min-h-[52px]"
                >
                  <span className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#2467B9] dark:text-blue-400' : 'text-zinc-400'
                    }`}
                  />
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-btn-${idx}`}
                    className="px-6 pb-5 pt-1 text-sm sm:text-base leading-relaxed border-t"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Link to Full Help Center */}
        <div className="mt-10 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Have a different question or need troubleshooting help?{' '}
            <a
              href="/help-center"
              className="font-bold inline-flex items-center gap-1 hover:underline text-[#2467B9] dark:text-blue-400"
            >
              Visit our Help Center <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}

