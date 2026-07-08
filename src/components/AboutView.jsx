import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Cloud, Server, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function AboutView({ onNavigate }) {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="py-12 md:py-20 max-w-7xl mx-auto px-4 sm:px-8 md:px-20 relative">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
        <div className="lg:col-span-7 space-y-6 text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold text-accent-blue tracking-widest uppercase"
          >
            Our Philosophy
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}
          >
            Sovereign finance tracking in a cloud‑first era.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}
          >
            Logbook Plus was founded on a simple conviction: you shouldn't have to trade your financial privacy for modern backup convenience. We build beautiful, local-first tools that let you own your logs entirely.
          </motion.p>
        </div>

        {/* Floating graphical mockup */}
        <div className="lg:col-span-5 flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[300px] aspect-square rounded-3xl glass-card border border-emerald-500/20 p-6 flex flex-col justify-between items-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Shield className="w-8 h-8" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Sovereignty Shield</h3>
              <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Every byte of data is cryptographically sealed under your private key.</p>
            </div>
            <div className="w-full h-10 p-2 rounded-xl border text-[13px] font-mono flex items-center gap-2" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>AES-256-GCM Secure Connection</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mission Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="p-8 md:p-12 rounded-3xl glass-card border mb-20 text-center relative overflow-hidden" style={{ borderColor: 'var(--border)' }}
      >
        <div className="max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Our Mission</h2>
          <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            To deliver advanced expense intelligence with zero vendor lock-in. We provide the encryption, storage isolation, and sync protocols — but the keys and servers will always belong to you.
          </p>
        </div>
      </motion.div>

      {/* Core Values Section */}
      <div className="space-y-12 mb-20">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>Our Core Values</h2>
          <p className="text-lg md:text-xl" style={{ color: 'var(--text-muted)' }}>The principles that direct our design and architectural decisions.</p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Card 1 */}
          <motion.div variants={cardVariants} className="glass-card rounded-2xl p-6 border flex flex-col justify-between space-y-4 hover:border-accent-blue/20 transition-all group" style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-accent-blue border border-blue-500/10 group-hover:bg-blue-500/20 transition-all">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Absolute Privacy</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                No telemetry, no tracking scripts, and no secret analytical monitoring. What you log in Logbook Plus stays between you and your device.
              </p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={cardVariants} className="glass-card rounded-2xl p-6 border flex flex-col justify-between space-y-4 hover:border-accent-purple/20 transition-all group" style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-accent-purple border border-purple-500/10 group-hover:bg-purple-500/20 transition-all">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Cloud Security</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Seamless backup auto-sync. Back up your logs to our client-side encrypted cloud vaults, ensuring you maintain absolute key control.
              </p>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={cardVariants} className="glass-card rounded-2xl p-6 border flex flex-col justify-between space-y-4 hover:border-accent-cyan/20 transition-all group" style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-accent-cyan border border-cyan-500/10 group-hover:bg-cyan-500/20 transition-all">
              <Server className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Local-First Data</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Never rely on a remote server to load your metrics. All records are stored locally on-device and load instantly even offline.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Philosophy creed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center rounded-3xl p-6 sm:p-8 md:p-12" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="space-y-4 text-left">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Our Architectural Creed</h2>
          <p className="text-md leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            We reject the modern data-harvesting business model. Most financial applications parse and sell your transactions to credit brokers. Logbook Plus uses strong client-side AES-256 encryption, meaning your logs are mathematically secure before they ever sync.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Whether you're organizing daily receipts, managing weekly project accounts, or exporting monthly statements, you are in absolute command.
          </p>
        </div>
        <div className="space-y-3.5 text-left">
          {[
            "Local database with sub-millisecond response times",
            "Fully customizable storage policy structures (Daily, Weekly, Monthly)",
            "Seamless token-based administrative sync monitoring",
            "One-click full recovery using secure question verifications"
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
