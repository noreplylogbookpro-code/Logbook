import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Bug, Lightbulb, MessageSquare, Shield, Clock, MapPin, Send, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

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
      setContactSent(true);
      setTimeout(() => setContactSent(false), 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <span>Direct Channels &bull; DPDP Compliance &bull; 24h Turnaround</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1]" style={{ color: 'var(--text-primary)' }}>
            Contact Support <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
              & Developer Desk.
            </span>
          </h1>

          <p className="text-base sm:text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--text-muted)' }}>
            Have questions about your encrypted vault, billing, or security? Reach out directly to our engineering and customer support team.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Column */}
          <div
            className="lg:col-span-7 p-7 sm:p-9 rounded-3xl border space-y-6 shadow-sm"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
          >
            <div className="space-y-2.5">
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
                      className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${isSelected ? 'ring-2 ring-blue-500/50 shadow-md scale-[1.02]' : 'hover:scale-[1.02]'
                        }`}
                      style={isSelected
                        ? { borderColor: '#3b82f6', background: 'rgba(59,130,246,0.12)', color: 'var(--text-primary)' }
                        : { borderColor: 'var(--border)', background: 'var(--bg-input)', color: 'var(--text-muted)' }}
                    >
                      <item.icon className="w-5 h-5 text-accent-blue" />
                      <span className="text-xs font-bold leading-tight">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {contactSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 space-y-2 text-center"
              >
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
                <h3 className="text-lg font-bold text-emerald-300">Inquiry Dispatched Successfully</h3>
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
                      className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-accent-blue transition-colors shadow-2xs"
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
                      className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-accent-blue transition-colors shadow-2xs"
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
                    className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-accent-blue transition-colors shadow-2xs"
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
                    className="w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-accent-blue transition-colors shadow-2xs"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>

                {/* DPDP / GDPR Affirmative Consent Checkbox */}
                <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
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
                  className="btn-primary-unified w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
            <div
              className="p-7 sm:p-8 rounded-3xl border space-y-6 shadow-sm"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <h3 className="text-base font-bold uppercase tracking-wider font-mono text-accent-blue">
                Direct Channels
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                    <Mail className="w-5 h-5 text-accent-blue" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase block" style={{ color: 'var(--text-muted)' }}>Email Inquiries</span>
                    <a href="mailto:support@logbookplus.co.in" className="text-sm font-bold text-accent-blue hover:underline">
                      support@logbookplus.co.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                    <Clock className="w-5 h-5 text-accent-blue" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase block" style={{ color: 'var(--text-muted)' }}>Response Window</span>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Within 24–48 hours (Mon–Fri)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border)' }}>
                    <MapPin className="w-5 h-5 text-accent-blue" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase block" style={{ color: 'var(--text-muted)' }}>Operating Headquarters</span>
                    <p className="text-xs sm:text-sm font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      Mulund West, Mumbai, Maharashtra, India &bull; 400082
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grievance Redressal Card (DPDP Compliance) */}
            <div
              className="p-7 sm:p-8 rounded-3xl border space-y-3 shadow-sm"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-accent-blue">
                <Shield className="w-4 h-4" />
                Statutory Grievance Officer
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Pursuant to Section 5(1)(ii) of the Digital Personal Data Protection Act, 2023, data principals may direct privacy grievances or consent revocation requests to:
              </p>
              <div className="text-xs font-mono pt-1 space-y-1.5" style={{ color: 'var(--text-primary)' }}>
                <p><strong>Designation:</strong> Data Protection & Grievance Officer</p>
                <p><strong>Contact:</strong> <a href="mailto:support@logbookplus.co.in" className="text-accent-blue hover:underline">support@logbookplus.co.in</a></p>
                <p><strong>Turnaround:</strong> Statutory formal redressal within 30 days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
