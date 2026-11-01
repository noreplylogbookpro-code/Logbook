import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Mail, Lock, User, HelpCircle, ArrowRight,
  ShieldCheck, Eye, EyeOff, Smartphone, ExternalLink,
  Copy, CheckCircle2, Sparkles
} from 'lucide-react';
import { useLanguage } from '../useLanguage.js';
import CustomSelect from './DropdownMenu.jsx';

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the name of your elementary school?",
  "What is your oldest sibling's middle name?",
  "What was the make of your first car?",
  "What is the name of the street you grew up on?",
];

export default function LoginView({ onNavigate }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'mfa' | 'app_link'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showItemizedNotice, setShowItemizedNotice] = useState(false);

  // Forgot password states
  const [forgotQuestion, setForgotQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // MFA states
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  // App Link states
  const [authToken, setAuthToken] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Live checks
  const [nameAvailable, setNameAvailable] = useState(null);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [checkingName, setCheckingName] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Check URL query parameters for app redirect uri / source
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUri = searchParams.get('redirect_uri') || searchParams.get('redirect');
  const isAppSource = searchParams.get('source') === 'app' || searchParams.get('webview') === 'true' || !!redirectUri;

  // Debounced check for Username
  useEffect(() => {
    if (mode !== 'signup' || !name || name.trim().length < 3) {
      setNameAvailable(null);
      return;
    }
    setCheckingName(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/signup/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name.trim() })
        });
        if (res.ok) {
          const data = await res.json();
          setNameAvailable(data.usernameAvailable);
        }
      } catch {
        setNameAvailable(null);
      } finally {
        setCheckingName(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [name, mode]);

  // Debounced check for Email address
  useEffect(() => {
    if (mode !== 'signup' || !email || !email.includes('@')) {
      setEmailAvailable(null);
      return;
    }
    setCheckingEmail(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/signup/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() })
        });
        if (res.ok) {
          const data = await res.json();
          setEmailAvailable(data.emailAvailable);
        }
      } catch {
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email, mode]);

  useEffect(() => {
    // Session check on load
    const token = localStorage.getItem('authToken');
    if (token) {
      fetch('/api/backups', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then((res) => {
        if (res.ok) {
          if (isAppSource) {
            setAuthToken(token);
            setMode('app_link');
          } else {
            onNavigate('/app/dashboard/');
          }
        } else {
          localStorage.removeItem('authToken');
        }
      }).catch(() => { });
    }
  }, [onNavigate, isAppSource]);

  const handleAuthSuccess = (token, user) => {
    localStorage.setItem('authToken', token);
    setAuthToken(token);
    setUserInfo(user);

    const appDeepLink = `logbookplus://auth?token=${encodeURIComponent(token)}&userId=${encodeURIComponent(user?.id || user?.userId || '')}&name=${encodeURIComponent(user?.username || user?.name || '')}`;

    if (redirectUri) {
      const targetUrl = redirectUri.includes('?')
        ? `${redirectUri}&token=${encodeURIComponent(token)}`
        : `${redirectUri}?token=${encodeURIComponent(token)}`;
      window.location.href = targetUrl;
    } else if (isAppSource) {
      window.location.href = appDeepLink;
      setMode('app_link');
    } else {
      onNavigate('/app/dashboard/');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });
      const data = await res.json();

      if (res.ok) {
        if (data.requires2FA) {
          setMfaToken(data.mfaToken);
          setMode('mfa');
        } else {
          handleAuthSuccess(data.token, data.user);
        }
      } else {
        setErrorMsg(data.error || data.message || 'Login failed');
      }
    } catch {
      setErrorMsg('Network error. Failed to reach server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!ageConfirmed) {
      setErrorMsg('Under DPDP Act 2023, you must confirm you are 18 years of age or older to register.');
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('Please review and accept the Terms of Use and Privacy Policy.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: name.trim(),
          email: email.trim(),
          password,
          securityQuestion,
          securityAnswer,
          ageConfirmed: true,
          termsAccepted: true,
          consentTimestamp: new Date().toISOString()
        })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Account created successfully! Please sign in.');
        setMode('login');
        setPassword('');
        setAgeConfirmed(false);
        setTermsAccepted(false);
      } else {
        setErrorMsg(data.error || data.message || 'Signup failed');
      }
    } catch {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotQuestionFetch = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/forgot/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email })
      });
      const data = await res.json();

      if (res.ok) {
        setForgotQuestion(data.question);
      } else {
        setErrorMsg(data.error || data.message || 'Failed to fetch question');
      }
    } catch {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/forgot/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, answer: forgotAnswer, newPassword })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Password reset successfully. Sign in with your new password.');
        setMode('login');
        setPassword('');
      } else {
        setErrorMsg(data.error || data.message || 'Password reset failed');
      }
    } catch {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset2FAOnly = async () => {
    if (!forgotAnswer.trim()) {
      setErrorMsg('Please enter your security answer first.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/forgot/reset-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, answer: forgotAnswer })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || '2FA disabled successfully! Sign in with your password.');
        setMode('login');
        setForgotAnswer('');
      } else {
        setErrorMsg(data.error || 'Failed to reset 2FA');
      }
    } catch {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const cleanCode = (mfaCode || '').replace(/[\s\-]/g, '').trim();
    try {
      const res = await fetch('/api/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code: cleanCode })
      });
      const data = await res.json();

      if (res.ok) {
        handleAuthSuccess(data.token, data.user);
      } else {
        setErrorMsg(data.error || data.message || 'Verification failed');
      }
    } catch {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const copyAppToken = () => {
    if (!authToken) return;
    navigator.clipboard.writeText(authToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 3000);
  };

  const openInAndroidApp = () => {
    const deepLink = `logbookplus://auth?token=${encodeURIComponent(authToken)}`;
    window.location.href = deepLink;
  };

  return (
    <div className="py-12 md:py-20 max-w-md mx-auto px-4 min-h-[75vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full card-unified space-y-6 relative overflow-hidden backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-8"
      >
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-accent-blue/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-accent-purple/15 blur-3xl pointer-events-none" />

        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-2 relative z-10">
          <div className="w-12 h-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
              Logbook <span className="font-semibold text-zinc-500">Plus</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{t('accessVaults')}</p>
          </div>
        </div>

        {/* Interactive Mode Navigation Tabs */}
        {mode !== 'mfa' && mode !== 'app_link' && (
          <div className="flex p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 relative z-10">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${mode === 'login'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
            >
              {t('signIn')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${mode === 'signup'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
            >
              {t('signUp')}
            </button>
            <button
              type="button"
              onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${mode === 'forgot'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-md'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
            >
              Reset
            </button>
          </div>
        )}

        {/* Feedback banners */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3.5 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400 text-xs font-semibold text-center"
            >
              {errorMsg}
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center"
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block pl-1">{t('usernameEmail')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username or email address"
                  className="input-unified pl-10 pr-4 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">{t('password')}</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs font-bold text-accent-blue hover:underline"
                >
                  {t('forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-unified pl-10 pr-10 rounded-xl text-sm"
                  required
                />
                {password ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-unified py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {t('signIn')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* SIGNUP MODE */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block pl-1">{t('username')}</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Desired username"
                  className="input-unified pl-10 pr-4 rounded-xl text-sm"
                  required
                />
              </div>
              {checkingName && <p className="text-xs text-zinc-400 pl-1">{t('checkingAvailability')}</p>}
              {!checkingName && nameAvailable === true && <p className="text-xs text-emerald-500 pl-1 font-semibold">✓ {t('usernameAvailable')}</p>}
              {!checkingName && nameAvailable === false && <p className="text-xs text-rose-500 pl-1 font-semibold">✗ {t('usernameTaken')}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block pl-1">{t('emailAddress')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input-unified pl-10 pr-4 rounded-xl text-sm"
                  required
                />
              </div>
              {checkingEmail && <p className="text-xs text-zinc-400 pl-1">{t('checkingAvailability')}</p>}
              {!checkingEmail && emailAvailable === true && <p className="text-xs text-emerald-500 pl-1 font-semibold">✓ {t('emailAvailable')}</p>}
              {!checkingEmail && emailAvailable === false && <p className="text-xs text-rose-500 pl-1 font-semibold">✗ {t('emailRegistered')}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block pl-1">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input-unified pl-10 pr-10 rounded-xl text-sm"
                  required
                />
                {password ? (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block pl-1">{t('securityQuestion')}</label>
              <CustomSelect
                value={securityQuestion}
                onChange={(val) => setSecurityQuestion(val)}
                options={SECURITY_QUESTIONS.map((q, idx) => ({
                  value: q,
                  label: t('securityQuestion' + (idx + 1))
                }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block pl-1">{t('yourAnswer')}</label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder={t('secretAnswer')}
                className="input-unified rounded-xl text-sm"
                required
              />
            </div>

            {/* Itemized Transparency Notice & Consent Architecture (DPDP Sec 5, 9 & GDPR Art 7, 13) */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => setShowItemizedNotice(!showItemizedNotice)}
                className="text-[11px] font-semibold text-accent-blue hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showItemizedNotice ? '▼ Hide' : '▶ View'} Itemized Data Notice (DPDP Act, 2023)</span>
              </button>

              {showItemizedNotice && (
                <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-[11px] space-y-1 text-left text-zinc-600 dark:text-zinc-300">
                  <p className="font-bold text-accent-blue">Summary of Data Collection & Rights:</p>
                  <p>• <strong>Collected:</strong> Username, email, encrypted password, hashed recovery answer.</p>
                  <p>• <strong>Purpose:</strong> Account authentication, recovery, and access management.</p>
                  <p>• <strong>Your Rights:</strong> Access, correction, complete erasure, and grievance redressal through our Grievance Officer (<a href="mailto:grievance@logbookplus.co.in" className="text-accent-blue underline">grievance@logbookplus.co.in</a>).</p>
                  <p>• <strong>Minors (&lt;18):</strong> Must not register without verifiable parental consent.</p>
                </div>
              )}

              {/* Age Gating Checkbox (DPDP Act 2023 Section 9) */}
              <label className="flex items-start gap-2 text-xs text-left cursor-pointer text-zinc-600 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 accent-blue-500 cursor-pointer"
                  required
                />
                <span>
                  I confirm that I am <strong>18 years of age or older</strong> (or have verifiable parental/guardian consent under DPDP Act, 2023).
                </span>
              </label>

              {/* Terms and Privacy Policy Consent Checkbox */}
              <label className="flex items-start gap-2 text-xs text-left cursor-pointer text-zinc-600 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 accent-blue-500 cursor-pointer"
                  required
                />
                <span>
                  I agree to the{' '}
                  <a
                    href="/terms/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-accent-blue hover:underline font-semibold"
                  >
                    Terms of Use
                  </a>{' '}
                  and acknowledge the{' '}
                  <a
                    href="/privacy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-accent-blue hover:underline font-semibold"
                  >
                    Privacy Policy
                  </a>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || nameAvailable === false || emailAvailable === false || !ageConfirmed || !termsAccepted}
              className="w-full btn-primary-unified py-3 rounded-xl font-bold text-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : t('createAccount')}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <div className="space-y-4 relative z-10">
            {!forgotQuestion ? (
              <form onSubmit={handleForgotQuestionFetch} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block pl-1">{t('enterUsernameEmail')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('usernameEmail')}
                      className="input-unified pl-10 pr-4 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-secondary-unified py-3 rounded-xl font-bold text-sm"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : t('verifyUser')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900/60 space-y-1.5">
                  <span className="text-xs font-bold text-accent-blue uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    {t('securityChallenge')}
                  </span>
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {SECURITY_QUESTIONS.includes(forgotQuestion)
                      ? t('securityQuestion' + (SECURITY_QUESTIONS.indexOf(forgotQuestion) + 1))
                      : forgotQuestion}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block pl-1">{t('yourAnswer')}</label>
                  <input
                    type="text"
                    value={forgotAnswer}
                    onChange={(e) => setForgotAnswer(e.target.value)}
                    placeholder={t('enterAnswer')}
                    className="input-unified rounded-xl text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block pl-1">{t('newPassword')}</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('enterNewPassword')}
                      className="input-unified pr-10 rounded-xl text-sm"
                      required
                    />
                    {newPassword ? (
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary-unified py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : t('resetPassword')}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset2FAOnly}
                    disabled={loading}
                    className="px-3 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Reset 2FA Only
                  </button>
                </div>
              </form>
            )}

            <button
              onClick={() => { setMode('login'); setForgotQuestion(''); }}
              className="w-full text-center text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors py-1"
            >
              {t('backToLogin')}
            </button>
          </div>
        )}

        {/* MFA / 2FA MODE */}
        {mode === 'mfa' && (
          <form onSubmit={handleMfaVerify} className="space-y-4 relative z-10">
            <div className="space-y-2 text-center">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                {t('enter2faCode')}
              </label>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                pattern="[0-9]{6}"
                maxLength="6"
                placeholder="000000"
                className="input-unified text-xl font-bold text-center tracking-[0.3em] rounded-xl py-3"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-unified py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {t('verify')}
            </button>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setForgotQuestion(''); setMfaCode(''); }}
                className="text-center text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors"
              >
                Lost 2FA device? Reset via Security Question
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        {/* APP LINKING / MOBILE SYNC CARD */}
        {mode === 'app_link' && (
          <div className="space-y-5 relative z-10 text-center">
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Mobile App Sync Active</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Signed in as <span className="font-semibold text-accent-blue">{userInfo?.username || email || 'User'}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={openInAndroidApp}
                className="w-full py-2.5 px-4 rounded-lg bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Logbook Plus Android App
              </button>

              <button
                type="button"
                onClick={copyAppToken}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 font-semibold text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
              >
                {copiedToken ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    App Sync Token Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Mobile Sync Token
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/app/dashboard/')}
                className="w-full py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Continue to Web Dashboard →
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
