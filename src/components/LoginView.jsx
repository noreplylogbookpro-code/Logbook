import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, User, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../useLanguage.js';

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
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'mfa'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Forgot password states
  const [forgotQuestion, setForgotQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // MFA states
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Live checks
  const [nameAvailable, setNameAvailable] = useState(null);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [checkingName, setCheckingName] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

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
          body: JSON.stringify({ name })
        });
        if (res.ok) {
          const data = await res.json();
          setNameAvailable(data.nameAvailable);
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
          body: JSON.stringify({ username: email })
        });
        if (res.ok) {
          const data = await res.json();
          setEmailAvailable(data.usernameAvailable);
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
          onNavigate('/app/dashboard/');
        } else {
          localStorage.removeItem('authToken');
        }
      }).catch(() => { });
    }
  }, [onNavigate]);

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
          if (data.token) {
            localStorage.setItem('authToken', data.token);
          }
          onNavigate('/app/dashboard/');
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
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password, name, securityQuestion, securityAnswer })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('Account created successfully! Please sign in.');
        setMode('login');
        setPassword('');
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

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code: mfaCode })
      });
      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        onNavigate('/app/dashboard/');
      } else {
        setErrorMsg(data.error || data.message || 'Verification failed');
      }
    } catch {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 max-w-lg mx-auto px-4 min-h-fit">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-unified space-y-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-transparent pointer-events-none" />

        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-accent-blue border border-blue-500/20">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-800 dark:text-white tracking-tight">{t('logbookConsole')}</h2>
            <p className="text-sm text-zinc-500 mt-1">{t('accessVaults')}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-semibold text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm font-semibold text-center">
            {successMsg}
          </div>
        )}

        {/* LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-500 uppercase block pl-1">{t('usernameEmail')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('usernameEmail')}
                  className="input-unified pl-10 pr-4"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-zinc-500 uppercase block">{t('password')}</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm font-bold text-accent-blue hover:underline"
                >
                  {t('forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-unified pl-10 pr-4"
                  required
                />
              </div>
            </div>
            <div className="space-y-4"></div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-unified"
            >
              {loading ? '...' : t('signIn')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="text-center pt-2">
              <span className="text-sm text-zinc-500">{t('dontHaveAccount')} </span>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-sm font-bold text-accent-blue hover:underline"
              >
                {t('signUp')}
              </button>
            </div>
          </form>
        )}

        {/* SIGNUP MODE */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-500 uppercase block pl-1">{t('username')}</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('username')}
                  className="input-unified pl-10 pr-4"
                  required
                />
              </div>
              {checkingName && <p className="text-[13px] text-zinc-500 pl-1">{t('checkingAvailability')}</p>}
              {!checkingName && nameAvailable === true && <p className="text-[13px] text-emerald-400 pl-1">✓ {t('usernameAvailable')}</p>}
              {!checkingName && nameAvailable === false && <p className="text-[13px] text-rose-400 pl-1">✗ {t('usernameTaken')}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-500 uppercase block pl-1">{t('emailAddress')}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input-unified pl-10 pr-4"
                  required
                />
              </div>
              {checkingEmail && <p className="text-[10px] text-zinc-500 pl-1">{t('checkingAvailability')}</p>}
              {!checkingEmail && emailAvailable === true && <p className="text-[10px] text-emerald-400 pl-1">✓ {t('emailAvailable')}</p>}
              {!checkingEmail && emailAvailable === false && <p className="text-[10px] text-rose-400 pl-1">✗ {t('emailRegistered')}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-500 uppercase block pl-1">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-unified pl-10 pr-4"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-500 uppercase block pl-1">{t('securityQuestion')}</label>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="select-unified"
              >
                {SECURITY_QUESTIONS.map((q, idx) => (
                  <option key={q} value={q} className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-white">
                    {t('securityQuestion' + (idx + 1))}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-500 uppercase block pl-1">{t('yourAnswer')}</label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder={t('secretAnswer')}
                className="input-unified"
                required
              />
            </div>
            <div className="space-y-1.5"></div>

            <button
              type="submit"
              disabled={loading || nameAvailable === false || emailAvailable === false}
              className="w-full btn-primary-unified"
            >
              {loading ? t('creatingAccount') : t('createAccount')}
            </button>

            <div className="text-center pt-2">
              <span className="text-sm text-zinc-500">{t('alreadyHaveAccount')} </span>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-sm font-bold text-accent-blue hover:underline"
              >
                {t('signIn')}
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            {!forgotQuestion ? (
              <form onSubmit={handleForgotQuestionFetch} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-zinc-500 uppercase block pl-1">{t('enterUsernameEmail')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('usernameEmail')}
                      className="input-unified pl-10 pr-4"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-secondary-unified"
                >
                  {loading ? t('verifying') : t('verifyUser')}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/60 space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-accent-blue" />
                    {t('securityChallenge')}
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-white leading-relaxed">
                    {SECURITY_QUESTIONS.includes(forgotQuestion) 
                      ? t('securityQuestion' + (SECURITY_QUESTIONS.indexOf(forgotQuestion) + 1)) 
                      : forgotQuestion}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">{t('yourAnswer')}</label>
                  <input
                    type="text"
                    value={forgotAnswer}
                    onChange={(e) => setForgotAnswer(e.target.value)}
                    placeholder={t('enterAnswer')}
                    className="input-unified"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">{t('newPassword')}</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('enterNewPassword')}
                    className="input-unified"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary-unified"
                >
                  {loading ? t('resettingPassword') : t('resetPassword')}
                </button>
              </form>
            )}

            <button
              onClick={() => { setMode('login'); setForgotQuestion(''); }}
              className="w-full text-center text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              {t('backToLogin')}
            </button>
          </div>
        )}

        {/* MFA / 2FA VERIFICATION CODE MODE */}
        {mode === 'mfa' && (
          <form onSubmit={handleMfaVerify} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-zinc-500 uppercase block text-center">
                {t('enter2faCode')}
              </label>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                pattern="[0-9]{6}"
                maxLength="6"
                placeholder="000000"
                className="input-unified text-lg font-bold text-center tracking-[0.2em]"
                required
              />
            </div>
            <div className="space-y-1.5"></div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-unified"
            >
              <ShieldCheck className="w-4 h-6 text-emerald-900" />
              {t('verify')}
            </button>
            <div className="space-y-1.5"></div>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              {t('cancel')}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
