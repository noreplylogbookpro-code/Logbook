import React, { useState, useEffect } from 'react';
import Hero from './components/Hero.jsx';
import BentoFeatures from './components/BentoFeatures.jsx';
import AboutView from './components/AboutView.jsx';
import PricingView from './components/PricingView.jsx';
import PolicyView from './components/PolicyView.jsx';
import LoginView from './components/LoginView.jsx';
import DashboardView from './components/DashboardView.jsx';
import MasterView from './components/MasterView.jsx';
import DevPortalView from './components/DevPortalView.jsx';
import { ArrowRight, ShieldCheck, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from './useTheme.js';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('authToken'));
  }, [currentPath]);

  const navigate = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGlobalClick = (e) => {
    const anchor = e.target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/') && !href.includes('.') && !href.startsWith('/api/')) {
        const isMaster = window.location.hostname.startsWith('master.');
        if (isMaster) {
          if (href !== '/' && href !== '/dev' && href !== '/dev/') {
            e.preventDefault();
            window.location.href = window.location.protocol + '//' + window.location.host.replace('master.', '') + href;
            return;
          }
        }
        e.preventDefault();
        navigate(href);
      }
    }
  };

  const cleanPath = currentPath.replace(/^\/|\/$/g, '');
  const isMasterHost = window.location.hostname.startsWith('master.');

  let view = 'home';
  let initialDoc = 'security';

  if (isMasterHost) {
    if (cleanPath === 'dev') {
      view = 'devportal';
    } else {
      view = 'master';
    }
  } else {
    if (cleanPath === 'about') {
      view = 'about';
    } else if (cleanPath === 'pricing') {
      view = 'pricing';
    } else if (cleanPath === 'app') {
      view = 'login';
    } else if (cleanPath === 'app/dashboard') {
      view = 'dashboard';
    } else if ([
      'security', 'terms', 'privacy', 'refund', 'cloud-backup-policy',
      'paid-terms', 'changelog', 'status', 'careers', 'blog',
      'help-center', 'documentation', 'community', 'contact'
    ].includes(cleanPath)) {
      view = 'policy';
      initialDoc = cleanPath;
    }
  }

  return (
    <div
      onClick={handleGlobalClick}
      className="min-h-screen flex flex-col font-sans select-none overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {view !== 'master' && view !== 'devportal' && (
        <header
          className="w-full py-6 px-6 md:px-12 border-b sticky top-0 z-50 backdrop-blur-md"
          style={{
            backgroundColor: 'var(--bg-header)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <img
                src="/assets/images/app_logo.png"
                alt="Logbook Plus Logo"
                className="h-8 w-auto rounded-lg"
                style={{ border: '1px solid var(--border)' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="text-lg font-bold tracking-tight font-sans" style={{ color: 'var(--text-primary)' }}>
                Logbook <span className="bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">Plus</span>
              </span>
            </a>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                id="theme-toggle"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                {theme === 'dark'
                  ? <Sun className="w-4 h-4" />
                  : <Moon className="w-4 h-4" />
                }
              </button>

              <button
                className="md:hidden p-2"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>

            <div
              className={`absolute md:static top-full left-0 w-full md:w-auto border-b md:border-none p-6 md:p-0 flex flex-col md:flex-row items-center gap-4 ${isMobileMenuOpen ? 'flex' : 'hidden md:flex'}`}
              style={{
                backgroundColor: isMobileMenuOpen ? 'var(--bg-header)' : undefined,
                borderColor: 'var(--border)',
              }}
            >
              {isLoggedIn ? (
                cleanPath === 'app/dashboard' ? (
                  <div id="global-account-manager-portal"></div>
                ) : (
                  <>
                    <a
                      href="/app/dashboard/"
                      className="px-4 py-2 rounded-lg text-xs font-semibold transition-all w-full md:w-auto text-center"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                    >Dashboard</a>
                    <button
                      onClick={() => { localStorage.removeItem('authToken'); setIsLoggedIn(false); navigate('/app/'); }}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 w-full md:w-auto"
                    >Sign Out</button>
                  </>
                )
              ) : (
                <a href="/app/" className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-accent-blue to-accent-purple text-white w-full md:w-auto text-center">Launch Console</a>
              )}
            </div>
          </div>
        </header>
      )}

      <main className="flex-grow">
        {view === 'home' && (
          <>
            <Hero />
            <BentoFeatures />
            <section className="py-24 px-6 md:px-12 bg-input relative text-center border-t border" style={{
              borderColor: 'var(--border)',
            }}>
              <div className="max-w-7xl mx-auto space-y-6">
                <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">Ready to take control?</h3>
                <a href={isLoggedIn ? "/app/dashboard/" : "/app/"} className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-medium bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-xl hover:scale-[1.02] transition-all">
                  {isLoggedIn ? "Go to Dashboard" : "Access your backups"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </div>
            </section>
          </>
        )}
        {view === 'about' && <AboutView onNavigate={navigate} />}
        {view === 'pricing' && <PricingView onNavigate={navigate} />}
        {view === 'policy' && <PolicyView initialDoc={initialDoc} onNavigate={navigate} />}
        {view === 'login' && <LoginView onNavigate={navigate} />}
        {view === 'dashboard' && <DashboardView onNavigate={navigate} />}
        {view === 'master' && <MasterView onNavigate={navigate} theme={theme} toggleTheme={toggleTheme} />}
        {view === 'devportal' && <DevPortalView onNavigate={navigate} />}
      </main>

      {view !== 'dashboard' && view !== 'master' && view !== 'devportal' && (
        <footer
          className="border-t pt-16 pb-10 px-4 sm:px-6 md:px-12 relative overflow-hidden"
          style={{ backgroundColor: 'var(--bg-footer)', borderColor: 'var(--border)' }}
        >
          {/* Glow Element */}
          <div className="dark:block hidden absolute bottom-[-100px] left-[50%] -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
          {/* Fading border top */}
          <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, var(--border), transparent)' }} />

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mb-16 relative z-10">
            {/* Brand & Newsletter */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <a href="/" className="flex items-center gap-3">
                <img
                  src="/assets/images/app_logo.png"
                  alt="Logbook Plus Logo"
                  className="h-12 sm:h-16 w-auto rounded-lg"
                  style={{ border: '1px solid var(--border)' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <span className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  Logbook <span className="bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">Plus</span>
                </span>
              </a>

              <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'var(--text-muted)' }}>
                Secure, local-first backup management and zero-latency expense intelligence for modern teams and individual builders.
              </p>

              {/* Status Bar */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>All systems fully operational</span>
              </div>

              {/* Newsletter */}
              <div className="space-y-3 pt-2">
                <h5 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Stay Secure</h5>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Subscribe to vulnerability reports and security patches.</p>
                <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 max-w-sm">
                  <input
                    type="email"
                    placeholder="Enter your email..."
                    className="input-unified flex-grow min-w-0 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue transition-colors"
                    required
                  />
                  <button
                    type="submit"
                    className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-blue to-accent-purple text-white text-xs font-semibold hover:opacity-90 transition-all"
                  >
                    Join
                  </button>
                </form>
              </div>
            </div>

            {/* Links Grid */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8 text-left">
              <div className="space-y-4">
                <h4 className="text-sm font-bold tracking-widest uppercase border-l-2 border-accent-blue pl-2.5" style={{ color: 'var(--text-primary)' }}>Product</h4>
                <ul className="space-y-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <li><a href="/" className="hover:text-accent-blue transition-colors">Features</a></li>
                  <li><a href="/pricing/" className="hover:text-accent-blue transition-colors">Pricing</a></li>
                  <li><a href="/security/" className="hover:text-accent-blue transition-colors">Security Policy</a></li>
                  <li><a href="/changelog/" className="hover:text-accent-blue transition-colors">Changelog</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold tracking-widest uppercase border-l-2 border-accent-purple pl-2.5" style={{ color: 'var(--text-primary)' }}>Company</h4>
                <ul className="space-y-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <li><a href="/about/" className="hover:text-accent-purple transition-colors">About Us</a></li>
                  <li><a href="/blog/" className="hover:text-accent-purple transition-colors">Tech Blog</a></li>
                  <li><a href="/careers/" className="hover:text-accent-purple transition-colors">Careers</a></li>
                  <li><a href="/contact/" className="hover:text-accent-purple transition-colors">Contact Sales</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold tracking-widest uppercase border-l-2 border-accent-cyan pl-2.5" style={{ color: 'var(--text-primary)' }}>Support</h4>
                <ul className="space-y-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <li><a href="/help-center/" className="hover:text-accent-cyan transition-colors">Help Center</a></li>
                  <li><a href="/documentation/" className="hover:text-accent-cyan transition-colors">API Docs</a></li>
                  <li><a href="/community/" className="hover:text-accent-cyan transition-colors">Discord</a></li>
                  <li><a href="/status/" className="hover:text-accent-cyan transition-colors">Status</a></li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-bold tracking-widest uppercase border-l-2 border-accent-pink pl-2.5" style={{ color: 'var(--text-primary)' }}>Legal</h4>
                <ul className="space-y-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <li><a href="/terms/" className="hover:text-accent-pink transition-colors">Terms of Use</a></li>
                  <li><a href="/privacy/" className="hover:text-accent-pink transition-colors">Privacy Policy</a></li>
                  <li><a href="/refund/" className="hover:text-accent-pink transition-colors">Refund Policy</a></li>
                  <li><a href="/cloud-backup-policy/" className="hover:text-accent-pink transition-colors">Backup Policy</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Apps & Socials */}
          <div
            className="max-w-7xl mx-auto pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Download app:</span>
              <a href="https://play.google.com/store/apps/details?id=com.logbookplus" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-muted)' }}
              >
                <img src="../assets/images/googleplay.svg" alt="Google Play" className="w-4 h-4" fill="currentColor" />
              </a>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://github.com/noreplylogbookpro-code/Logbook" target='_blank' rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:text-accent-purple hover:border-accent-purple/30"
                style={{ border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-muted)' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" /></svg>
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div
            className="max-w-7xl mx-auto mt-8 pt-8 border-t flex flex-col sm:flex-row justify-between items-center text-xs gap-4 relative z-10"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <span>&copy; {new Date().getFullYear()} Logbook Plus. All rights reserved.</span>
            <div className="flex items-center gap-4 font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                AES-256 Private Backup Protocol
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
