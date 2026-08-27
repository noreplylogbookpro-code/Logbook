import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Server, Cloud, FolderOpen, Calendar, Trash2,
  User, Key, ShieldAlert, CreditCard, LogOut, ChevronDown,
  Terminal, Settings, Users, Activity, Plus, Copy, Check, X,
  BookOpen, Clock, RefreshCw, AlertTriangle, Menu, Sun, Moon,
  Download, Upload, HardDrive, FileCheck, FolderArchive, ChevronRight, Info, Search, Filter,
  Cpu, Wifi, ArrowDown, ArrowUp, Maximize2, Minimize2, ScrollText
} from 'lucide-react';
import CustomSelect from './DropdownMenu';

export default function MasterView({ onNavigate, theme, toggleTheme }) {
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dashboard Data states
  const [stats, setStats] = useState({ totalUsers: 0, totalStorageMB: 0, uptimeSeconds: 0, masterUser: 'admin' });
  const [networkHistory, setNetworkHistory] = useState([]);
  const [networkGraphExpanded, setNetworkGraphExpanded] = useState(false);
  const [serverUptime, setServerUptime] = useState(0);
  const [users, setUsers] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [changelogs, setChangelogs] = useState([]);
  const [logsList, setLogsList] = useState([]);
  const [serverConfig, setServerConfig] = useState({ quotaLimit: 240 * 1024 * 1024, signupsEnabled: true });
  const [masterProfile, setMasterProfile] = useState({ name: 'Master Admin', email: 'admin@logbook', profilePicIndex: 0, twoFactorEnabled: false });

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'editPlan' | 'editBlog' | 'mfaSetup' | 'editProfile' | 'changePwd'
  const [selectedUser, setSelectedUser] = useState(null);
  const [editPlanType, setEditPlanType] = useState('premium');
  const [editPlanStatus, setEditPlanStatus] = useState('active');
  const [editPlanExpiry, setEditPlanExpiry] = useState('');

  // Super User Password Reset modal states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const openResetPasswordModal = (user) => {
    setResetTargetUser(user);
    setNewPasswordVal('');
    setResetSuccessMsg('');
    setResetErrorMsg('');
    setResetModalOpen(true);
  };

  const handleExecutePasswordReset = async (e) => {
    e.preventDefault();
    if (!newPasswordVal || !newPasswordVal.trim()) {
      setResetErrorMsg('Please enter a new valid password.');
      return;
    }
    setResetSubmitting(true);
    setResetSuccessMsg('');
    setResetErrorMsg('');

    try {
      const res = await masterApiCall('/api/master/users/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          username: resetTargetUser.username,
          newPassword: newPasswordVal.trim(),
          school: resetTargetUser.school || resetTargetUser.source || 'NHSST'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetSuccessMsg(`Password for @${resetTargetUser.username} updated & encrypted with bcrypt!`);
        setTimeout(() => {
          setResetModalOpen(false);
        }, 1800);
      } else {
        setResetErrorMsg(data.error || 'Failed to reset user password.');
      }
    } catch (err) {
      setResetErrorMsg('Connection error resetting user password.');
    } finally {
      setResetSubmitting(false);
    }
  };

  // Blog Form states
  const [selectedBlogId, setSelectedBlogId] = useState('');
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('Guides');
  const [blogDate, setBlogDate] = useState('');
  const [blogImageUrl, setBlogImageUrl] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');

  // Changelog Form states
  const [selectedChangelogId, setSelectedChangelogId] = useState('');
  const [changelogVersion, setChangelogVersion] = useState('');
  const [changelogDate, setChangelogDate] = useState('');
  const [changelogDescription, setChangelogDescription] = useState('');
  const [changelogItemsText, setChangelogItemsText] = useState('');
  const [changelogIsMajor, setChangelogIsMajor] = useState(false);

  // License Form states
  const [licenseeEmail, setLicenseeEmail] = useState('');
  const [licenseDuration, setLicenseDuration] = useState('365');
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState('');
  const [extendingLicense, setExtendingLicense] = useState(null);
  const [extendDurationDays, setExtendDurationDays] = useState('365');

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
  const [userStatusFilter, setUserStatusFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'OFFLINE'
  const [copiedKey, setCopiedKey] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Retention cleanup state
  const [cleanupDays, setCleanupDays] = useState('30');

  // Backup export/import states
  const [backupFiles, setBackupFiles] = useState([]); // categorized file list from server scan
  const [selectedExportFiles, setSelectedExportFiles] = useState(new Set());
  const [backupExporting, setBackupExporting] = useState(false);
  const [backupImporting, setBackupImporting] = useState(false);
  const [backupScanning, setBackupScanning] = useState(false);
  const [importPreview, setImportPreview] = useState(null); // manifest data from uploaded .bak
  const [selectedImportFiles, setSelectedImportFiles] = useState(new Set());
  const [backupResult, setBackupResult] = useState(null); // { type: 'success'|'error', message }
  const [importFile, setImportFile] = useState(null); // File object for import
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedImportCategories, setExpandedImportCategories] = useState(new Set());
  const importFileRef = useRef(null);

  // Self Host subscriptions state
  const [selfHostSubscriptions, setSelfHostSubscriptions] = useState([]);
  const [selfHostLoading, setSelfHostLoading] = useState(false);

  // Logs Search & Filter state
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState('ALL');
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);

  // Timers and Refs
  const logsConsoleRef = useRef(null);
  const dropdownRef = useRef(null);

  // Helper Headers
  const getMasterHeaders = () => {
    const token = localStorage.getItem('masterToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const masterApiCall = async (endpoint, options = {}, bodyPayload = null) => {
    let opts = typeof options === 'string' ? { method: options } : { ...options };
    if (bodyPayload && typeof options === 'string') {
      opts.body = typeof bodyPayload === 'object' && !(bodyPayload instanceof FormData)
        ? JSON.stringify(bodyPayload)
        : bodyPayload;
    }
    const headers = { ...opts.headers, ...getMasterHeaders() };
    if (opts.body && !(opts.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    const res = await fetch(endpoint, { ...opts, headers });
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
          setStats(prev => ({ ...prev, ...data }));
          setServerUptime(data.uptimeSeconds || 0);

          if (data.network) {
            setNetworkHistory(prev => {
              const next = [...prev, {
                rx: data.network.rxMB || 0,
                tx: data.network.txMB || 0,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              }];
              return next.slice(-20);
            });
          }
        }
      } catch { }
    };

    loadStats();
    const statsInterval = setInterval(loadStats, 3000);
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
      fetchConfig();
      const overviewPoller = setInterval(fetchConfig, 3000);
      return () => clearInterval(overviewPoller);
    } else if (activeTab === 'Users') {
      fetchUsersList();
      const usersPoller = setInterval(fetchUsersList, 4000);
      return () => clearInterval(usersPoller);
    } else if (activeTab === 'Licenses') {
      fetchLicensesList();
    } else if (activeTab === 'Blogs') {
      fetchBlogsList();
    } else if (activeTab === 'Changelogs') {
      fetchChangelogsList();
    } else if (activeTab === 'Logs') {
      fetchLiveLogs();
      const logsPoller = setInterval(fetchLiveLogs, 2500);
      return () => clearInterval(logsPoller);
    } else if (activeTab === 'Settings') {
      fetchMasterProfile();
      fetchConfig();
    } else if (activeTab === 'Helpdesk' || activeTab === 'Subscriptions' || activeTab === 'Billing') {
      fetchSelfHostSubscriptions();
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

  const filteredUsersList = users.filter(user => {
    const statusMatch = userStatusFilter === 'ALL' ||
      (userStatusFilter === 'ONLINE' && user.isOnline) ||
      (userStatusFilter === 'OFFLINE' && !user.isOnline);
    if (!statusMatch) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase().trim();
    return (
      (user.username || '').toLowerCase().includes(q) ||
      (user.name || '').toLowerCase().includes(q) ||
      (user.school || '').toLowerCase().includes(q) ||
      (user._id || '').toString().toLowerCase().includes(q)
    );
  });

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

  const fetchChangelogsList = async () => {
    try {
      const res = await fetch('/api/changelogs');
      if (res.ok) {
        setChangelogs(await res.json());
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

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all server logs?')) return;
    try {
      const res = await masterApiCall('/api/master/logs/clear', { method: 'POST' });
      if (res.ok) {
        setLogsList([]);
      }
    } catch (e) {
      alert('Failed to clear logs.');
    }
  };

  const filteredLogs = logsList.filter(log => {
    const levelMatch = logLevelFilter === 'ALL' || (log.level || '').toLowerCase() === logLevelFilter.toLowerCase();
    if (!levelMatch) return false;
    if (!logSearchQuery.trim()) return true;
    const q = logSearchQuery.toLowerCase().trim();
    const msgMatch = (log.message || '').toLowerCase().includes(q);
    const urlMatch = (log.metadata?.url || '').toLowerCase().includes(q);
    const ipMatch = (log.metadata?.ip || '').toLowerCase().includes(q);
    const levelTextMatch = (log.level || '').toLowerCase().includes(q);
    return msgMatch || urlMatch || ipMatch || levelTextMatch;
  });

  const fetchConfig = async () => {
    try {
      const res = await masterApiCall('/api/master/config');
      if (res.ok) {
        const data = await res.json();
        setStats(prev => ({ ...prev, ...data }));
        setServerConfig(prev => ({ ...prev, ...data }));
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

  const fetchSelfHostSubscriptions = async () => {
    try {
      setSelfHostLoading(true);
      const res = await masterApiCall('/api/v1/master/subscriptions');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSelfHostSubscriptions(data.subscriptions || []);
        }
      }
    } catch (e) {
      console.error('Failed to fetch self host subscriptions:', e);
    } finally {
      setSelfHostLoading(false);
    }
  };

  const handleToggleSelfHostSubscription = async (school, currentStatus) => {
    const nextStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    if (!confirm(`Are you sure you want to change the status of ${school} to ${nextStatus}?`)) {
      return;
    }
    try {
      const res = await masterApiCall('/api/v1/master/subscriptions/toggle', {
        method: 'POST',
        body: JSON.stringify({ school, status: nextStatus })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          alert(`Campus ${school} status updated to ${nextStatus}!`);
          fetchSelfHostSubscriptions();
        } else {
          alert(data.error || 'Failed to update campus status.');
        }
      } else {
        alert('Server returned an error.');
      }
    } catch (err) {
      alert('Network request failed.');
    }
  };

  const handleUpdateSelfHostExpiry = async (school, expiryDate) => {
    try {
      const res = await masterApiCall('/api/v1/master/subscriptions/toggle', {
        method: 'POST',
        body: JSON.stringify({
          school,
          expiresAt: expiryDate ? new Date(expiryDate).toISOString() : null
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          fetchSelfHostSubscriptions();
        } else {
          alert(data.error || 'Failed to update expiry date.');
        }
      } else {
        alert('Server returned an error.');
      }
    } catch (err) {
      alert('Network request failed.');
    }
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

    const cleanCode = (mfaCode || '').replace(/[\s\-]/g, '').trim();
    try {
      const res = await fetch('/api/master/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mfaToken, code: cleanCode })
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
        body: JSON.stringify({
          clientName: licenseeEmail,
          daysValid: licenseDuration
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNewlyGeneratedKey(data.license?.key || data.licenseKey || (data.license && data.license.licenseKey));
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

  const openExtendLicenseModal = (lic) => {
    setExtendingLicense(lic);
    setExtendDurationDays('365');
    setActiveModal('extendLicense');
  };

  const handleExtendLicenseSubmit = async (e) => {
    e.preventDefault();
    if (!extendingLicense) return;
    const parsedDays = parseInt(extendDurationDays, 10);
    if (isNaN(parsedDays) || parsedDays <= 0) {
      alert('Please enter a valid positive number of days.');
      return;
    }

    setLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await masterApiCall(`/api/master/licenses/${encodeURIComponent(extendingLicense._id)}/extend`, {
        method: 'PATCH',
        body: JSON.stringify({ daysValid: parsedDays })
      });
      const data = await res.json();
      if (res.ok) {
        setNewlyGeneratedKey(data.license?.key || data.licenseKey || (data.license && data.license.licenseKey));
        fetchLicensesList();
        setActionSuccess('License extended successfully! You can copy the newly signed key below.');
        setTimeout(() => {
          setActiveModal(null);
        }, 3000);
      } else {
        setActionError(data.error || 'Failed to extend license.');
      }
    } catch {
      setActionError('Failed to extend license due to connection error.');
    } finally {
      setLoading(false);
    }
  };

  // Blog Actions
  const openBlogEditModal = (blog = null) => {
    if (blog) {
      setSelectedBlogId(blog._id);
      setBlogTitle(blog.title || '');
      setBlogCategory(blog.category || 'Guides');
      setBlogDate(blog.date || '');
      setBlogImageUrl(blog.imageUrl === '/assets/images/blog_hero.webp' ? '' : (blog.imageUrl || ''));
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

  // Changelog Actions
  const openChangelogEditModal = (item = null) => {
    if (item) {
      setSelectedChangelogId(item._id);
      setChangelogVersion(item.version || '');
      setChangelogDate(item.date || '');
      setChangelogDescription(item.description || '');
      setChangelogItemsText(Array.isArray(item.items) ? item.items.join('\n') : (item.items || ''));
      setChangelogIsMajor(!!item.isMajor);
    } else {
      setSelectedChangelogId('');
      setChangelogVersion('');
      setChangelogDate(new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
      setChangelogDescription('');
      setChangelogItemsText('');
      setChangelogIsMajor(false);
    }
    setActiveModal('editChangelog');
  };

  const handleChangelogFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      version: changelogVersion,
      date: changelogDate,
      description: changelogDescription,
      items: changelogItemsText.split('\n').map(i => i.trim()).filter(Boolean),
      isMajor: changelogIsMajor
    };

    const method = selectedChangelogId ? 'PUT' : 'POST';
    const endpoint = selectedChangelogId ? `/api/master/changelogs/${encodeURIComponent(selectedChangelogId)}` : '/api/master/changelogs';

    try {
      const res = await masterApiCall(endpoint, {
        method,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setActiveModal(null);
        fetchChangelogsList();
      } else {
        let errorMsg = 'Failed to save changelog entry.';
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

  const handleDeleteChangelog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this changelog entry?')) return;
    try {
      const res = await masterApiCall(`/api/master/changelogs/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) {
        fetchChangelogsList();
      }
    } catch {
      alert('Failed to delete changelog entry.');
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
    const cleanCode = (setupCode || '').replace(/[\s\-]/g, '').trim();
    try {
      const res = await masterApiCall('/api/master/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ code: cleanCode })
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
    const cleanCode = (disableCode || '').replace(/[\s\-]/g, '').trim();
    try {
      const res = await masterApiCall('/api/master/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ password: disablePwd, code: cleanCode })
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

  // --- Backup Export/Import Handlers ---
  const fetchBackupFiles = async () => {
    setBackupScanning(true);
    setBackupResult(null);
    try {
      const res = await masterApiCall('/api/master/backup/files');
      if (res.ok) {
        const data = await res.json();
        setBackupFiles(data.categories || []);
        // Auto-select all files
        const allPaths = new Set();
        (data.categories || []).forEach(cat => cat.files.forEach(f => allPaths.add(f.path)));
        setSelectedExportFiles(allPaths);
        // Expand all categories by default
        setExpandedCategories(new Set((data.categories || []).map(c => c.id)));
      }
    } catch { }
    setBackupScanning(false);
  };

  const toggleExportCategory = (catId) => {
    const cat = backupFiles.find(c => c.id === catId);
    if (!cat) return;
    const newSet = new Set(selectedExportFiles);
    const allSelected = cat.files.every(f => newSet.has(f.path));
    cat.files.forEach(f => {
      if (allSelected) newSet.delete(f.path);
      else newSet.add(f.path);
    });
    setSelectedExportFiles(newSet);
  };

  const toggleExportFile = (filePath) => {
    const newSet = new Set(selectedExportFiles);
    if (newSet.has(filePath)) newSet.delete(filePath);
    else newSet.add(filePath);
    setSelectedExportFiles(newSet);
  };

  const toggleSelectAllExport = () => {
    const allPaths = new Set();
    backupFiles.forEach(cat => cat.files.forEach(f => allPaths.add(f.path)));
    if (selectedExportFiles.size === allPaths.size) {
      setSelectedExportFiles(new Set());
    } else {
      setSelectedExportFiles(allPaths);
    }
  };

  const toggleExpandCategory = (catId) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(catId)) newSet.delete(catId);
    else newSet.add(catId);
    setExpandedCategories(newSet);
  };

  const handleBackupExport = async () => {
    if (selectedExportFiles.size === 0) return;
    setBackupExporting(true);
    setBackupResult(null);
    try {
      const token = localStorage.getItem('masterToken');
      const res = await fetch('/api/master/backup/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ files: Array.from(selectedExportFiles) })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const disposition = res.headers.get('Content-Disposition');
        const filenameMatch = disposition && disposition.match(/filename="(.+)"/);
        a.download = filenameMatch ? filenameMatch[1] : `LogbookPlus_Server_Config_${new Date().toISOString().split('T')[0]}.bak`;
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setBackupResult({ type: 'success', message: `Backup exported: ${selectedExportFiles.size} files` });
      } else {
        const data = await res.json();
        setBackupResult({ type: 'error', message: data.error || 'Export failed' });
      }
    } catch (err) {
      setBackupResult({ type: 'error', message: 'Export request failed: ' + err.message });
    } finally {
      setBackupExporting(false);
    }
  };

  const handleImportFileSelect = async (file) => {
    if (!file) return;
    setImportFile(file);
    setImportPreview(null);
    setBackupResult(null);
    setBackupImporting(true);

    try {
      const formData = new FormData();
      formData.append('backup', file);
      const token = localStorage.getItem('masterToken');
      const res = await fetch('/api/master/backup/import?preview=true', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.manifest) {
        setImportPreview(data.manifest);
        const allPaths = new Set(data.manifest.files.map(f => f.path));
        setSelectedImportFiles(allPaths);
        if (data.manifest.categories) {
          setExpandedImportCategories(new Set(data.manifest.categories.map(c => c.id)));
        } else {
          setExpandedImportCategories(new Set(['all']));
        }
      } else {
        setBackupResult({ type: 'error', message: data.error || 'Failed to read backup file' });
      }
    } catch (err) {
      setBackupResult({ type: 'error', message: 'Failed to preview backup: ' + err.message });
    } finally {
      setBackupImporting(false);
    }
  };

  const toggleImportFile = (filePath) => {
    const newSet = new Set(selectedImportFiles);
    if (newSet.has(filePath)) newSet.delete(filePath);
    else newSet.add(filePath);
    setSelectedImportFiles(newSet);
  };

  const toggleImportCategory = (catId) => {
    if (!importPreview || !importPreview.categories) return;
    const cat = importPreview.categories.find(c => c.id === catId);
    if (!cat) return;
    const newSet = new Set(selectedImportFiles);
    const allSelected = cat.files.every(f => newSet.has(f.path));
    cat.files.forEach(f => {
      if (allSelected) newSet.delete(f.path);
      else newSet.add(f.path);
    });
    setSelectedImportFiles(newSet);
  };

  const toggleExpandImportCategory = (catId) => {
    const newSet = new Set(expandedImportCategories);
    if (newSet.has(catId)) newSet.delete(catId);
    else newSet.add(catId);
    setExpandedImportCategories(newSet);
  };

  const toggleSelectAllImport = () => {
    if (!importPreview) return;
    const allPaths = new Set(importPreview.files.map(f => f.path));
    if (selectedImportFiles.size === allPaths.size) {
      setSelectedImportFiles(new Set());
    } else {
      setSelectedImportFiles(allPaths);
    }
  };

  const handleBackupRestore = async () => {
    if (!importFile || selectedImportFiles.size === 0) return;
    setBackupImporting(true);
    setBackupResult(null);
    try {
      const formData = new FormData();
      formData.append('backup', importFile);
      formData.append('files', JSON.stringify(Array.from(selectedImportFiles)));
      const token = localStorage.getItem('masterToken');
      const res = await fetch('/api/master/backup/import', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setBackupResult({ type: 'success', message: `Restored ${data.restoredCount} files successfully${data.skippedCount > 0 ? ` (${data.skippedCount} skipped)` : ''}` });
        setImportPreview(null);
        setImportFile(null);
        setSelectedImportFiles(new Set());
        setActiveModal(null);
        if (importFileRef.current) importFileRef.current.value = '';
      } else {
        setBackupResult({ type: 'error', message: data.error || 'Restore failed' });
      }
    } catch (err) {
      setBackupResult({ type: 'error', message: 'Restore request failed: ' + err.message });
    } finally {
      setBackupImporting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Map category icon name strings to components
  const BACKUP_ICON_MAP = {
    HardDrive, FolderOpen, Settings, FileCheck, Terminal, Cloud, BookOpen
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
          className="card-unified space-y-6 relative overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/5"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-accent-purple border border-purple-500/20">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-white tracking-tight">Master Control Login</h2>
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
                className="w-full text-center text-sm text-zinc-550 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </form>
          )}

          <div className="text-center pt-2">
            <a
              href={window.location.hostname.startsWith('master.') ? window.location.protocol + '//' + window.location.host.replace('master.', '') : '/'}
              className="text-sm text-zinc-500 hover:text-zinc-850 dark:hover:text-white transition-colors cursor-pointer"
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
    <div className="py-6 md:py-12 lg:py-20 w-full max-w-[95%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 md:px-8 lg:px-12 relative flex flex-col md:flex-row gap-6 md:gap-8">
      {/* MOBILE HEADER */}
      <div className="flex md:hidden items-center justify-between p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-2xl w-full">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-accent-purple" />
          <div className="text-left">
            <h3 className="font-bold text-zinc-800 dark:text-white text-md">Master Control</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Admin • {activeTab}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500" />
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-white/10 p-6 z-50 flex flex-col justify-between shadow-[10px_0_40px_rgba(0,0,0,0.08)] dark:shadow-[10px_0_40px_rgba(0,0,0,0.5)]"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-accent-purple" />
                    <div className="text-left">
                      <h3 className="font-bold text-zinc-800 dark:text-white text-lg">Master Control</h3>
                      <p className="text-[13px] text-zinc-500 uppercase tracking-widest">Administrator</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1.5 flex flex-col">
                  {[
                    { name: 'Overview', icon: Server },
                    { name: 'Users', icon: Users },
                    { name: 'Licenses', icon: Key },
                    { name: 'Subscriptions', icon: CreditCard },
                    { name: 'Blogs', icon: BookOpen },
                    { name: 'Changelogs', icon: ScrollText },
                    { name: 'Logs', icon: Terminal },
                    { name: 'Settings', icon: Settings },
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.name;
                    return (
                      <button
                        key={tab.name}
                        onClick={() => {
                          setActiveTab(tab.name);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all text-left cursor-pointer ${isActive
                          ? 'bg-gradient-to-r from-accent-blue/15 to-accent-purple/15 border border-accent-purple/30 text-zinc-900 dark:text-white'
                          : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
                          }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-accent-purple' : 'text-zinc-400 dark:text-zinc-500'}`} />
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-white/5 pt-4">
                <button
                  onClick={() => {
                    handleLogout();
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden md:block w-64 flex-shrink-0 space-y-6">
        <div className="card-unified bg-white dark:bg-zinc-950 p-4 space-y-4 border border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-white/5 pb-4">
            <Shield className="w-6 h-6 text-accent-purple" />
            <div className="text-left">
              <h3 className="font-bold text-zinc-800 dark:text-white text-lg">Master Control</h3>
              <p className="text-[13px] text-zinc-500 uppercase tracking-widest">Administrator</p>
            </div>
          </div>

          <nav className="space-y-1 flex flex-col">
            {[
              { name: 'Overview', icon: Server },
              { name: 'Users', icon: Users },
              { name: 'Licenses', icon: Key },
              { name: 'Subscriptions', icon: CreditCard },
              { name: 'Blogs', icon: BookOpen },
              { name: 'Changelogs', icon: ScrollText },
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
                    ? 'bg-gradient-to-r from-accent-blue/15 to-accent-purple/15 border border-accent-purple/30 text-zinc-900 dark:text-white'
                    : 'hover:scale-110 text-zinc-650 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-accent-purple' : 'text-zinc-400 dark:text-zinc-500'}`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-zinc-200 dark:border-white/5 pt-4">
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
        <header className="flex justify-between items-center bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm">
          <div className="text-left">
            <h2 className="text-lg font-bold text-zinc-800 dark:text-white">{activeTab} Panel</h2>
            <p className="text-[12px] text-zinc-500 mt-0.5">Server configuration: Online</p>
          </div>

          {/* Master Profile Icon / Theme Toggle wrapper */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="hidden md:block p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white transition-all cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {renderMasterAvatar(masterProfile.profilePicIndex, "w-6 h-6")}
                <span className="text-xs font-semibold text-zinc-800 dark:text-white">{masterProfile.name}</span>
                <ChevronDown className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-30 text-left space-y-1"
                  >
                    <div className="px-3 py-2 rounded-lg mb-1 border border-zinc-200 dark:border-white/10">
                      <p className="text-xs font-bold text-zinc-800 dark:text-white truncate">{masterProfile.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">{masterProfile.email}</p>
                    </div>
                    <button
                      onClick={() => { setActiveModal('editProfile'); setProfileDropdownOpen(false); }}
                      className="dropdown-item"
                    >
                      <User className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => { setActiveModal('changePwd'); setProfileDropdownOpen(false); }}
                      className="dropdown-item"
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
                      className="dropdown-item"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Master 2FA Settings
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
              {/* Stats & Telemetry Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Registered Users */}
                <div className="card-unified bg-white dark:bg-zinc-950/50 p-4 border border-zinc-200 dark:border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Registered Accounts</span>
                    <Users className="w-5 h-5 text-accent-blue bg-accent-blue/10 p-1 rounded-lg" />
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-zinc-800 dark:text-white">{stats.totalUsers || 0}</span>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Vault + Campus
                    </span>
                  </div>
                </div>

                {/* Live CPU Usage */}
                <div className="card-unified bg-white dark:bg-zinc-950/50 p-4 border border-zinc-200 dark:border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">CPU Usage</span>
                    <Cpu className="w-5 h-5 text-accent-purple bg-accent-purple/10 p-1 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-zinc-800 dark:text-white">{stats.cpuUsage || 0}%</span>
                      <span className="text-[11px] text-zinc-400 font-mono">{stats.cpuCores || 1} Cores</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-200 dark:border-white/5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${(stats.cpuUsage || 0) > 80 ? 'bg-red-500' :
                          (stats.cpuUsage || 0) > 50 ? 'bg-amber-500' : 'bg-accent-purple'
                          }`}
                        style={{ width: `${Math.max(5, Math.min(100, stats.cpuUsage || 0))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Live Network Bandwidth (Click to Expand) */}
                <div
                  onClick={() => setNetworkGraphExpanded(!networkGraphExpanded)}
                  className={`card-unified p-4 border transition-all cursor-pointer space-y-3 group ${networkGraphExpanded
                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-white/5 hover:border-emerald-500/30'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                      Network Traffic
                      <span className="text-[10px] text-emerald-400 font-normal lowercase opacity-0 group-hover:opacity-100 transition-opacity">
                        (click to {networkGraphExpanded ? 'collapse' : 'expand'})
                      </span>
                    </span>
                    <button className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition">
                      {networkGraphExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="flex items-center gap-1 text-xs font-mono text-emerald-400 font-bold">
                        <ArrowDown className="w-3 h-3" /> Rx: {stats.network?.rxMB || '0.00'} MB
                      </div>
                      <div className="flex items-center gap-1 text-xs font-mono text-accent-blue font-bold mt-0.5">
                        <ArrowUp className="w-3 h-3" /> Tx: {stats.network?.txMB || '0.00'} MB
                      </div>
                    </div>
                    <span className="text-[10.5px] font-bold text-zinc-500 font-mono">
                      {stats.network?.totalRequests || 0} reqs
                    </span>
                  </div>
                </div>

                {/* RAM Memory Load */}
                <div className="card-unified bg-white dark:bg-zinc-950/50 p-4 border border-zinc-200 dark:border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Memory (RAM)</span>
                    <HardDrive className="w-5 h-5 text-accent-cyan bg-accent-cyan/10 p-1 rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-zinc-800 dark:text-white">{stats.ramUsageMB || 0} <span className="text-xs font-normal text-zinc-400">MB RSS</span></span>
                      <span className="text-[11px] text-zinc-400 font-mono">{stats.ramUsedPercent || 0}% System</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-200 dark:border-white/5">
                      <div
                        className="h-full rounded-full bg-accent-cyan transition-all duration-500"
                        style={{ width: `${Math.max(5, Math.min(100, stats.ramUsedPercent || 0))}%` }}
                      />
                    </div>
                  </div>
                </div>
                {/* Disk Storage */}
                <div className="card-unified bg-white dark:bg-zinc-950/50 p-4 border border-zinc-200 dark:border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Disk Storage</span>
                    <Cloud className="w-5 h-5 text-amber-400 bg-amber-500/10 p-1 rounded-lg" />
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-zinc-800 dark:text-white">{parseFloat(stats.totalStorageMB || 0).toFixed(1)} <span className="text-xs font-normal text-zinc-400">MB</span></span>
                    <span className="text-[11px] text-zinc-400 font-mono">Uploads Dir</span>
                  </div>
                </div>

                {/* System Uptime Clock */}
                <div className="card-unified bg-white dark:bg-zinc-950/50 p-4 border border-zinc-200 dark:border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">System Uptime</span>
                    <Clock className="w-5 h-5 text-emerald-400 bg-emerald-500/10 p-1 rounded-lg animate-pulse" />
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black text-zinc-800 dark:text-white font-mono">{formatUptimeDisplay(serverUptime)}</span>
                    <span className="text-[11px] font-bold text-emerald-400">Active</span>
                  </div>
                </div>
              </div>

              {/* EXPANDABLE REAL-TIME NETWORK GRAPH PANEL */}
              <AnimatePresence>
                {networkGraphExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.98 }}
                    className="overflow-hidden"
                  >
                    <div className="card-unified bg-white dark:bg-zinc-950/50 p-5 border border-emerald-500/20 shadow-lg space-y-4 text-left">
                      {/* Header & Legend */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-white/5 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <Wifi className="w-4 h-4 text-emerald-400" />
                            Live Network Bandwidth Stream (Tx / Rx Real-Time Graph)
                          </h4>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Real-time HTTP Request/Response throughput. Blue path = Transmitted (Tx), Green path = Received (Rx).
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 font-mono">
                            <ArrowDown className="w-3.5 h-3.5" />
                            Rx: {stats.network?.rxMB || '0.00'} MB ({stats.network?.rxKB || '0.0'} KB)
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-xs font-bold text-accent-blue font-mono">
                            <ArrowUp className="w-3.5 h-3.5" />
                            Tx: {stats.network?.txMB || '0.00'} MB ({stats.network?.txKB || '0.0'} KB)
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setNetworkGraphExpanded(false); }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-white transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                          >
                            <Minimize2 className="w-3.5 h-3.5" />
                            Close Graph
                          </button>
                        </div>
                      </div>

                      {/* SVG Line Graph Container */}
                      <div className="relative h-44 w-full bg-zinc-50 dark:bg-black/80 rounded-xl border border-zinc-200 dark:border-white/10 p-3 flex flex-col justify-between overflow-hidden">
                        {networkHistory.length < 2 ? (
                          <div className="h-full flex flex-col items-center justify-center text-xs text-zinc-400 space-y-1.5">
                            <Activity className="w-5 h-5 text-emerald-400 animate-spin" />
                            <span className="font-semibold">Sampling network traffic telemetry stream...</span>
                          </div>
                        ) : (
                          (() => {
                            const width = 600;
                            const height = 120;
                            const maxVal = Math.max(10, ...networkHistory.map(d => d.rx), ...networkHistory.map(d => d.tx));
                            const ptsCount = networkHistory.length;

                            const rxPoints = networkHistory.map((d, i) => {
                              const x = (i / (ptsCount - 1)) * width;
                              const y = height - (d.rx / maxVal) * (height - 20) - 10;
                              return `${x},${y}`;
                            });

                            const txPoints = networkHistory.map((d, i) => {
                              const x = (i / (ptsCount - 1)) * width;
                              const y = height - (d.tx / maxVal) * (height - 20) - 10;
                              return `${x},${y}`;
                            });

                            const rxPath = `M ${rxPoints.join(' L ')}`;
                            const txPath = `M ${txPoints.join(' L ')}`;
                            const rxArea = `M 0,${height} L ${rxPoints.join(' L ')} L ${width},${height} Z`;
                            const txArea = `M 0,${height} L ${txPoints.join(' L ')} L ${width},${height} Z`;

                            return (
                              <>
                                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                  <defs>
                                    <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                    </linearGradient>
                                    <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                                    </linearGradient>
                                  </defs>

                                  {/* Grid Lines */}
                                  <line x1="0" y1={height / 4} x2={width} y2={height / 4} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeDasharray="3 3" />
                                  <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeDasharray="3 3" />
                                  <line x1="0" y1={(3 * height) / 4} x2={width} y2={(3 * height) / 4} stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeDasharray="3 3" />

                                  {/* Area Fills */}
                                  <path d={rxArea} fill="url(#rxGrad)" />
                                  <path d={txArea} fill="url(#txGrad)" />

                                  {/* Line Strokes */}
                                  <path d={txPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                  <path d={rxPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                                  {/* Data Dots */}
                                  {networkHistory.map((d, i) => {
                                    const x = (i / (ptsCount - 1)) * width;
                                    const rxY = height - (d.rx / maxVal) * (height - 20) - 10;
                                    const txY = height - (d.tx / maxVal) * (height - 20) - 10;
                                    return (
                                      <g key={i}>
                                        <circle cx={x} cy={rxY} r="3" className="fill-emerald-400 stroke-zinc-950" strokeWidth="1.5" />
                                        <circle cx={x} cy={txY} r="3" className="fill-blue-500 stroke-zinc-950" strokeWidth="1.5" />
                                      </g>
                                    );
                                  })}
                                </svg>

                                {/* Time axis labels */}
                                <div className="flex justify-between items-center text-[10px] text-zinc-400 font-mono pt-1 border-t border-zinc-200 dark:border-white/5 mt-1">
                                  <span>Started: {networkHistory[0]?.time}</span>
                                  <span className="hidden sm:inline text-zinc-500 font-sans">Rolling Live Stream ({networkHistory.length} samples)</span>
                                  <span className="text-emerald-400 font-bold">Latest: {networkHistory[networkHistory.length - 1]?.time}</span>
                                </div>
                              </>
                            );
                          })()
                        )}
                      </div>

                      {/* Traffic Breakdown & Route Destinations Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* Top Endpoints */}
                        <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-white/5 space-y-2.5">
                          <div className="flex justify-between items-center border-b border-zinc-200 dark:border-white/5 pb-2">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Terminal className="w-3.5 h-3.5 text-accent-purple" />
                              Top Endpoint Route Traffic Destinations
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">Route Breakdown</span>
                          </div>

                          <div className="space-y-2 text-xs">
                            {(!stats.network?.topEndpoints || stats.network.topEndpoints.length === 0) ? (
                              <div className="text-center py-4 text-zinc-400 text-[11px]">No active route telemetry available.</div>
                            ) : (
                              stats.network.topEndpoints.map((ep, idx) => (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between items-center font-mono text-[11px]">
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]" title={ep.endpoint}>
                                      {ep.endpoint}
                                    </span>
                                    <span className="text-zinc-500 font-semibold">
                                      {ep.count} reqs ({ep.pct || 0}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-accent-purple h-full rounded-full transition-all"
                                      style={{ width: `${Math.max(4, Math.min(100, ep.pct || 0))}%` }}
                                    />
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Top Client IPs & Method Ratios */}
                        <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-white/5 space-y-3">
                          <div className="flex justify-between items-center border-b border-zinc-200 dark:border-white/5 pb-2">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-accent-blue" />
                              Client IP Sources & Method Ratios
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">Client Sources</span>
                          </div>

                          {/* HTTP Method Ratios */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              GET: {stats.network?.methodStats?.GET || 0}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              POST: {stats.network?.methodStats?.POST || 0}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              PUT: {stats.network?.methodStats?.PUT || 0}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              DELETE: {stats.network?.methodStats?.DELETE || 0}
                            </span>
                          </div>

                          {/* Top IPs */}
                          <div className="space-y-1.5 font-mono text-xs">
                            {(!stats.network?.topClients || stats.network.topClients.length === 0) ? (
                              <div className="text-center py-2 text-zinc-400 text-[11px]">No client IP data yet.</div>
                            ) : (
                              stats.network.topClients.map((client, idx) => (
                                <div key={idx} className="flex justify-between items-center p-1.5 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-white/5 text-[11px]">
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{client.ip}</span>
                                  <span className="text-zinc-500 font-semibold">{client.count} requests</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Server Logs and Actions layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent events logs */}
                <div className="lg:col-span-2 card-unified bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-200 dark:border-white/5 pb-2">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Recent Server Events</h3>
                    <button
                      onClick={fetchRecentLogs}
                      className="p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="text-zinc-500 border-b border-zinc-200 dark:border-white/5 pb-2">
                          <th className="py-2">Level</th>
                          <th className="py-2">Message</th>
                          <th className="py-2 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logsList.map((log, idx) => (
                          <tr key={log._id || idx} className="border-b border-zinc-100 dark:border-white/2 hover:bg-zinc-50 dark:hover:bg-white/2 transition">
                            <td className="py-2.5 font-bold uppercase">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.level === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                log.level === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  'bg-blue-500/10 text-accent-blue border border-blue-500/20'
                                }`}>
                                {log.level}
                              </span>
                            </td>
                            <td className="py-2.5 text-zinc-700 dark:text-zinc-300 max-w-lg truncate" title={log.message}>{log.message}</td>
                            <td className="py-2.5 text-zinc-500 text-right font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* System Actions */}
                <div className="card-unified bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 space-y-4 h-fit">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider border-b border-zinc-200 dark:border-white/5 pb-2">System Actions</h3>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-zinc-500 uppercase block pl-1">Backups Retention policy</label>
                      <div className="flex gap-2 w-full">
                        <CustomSelect
                          value={cleanupDays}
                          onChange={(val) => setCleanupDays(val)}
                          options={[
                            { value: '7', label: '7 Days old' },
                            { value: '15', label: '15 Days old' },
                            { value: '30', label: '30 Days old' },
                            { value: '90', label: '90 Days old' }
                          ]}
                        />
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
              className="card-unified bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 sm:p-6 space-y-6 text-left"
            >
              {/* Header Toolbar & Live Stat Summary */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-3">
                  <div>
                    <h3 className="text-md font-bold text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-5 h-5 text-accent-purple" />
                      Live User Account Directory
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Real-time online status and active user sessions across all vault & campus instances.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">

                    <button
                      onClick={fetchUsersList}
                      className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                      title="Refresh Users List"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Accounts</p>
                      <p className="text-2xl font-black text-zinc-800 dark:text-white mt-1">{users.length}</p>
                    </div>
                    <Users className="w-7 h-7 text-accent-purple bg-accent-purple/10 p-1.5 rounded-lg" />
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Online Now</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">{users.filter(u => u.isOnline).length}</p>
                    </div>
                    <Activity className="w-7 h-7 text-emerald-400 bg-emerald-500/10 p-1.5 rounded-lg animate-pulse" />
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Offline Accounts</p>
                      <p className="text-2xl font-black text-zinc-500 mt-1">{users.filter(u => !u.isOnline).length}</p>
                    </div>
                    <User className="w-7 h-7 text-zinc-400 bg-zinc-500/10 p-1.5 rounded-lg" />
                  </div>
                </div>

                {/* Search & Status Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-white/5">
                  <div className="relative sm:col-span-2">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by Username, Name, School, ID..."
                      className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-accent-purple"
                    />
                    {userSearch && (
                      <button
                        onClick={() => setUserSearch('')}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200 text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 min-w-[200px]">
                    <Filter className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <CustomSelect
                      value={userStatusFilter}
                      onChange={(val) => setUserStatusFilter(val)}
                      options={[
                        { value: 'ALL', label: `All Statuses (${users.length})` },
                        { value: 'ONLINE', label: `🟢 Online Now (${users.filter(u => u.isOnline).length})` },
                        { value: 'OFFLINE', label: `⚪ Offline (${users.filter(u => !u.isOnline).length})` }
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto border border-zinc-200 dark:border-white/5 rounded-xl bg-white dark:bg-zinc-950">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5">User Identity</th>
                      <th className="px-5 py-3.5">Live Status</th>
                      <th className="px-5 py-3.5">Source / Campus</th>
                      <th className="px-5 py-3.5">Billing Plan</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                    {filteredUsersList.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-xs text-zinc-400 font-sans">
                          No users match your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsersList.map((user) => (
                        <tr key={user._id} className="hover:bg-zinc-100 dark:hover:bg-zinc-900/60 transition">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 border border-accent-purple/30 flex items-center justify-center font-extrabold text-zinc-800 dark:text-white uppercase">
                                  {user.name ? user.name.charAt(0) : user.username.charAt(0)}
                                </div>
                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-950 ${user.isOnline ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-zinc-800 dark:text-white flex items-center gap-1.5">
                                  {user.name || user.username}
                                  {user.twoFactorEnabled && <Shield className="w-3.5 h-3.5 text-accent-purple" title="2FA Enabled" />}
                                </p>
                                <p className="text-xs font-mono text-zinc-500">@{user.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {user.isOnline ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                Online
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                Offline
                              </span>
                            )}
                            {user.lastActiveAt ? (
                              <p className="text-[10.5px] text-zinc-500 font-mono mt-1">
                                {user.isOnline ? 'Active now' : `Last: ${new Date(user.lastActiveAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/5 uppercase">
                              {user.source || user.school || 'Vault'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${user.plan === 'premium' || user.plan === 'licensed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-white/5'
                              }`}>
                              {user.plan || 'campus'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end gap-2 flex-wrap">
                              <button
                                onClick={() => openResetPasswordModal(user)}
                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1"
                                title="Reset & Encrypt Password"
                              >
                                <Key className="w-3.5 h-3.5" />
                                Reset Pwd
                              </button>
                              {user.twoFactorEnabled && (
                                <button
                                  onClick={() => handleForceReset2FA(user._id, user.username)}
                                  className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg border border-amber-500/20 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  Reset 2FA
                                </button>
                              )}
                              {user.plan === 'campus' || (user.source && user.source !== 'Main Vault') ? (
                                <a
                                  href={window.location.href.replace('master', 'helpdesk')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                  <Cloud className="w-3.5 h-3.5" />
                                  Manage on Helpdesk
                                </a>
                              ) : (
                                <>
                                  <button
                                    onClick={() => openPlanModal(user)}
                                    className="px-2.5 py-1.5 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue text-xs font-bold rounded-lg border border-accent-blue/20 transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    Edit Plan
                                  </button>
                                  <button
                                    onClick={() => handleWipeUser(user._id, user.username)}
                                    className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition-all cursor-pointer flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Wipe
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
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
              <div className="card-unified bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 sm:p-6 space-y-4">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider border-b border-zinc-200 dark:border-white/5 pb-2">Generate Self-Hosted JWT Key</h3>

                <form onSubmit={handleGenerateLicense} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-1.5 flex-grow text-left">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase block pl-1">Licensee Email address</label>
                    <input
                      type="email"
                      value={licenseeEmail}
                      onChange={(e) => setLicenseeEmail(e.target.value)}
                      placeholder="licensee@example.com"
                      className="input-unified py-2 text-sm bg-zinc-50 dark:bg-zinc-900"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 w-full sm:w-44 text-left">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase block pl-1">Validity Period</label>
                    <CustomSelect
                      value={licenseDuration}
                      onChange={(val) => setLicenseDuration(val)}
                      options={[
                        { value: '30', label: '30 Days' },
                        { value: '90', label: '90 Days' },
                        { value: '365', label: '1 Year (365 Days)' },
                        { value: '3650', label: 'Lifetime (10 Years)' }
                      ]}
                    />
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
                        className="input-unified flex-grow font-mono text-[10px] py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/5"
                      />
                      <button
                        onClick={() => copyToClipboard(newlyGeneratedKey)}
                        className="px-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white transition-colors cursor-pointer text-xs"
                      >
                        {copiedKey === newlyGeneratedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Licenses List */}
              <div className="card-unified bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 sm:p-6 space-y-4">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider border-b border-zinc-200 dark:border-white/5 pb-2">Issued Self-Hosted License Keys</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-zinc-500 border-b border-zinc-200 dark:border-white/5 pb-2">
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
                          <tr key={lic._id} className="border-b border-zinc-100 dark:border-white/2 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition">
                            <td className="py-3 text-left font-semibold text-zinc-850 dark:text-white">{lic.licensee || lic.clientName}</td>
                            <td className="py-3">
                              <span className={`font-semibold ${isExpired ? 'text-red-400' : 'text-zinc-650 dark:text-zinc-300'}`}>
                                {new Date(lic.expiresAt).toLocaleDateString()}
                              </span>
                              {isExpired && <span className="text-[8px] uppercase tracking-wider text-red-500 border border-red-500/20 bg-red-500/5 px-1 ml-1.5 rounded">EXPIRED</span>}
                            </td>
                            <td className="py-3 font-mono text-[11px] text-zinc-500 truncate max-w-[120px]">{lic.licenseKey || lic.key}</td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => copyToClipboard(lic.licenseKey || lic.key)}
                                  className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold rounded-lg border border-zinc-200 dark:border-white/5 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  {copiedKey === (lic.licenseKey || lic.key) ? 'Copied!' : 'Copy Key'}
                                </button>
                                <button
                                  onClick={() => openExtendLicenseModal(lic)}
                                  className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-semibold rounded-lg border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  Extend
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
              className="card-unified bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 sm:p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-white/5 pb-3">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Manage Blog Posts</h3>
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
                    <tr className="text-zinc-500 border-b border-zinc-200 dark:border-white/5 pb-2">
                      <th className="py-2.5">Title / Metadata</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blogs.map((blog) => (
                      <tr key={blog._id} className="border-b border-zinc-100 dark:border-white/2 hover:bg-zinc-50 dark:hover:bg-white/2 transition">
                        <td className="py-3 text-left">
                          <p className="font-semibold text-zinc-800 dark:text-white truncate text-lg max-w-md">{blog.title}</p>
                          <div className="flex gap-2 items-center mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[12px] bg-accent-blue/15 text-accent-blue border border-accent-blue/20 font-bold uppercase">{blog.category}</span>
                            <span className="font-mono text-zinc-500 text-md overflow-x-auto max-w-xs">{blog.slug}</span>
                          </div>
                        </td>
                        <td className="py-3 text-zinc-600 dark:text-zinc-300">{blog.date}</td>
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

          {activeTab === 'Changelogs' && (
            <motion.div
              key="Changelogs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card-unified bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 sm:p-6 space-y-4 text-left"
            >
              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Manage Release Changelogs</h3>
                  <p className="text-xs text-zinc-500">Publish product updates, bug fixes, and release notes</p>
                </div>
                <button
                  onClick={() => openChangelogEditModal(null)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-accent-blue to-accent-purple text-white text-sm font-semibold rounded-lg transition-all hover:opacity-95 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Release Note
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-200 dark:border-white/5 pb-2">
                      <th className="py-2.5">Version & Date</th>
                      <th className="py-2.5">Release Notes</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changelogs.map((item) => (
                      <tr key={item._id} className="border-b border-zinc-100 dark:border-white/2 hover:bg-zinc-50 dark:hover:bg-white/2 transition">
                        <td className="py-3 text-left w-48 align-top">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-800 dark:text-white text-lg">{item.version}</span>
                            {item.isMajor && (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">
                                Major
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 font-mono mt-0.5">{item.date}</p>
                        </td>
                        <td className="py-3 align-top">
                          {item.description && (
                            <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm mb-1">{item.description}</p>
                          )}
                          {Array.isArray(item.items) && (
                            <ul className="list-disc pl-4 space-y-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                              {item.items.map((bullet, bIdx) => (
                                <li key={bIdx}>{bullet}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td className="py-3 text-right align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openChangelogEditModal(item)}
                              className="px-2.5 py-1.5 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue font-semibold rounded-lg border border-accent-blue/20 transition-all cursor-pointer flex items-center gap-1 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteChangelog(item._id)}
                              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-lg border border-red-500/20 transition-all cursor-pointer flex items-center gap-1 text-xs"
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
              className="card-unified bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 sm:p-6 space-y-4 text-left"
            >
              {/* Header Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-accent-purple" />
                    Live Server Audit & Console Logs
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Real-time HTTP requests, authentication alerts, and server event logs. Click any log entry to inspect details & payload.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Live Polling (2.5s)
                  </span>
                  <button
                    onClick={fetchLiveLogs}
                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                    title="Refresh Logs Now"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleClearLogs}
                    className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Logs
                  </button>
                </div>
              </div>

              {/* Filter & Search Toolbar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-white/5">
                {/* Search */}
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="Search logs by keyword, endpoint, IP address, status..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-lg text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-accent-purple"
                  />
                  {logSearchQuery && (
                    <button
                      onClick={() => setLogSearchQuery('')}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-200 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Level Filter */}
                <div className="flex items-center gap-2 min-w-[180px]">
                  <Filter className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <CustomSelect
                    value={logLevelFilter}
                    onChange={(val) => setLogLevelFilter(val)}
                    options={[
                      { value: 'ALL', label: `All Levels (${logsList.length})` },
                      { value: 'info', label: 'Info' },
                      { value: 'warning', label: 'Warning' },
                      { value: 'alarm', label: 'Alarm' },
                      { value: 'critical', label: 'Critical' }
                    ]}
                  />
                </div>
              </div>

              {/* Logs Console Container */}
              <div
                ref={logsConsoleRef}
                className="h-[480px] bg-zinc-50 dark:bg-black/90 rounded-xl border border-zinc-200 dark:border-white/10 p-4 overflow-y-auto font-mono text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300 space-y-1.5"
              >
                {filteredLogs.length === 0 ? (
                  <div className="py-20 text-center text-zinc-400 text-xs font-sans">
                    No logs match your search & filter criteria.
                  </div>
                ) : (
                  filteredLogs.map((log, idx) => {
                    const levelLower = (log.level || 'info').toLowerCase();
                    const levelColors = {
                      critical: 'bg-red-500/10 text-red-400 border-red-500/20',
                      alarm: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                      warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                      info: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    };
                    const colorClass = levelColors[levelLower] || levelColors.info;

                    return (
                      <div
                        key={log._id || idx}
                        onClick={() => setSelectedLogDetails(log)}
                        className="group flex items-start justify-between gap-3 hover:bg-zinc-200/60 dark:hover:bg-white/5 p-2 rounded-lg transition cursor-pointer border border-transparent hover:border-zinc-300 dark:hover:border-white/10"
                      >
                        <div className="flex items-start gap-2.5 overflow-hidden">
                          <span className="text-zinc-400 text-[11px] whitespace-nowrap font-mono pt-0.5">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border font-sans ${colorClass}`}>
                            {log.level || 'INFO'}
                          </span>
                          <span className="break-all font-mono text-zinc-800 dark:text-zinc-200 group-hover:text-accent-purple transition-colors">
                            {log.message}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <span className="text-[10px] font-sans text-accent-purple font-bold">Details</span>
                          <Info className="w-4 h-4 text-accent-purple" />
                        </div>
                      </div>
                    );
                  })
                )}
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
              <div className="card-unified bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 sm:p-6 space-y-4">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider border-b border-zinc-200 dark:border-white/5 pb-2">Server Core Configuration</h3>

                <form onSubmit={handleUpdateConfigSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-zinc-500 uppercase block pl-1">Quota Backup Size Limit (MB)</label>
                    <input
                      type="number"
                      value={Math.floor(serverConfig.quotaLimit / (1024 * 1024))}
                      onChange={(e) => setServerConfig({ ...serverConfig, quotaLimit: parseInt(e.target.value) * 1024 * 1024 })}
                      className="input-unified bg-zinc-50 dark:bg-zinc-900"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5">
                    <div className="text-left">
                      <span className="text-md font-semibold text-zinc-800 dark:text-white block">Enable Public Signups</span>
                      <span className="text-[14px] text-zinc-500 mt-0.5">Toggle new account registrations</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={serverConfig.signupsEnabled !== false}
                        onChange={(e) => setServerConfig({ ...serverConfig, signupsEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-purple peer-checked:after:bg-white"></div>
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
              <div className="card-unified bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 sm:p-6 space-y-4">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider border-b border-zinc-200 dark:border-white/5 pb-2">Master Admin 2FA</h3>

                {masterProfile.twoFactorEnabled ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs flex items-center gap-3">
                      <Shield className="w-7 h-7 flex-shrink-0 animate-bounce" />

                      <div>
                        <p className="font-bold text-[16px] pb-2 text-zinc-800 dark:text-white">2FA Authenticator Active</p>

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
                        <p className="font-bold text-[13.5px] pb-1 text-zinc-800 dark:text-white">2FA is currently Disabled</p>
                        <p className="text-[12.5px] text-zinc-500 mt-0.5">Enable two-factor authentication to secure server control access.</p>
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

              {/* Server Backup Export/Import card */}
              <div className="card-unified bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 sm:p-6 space-y-5 col-span-1 md:col-span-2">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-2">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <FolderArchive className="w-4 h-4 text-accent-purple" />
                    Server Backup
                  </h3>
                </div>

                {/* Permanent overwrite notice */}
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-[16px] font-semibold text-zinc-800 dark:text-white">Important Notice</p>
                    <p className="text-[13.5px] text-zinc-500 mt-0.5">
                      <strong>Export</strong> creates an encrypted <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px]">.bak</code> archive of selected server files. <strong>Import</strong> will <span className="text-amber-500 font-semibold">overwrite existing files</span> at their original paths with the backup contents. Always export a fresh backup before importing one.
                    </p>
                  </div>
                </div>

                {/* Result feedback */}
                {backupResult && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-3 ${backupResult.type === 'success'
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                    : 'border-red-500/20 bg-red-500/5 text-red-400'
                    }`}>
                    {backupResult.type === 'success' ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                    <span className="font-medium">{backupResult.message}</span>
                  </div>
                )}

                {/* EXPORT SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[14px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Download className="w-3.5 h-3.5" />
                      Export Backup
                    </h4>
                    <button
                      onClick={fetchBackupFiles}
                      disabled={backupScanning}
                      className="text-[14px] text-accent-purple hover:text-accent-blue transition-colors cursor-pointer font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${backupScanning ? 'animate-spin' : ''}`} />
                      {backupScanning ? 'Scanning...' : 'Scan Server Files'}
                    </button>
                  </div>

                  {backupFiles.length > 0 && (
                    <div className="space-y-2">
                      {/* Select All / Deselect All */}
                      <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={(() => {
                              let total = 0;
                              backupFiles.forEach(c => total += c.files.length);
                              return selectedExportFiles.size === total && total > 0;
                            })()}
                            onChange={toggleSelectAllExport}
                            className="w-3.5 h-3.5 rounded accent-purple-500 cursor-pointer"
                          />
                          <span className="text-[15px] font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors">Select All</span>
                        </label>
                        <span className="text-[15px] text-zinc-500">
                          {selectedExportFiles.size} file{selectedExportFiles.size !== 1 ? 's' : ''} selected
                          ({formatFileSize(
                            backupFiles.reduce((sum, cat) => sum + cat.files.filter(f => selectedExportFiles.has(f.path)).reduce((s, f) => s + f.size, 0), 0)
                          )})
                        </span>
                      </div>

                      {/* Category tree */}
                      <div className="border border-zinc-200 dark:border-white/5 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                        {backupFiles.map(cat => {
                          const CatIcon = BACKUP_ICON_MAP[cat.icon] || FolderOpen;
                          const catSelected = cat.files.filter(f => selectedExportFiles.has(f.path)).length;
                          const isExpanded = expandedCategories.has(cat.id);
                          const allInCatSelected = catSelected === cat.files.length;
                          const someInCatSelected = catSelected > 0 && !allInCatSelected;
                          const catSize = cat.files.reduce((s, f) => s + f.size, 0);

                          return (
                            <div key={cat.id} className="border-b border-zinc-100 dark:border-white/5 last:border-b-0">
                              {/* Category header */}
                              <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={allInCatSelected}
                                  ref={el => { if (el) el.indeterminate = someInCatSelected; }}
                                  onChange={() => toggleExportCategory(cat.id)}
                                  className="w-3.5 h-3.5 rounded accent-purple-500 cursor-pointer flex-shrink-0"
                                />
                                <button
                                  onClick={() => toggleExpandCategory(cat.id)}
                                  className="flex items-center gap-2 flex-grow text-left cursor-pointer min-w-0"
                                >
                                  <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                                  <CatIcon className="w-4 h-4 text-accent-purple flex-shrink-0" />
                                  <span className="text-[16px] font-semibold text-zinc-700 dark:text-zinc-300 truncate">{cat.label}</span>
                                  <span className="text-[13px] text-zinc-400 ml-auto flex-shrink-0">{cat.files.length} file{cat.files.length !== 1 ? 's' : ''} · {formatFileSize(catSize)}</span>
                                </button>
                              </div>

                              {/* Expanded file list */}
                              {isExpanded && (
                                <div className="bg-white dark:bg-zinc-950/50">
                                  {cat.files.map(file => (
                                    <label
                                      key={file.path}
                                      className="flex items-center gap-2.5 px-3 pl-10 py-1.5 hover:bg-zinc-50 dark:hover:bg-white/10 cursor-pointer transition-colors group"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedExportFiles.has(file.path)}
                                        onChange={() => toggleExportFile(file.path)}
                                        className="w-3.5 h-3.5 rounded accent-purple-500 cursor-pointer flex-shrink-0"
                                      />
                                      <span className="text-[13.4px] text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors truncate min-w-0 flex-grow" title={file.path}>{file.path}</span>
                                      <span className="text-[10px] text-zinc-400 flex-shrink-0">{formatFileSize(file.size)}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Export button */}
                      <button
                        onClick={handleBackupExport}
                        disabled={backupExporting || selectedExportFiles.size === 0}
                        className="w-full btn-primary-unified py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {backupExporting ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" /> Encrypting & Exporting...</>
                        ) : (
                          <><Download className="w-4 h-4" /> Export Selected ({selectedExportFiles.size} files) as .bak</>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-200 dark:border-white/5"></div>

                {/* IMPORT SECTION */}
                <div className="space-y-3">
                  <h4 className="text-[14px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5" />
                    Import / Restore Backup
                  </h4>

                  {/* Upload dropzone */}
                  <div className="relative">
                    {!importFile && (
                      <input
                        ref={importFileRef}
                        type="file"
                        accept=".bak"
                        onChange={(e) => handleImportFileSelect(e.target.files[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                    )}
                    <div className="p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-center hover:border-accent-purple/50 transition-colors bg-zinc-50/50 dark:bg-zinc-900/20 relative">
                      {importFile ? (
                        <div className="space-y-3">
                          <FolderArchive className="w-10 h-10 text-accent-purple mx-auto animate-pulse" />
                          <div>
                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-xs mx-auto">
                              {importFile.name}
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                              {formatFileSize(importFile.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setImportFile(null);
                              setImportPreview(null);
                              setSelectedImportFiles(new Set());
                              if (importFileRef.current) importFileRef.current.value = '';
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-red-500/10 dark:hover:bg-red-600/60 hover:text-red-500 dark:hover:text-white/50 text-xs font-semibold text-zinc-600 dark:text-zinc-400 cursor-pointer transition-all border border-zinc-200 dark:border-white/5 relative z-20"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel File
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Drop a .bak file here or click to browse
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            Only encrypted .bak backup files are accepted
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {backupImporting && !importPreview && (
                    <div className="flex items-center justify-center gap-2 py-3 text-xs text-zinc-500">
                      <RefreshCw className="w-4 h-4 animate-spin text-accent-purple" />
                      Decrypting and reading backup manifest...
                    </div>
                  )}

                  {/* Import Preview — file list from manifest */}
                  {importPreview && (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500">Backup created: <strong className="text-zinc-700 dark:text-zinc-300">{new Date(importPreview.createdAt).toLocaleString()}</strong></span>
                          <span className="text-zinc-500">{importPreview.fileCount || importPreview.totalFiles || (importPreview.files ? importPreview.files.length : 0)} files</span>
                        </div>
                      </div>

                      {/* Select All / Deselect All */}
                      <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedImportFiles.size === (importPreview.files || []).length && (importPreview.files || []).length > 0}
                            onChange={toggleSelectAllImport}
                            className="w-3.5 h-3.5 rounded accent-purple-500 cursor-pointer"
                          />
                          <span className="text-[15px] font-semibold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors">Select All</span>
                        </label>
                        <span className="text-[15px] text-zinc-500">
                          {selectedImportFiles.size} of {(importPreview.files || []).length} selected
                        </span>
                      </div>

                      {/* File list from manifest */}
                      <div className="border border-zinc-200 dark:border-white/5 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                        {((importPreview.categories && importPreview.categories.length > 0)
                          ? importPreview.categories
                          : (importPreview.files ? [{ id: 'all', label: 'All Files', icon: 'FolderOpen', files: importPreview.files }] : [])
                        ).map(cat => {
                          const CatIcon = BACKUP_ICON_MAP[cat.icon] || FolderOpen;
                          const catSelected = cat.files.filter(f => selectedImportFiles.has(f.path)).length;
                          const isExpanded = expandedImportCategories.has(cat.id);
                          const allInCatSelected = catSelected === cat.files.length;
                          const someInCatSelected = catSelected > 0 && !allInCatSelected;
                          const catSize = cat.files.reduce((s, f) => s + f.size, 0);

                          return (
                            <div key={cat.id} className="border-b border-zinc-100 dark:border-white/5 last:border-b-0">
                              {/* Category header */}
                              <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={allInCatSelected}
                                  ref={el => { if (el) el.indeterminate = someInCatSelected; }}
                                  onChange={() => toggleImportCategory(cat.id)}
                                  className="w-3.5 h-3.5 rounded accent-purple-500 cursor-pointer flex-shrink-0"
                                />
                                <button
                                  onClick={() => toggleExpandImportCategory(cat.id)}
                                  className="flex items-center gap-2 flex-grow text-left cursor-pointer min-w-0"
                                >
                                  <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                                  <CatIcon className="w-4 h-4 text-accent-purple flex-shrink-0" />
                                  <span className="text-[16px] font-semibold text-zinc-700 dark:text-zinc-300 truncate">{cat.label}</span>
                                  <span className="text-[13px] text-zinc-400 ml-auto flex-shrink-0">{cat.files.length} file{cat.files.length !== 1 ? 's' : ''} · {formatFileSize(catSize)}</span>
                                </button>
                              </div>

                              {/* Expanded file list */}
                              {isExpanded && (
                                <div className="bg-white dark:bg-zinc-950/50">
                                  {cat.files.map(file => (
                                    <label
                                      key={file.path}
                                      className="flex items-center gap-2.5 px-3 pl-10 py-1.5 hover:bg-zinc-50 dark:hover:bg-white/ cursor-pointer transition-colors group"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedImportFiles.has(file.path)}
                                        onChange={() => toggleImportFile(file.path)}
                                        className="w-3.5 h-3.5 rounded accent-purple-500 cursor-pointer flex-shrink-0"
                                      />
                                      <span className="text-[13.4px] text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors truncate min-w-0 flex-grow" title={file.path}>{file.path}</span>
                                      <span className="text-[10px] text-zinc-400 flex-shrink-0">{formatFileSize(file.size)}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Restore button */}
                      <button
                        onClick={() => { setActiveModal('confirmImport'); setActionError(''); setActionSuccess(''); }}
                        disabled={backupImporting || selectedImportFiles.size === 0}
                        className="w-full btn-primary-unified py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        Restore Selected ({selectedImportFiles.size} files)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Server System Control card */}
              <div className="card-unified bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-4 sm:p-6 space-y-4 col-span-1 md:col-span-2">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider border-b border-zinc-200 dark:border-white/5 pb-2">Server Maintenance & System Control</h3>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="text-left space-y-1">
                    <span className="text-md font-semibold text-zinc-800 dark:text-white flex items-center gap-2">
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

          {(activeTab === 'Helpdesk' || activeTab === 'Subscriptions' || activeTab === 'Billing') && (
            <motion.div
              key="Subscriptions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-left"
            >
              <div className="card-unified bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-zinc-800 dark:text-white flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-accent-purple" />
                    Helpdesk Campus Subscriptions
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Manage self-hosted helpdesk campus subscriptions and billing status.
                  </p>
                </div>

                {selfHostLoading ? (
                  <div className="py-12 text-center text-sm text-zinc-550 font-bold flex flex-col items-center gap-2">
                    <Activity className="w-6 h-6 text-accent-purple animate-spin" />
                    <span>Loading campus subscriptions database...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-zinc-200 dark:border-white/5 rounded-xl bg-white dark:bg-zinc-950">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          <th className="px-6 py-4">Campus Code</th>
                          <th className="px-6 py-4">Active Admins</th>
                          <th className="px-6 py-4">Open Tickets</th>
                          <th className="px-6 py-4">Monthly Rate</th>
                          <th className="px-6 py-4">License Expiry</th>
                          <th className="px-6 py-4">License Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-white/5 text-sm text-zinc-700 dark:text-zinc-355">
                        {selfHostSubscriptions.map(sub => (
                          <tr key={sub.school} className="hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                            <td className="px-6 py-4 font-bold text-zinc-800 dark:text-white">{sub.school}</td>
                            <td className="px-6 py-4 font-mono font-bold text-accent-blue">{sub.activeAdmins}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${sub.activeTickets > 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-zinc-500/10 text-zinc-500 border border-zinc-550/20'}`}>
                                {sub.activeTickets} open
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-zinc-800 dark:text-zinc-200">₹{sub.activeAdmins * 100}/mo</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="date"
                                  value={sub.expiresAt ? new Date(sub.expiresAt).toISOString().split('T')[0] : ''}
                                  onChange={(e) => handleUpdateSelfHostExpiry(sub.school, e.target.value)}
                                  className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-accent-purple cursor-pointer"
                                />
                                {sub.expiresAt && new Date(sub.expiresAt) < new Date() && (
                                  <span className="text-[10px] font-bold text-red-400 uppercase bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded animate-pulse">
                                    Expired
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sub.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                {sub.status === 'ACTIVE' ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => handleToggleSelfHostSubscription(sub.school, sub.status)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${sub.status === 'ACTIVE'
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                                  }`}
                              >
                                {sub.status === 'ACTIVE' ? 'Suspend Access' : 'Reactivate School'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ALL MODALS RENDER */}
      <AnimatePresence>
        {/* LOG DETAILS INSPECTOR MODAL */}
        {selectedLogDetails && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xl card-unified space-y-4 relative overflow-hidden bg-white dark:bg-zinc-950 text-left border border-zinc-200 dark:border-white/10 p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-accent-purple" />
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Server Log Payload Inspector</h3>
                </div>
                <button
                  onClick={() => setSelectedLogDetails(null)}
                  className="p-1.5 rounded-lg bg-zinc-200 dark:bg-white/5 hover:scale-110 hover:bg-red-300 dark:hover:bg-red-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Info summary */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-white/5">
                  <div>
                    <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Timestamp</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">{new Date(selectedLogDetails.timestamp).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-semibold block text-[10px] uppercase">Severity Level</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase mt-0.5 ${selectedLogDetails.level === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      selectedLogDetails.level === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        selectedLogDetails.level === 'alarm' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                      {selectedLogDetails.level || 'INFO'}
                    </span>
                  </div>
                </div>

                {/* Log message */}
                <div className="space-y-1">
                  <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Log Message</span>
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/10 rounded-xl font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed break-words">
                    {selectedLogDetails.message}
                  </div>
                </div>

                {/* HTTP Metadata Cards if available */}
                {selectedLogDetails.metadata && Object.keys(selectedLogDetails.metadata).length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">HTTP Request Breakdown</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      {selectedLogDetails.metadata.method && (
                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-xl">
                          <span className="text-zinc-400 text-[10px] block uppercase font-bold">Method</span>
                          <span className="font-extrabold text-accent-blue">{selectedLogDetails.metadata.method}</span>
                        </div>
                      )}
                      {selectedLogDetails.metadata.status && (
                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-xl">
                          <span className="text-zinc-400 text-[10px] block uppercase font-bold font-sans">Status</span>
                          <span className={`font-extrabold ${selectedLogDetails.metadata.status >= 400 ? 'text-red-400' : 'text-emerald-400'}`}>{selectedLogDetails.metadata.status}</span>
                        </div>
                      )}
                      {selectedLogDetails.metadata.ip && (
                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-xl">
                          <span className="text-zinc-400 text-[10px] block uppercase font-bold font-sans">IP Address</span>
                          <span className="font-extrabold text-zinc-700 dark:text-zinc-300 truncate block">{selectedLogDetails.metadata.ip}</span>
                        </div>
                      )}
                      {selectedLogDetails.metadata.durationMs !== undefined && (
                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-xl">
                          <span className="text-zinc-400 text-[10px] block uppercase font-bold font-sans">Latency</span>
                          <span className="font-extrabold text-accent-purple">{selectedLogDetails.metadata.durationMs}ms</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw JSON Payload block */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Raw JSON Record</span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(selectedLogDetails, null, 2))}
                      className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer flex items-center gap-1.5 transition"
                    >
                      {copiedKey === JSON.stringify(selectedLogDetails, null, 2) ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy JSON
                    </button>
                  </div>
                  <pre className="p-3 bg-zinc-950 text-emerald-400 border border-zinc-800 rounded-xl font-mono text-[11px] max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                    {JSON.stringify(selectedLogDetails, null, 2)}
                  </pre>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md card-unified space-y-5 relative overflow-hidden bg-white dark:bg-zinc-950 text-left border border-zinc-200 dark:border-white/5"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/2 to-transparent pointer-events-none" />

              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-white/5 pb-3">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">
                  {activeModal === 'editPlan' && 'Edit User Plan'}
                  {activeModal === 'editBlog' && (selectedBlogId ? 'Edit Blog Post' : 'Create Blog Post')}
                  {activeModal === 'editChangelog' && (selectedChangelogId ? 'Edit Release Note' : 'Create Release Note')}
                  {activeModal === 'editProfile' && 'Edit Master Profile'}
                  {activeModal === 'changePwd' && 'Change Master Password'}
                  {activeModal === 'mfaSetup' && 'Configure 2FA Authenticator'}
                  {activeModal === 'disableMfa' && 'Disable 2FA Authenticator'}
                  {activeModal === 'rebootServer' && 'Reboot Application Server'}
                  {activeModal === 'confirmImport' && 'Confirm Backup Restore'}
                  {activeModal === 'extendLicense' && 'Extend Self-Hosted License'}
                </h3>
                <button
                  onClick={() => { setActiveModal(null); setActionError(''); setActionSuccess(''); }}
                  className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-900 hover:scale-110 hover:bg-red-200 dark:hover:bg-red-800 hover:text-zinc-850 dark:hover:text-white text-zinc-650 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white transition-colors"
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

              {/* EXTEND LICENSE MODAL CONTENT */}
              {activeModal === 'extendLicense' && extendingLicense && (
                <form onSubmit={handleExtendLicenseSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">Client Name / Licensee</label>
                    <input
                      type="text"
                      value={extendingLicense.licensee || extendingLicense.clientName || ''}
                      readOnly
                      className="input-unified bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-zinc-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">Current Expiration Date</label>
                    <input
                      type="text"
                      value={new Date(extendingLicense.expiresAt).toLocaleDateString()}
                      readOnly
                      className="input-unified bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-zinc-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">Extend Validity Period</label>
                    <CustomSelect
                      value={extendDurationDays}
                      onChange={(val) => setExtendDurationDays(val)}
                      options={[
                        { value: '30', label: '30 Days' },
                        { value: '90', label: '90 Days' },
                        { value: '365', label: '1 Year (365 Days)' },
                        { value: '3650', label: 'Lifetime (10 Years)' }
                      ]}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setActiveModal(null); setActionError(''); setActionSuccess(''); }}
                      className="w-1/2 btn-secondary-unified py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-1/2 btn-primary-unified py-2 flex items-center justify-center gap-1.5"
                    >
                      Confirm Extension
                    </button>
                  </div>
                </form>
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
                    <CustomSelect
                      value={editPlanType}
                      onChange={(val) => setEditPlanType(val)}
                      options={[
                        { value: 'unpaid', label: 'Unpaid / Free Trial' },
                        { value: 'premium', label: 'Monthly Premium' },
                        { value: 'licensed', label: 'Self-Hosted License' }
                      ]}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase block pl-1">Subscription Status</label>
                    <CustomSelect
                      value={editPlanStatus}
                      onChange={(val) => setEditPlanStatus(val)}
                      options={[
                        { value: 'none', label: 'None / Idle' },
                        { value: 'active', label: 'Active' },
                        { value: 'canceled', label: 'Canceled' },
                        { value: 'past_due', label: 'Past Due' }
                      ]}
                    />
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

              {/* EDIT CHANGELOG MODAL CONTENT */}
              {activeModal === 'editChangelog' && (
                <form onSubmit={handleChangelogFormSubmit} className="space-y-4 overflow-y-auto max-h-[75vh] pr-1 text-left">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-zinc-500 uppercase block pl-1">Version tag *</label>
                      <input
                        type="text"
                        value={changelogVersion}
                        onChange={(e) => setChangelogVersion(e.target.value)}
                        placeholder="v2.1.0"
                        className="input-unified"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[13px] font-bold text-zinc-500 uppercase block pl-1">Release Date / Label *</label>
                      <input
                        type="text"
                        value={changelogDate}
                        onChange={(e) => setChangelogDate(e.target.value)}
                        placeholder="December 2025"
                        className="input-unified"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-500 uppercase block pl-1">Release Summary</label>
                    <input
                      type="text"
                      value={changelogDescription}
                      onChange={(e) => setChangelogDescription(e.target.value)}
                      placeholder="Major Cloud Sync & Security Release"
                      className="input-unified"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-zinc-500 uppercase block pl-1">Bullet Points (One per line)</label>
                    <textarea
                      value={changelogItemsText}
                      onChange={(e) => setChangelogItemsText(e.target.value)}
                      rows={5}
                      placeholder={"Added cloud backup support\nAdded 2FA authentication\nFixed UI alignment issue"}
                      className="input-unified font-mono text-xs"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                    <div className="text-left">
                      <span className="text-sm font-semibold text-zinc-800 dark:text-white block">Mark as Major Release</span>
                      <span className="text-xs text-zinc-500">Highlight this release with special badge styling</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={changelogIsMajor}
                      onChange={(e) => setChangelogIsMajor(e.target.checked)}
                      className="w-4 h-4 rounded text-accent-purple focus:ring-accent-purple cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="w-1/2 btn-secondary-unified py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-1/2 btn-primary-unified py-2 flex items-center justify-center gap-1.5"
                    >
                      {selectedChangelogId ? 'Update Release' : 'Publish Release'}
                    </button>
                  </div>
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
                      <CustomSelect
                        value={blogCategory}
                        onChange={(val) => setBlogCategory(val)}
                        options={[
                          { value: 'Guides', label: 'Guides' },
                          { value: 'Product', label: 'Product Updates' },
                          { value: 'Security', label: 'Security' },
                          { value: 'General', label: 'General' }
                        ]}
                      />
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
                    <div className="grid grid-cols-5 gap-2 bg-zinc-200 dark:bg-zinc-900 p-2.5 rounded-xl border border-white/5">
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
                      <p className="text-xs font-mono font-bold text-zinc-900 dark:text-white tracking-widest mt-1 flex items-center justify-center gap-2">
                        {temp2faSecret}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(temp2faSecret)}
                          className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-sans font-semibold rounded-md border border-zinc-200 dark:border-white/10 transition-all cursor-pointer flex items-center gap-1 text-zinc-700 dark:text-zinc-200"
                        >
                          {copiedKey === temp2faSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedKey === temp2faSecret ? 'Copied!' : 'Copy Key'}
                        </button>
                      </p>

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

              {/* CONFIRM IMPORT MODAL CONTENT */}
              {activeModal === 'confirmImport' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
                    <div>
                      <p className="font-bold text-zinc-800 dark:text-white">Overwrite Warning</p>
                      <p className="text-[11.5px] text-zinc-500 mt-0.5">
                        This will restore <strong className="text-amber-400">{selectedImportFiles.size} file{selectedImportFiles.size !== 1 ? 's' : ''}</strong> from the backup and <strong className="text-amber-400">overwrite</strong> any existing files at their original locations on the server.
                      </p>
                    </div>
                  </div>

                  {selectedImportFiles.size > 0 && selectedImportFiles.size <= 20 && (
                    <div className="max-h-[150px] overflow-y-auto border border-zinc-200 dark:border-white/5 rounded-lg p-2 space-y-0.5">
                      {Array.from(selectedImportFiles).map(fp => (
                        <p key={fp} className="text-[10px] text-zinc-500 font-mono truncate" title={fp}>{fp}</p>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-zinc-400">
                    It is strongly recommended to export a fresh backup before proceeding. This action cannot be undone.
                  </p>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="btn-secondary-unified px-4 py-2 text-xs cursor-pointer"
                      disabled={backupImporting}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBackupRestore}
                      className="btn-danger-unified px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer"
                      disabled={backupImporting}
                    >
                      {backupImporting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      {backupImporting ? 'Restoring...' : `Restore ${selectedImportFiles.size} Files`}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESET USER PASSWORD MODAL */}
      <AnimatePresence>
        {resetModalOpen && resetTargetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-5 text-left"
            >
              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2 text-zinc-800 dark:text-white font-bold text-base">
                  <Key className="w-5 h-5 text-emerald-400" />
                  <span>Reset User Password</span>
                </div>
                <button
                  onClick={() => setResetModalOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/80 rounded-xl border border-zinc-200 dark:border-white/5 space-y-1">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Target Account</p>
                <p className="text-sm font-bold text-zinc-800 dark:text-white">{resetTargetUser.name || resetTargetUser.username}</p>
                <p className="text-xs font-mono text-emerald-400">@{resetTargetUser.username} • {resetTargetUser.source || resetTargetUser.school || 'Campus'}</p>
              </div>

              <form onSubmit={handleExecutePasswordReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">New Account Password</label>
                  <input
                    type="password"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-mono text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required
                  />
                  <p className="text-[11px] text-zinc-400">New password will be encrypted with bcrypt before being saved.</p>
                </div>

                {resetSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>{resetSuccessMsg}</span>
                  </div>
                )}

                {resetErrorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{resetErrorMsg}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {resetSubmitting ? <Activity className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    <span>Encrypt & Save Password</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
