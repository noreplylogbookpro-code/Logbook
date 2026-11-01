import React from 'react';
import { motion } from 'framer-motion';
import { Database, EyeOff, Activity, Check, ShieldCheck, Server, Lock } from 'lucide-react';
import { useLanguage } from '../useLanguage.js';

export default function BentoFeatures() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Database,
      title: 'Local Encrypted DB',
      desc: 'Your financial history never leaves your device unencrypted. We utilize AES-256 local database encryption on top of standard platform security. You hold the keys.',
      badgeType: 'code',
      codePrefix: 'const status = ',
      codeHighlight: '"Encrypted";'
    },
    {
      icon: EyeOff,
      title: 'Zero Tracker SDKs',
      desc: 'No Google Analytics. No Facebook Pixels. No crashlytics tools that phone home. The app binary is entirely clean of third-party telemetry, ad beacons, and surveillance.',
      badgeType: 'code',
      codePrefix: 'export default ',
      codeHighlight: 'OfflineOnly;'
    },
    {
      icon: Activity,
      title: 'Transparent Cash Flow',
      desc: 'Gain unparalleled insights into your spending habits with powerful, locally computed analytics. Full control, categorization, and reporting without cloud lag.',
      badgeType: 'check',
      checkText: '100% On-Device'
    }
  ];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 md:px-8 border-t relative overflow-hidden" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border)' }}>

      {/* Background Soft Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-blue-500/5 dark:bg-blue-600/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto relative z-10">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-14 sm:mb-20 text-center mx-auto space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-mono bg-blue-500/10 text-accent-blue border border-blue-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Sovereign Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-light)' }}>
            Radical Privacy by Design
          </h2>
          <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Your financial behavior is the most sensitive data you own. Logbook Plus is engineered from the ground up to ensure nobody sees it but you.
          </p>
        </motion.div>

        {/* 3 Prominent Bento Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feat, idx) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 sm:p-9 rounded-3xl border flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border)'
              }}
            >
              <div className="space-y-4 text-left">
                {/* Icon Box */}
                <div
                  className="w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-xs"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <feat.icon className="w-6 h-6 text-accent-blue" />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {feat.title}
                </h3>

                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {feat.desc}
                </p>
              </div>

              {/* Code Pill Footer */}
              <div className="pt-4 border-t text-left" style={{ borderColor: 'var(--border)' }}>
                {feat.badgeType === 'code' ? (
                  <div
                    className="font-mono text-xs px-3 py-1.5 rounded-xl border inline-flex items-center gap-1 shadow-2xs"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{feat.codePrefix}</span>
                    <span className="text-amber-600 dark:text-amber-300 font-bold">{feat.codeHighlight}</span>
                  </div>
                ) : (
                  <div
                    className="font-mono text-xs px-3 py-1.5 rounded-xl border inline-flex items-center gap-1.5 shadow-2xs"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />
                    <span className="font-semibold">{feat.checkText}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
