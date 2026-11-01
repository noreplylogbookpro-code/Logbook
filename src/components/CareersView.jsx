import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Globe, Shield, Terminal, Mail, Heart, Sparkles, ArrowRight, Code } from 'lucide-react';

export default function CareersView({ onNavigate }) {
  const values = [
    {
      icon: Globe,
      title: 'Remote & Asynchronous',
      description: 'We prioritize deep, focused work over unnecessary meetings. Work from wherever you do your best thinking, across any timezone.',
      code: 'location = "distributed";'
    },
    {
      icon: Shield,
      title: 'Privacy by Invariant',
      description: 'We do not build ad trackers, surveillance telemetry, or dark patterns. We craft software that we are proud to let our families use.',
      code: 'telemetry_sdk = null;'
    },
    {
      icon: Terminal,
      title: 'Engineering Craftsmanship',
      description: 'We care deeply about zero-dependency runtimes, local-first database performance, cryptographic soundness, and beautiful UX.',
      code: 'latency = "< 1ms";'
    }
  ];

  return (
    <div className="py-10 sm:py-16 md:py-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-left overflow-hidden">
      
      {/* Ambient Background Glow Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[100px] animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full space-y-12 sm:space-y-16">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-4 text-center sm:text-left"
        >
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium border shadow-xs"
               style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </span>
            <span>Distributed Core Team &bull; Sovereign Personal Cloud</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]" style={{ color: 'var(--text-primary)' }}>
            Build the Future <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
              Of Sovereign Personal Cloud.
            </span>
          </h1>

          <p className="text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>
            Join a mission-driven distributed engineering team creating tools that defend personal financial autonomy, cryptographic privacy, and local-first data custody.
          </p>
        </motion.div>

        {/* Culture & Principles Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-7 sm:p-8 rounded-3xl border flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 shadow-xs"
                     style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                  <v.icon className="w-6 h-6 text-accent-blue" />
                </div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {v.title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {v.description}
                </p>
              </div>

              <div className="pt-3 border-t font-mono text-[11px]" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{v.code}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Open Positions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="p-8 sm:p-12 rounded-3xl border text-center space-y-5"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto shadow-xs"
               style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
            <Briefcase className="w-7 h-7 text-accent-blue" />
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
              className="btn-primary-unified inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md"
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
    </div>
  );
}
