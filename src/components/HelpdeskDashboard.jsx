import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    Clock,
    FileText,
    Download,
    PlusCircle,
    Search,
    Send,
    X,
    AlertCircle,
    Key,
    User,
    Users,
    UserCheck,
    Edit3,
    LogOut,
    Activity,
    MapPin,
    Server,
    Settings,
    Plus,
    Wrench,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Bell,
    Menu,
    Check,
    CreditCard,
    Shield,
    Sun,
    Moon
} from 'lucide-react';
import { useTheme } from '../useTheme';

const API_BASE_URL = '/api/v1';
const DEFAULT_SCHOOL_CODE = import.meta.env.VITE_SCHOOL_CODE;

// Pre-filled school complaint templates for quick testing
const SCHOOL_TEMPLATES = [
    {
        title: 'Projector Not Woking',
        category: 'Projectors',
        subject: 'Projector not working',
        floor: '3rd Floor',
        roomNumber: 'Science Lab 1',
        description: 'The overhead projector not working '
    },
    {
        title: 'CCTV Not Working',
        category: 'CCTV',
        subject: 'CCTV not working',
        floor: '5th Floor',
        roomNumber: 'Main Corridor East',
        description: 'CCTV not working'
    },
    {
        title: 'CCTV Recording Checking',
        category: 'CCTV',
        subject: 'CCTV camera recording check',
        floor: 'Ground Floor',
        roomNumber: 'Main Gate',
        description: 'CCTV camera recording check'
    },
    {
        title: 'Edusprint Login Error',
        category: 'Edusprint',
        subject: 'Cannot login to Edusprint portal',
        floor: '2nd Floor',
        roomNumber: 'Staff Room A',
        description: 'Database connection timeout on portal.'
    },
    {
        title: 'Office Printer Jam',
        category: 'Printer',
        floor: 'Ground Floor',
        roomNumber: 'Main Office Desk',
        subject: 'Office printer paper jam error 501',
        description: 'Office printer paper jam error 501'
    },
    {
        title: 'PC Boot Failure',
        category: 'PC Hardware',
        floor: '3rd Floor',
        roomNumber: 'Computer Lab 2',
        subject: 'Desktop PC stuck in boot loop',
        description: 'Desktop PC stuck in boot loop'
    },
    {
        title: 'Biometric Scanner Down',
        category: 'Biometric',
        floor: 'Ground Floor',
        roomNumber: 'Main School Entrance',
        subject: 'Biometric device not scanning fingerprint',
        description: 'Biometric device not scanning fingerprint'
    },
    {
        title: 'Parent ID Card Request',
        category: 'Student ID card',
        floor: 'NIL',
        roomNumber: 'Admissions Desk',
        subject: 'Duplicate Student ID card reprint request',
        description: 'Duplicate Student ID card reprint request'
    },
    {
        title: 'Intercom Line Static',
        category: 'Intercom',
        floor: '6th Floor',
        roomNumber: 'Chemistry Lab Admin',
        subject: 'Intercom phone line has heavy static noise',
        description: 'Intercom phone line has heavy static noise'
    },
    {
        title: 'Windows Activation Alert',
        category: 'OS',
        floor: '4th Floor',
        roomNumber: 'Library Reference PC',
        subject: 'Library PC showing Windows Activation license warning',
        description: 'Library PC showing Windows Activation license warning'
    },
    {
        title: 'UPS Not Working',
        category: 'Other',
        floor: '4th Floor',
        roomNumber: 'Computer Lab 2',
        subject: 'UPS not working',
        description: 'UPS not working'
    }
];

const CATEGORIES = [
    'PC Hardware',
    'CCTV',
    'Projectors',
    'Printer',
    'Software',
    'OS',
    'Intercom',
    'Biometric',
    'Student ID card',
    'Edusprint',
    'Other'
];

const FLOORS = [
    'Ground Floor',
    '1st Floor',
    '2nd Floor',
    '3rd Floor',
    '4th Floor',
    '5th Floor',
    '6th Floor',
    '7th Floor',
    'NIL'
];

