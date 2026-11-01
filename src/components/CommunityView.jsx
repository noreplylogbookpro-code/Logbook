import React from 'react';
import { motion } from 'framer-motion';
import { Users, Github, MessageSquare, ShieldAlert, Heart, ExternalLink, ArrowRight } from 'lucide-react';

export default function CommunityView({ onNavigate }) {
  const channels = [
    {
      icon: MessageSquare,
      title: 'Discord Community',
      description: 'Join discussions with other privacy advocates, ask technical questions, discuss local-first architectures, and suggest new product features.',
      action: 'Join Discord Server',
      href: 'https://discord.gg/logbookplus',
      isExternal: true
    },
    {
      icon: Github,
      title: 'GitHub Repository',
      description: 'Audit our source code, report reproducible bugs, review open pull requests, and contribute to documentation and localization translations.',
      action: 'View GitHub Repo',
      href: 'https://github.com/noreplylogbookpro-code/Logbook',
      isExternal: true
    },
    {
      icon: ShieldAlert,
      title: 'Security Disclosures',
      description: 'We welcome reports from independent cybersecurity researchers. Review our bug disclosure policies and submit findings directly to our security engineering team.',
      action: 'Report Vulnerability',
      href: 'mailto:support@logbookplus.co.in?subject=Security%20Vulnerability%20Report',
      isExternal: true
    }
  ];

  return (
    <div className="py-8 sm:py-12 md:py-20 w-full max-w-[95%] xl:max-w-[1200px] 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 md:px-12 relative text-left">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl space-y-4 mb-10 sm:mb-14"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-mono bg-blue-500/10 text-accent-blue border border-blue-500/20">
          <Users className="w-3.5 h-3.5" />
          Open Collaboration
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
          Community & Channels
        </h1>
        <p className="text-sm sm:text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Connect with the community, explore open source repositories, report bugs, and collaborate on sovereign personal financial tools.
        </p>
      </motion.div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 sm:mb-16">
        {channels.map((ch, i) => (
          <motion.div
            key={ch.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="p-6 sm:p-7 rounded-2xl border flex flex-col justify-between space-y-4"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-accent-blue flex items-center justify-center border border-blue-500/20">
                <ch.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {ch.title}
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {ch.description}
              </p>
            </div>

            <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <a
                href={ch.href}
                target={ch.isExternal ? '_blank' : '_self'}
                rel={ch.isExternal ? 'noopener noreferrer' : ''}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-blue hover:underline"
              >
                <span>{ch.action}</span>
                {ch.isExternal ? <ExternalLink className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
