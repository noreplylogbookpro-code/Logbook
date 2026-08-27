import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Cloud, Server, CheckCircle2, ArrowLeft, Code2, Terminal, ExternalLink, Sparkles, Cpu, Users } from 'lucide-react';
import { useLanguage } from '../useLanguage.js';

export default function AboutView({ onNavigate }) {
  const { t } = useLanguage();
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
    <div className="py-12 md:py-20 w-full max-w-[95%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 md:px-20 relative">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
        <div className="lg:col-span-7 space-y-6 text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold text-accent-blue tracking-widest uppercase"
          >
            {t('ourPhilosophy')}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}
          >
            {t('philosophyTitle')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}
          >
            {t('philosophySubtitle')}
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
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('sovereigntyShield')}</h3>
              <p className="text-lg" style={{ color: 'var(--text-muted)' }}>{t('sovereigntyDesc')}</p>
            </div>
            <div className="w-full h-10 p-2 rounded-xl border text-[13px] font-mono flex items-center gap-2" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <Shield className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>{t('aesSecureConnection')}</span>
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
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('ourMission')}</h2>
          <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('missionDesc')}
          </p>
        </div>
      </motion.div>

      {/* Core Values Section */}
      <div className="space-y-12 mb-20">
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{t('coreValues')}</h2>
          <p className="text-lg md:text-xl" style={{ color: 'var(--text-muted)' }}>{t('coreValuesDesc')}</p>
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
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('valuePrivacyTitle')}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {t('valuePrivacyDesc')}
              </p>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div variants={cardVariants} className="glass-card rounded-2xl p-6 border flex flex-col justify-between space-y-4 hover:border-accent-purple/20 transition-all group" style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-accent-purple border border-purple-500/10 group-hover:bg-purple-500/20 transition-all">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('valueCloudTitle')}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {t('valueCloudDesc')}
              </p>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div variants={cardVariants} className="glass-card rounded-2xl p-6 border flex flex-col justify-between space-y-4 hover:border-accent-cyan/20 transition-all group" style={{ borderColor: 'var(--border)' }}>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-accent-cyan border border-cyan-500/10 group-hover:bg-cyan-500/20 transition-all">
              <Server className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{t('valueLocalTitle')}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {t('valueLocalDesc')}
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* MODERN FOUNDER & CORE TEAM SECTION */}
      <div className="space-y-6 mb-20">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
            Founder & Core Team
          </h2>
          <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Driven by a mission for zero-knowledge data privacy, open standards, and complete user data sovereignty.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Founder Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-6 relative overflow-hidden border shadow-xl flex flex-col justify-between space-y-5 hover:border-amber-500/40 transition-all group text-left"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(217,119,6,0.03) 50%, rgba(108,92,231,0.02) 100%)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-start gap-4">
              {/* Tech Badge Graphic Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-amber-400/10 border border-amber-500/30 text-amber-400 flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition-transform relative overflow-hidden">
                  <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                  <span className="text-[8px] font-mono font-bold text-amber-300/90 tracking-widest mt-0.5 uppercase">FOUNDER</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Founder & Product Vision
                </div>
                <h3 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  Logbook Plus Founder
                </h3>
                <p className="text-[11px] font-mono text-amber-400/90 uppercase tracking-wider font-semibold">
                  Privacy Sovereignty & Strategy
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Founded with the commitment to provide individuals, schools, and self-hosted server administrators complete control over their operational logs and data archives, free from tracking or vendor lock-in.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {['Data Sovereignty', 'Zero-Tracking', 'Privacy First', 'Self-Hosted Standard'].map((pill) => (
                <span
                  key={pill}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-medium border"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Lead Systems Architect & Dev Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl p-6 relative overflow-hidden border shadow-xl flex flex-col justify-between space-y-5 hover:border-accent-purple/30 transition-all group text-left"
            style={{
              background: 'linear-gradient(135deg, rgba(108,92,231,0.06) 0%, rgba(9,132,227,0.03) 100%)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-accent-purple/10 border border-accent-purple/20 text-accent-purple flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Code2 className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-accent-purple text-[9px] font-bold uppercase tracking-wider">
                  <Terminal className="w-3 h-3" /> Systems Architect
                </div>
                <h3 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  Core Dev
                </h3>
                <p className="text-[11px] font-mono text-accent-purple/80 uppercase tracking-wider">
                  Full-Stack & Mobile Sync
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Architected high-speed JSON datastores, end-to-end AES encryption, and Kotlin Ktor client pipelines across desktop, Android, and Termux environments.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {['React 18', 'Express.js', 'Kotlin / Ktor', 'AES-256'].map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-medium border"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Core Team & Community Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl p-6 relative overflow-hidden border shadow-xl flex flex-col justify-between space-y-5 hover:border-accent-blue/30 transition-all group text-left"
            style={{
              background: 'linear-gradient(135deg, rgba(9,132,227,0.06) 0%, rgba(108,92,231,0.03) 100%)',
              borderColor: 'var(--border)'
            }}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-accent-blue flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-accent-blue text-[9px] font-bold uppercase tracking-wider">
                  Core Team
                </div>
                <h3 className="text-lg font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  Community & Support
                </h3>
                <p className="text-[11px] font-mono text-accent-blue/80 uppercase tracking-wider">
                  Open Source & Maintenance
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Supported by open-source contributors and community developers reviewing security patches, client plugins, and automated node server deployments.
            </p>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {['Open-Source', 'Community', 'DevOps'].map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-medium border"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href="https://github.com/noreplylogbookpro-code/Logbook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border transition-all hover:scale-105 flex items-center gap-1 text-[11px] font-semibold"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  title="GitHub Repository"
                >
                  <Code2 className="w-3.5 h-3.5" /> GitHub
                </a>
                <a
                  href="https://discord.gg/dRtT67ehK"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border transition-all hover:scale-105 flex items-center gap-1 text-[11px] font-semibold"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  title="Discord Community"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-accent-blue" /> Discord
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Philosophy creed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center rounded-3xl p-6 sm:p-8 md:p-12" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="space-y-4 text-left">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('architecturalCreed')}</h2>
          <p className="text-md leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {t('creedDesc1')}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {t('creedDesc2')}
          </p>
        </div>
        <div className="space-y-3.5 text-left">
          {[
            t('creedItem1'),
            t('creedItem2'),
            t('creedItem3'),
            t('creedItem4')
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
