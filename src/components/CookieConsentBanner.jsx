import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, ExternalLink, Check, Lock, Database } from 'lucide-react';

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const checkNoticeStatus = () => {
    try {
      const stored = localStorage.getItem('logbook_privacy_notice_acknowledged') || localStorage.getItem('logbook_cookie_consent');
      if (stored) {
        setAcknowledged(true);
        return true;
      }
    } catch {
      // Ignore localStorage parse errors
    }
    setAcknowledged(false);
    return false;
  };

  useEffect(() => {
    const hasSeen = checkNoticeStatus();
    if (!hasSeen) {
      const timer = setTimeout(() => setShowBanner(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for custom event or global window call to re-open storage details anytime
  useEffect(() => {
    const handleOpen = () => {
      checkNoticeStatus();
      setDetailsOpen(true);
      setShowBanner(true);
    };
    window.addEventListener('openCookieSettings', handleOpen);
    window.openCookieSettings = handleOpen;
    return () => {
      window.removeEventListener('openCookieSettings', handleOpen);
      if (window.openCookieSettings === handleOpen) {
        delete window.openCookieSettings;
      }
    };
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem('logbook_privacy_notice_acknowledged', JSON.stringify({
      acknowledged: true,
      timestamp: new Date().toISOString()
    }));
    setAcknowledged(true);
    setShowBanner(false);
  };

  const handleWithdrawConsent = () => {
    try {
      localStorage.removeItem('logbook_privacy_notice_acknowledged');
      localStorage.removeItem('logbook_cookie_consent');
      localStorage.removeItem('authToken');
      setAcknowledged(false);
      setShowBanner(false);
      alert('Your consent has been successfully withdrawn. Session tokens and local preferences have been cleared.');
      window.location.reload();
    } catch {
      setAcknowledged(false);
      setShowBanner(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.aside
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            aria-label="Privacy and Local Storage Notice"
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-lg z-50 p-5 rounded-2xl glass-card border shadow-2xl backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-accent-blue shrink-0 border border-blue-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <div className="flex-1 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    Privacy & Storage Notice
                  </h4>
                  <button
                    type="button"
                    onClick={handleAcknowledge}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    aria-label="Close notice"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  We use strictly essential browser storage (offline database & authentication tokens) to provide secure, offline-first expense management. In strict compliance with the <strong>DPDP Act, 2023</strong> and <strong>GDPR</strong>, we <strong>never</strong> deploy advertising cookies, tracking pixels, or third-party trackers.
                </p>

                {detailsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 rounded-xl border border-blue-500/15 bg-blue-500/5 text-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-accent-blue flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" /> Storage Breakdown
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> Strictly Essential
                      </span>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span>1. Offline Encrypted Database (IndexedDB)</span>
                        <span className="text-[10px] text-emerald-400">Always Active</span>
                      </div>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Stores your workspace receipts and ledger entries encrypted in your browser so you can manage finances offline without delay.
                      </p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span>2. Authentication & Session Security</span>
                        <span className="text-[10px] text-emerald-400">Always Active</span>
                      </div>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Maintains your secure login state and protects your account requests against unauthorized tampering.
                      </p>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-blue-500/15">
                      <div className="flex items-center justify-between font-semibold text-emerald-400">
                        <span className="inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Zero Third-Party Advertising Trackers
                        </span>
                        <span className="text-[10px] text-zinc-400">Exempt from consent</span>
                      </div>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        No advertising networks or data brokers have access to your browsing behavior or bookkeeping data.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <a
                    href="/privacy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-accent-blue hover:underline inline-flex items-center gap-1"
                  >
                    Privacy Policy <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-2">
                    {acknowledged && (
                      <button
                        type="button"
                        onClick={handleWithdrawConsent}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
                        title="Withdraw consent and clear local tokens"
                      >
                        Withdraw Consent
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDetailsOpen(!detailsOpen)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {detailsOpen ? 'Hide Details' : 'Details'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAcknowledge}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-md hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> {acknowledged ? 'Save Preferences' : 'Got it'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Floating Re-Open Trigger: allows users to review storage & privacy transparency details anytime */}
      {!showBanner && (
        <button
          type="button"
          onClick={() => {
            setDetailsOpen(true);
            setShowBanner(true);
          }}
          className="fixed bottom-4 left-4 z-40 px-3 py-2 rounded-full glass-card border shadow-lg hover:scale-105 transition-all text-xs flex items-center gap-2 group backdrop-blur-md opacity-75 hover:opacity-100 cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)'
          }}
          title="Privacy & Storage Transparency Notice"
          aria-label="Open Privacy & Storage Notice"
        >
          <ShieldCheck className="w-4 h-4 text-accent-blue group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline text-[11px] font-medium pr-1">Privacy & Storage</span>
        </button>
      )}
    </>
  );
}
