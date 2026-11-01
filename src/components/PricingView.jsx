import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
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
      buttonStyle: {},
      cardBorder: 'border-zinc-200 dark:border-zinc-800',
      badge: null,
      note: 'No payment details required',
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
      buttonStyle: {},
      badge: t('mostPopular'),
      cardBorder: 'border-zinc-900 dark:border-zinc-100 shadow-md',
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
      buttonStyle: {},
      cardBorder: 'border-zinc-200 dark:border-zinc-800',
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
    <div className="py-12 md:py-20 w-full max-w-[95%] xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-8 md:px-12 relative text-left">

      {/* Header */}
      <div className="max-w-2xl mb-12 space-y-3">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {t('simplePricing')}
        </h1>
        <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {t('unlockSecure')}
        </p>
      </div>

      {/* Billing Switch */}
      <div className="flex justify-start mb-12">
        <div className="p-1 rounded-lg flex items-center border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors focus-visible:ring-2 focus-visible:ring-zinc-500 ${period === 'monthly' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
          >
            {t('monthly')}
          </button>
          <button
            type="button"
            onClick={() => setPeriod('yearly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-zinc-500 ${period === 'yearly' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'}`}
          >
            {t('yearly')}
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Annual Rate
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-16">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl p-8 flex flex-col justify-between border relative ${plan.cardBorder}`}
            style={{ backgroundColor: 'var(--bg-surface)' }}
          >
            {plan.badge && (
              <div
                className="absolute top-4 right-4 text-[10px] font-semibold tracking-wider uppercase font-mono px-2 py-0.5 rounded border"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)',
                  borderColor: 'var(--btn-primary-border)'
                }}
              >
                {plan.badge}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</h3>
                <p className="text-sm min-h-[36px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{plan.desc}</p>
              </div>

              {/* Price Display - Transparent, honest, zero fake discounts */}
              <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-mono tracking-tight" style={{ color: 'var(--text-primary)' }}>{plan.price}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>/ {plan.periodText}</span>
                </div>
                {plan.note && (
                  <span className="text-xs font-medium block mt-1" style={{ color: 'var(--text-muted)' }}>{plan.note}</span>
                )}
              </div>

              {/* Features list */}
              <ul className="space-y-3 border-t pt-4 text-xs" style={{ borderColor: 'var(--border)' }}>
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2.5" style={{ color: 'var(--text-secondary)' }}>
                    {feature.included ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-400 dark:text-zinc-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <span className={feature.included ? '' : 'text-zinc-400 dark:text-zinc-600 line-through'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <div className="mt-8 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => window.location.href = '/app/'}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold cursor-pointer ${plan.buttonClass}`}
                style={plan.buttonStyle || {}}
              >
                {plan.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Transparent Pricing & Anti-Dark Pattern Commitment */}
      <div className="p-6 md:p-8 rounded-xl border mb-16 space-y-4" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Transparent Pricing · Zero Hidden Fees · No Dark Patterns
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          <div>
            <strong className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>1. What You See Is What You Pay</strong>
            No setup charges, no processing transaction fees, and no surprise renewal price hikes. All pricing is inclusive.
          </div>
          <div>
            <strong className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>2. Cancel Anytime with 1-Click</strong>
            Subscriptions are managed via standard Google Play billing. You can cancel at any time directly through your phone settings without jumping through hoops.
          </div>
          <div>
            <strong className="block font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>3. Truly Free Offline Tier</strong>
            The free plan does not ask for payment methods, has no artificial trial countdowns, and will never lock you out of your local private database.
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl space-y-6">
        <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('faqHeader')}</h3>
        <div className="space-y-4">
          {[
            { q: t('faqQ1'), a: t('faqA1') },
            { q: t('faqQ2'), a: t('faqA2') },
            { q: t('faqQ3'), a: t('faqA3') }
          ].map((item, idx) => (
            <div key={idx} className="p-6 rounded-xl border space-y-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
              <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.q}</h4>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
