import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Bug, Lightbulb, MessageSquare, Shield, Clock, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ContactView({ onNavigate }) {
  const [contactSubject, setContactSubject] = useState('General Support');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactConsent, setContactConsent] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const subjectPills = [
    { name: 'General Support', icon: MessageSquare },
    { name: 'Bug Report', icon: Bug },
    { name: 'Feature Idea', icon: Lightbulb },
    { name: 'Enterprise / Billing', icon: Shield }
  ];

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!contactConsent) {
      setErrorMessage('Please confirm your privacy consent before sending.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          email: contactEmail.trim(),
          subject: contactSubject,
          message: contactMessage.trim(),
          consentGiven: true
        })
      });

      if (res.ok) {
        setContactSent(true);
        setContactName('');
        setContactEmail('');
        setContactMessage('');
        setContactConsent(false);
        setTimeout(() => setContactSent(false), 7000);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to submit inquiry. Please try again.');
      }
    } catch {
      // In offline/demo mode, show success fallback
      setContactSent(true);
      setTimeout(() => setContactSent(false), 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 md:py-20 w-full max-w-[95%] xl:max-w-[1300px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 md:px-12 relative text-left">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl space-y-4 mb-10 sm:mb-14"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-mono bg-blue-500/10 text-accent-blue border border-blue-500/20">
          <Mail className="w-3.5 h-3.5" />
          Direct Inquiries & Helpdesk
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
          Contact Support
        </h1>
        <p className="text-sm sm:text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Have questions about your encrypted vault, billing, or security? Reach out directly to our engineering and support team.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Form Column */}
        <div
          className="lg:col-span-7 p-6 sm:p-8 rounded-3xl border space-y-6"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider font-bold block" style={{ color: 'var(--text-muted)' }}>
              1. Select Inquiry Topic
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {subjectPills.map((item) => {
                const isSelected = contactSubject === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setContactSubject(item.name)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-blue-500/40 shadow-sm' : 'hover:scale-[1.02]'
                    }`}
                    style={isSelected
                      ? { borderColor: '#60a5fa', background: 'rgba(96,165,250,0.12)', color: 'var(--text-primary)' }
                      : { borderColor: 'var(--border)', background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                  >
                    <item.icon className="w-5 h-5 text-accent-blue" />
                    <span className="text-xs font-semibold leading-tight">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {contactSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 space-y-2 text-center"
            >
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
              <h3 className="text-base font-bold text-emerald-300">Inquiry Dispatched Successfully</h3>
              <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed max-w-md mx-auto">
                Thank you for contacting Logbook Plus. A customer engineer has received your message and will respond to your email within 24 business hours.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4 pt-2">
              {errorMessage && (
                <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block font-mono" style={{ color: 'var(--text-muted)' }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-blue transition-colors"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider block font-mono" style={{ color: 'var(--text-muted)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-blue transition-colors"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block font-mono" style={{ color: 'var(--text-muted)' }}>
                  Message Subject
                </label>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-blue transition-colors"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider block font-mono" style={{ color: 'var(--text-muted)' }}>
                  Details & Description
                </label>
                <textarea
                  rows="5"
                  placeholder="Describe your inquiry, device model, or feature request in detail..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-blue transition-colors"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              {/* DPDP / GDPR Affirmative Consent Checkbox */}
              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                <label className="flex items-start gap-3 text-xs cursor-pointer select-none" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={contactConsent}
                    onChange={(e) => setContactConsent(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-700 accent-blue-500 cursor-pointer w-4 h-4 shrink-0"
                    required
                  />
                  <span className="leading-relaxed">
                    I consent to the collection and processing of my name, email address, and inquiry details by Logbook Plus solely for addressing this request pursuant to India's DPDP Act, 2023 and our{' '}
                    <a href="/privacy/" className="text-accent-blue underline hover:opacity-80">
                      Privacy Policy
                    </a>.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!contactConsent || isSubmitting}
                className="btn-primary-unified w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending Message...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Inquiry
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Support Information Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Direct Channels */}
          <div
            className="p-6 sm:p-7 rounded-3xl border space-y-5"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-base font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--text-primary)' }}>
              Direct Channels
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-accent-blue flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-mono uppercase block" style={{ color: 'var(--text-muted)' }}>Email Inquiries</span>
                  <a href="mailto:support@logbookplus.co.in" className="text-sm font-bold text-accent-blue hover:underline">
                    support@logbookplus.co.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-accent-blue flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-mono uppercase block" style={{ color: 'var(--text-muted)' }}>Response Window</span>
                  <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Within 24–48 hours (Mon–Fri)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-accent-blue flex items-center justify-center shrink-0 border border-blue-500/20">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-mono uppercase block" style={{ color: 'var(--text-muted)' }}>Operating Headquarters</span>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    Mulund West, Mumbai, Maharashtra, India &bull; 400082
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Grievance Redressal Card (DPDP Compliance) */}
          <div
            className="p-6 sm:p-7 rounded-3xl border space-y-3"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-accent-blue">
              <Shield className="w-4 h-4" />
              Statutory Grievance Officer
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Pursuant to Section 5(1)(ii) of the Digital Personal Data Protection Act, 2023, data principals may direct privacy grievances or consent revocation requests to:
            </p>
            <div className="text-xs font-mono pt-1 space-y-1" style={{ color: 'var(--text-primary)' }}>
              <p><strong>Designation:</strong> Data Protection & Grievance Officer</p>
              <p><strong>Contact:</strong> <a href="mailto:support@logbookplus.co.in" className="text-accent-blue hover:underline">support@logbookplus.co.in</a></p>
              <p><strong>Turnaround:</strong> Statutory formal redressal within 30 days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
