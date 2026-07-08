import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Server, Cloud, FolderOpen, Calendar, Trash2,
  User, Key, ShieldAlert, CreditCard, LogOut, ChevronDown,
  Terminal, Settings, Users, Activity, Plus, Copy, Check, X,
  BookOpen, Clock, RefreshCw, AlertTriangle
} from 'lucide-react';

export default function MasterView({ onNavigate }) {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Active view tab state
  const [activeTab, setActiveTab] = useState('Overview'); // 'Overview' | 'Users' | 'Licenses' | 'Blogs' | 'Logs' | 'Settings'

  // Dashboard Data states
  const [stats, setStats] = useState({ totalUsers: 0, totalStorageMB: 0, uptimeSeconds: 0, masterUser: 'admin' });
  const [serverUptime, setServerUptime] = useState(0);
  const [users, setUsers] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [logsList, setLogsList] = useState([]);
  const [serverConfig, setServerConfig] = useState({ quotaLimit: 240 * 1024 * 1024, signupsEnabled: true });
  const [masterProfile, setMasterProfile] = useState({ name: 'Master Admin', email: 'admin@logbook', profilePicIndex: 0, twoFactorEnabled: false });

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'editPlan' | 'editBlog' | 'mfaSetup' | 'editProfile' | 'changePwd'
  const [selectedUser, setSelectedUser] = useState(null);
  const [editPlanType, setEditPlanType] = useState('premium');
  const [editPlanStatus, setEditPlanStatus] = useState('active');
  const [editPlanExpiry, setEditPlanExpiry] = useState('');

  // Blog Form states
  const [selectedBlogId, setSelectedBlogId] = useState('');
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('Guides');
  const [blogDate, setBlogDate] = useState('');
  const [blogImageUrl, setBlogImageUrl] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');

  // License Form states
  const [licenseeEmail, setLicenseeEmail] = useState('');
  const [licenseDuration, setLicenseDuration] = useState('365');
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState('');

  // Settings states
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [temp2faSecret, setTemp2faSecret] = useState('');
  const [temp2faUrl, setTemp2faUrl] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [disablePwd, setDisablePwd] = useState('');
  const [disableCode, setDisableCode] = useState('');

  // Profile Form States
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileEmail, setEditProfileEmail] = useState('');
  const [editProfilePicIndex, setEditProfilePicIndex] = useState(0);

  // Search / Filters
  const [userSearch, setUserSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Retention cleanup state
  const [cleanupDays, setCleanupDays] = useState('30');

  // Timers and Refs
  const logsConsoleRef = useRef(null);
  const dropdownRef = useRef(null);

  // Helper Headers
  const getMasterHeaders = () => {
    const token = localStorage.getItem('masterToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const masterApiCall = async (endpoint, options = {}) => {
    const headers = { ...options.headers, ...getMasterHeaders() };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    const res = await fetch(endpoint, { ...options, headers });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('masterToken');
        setIsAuthenticated(false);
        throw new Error('Unauthorized master access');
      }
    }
    return res;
  };

  // Check Master Authentication status on mount
  useEffect(() => {
    const checkMasterAuth = async () => {
      const token = localStorage.getItem('masterToken');
      if (!token) return;
      try {
        const res = await fetch('/api/master/stats', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          setIsAuthenticated(true);
          loadDashboardData();
        } else {
          localStorage.removeItem('masterToken');
        }
      } catch {
        localStorage.removeItem('masterToken');
      }
    };
    checkMasterAuth();
  }, []);

  // Poll Statistics and Log list periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadStats = async () => {
      try {
        const res = await masterApiCall('/api/master/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
          setServerUptime(data.uptimeSeconds || 0);
        }
      } catch { }
    };

    loadStats();
    const statsInterval = setInterval(loadStats, 15000);
    return () => clearInterval(statsInterval);
  }, [isAuthenticated]);

  // Live client-side uptime ticker increment
  useEffect(() => {
    if (!isAuthenticated || serverUptime === 0) return;
    const uptimeTimer = setInterval(() => {
      setServerUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(uptimeTimer);
  }, [isAuthenticated, serverUptime]);

  // Fetch lists on Tab changes
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'Overview') {
      fetchRecentLogs();
    } else if (activeTab === 'Users') {
      fetchUsersList();
    } else if (activeTab === 'Licenses') {
      fetchLicensesList();
    } else if (activeTab === 'Blogs') {
      fetchBlogsList();
    } else if (activeTab === 'Logs') {
      fetchLiveLogs();
      const logsPoller = setInterval(fetchLiveLogs, 2500);
      return () => clearInterval(logsPoller);
    } else if (activeTab === 'Settings') {
      fetchMasterProfile();
      fetchConfig();
    }
  }, [activeTab, isAuthenticated]);

  // Auto-scroll logs console
  useEffect(() => {
    if (activeTab === 'Logs' && logsConsoleRef.current) {
      logsConsoleRef.current.scrollTop = logsConsoleRef.current.scrollHeight;
    }
  }, [logsList, activeTab]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Core Data Fetchers
  const loadDashboardData = () => {
    fetchMasterProfile();
    fetchRecentLogs();
    fetchUsersList();
  };

  const fetchUsersList = async () => {
    try {
      const res = await masterApiCall('/api/master/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch { }
  };

  const fetchLicensesList = async () => {
    try {
      const res = await masterApiCall('/api/master/licenses');
      if (res.ok) {
        setLicenses(await res.json());
      }
    } catch { }
  };

  const fetchBlogsList = async () => {
    try {
      const res = await fetch('/api/blogs');
      if (res.ok) {
        setBlogs(await res.json());
      }
    } catch { }
  };

  const fetchRecentLogs = async () => {
    try {
      const res = await masterApiCall('/api/master/logs');
      if (res.ok) {
        const logs = await res.json();
        setLogsList(logs.slice(0, 10)); // Top 10 for overview
      }
    } catch { }
  };

  const fetchLiveLogs = async () => {
    try {
      const res = await masterApiCall('/api/master/logs');
      if (res.ok) {
        setLogsList(await res.json());
      }
    } catch { }
  };

  const fetchConfig = async () => {
    try {
      const res = await masterApiCall('/api/master/config');
      if (res.ok) {
        setServerConfig(await res.json());
      }
    } catch { }
  };

  const fetchMasterProfile = async () => {
    try {
      const res = await masterApiCall('/api/master/profile');
      if (res.ok) {
        const profile = await res.json();
        setMasterProfile(profile);
        setEditProfileName(profile.name || 'Master Admin');
        setEditProfileEmail(profile.email || 'admin@logbook');
        setEditProfilePicIndex(profile.profilePicIndex || 0);
      }
    } catch { }
  };

  // Auth Operations
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      const res = await fetch('/api/master/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });
      const data = await res.json();

      if (res.ok) {
        if (data.requires2FA) {
          setMfaToken(data.mfaToken);
          setRequires2FA(true);
          setMfaCode('');
        } else {
          if (data.token) localStorage.setItem('masterToken', data.token);
          setIsAuthenticated(true);
          loadDashboardData();
        }
      } else {
        setAuthError(data.error || 'Invalid credentials');
      }
    } catch {
      setAuthError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerifySubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      const res = await fetch('/api/master/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code: mfaCode })
      });
      const data = await res.json();

      if (res.ok) {
        if (data.token) localStorage.setItem('masterToken', data.token);
        setIsAuthenticated(true);
        setRequires2FA(false);
        loadDashboardData();
      } else {
        setAuthError(data.error || 'Invalid 2FA code');
      }
    } catch {
      setAuthError('Verification request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('masterToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      await fetch('/api/logout', { method: 'POST', headers }).catch(() => { });
    } catch { }
    localStorage.removeItem('masterToken');
    setIsAuthenticated(false);
    setRequires2FA(false);
    setLoginUser('');
    setLoginPass('');
  };

  // Retention / Cleanup
  const handleRetentionCleanup = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete backups older than ${cleanupDays} days?`)) return;
    try {
      const res = await masterApiCall('/api/master/cleanup', {
        method: 'POST',
        body: JSON.stringify({ daysOld: cleanupDays })
      });
      const data = await res.json();
      alert(data.message || data.error);
    } catch {
      alert('Cleanup failed.');
    }
  };

  // User Actions
  const handleWipeUser = async (userId, userEmail) => {
    if (!window.confirm(`CRITICAL WARNING: This will permanently delete user ${userEmail} and wipe all their remote backups. Proceed?`)) return;
    try {
      const res = await masterApiCall(`/api/master/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsersList();
      }
    } catch {
      alert('Failed to delete user.');
    }
  };

  const handleForceReset2FA = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to disable two-factor authenticator for user ${userEmail}?`)) return;
    try {
      const res = await masterApiCall(`/api/master/users/${encodeURIComponent(userId)}/disable-2fa`, { method: 'POST' });
      if (res.ok) {
        alert(`2FA disabled successfully for ${userEmail}`);
        fetchUsersList();
      }
    } catch {
      alert('Failed to disable user 2FA.');
    }
  };

  const openPlanModal = (user) => {
    setSelectedUser(user);
    setEditPlanType(user.plan || 'unpaid');
    setEditPlanStatus(user.subscriptionStatus || 'none');
    if (user.subscriptionExpiresAt > 0) {
      const date = new Date(user.subscriptionExpiresAt);
      setEditPlanExpiry(date.toISOString().split('T')[0]);
    } else {
      setEditPlanExpiry('');
    }
    setActiveModal('editPlan');
  };

  const handlePlanFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);

    const expiryTime = editPlanExpiry ? new Date(editPlanExpiry).getTime() : 0;
    try {
      const res = await masterApiCall(`/api/master/users/${encodeURIComponent(selectedUser._id)}/plan`, {
        method: 'POST',
        body: JSON.stringify({
          plan: editPlanType,
          subscriptionStatus: editPlanStatus,
          subscriptionExpiresAt: expiryTime
        })
      });
      if (res.ok) {
        setActiveModal(null);
        fetchUsersList();
      }
    } catch {
      alert('Failed to update plan settings.');
    } finally {
      setLoading(false);
    }
  };

  // License actions
  const handleGenerateLicense = async (e) => {
    e.preventDefault();
    if (!licenseeEmail) return;
    setLoading(true);
    setNewlyGeneratedKey('');

    try {
      const res = await masterApiCall('/api/master/licenses/generate', {
        method: 'POST',
        body: JSON.stringify({ licensee: licenseeEmail, durationDays: licenseDuration })
      });
      const data = await res.json();
      if (res.ok) {
        setNewlyGeneratedKey(data.licenseKey);
        setLicenseeEmail('');
        fetchLicensesList();
      } else {
        alert(data.error || 'Failed to generate license key.');
      }
    } catch {
      alert('Generation request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLicense = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this license? This will lock the self-hosted instances using this key.')) return;
    try {
      const res = await masterApiCall(`/api/master/licenses/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLicensesList();
      }
    } catch {
      alert('Failed to revoke license.');
    }
  };

  // Blog Actions
  const openBlogEditModal = (blog = null) => {
    if (blog) {
      setSelectedBlogId(blog._id);
      setBlogTitle(blog.title || '');
      setBlogCategory(blog.category || 'Guides');
      setBlogDate(blog.date || '');
      setBlogImageUrl(blog.imageUrl === '/assets/images/blog_hero.png' ? '' : (blog.imageUrl || ''));
      setBlogExcerpt(blog.excerpt || '');
      setBlogContent(blog.content || '');
    } else {
      setSelectedBlogId('');
      setBlogTitle('');
      setBlogCategory('Guides');
      setBlogDate(new Date().toISOString().split('T')[0]);
      setBlogImageUrl('');
      setBlogExcerpt('');
      setBlogContent('');
    }
    setActiveModal('editBlog');
  };

  const handleBlogFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title: blogTitle,
      category: blogCategory,
      date: blogDate,
      imageUrl: blogImageUrl,
      excerpt: blogExcerpt,
      content: blogContent
    };

    const method = selectedBlogId ? 'PUT' : 'POST';
    const endpoint = selectedBlogId ? `/api/master/blogs/${encodeURIComponent(selectedBlogId)}` : '/api/master/blogs';

    try {
      const res = await masterApiCall(endpoint, {
        method,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setActiveModal(null);
        fetchBlogsList();
      } else {
        let errorMsg = 'Failed to save blog post.';
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch (e) {
          errorMsg = `Server error (${res.status}): ${res.statusText || 'Internal Server Error'}`;
        }
        alert(errorMsg);
      }
    } catch (err) {
      alert(err.message || 'Network request failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlog = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this blog post?')) return;
    try {
      const res = await masterApiCall(`/api/master/blogs/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        fetchBlogsList();
      }
    } catch {
      alert('Failed to delete blog post.');
    }
  };

  // Config Update
  const handleUpdateConfigSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await masterApiCall('/api/master/config', {
        method: 'POST',
        body: JSON.stringify(serverConfig)
      });
      if (res.ok) {
        alert('Server configurations updated successfully!');
        fetchConfig();
      }
    } catch {
      alert('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  // Profile Updates
  const handleProfileUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await masterApiCall('/api/master/profile', {
        method: 'POST',
        body: JSON.stringify({
          name: editProfileName,
          email: editProfileEmail,
          profilePicIndex: editProfilePicIndex
        })
      });
      if (res.ok) {
        setActionSuccess('Profile updated successfully.');
        fetchMasterProfile();
        setTimeout(() => setActiveModal(null), 1200);
      } else {
        setActionError('Failed to save profile changes.');
      }
    } catch {
      setActionError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setActionError('New passwords do not match.');
      return;
    }
    if (newPwd.length < 8) {
      setActionError('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await masterApiCall('/api/master/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: currentPwd,
          newPassword: newPwd
        })
      });
      if (res.ok) {
        setActionSuccess('Password modified successfully.');
        setCurrentPwd('');
        setNewPwd('');
        setConfirmPwd('');
        setTimeout(() => setActiveModal(null), 1200);
      } else {
        const data = await res.json();
        setActionError(data.error || 'Password update failed.');
      }
    } catch {
      setActionError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  // TOTP MFA setup
  const handleStart2faSetup = async () => {
    try {
      const res = await masterApiCall('/api/master/2fa/setup', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTemp2faSecret(data.secret);
        setTemp2faUrl(data.otpauthUrl);
        setSetupCode('');
        setDisablePwd('');
        setDisableCode('');
        setActiveModal('mfaSetup');
      }
    } catch {
      alert('Failed to initialize 2FA setup.');
    }
  };

  const handleConfirm2faSetupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await masterApiCall('/api/master/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ code: setupCode })
      });
      if (res.ok) {
        alert('2FA enabled successfully!');
        setActiveModal(null);
        fetchMasterProfile();
      } else {
        const data = await res.json();
        alert(data.error || 'Verification code incorrect.');
      }
    } catch {
      alert('Verification request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2faSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await masterApiCall('/api/master/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ password: disablePwd, code: disableCode })
      });
      if (res.ok) {
        alert('2FA disabled successfully.');
        setActiveModal(null);
        fetchMasterProfile();
      } else {
        const data = await res.json();
        alert(data.error || 'Disable request rejected.');
      }
    } catch {
      alert('Disabling request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRebootServer = async () => {
    setLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await masterApiCall('/api/master/reboot', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(data.message || 'Server reboot command sent successfully. Reconnecting in 5 seconds...');
        setTimeout(() => {
          localStorage.removeItem('masterToken');
          setIsAuthenticated(false);
          setActiveModal(null);
          window.location.reload();
        }, 5000);
      } else {
        setActionError(data.error || 'Reboot request rejected.');
      }
    } catch (err) {
      setActionError('Failed to send reboot request. Server might already be restarting.');
    } finally {
      setLoading(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Uptime formatting
  const formatUptimeDisplay = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Default fallback avatars
  const AVATARS = [
    { icon: 'fas fa-user-astronaut', color: '#6c5ce7' },
    { icon: 'fas fa-cat', color: '#e17055' },
    { icon: 'fas fa-dog', color: '#6ab04c' },
    { icon: 'fas fa-robot', color: '#0984e3' },
    { icon: 'fas fa-user-ninja', color: '#2d3436' },
    { icon: 'fas fa-feather-alt', color: '#a29bfe' },
    { icon: 'fas fa-crown', color: '#fdcb6e' },
    { icon: 'fas fa-cloud-sun', color: '#00b894' },
    { icon: 'fas fa-music', color: '#e84393' },
  ];

  const renderMasterAvatar = (index, size = "w-8 h-8") => {
    const av = AVATARS[index % AVATARS.length];
    return (
      <div
        className={`${size} rounded-full flex items-center justify-center`}
        style={{ backgroundColor: `${av.color}15`, border: `1px solid ${av.color}33` }}
      >
        <i className={`${av.icon} text-sm`} style={{ color: av.color }}></i>
      </div>
    );
  };

  // Filtered lists
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
    u._id.toLowerCase().includes(userSearch.toLowerCase())
  );

  // --- RENDER LOGIN IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <div className="py-24 max-w-md mx-auto px-4 min-h-fit">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-unified space-y-6 relative overflow-hidden bg-zinc-950"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-accent-purple border border-purple-500/20">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Master Control Login</h2>
              <p className="text-sm text-zinc-500 mt-1">Authenticate administrative credentials</p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-semibold text-center">
              {authError}
            </div>
          )}

          {!requires2FA ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-500 uppercase block pl-1">Master Username</label>
                <input
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="admin"
                  className="input-unified"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-500 uppercase block pl-1">Master Password</label>
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="input-unified"
                  required
                />
              </div>
              <div className='space-y-1.5'></div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary-unified"
              >
                {loading ? 'Authenticating...' : 'Sign In as Master'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaVerifySubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-500 uppercase block text-center">
                  Enter 2FA Code
                </label>
                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  pattern="[0-9]{6}"
                  placeholder="000000"
                  className="input-unified text-lg font-bold text-center tracking-[0.2em]"
                  required
                />
              </div>
              <div className='space-y-1.5'></div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary-unified"
              >
                {loading ? 'Verifying...' : 'Verify Authenticator'}
              </button>

              <button
                type="button"
                onClick={() => setRequires2FA(false)}
                className="w-full text-center text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </form>
          )}

          <div className="text-center pt-2">
            <a
              href={window.location.hostname.startsWith('master.') ? window.location.protocol + '//' + window.location.host.replace('master.', '') : '/'}
              className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              ← Back to main site
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- MAIN MASTER DASHBOARD VIEW ---
  return (
    <div className="py-12 md:py-20 max-w-auto mx-auto px-20 relative flex flex-col md:flex-row gap-8">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div className="card-unified bg-zinc-950 p-4 space-y-4 border border-white/5">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Shield className="w-6 h-6 text-accent-purple" />
            <div className="text-left">
              <h3 className="font-bold text-white text-lg">Master Control</h3>
              <p className="text-[13px] text-zinc-500 uppercase tracking-widest">Administrator</p>
            </div>
          </div>

          <nav className="space-y-1 flex flex-col">
            {[
              { name: 'Overview', icon: Server },
              { name: 'Users', icon: Users },
              { name: 'Licenses', icon: Key },
              { name: 'Blogs', icon: BookOpen },
              { name: 'Logs', icon: Terminal },
              { name: 'Settings', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.name;
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all text-left cursor-pointer ${isActive
                    ? 'bg-gradient-to-r from-accent-blue/15 to-accent-purple/15 border border-accent-purple/30 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-accent-purple' : 'text-zinc-500'}`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/5 pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow space-y-6 min-h-[500px]">
        {/* HEADER TOP BAR */}
        <header className="flex justify-between items-center bg-zinc-950 p-4 rounded-2xl border border-white/5">
          <div className="text-left">
            <h2 className="text-lg font-bold text-white">{activeTab} Panel</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">Server configuration: Online</p>
          </div>

          {/* Master Profile Icon */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {renderMasterAvatar(masterProfile.profilePicIndex, "w-6 h-6")}
              <span className="text-xs font-semibold text-white">{masterProfile.name}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            <AnimatePresence>
              {profileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-52 rounded-xl bg-zinc-950 border border-white/10 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-30 text-left space-y-1"
                >
                  <div className="px-3 py-2 bg-white/2 rounded-lg mb-1">
                    <p className="text-xs font-bold text-white truncate">{masterProfile.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{masterProfile.email}</p>
                  </div>
                  <button
                    onClick={() => { setActiveModal('editProfile'); setProfileDropdownOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <User className="w-4 h-4" />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => { setActiveModal('changePwd'); setProfileDropdownOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <Key className="w-4 h-4" />
                    Change Password
                  </button>
                  <button
                    onClick={() => {
                      if (masterProfile.twoFactorEnabled) {
                        setDisablePwd('');
                        setDisableCode('');
                        setActiveModal('disableMfa');
                      } else {
                        handleStart2faSetup();
                      }
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Master 2FA Settings
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* TAB CONTENTS */}
        <AnimatePresence mode="wait">
          {activeTab === 'Overview' && (
            <motion.div
              key="Overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card-unified bg-zinc-950/50 p-4 border border-white/5">
                  <span className="text-[14px] font-bold text-zinc-500 uppercase tracking-wider block">Registered Users</span>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-2xl font-extrabold text-white">{stats.totalUsers || 0}</span>
                    <Users className="w-5 h-5 text-accent-blue" />
                  </div>
                </div>
                <div className="card-unified bg-zinc-950/50 p-4 border border-white/5">
                  <span className="text-[14px] font-bold text-zinc-500 uppercase tracking-wider block">Total Disk Storage</span>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-2xl font-extrabold text-white">{parseFloat(stats.totalStorageMB || 0).toFixed(1)} MB</span>
                    <Cloud className="w-5 h-5 text-accent-purple" />
                  </div>
                </div>
                <div className="card-unified bg-zinc-950/50 p-4 border border-white/5">
                  <span className="text-[14px] font-bold text-zinc-500 uppercase tracking-wider block">Uptime Server Clock</span>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-2xl font-extrabold text-white font-mono">{formatUptimeDisplay(serverUptime)}</span>
                    <Clock className="w-5 h-5 text-accent-cyan animate-pulse" />
                  </div>
                </div>
                <div className="card-unified bg-zinc-950/50 p-4 border border-white/5">
                  <span className="text-[14px] font-bold text-zinc-500 uppercase tracking-wider block">Server Master User</span>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-2xl font-extrabold text-white truncate max-w-[140px]" title={stats.masterUser}>{stats.masterUser}</span>
                    <Shield className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
              </div>

              {/* Server Logs and Actions layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent events logs */}
                <div className="lg:col-span-2 card-unified bg-zinc-950/50 border border-white/5 p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Server Events</h3>
                    <button
                      onClick={fetchRecentLogs}
                      className="p-1 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="text-zinc-500 border-b border-white/5 pb-2">
                          <th className="py-2">Level</th>
                          <th className="py-2">Message</th>
                          <th className="py-2 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logsList.map((log, idx) => (
                          <tr key={log._id || idx} className="border-b border-white/2 hover:bg-white/2 transition">
                            <td className="py-2.5 font-bold uppercase">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.level === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                log.level === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  'bg-blue-500/10 text-accent-blue border border-blue-500/20'
                                }`}>
                                {log.level}
                              </span>
                            </td>
                            <td className="py-2.5 text-zinc-300 max-w-xs truncate" title={log.message}>{log.message}</td>
                            <td className="py-2.5 text-zinc-500 text-right font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* System Actions */}
                <div className="card-unified bg-zinc-950/50 border border-white/5 p-4 space-y-4 h-fit">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">System Actions</h3>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-zinc-500 uppercase block pl-1">Backups Retention policy</label>
                      <div className="flex gap-2">
                        <select
                          value={cleanupDays}
                          onChange={(e) => setCleanupDays(e.target.value)}
                          className="select-unified flex-grow py-2 text-sm bg-zinc-900"
                        >
                          <option value="7">7 Days old</option>
                          <option value="15">15 Days old</option>
                          <option value="30">30 Days old</option>
                          <option value="90">90 Days old</option>
                        </select>
                        <button
                          onClick={handleRetentionCleanup}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl border border-red-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Prune
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Users' && (
            <motion.div
              key="Users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card-unified bg-zinc-950/50 border border-white/5 p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
                <h3 className="text-md font-bold text-white uppercase tracking-wider">User Account Management</h3>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by Username, Email, ID..."
                  className="input-unified py-1.5 px-3 text-sm max-w-xs"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-zinc-500 border-b border-white/5 pb-2">
                      <th className="py-2.5">User Identity</th>
                      <th className="py-2.5">User ID</th>
                      <th className="py-2.5">Billing Plan</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user._id} className="border-b border-white/2 hover:bg-white/2 transition">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white uppercase">
                              {user.name ? user.name.charAt(0) : user.username.charAt(0)}
                            </div>
                            <div className="text-left">
                              <p className="font-semibold text-white flex items-center gap-1.5">
                                {user.name || 'N/A'}
                                {user.twoFactorEnabled && <Shield className="w-4 h-4 text-accent-purple" title="2FA Enabled" />}
                              </p>
                              <p className="text-sm text-zinc-500">{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-zinc-400">{user._id}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[12px] font-semibold uppercase ${user.plan === 'premium' || user.plan === 'licensed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-white/5'
                            }`}>
                            {user.plan || 'unpaid'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {user.twoFactorEnabled && (
                              <button
                                onClick={() => handleForceReset2FA(user._id, user.username)}
                                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold rounded-lg border border-amber-500/20 transition-all cursor-pointer flex items-center gap-1"
                              >
                                Reset 2FA
                              </button>
                            )}
                            <button
                              onClick={() => openPlanModal(user)}
                              className="px-2.5 py-1.5 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue font-semibold rounded-lg border border-accent-blue/20 transition-all cursor-pointer flex items-center gap-1"
                            >
                              Edit Plan
                            </button>
                            <button
                              onClick={() => handleWipeUser(user._id, user.username)}
                              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-lg border border-red-500/20 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Wipe
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'Licenses' && (
            <motion.div
              key="Licenses"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Generate form */}
              <div className="card-unified bg-zinc-950/50 border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Generate Self-Hosted JWT Key</h3>

                <form onSubmit={handleGenerateLicense} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-1.5 flex-grow text-left">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase block pl-1">Licensee Email address</label>
                    <input
                      type="email"
                      value={licenseeEmail}
                      onChange={(e) => setLicenseeEmail(e.target.value)}
                      placeholder="licensee@example.com"
                      className="input-unified py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 w-full sm:w-44 text-left">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase block pl-1">Validity Period</label>
                    <select
                      value={licenseDuration}
                      onChange={(e) => setLicenseDuration(e.target.value)}
                      className="select-unified py-2"
                    >
                      <option value="30">30 Days</option>
                      <option value="90">90 Days</option>
                      <option value="365">1 Year (365 Days)</option>
                      <option value="3650">Lifetime (10 Years)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto btn-primary-unified py-2.5 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Generate Key
                  </button>
                </form>

                {newlyGeneratedKey && (
                  <div className="p-4 rounded-xl border border-accent-purple/20 bg-accent-purple/5 space-y-2 text-left">
                    <p className="text-[10px] font-bold text-accent-purple uppercase tracking-wider">Key Generated Successfully:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newlyGeneratedKey}
                        readOnly
                        className="input-unified flex-grow font-mono text-[10px] py-1 bg-zinc-950 border-white/5"
                      />
                      <button
                        onClick={() => copyToClipboard(newlyGeneratedKey)}
                        className="px-3 bg-zinc-900 border border-white/10 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs"
                      >
                        {copiedKey === newlyGeneratedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Licenses List */}
              <div className="card-unified bg-zinc-950/50 border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Issued Self-Hosted License Keys</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-zinc-500 border-b border-white/5 pb-2">
                        <th className="py-2.5">Licensee</th>
                        <th className="py-2.5">Expires</th>
                        <th className="py-2.5">Key Hash</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {licenses.map((lic) => {
                        const isExpired = Date.now() > lic.expiresAt;
                        return (
                          <tr key={lic._id} className="border-b border-white/2 hover:bg-white/2 transition">
                            <td className="py-3 text-left font-semibold text-white">{lic.licensee}</td>
                            <td className="py-3">
                              <span className={`font-semibold ${isExpired ? 'text-red-400' : 'text-zinc-300'}`}>
                                {new Date(lic.expiresAt).toLocaleDateString()}
                              </span>
                              {isExpired && <span className="text-[8px] uppercase tracking-wider text-red-500 border border-red-500/20 bg-red-500/5 px-1 ml-1.5 rounded">EXPIRED</span>}
                            </td>
                            <td className="py-3 font-mono text-[11px] text-zinc-500 truncate max-w-[120px]">{lic.licenseKey}</td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => copyToClipboard(lic.licenseKey)}
                                  className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-lg border border-white/5 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  {copiedKey === lic.licenseKey ? 'Copied!' : 'Copy Key'}
                                </button>
                                <button
                                  onClick={() => handleRevokeLicense(lic._id)}
                                  className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-lg border border-red-500/20 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  Revoke
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Blogs' && (
            <motion.div
              key="Blogs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card-unified bg-zinc-950/50 border border-white/5 p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Manage Blog Posts</h3>
                <button
                  onClick={() => openBlogEditModal(null)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-accent-blue to-accent-purple text-white text-sm font-semibold rounded-lg transition-all hover:opacity-95 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Post
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-zinc-500 border-b border-white/5 pb-2">
                      <th className="py-2.5">Title / Metadata</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogs.map((blog) => (
                      <tr key={blog._id} className="border-b border-white/2 hover:bg-white/2 transition">
                        <td className="py-3 text-left">
                          <p className="font-semibold text-white truncate text-lg max-w-md">{blog.title}</p>
                          <div className="flex gap-2 items-center mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[12px] bg-accent-blue/15 text-accent-blue border border-accent-blue/20 font-bold uppercase">{blog.category}</span>
                            <span className="font-mono text-zinc-500 text-md overflow-x-auto max-w-xs">{blog.slug}</span>
                          </div>
                        </td>
                        <td className="py-3 text-zinc-300">{blog.date}</td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openBlogEditModal(blog)}
                              className="px-2.5 py-1.5 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue font-semibold rounded-lg border border-accent-blue/20 transition-all cursor-pointer flex items-center gap-1"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBlog(blog._id)}
                              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-lg border border-red-500/20 transition-all cursor-pointer flex items-center gap-1"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'Logs' && (
            <motion.div
              key="Logs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card-unified bg-zinc-950/50 border border-white/5 p-6 space-y-4 text-left"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-accent-purple" />
                  Live Server Console Logs
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>

              <div
                ref={logsConsoleRef}
                className="h-[450px] bg-black/80 rounded-xl border border-white/10 p-4 overflow-y-auto font-mono text-[14px] leading-relaxed text-zinc-300 space-y-1"
              >
                {logsList.map((log, idx) => (
                  <div key={log._id || idx} className="hover:bg-white/5 p-0.5 rounded transition">
                    <span className="text-zinc-500">[{new Date(log.timestamp).toISOString()}]</span>{' '}
                    <span className={`uppercase font-bold ${log.level === 'critical' ? 'text-red-400' :
                      log.level === 'warning' ? 'text-amber-400' :
                        'text-accent-blue'
                      }`}>
                      [{log.level}]
                    </span>{' '}
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'Settings' && (
            <motion.div
              key="Settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
            >
              {/* Server Config card */}
              <div className="card-unified bg-zinc-950/50 border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Server Core Configuration</h3>

                <form onSubmit={handleUpdateConfigSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase block pl-1">Quota Backup Size Limit (MB)</label>
                    <input
                      type="number"
                      value={Math.floor(serverConfig.quotaLimit / (1024 * 1024))}
                      onChange={(e) => setServerConfig({ ...serverConfig, quotaLimit: parseInt(e.target.value) * 1024 * 1024 })}
                      className="input-unified"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-white/5">
                    <div className="text-left">
                      <span className="text-md font-semibold text-white block">Enable Public Signups</span>
                      <span className="text-[14px] text-zinc-500 mt-0.5">Toggle new account registrations</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={serverConfig.signupsEnabled !== false}
                        onChange={(e) => setServerConfig({ ...serverConfig, signupsEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-purple peer-checked:after:bg-white"></div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary-unified"
                  >
                    Save Configuration
                  </button>
                </form>
              </div>

              {/* Master 2FA status card */}
              <div className="card-unified bg-zinc-950/50 border border-white/5 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Master Admin 2FA</h3>

                {masterProfile.twoFactorEnabled ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs flex items-center gap-3">
                      <Shield className="w-7 h-7 flex-shrink-0 animate-bounce" />

                      <div>
                        <p className="font-bold text-[16px] pb-2">2FA Authenticator Active</p>

                        <p className="text-[13.5px] text-zinc-500 mt-0.5">Your administrative account is protected with TOTP validation.</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveModal('disableMfa')}
                      className="w-full btn-danger-unified py-2 text-sm"

                    >
                      <Shield className="w-5 h-5 flex-shrink-0 animate-pulse" />
                      Disable 2FA Authenticator
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="font-bold">2FA is currently Disabled</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Enable two-factor authentication to secure server control access.</p>
                      </div>
                    </div>

                    <button
                      onClick={handleStart2faSetup}
                      className="w-full btn-primary-unified py-2 text-xs"
                    >
                      Configure 2FA Setup
                    </button>
                  </div>
                )}
              </div>

              {/* Server System Control card */}
              <div className="card-unified bg-zinc-950/50 border border-white/5 p-6 space-y-4 col-span-1 md:col-span-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Server Maintenance & System Control</h3>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="text-left space-y-1">
                    <span className="text-md font-semibold text-white flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-red-500" />
                      Reboot Application Server
                    </span>
                    <span className="text-sm text-zinc-500 block">
                      Gracefully restarts the Node.js server process. If managed by systemd, PM2, or Docker, it will automatically spin up.
                    </span>
                  </div>
                  <button
                    onClick={() => { setActiveModal('rebootServer'); setActionError(''); setActionSuccess(''); }}
                    className="w-full sm:w-auto btn-danger-unified py-2 text-sm flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reboot Server
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ALL MODALS RENDER */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md card-unified space-y-5 relative overflow-hidden bg-zinc-950 text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/2 to-transparent pointer-events-none" />

              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {activeModal === 'editPlan' && 'Edit User Plan'}
                  {activeModal === 'editBlog' && (selectedBlogId ? 'Edit Blog Post' : 'Create Blog Post')}
                  {activeModal === 'editProfile' && 'Edit Master Profile'}
                  {activeModal === 'changePwd' && 'Change Master Password'}
                  {activeModal === 'mfaSetup' && 'Configure 2FA Authenticator'}
                  {activeModal === 'disableMfa' && 'Disable 2FA Authenticator'}
                  {activeModal === 'rebootServer' && 'Reboot Application Server'}
                </h3>
                <button
                  onClick={() => { setActiveModal(null); setActionError(''); setActionSuccess(''); }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
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

              {/* EDIT PLAN MODAL CONTENT */}
              {activeModal === 'editPlan' && selectedUser && (
                <form onSubmit={handlePlanFormSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">User Email</label>
                    <input
                      type="text"
                      value={selectedUser.username}
                      readOnly
                      className="input-unified bg-zinc-900 border-white/5 text-zinc-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">Billing Plan Type</label>
                    <select
                      value={editPlanType}
                      onChange={(e) => setEditPlanType(e.target.value)}
                      className="select-unified"
                    >
                      <option value="unpaid">Unpaid / Free Trial</option>
                      <option value="premium">Monthly Premium</option>
                      <option value="licensed">Self-Hosted License</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">Subscription Status</label>
                    <select
                      value={editPlanStatus}
                      onChange={(e) => setEditPlanStatus(e.target.value)}
                      className="select-unified"
                    >
                      <option value="none">None / Idle</option>
                      <option value="active">Active</option>
                      <option value="canceled">Canceled</option>
                      <option value="past_due">Past Due</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">Plan Expiry Date</label>
                    <input
                      type="date"
                      value={editPlanExpiry}
                      onChange={(e) => setEditPlanExpiry(e.target.value)}
                      className="input-unified"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary-unified"
                  >
                    Save Plan Changes
                  </button>
                </form>
              )}

              {/* EDIT BLOG POST MODAL CONTENT */}
              {activeModal === 'editBlog' && (
                <form onSubmit={handleBlogFormSubmit} className="space-y-4 overflow-y-auto max-h-[75vh] pr-1">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-500 uppercase block pl-1">Blog Title</label>
                    <input
                      type="text"
                      value={blogTitle}
                      onChange={(e) => setBlogTitle(e.target.value)}
                      placeholder="My blog post title"
                      className="input-unified"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-zinc-500 uppercase block pl-1">Category</label>
                      <select
                        value={blogCategory}
                        onChange={(e) => setBlogCategory(e.target.value)}
                        className="select-unified"
                      >
                        <option value="Guides">Guides</option>
                        <option value="Product">Product Updates</option>
                        <option value="Security">Security</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-zinc-500 uppercase block pl-1">Date</label>
                      <input
                        type="date"
                        value={blogDate}
                        onChange={(e) => setBlogDate(e.target.value)}
                        onClick={(e) => {
                          try { e.target.showPicker(); } catch (err) { }
                        }}
                        className="input-unified cursor-pointer"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-500 uppercase block pl-1">Cover Image URL (Optional)</label>
                    <input
                      type="text"
                      value={blogImageUrl}
                      onChange={(e) => setBlogImageUrl(e.target.value)}
                      placeholder="Leave blank for default"
                      className="input-unified text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-500 uppercase block pl-1">Short Excerpt</label>
                    <input
                      type="text"
                      value={blogExcerpt}
                      onChange={(e) => setBlogExcerpt(e.target.value)}
                      placeholder="Brief post description..."
                      className="input-unified text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-500 uppercase block pl-1">Markdown Content</label>
                    <textarea
                      value={blogContent}
                      onChange={(e) => setBlogContent(e.target.value)}
                      placeholder="Post markdown content here..."
                      className="textarea-unified h-40"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary-unified"
                  >
                    Publish Post
                  </button>
                </form>
              )}

              {/* EDIT MASTER PROFILE MODAL CONTENT */}
              {activeModal === 'editProfile' && (
                <form onSubmit={handleProfileUpdateSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[13.5px] font-bold text-zinc-500 uppercase block pl-1">Admin Display Name</label>
                    <input
                      type="text"
                      value={editProfileName}
                      onChange={(e) => setEditProfileName(e.target.value)}
                      className="input-unified"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13.5px] font-bold text-zinc-500 uppercase block pl-1">Contact Email</label>
                    <input
                      type="email"
                      value={editProfileEmail}
                      onChange={(e) => setEditProfileEmail(e.target.value)}
                      className="input-unified"
                      required
                    />
                  </div>

                  {/* Avatar Index Grid Selector */}
                  <div className="space-y-2">
                    <label className="text-[13.5px] font-bold text-zinc-500 uppercase block pl-1">Admin Profile Icon</label>
                    <div className="grid grid-cols-5 gap-2 bg-zinc-900 p-2.5 rounded-xl border border-white/5">
                      {AVATARS.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditProfilePicIndex(idx)}
                          className={`flex items-center justify-center p-2.5 rounded-lg border-2 cursor-pointer transition-all ${editProfilePicIndex === idx ? 'border-accent-purple bg-purple-500/10' : 'border-transparent hover:bg-white/5'
                            }`}
                        >
                          <i className={`${av.icon} text-lg`} style={{ color: av.color }}></i>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary-unified"
                  >
                    Save Changes
                  </button>
                </form>
              )}

              {/* CHANGE PASSWORD MODAL CONTENT */}
              {activeModal === 'changePwd' && (
                <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">Current Password</label>
                    <input
                      type="password"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      className="input-unified"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">New Password</label>
                    <input
                      type="password"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      className="input-unified"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPwd}
                      onChange={(e) => setConfirmPwd(e.target.value)}
                      className="input-unified"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary-unified"
                  >
                    Modify Master Password
                  </button>
                </form>
              )}

              {/* 2FA SETUP MODAL CONTENT */}
              {activeModal === 'mfaSetup' && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(temp2faUrl)}`}
                      alt="TOTP QR Code"
                      className="bg-white p-2 rounded-lg border border-white/10"
                    />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Secret Setup Key:</p>
                      <p className="text-xs font-mono font-bold text-white tracking-widest mt-0.5">{temp2faSecret}</p>
                    </div>
                  </div>

                  <form onSubmit={handleConfirm2faSetupSubmit} className="space-y-3.5 border-t border-white/5 pt-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1 text-center">Verify Verification Code</label>
                      <input
                        type="text"
                        value={setupCode}
                        onChange={(e) => setSetupCode(e.target.value)}
                        pattern="[0-9]{6}"
                        placeholder="000000"
                        className="input-unified text-center tracking-[0.2em] font-bold text-sm"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary-unified"
                    >
                      Enable Authenticator
                    </button>
                  </form>
                </div>
              )}

              {/* 2FA DISABLE MODAL CONTENT */}
              {activeModal === 'disableMfa' && (
                <form onSubmit={handleDisable2faSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">Confirm Master Password</label>
                    <input
                      type="password"
                      value={disablePwd}
                      onChange={(e) => setDisablePwd(e.target.value)}
                      className="input-unified"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">6-Digit Authenticator Code</label>
                    <input
                      type="text"
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value)}
                      pattern="[0-9]{6}"
                      placeholder="000000"
                      className="input-unified text-center tracking-[0.2em] font-bold text-sm"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-danger-unified"
                  >
                    Confirm Disable 2FA
                  </button>
                </form>
              )}

              {/* REBOOT SERVER MODAL CONTENT */}
              {activeModal === 'rebootServer' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
                    <div>
                      <p className="font-bold">Are you absolutely sure?</p>
                      <p className="text-[11.5px] text-zinc-400 mt-0.5">
                        This action will immediately terminate the active Node.js server process and initiate a reboot.
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400">
                    If configured under a process manager like PM2 or Systemd, the server will restart automatically in a few seconds. If not, manual server startup may be required.
                  </p>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="btn-secondary-unified px-4 py-2 text-xs cursor-pointer"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleRebootServer}
                      className="btn-danger-unified px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
                      disabled={loading}
                    >
                      {loading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      Reboot Server
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
