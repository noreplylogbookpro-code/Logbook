import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Globe, Shield, Terminal, Mail, Heart, Sparkles, ArrowRight } from 'lucide-react';

export default function CareersView({ onNavigate }) {
  const values = [
    {
      icon: Globe,
      title: 'Remote & Asynchronous',
      description: 'We prioritize deep, focused work over unnecessary meetings. Work from wherever you do your best thinking, across any timezone.'
    },
    {
      icon: Shield,
      title: 'Privacy by Invariant',
      description: 'We do not build ad trackers, surveillance telemetry, or dark patterns. We craft software that we are proud to let our families use.'
    },
    {
      icon: Terminal,
      title: 'Engineering Craftsmanship',
      description: 'We care deeply about zero-dependency runtimes, local-first database performance, cryptographic soundness, and beautiful UX.'
    }
  ];

  return (
    <div className="py-8 sm:py-12 md:py-20 w-full max-w-[95%] xl:max-w-[1200px] 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 relative text-left">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl space-y-4 mb-12 sm:mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-mono bg-blue-500/10 text-accent-blue border border-blue-500/20">
          <Briefcase className="w-3.5 h-3.5" />
          Careers & Opportunities
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
          Build the Future of Sovereign Personal Cloud
        </h1>
        <p className="text-sm sm:text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Join a distributed team engineering tools that defend personal financial autonomy, cryptographic privacy, and local-first data ownership.
        </p>
      </motion.div>

      {/* Culture & Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 sm:mb-16">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="p-6 sm:p-7 rounded-2xl border space-y-3"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-accent-blue flex items-center justify-center border border-blue-500/20">
              <v.icon className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {v.title}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {v.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Open Positions Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="p-8 sm:p-12 rounded-3xl border text-center space-y-5 max-w-2xl mx-auto"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-accent-blue flex items-center justify-center mx-auto border border-blue-500/20">
          <Briefcase className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            No Active Openings Right Now
          </h2>
          <p className="text-xs sm:text-sm leading-relaxed max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            We do not have specific headcount openings at this moment, but we always welcome spontaneous applications from passionate systems programmers, mobile architects, and security researchers.
          </p>
        </div>

        <div className="pt-2">
          <a
            href="mailto:careers@logbookplus.co.in?subject=Spontaneous%20Application%20-%20Logbook%20Plus"
            className="btn-primary-unified inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            Send Open Application
          </a>
        </div>

        <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
          Inquiries reviewed within 5 business days &bull; careers@logbookplus.co.in
        </p>
      </motion.div>
    </div>
  );
}
