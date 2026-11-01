import React from 'react';
import { useLanguage } from '../useLanguage.js';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[84vh] flex flex-col justify-center px-4 md:px-8 py-16 md:py-24" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="w-full max-w-[95%] xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">

        {/* Text Content */}
        <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6">
          {/* Main Title - Solid, crisp, non-gradient */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.12]" style={{ color: 'var(--text-primary)' }}>
            {t('heroTitle')}
          </h1>

          {/* Subtitle - grounded, concrete, no buzzwords */}
          <p className="text-base sm:text-lg max-w-xl leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {t('heroSubtitle')}
          </p>

          {/* Action CTAs - Unified common button colors in light and dark mode */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto pt-2">
            <a
              href="/app/"
              className="btn-primary-unified px-6 py-3 rounded-lg text-sm transition-colors cursor-pointer"
            >
              {t('heroCta')}
            </a>

            <a
              href="/pricing/"
              className="btn-secondary-unified px-6 py-3 rounded-lg text-sm transition-colors cursor-pointer"
            >
              {t('pricing')}
            </a>
          </div>

          {/* System Spec Detail - Clean editorial list instead of 3 icon boxes */}
          <div className="pt-8 border-t w-full flex flex-wrap gap-x-8 gap-y-3 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <div>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Private Database:</span> SQLite3 local vault with client-side AES-256 encryption
            </div>
            <div>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Sync Target:</span> Private WebDAV or personal self-hosted cloud
            </div>
          </div>
        </div>

        {/* Real Software Interface Preview - High-contrast Private Database for Personal Finance */}
        <div className="lg:col-span-6 w-full">
          <div
            className="rounded-xl border overflow-hidden shadow-sm"
            role="region"
            aria-label="Private Database Personal Finance Preview"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)'
            }}
          >
            {/* Window Header */}
            <div
              className="px-4 py-3 border-b flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600 inline-block" aria-hidden="true" />
                <span className="font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                  PRIVATE_DATABASE.db
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                <span>LOCAL_ENCRYPTED</span>
              </div>
            </div>

            {/* Account Context Bar */}
            <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4 text-xs font-mono" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Vault: </span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Personal Finance (Offline-First)</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Monthly Surplus: </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+₹38,450.00</span>
              </div>
            </div>

            {/* Realistic Tabular Records */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse" aria-label="Personal Finance Ledger Table">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-input)' }}>
                    <th scope="col" className="py-2.5 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>DATE</th>
                    <th scope="col" className="py-2.5 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>REF #</th>
                    <th scope="col" className="py-2.5 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>CATEGORY & DESCRIPTION</th>
                    <th scope="col" className="py-2.5 px-4 font-semibold text-right" style={{ color: 'var(--text-muted)' }}>AMOUNT</th>
                    <th scope="col" className="py-2.5 px-4 font-semibold text-center" style={{ color: 'var(--text-muted)' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {[
                    { date: '2026-11-01', ref: 'TXN-1049', head: 'Salary Credit - Primary Employment', amt: '+₹85,000.00', status: 'VERIFIED' },
                    { date: '2026-10-31', ref: 'TXN-1048', head: 'Apartment Rent & Society Maintenance', amt: '-₹22,000.00', status: 'SETTLED' },
                    { date: '2026-10-30', ref: 'TXN-1047', head: 'Groceries & Organic Essentials', amt: '-₹4,620.00', status: 'SETTLED' },
                    { date: '2026-10-29', ref: 'TXN-1046', head: 'Index Mutual Fund SIP Investment', amt: '-₹15,000.00', status: 'ALLOCATED' },
                    { date: '2026-10-28', ref: 'TXN-1045', head: 'High-Speed Fiber & Utilities', amt: '-₹1,430.00', status: 'SETTLED' },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="py-2.5 px-4" style={{ color: 'var(--text-secondary)' }}>{row.date}</td>
                      <td className="py-2.5 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>{row.ref}</td>
                      <td className="py-2.5 px-4 font-sans text-xs" style={{ color: 'var(--text-primary)' }}>{row.head}</td>
                      <td className={`py-2.5 px-4 text-right font-semibold ${row.amt.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                        {row.amt}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800" style={{ color: 'var(--text-secondary)' }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div
              className="px-4 py-3 border-t flex items-center justify-between text-xs"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="flex items-center gap-4 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                <span>Records: 5 Verified in Private Database</span>
                <span>SHA-256 Digest: e8f2...91b0</span>
              </div>
              <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">
                Local Encrypted Database
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
