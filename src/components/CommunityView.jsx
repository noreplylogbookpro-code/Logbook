import React from 'react';
import { motion } from 'framer-motion';
import { Users, MessageSquare, ShieldAlert, Heart, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';

const GithubIcon = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

export default function CommunityView({ onNavigate }) {
  const channels = [
    {
      icon: MessageSquare,
      title: 'Discord Community',
      description: 'Join discussions with other privacy advocates, ask technical questions, discuss local-first architectures, and suggest new product features.',
      action: 'Join Discord Server',
      href: 'https://discord.gg/logbookplus',
      isExternal: true,
      tag: 'Live Chat & Support'
    },
    {
      icon: GithubIcon,
      title: 'GitHub Repository',
      description: 'Audit our source code, report reproducible bugs, review open pull requests, and contribute to documentation and localization translations.',
      action: 'View GitHub Repo',
      href: 'https://github.com/noreplylogbookpro-code/Logbook',
      isExternal: true,
      tag: 'Open Source Code'
    },
    {
      icon: ShieldAlert,
      title: 'Security Disclosures',
      description: 'We welcome reports from independent cybersecurity researchers. Review our bug disclosure policies and submit findings directly to our security engineering team.',
      action: 'Report Vulnerability',
      href: 'mailto:support@logbookplus.co.in?subject=Security%20Vulnerability%20Report',
      isExternal: true,
      tag: 'Bug Bounty & Audit'
    }
  ];

  return (
    <div className="py-10 sm:py-16 md:py-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-left overflow-hidden">

      {/* Ambient Background Glow Blobs */}


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
            <span>Open Collaboration &bull; GitHub &bull; Discord Community</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]" style={{ color: 'var(--text-primary)' }}>
            Community <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
              & Open Channels.
            </span>
          </h1>

          <p className="text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>
            Connect with other privacy advocates, audit open-source repositories, report security vulnerabilities, and collaborate on sovereign personal financial tools.
          </p>
        </motion.div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {channels.map((ch, i) => (
            <motion.div
              key={ch.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-7 sm:p-8 rounded-3xl border flex flex-col justify-between space-y-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-110 shadow-xs"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                  <ch.icon className="w-6 h-6 text-accent-blue" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-blue block">
                    {ch.tag}
                  </span>
                  <h3 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {ch.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {ch.description}
                </p>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <a
                  href={ch.href}
                  target={ch.isExternal ? '_blank' : '_self'}
                  rel={ch.isExternal ? 'noopener noreferrer' : ''}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-accent-blue hover:underline"
                >
                  <span>{ch.action}</span>
                  {ch.isExternal ? <ExternalLink className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
