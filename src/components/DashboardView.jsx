import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Server, FolderOpen, Trash2, Download, AlertTriangle,
  User, Key, ShieldAlert, CreditCard, LogOut, X, ChevronDown, Activity,
  Copy, Check, Unlock, Upload, FileKey, Eye, EyeOff
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

const AVATARS = [
  { icon: "fas fa-user-astronaut", color: "#6c5ce7" },
  { icon: "fas fa-cat", color: "#e17055" },
  { icon: "fas fa-dog", color: "#6ab04c" },
  { icon: "fas fa-robot", color: "#0984e3" },
  { icon: "fas fa-user-ninja", color: "#2d3436" },
  { icon: "fas fa-feather-alt", color: "#a29bfe" },
  { icon: "fas fa-crown", color: "#fdcb6e" },
  { icon: "fas fa-cloud-sun", color: "#00b894" },
  { icon: "fas fa-music", color: "#e84393" }
];

export default function DashboardView({ onNavigate, theme: propTheme, toggleTheme: propToggleTheme }) {
  const { t } = useLanguage();

  const handleToggleTheme = () => {
    if (typeof propToggleTheme === 'function') {
      propToggleTheme();
    } else {
      const root = document.documentElement;
      if (root.classList.contains('dark')) {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    }
  };
  // Stats states
  const [profile, setProfile] = useState({ name: 'User', username: '', email: 'user@example.com', twoFactorEnabled: false, userId: '', profilePicIndex: 0 });
  const [license, setLicense] = useState({ licenseType: 'Free Tier', maxBackups: 3, storageLimitMB: 240 });
  const [stats, setStats] = useState({ totalBackups: 0, storageUsedMB: 0 });
  const [backups, setBackups] = useState([]);
  const [activities, setActivities] = useState(['Dashboard initialized']);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'profile' | 'password' | 'securityQ' | 'mfa' | 'billing' | null
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forms inputs
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const avatarInputRef = useRef(null);

  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [secQuestion, setSecQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [secAnswer, setSecAnswer] = useState('');

  // 2FA Setup
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaQrUrl, setMfaQrUrl] = useState('');
  const [mfaSetupCode, setMfaSetupCode] = useState('');
  const [mfaDisablePwd, setMfaDisablePwd] = useState('');
  const [mfaDisableCode, setMfaDisableCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Decryption state (.enc -> .zip)
  const [selectedBackupItem, setSelectedBackupItem] = useState(null);
  const [selectedEncFile, setSelectedEncFile] = useState(null);
  const [showCurrPassword, setShowCurrPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showMfaDisablePwd, setShowMfaDisablePwd] = useState(false);
  const [showDecryptPassword, setShowDecryptPassword] = useState(false);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState('');
  const [decryptSuccess, setDecryptSuccess] = useState('');

  const copyMfaSecret = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const openDecryptModal = (backupItem = null) => {
    setSelectedBackupItem(backupItem);
    setSelectedEncFile(null);
    setDecryptPassword('');
    setDecryptError('');
    setDecryptSuccess('');
    setActiveModal('decrypt');
  };

  const decryptEncFileToZipBlob = async (arrayBuffer, password) => {
    let bytes = new Uint8Array(arrayBuffer);
    if (bytes.length < 30) {
      throw new Error('Invalid backup file. File size is too small.');
    }

    // Un-wrap server-side LOGBOOK_CRYPT header if present
    const rawHeader14 = String.fromCharCode(...bytes.slice(0, 14));
    if (rawHeader14 === 'LOGBOOK_CRYPT\0') {
      const serverIv = bytes.slice(14, 30);
      const serverCiphertext = bytes.slice(30);
      const encoder = new TextEncoder();
      const serverKeyMaterial = await window.crypto.subtle.digest('SHA-256', encoder.encode('logbookplus_default_file_key_32b'));
      const serverKey = await window.crypto.subtle.importKey('raw', serverKeyMaterial, { name: 'AES-CBC' }, false, ['decrypt']);
      const unwrappedBuffer = await window.crypto.subtle.decrypt({ name: 'AES-CBC', iv: serverIv }, serverKey, serverCiphertext);
      bytes = new Uint8Array(unwrappedBuffer);
    }

    let magicLength = 0;
    const headerStr = String.fromCharCode(...bytes.slice(0, Math.min(14, bytes.length)));

    if (headerStr.startsWith('LBKPW')) {
      magicLength = 'LBKPW'.length;
    } else if (headerStr.startsWith('MK47)#JF')) {
      magicLength = 'MK47)#JF'.length;
    } else if (headerStr.startsWith('LOGBOOK')) {
      magicLength = 'LOGBOOK'.length;
    } else {
      throw new Error('Invalid backup file format. Magic header (LBKPW or MK47)#JF) missing.');
    }

    const salt = bytes.slice(magicLength, magicLength + 16);
    const iv = bytes.slice(magicLength + 16, magicLength + 16 + 12);
    const ciphertext = bytes.slice(magicLength + 16 + 12);

    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);

    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      passwordBytes,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      aesKey,
      ciphertext
    );

    return new Blob([decryptedBuffer], { type: 'application/zip' });
  };

  const handleDecryptSubmit = async (e) => {
    e.preventDefault();
    setDecryptError('');
    setDecryptSuccess('');

    if (!decryptPassword) {
      setDecryptError('Please enter your encryption password.');
      return;
    }

    setDecrypting(true);
    try {
      let buffer = null;
      let targetName = 'decrypted_backup.zip';

      if (selectedEncFile) {
        buffer = await selectedEncFile.arrayBuffer();
        targetName = selectedEncFile.name.replace(/\.enc$/i, '') + '.zip';
        if (!targetName.endsWith('.zip')) targetName += '.zip';
      } else if (selectedBackupItem) {
        const res = await fetch(`/api/restore/${encodeURIComponent(selectedBackupItem.name)}`, {
          headers: getHeaders()
        });
        if (!res.ok) {
          throw new Error('Failed to fetch backup file from server.');
        }
        buffer = await res.arrayBuffer();
        targetName = selectedBackupItem.name.replace(/\.enc$/i, '') + '.zip';
        if (!targetName.endsWith('.zip')) targetName += '.zip';
      } else {
        throw new Error('Please select an encrypted (.enc) file to decrypt.');
      }

      const zipBlob = await decryptEncFileToZipBlob(buffer, decryptPassword);
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = targetName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setDecryptSuccess(`Successfully decrypted! Saved as ${targetName}`);
      addActivity(`Decrypted file ${targetName} to ZIP.`);
      setTimeout(() => {
        setActiveModal(null);
        setSelectedEncFile(null);
        setSelectedBackupItem(null);
        setDecryptPassword('');
        setDecryptSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Decryption error:', err);
      setDecryptError(err.message || 'Decryption failed. Please check your password.');
    } finally {
      setDecrypting(false);
    }
  };

  const menuRef = useRef(null);

  // Error/Success statuses
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    loadDashboard();

    // Close menu when clicking outside
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profile.userId]);

  // Debounced check for Username in edit profile
  useEffect(() => {
    if (activeModal !== 'profile' || !editUsername || editUsername.trim().length < 3) {
      setUsernameAvailable(null);
      return;
    }
    // If it's the user's current username, it's always available
    if (editUsername.trim().toLowerCase() === (profile.username || '').trim().toLowerCase()) {
      setUsernameAvailable(true);
      return;
    }
    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/signup/check-availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getHeaders() },
          body: JSON.stringify({ username: editUsername.trim() })
        });
        if (res.ok) {
          const data = await res.json();
          setUsernameAvailable(data.usernameAvailable);
        }
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [editUsername, activeModal, profile.username]);

  const addActivity = (msg) => {
    setActivities(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const renderAvatar = (sizeClass = "w-8 h-8") => {
    const defaultAvatar = AVATARS[profile.profilePicIndex % AVATARS.length] || AVATARS[0];
    const userId = profile.userId || profile._id || profile.id;

    if (userId && (profile.hasAvatar || profile.avatarUrl || !avatarFailed)) {
      return (
        <img
          src={profile.avatarUrl || `/api/profile/avatar/${userId}?_t=${Date.now()}`}
          alt=""
          className={`${sizeClass} rounded-full object-cover border border-white/10`}
          onError={() => setAvatarFailed(true)}
        />
      );
    }

    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center bg-zinc-900 border border-white/10`}
        style={{ color: defaultAvatar.color }}
      >
        <i className={`${defaultAvatar.icon} text-sm`} />
      </div>
    );
  };

  const getHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const handleLogout = () => {
    fetch('/api/logout', { method: 'POST', headers: getHeaders() }).catch(() => { });
    localStorage.removeItem('authToken');
    onNavigate('/app/');
  };

  const loadDashboard = async () => {
    const headers = getHeaders();
    try {
      // 1. Load Profile
      const profRes = await fetch('/api/profile', { headers });
      if (!profRes.ok) {
        // Auth failed, go back to login
        localStorage.removeItem('authToken');
        onNavigate('/app/');
        return;
      }
      const profData = await profRes.json();
      const userId = profData.userId || profData._id || profData.id;
      const normalizedProf = { ...profData, userId };
      setProfile(normalizedProf);
      setEditName(profData.name || '');
      setEditUsername(profData.username || '');
      setEditEmail(profData.email || '');

      // 2. Load License info
      const licRes = await fetch('/api/licenses/check', { headers });
      if (licRes.ok) {
        const licData = await licRes.json();
        if (licData.hasLicense || normalizedProf.plan === 'licensed' || normalizedProf.plan === 'premium') {
          setLicense({
            licenseType: normalizedProf.plan === 'licensed' ? 'Self-Hosted License' : 'Premium License',
            maxBackups: 3,
            storageLimitMB: 240,
            licenseKey: licData.licenseKey || null,
            expiresAt: licData.expiresAt || null,
            hasLicense: true
          });
        } else {
          setLicense({
            licenseType: 'Free Tier',
            maxBackups: 3,
            storageLimitMB: 240,
            hasLicense: false
          });
        }
      }

      // 3. Load Storage Stats
      const infoRes = await fetch('/api/info', { headers });
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        setStats({
          totalBackups: infoData.totalBackups !== undefined ? infoData.totalBackups : (infoData.count || 0),
          storageUsedMB: parseFloat(infoData.storageUsedMB !== undefined ? infoData.storageUsedMB : (infoData.sizeMB || 0)) || 0
        });
      }

      // 4. Load Backups List
      const backupsRes = await fetch('/api/backups', { headers });
      if (backupsRes.ok) {
        const backupsData = await backupsRes.json();
        setBackups(backupsData);
      }
    } catch {
      addActivity('Failed to sync network stats.');
    }
  };



  // Restore/Download Backup
  const handleDownloadBackup = async (filename) => {
    addActivity(`Downloading archive: ${filename}`);
    try {
      const res = await fetch(`/api/restore/${encodeURIComponent(filename)}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        addActivity(`Failed to fetch file: ${filename}`, true);
      }
    } catch {
      addActivity('Download failed.', true);
    }
  };

  // Delete Backup
  const handleDeleteBackup = async (filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;
    addActivity(`Deleting backup: ${filename}`);
    try {
      const res = await fetch(`/api/backup/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        addActivity(`Deleted backup: ${filename}`);
        loadDashboard();
      } else {
        addActivity(`Delete failed for: ${filename}`, true);
      }
    } catch {
      addActivity('Network error during delete.', true);
    }
  };

  // Purge all backups
  const handlePurgeAll = async () => {
    if (!confirm('Are you sure you want to purge all backups? This action cannot be undone.')) return;
    addActivity('Purging all backup archives...');
    let failed = 0;
    try {
      for (const b of backups) {
        const res = await fetch(`/api/backup/${encodeURIComponent(b.name)}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (!res.ok) failed++;
      }
      if (failed === 0) {
        addActivity('Purged all backups from the server.');
      } else {
        addActivity(`Purged vault with ${failed} deletion error(s).`, true);
      }
      loadDashboard();
    } catch {
      addActivity('Failed to complete vault purge.', true);
    }
  };

  // Profile Edit
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');

    if (usernameAvailable === false) {
      setActionError('Username is already taken.');
      return;
    }

    setLoading(true);

    try {
      // 1. Update Profile Details
      const nameRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({
          name: editName,
          username: editUsername,
          email: editEmail,
          profilePicIndex: selectedAvatarIndex
        })
      });

      if (!nameRes.ok) {
        const errData = await nameRes.json().catch(() => ({}));
        setActionError(errData.error || 'Failed to modify profile details.');
        setLoading(false);
        return;
      }

      // If preset selected (meaning avatarFailed was set to true manually), delete custom avatar file
      if (avatarFailed) {
        await fetch('/api/profile/avatar', {
          method: 'DELETE',
          headers: getHeaders()
        });
      }

      // 2. Upload custom file if chosen
      if (selectedAvatarFile) {
        const formData = new FormData();
        formData.append('avatar', selectedAvatarFile);

        const avatarRes = await fetch('/api/profile/avatar', {
          method: 'POST',
          headers: getHeaders(),
          body: formData
        });

        if (!avatarRes.ok) {
          const errData = await avatarRes.json();
          setActionError(errData.error || 'Failed to upload custom profile picture.');
          setLoading(false);
          return;
        }
        setAvatarFailed(false);
      }

      setActionSuccess('Profile updated successfully.');
      addActivity('Profile information modified.');
      loadDashboard();
      setTimeout(() => {
        setActiveModal(null);
        setSelectedAvatarFile(null);
      }, 1500);
    } catch {
      setActionError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ currentPassword: currPassword, newPassword })
      });
      const data = await res.json();

      if (res.ok) {
        setActionSuccess('Password changed successfully.');
        addActivity('Password keys modified.');
        setCurrPassword('');
        setNewPassword('');
        setTimeout(() => setActiveModal(null), 1500);
      } else {
        setActionError(data.error || 'Failed to update password.');
      }
    } catch {
      setActionError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Security Question
  const handleSaveSecurityQuestion = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/profile/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ securityQuestion: secQuestion, securityAnswer: secAnswer })
      });

      if (res.ok) {
        setActionSuccess('Security recovery question configured.');
        addActivity('Recovery questions updated.');
        setSecAnswer('');
        setTimeout(() => setActiveModal(null), 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || 'Failed to configure questions.');
      }
    } catch {
      setActionError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // 2FA Setup Initiate
  const initiateMfaSetup = async () => {
    setLoading(true);
    setActionError('');
    try {
      const res = await fetch('/api/profile/2fa/setup', {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setMfaSecret(data.secret);
        setMfaQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(data.otpauthUrl)}`);
      } else {
        setActionError('Failed to initiate 2FA setup.');
      }
    } catch {
      setActionError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // 2FA Setup Verify
  const handleMfaVerifyEnable = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setLoading(true);

    const cleanCode = (mfaSetupCode || '').replace(/[\s\-]/g, '').trim();
    try {
      const res = await fetch('/api/profile/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ code: cleanCode })
      });

      if (res.ok) {
        setActionSuccess('Two-Factor Authentication is now enabled!');
        addActivity('2FA Authenticator activated.');
        loadDashboard();
        setMfaSetupCode('');
        setMfaSecret('');
        setMfaQrUrl('');
        setTimeout(() => setActiveModal(null), 1500);
      } else {
        setActionError('Verification code invalid.');
      }
    } catch {
      setActionError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // 2FA Disable
  const handleMfaDisable = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    setLoading(true);

    const cleanCode = (mfaDisableCode || '').replace(/[\s\-]/g, '').trim();
    try {
      const res = await fetch('/api/profile/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getHeaders() },
        body: JSON.stringify({ password: mfaDisablePwd, code: cleanCode })
      });

      if (res.ok) {
        setActionSuccess('Two-Factor Authentication is disabled.');
        addActivity('2FA Authenticator deactivated.');
        loadDashboard();
        setMfaDisablePwd('');
        setMfaDisableCode('');
        setTimeout(() => setActiveModal(null), 1500);
      } else {
        setActionError('Password or 2FA verification code invalid.');
      }
    } catch {
      setActionError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Cancel mock subscription
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your Premium cloud backups subscription?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/cancel-mock', {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        alert('Mock subscription cancelled successfully.');
        addActivity('Subscription cancellation requested.');
        loadDashboard();
        setActiveModal(null);
      } else {
        alert('Failed to cancel mock subscription.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const limitQuota = license.storageLimitMB || 240;
  const isCloseToLimit = stats.storageUsedMB > limitQuota * 0.85;

  return (
    <div className="py-12 md:py-20 w-full max-w-[95%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 sm:px-8 md:px-20 space-y-8 relative">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-white/5 pb-6">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            {t('welcome')} <span className="bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">{profile.name}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">{t('consoleSession')}: {profile.email} • {t('planLabel')}: {license.licenseType}</p>
        </div>

        {(() => {
          const portalTarget = document.getElementById('global-account-manager-portal');
          if (!portalTarget) return null;
          return createPortal(
            <div className="relative w-full md:w-auto" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-full md:w-auto p-3 md:p-2 rounded-xl transition-all duration-200 md:hover:scale-105 active:scale-95 flex items-center justify-between md:justify-center gap-3"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                <div className="flex items-center gap-3">
                  {renderAvatar("w-6 h-6")}
                  <span className="font-semibold text-sm">{t('accountManager')}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="relative md:absolute right-0 md:right-0 left-0 md:left-auto mt-2 w-full md:w-56 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 p-2 shadow-2xl z-[60] text-left space-y-1 backdrop-blur-md"
                  >
                    {[
                      {
                        label: t('editProfile'), icon: User, action: () => {
                          setEditName(profile.name || '');
                          setEditUsername(profile.username || '');
                          setEditEmail(profile.email || '');
                          setSelectedAvatarIndex(profile.profilePicIndex || 0);
                          setSelectedAvatarFile(null);
                          setActiveModal('profile');
                          setMenuOpen(false);
                        }
                      },
                      { label: t('changePassword'), icon: Key, action: () => { setActiveModal('password'); setMenuOpen(false); } },
                      { label: t('securityQuestionMenu'), icon: ShieldAlert, action: () => { setActiveModal('securityQ'); setMenuOpen(false); } },
                      { label: t('twoFactorAuth'), icon: Shield, action: () => { setActiveModal('mfa'); if (!profile.twoFactorEnabled) { initiateMfaSetup(); } setMenuOpen(false); } },
                      { label: t('billingSettings'), icon: CreditCard, action: () => { setActiveModal('billing'); setMenuOpen(false); } },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          item.action();
                          window.dispatchEvent(new Event('closeMobileMenu'));
                        }}
                        className="dropdown-item"
                      >
                        <item.icon className="w-4 h-4 text-zinc-500" />
                        {item.label}
                      </button>
                    ))}
                    <div className="h-[1px] bg-zinc-200 dark:bg-white/5 my-1" />
                    <button
                      onClick={() => {
                        handleLogout();
                        window.dispatchEvent(new Event('closeMobileMenu'));
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logoutSession')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>,
            portalTarget
          );
        })()}
      </div>

      {/* Warning banner */}
      {isCloseToLimit && (
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs flex items-center gap-3 text-left">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
          <p>
            {t('warningQuota')} ({stats.storageUsedMB.toFixed(1)} / {limitQuota} MB). {t('oldFilesRotated')}
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { title: t('totalBackups'), value: `${stats.totalBackups} / ${license.maxBackups || 3}`, desc: t('activeArchives') },
          { title: t('storageUsed'), value: `${stats.storageUsedMB.toFixed(2)} / ${limitQuota} MB`, desc: t('allocatedStorage') },
          {
            title: t('lastBackup'),
            value: backups.length > 0 ? new Date(backups[0].time || backups[0].mtime).toLocaleDateString() : '—',
            desc: backups.length > 0 ? new Date(backups[0].time || backups[0].mtime).toLocaleTimeString() : t('noFilesSynced')
          },
          {
            title: t('vaultSecurity'),
            value: profile.twoFactorEnabled ? t('twoFaSecured') : t('credentialsOnly'),
            desc: profile.twoFactorEnabled ? t('highSecVerification') : t('twoFaDisabled')
          }
        ].map((card, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/5 text-left space-y-1.5 relative overflow-hidden shadow-sm dark:shadow-none">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono font-bold uppercase">{card.title}</span>
            <h4 className="text-2xl font-black text-zinc-900 dark:text-white">{card.value}</h4>
            <p className="text-xs text-zinc-500 font-medium">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Vault Manager Panel */}
      <div className="card-unified space-y-6 relative overflow-hidden dark:bg-zinc-950/20">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-transparent pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-accent-blue border border-blue-500/10">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-white tracking-tight">{t('encryptedVault')}</h2>
              <p className="text-xs text-zinc-500">{t('vaultSubtitle')}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 mt-2 sm:mt-0">
            <button
              onClick={() => openDecryptModal(null)}
              className="w-full sm:w-auto btn-secondary-unified flex items-center justify-center gap-1.5 text-blue-600 dark:text-accent-blue hover:text-purple-600 dark:hover:text-accent-purple"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Decrypt .enc File</span>
            </button>
            <button
              onClick={handlePurgeAll}
              disabled={backups.length === 0}
              className="w-full sm:w-auto btn-danger-unified justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('purgeVault')}
            </button>
          </div>
        </div>

        {/* Backups List */}
        {backups.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <FolderOpen className="w-12 h-12 text-zinc-700" />
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-semibold">{t('noBackups')}</p>
              <p className="text-[10px] text-zinc-600">{t('noBackupsDesc')}</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-white/5">
            {backups.map((b) => (
              <div key={b.name} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/5 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                    <Server className="w-4 h-4 text-accent-blue" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-zinc-800 dark:text-white break-all max-w-sm">{b.name}</h5>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 block">
                      {t('size')} {b.size || (b.sizeMB ? `${b.sizeMB} MB` : '')} • {t('synced')} {new Date(b.time || b.mtime).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => openDecryptModal(b)}
                    className="w-full sm:w-auto btn-secondary-unified text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 justify-center"
                    title="Decrypt .enc backup file to .zip"
                  >
                    <Unlock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Decrypt .zip</span>
                  </button>
                  <button
                    onClick={() => handleDownloadBackup(b.name)}
                    className="w-full sm:w-auto btn-secondary-unified justify-center"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t('download')}
                  </button>
                  <button
                    onClick={() => handleDeleteBackup(b.name)}
                    className="w-full sm:w-auto btn-danger-unified justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Logs & Self-Host Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Activity logs */}
        <div className="md:col-span-6 card-unified dark:bg-zinc-950/40">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 pl-1 mb-3">
            <Activity className="w-3.5 h-3.5" />
            {t('consoleActivityLog')}
          </span>
          <div className="h-48 overflow-y-auto font-mono text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5 pr-2 custom-scrollbar">
            {activities.map((act, index) => (
              <div key={index} className="flex items-start gap-2 border-b border-zinc-200 dark:border-white/5 pb-1.5 last:border-0 last:pb-0">
                <span className="text-zinc-400 dark:text-zinc-600 flex-shrink-0">•</span>
                <p className="break-all">{act}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Self-Host instructions card */}
        <div className="md:col-span-6 card-unified dark:bg-zinc-950/40">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 pl-1 mb-3">
            <Server className="w-3.5 h-3.5 text-accent-cyan" />
            {t('selfHostedRelays')}
          </span>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
            {t('selfHostedRelaysDesc')}
          </p>
          <button
            onClick={() => onNavigate('/documentation/')}
            className="w-full btn-secondary-unified"
          >
            {t('reviewSetupInstructions')}
          </button>
        </div>
      </div>

      {/* MODALS RENDER */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md card-unified space-y-5 relative overflow-hidden bg-white dark:bg-zinc-950"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/2 to-transparent pointer-events-none" />

              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-white/5 pb-3">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">
                  {activeModal === 'profile' && t('modalEditProfile')}
                  {activeModal === 'password' && t('modalChangePassword')}
                  {activeModal === 'securityQ' && t('modalSecurityRecovery')}
                  {activeModal === 'mfa' && t('modal2faSettings')}
                  {activeModal === 'billing' && t('modalBillingSettings')}
                  {activeModal === 'decrypt' && 'Decrypt Backup File (.enc → .zip)'}
                </h3>
                <button
                  onClick={() => { setActiveModal(null); setActionError(''); setActionSuccess(''); }}
                  className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {actionError && (
                <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-semibold text-center">
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold text-center">
                  {actionSuccess}
                </div>
              )}

              {/* PROFILE MODAL CONTENT */}
              {activeModal === 'profile' && (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">{t('displayName')}</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={t('yourNamePlaceholder')}
                      className="input-unified"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">{t('username')}</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder={t('username')}
                      className="input-unified"
                      required
                    />
                    {checkingUsername && <p className="text-[11px] text-zinc-500 pl-1">{t('checkingAvailability')}</p>}
                    {!checkingUsername && usernameAvailable === true && editUsername.trim().toLowerCase() !== (profile.username || '').trim().toLowerCase() && <p className="text-[11px] text-emerald-400 pl-1">✓ {t('usernameAvailable')}</p>}
                    {!checkingUsername && usernameAvailable === false && <p className="text-[11px] text-rose-400 pl-1">✗ {t('usernameTaken')}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">{t('emailAddress')}</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder={t('emailPlaceholder')}
                      className="input-unified"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">{t('profilePicture')}</label>

                    {/* Current avatar preview and custom upload */}
                    <div className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-white/5">
                      <div className="relative">
                        {/* Preview of what will be saved */}
                        {selectedAvatarFile ? (
                          <img
                            src={URL.createObjectURL(selectedAvatarFile)}
                            alt="Preview"
                            className="w-14 h-14 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                          />
                        ) : (
                          // If they haven't selected a new custom file, show current renderAvatar or the selected preset avatar if they clicked one
                          (() => {
                            // If they clicked a preset avatar, and we are not uploading a custom file, show preset preview
                            const avatar = AVATARS[selectedAvatarIndex % AVATARS.length] || AVATARS[0];
                            const userId = profile.userId || profile._id || profile.id;
                            // Show preset avatar icon or current custom image
                            if (userId && (profile.hasAvatar || profile.avatarUrl || !avatarFailed) && !selectedAvatarFile) {
                              // If they have a custom avatar on disk, show it
                              return (
                                <img
                                  src={profile.avatarUrl || `/api/profile/avatar/${userId}?_t=${Date.now()}`}
                                  alt=""
                                  className="w-14 h-14 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                                  onError={() => setAvatarFailed(true)}
                                />
                              );
                            }
                            return (
                              <div
                                className="w-14 h-14 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10"
                                style={{ color: avatar.color }}
                              >
                                <i className={`${avatar.icon} text-lg`} />
                              </div>
                            );
                          })()
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 text-left">
                        <span className="text-[10px] text-zinc-500 font-semibold">{t('customImageUpload')}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-xs font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 cursor-pointer"
                          >
                            {t('chooseFile')}
                          </button>
                          {/* If they have a custom avatar uploaded (not failed) or selected a file, show remove button to revert to presets */}
                          {((profile.userId && !avatarFailed) || selectedAvatarFile) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAvatarFile(null);
                                setAvatarFailed(true); // Force fall back to preset
                              }}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-500 dark:text-red-400 cursor-pointer border border-red-500/10"
                            >
                              {t('resetToPreset')}
                            </button>
                          )}
                        </div>
                        <input
                          type="file"
                          ref={avatarInputRef}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setSelectedAvatarFile(e.target.files[0]);
                              setAvatarFailed(false); // Preview the custom image
                            }
                          }}
                          className="hidden"
                          accept="image/jpeg,image/png,image/gif"
                        />
                      </div>
                    </div>

                    {/* Grid of presets */}
                    <div className="space-y-1.5 text-left">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase pl-1">{t('orChoosePreset')}</span>
                      <div className="grid grid-cols-5 gap-2.5 p-3.5 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-200 dark:border-white/5">
                        {AVATARS.map((av, index) => {
                          const isSelected = selectedAvatarIndex === index;
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setSelectedAvatarIndex(index);
                                setSelectedAvatarFile(null); // Clear selected custom file so it uses the preset
                                setAvatarFailed(true); // Force preset view
                              }}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${isSelected
                                  ? 'border-accent-blue bg-accent-blue/10 scale-110 shadow-sm'
                                  : 'border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                                }`}
                              style={{ color: av.color }}
                            >
                              <i className={`${av.icon} text-sm`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary-unified"
                  >
                    {loading ? t('savingChanges') : t('saveSettings')}
                  </button>
                </form>
              )}

              {/* PASSWORD CHANGE */}
              {activeModal === 'password' && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">{t('currentPassword')}</label>
                    <div className="relative">
                      <input
                        type={showCurrPassword ? "text" : "password"}
                        value={currPassword}
                        onChange={(e) => setCurrPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-unified pr-10"
                        required
                      />
                      {currPassword ? (
                        <button
                          type="button"
                          onClick={() => setShowCurrPassword(!showCurrPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showCurrPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">{t('newPassword')}</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-unified pr-10"
                        required
                      />
                      {newPassword ? (
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary-unified"
                  >
                    {loading ? t('changingKeys') : t('updatePassword')}
                  </button>
                </form>
              )}

              {/* SECURITY QUESTIONS */}
              {activeModal === 'securityQ' && (
                <form onSubmit={handleSaveSecurityQuestion} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">{t('securityQuestion')}</label>
                    <CustomSelect
                      value={secQuestion}
                      onChange={(val) => setSecQuestion(val)}
                      options={SECURITY_QUESTIONS.map((q, idx) => ({
                        value: q,
                        label: t('securityQuestion' + (idx + 1))
                      }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">{t('secretAnswer')}</label>
                    <input
                      type="text"
                      value={secAnswer}
                      onChange={(e) => setSecAnswer(e.target.value)}
                      placeholder={t('secretAnswerPlaceholder')}
                      className="input-unified"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary-unified"
                  >
                    {loading ? t('savingRecoveryOption') : t('saveRecoveryOption')}
                  </button>
                </form>
              )}

              {/* 2FA AUTHENTICATOR SETUP */}
              {activeModal === 'mfa' && (
                <div className="space-y-4">
                  {!profile.twoFactorEnabled ? (
                    // Enable flow
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {t('mfaSetupInstructions')}
                      </p>

                      {mfaQrUrl && (
                        <div className="flex flex-col items-center p-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 space-y-3">
                          <img
                            src={mfaQrUrl}
                            alt="Scan 2FA QR"
                            className="w-36 h-36 rounded-lg border border-zinc-200 dark:border-white/10 bg-white p-2"
                          />
                          <div className="flex flex-col items-center gap-1.5 text-center">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">Secret Setup Key:</span>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-mono font-bold text-zinc-900 dark:text-white tracking-widest">{mfaSecret}</p>
                              <button
                                type="button"
                                onClick={() => copyMfaSecret(mfaSecret)}
                                className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-sans font-semibold rounded-md border border-zinc-300 dark:border-white/10 transition-all cursor-pointer flex items-center gap-1 text-zinc-700 dark:text-zinc-200"
                              >
                                {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedSecret ? 'Copied!' : 'Copy Key'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleMfaVerifyEnable} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1 text-center">
                            {t('enterMfaCode')}
                          </label>
                          <input
                            type="text"
                            value={mfaSetupCode}
                            onChange={(e) => setMfaSetupCode(e.target.value)}
                            pattern="[0-9]{6}"
                            maxLength="6"
                            placeholder="000000"
                            className="input-unified text-sm font-bold text-center tracking-[0.2em]"
                            required
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full btn-primary-unified"
                        >
                          {t('enableAuthenticator')}
                        </button>
                      </form>
                    </div>
                  ) : (
                    // Disable flow
                    <form onSubmit={handleMfaDisable} className="space-y-4">
                      <p className="text-xs text-red-400 leading-relaxed">
                        {t('mfaDisableWarning')}
                      </p>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">{t('confirmPassword')}</label>
                        <div className="relative">
                          <input
                            type={showMfaDisablePwd ? "text" : "password"}
                            value={mfaDisablePwd}
                            onChange={(e) => setMfaDisablePwd(e.target.value)}
                            placeholder={t('confirmPasswordPlaceholder')}
                            className="input-unified pr-10"
                            required
                          />
                          {mfaDisablePwd ? (
                            <button
                              type="button"
                              onClick={() => setShowMfaDisablePwd(!showMfaDisablePwd)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                              tabIndex={-1}
                            >
                              {showMfaDisablePwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">{t('authenticatorCode')}</label>
                        <input
                          type="text"
                          value={mfaDisableCode}
                          onChange={(e) => setMfaDisableCode(e.target.value)}
                          pattern="[0-9]{6}"
                          maxLength="6"
                          placeholder="000000"
                          className="input-unified text-center tracking-[0.2em]"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-danger-unified"
                      >
                        {t('deactivateMfa')}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* BILLING AND QUOTA MODAL */}
              {activeModal === 'billing' && (
                <div className="space-y-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/60 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-zinc-800 dark:text-white">{t('activePlan')}</span>
                      <span className="px-2 py-0.5 bg-blue-500/10 text-accent-blue rounded-full border border-blue-500/20 font-bold uppercase text-[9px]">{license.licenseType}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-zinc-200 dark:border-white/5 pt-3">
                      <span>{t('maxBackupsAllowed')}</span>
                      <span className="font-mono text-zinc-800 dark:text-white font-bold">{license.maxBackups} {t('vaultSlots')}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-zinc-200 dark:border-white/5 pt-3">
                      <span>{t('totalQuotaLimit')}</span>
                      <span className="font-mono text-zinc-800 dark:text-white font-bold">{limitQuota} MB</span>
                    </div>
                  </div>

                  {license.licenseType !== 'Free Tier' && (
                    <button
                      onClick={handleCancelSubscription}
                      className="w-full btn-danger-unified"
                    >
                      {t('cancelSubscription')}
                    </button>
                  )}
                </div>
              )}

              {/* DECRYPT MODAL CONTENT */}
              {activeModal === 'decrypt' && (
                <form onSubmit={handleDecryptSubmit} className="space-y-4 text-left">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2.5">
                    <Unlock className="w-4 h-4 flex-shrink-0" />
                    <span>Client-side decryption: Decrypt encrypted .enc backups into downloadable .zip files right in your browser.</span>
                  </div>

                  {selectedBackupItem ? (
                    <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs space-y-1">
                      <span className="text-zinc-500 dark:text-zinc-400 font-bold block uppercase text-[10px]">Selected Server Vault Archive:</span>
                      <p className="font-mono text-zinc-900 dark:text-white font-semibold break-all">{selectedBackupItem.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">Choose .enc File from Disk</label>
                      <input
                        type="file"
                        accept=".enc"
                        onChange={(e) => setSelectedEncFile(e.target.files[0] || null)}
                        className="input-unified text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30"
                      />
                      {selectedEncFile && (
                        <p className="text-[11px] text-zinc-500 font-mono pl-1">Selected file: {selectedEncFile.name}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">Encryption Password</label>
                    <div className="relative">
                      <input
                        type={showDecryptPassword ? "text" : "password"}
                        value={decryptPassword}
                        onChange={(e) => setDecryptPassword(e.target.value)}
                        placeholder="Enter backup encryption password"
                        className="input-unified pr-10"
                        required
                      />
                      {decryptPassword ? (
                        <button
                          type="button"
                          onClick={() => setShowDecryptPassword(!showDecryptPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showDecryptPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {decryptError && (
                    <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-semibold text-center">
                      {decryptError}
                    </div>
                  )}

                  {decryptSuccess && (
                    <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold text-center">
                      {decryptSuccess}
                    </div>
                  )}

                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setActiveModal(null); setSelectedEncFile(null); setSelectedBackupItem(null); setDecryptPassword(''); }}
                      className="w-1/2 btn-secondary-unified"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={decrypting}
                      className="w-1/2 btn-primary-unified flex items-center justify-center gap-2"
                    >
                      {decrypting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Decrypting...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Decrypt & Download ZIP</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
