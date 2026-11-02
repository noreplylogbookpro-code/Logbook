import React from 'react';
import { Database, ShieldCheck, WifiOff, Lock, Server, FileCheck } from 'lucide-react';

export default function ArchitectureSection() {
  const pillars = [
    {
      icon: WifiOff,
      title: '100% Offline-First Architecture',
      tag: 'On-Device SQLite',
      desc: 'Logbook Plus operates independently of any remote server. Transactions, amounts, tags, and notes are read and written directly to your local Android device storage via SQLite. The app works flawlessly in airplane mode, remote areas, or without mobile data.'
    },
    {
      icon: Lock,
      title: 'Local Sandboxing & Privacy',
      tag: 'Sandboxed Storage',
      desc: 'All receipt photos and database records are isolated inside your private Android application sandbox. No external application or third-party process can access your financial ledger. No account registration or personal identity is required to use the app.'
    },
    {
      icon: ShieldCheck,
      title: 'Client-Encrypted Backups',
      tag: 'AES-256 / PBKDF2',
      desc: 'Create encrypted backup archives on demand. Backup keys are derived locally on your device with PBKDF2 and iterated SHA-256 rounds. You can transfer backups via USB, SD card, or sync to your own WebDAV or Google Drive. Backups remain encrypted at rest and in transit.'
    },
    {
      icon: Server,
      title: 'Zero Third-Party Telemetry',
      tag: 'Clean Native Binary',
      desc: 'We do not embed third-party advertising SDKs, commercial analytics trackers, or invasive telemetry beacons. Your spending habits, merchant names, and cash balances are never packaged, transmitted, or monetized.'
    }
  ];

  return (
    <section
      id="privacy"
      aria-labelledby="architecture-heading"
      className="py-20 sm:py-28 px-4 sm:px-6 md:px-8 border-t relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
    >
      <div className="w-full max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14 sm:mb-20 text-center mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
            Transparent Privacy Architecture
          </div>
          <h2
            id="architecture-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            How Your Financial Data Stays Yours
          </h2>
          <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            We believe personal finance data is the most sensitive data you produce. Here is how Logbook Plus handles your information without false claims.
          </p>
        </div>

        {/* 4 Architecture Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-3xl border flex flex-col justify-between space-y-5 transition-all duration-300 hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border)'
                }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border)',
                        color: 'var(--primary)'
                      }}
                    >
                      <Icon className="w-6 h-6 text-[#2467B9] dark:text-blue-400" />
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-md border font-semibold" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                      {pillar.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {pillar.title}
                  </h3>

                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {pillar.desc}
                  </p>
                </div>

                <div className="pt-2 border-t flex items-center gap-2 text-xs font-mono" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                  <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Verified in native Android codebase</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Summary Callout */}
        <div
          className="mt-10 sm:mt-12 p-6 sm:p-8 rounded-2xl border text-center max-w-4xl mx-auto space-y-3"
          style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border)' }}
        >
          <h4 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            Optional Cloud Synchronization Disclaimer
          </h4>
          <p className="text-xs sm:text-sm leading-relaxed max-w-3xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            While core expense tracking is 100% offline, users may voluntarily enable cloud backup features (Google Drive or self-hosted WebDAV). When enabled, only client-side encrypted backup archives are synced. The server never holds unencrypted plaintext records or your decryption passphrase.
          </p>
        </div>
      </div>
    </section>
  );
}