export default function HelpdeskDashboard() {
    const SCHOOLS = (import.meta.env.VITE_SCHOOLS || 'nhsst,nhisr,nhssr,nhitm,nhssvl,nhssa,nhpsasec19,nhpsasec3,dmce,nhpsp').split(',').map(s => s.trim().toUpperCase());
    const { theme, toggleTheme } = useTheme();

    // Auth Session State
    const [session, setSession] = useState(null);
    const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '', school: DEFAULT_SCHOOL_CODE });
    const [loginError, setLoginError] = useState('');
    const [selectedSchool, setSelectedSchool] = useState(DEFAULT_SCHOOL_CODE);
    const [defaultCreds, setDefaultCreds] = useState(null);

    // Fetch dynamic credentials configuration
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/config`);
                const data = await res.json();
                setDefaultCreds(data);
            } catch (err) {
                console.error('Failed to load credentials config:', err);
            }
        };
        fetchConfig();
    }, []);

    // Live Clock State
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Dashboard Data State
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, closed: 0, avgResolutionMinutes: 0 });
    const [tickets, setTickets] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPolling, setIsPolling] = useState(false);
    const [lastPolledAt, setLastPolledAt] = useState(null);
    const [pollCountdown, setPollCountdown] = useState(10);
    const newTicketIdsRef = React.useRef(new Set());
    const [newTicketIds, setNewTicketIds] = useState(new Set());
    const silentPollRef = React.useRef(null);

    // Active Admin Tab
    const [activeTab, setActiveTab] = useState('tickets');

    // Custom Admin Tags
    const [tags, setTags] = useState([]);
    const [newTagInput, setNewTagInput] = useState('');

    // Bot testing status
    const [isTestingBot, setIsTestingBot] = useState(false);
    const [botTestResult, setBotTestResult] = useState(null);

    // Filter & Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [floorFilter, setFloorFilter] = useState('ALL');

    // Modals
    const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
    const [selectedTicketToClose, setSelectedTicketToClose] = useState(null);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [templatePage, setTemplatePage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(3);

    // Subscription states
    const [isCampusSuspended, setIsCampusSuspended] = useState(false);
    const [isLicenseExpired, setIsLicenseExpired] = useState(false);
    const [currentSubscription, setCurrentSubscription] = useState({ status: 'ACTIVE', expiresAt: null });
    const [masterSubscriptions, setMasterSubscriptions] = useState([]);
    const [masterLoading, setMasterLoading] = useState(false);

    // Fetch Master Subscriptions for Super Admin Billing View
    useEffect(() => {
        if (session && session.role === 'SUPER_ADMIN' && activeTab === 'billing') {
            const fetchMasterSubscriptions = async () => {
                try {
                    setMasterLoading(true);
                    const res = await fetch(`${API_BASE_URL}/master/subscriptions`, {
                        headers: { 'x-caller-role': 'SUPER_ADMIN' }
                    });
                    const data = await res.json();
                    if (data.success) {
                        setMasterSubscriptions(data.subscriptions || []);
                    }
                } catch (err) {
                    console.error('Failed to fetch master subscriptions:', err);
                } finally {
                    setMasterLoading(false);
                }
            };
            fetchMasterSubscriptions();
        }
    }, [session, activeTab]);

    // Profile Edit State
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [profileFullNameInput, setProfileFullNameInput] = useState('');
    const [profileUpdating, setProfileUpdating] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    // Sync active subscription details into stored session cache
    useEffect(() => {
        if (session && currentSubscription) {
            const stored = localStorage.getItem('it_support_session');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (JSON.stringify(parsed.subscription) !== JSON.stringify(currentSubscription)) {
                        parsed.subscription = currentSubscription;
                        localStorage.setItem('it_support_session', JSON.stringify(parsed));
                    }
                } catch (e) { }
            }
        }
    }, [currentSubscription, session]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setItemsPerPage(1);
            } else if (window.innerWidth < 1024) {
                setItemsPerPage(2);
            } else {
                setItemsPerPage(3);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const maxPage = Math.max(0, Math.ceil(SCHOOL_TEMPLATES.length / itemsPerPage) - 1);
        if (templatePage > maxPage) {
            setTemplatePage(maxPage);
        }
    }, [itemsPerPage, templatePage]);

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [latestToast, setLatestToast] = useState(null);
    const prevTicketsRef = React.useRef([]);

    // Settings Form State
    const [settingsForm, setSettingsForm] = useState({
        telegramEnabled: false,
        telegramBotToken: '',
        telegramChatId: '',
        whatsappEnabled: false,
        whatsappPhone: '',
        whatsappApiKey: ''
    });
    const [browserNotificationPermission, setBrowserNotificationPermission] = useState('default');
    const [activeGuideTab, setActiveGuideTab] = useState('telegram');

    // Retrieve stored notifications settings on mount
    useEffect(() => {
        const stored = localStorage.getItem('it_support_notifications_config');
        if (stored) {
            try {
                const config = JSON.parse(stored);
                setSettingsForm({
                    telegramEnabled: !!config.telegramEnabled,
                    telegramBotToken: config.telegramBotToken || '',
                    telegramChatId: config.telegramChatId || '',
                    whatsappEnabled: !!config.whatsappEnabled,
                    whatsappPhone: config.whatsappPhone || '',
                    whatsappApiKey: config.whatsappApiKey || ''
                });
            } catch (e) {
                console.error('Failed to parse notifications settings:', e);
            }
        }
        if ('Notification' in window) {
            setBrowserNotificationPermission(Notification.permission);
        }

        // Fetch custom tags
        const fetchTags = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/tickets/tags`);
                const data = await res.json();
                if (data.success) {
                    setTags(data.tags || []);
                }
            } catch (err) {
                console.error('Failed to fetch tags:', err);
            }
        };

        // Fetch server default notification settings
        const fetchDefaultSettings = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/tickets/settings/defaults`);
                const data = await res.json();
                if (data.success) {
                    setSettingsForm(prev => {
                        const storedRaw = localStorage.getItem('it_support_notifications_config');
                        const stored = storedRaw ? JSON.parse(storedRaw) : {};
                        return {
                            telegramEnabled: stored.telegramEnabled !== undefined ? !!stored.telegramEnabled : (!!data.defaults.telegramBotToken),
                            telegramBotToken: stored.telegramBotToken || data.defaults.telegramBotToken || '',
                            telegramChatId: stored.telegramChatId || data.defaults.telegramChatId || '',
                            whatsappEnabled: stored.whatsappEnabled !== undefined ? !!stored.whatsappEnabled : (!!data.defaults.whatsappPhone),
                            whatsappPhone: stored.whatsappPhone || data.defaults.whatsappPhone || '',
                            whatsappApiKey: stored.whatsappApiKey || data.defaults.whatsappApiKey || ''
                        };
                    });
                }
            } catch (err) {
                console.error('Failed to fetch default settings:', err);
            }
        };

        fetchTags();
        fetchDefaultSettings();
    }, []);

    // Save Notifications Config
    const handleSaveSettings = (e) => {
        e.preventDefault();
        localStorage.setItem('it_support_notifications_config', JSON.stringify(settingsForm));
        alert('Notification settings saved successfully!');
    };

    // Send Test Message to verify configuration in real time with progress and exact errors
    const handleSendTestMessage = async () => {
        setIsTestingBot(true);
        setBotTestResult(null);
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/send-notification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegramEnabled: settingsForm.telegramEnabled,
                    telegramBotToken: settingsForm.telegramBotToken,
                    telegramChatId: settingsForm.telegramChatId,
                    whatsappEnabled: settingsForm.whatsappEnabled,
                    whatsappPhone: settingsForm.whatsappPhone,
                    whatsappApiKey: settingsForm.whatsappApiKey,
                    title: 'Test Bot Alert 🤖',
                    message: `Congratulations! Your IT Helpdesk notification bot integration is working in real time! (Time: ${new Date().toLocaleTimeString()})`,
                    alertType: 'GENERAL',
                    school: session?.role === 'SUPER_ADMIN' ? selectedSchool : (session?.school || 'NHSST')
                })
            });
            const result = await res.json();
            
            const telegramAttempted = settingsForm.telegramEnabled;
            const whatsappAttempted = settingsForm.whatsappEnabled;

            let isAnySuccess = false;
            let report = {};

            if (telegramAttempted) {
                report.telegram = {
                    sent: result.telegramSent,
                    error: result.telegramError || 'Unknown connection error'
                };
                if (result.telegramSent) isAnySuccess = true;
            }
            if (whatsappAttempted) {
                report.whatsapp = {
                    sent: result.whatsappSent,
                    error: result.whatsappError || 'Unknown connection error'
                };
                if (result.whatsappSent) isAnySuccess = true;
            }

            if (!telegramAttempted && !whatsappAttempted) {
                report.general = 'Neither Telegram nor WhatsApp alerts are checked/enabled in settings.';
            }

            setBotTestResult({
                success: isAnySuccess,
                ...report
            });
        } catch (err) {
            console.error('Test message failed:', err);
            setBotTestResult({
                success: false,
                general: `Network error: ${err.message}`
            });
        } finally {
            setIsTestingBot(false);
        }
    };

    // Request Notification permission
    const handleRequestNotificationPermission = () => {
        if (!('Notification' in window)) {
            alert('This browser does not support HTML5 desktop notifications.');
            return;
        }
        Notification.requestPermission().then(permission => {
            setBrowserNotificationPermission(permission);
        });
    };

    // Trigger Mobile & Browser Alert Dispatcher
    const triggerNotificationAlert = async (title, message, alertType, ticket) => {
        let mobileAlertSent = false;
        const activeSchool = session?.role === 'SUPER_ADMIN' ? selectedSchool : (session?.school || 'NHSST');

        if (settingsForm.telegramEnabled || settingsForm.whatsappEnabled) {
            try {
                const res = await fetch(`${API_BASE_URL}/tickets/send-notification`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        telegramEnabled: settingsForm.telegramEnabled,
                        telegramBotToken: settingsForm.telegramBotToken,
                        telegramChatId: settingsForm.telegramChatId,
                        whatsappEnabled: settingsForm.whatsappEnabled,
                        whatsappPhone: settingsForm.whatsappPhone,
                        whatsappApiKey: settingsForm.whatsappApiKey,
                        title,
                        message,
                        alertType: alertType || 'GENERAL',
                        school: activeSchool,
                        ticket: ticket || null
                    })
                });
                const result = await res.json();
                if (result.telegramSent || result.whatsappSent) {
                    mobileAlertSent = true;
                }
            } catch (err) {
                console.error('Server-side notification request failed:', err);
            }
        }

        if (!mobileAlertSent && 'Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    body: message.replace(/<[^>]*>/g, ''),
                    icon: '/favicon.ico'
                });
            } catch (e) {
                console.error('Desktop notification failed:', e);
            }
        }
    };

    // Live Background Polling (Admins only, every 10 seconds)
    useEffect(() => {
        if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) return;

        let countdown = 10;
        setPollCountdown(10);

        const countdownInterval = setInterval(() => {
            countdown -= 1;
            if (countdown < 1) {
                countdown = 10;
                setPollCountdown(10);
            } else {
                setPollCountdown(countdown);
            }
        }, 1000);

        const pollInterval = setInterval(() => {
            silentPollRef.current?.();
            countdown = 10;
            setPollCountdown(10);
        }, 10000);

        return () => {
            clearInterval(pollInterval);
            clearInterval(countdownInterval);
        };
    }, [session, selectedSchool]);

    // Diffs & Notifications Engine
    useEffect(() => {
        if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) return;

        if (prevTicketsRef.current.length === 0) {
            prevTicketsRef.current = tickets;
            return;
        }

        const newAlerts = [];

        tickets.forEach(ticket => {
            const exists = prevTicketsRef.current.some(t => t.id === ticket.id);
            if (!exists) {
                const title = 'New Complaint Lodged';
                const message = `Ticket ${ticket.token} (${ticket.category}) created by ${ticket.userName} on ${ticket.floor} in ${ticket.roomNumber}. Subject: "${ticket.subject}"`;
                newAlerts.push({
                    id: `new-${ticket.id}-${Date.now()}`,
                    ticketId: ticket.id,
                    ticket: ticket,
                    token: ticket.token,
                    type: 'NEW_TICKET',
                    title,
                    message,
                    timestamp: new Date(),
                    isRead: false
                });
            } else {
                const oldTicket = prevTicketsRef.current.find(t => t.id === ticket.id);
                if (oldTicket && oldTicket.status !== ticket.status) {
                    let title = 'Ticket Status Updated';
                    let message = `Ticket ${ticket.token} changed status to ${ticket.status}.`;
                    let type = 'STATUS_CHANGE';

                    if (ticket.status === 'CLOSED') {
                        title = 'Ticket Resolved';
                        message = `Ticket ${ticket.token} was CLOSED by ${ticket.closedBy || 'IT Admin'}. Action: "${ticket.adminRemark || 'No remarks provided'}"`;
                        type = 'CLOSED';
                    } else if (ticket.status === 'IN_PROGRESS') {
                        message = `Ticket ${ticket.token} is now IN PROGRESS. Action: "${ticket.adminRemark || 'No remark provided'}"`;
                    }

                    newAlerts.push({
                        id: `status-${ticket.id}-${ticket.status}-${Date.now()}`,
                        ticketId: ticket.id,
                        ticket: ticket,
                        token: ticket.token,
                        type,
                        title,
                        message,
                        timestamp: new Date(),
                        isRead: false
                    });
                }
            }
        });

        if (newAlerts.length > 0) {
            setNotifications(prev => [...newAlerts, ...prev]);
            setLatestToast(newAlerts[0]);
            newAlerts.forEach(alert => {
                triggerNotificationAlert(alert.title, alert.message, alert.type, alert.ticket);
            });
        }

        prevTicketsRef.current = tickets;
    }, [tickets, session]);

    // Toast auto-dismiss
    useEffect(() => {
        if (!latestToast) return;
        const timer = setTimeout(() => {
            setLatestToast(null);
        }, 4000);
        return () => clearTimeout(timer);
    }, [latestToast]);

    const [selectedTicketToView, setSelectedTicketToView] = useState(null);
    const [adminRemark, setAdminRemark] = useState('');

    // Export Report Modal States
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportDateType, setExportDateType] = useState('ALL');
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [exportStatus, setExportStatus] = useState('ALL');
    const [exportCategory, setExportCategory] = useState('ALL');
    const [exportFloor, setExportFloor] = useState('ALL');

    // Forms
    const [newTicketForm, setNewTicketForm] = useState({
        userName: '',
        userPhone: '',
        userEmail: '',
        category: 'PC Hardware',
        floor: 'Ground Floor',
        roomNumber: '',
        subject: '',
        description: '',
        adminTag: 'IT Support'
    });

    const [newUserForm, setNewUserForm] = useState({
        fullName: '',
        username: '',
        password: '',
        role: 'USER',
        school: ''
    });

    const [userFormSuccess, setUserFormSuccess] = useState('');
    const [userFormError, setUserFormError] = useState('');

    // Restore login session from localStorage
    useEffect(() => {
        const storedSession = localStorage.getItem('it_support_session');
        if (storedSession) {
            try {
                const parsed = JSON.parse(storedSession);
                setSession(parsed);
                if (parsed.subscription) {
                    setCurrentSubscription(parsed.subscription);
                }
            } catch (e) {
                localStorage.removeItem('it_support_session');
            }
        }
    }, []);



    // Fetch Dashboard Stats & User Accounts (FULL — shows loading spinner)
    const fetchDashboardData = async () => {
        if (!session) return;
        const activeSchool = session.role === 'SUPER_ADMIN' ? selectedSchool : (session.school || 'NHSST');
        try {
            setLoading(true);
            const statsRes = await fetch(`${API_BASE_URL}/tickets/dashboard?username=${session.username}&role=${session.role}`, {
                headers: {
                    'x-school-key': activeSchool,
                    'x-caller-role': session.role
                }
            });
            const statsResult = await statsRes.json();
            if (statsRes.status === 403 && statsResult.isSuspended) {
                setIsCampusSuspended(true);
                setIsLicenseExpired(!!statsResult.isExpired);
                return;
            }
            if (statsResult.success) {
                setStats(statsResult.stats);
                setTickets(statsResult.tickets);
                if (statsResult.subscription) {
                    setCurrentSubscription(statsResult.subscription);
                }
                setIsCampusSuspended(false);
                setIsLicenseExpired(false);
            }

            if (session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') {
                const usersRes = await fetch(`${API_BASE_URL}/auth/users`, {
                    headers: {
                        'x-school-key': activeSchool,
                        'x-caller-role': session.role
                    }
                });
                const usersResult = await usersRes.json();
                if (usersResult.success) {
                    setUsers(usersResult.data);
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Silent background poll — no loading spinner, only animates new entries
    const fetchDashboardDataSilent = async () => {
        if (!session) return;
        const activeSchool = session.role === 'SUPER_ADMIN' ? selectedSchool : (session.school || 'NHSST');
        try {
            setIsPolling(true);
            const statsRes = await fetch(`${API_BASE_URL}/tickets/dashboard?username=${session.username}&role=${session.role}`, {
                headers: {
                    'x-school-key': activeSchool,
                    'x-caller-role': session.role
                }
            });
            const statsResult = await statsRes.json();
            if (statsRes.status === 403 && statsResult.isSuspended) {
                setIsCampusSuspended(true);
                setIsLicenseExpired(!!statsResult.isExpired);
                return;
            }
            if (statsResult.success) {
                const incomingTickets = statsResult.tickets || [];
                const existingIds = new Set(prevTicketsRef.current.map(t => t.id));
                const freshIds = new Set(
                    incomingTickets.filter(t => !existingIds.has(t.id)).map(t => t.id)
                );
                if (freshIds.size > 0) {
                    newTicketIdsRef.current = freshIds;
                    setNewTicketIds(new Set(freshIds));
                    setTimeout(() => {
                        newTicketIdsRef.current = new Set();
                        setNewTicketIds(new Set());
                    }, 3000);
                }
                setStats(statsResult.stats);
                setTickets(incomingTickets);
                if (statsResult.subscription) {
                    setCurrentSubscription(statsResult.subscription);
                }
                setIsCampusSuspended(false);
                setIsLicenseExpired(false);
                setLastPolledAt(new Date());
            }
        } catch (error) {
            console.error('Silent poll error:', error);
        } finally {
            setIsPolling(false);
        }
    };

    // Keep silentPollRef always pointing to latest version
    React.useEffect(() => {
        silentPollRef.current = fetchDashboardDataSilent;
    });

    // Manual refresh
    const handleManualRefresh = async () => {
        await fetchDashboardData();
        setLastPolledAt(new Date());
    };

    useEffect(() => {
        fetchDashboardData();
    }, [session, selectedSchool]);

    // Handle Login Submit
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginCredentials)
            });
            const result = await res.json();
            if (result.success) {
                localStorage.setItem('it_support_session', JSON.stringify(result.data));
                setSession(result.data);
                if (result.data.subscription) {
                    setCurrentSubscription(result.data.subscription);
                }
                if (result.data.role === 'SUPER_ADMIN') {
                    setSelectedSchool(result.data.school || DEFAULT_SCHOOL_CODE);
                }
                setLoginCredentials({ username: '', password: '', school: result.data.school || DEFAULT_SCHOOL_CODE });
            } else {
                setLoginError(result.error || 'Authentication failed.');
            }
        } catch (err) {
            setLoginError('Failed to communicate with authorization server.');
        }
    };

    // Handle Signout
    const handleSignOut = () => {
        localStorage.removeItem('it_support_session');
        setSession(null);
        setTickets([]);
        setUsers([]);
    };

    // Open Profile Edit Modal
    const openProfileModal = () => {
        if (session) {
            setProfileFullNameInput(session.fullName || '');
            setProfileError('');
            setProfileSuccess('');
            setIsProfileModalOpen(true);
        }
    };

    // Submit Profile Name Update
    const handleUpdateProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');
        if (!profileFullNameInput.trim()) {
            setProfileError('Display name cannot be empty.');
            return;
        }
        try {
            setProfileUpdating(true);
            const activeSchool = session.role === 'SUPER_ADMIN' ? selectedSchool : (session.school || 'NHSST');
            const res = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-school-key': activeSchool,
                    'x-caller-role': session.role
                },
                body: JSON.stringify({
                    username: session.username,
                    fullName: profileFullNameInput.trim(),
                    school: activeSchool
                })
            });
            const result = await res.json();
            if (result.success) {
                const updatedSession = { ...session, fullName: profileFullNameInput.trim() };
                setSession(updatedSession);
                localStorage.setItem('it_support_session', JSON.stringify(updatedSession));
                setProfileSuccess('Profile display name updated successfully!');
                fetchDashboardData();
                setTimeout(() => {
                    setIsProfileModalOpen(false);
                    setProfileSuccess('');
                }, 1000);
            } else {
                setProfileError(result.error || 'Failed to update profile.');
            }
        } catch (err) {
            setProfileError('Failed to communicate with authorization server.');
        } finally {
            setProfileUpdating(false);
        }
    };

    // Apply quick pre-filled templates
    const handleApplyTemplate = (tmpl) => {
        setNewTicketForm(prev => ({
            ...prev,
            category: tmpl.category,
            floor: tmpl.floor,
            roomNumber: tmpl.roomNumber,
            subject: tmpl.subject,
            description: tmpl.description
        }));
    };

    // Custom Tags handlers
    const handleAddTag = async (e) => {
        e.preventDefault();
        if (!newTagInput.trim()) return;
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tag: newTagInput })
            });
            const data = await res.json();
            if (data.success) {
                setTags(data.tags);
                setNewTagInput('');
                alert('Tag added successfully!');
            } else {
                alert(data.error || 'Failed to add tag.');
            }
        } catch (err) {
            console.error('Add tag error:', err);
        }
    };

    const handleDeleteTag = async (tagToDelete) => {
        if (!confirm(`Are you sure you want to delete the tag "${tagToDelete}"?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/tickets/tags/${encodeURIComponent(tagToDelete)}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setTags(data.tags);
                alert('Tag deleted successfully!');
            } else {
                alert(data.error || 'Failed to delete tag.');
            }
        } catch (err) {
            console.error('Delete tag error:', err);
        }
    };

    // Create New Ticket
    const handleCreateTicketSubmit = async (e) => {
        e.preventDefault();
        try {
            const ticketPayload = {
                ...newTicketForm,
                userName: newTicketForm.userName || session.fullName,
                reportedBy: session.username
            };

            const activeSchool = session.role === 'SUPER_ADMIN' ? selectedSchool : (session.school || 'NHSST');
            const res = await fetch(`${API_BASE_URL}/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-school-key': activeSchool
                },
                body: JSON.stringify(ticketPayload)
            });
            const result = await res.json();
            if (result.success) {
                alert(`Complaint Lodged Successfully! Token: ${result.data.token}`);
                setIsNewTicketOpen(false);
                setTemplatePage(0);
                setNewTicketForm({
                    userName: '',
                    userPhone: '',
                    userEmail: '',
                    category: 'PC Hardware',
                    floor: 'Ground Floor',
                    roomNumber: '',
                    subject: '',
                    description: '',
                    adminTag: tags[0] || 'IT Support'
                });
                fetchDashboardData();
            }
        } catch (err) {
            alert('Failed to submit complaint.');
        }
    };

    // Update Ticket Status
    const handleUpdateStatus = async (id, status) => {
        let remark = '';
        if (status === 'IN_PROGRESS') {
            const resultRemark = prompt('Please enter a technical remark to mark this ticket as In Progress:');
            if (resultRemark === null) return; // User cancelled
            if (!resultRemark.trim()) {
                alert('A technical remark is required to start this ticket.');
                return;
            }
            remark = resultRemark.trim();
        }
        try {
            const activeSchool = session.role === 'SUPER_ADMIN' ? selectedSchool : (session.school || 'NHSST');
            const res = await fetch(`${API_BASE_URL}/tickets/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-school-key': activeSchool
                },
                body: JSON.stringify({ status, adminRemark: remark })
            });
            const result = await res.json();
            if (result.success) {
                fetchDashboardData();
            } else {
                alert(result.error || 'Failed to update status.');
            }
        } catch (err) {
            alert('Failed to update ticket status.');
        }
    };

    // Close Ticket with Remarks
    const handleCloseTicketSubmit = async (e) => {
        e.preventDefault();
        if (!adminRemark.trim()) return alert('Please enter technical remarks.');

        try {
            const activeSchool = session.role === 'SUPER_ADMIN' ? selectedSchool : (session.school || 'NHSST');
            const res = await fetch(`${API_BASE_URL}/tickets/${selectedTicketToClose.id}/close`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-school-key': activeSchool
                },
                body: JSON.stringify({ adminRemark, closedBy: session.fullName })
            });
            const result = await res.json();
            if (result.success) {
                alert(`Ticket ${result.data.token} marked as CLOSED.`);
                setSelectedTicketToClose(null);
                setAdminRemark('');
                fetchDashboardData();
            }
        } catch (err) {
            alert('Failed to close ticket.');
        }
    };

    // Create New User Account
    const handleCreateUserSubmit = async (e) => {
        e.preventDefault();
        setUserFormSuccess('');
        setUserFormError('');
        try {
            const activeSchool = session.role === 'SUPER_ADMIN' ? (newUserForm.school || selectedSchool) : (session.school || 'NHSST');
            const res = await fetch(`${API_BASE_URL}/auth/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-school-key': activeSchool,
                    'x-caller-role': session.role
                },
                body: JSON.stringify(newUserForm)
            });
            const result = await res.json();
            if (result.success) {
                setUserFormSuccess(`Account registered for ${result.data.fullName} (${result.data.username})!`);
                setNewUserForm({ fullName: '', username: '', password: '', role: 'USER', school: '' });
                fetchDashboardData();
            } else {
                setUserFormError(result.error || 'Failed to create user account.');
            }
        } catch (err) {
            setUserFormError('Server communication error.');
        }
    };

    // Delete User Account
    const handleDeleteUser = async (userId, fullName) => {
        if (!confirm(`Are you sure you want to delete the account for ${fullName}?`)) return;
        try {
            const activeSchool = session.role === 'SUPER_ADMIN' ? selectedSchool : (session.school || 'NHSST');
            const res = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'x-school-key': activeSchool,
                    'x-caller-role': session.role,
                    'x-caller-username': session.username
                }
            });
            const result = await res.json();
            if (result.success) {
                alert(result.message || 'User deleted successfully.');
                fetchDashboardData();
            } else {
                alert(result.error || 'Failed to delete user.');
            }
        } catch (error) {
            alert('Error deleting user.');
        }
    };

    // Export CSV report
    const handleDownloadCSV = () => {
        const activeSchool = session.role === 'SUPER_ADMIN' ? selectedSchool : (session.school || 'NHSST');
        let csvUrl = `${API_BASE_URL}/tickets/reports/csv?status=${exportStatus}&school=${activeSchool}`;
        if (exportCategory !== 'ALL') csvUrl += `&category=${exportCategory}`;
        if (exportFloor !== 'ALL') csvUrl += `&floor=${exportFloor}`;

        let start = '';
        let end = '';

        if (exportDateType === 'TODAY') {
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            start = `${year}-${month}-${day}`;
            end = `${year}-${month}-${day}`;
        } else if (exportDateType === 'CUSTOM') {
            start = exportStartDate;
            end = exportEndDate;
        }

        if (start) csvUrl += `&startDate=${start}`;
        if (end) csvUrl += `&endDate=${end}`;

        window.open(csvUrl, '_blank');
        setIsExportModalOpen(false);
    };

    const openExportModal = () => {
        setExportStatus(statusFilter);
        setExportCategory(categoryFilter);
        setExportFloor(floorFilter);

        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        setExportStartDate(todayStr);
        setExportEndDate(todayStr);
        setExportDateType('ALL');
        setIsExportModalOpen(true);
    };

    // Filter tickets list locally
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
        const matchesCategory = categoryFilter === 'ALL' || ticket.category === categoryFilter;
        const matchesFloor = floorFilter === 'ALL' || ticket.floor === floorFilter;

        return matchesSearch && matchesStatus && matchesCategory && matchesFloor;
    });

    // Compute Floor stats dynamically
    const ticketsPerFloor = FLOORS.map(fl => {
        const openCount = tickets.filter(t => t.floor === fl && t.status !== 'CLOSED').length;
        return { floor: fl, openCount };
    });

    // Compute Category stats dynamically
    const ticketsPerCategory = CATEGORIES.map(cat => {
        const openCount = tickets.filter(t => t.category === cat && t.status !== 'CLOSED').length;
        return { category: cat, openCount };
    });

    // Quick Templates pagination variables
    const totalPages = Math.ceil(SCHOOL_TEMPLATES.length / itemsPerPage);
    const startIndex = templatePage * itemsPerPage;
    const visibleTemplates = SCHOOL_TEMPLATES.slice(startIndex, startIndex + itemsPerPage);

    const currentSchool = session ? (session.role === 'SUPER_ADMIN' ? selectedSchool : (session.school || 'NHSST')) : loginCredentials.school;

    // RENDER: LOGIN FORM — added dark variants for consistency
    if (!session) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-1">
                    <div className="flex justify-center items-center gap-2 text-indigo-600 dark:text-indigo-400">
                        <Server className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-wider font-mono">IT-Support</span>
                    </div>
                    <h2 className="mt-2 text-xl sm:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                        {currentSchool} IT Helpdesk
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Centralized maintenance for {currentSchool} assets
                    </p>
                </div>

                <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white dark:bg-slate-800/90 backdrop-blur-xs py-6 px-5 sm:py-8 sm:px-10 shadow-xl rounded-xl border border-slate-200 dark:border-slate-700">
                        <form className="space-y-5" onSubmit={handleLogin}>
                            {loginError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-500 rounded-lg flex items-start gap-2 text-sm text-red-700 dark:text-red-200">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <span>{loginError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Username
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 h-5 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={loginCredentials.username}
                                        onChange={e => setLoginCredentials({ ...loginCredentials, username: e.target.value })}
                                        placeholder="e.g. staff or admin"
                                        className="bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 block w-full pl-10 pr-3 py-2.5 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Password
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className="h-5 h-5 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={loginCredentials.password}
                                        onChange={e => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 block w-full pl-10 pr-3 py-2.5 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    School Code
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Server className="h-5 h-5 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={loginCredentials.school}
                                        onChange={e => setLoginCredentials({ ...loginCredentials, school: e.target.value })}
                                        placeholder="e.g. NHSST"
                                        className="bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 block w-full pl-10 pr-3 py-2.5 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                >
                                    Log In
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Suspended screen — added dark variants
    if (isCampusSuspended && session && session.role !== 'SUPER_ADMIN') {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-6 text-center font-sans">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 animate-fade-in">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-500 rounded-full flex items-center justify-center text-red-500 dark:text-red-400 mx-auto animate-pulse">
                        <Shield className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                            {isLicenseExpired ? 'Campus License Expired' : 'Campus Directory Suspended'}
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {isLicenseExpired ? (
                                <>
                                    Access to the <b className="text-slate-800 dark:text-white">{currentSchool}</b> database has expired.
                                    Please contact the Master Administrator at master@localhost for license renewal support.
                                </>
                            ) : (
                                <>
                                    Access to the <b className="text-slate-800 dark:text-white">{currentSchool}</b> database has been suspended by the Master Administrator.
                                    If you believe this is an error, please contact master@localhost for licensing inquiries.
                                </>
                            )}
                        </p>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col gap-3">
                        <button
                            onClick={handleSignOut}
                            className="w-full py-2.5 px-4 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-lg text-xs transition"
                        >
                            Sign Out Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // RENDER: DASHBOARD (ADMIN & USER) — sidebar layout for admin tabs
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 flex flex-col lg:flex-row transition-colors duration-300">

            {/* DESKTOP SIDEBAR NAVIGATION */}
            {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && (
                <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 sticky top-0 h-screen p-5 justify-between flex-shrink-0 z-30 shadow-xs">

                    <div className="space-y-6">
                        {/* Brand Header */}
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md">
                                <Server className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                                    {session.role === 'SUPER_ADMIN' ? selectedSchool : (session.school)} Logbook
                                </h1>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Campus Maintenance Suite</p>
                            </div>
                        </div>

                        {/* Super Admin School Switcher */}
                        {session.role === 'SUPER_ADMIN' && (
                            <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                                <label className="block text-[10.5px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Active Campus:
                                </label>
                                <select
                                    value={selectedSchool}
                                    onChange={e => setSelectedSchool(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                                >
                                    {SCHOOLS.map(sc => (
                                        <option key={sc} value={sc}>{sc}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Navigation Links */}
                        <div className="space-y-1.5">
                            <p className="px-3 text-[10.9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                Admin Navigation
                            </p>

                            <button
                                onClick={() => setActiveTab('tickets')}
                                className={`w-full py-2.5 px-3.5 text-xs font-extrabold rounded-xl flex items-center justify-between transition-all duration-200 ${activeTab === 'tickets'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:scale-110 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4" />
                                    <span>Complaints Queue</span>
                                </div>
                                {stats.pending > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'tickets' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                        }`}>
                                        {stats.pending}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`w-full py-2.5 px-3.5 text-xs font-extrabold rounded-xl flex items-center gap-3 transition-all duration-200 ${activeTab === 'analytics'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:scale-110 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <MapPin className="w-4 h-4" />
                                <span>Floor & Asset Heatmap</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('users')}
                                className={`w-full py-2.5 px-3.5 text-xs font-extrabold rounded-xl flex items-center gap-3 transition-all duration-200 ${activeTab === 'users'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:scale-110 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <Users className="w-4 h-4" />
                                <span>Manage Staff Accounts</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`w-full py-2.5 px-3.5 text-xs font-extrabold rounded-xl flex items-center gap-3 transition-all duration-200 ${activeTab === 'settings'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:scale-110 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <Settings className="w-4 h-4" />
                                <span>Notifications Config</span>
                            </button>

                            <button
                                onClick={() => setActiveTab('billing')}
                                className={`w-full py-2.5 px-3.5 text-xs font-extrabold rounded-xl flex items-center gap-3 transition-all duration-200 ${activeTab === 'billing'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:scale-110 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                            >
                                <CreditCard className="w-4 h-4" />
                                <span>Billing & License</span>
                            </button>


                        </div>
                    </div>

                    {/* Bottom Profile Widget */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <button
                            onClick={openProfileModal}
                            className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 group text-left"
                        >
                            <div className="relative flex-shrink-0">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                    {session.fullName ? session.fullName.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 group-hover:text-indigo-600">
                                    <Edit3 className="w-2.5 h-2.5" />
                                </span>
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {session.fullName}
                                </p>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                                    {session.role === 'SUPER_ADMIN' ? 'Super Admin' : session.role === 'ADMIN' ? 'IT Admin' : 'Staff'}
                                </span>
                            </div>
                        </button>

                        <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                                onClick={toggleTheme}
                                className="flex-1 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                            >
                                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                            </button>

                            {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                        className="relative p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition"
                                        title="View Recent Notifications"
                                    >
                                        <Bell className="w-4 h-4" />
                                        {notifications.filter(n => !n.isRead).length > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                                                {notifications.filter(n => !n.isRead).length}
                                            </span>
                                        )}
                                    </button>

                                    {isNotificationsOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-30"
                                                onClick={() => setIsNotificationsOpen(false)}
                                            />
                                            <div className="absolute left-0 bottom-12 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-40 animate-fade-in origin-bottom-left">
                                                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                    <h3 className="text-xs font-black text-slate-900 dark:white flex items-center gap-1.5">
                                                        <Bell className="w-3.5 h-3.5 text-indigo-500" />
                                                        Recent Notifications
                                                    </h3>
                                                    {notifications.filter(n => !n.isRead).length > 0 && (
                                                        <button
                                                            onClick={() => {
                                                                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                                                            }}
                                                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                                        >
                                                            Mark all read
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800 scrollbar-thin">
                                                    {notifications.length === 0 ? (
                                                        <div className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                                                            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-1.5" />
                                                            <p className="text-[11.5px] font-medium">No recent notifications</p>
                                                        </div>
                                                    ) : (
                                                        notifications.map(notif => (
                                                            <button
                                                                key={notif.id}
                                                                onClick={() => {
                                                                    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                                                                    setIsNotificationsOpen(false);
                                                                    setSelectedTicketToView(notif.ticket);
                                                                }}
                                                                className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-start gap-2.5 ${!notif.isRead ? 'bg-indigo-50/20 dark:bg-indigo-900/20' : ''}`}
                                                            >
                                                                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.type === 'NEW_TICKET' ? 'bg-amber-400' : notif.type === 'CLOSED' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                                <div className="space-y-0.5 min-w-0">
                                                                    <p className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200 truncate">{notif.title}</p>
                                                                    <p className="text-[10.5px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{notif.message}</p>
                                                                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium pt-0.5">
                                                                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={handleSignOut}
                                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 rounded-xl transition"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </aside>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 min-w-0 p-4 lg:p-8 space-y-6 overflow-y-auto">

                {/* Mobile Header (Hidden on Desktop since Sidebar is active) */}
                <div className={`bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 ${(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') ? 'lg:hidden' : ''}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-xs">
                            <Server className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                                {session.role === 'SUPER_ADMIN' ? selectedSchool : (session.school || 'NHSST')} Logbook
                            </h1>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Campus Maintenance</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && (
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                                title="Notifications"
                            >
                                <Bell className="w-4 h-4" />
                                {notifications.filter(n => !n.isRead).length > 0 && (
                                    <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                                        {notifications.filter(n => !n.isRead).length}
                                    </span>
                                )}
                            </button>
                        )}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => setIsMobileDrawerOpen(true)}
                            className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                            title="Open Menu"
                        >
                            <Menu className="w-5.5 h-5.5" />
                        </button>
                    </div>
                </div>

                {/* Dashboard Metrics (School Overview) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Tickets</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
                        </div>
                        <FileText className="w-8 h-8 text-indigo-600 bg-indigo-50 dark:bg-indigo-950 p-1.5 rounded-lg" />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending</p>
                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
                        </div>
                        <Clock className="w-8 h-8 text-amber-500 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg" />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">In Progress</p>
                            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.inProgress}</p>
                        </div>
                        <Activity className="w-8 h-8 text-blue-500 bg-blue-50 dark:bg-blue-950/40 p-1.5 rounded-lg" />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resolved</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.closed}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg" />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Resolution</p>
                            <p className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">{stats.avgResolutionMinutes}m</p>
                        </div>
                        <Wrench className="w-8 h-8 text-violet-500 bg-violet-50 dark:bg-violet-950/40 p-1.5 rounded-lg" />
                    </div>
                </div>

                {/* Metrics Disclaimer Note */}
                <div className="bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl p-3 flex items-center gap-2 text-xs text-indigo-800 dark:text-indigo-300 font-medium shadow-sm">
                    <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span><strong>Note:</strong> All dashboard metrics, status totals, and complaints records listed below display calculations and data captured for today.</span>
                </div>



                {/* VIEW: STAFF DASHBOARD & ADMIN TICKETS QUEUE */}
                {(session.role === 'USER' || ((session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && activeTab === 'tickets')) && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden space-y-4 p-5">

                        {/* Queue Header & Lodge Action */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') ? `${currentSchool} Complaints Registry` : 'My Support Tickets'}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') ? 'Review, update status, and close complaints across all floors.' : 'Track the resolution progress of your submitted IT complaints.'}
                                    {lastPolledAt && (session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && (
                                        <span className="ml-2 text-slate-400 dark:text-slate-500">Updated {lastPolledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                    )}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && (
                                    <button
                                        onClick={handleManualRefresh}
                                        disabled={loading || isPolling}
                                        title="Refresh tickets"
                                        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg
                                            className={`w-3.5 h-3.5 ${(loading || isPolling) ? 'animate-spin' : ''}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Refresh
                                    </button>
                                )}
                                {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && (
                                    <button
                                        onClick={openExportModal}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg shadow-sm transition"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Export CSV Report
                                    </button>
                                )}
                                <button
                                    onClick={() => { setIsNewTicketOpen(true); setTemplatePage(0); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                                >
                                    <PlusCircle className="w-3.5 h-3.5" />
                                    Lodge New Complaint
                                </button>
                            </div>
                        </div>

                        {/* Search, Filter Toolbar */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            {/* Search */}
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search token, staff, room..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">Status:</span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg text-sm px-2.5 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">Category:</span>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg text-sm px-2.5 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="ALL">All Categories</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Floor Location Filter */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">Location:</span>
                                <select
                                    value={floorFilter}
                                    onChange={(e) => setFloorFilter(e.target.value)}
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg text-sm px-2.5 py-2.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="ALL">All Floors</option>
                                    {FLOORS.map(fl => (
                                        <option key={fl} value={fl}>{fl}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Tickets List Table (Shown only on larger screens) */}
                        <div className="hidden sm:block overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        <th className="p-4">Token</th>
                                        <th className="p-4">Staff Member</th>
                                        <th className="p-4">Category & Location</th>
                                        <th className="p-4">Issue details</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Time Logged</th>
                                        <th className="p-4 text-right">Actions / Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-slate-500 dark:text-slate-400">Loading school database...</td>
                                        </tr>
                                    ) : filteredTickets.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-slate-500 dark:text-slate-400">No active complaints matching search query.</td>
                                        </tr>
                                    ) : (
                                        filteredTickets.map((ticket) => (
                                            <tr
                                                key={ticket.id}
                                                className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition ${newTicketIds.has(ticket.id)
                                                    ? 'animate-slide-in-new animate-new-entry-glow'
                                                    : ''
                                                    }`}
                                            >
                                                <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                                                    <button
                                                        onClick={() => setSelectedTicketToView(ticket)}
                                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline text-left focus:outline-none"
                                                    >
                                                        {ticket.token}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200">{ticket.userName}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{ticket.userPhone || 'No Phone'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <div className="flex gap-1.5 flex-wrap">
                                                            <span className="font-bold text-[10.5px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block">{ticket.category}</span>
                                                            {ticket.adminTag && (
                                                                <span className="font-extrabold text-[10.5px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 px-2 py-0.5 rounded inline-block">
                                                                    {ticket.adminTag}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                                                            <MapPin className="w-3 h-3 text-indigo-500" />
                                                            {ticket.floor} · {ticket.roomNumber}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 max-w-xs">
                                                    <div className="font-semibold text-slate-900 dark:text-white">{ticket.subject}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{ticket.description}</div>
                                                </td>
                                                <td className="p-4">
                                                    {ticket.status === 'PENDING' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                                                            <Clock className="w-3 h-3" /> Pending
                                                        </span>
                                                    )}
                                                    {ticket.status === 'IN_PROGRESS' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                                                            <Activity className="w-3 h-3 text-blue-500" /> In Progress
                                                        </span>
                                                    )}
                                                    {ticket.status === 'CLOSED' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                                                            <CheckCircle className="w-3 h-3" /> Closed
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                                                    {new Date(ticket.createdAt).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') ? (
                                                        <div className="flex justify-end gap-1.5">
                                                            {ticket.status === 'PENDING' && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                                                                    className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded text-xs font-bold transition border border-indigo-200 dark:border-indigo-800"
                                                                >
                                                                    Work On
                                                                </button>
                                                            )}
                                                            {ticket.status !== 'CLOSED' ? (
                                                                <button
                                                                    onClick={() => setSelectedTicketToClose(ticket)}
                                                                    className="px-2 py-1 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white dark:text-slate-100 rounded text-xs font-bold transition"
                                                                >
                                                                    Resolve
                                                                </button>
                                                            ) : (
                                                                <div className="text-right">
                                                                    <span className="text-xs text-slate-400 dark:text-slate-500 italic block">Resolved</span>
                                                                    {ticket.closedBy && (
                                                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">By: {ticket.closedBy}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="max-w-[180px] text-right">
                                                            {ticket.status === 'CLOSED' ? (
                                                                <>
                                                                    <span className="text-slate-600 dark:text-slate-400 italic text-xs block truncate" title={ticket.adminRemark}>
                                                                        Remarks: {ticket.adminRemark}
                                                                    </span>
                                                                    {ticket.closedBy && (
                                                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block mt-0.5">Resolved by {ticket.closedBy}</span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <span className="text-slate-400 dark:text-slate-500 italic text-xs">Awaiting fix</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Tickets List Card View (Shown only on small screens) */}
                        <div className="block sm:hidden space-y-3">
                            {loading ? (
                                <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">Loading school database...</div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl">No active complaints matching search query.</div>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className={`bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl space-y-3 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition ${newTicketIds.has(ticket.id)
                                            ? 'animate-slide-in-new animate-new-entry-glow border-amber-300 dark:border-amber-600'
                                            : ''
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={() => setSelectedTicketToView(ticket)}
                                                className="font-mono font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline text-sm"
                                            >
                                                {ticket.token}
                                            </button>
                                            <div>
                                                {ticket.status === 'PENDING' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                                                        <Clock className="w-3.5 h-3.5 animate-spin" /> Pending
                                                    </span>
                                                )}
                                                {ticket.status === 'IN_PROGRESS' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                                                        <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> In Progress
                                                    </span>
                                                )}
                                                {ticket.status === 'CLOSED' && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Closed
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="font-extrabold text-slate-900 dark:text-white text-base">{ticket.subject}</div>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                                                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                                {ticket.floor} · {ticket.roomNumber}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2 font-medium">
                                            <div>
                                                <span className="font-bold text-slate-700 dark:text-slate-300">Staff: </span>{ticket.userName}
                                            </div>
                                            <div>
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Action buttons on mobile */}
                                        <div className="flex justify-end gap-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                                            {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') ? (
                                                <>
                                                    {ticket.status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                                                            className="flex-1 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold transition border border-indigo-200 dark:border-indigo-800 text-center"
                                                        >
                                                            Work On
                                                        </button>
                                                    )}
                                                    {ticket.status !== 'CLOSED' ? (
                                                        <button
                                                            onClick={() => setSelectedTicketToClose(ticket)}
                                                            className="flex-1 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white dark:text-slate-100 rounded-lg text-xs font-bold transition text-center"
                                                        >
                                                            Resolve
                                                        </button>
                                                    ) : (
                                                        <div className="text-xs text-slate-500 dark:text-slate-400 italic font-semibold">
                                                            Resolved by {ticket.closedBy || 'Admin'}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="w-full text-right font-medium">
                                                    {ticket.status === 'CLOSED' ? (
                                                        <span className="text-slate-700 dark:text-slate-300 italic text-xs block truncate" title={ticket.adminRemark}>
                                                            Remarks: {ticket.adminRemark}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 dark:text-slate-500 italic text-xs">Awaiting IT support response</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW: ADMIN FLOOR & ASSET ANALYTICS HEATMAP */}
                {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && activeTab === 'analytics' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Floor Heatmap Card */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-indigo-500" />
                                    Active Complaints per Floor
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Distribution of unresolved (Pending & In Progress) issues across the 7 floors.</p>
                            </div>

                            <div className="space-y-2">
                                {ticketsPerFloor.slice(0).reverse().map(item => (
                                    <div key={item.floor} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{item.floor}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${item.openCount > 2 ? 'bg-rose-500' : item.openCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(item.openCount * 25, 100)}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${item.openCount > 2 ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300' : item.openCount > 0 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
                                                }`}>
                                                {item.openCount} Open
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Category Failure Count Card */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Server className="w-5 h-5 text-indigo-500" />
                                    Failure Frequency by Category
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Asset classes requiring immediate support attention.</p>
                            </div>

                            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                {ticketsPerCategory.sort((a, b) => b.openCount - a.openCount).map(item => (
                                    <div key={item.category} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">{item.category}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-600 rounded-full"
                                                    style={{ width: `${Math.min(item.openCount * 25, 100)}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-black px-2 py-0.5 rounded-full ${item.openCount > 0 ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                                }`}>
                                                {item.openCount} Open
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                )}

                {/* VIEW: ADMIN USER MANAGEMENT PANEL */}
                {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && activeTab === 'users' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* New User Account Registration Form */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 md:col-span-1">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    Register Staff Account
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Create login credentials for school teachers or administrators.</p>
                            </div>

                            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
                                {userFormSuccess && (
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded-lg text-sm text-emerald-800 dark:text-emerald-300 font-semibold">
                                        {userFormSuccess}
                                    </div>
                                )}
                                {userFormError && (
                                    <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-700 rounded-lg text-sm text-rose-800 dark:text-rose-300 font-semibold">
                                        {userFormError}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUserForm.fullName}
                                        onChange={e => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                                        placeholder="e.g. Principal Desk, Teacher 5B"
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Username / Login ID *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUserForm.username}
                                        onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })}
                                        placeholder="e.g. teacher5b"
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Password *</label>
                                    <input
                                        type="password"
                                        required
                                        value={newUserForm.password}
                                        onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                {session.role === 'SUPER_ADMIN' && (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Target School Group *</label>
                                        <select
                                            value={newUserForm.school || selectedSchool}
                                            onChange={e => setNewUserForm({ ...newUserForm, school: e.target.value })}
                                            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                        >
                                            {SCHOOLS.map(sc => (
                                                <option key={sc} value={sc}>{sc}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Privilege Level</label>
                                    <select
                                        value={newUserForm.role}
                                        onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                    >
                                        <option value="USER">{session.role === 'SUPER_ADMIN' ? selectedSchool : (session.school || 'NHSST')} Staff User (USER)</option>
                                        <option value="ADMIN">IT Support Engineer (ADMIN)</option>
                                        {session.role === 'SUPER_ADMIN' && (
                                            <option value="SUPER_ADMIN">Super Administrator (SUPER_ADMIN)</option>
                                        )}
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    Register Account
                                </button>
                            </form>
                        </div>

                        {/* Existing Registered Accounts List */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 md:col-span-2 overflow-hidden">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white">Registered {currentSchool} Accounts</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">List of registered user and admin sessions capable of logging into this IT portal.</p>
                            </div>

                            <div className="hidden sm:block overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            <th className="p-3">Staff Name</th>
                                            <th className="p-3">Login Username</th>
                                            <th className="p-3">Role Badge</th>
                                            <th className="p-3">Account ID</th>
                                            <th className="p-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                                                <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{u.fullName}</td>
                                                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{u.username}</td>
                                                <td className="p-3">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                                                        u.role === 'ADMIN' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                                        }`}>
                                                        {u.role === 'SUPER_ADMIN' ? 'Super Admin' :
                                                            u.role === 'ADMIN' ? 'IT Admin' : 'School Staff'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-400 dark:text-slate-500 font-mono text-[12px]">#{u.id}</td>
                                                <td className="p-3 text-right">
                                                    {((session.role === 'SUPER_ADMIN' && u.username !== session.username && u.username !== 'superadmin') ||
                                                        (session.role === 'ADMIN' && u.role === 'USER' && u.username !== session.username && u.username !== 'admin')) ? (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id, u.fullName)}
                                                            className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition p-1 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded inline-block"
                                                            title="Delete Account"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Protected</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Custom Tags Section for SUPER_ADMIN */}
                            {session.role === 'SUPER_ADMIN' && (
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Manage Admin Tags / Departments</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Add or remove custom tags for routing complaints to specific personnel types (e.g. HR, Regional Manager).</p>
                                    </div>
                                    <form onSubmit={handleAddTag} className="flex gap-2 max-w-md">
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. HR Manager"
                                            value={newTagInput}
                                            onChange={e => setNewTagInput(e.target.value)}
                                            className="flex-1 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                                        >
                                            <Plus className="w-4 h-4" /> Add Tag
                                        </button>
                                    </form>
                                    <div className="flex gap-2 flex-wrap pt-2">
                                        {tags.map(t => (
                                            <div key={t} className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200">
                                                <span>{t}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteTag(t)}
                                                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition"
                                                    title="Delete Tag"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Mobile List View */}
                            <div className="block sm:hidden space-y-2">
                                {users.map(u => (
                                    <div key={u.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg space-y-3 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{u.fullName}</div>
                                                <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">Username: {u.username}</div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                                                    u.role === 'ADMIN' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                                    }`}>
                                                    {u.role === 'SUPER_ADMIN' ? 'Super Admin' :
                                                        u.role === 'ADMIN' ? 'IT Admin' : 'School Staff'}
                                                </span>
                                                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-1">ID: #{u.id}</div>
                                            </div>
                                        </div>
                                        {/* Action buttons on mobile cards */}
                                        <div className="flex justify-end pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                            {((session.role === 'SUPER_ADMIN' && u.username !== session.username && u.username !== 'superadmin') ||
                                                (session.role === 'ADMIN' && u.role === 'USER' && u.username !== session.username && u.username !== 'admin')) ? (
                                                <button
                                                    onClick={() => handleDeleteUser(u.id, u.fullName)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 rounded-lg text-xs font-bold transition border border-rose-200 dark:border-rose-800"
                                                    title="Delete Account"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete Account
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400 dark:text-slate-500 italic font-medium">Protected Account</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                )}

                {/* VIEW: NOTIFICATIONS CONFIG */}
                {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && activeTab === 'settings' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Config Panel */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Notifications Settings</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Configure live mobile alerts for new tickets or status changes. Unconfigured alerts default to browser desktop alerts.
                                    </p>
                                </div>

                                <form onSubmit={handleSaveSettings} className="space-y-5">

                                    {/* 1. HTML5 Browser Permissions */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 flex items-center justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">HTML5 Browser Notifications</h4>
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                                Enable native OS desktop alerts. This functions as a fallback if mobile alerts are disabled or fail.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRequestNotificationPermission}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${browserNotificationPermission === 'granted'
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300 pointer-events-none'
                                                : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/60'
                                                }`}
                                        >
                                            {browserNotificationPermission === 'granted' ? 'Allowed ✓' : 'Allow Permission'}
                                        </button>
                                    </div>

                                    {/* 2. Telegram Settings */}
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Telegram Bot Notifications</h4>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={settingsForm.telegramEnabled}
                                                onChange={e => setSettingsForm({ ...settingsForm, telegramEnabled: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </div>

                                        {settingsForm.telegramEnabled && (
                                            <div className="p-4 space-y-3.5 animate-fade-in bg-white dark:bg-slate-900">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Telegram Bot Token (Optional - Leave blank to use system bot)</label>
                                                    <input
                                                        type="password"
                                                        value={settingsForm.telegramBotToken}
                                                        onChange={e => setSettingsForm({ ...settingsForm, telegramBotToken: e.target.value })}
                                                        placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Telegram Chat ID *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={settingsForm.telegramChatId}
                                                        onChange={e => setSettingsForm({ ...settingsForm, telegramChatId: e.target.value })}
                                                        placeholder="e.g. -100123456789 or 987654321"
                                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. WhatsApp Settings */}
                                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">WhatsApp Alert (via CallMeBot)</h4>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={settingsForm.whatsappEnabled}
                                                onChange={e => setSettingsForm({ ...settingsForm, whatsappEnabled: e.target.checked })}
                                                className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </div>

                                        {settingsForm.whatsappEnabled && (
                                            <div className="p-4 space-y-3.5 animate-fade-in bg-white dark:bg-slate-900">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">WhatsApp Phone Number *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={settingsForm.whatsappPhone}
                                                        onChange={e => setSettingsForm({ ...settingsForm, whatsappPhone: e.target.value })}
                                                        placeholder="e.g. +1234567890 (international format)"
                                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">CallMeBot API Key (Optional - Leave blank to use system bot)</label>
                                                    <input
                                                        type="password"
                                                        value={settingsForm.whatsappApiKey}
                                                        onChange={e => setSettingsForm({ ...settingsForm, whatsappApiKey: e.target.value })}
                                                        placeholder="e.g. 987654"
                                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all duration-200"
                                        >
                                            Save Configuration
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isTestingBot}
                                            onClick={handleSendTestMessage}
                                            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isTestingBot ? 'Sending...' : 'Send Test Message'}
                                        </button>
                                    </div>

                                    {/* Test Progress & Real-Time Connection Diagnostic Console */}
                                    {(isTestingBot || botTestResult) && (
                                        <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in">
                                            {isTestingBot && (
                                                <div className="flex items-center gap-2 p-3 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-700 dark:text-indigo-400 font-semibold animate-pulse">
                                                    ⏳ <b>Sending Real-Time Test:</b> Dispatching test payload to target servers, please wait...
                                                </div>
                                            )}
                                            {botTestResult && (
                                                <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 shadow-sm ${
                                                    botTestResult.success 
                                                        ? 'bg-emerald-50/40 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300' 
                                                        : 'bg-red-50/40 border-red-100 dark:bg-red-950/10 dark:border-red-900/40 text-red-800 dark:text-red-300'
                                                }`}>
                                                    <div className="font-extrabold uppercase tracking-wider text-[10.5px]">
                                                        {botTestResult.success ? '✓ Integration Test Succeeded' : '✗ Integration Test Failed'}
                                                    </div>
                                                    
                                                    {botTestResult.telegram && (
                                                        <div className="space-y-0.5">
                                                            <div className="font-bold flex items-center gap-1.5">
                                                                <span className={`w-2 h-2 rounded-full ${botTestResult.telegram.sent ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                                Telegram Channel Status:
                                                            </div>
                                                            <div className="pl-3.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono break-all">
                                                                {botTestResult.telegram.sent 
                                                                    ? 'Sent successfully! Check your Telegram client.' 
                                                                    : `Error: ${botTestResult.telegram.error}`
                                                                }
                                                            </div>
                                                        </div>
                                                    )}

                                                    {botTestResult.whatsapp && (
                                                        <div className="space-y-0.5">
                                                            <div className="font-bold flex items-center gap-1.5">
                                                                <span className={`w-2 h-2 rounded-full ${botTestResult.whatsapp.sent ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                                WhatsApp Channel Status:
                                                            </div>
                                                            <div className="pl-3.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono break-all">
                                                                {botTestResult.whatsapp.sent 
                                                                    ? 'Sent successfully! Check your WhatsApp client.' 
                                                                    : `Error: ${botTestResult.whatsapp.error}`
                                                                }
                                                            </div>
                                                        </div>
                                                    )}

                                                    {botTestResult.general && (
                                                        <div className="text-red-700 dark:text-red-400 font-bold pl-1 font-mono text-[11px]">
                                                            Notice: {botTestResult.general}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </form>
                            </div>

                            {/* Interactive Guides Panel */}
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Setup Guides</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Follow these instructions to connect your mobile phone to alerts.</p>
                                    </div>

                                    {/* Guide Tab Switcher */}
                                    <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-1 rounded-lg border gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setActiveGuideTab('telegram')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${activeGuideTab === 'telegram' ? 'bg-white dark:bg-slate-800 shadow text-indigo-700 dark:text-indigo-300 border border-slate-200/50 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            Telegram Setup
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveGuideTab('whatsapp')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${activeGuideTab === 'whatsapp' ? 'bg-white dark:bg-slate-800 shadow text-indigo-700 dark:text-indigo-300 border border-slate-200/50 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            WhatsApp Setup
                                        </button>
                                    </div>

                                    {/* Guide Instructions */}
                                    {activeGuideTab === 'telegram' ? (
                                        <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed animate-fade-in">
                                            <div className="p-3 bg-blue-50/40 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 rounded-xl space-y-1">
                                                <span className="text-[12.5px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Step 1: Create a Bot</span>
                                                <p>Open Telegram and search for <b>@BotFather</b>. Send the command <code>/newbot</code> and follow the instructions to get a <b>Bot Token</b>.</p>
                                            </div>
                                            <div className="p-3 bg-blue-50/40 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 rounded-xl space-y-1">
                                                <span className="text-[12.5px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Step 2: Get Your Chat ID</span>
                                                <p>To get your personal chat ID, message the bot <b>@userinfobot</b>. To alert a shared admin group, add your bot to that group and message the bot <b>@GetMyChatID_Bot</b> inside the group to read the group's Chat ID.</p>
                                            </div>
                                            <div className="p-3 bg-blue-50/40 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 rounded-xl space-y-1">
                                                <span className="text-[12.5px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Step 3: Save and Activate</span>
                                                <p>Enter the Token and Chat ID in the form, check the "Telegram Bot Notifications" toggle, and click **Save Configuration**.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed animate-fade-in">
                                            <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 rounded-xl space-y-1">
                                                <span className="text-[12.5px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Step 1: Register with CallMeBot</span>
                                                <p>Add <b>+34 644 10 55 84</b> (or CallMeBot registration contact) to your mobile phone's address book contacts.</p>
                                            </div>
                                            <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 rounded-xl space-y-1">
                                                <span className="text-[12.5px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Step 2: Request API Key</span>
                                                <p>Send a WhatsApp message containing <code>I allow callmebot to send me messages</code> to that contact. Wait for the automated reply with your unique <b>API Key</b>.</p>
                                            </div>
                                            <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 rounded-xl space-y-1">
                                                <span className="text-[12.5px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Step 3: Save and Activate</span>
                                                <p>Enter your phone number (including international prefix, e.g. <code>+19876543210</code>) and the CallMeBot API Key in the WhatsApp form block and click save.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Notice Panel */}
                                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-[13.5px] text-slate-600 dark:text-slate-300 font-medium">
                                    💡 <b>Note:</b> Both systems trigger calls to standard public API URLs in your browser backend securely. Fallback HTML5 alerts rely on native desktop notifications; make sure to allow permissions in your browser.
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* VIEW: BILLING & PRICING */}
                {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && activeTab === 'billing' && (
                    session.role === 'SUPER_ADMIN' ? (
                        /* SUPER ADMIN FINANCIAL & REVENUE ANALYTICS VIEW */
                        <div className="space-y-6 animate-fade-in">
                            {/* Financial Summary Stat Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Campuses</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                                            {masterSubscriptions.filter(s => s.status === 'ACTIVE' && (!s.expiresAt || new Date(s.expiresAt) > new Date())).length} / {masterSubscriptions.length}
                                        </p>
                                    </div>
                                    <Server className="w-8 h-8 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg" />
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Billable IT Admins</p>
                                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                                            {masterSubscriptions.reduce((acc, s) => acc + (s.activeAdmins || 0), 0)} Admins
                                        </p>
                                    </div>
                                    <Users className="w-8 h-8 text-indigo-600 bg-indigo-50 dark:bg-indigo-950 p-1.5 rounded-lg" />
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monthly Expected Revenue</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                                            {masterSubscriptions.reduce((acc, s) => acc + (s.activeAdmins || 0), 0) * 100} / mo
                                        </p>
                                    </div>
                                    <CreditCard className="w-8 h-8 text-purple-600 bg-purple-50 dark:bg-purple-950 p-1.5 rounded-lg" />
                                </div>
                            </div>

                            {/* Campus Revenue Breakdown Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-6 space-y-4">
                                <div>
                                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        Global Enterprise Revenue & Licensing Overview
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        System-wide licensing revenue metrics calculated at 100 / month per active admin session across registered school databases.
                                    </p>
                                </div>

                                {masterLoading ? (
                                    <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 font-bold flex flex-col items-center gap-2">
                                        <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
                                        <span>Loading revenue statistics...</span>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                    <th className="px-5 py-3.5">Campus Code</th>
                                                    <th className="px-5 py-3.5">Billable Admins</th>
                                                    <th className="px-5 py-3.5">Monthly Revenue</th>
                                                    <th className="px-5 py-3.5">License Expiration</th>
                                                    <th className="px-5 py-3.5 text-right">Subscription Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                                                {masterSubscriptions.map(sub => {
                                                    const isSubExpired = sub.expiresAt && new Date(sub.expiresAt) < new Date();
                                                    return (
                                                        <tr key={sub.school} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors">
                                                            <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{sub.school}</td>
                                                            <td className="px-5 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{sub.activeAdmins} Admin(s)</td>
                                                            <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{sub.activeAdmins * 100} / month</td>
                                                            <td className="px-5 py-4 font-medium text-slate-600 dark:text-slate-400">
                                                                {sub.status !== 'ACTIVE' ? (
                                                                    <span className="text-red-600 dark:text-red-400 font-bold">Suspended Access</span>
                                                                ) : isSubExpired ? (
                                                                    <span className="text-red-600 dark:text-red-400 font-bold">
                                                                        Expired ({new Date(sub.expiresAt).toLocaleDateString()})
                                                                    </span>
                                                                ) : sub.expiresAt ? (
                                                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                                                        Valid Until {new Date(sub.expiresAt).toLocaleDateString()}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Lifetime Active Access</span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${sub.status === 'ACTIVE' && !isSubExpired
                                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                                    : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                                                                    }`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'ACTIVE' && !isSubExpired ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                                    {sub.status !== 'ACTIVE' ? 'Suspended' : isSubExpired ? 'Expired' : 'Active'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* REGULAR ADMIN BILLING VIEW */
                        (() => {
                            const isPackActive = currentSubscription.status === 'ACTIVE' && (!currentSubscription.expiresAt || new Date(currentSubscription.expiresAt) > new Date());
                            return (
                                <div className={`grid grid-cols-1 ${!isPackActive ? 'lg:grid-cols-2' : ''} gap-6 animate-fade-in`}>

                                    {/* 1. Active Pack Status & Plan Details Card */}
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between relative overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800">
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${isPackActive
                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                                }`}>
                                                {isPackActive ? 'Active Subscription' : 'Subscription Inactive / Expired'}
                                            </span>
                                        </div>

                                        <div className="space-y-6 mt-4">
                                            <div className="space-y-2 text-left">
                                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Enterprise Helpdesk Suite</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Complete campus-wide maintenance, analytics & alerts suite.</p>
                                            </div>

                                            <div className="text-left border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black text-slate-900 dark:text-white">Active License</span>
                                                </div>
                                                {currentSubscription.status !== 'ACTIVE' ? (
                                                    <span className="text-xs font-bold text-red-600 dark:text-red-400 block">
                                                        Account Suspended by Master Admin
                                                    </span>
                                                ) : currentSubscription.expiresAt && new Date(currentSubscription.expiresAt) < new Date() ? (
                                                    <span className="text-xs font-bold text-red-600 dark:text-red-400 block">
                                                        License Expired on {new Date(currentSubscription.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                ) : currentSubscription.expiresAt ? (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                                                            Subscription Valid Until: {new Date(currentSubscription.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                        </span>
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                                                            ({Math.max(0, Math.ceil((new Date(currentSubscription.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)))} days remaining)
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                                                        Lifetime Active Access (No Expiry Date)
                                                    </span>
                                                )}
                                            </div>

                                            <ul className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-left">
                                                <li className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                                                    <Check className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                    <span>Unlimited complaints registry & status updates</span>
                                                </li>
                                                <li className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                                                    <Check className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                    <span>Interactive Floor & Asset Failure Heatmap analytics</span>
                                                </li>
                                                <li className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                                                    <Check className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                    <span>Telegram Bot & WhatsApp CallMeBot live mobile alerts</span>
                                                </li>
                                                <li className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                                                    <Check className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                    <span>Custom date range CSV support metrics report exporter</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* 2. Billing Calculator & Payment Card — HIDDEN IF PACK IS ACTIVE */}
                                    {!isPackActive && (
                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">School Billing & Renewal</h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Live monthly licensing cost calculated from registered IT admin sessions.</p>
                                                </div>

                                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                                        <span>Active School Admins:</span>
                                                        <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-md">
                                                            {users.filter(u => u.role === 'ADMIN').length} Admin(s)
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-700/60 pt-3">
                                                        <span>Plan Rate:</span>
                                                        <span>100 / month per Admin</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm font-extrabold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-3">
                                                        <span>Total Monthly Cost:</span>
                                                        <span className="text-lg text-indigo-700 dark:text-indigo-300 font-black">
                                                            {users.filter(u => u.role === 'ADMIN').length * 100} / month
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <span className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">Billable Admin Accounts ({users.filter(u => u.role === 'ADMIN').length})</span>
                                                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 pr-1">
                                                        {users.filter(u => u.role === 'ADMIN').length === 0 ? (
                                                            <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500">No admin accounts found.</div>
                                                        ) : (
                                                            users.filter(u => u.role === 'ADMIN').map(admin => (
                                                                <div key={admin.id} className="p-2.5 flex items-center justify-between text-xs">
                                                                    <div className="font-bold text-slate-800 dark:text-slate-200">{admin.fullName}</div>
                                                                    <div className="font-mono text-slate-500 dark:text-slate-400">@{admin.username}</div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl text-xs shadow-md transition-all duration-200 hover:shadow-lg"
                                                onClick={() => alert('Redirecting to secure Stripe licensing portal...')}
                                            >
                                                Proceed to Payment Portal
                                            </button>
                                        </div>
                                    )}

                                </div>
                            );
                        })()
                    )
                )}



            </div>

            {/* MOBILE NAVIGATION DRAWER — added dark variants */}
            {isMobileDrawerOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity duration-300 animate-fade-in"
                        onClick={() => setIsMobileDrawerOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 w-72 max-w-xs bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col justify-between p-6 transform transition-transform duration-300 animate-slide-in-left">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <Server className="w-5.5 h-5.5 text-indigo-600 dark:text-indigo-400" />
                                    <span className="text-base font-black text-slate-900 dark:text-white tracking-tight">IT Support</span>
                                </div>
                                <button
                                    onClick={() => setIsMobileDrawerOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {session.role === 'SUPER_ADMIN' && (
                                <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active School Group:</label>
                                    <select
                                        value={selectedSchool}
                                        onChange={e => {
                                            setSelectedSchool(e.target.value);
                                            setIsMobileDrawerOpen(false);
                                        }}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        {SCHOOLS.map(sc => (
                                            <option key={sc} value={sc}>{sc}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">Navigation Tabs</label>

                                <button
                                    onClick={() => {
                                        setActiveTab('tickets');
                                        setIsMobileDrawerOpen(false);
                                    }}
                                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-3 transition ${activeTab === 'tickets'
                                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <FileText className="w-4.5 h-4.5" />
                                    Complaints Queue
                                </button>

                                {(session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setActiveTab('analytics');
                                                setIsMobileDrawerOpen(false);
                                            }}
                                            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-3 transition ${activeTab === 'analytics'
                                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <MapPin className="w-4.5 h-4.5" />
                                            Floor & Asset Heatmap
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveTab('users');
                                                setIsMobileDrawerOpen(false);
                                            }}
                                            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-3 transition ${activeTab === 'users'
                                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <Users className="w-4.5 h-4.5" />
                                            Manage Staff Accounts
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveTab('settings');
                                                setIsMobileDrawerOpen(false);
                                            }}
                                            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-3 transition ${activeTab === 'settings'
                                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <Settings className="w-4.5 h-4.5" />
                                            Notifications Config
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveTab('billing');
                                                setIsMobileDrawerOpen(false);
                                            }}
                                            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center gap-3 transition ${activeTab === 'billing'
                                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            <CreditCard className="w-4.5 h-4.5" />
                                            Billing & License
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => {
                                    setIsMobileDrawerOpen(false);
                                    openProfileModal();
                                }}
                                className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 group text-left"
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                                        {session.fullName ? session.fullName.charAt(0).toUpperCase() : 'A'}
                                    </div>
                                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 group-hover:text-indigo-600">
                                        <Edit3 className="w-2.5 h-2.5" />
                                    </span>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                        {session.fullName}
                                    </p>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">
                                        {session.role === 'SUPER_ADMIN' ? 'Super Admin' : session.role === 'ADMIN' ? 'IT Admin' : 'Staff'}
                                    </span>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    handleSignOut();
                                    setIsMobileDrawerOpen(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition"
                            >
                                <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* MODAL: Log New School Complaint — added dark variants */}
            {isNewTicketOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white">Lodge {currentSchool} Complaint</h3>
                                <p className="text-[12px] text-slate-500 dark:text-slate-400">Report malfunctioning infrastructure, security, or technology issues across the {currentSchool} campus.</p>
                            </div>
                            <button onClick={() => setIsNewTicketOpen(false)} className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 bg-zinc-200 dark:bg-zinc-900 hover:scale-110 hover:bg-red-200 dark:hover:bg-red-800 hover:text-slate-600 dark:hover:text-slate-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTicketSubmit} className="p-6 space-y-4">

                            {/* Quick Fill Templates for Testing */}
                            <div className="space-y-3 bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Quick {currentSchool} Templates
                                    </label>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={templatePage === 0}
                                            onClick={() => setTemplatePage(prev => Math.max(0, prev - 1))}
                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:text-slate-400 transition"
                                            title="Previous templates"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 select-none">
                                            {templatePage + 1} / {totalPages}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={templatePage >= totalPages - 1}
                                            onClick={() => setTemplatePage(prev => Math.min(totalPages - 1, prev + 1))}
                                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:text-slate-400 transition"
                                            title="Next templates"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-h-[110px] transition-all duration-300">
                                    {visibleTemplates.map((tmpl, idx) => {
                                        const catColors = {
                                            'PC Hardware': 'border-t-blue-500 text-blue-700 bg-blue-50/40 dark:bg-blue-950/40 dark:text-blue-300',
                                            'CCTV': 'border-t-rose-500 text-rose-700 bg-rose-50/40 dark:bg-rose-950/40 dark:text-rose-300',
                                            'Projectors': 'border-t-amber-500 text-amber-700 bg-amber-50/40 dark:bg-amber-950/40 dark:text-amber-300',
                                            'Printer': 'border-t-violet-500 text-violet-700 bg-violet-50/40 dark:bg-violet-950/40 dark:text-violet-300',
                                            'Software': 'border-t-emerald-500 text-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/40 dark:text-emerald-300',
                                            'OS': 'border-t-cyan-500 text-cyan-700 bg-cyan-50/40 dark:bg-cyan-950/40 dark:text-cyan-300',
                                            'Intercom': 'border-t-orange-500 text-orange-700 bg-orange-50/40 dark:bg-orange-950/40 dark:text-orange-300',
                                            'Biometric': 'border-t-teal-500 text-teal-700 bg-teal-50/40 dark:bg-teal-950/40 dark:text-teal-300',
                                            'Student ID card': 'border-t-fuchsia-500 text-fuchsia-700 bg-fuchsia-50/40 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
                                            'Edusprint': 'border-t-indigo-500 text-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/40 dark:text-indigo-300',
                                        };
                                        const colorClass = catColors[tmpl.category] || 'border-t-slate-400 text-slate-700 bg-slate-50/40 dark:bg-slate-800/40 dark:text-slate-300';

                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleApplyTemplate(tmpl)}
                                                className={`flex flex-col justify-between p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-t-4 ${colorClass.split(' ')[0]} rounded-xl text-left transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                                            >
                                                <div className="w-full space-y-1.5">
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className={`px-2 py-0.5 rounded text-[11.5px] font-extrabold uppercase tracking-wide ${colorClass.split(' ').slice(1).join(' ')}`}>
                                                            {tmpl.category}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                                                            {tmpl.floor}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-[14px] font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{tmpl.title}</h4>
                                                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                        {tmpl.description}
                                                    </p>
                                                </div>
                                                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between w-full text-[10.5px] font-semibold text-slate-500 dark:text-slate-400">
                                                    <span className="truncate">📍 {tmpl.roomNumber}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-center items-center gap-1.5 pt-2">
                                    {Array.from({ length: totalPages }).map((_, pageIdx) => (
                                        <button
                                            key={pageIdx}
                                            type="button"
                                            onClick={() => setTemplatePage(pageIdx)}
                                            className={`h-2 rounded-full transition-all duration-300 ${templatePage === pageIdx
                                                ? 'w-5 bg-indigo-600 dark:bg-indigo-400'
                                                : 'w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                                                }`}
                                            title={`Go to page ${pageIdx + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reporter Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newTicketForm.userName || session.fullName}
                                        onChange={e => setNewTicketForm({ ...newTicketForm, userName: e.target.value })}
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                                    <input
                                        type="text"
                                        value={newTicketForm.userPhone}
                                        onChange={e => setNewTicketForm({ ...newTicketForm, userPhone: e.target.value })}
                                        placeholder="e.g. Extension 412"
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Asset Class Category</label>
                                    <select
                                        value={newTicketForm.category}
                                        onChange={e => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Floor Location</label>
                                    <select
                                        value={newTicketForm.floor}
                                        onChange={e => setNewTicketForm({ ...newTicketForm, floor: e.target.value })}
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                    >
                                        {FLOORS.map(fl => (
                                            <option key={fl} value={fl}>{fl}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Room / Lab No *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Lab 2, Room 403"
                                        value={newTicketForm.roomNumber}
                                        onChange={e => setNewTicketForm({ ...newTicketForm, roomNumber: e.target.value })}
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Admin Tag / Department</label>
                                <select
                                    value={newTicketForm.adminTag || (tags[0] || 'IT Support')}
                                    onChange={e => setNewTicketForm({ ...newTicketForm, adminTag: e.target.value })}
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                >
                                    {tags.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject Brief *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Intercom volume is too low / static noise"
                                    value={newTicketForm.subject}
                                    onChange={e => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setIsNewTicketOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow transition"
                                >
                                    <Send className="w-3.5 h-3.5" /> Submit Complaint
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Close School Ticket with Remarks — added dark variants */}
            {selectedTicketToClose && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white">Resolve Complaint: {selectedTicketToClose.token}</h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Record administrative action and close school complaint.</p>
                            </div>
                            <button onClick={() => setSelectedTicketToClose(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCloseTicketSubmit} className="p-6 space-y-4">
                            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    Marking this ticket as <strong>Closed</strong> records the repair timestamp and stops the resolution clock.
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Administrative Remarks / Technical Action *</label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="e.g. Reconfigured IP addresses, swapped camera power adapter on 5th floor staircase..."
                                    value={adminRemark}
                                    onChange={(e) => setAdminRemark(e.target.value)}
                                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedTicketToClose(null)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white dark:text-slate-100 font-bold text-xs rounded-lg transition"
                                >
                                    Confirm Resolution
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Export CSV Report with custom dates — added dark variants */}
            {isExportModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white">Export CSV Report</h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400">Configure date ranges and criteria for the CSV report download.</p>
                            </div>
                            <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date Range Filter</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setExportDateType('ALL')}
                                        className={`py-2 text-xs font-bold rounded-lg border transition ${exportDateType === 'ALL' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        All Time
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExportDateType('TODAY')}
                                        className={`py-2 text-xs font-bold rounded-lg border transition ${exportDateType === 'TODAY' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Today
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExportDateType('CUSTOM')}
                                        className={`py-2 text-xs font-bold rounded-lg border transition ${exportDateType === 'CUSTOM' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        Custom Range
                                    </button>
                                </div>
                            </div>

                            {exportDateType === 'CUSTOM' && (
                                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={exportStartDate}
                                            onChange={e => setExportStartDate(e.target.value)}
                                            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={exportEndDate}
                                            onChange={e => setExportEndDate(e.target.value)}
                                            className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Status</label>
                                    <select
                                        value={exportStatus}
                                        onChange={e => setExportStatus(e.target.value)}
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                    >
                                        <option value="ALL">All Statuses</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Category</label>
                                    <select
                                        value={exportCategory}
                                        onChange={e => setExportCategory(e.target.value)}
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                    >
                                        <option value="ALL">All Categories</option>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Floor</label>
                                    <select
                                        value={exportFloor}
                                        onChange={e => setExportFloor(e.target.value)}
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                                    >
                                        <option value="ALL">All Floors</option>
                                        {FLOORS.map(fl => (
                                            <option key={fl} value={fl}>{fl}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setIsExportModalOpen(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDownloadCSV}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download CSV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Detailed Complaint Card View — added dark variants */}
            {selectedTicketToView && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200 mr-2">{selectedTicketToView.token}</span>
                                <h3 className="font-extrabold text-slate-900 dark:text-white inline-block">Complaint Details</h3>
                            </div>
                            <button onClick={() => setSelectedTicketToView(null)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="text-[14px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 flex-wrap">
                                    Category: <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded">{selectedTicketToView.category}</span>
                                    {selectedTicketToView.adminTag && (
                                        <span className="font-extrabold text-[10.5px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 px-2.5 py-0.5 rounded inline-block">
                                            Tag: {selectedTicketToView.adminTag}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    {selectedTicketToView.status === 'PENDING' && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                                            <Clock className="w-3.5 h-3.5 animate-spin" /> Pending
                                        </span>
                                    )}
                                    {selectedTicketToView.status === 'IN_PROGRESS' && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                                            <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> In Progress
                                        </span>
                                    )}
                                    {selectedTicketToView.status === 'CLOSED' && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Resolved / Closed
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                                <div>
                                    <span className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase">Floor Location</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[15px]">{selectedTicketToView.floor}</span>
                                </div>
                                <div>
                                    <span className="block text-[12px] font-bold text-slate-400 dark:text-slate-500 uppercase">Room / Lab No</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[15px]">{selectedTicketToView.roomNumber}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 text-sm">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-[15px]">Reporter Info</h4>
                                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                                    <div><strong>Name:</strong> {selectedTicketToView.userName}</div>
                                    <div><strong>Username ID:</strong> {selectedTicketToView.reportedBy}</div>
                                    <div><strong>Contact:</strong> {selectedTicketToView.userPhone || 'N/A'}</div>
                                    <div><strong>Email:</strong> {selectedTicketToView.userEmail || 'N/A'}</div>
                                </div>
                                <div className="text-[12px] text-slate-400 dark:text-slate-500 pt-1">
                                    Logged on: {new Date(selectedTicketToView.createdAt).toLocaleString()}
                                </div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-[15px]">User Reported Issue</h4>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-lg">
                                    <h5 className="font-bold text-slate-800 dark:text-slate-200 text-[15px] mb-1">{selectedTicketToView.subject}</h5>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 text-[15px]">IT Admin Resolution / Action Taken</h4>
                                {selectedTicketToView.status === 'CLOSED' ? (
                                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 rounded-lg space-y-2">
                                        <p className="text-emerald-800 dark:text-emerald-300 text-[15px] leading-relaxed font-medium whitespace-pre-wrap">
                                            {selectedTicketToView.adminRemark}
                                        </p>
                                        <div className="text-[13.5px] text-emerald-600 dark:text-emerald-400 font-bold flex justify-between border-t border-emerald-100/60 dark:border-emerald-800/60 pt-2">
                                            <span>Resolved By: {selectedTicketToView.closedBy || 'IT Admin'}</span>
                                            <span>Time: {selectedTicketToView.resolutionTimeMinutes} mins</span>
                                        </div>
                                    </div>
                                ) : selectedTicketToView.status === 'IN_PROGRESS' ? (
                                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-500 animate-spin" />
                                        IT support engineer is currently working on fixing this asset.
                                    </div>
                                ) : (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-semibold">
                                        Awaiting support allocation and technical inspection.
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setSelectedTicketToView(null)}
                                    className="px-5 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white dark:text-slate-100 font-bold text-xs rounded-lg shadow transition"
                                >
                                    Close Card
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT PROFILE MODAL */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">

                        {/* Modal Header with Avatar Glow */}
                        <div className="relative p-6 bg-gradient-to-b from-indigo-50/60 to-white dark:from-indigo-950/30 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800/80 text-center space-y-3">
                            <button
                                onClick={() => setIsProfileModalOpen(false)}
                                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-2xl flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-slate-800">
                                {session?.fullName ? session.fullName.charAt(0).toUpperCase() : 'A'}
                            </div>

                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">Edit Account Profile</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customize your display name across all campus logs.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfileSubmit} className="p-6 space-y-4">
                            {profileSuccess && (
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center gap-2 animate-fade-in">
                                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <span>{profileSuccess}</span>
                                </div>
                            )}
                            {profileError && (
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 rounded-2xl text-xs text-rose-800 dark:text-rose-300 font-bold text-center animate-fade-in">
                                    {profileError}
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Username ID</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={session?.username || ''}
                                        className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 font-mono font-semibold outline-none cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Role Permission</label>
                                    <input
                                        type="text"
                                        disabled
                                        value={session?.role === 'SUPER_ADMIN' ? 'Super Administrator (Master)' : session?.role === 'ADMIN' ? 'IT Administrator' : 'School Staff Member'}
                                        className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 font-semibold outline-none cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Display Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={profileFullNameInput}
                                        onChange={e => setProfileFullNameInput(e.target.value)}
                                        placeholder="Enter your full display name..."
                                        className="w-full border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsProfileModalOpen(false)}
                                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={profileUpdating}
                                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {profileUpdating ? (
                                        <>
                                            <Activity className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TOAST NOTIFICATION BANNER — added dark variants */}
            {latestToast && (
                <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border-l-4 border-l-indigo-600 dark:border-l-indigo-400 border border-slate-200 dark:border-slate-700 p-4 animate-slide-in flex items-start gap-3 origin-bottom-right">
                    <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg text-indigo-700 dark:text-indigo-300 flex-shrink-0">
                        <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-bounce" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">{latestToast.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">{latestToast.message}</p>
                    </div>
                    <button
                        onClick={() => setLatestToast(null)}
                        className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0"
                        title="Dismiss alert"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

        </div>
    );
}