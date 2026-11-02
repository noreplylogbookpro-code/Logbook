import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

export default function MobileInstallBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('logbook_install_bar_dismissed')) {
      setIsDismissed(true);
      return;
    }

    const handleScroll = () => {
      // Show when scrolled past 260px down the page
      if (window.scrollY > 260) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    sessionStorage.setItem('logbook_install_bar_dismissed', 'true');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div
      role="complementary"
      aria-label="Install mobile application bar"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden p-3 border-t backdrop-blur-xl shadow-2xl transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border)'
      }}
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        {/* App Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/assets/images/app_logo.webp"
            alt="Logbook Plus Icon"
            width={38}
            height={38}
            className="w-9 h-9 rounded-xl border shrink-0 object-cover"
            style={{ borderColor: 'var(--border)' }}
          />
          <div className="min-w-0">
            <p className="text-xs font-bold truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
              Logbook Plus
            </p>
            <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
              Offline Expense Tracker &bull; Free
            </p>
          </div>
        </div>

        {/* CTA & Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://play.google.com/store/apps/details?id=com.logbookplus"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 min-h-[40px] shadow-sm cursor-pointer"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)'
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss app install banner"
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

