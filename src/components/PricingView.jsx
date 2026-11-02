import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Shield, Sparkles, Zap, Lock, Server, ArrowRight } from 'lucide-react';
import { useLanguage } from '../useLanguage.js';

export default function PricingView() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState('monthly');

  const plans = [
    {
      name: t('freePlanName'),
      price: '₹0',
      periodText: 'forever',
      desc: t('freePlanDesc'),
      buttonText: t('freePlanButton'),
      buttonClass: 'btn-secondary-unified',
      isPopular: false,
      badge: null,
      note: 'No credit card or payment required',
      features: [
        { text: t('freeFeature1'), included: true },
        { text: t('freeFeature2'), included: true },
        { text: t('freeFeature3'), included: true },
        { text: t('freeFeature4'), included: true },
        { text: t('freeFeature5'), included: false },
        { text: t('freeFeature6'), included: false },
        { text: t('freeFeature7'), included: false },
      ]
    },
    {
      name: t('premiumPlanName'),
      price: period === 'monthly' ? '₹50' : '₹500',
      periodText: period === 'monthly' ? 'month' : 'year',
      desc: t('premiumPlanDesc'),
      buttonText: t('premiumPlanButton'),
      buttonClass: 'btn-primary-unified',
      isPopular: true,
      badge: t('mostPopular'),
      note: period === 'yearly' ? '₹41.67/mo (billed annually, zero hidden fees)' : 'Cancel anytime via Google Play',
      features: [
        { text: t('premiumFeature1'), included: true },
        { text: t('premiumFeature2'), included: true },
        { text: t('premiumFeature3'), included: true },
        { text: t('premiumFeature4'), included: true },
        { text: t('premiumFeature5'), included: true },
        { text: t('premiumFeature6'), included: true },
        { text: t('premiumFeature7'), included: true },
      ]
    },
    {
      name: t('selfHostedPlanName'),
      price: period === 'monthly' ? '₹199' : '₹1,499',
      periodText: period === 'monthly' ? 'month' : 'year',
      desc: t('selfHostedPlanDesc'),
      buttonText: t('selfHostedPlanButton'),
      buttonClass: 'btn-secondary-unified',
      isPopular: false,
      badge: null,
      note: period === 'yearly' ? '₹124.92/mo (billed annually, zero hidden fees)' : 'Run on personal server or WebDAV',
      features: [
        { text: t('selfHostedFeature1'), included: true },
        { text: t('selfHostedFeature2'), included: true },
        { text: t('selfHostedFeature3'), included: true },
        { text: t('selfHostedFeature4'), included: true },
        { text: t('selfHostedFeature5'), included: true },
        { text: t('selfHostedFeature6'), included: true },
        { text: t('selfHostedFeature7'), included: true },
      ]
    }
  ];

  return (
    <div className="py-10 sm:py-16 md:py-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-left overflow-hidden">

      <div className="relative z-10 space-y-10 sm:space-y-14 md:space-y-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl mx-auto space-y-4 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-mono font-medium border shadow-xs max-w-full justify-center flex-wrap"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </span>
            <span>Honest Pricing &bull; Zero Dark Patterns &bull; Full Autonomy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]" style={{ color: 'var(--text-light)' }}>
            Transparent Pricing <br className="hidden sm:inline" />
            <span className="text-gradient-blue">
              For Personal Sovereignty.
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            {t('unlockSecure')}
          </p>
        </motion.div>

        {/* Billing Switcher */}
        <div className="w-full flex justify-center">
          <div className="p-1 rounded-2xl flex items-center border shadow-xs max-w-full" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`px-3.5 sm:px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${period === 'monthly'
                ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-950 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
            >
              {t('monthly')}
            </button>
            <button
              type="button"
              onClick={() => setPeriod('yearly')}
              className={`px-3.5 sm:px-5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer ${period === 'yearly'
                ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-950 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
            >
              <span>{t('yearly')}</span>
              <span className="text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                Save 16%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className={`rounded-3xl p-5 sm:p-6 lg:p-8 flex flex-col justify-between border relative transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${plan.isPopular
                ? 'ring-2 ring-blue-500/50 shadow-lg'
                : ''
                }`}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: plan.isPopular ? '#3b82f6' : 'var(--border)'
              }}
            >
              {plan.badge && (
                <div
                  className="absolute -top-3.5 right-4 sm:right-6 text-[10px] font-bold tracking-wider uppercase font-mono px-3 py-1 rounded-full shadow-md bg-blue-600 text-white flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  {plan.badge}
                </div>
              )}

              <div className="space-y-5 sm:space-y-6">
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                  <p className="text-xs sm:text-sm leading-relaxed min-h-[36px]" style={{ color: 'var(--text-muted)' }}>{plan.desc}</p>
                </div>

                <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>{plan.price}</span>
                    <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-muted)' }}>/ {plan.periodText}</span>
                  </div>
                  {plan.note && (
                    <span className="text-[11px] font-mono block mt-1.5 leading-snug" style={{ color: 'var(--text-muted)' }}>{plan.note}</span>
                  )}
                </div>

                <ul className="space-y-3 border-t pt-4 text-xs sm:text-[13px]" style={{ borderColor: 'var(--border)' }}>
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5" style={{ color: 'var(--text-secondary)' }}>
                      {feature.included ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-zinc-500/10 text-zinc-400 dark:text-zinc-600 flex items-center justify-center shrink-0 mt-0.5 border border-zinc-500/20">
                          <X className="w-3 h-3" />
                        </div>
                      )}
                      <span className={feature.included ? 'font-medium leading-relaxed' : 'text-zinc-400 dark:text-zinc-600 line-through leading-relaxed'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 sm:mt-8 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <a
                  href="/app/"
                  className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${plan.buttonClass}`}
                >
                  <span>{plan.buttonText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Anti-Dark Pattern Commitment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="w-full p-6 sm:p-8 lg:p-10 rounded-3xl border space-y-4 sm:space-y-5"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-accent-blue">
            <Shield className="w-4 h-4" />
            Pricing Invariants & Privacy Guarantee
          </div>
          <h3 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Transparent Pricing &bull; Zero Hidden Fees &bull; No Dark Patterns
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            <div>
              <strong className="block font-semibold mb-1 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>1. What You See Is What You Pay</strong>
              No setup charges, no processing transaction fees, and no surprise renewal price hikes. All pricing is inclusive.
            </div>
            <div>
              <strong className="block font-semibold mb-1 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>2. Cancel Anytime with 1-Click</strong>
              Subscriptions are managed via standard Google Play billing. You can cancel at any time directly through your phone settings without jumping through hoops.
            </div>
            <div>
              <strong className="block font-semibold mb-1 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>3. Truly Free Offline Tier</strong>
              The free plan does not ask for payment methods, has no artificial trial countdowns, and will never lock you out of your local private database.
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
