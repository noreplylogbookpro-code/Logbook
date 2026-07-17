import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, BarChart3, WifiOff, Lock, ServerCrash, Key, ArrowUpRight } from 'lucide-react';

export default function BentoFeatures() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Stagger variants for the Bento cards
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 110,
        damping: 14,
      },
    },
  };

  // Spring physics for hover states
  const hoverSpring = {
    type: "spring",
    stiffness: 150,
    damping: 12,
  };

  return (
    <section className="py-24 px-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-[95%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto z-10 relative px-2 sm:px-6 md:px-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold text-accent-purple tracking-widest uppercase"
          >
            Engineering Pillars
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold tracking-tight font-sans" style={{ color: 'var(--text-primary)' }}
          >
            Intelligent Logging, Redefined.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg" style={{ color: 'var(--text-muted)' }}
          >
            A high-performance workspace designed specifically for developers who demand complete local privacy, low-latency interactions, and bank-grade encryption.
          </motion.p>
        </div>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-6 gap-6"
        >
          {/* Card 1: 100% Local Privacy (Offline First) */}
          <motion.a
            href="/security/"
            variants={cardVariants}
            whileHover={{ y: -8, scale: 1.01 }}
            transition={hoverSpring}
            className="md:col-span-4 md:row-span-2 glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden relative group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <WifiOff className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl md:text-4xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  100% Client-Side Privacy
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider font-semibold font-mono">
                    Offline First
                  </span>
                </h3>
                <p className="text-base md:text-lg max-w-xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  No telemetry. No background trackers. Logbook Plus saves data directly into a local database inside your browser or native workspace. Even if our cloud server is down, your software operates exactly the same.
                </p>
              </div>
            </div>

            {/* Offline diagram simulation */}
            <div className="mt-8 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3 p-2 bg-emerald-950/20 border border-emerald-500/20 rounded-xl w-full md:w-auto">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-green-500">SQLite Cache (Local)</span>
              </div>
              <div className="w-full md:w-20 h-0.5 border-t border-dashed" style={{ borderColor: 'var(--border)' }} />
              <div className="flex items-center gap-3 p-2 bg-red-950/20 border border-red-500/20 rounded-xl opacity-60 w-full md:w-auto">
                <ServerCrash className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-500 font-sans">External Server (Offline)</span>
              </div>
            </div>
          </motion.a>

          {/* Card 2: Zero Latency Entry */}
          <motion.a
            href="/documentation/"
            variants={cardVariants}
            whileHover={{ y: -8, scale: 1.01 }}
            transition={hoverSpring}
            className="md:col-span-2 md:row-span-1 glass-card rounded-3xl p-6 flex flex-col justify-between overflow-hidden relative group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-accent-blue border border-blue-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Rapid Entry Engine</h3>
                <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Record transactions, logs, and categories with keyboard shortcuts. Sub-10ms UI paint speeds.
                </p>
              </div>
            </div>
            {/* Quick keys simulation */}
            <div className="mt-4 flex gap-1.5 font-mono text-xs">
              <span className="px-2 py-1 rounded border font-mono text-xs" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Ctrl</span>
              <span className="px-2 py-1 rounded border font-mono text-xs" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>N</span>
              <span className="flex items-center ml-2" style={{ color: 'var(--text-muted)' }}>Quick Log Record</span>
            </div>
          </motion.a>

          {/* Card 3: Sleek Interactive Analytics */}
          <motion.a
            href="/documentation/"
            variants={cardVariants}
            whileHover={{ y: -8, scale: 1.01 }}
            transition={hoverSpring}
            className="md:col-span-3 md:row-span-2 glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden relative group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-accent-purple border border-purple-500/20">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-bold flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                  Interactive Insights
                  <ArrowUpRight className="w-5 h-5 text-zinc-400 group-hover:text-accent-purple transition-colors" />
                </h3>
                <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Filter, slice, and review records in real-time. Chart calculations are computed client-side, returning immediate layouts without API fetches.
                </p>
              </div>
            </div>

            {/* Sparkline chart SVG */}
            <div className="mt-8 h-24 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="gradient-bento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Area */}
                <path
                  d="M0 80 C 50 80, 75 45, 100 55 C 130 65, 160 25, 200 35 C 230 45, 250 15, 300 45 L 300 100 L 0 100 Z"
                  fill="url(#gradient-bento)"
                />
                {/* Stroke */}
                <motion.path
                  d="M0 80 C 50 80, 75 45, 100 55 C 130 65, 160 25, 200 35 C 230 45, 250 15, 300 45"
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="2.5"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                {/* Hover dots */}
                <circle cx="250" cy="22" r="4" fill="#ffffff" />
                <motion.circle
                  cx="250"
                  cy="22"
                  r="8"
                  stroke="#c084fc"
                  strokeWidth="2"
                  fill="none"
                  animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                  style={{ transformOrigin: "250px 22px" }}
                />
              </svg>
              <div className="absolute top-1 right-6 glass-card px-1.5 py-0.5 rounded text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                Peak: +₹1,420
              </div>
            </div>
          </motion.a>

          {/* Card 4: Cryptographic Security */}
          <motion.a
            href="/pricing/"
            variants={cardVariants}
            whileHover={{ y: -8, scale: 1.01 }}
            transition={hoverSpring}
            className="md:col-span-3 md:row-span-2 glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden relative group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-accent-cyan border border-cyan-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl md:text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  Zero-Knowledge Security
                </h3>
                <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  All backups are encrypted with your SHA-256 hashed private key before uploading. Our server administrators cannot read, decode, or analyze your files under any circumstance.
                </p>
              </div>
            </div>

            {/* Cryptographic key visual */}
            <div className="mt-8 space-y-2 p-4 rounded-2xl font-mono text-xs" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <div className="flex items-center justify-between text-zinc-500 text-xs">
                <span>CIPHER METHOD</span>
                <span className="text-accent-cyan font-bold">AES-256-CBC</span>
              </div>
              <div className="flex items-center gap-2 truncate">
                <Key className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                <span className="truncate">Key Hash: 7c5f82b138e64b8593a11b66b2a0915f013d31ff4f5e717e30d6bfcf617d6</span>
              </div>
              <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full bg-accent-cyan w-full rounded-full" />
              </div>
            </div>
          </motion.a>

        </motion.div>
      </div>
    </section>
  );
}
