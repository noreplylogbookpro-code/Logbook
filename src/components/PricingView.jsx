import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Shield, Cpu, Cloud, HelpCircle, ArrowLeft, Terminal } from 'lucide-react';

export default function PricingView({ onNavigate }) {
  const [period, setPeriod] = useState('monthly');

  const plans = [
    {
      name: 'Free Plan',
      icon: Terminal,
      price: '₹0',
      originalPrice: null,
      discount: null,
      periodText: 'forever',
      desc: 'Essential logging features for everyone. Keep your logs locally secured.',
      buttonText: 'Use Free Tier',
      buttonClass: 'border transition-all',
      buttonStyle: { background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-secondary)' },
      accentColor: 'border-zinc-800',
      features: [
        { text: '2 entries per day', included: true },
        { text: '2 photos per entry', included: true },
        { text: '2 exports per month (Excel/Word)', included: true },
        { text: 'Encrypted local backups', included: true },
        { text: 'Custom tags & categories', included: false },
        { text: 'PDF export format', included: false },
        { text: 'Cloud backup auto-sync', included: false },
      ]
    },
    {
      name: 'Cloud Premium Backup',
      icon: Cloud,
      price: period === 'monthly' ? '₹50' : '₹500',
      originalPrice: period === 'monthly' ? '₹100' : '₹1,000',
      discount: '50% OFF',
      periodText: period === 'monthly' ? 'month' : 'year',
      desc: 'Secure API access to host your encrypted backups directly on our redundant cloud vault.',
      buttonText: 'Get Premium Access',
      buttonClass: 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-[0_0_20px_rgba(96,165,250,0.25)] hover:shadow-[0_0_30px_rgba(192,132,252,0.45)]',
      badge: 'Most Popular',
      accentColor: 'border-accent-purple/50 bg-gradient-to-b from-accent-purple/5 to-transparent',
      note: period === 'yearly' ? 'Billed annually (₹500/yr) · ₹41.67/mo effective' : 'Cancel anytime',
      features: [
        { text: 'Everything in Free', included: true },
        { text: 'Unlimited daily entries', included: true },
        { text: 'Unlimited monthly exports', included: true },
        { text: 'Up to 10 photos per entry', included: true },
        { text: 'Unlock PDF export format', included: true },
        { text: 'Unlock all tags & categories', included: true },
        { text: 'Cloud backup (240MB limit)', included: true },
      ]
    },
    {
      name: 'Self-Hosted License',
      icon: Cpu,
      price: period === 'monthly' ? '₹199' : '₹1,499',
      originalPrice: period === 'monthly' ? '₹399' : '₹2,999',
      discount: '50% OFF',
      periodText: period === 'monthly' ? 'month' : 'year',
      desc: 'Absolute developer ownership. Run backup administrative targets on your own private server or Pi.',
      buttonText: 'Purchase License',
      buttonClass: 'bg-accent-blue text-white hover:bg-accent-blue/90 shadow-[0_0_20px_rgba(255,255,255,0.1)]',
      buttonStyle: null,
      accentColor: 'border-accent-cyan/50',
      note: period === 'yearly' ? 'Billed annually (₹1,499/yr) · ₹124.92/mo effective' : 'Run on private server',
      features: [
        { text: 'Everything in Premium', included: true },
        { text: 'Run on private server / Pi', included: true },
        { text: 'Unlimited local users', included: true },
        { text: 'Cryptographic offline activation', included: true },
        { text: 'Zero external servers required', included: true },
        { text: 'Full control over size limits', included: true },
        { text: 'Self-hosting support', included: true },
      ]
    }
  ];

  return (
    <div className="py-12 md:py-20 w-full max-w-[95%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 md:px-20 relative">

      {/* Header */}
      <div className="text-center space-y-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-semibold text-accent-blue tracking-widest uppercase"
        >
          Pricing Plans
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-5xl font-extrabold tracking-tight font-sans" style={{ color: 'var(--text-primary)' }}
        >
          Simple, Transparent Pricing
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm md:text-base max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}
        >
          Unlock the power of secure, local-first backup management. No hidden fees. Cancel anytime.
        </motion.p>
      </div>

      {/* Billing Switch */}
      <div className="flex justify-center mb-16">
        <div className="p-1 rounded-xl flex items-center relative" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors relative z-10 ${period === 'monthly' ? '' : ''}`} style={{ color: period === 'monthly' ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {period === 'monthly' && (
              <motion.div layoutId="toggleBg" className="absolute inset-0 bg-sky-50/10 border border-sky-500/50 rounded-lg -z-10" />
            )}
            Monthly
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors relative z-10 flex items-center gap-1.5`} style={{ color: period === 'yearly' ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {period === 'yearly' && (
              <motion.div layoutId="toggleBg" className="absolute inset-0 bg-sky-50/10 border border-sky-500/50 rounded-lg -z-10" />
            )}
            Yearly
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
              Save 16%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-20">
        {plans.map((plan, idx) => {
          const Icon = plan.icon;
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-card rounded-3xl p-6 md:p-8 flex flex-col justify-between border relative overflow-hidden ${plan.accentColor}`}
            >
              {plan.badge && (
                <div className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-accent-purple px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-6">
                {/* Icon & Details */}
                <div className="space-y-4 text-left">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-zinc-400 border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                    <Icon className="w-8 h-8 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                    <p className="text-sm mt-1 min-h-[32px]" style={{ color: 'var(--text-muted)' }}>{plan.desc}</p>
                  </div>
                </div>

                {/* Price Display */}
                <div className="text-left border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {plan.originalPrice && (
                      <span className="text-zinc-500 line-through text-sm font-medium">{plan.originalPrice}</span>
                    )}
                    {plan.discount && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                        {plan.discount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold" style={{ color: 'var(--text-primary)' }}>{plan.price}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>/ {plan.periodText}</span>
                  </div>
                  {plan.note && (
                    <span className="text-[13px] text-zinc-500 font-medium block mt-1">{plan.note}</span>
                  )}
                </div>

                {/* Features list */}
                <ul className="space-y-3 border-t pt-4 text-left" style={{ borderColor: 'var(--border)' }}>
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {feature.included ? (
                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-zinc-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? '' : 'text-zinc-500 line-through'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => window.location.href = '/app/'}
                  className={`w-full py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all ${plan.buttonClass}`}
                  style={plan.buttonStyle || {}}
                >
                  {plan.buttonText}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-2xl mx-auto space-y-6">
        <h3 className="text-2xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>Frequently Asked Questions</h3>
        <div className="space-y-4">
          {[
            { q: "Is the data really client-side encrypted?", a: "Yes. All data logged inside Logbook Plus is encrypted locally using the AES-256 block cipher before it is cached or synced. Without your private key passphrase, no one (including our infrastructure providers or developers) can read your records." },
            { q: "What happens if I cancel my premium subscription?", a: "If you cancel your subscription, you will retain local access to all your entries. Your backups on our cloud vault will remain active until the end of your billing cycle. After expiry, we provide a 30-day grace period to download your vault backup before it is securely purged." },
            { q: "How does the Self-Hosted Master License work?", a: "The Self-Hosted Master License gives you a perpetual, royalty-free key to run the Logbook backup target console on your own server hardware (e.g. via Docker, Node.js, WebDAV). This bypasses our cloud servers entirely while maintaining full encrypted sync functionality." }
          ].map((item, idx) => (
            <div key={idx} className="p-5 rounded-2xl text-left space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.q}</h4>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
