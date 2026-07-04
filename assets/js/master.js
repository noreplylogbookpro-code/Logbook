
document.addEventListener("DOMContentLoaded", checkAuth);

let uptimeInterval = null;
let statsPollingInterval = null;
let serverUptimeSeconds = 0;
let currentMasterUser = 'admin';

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        if (m === "'") return '&#39;';
        return m;
    });
}




async function masterApiCall(endpoint, options = {}) {
    const token = localStorage.getItem('masterToken');
    const headers = { ...options.headers };
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    const res = await fetch(endpoint, {
        ...options,
        headers
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('masterToken');
            showView('login-view');
            throw new Error('Unauthorized');
        }
    }
    return res;
}

function startStatsPolling() {
    loadStats();

    // Client-side smooth second ticker
    if (uptimeInterval) clearInterval(uptimeInterval);
    uptimeInterval = setInterval(() => {
        serverUptimeSeconds++;
        const uptimeEl = document.getElementById('stat-uptime');
        if (uptimeEl) uptimeEl.innerText = formatUptime(serverUptimeSeconds);
    }, 1000);

    // Server poll every 15 seconds for heavy database/file aggregates
    if (statsPollingInterval) clearInterval(statsPollingInterval);
    statsPollingInterval = setInterval(loadStats, 15000);
}

async function checkAuth() {
    const token = localStorage.getItem('masterToken');
    if (!token) {
        showView('login-view');
        return;
    }
    try {
        await masterApiCall('/api/master/stats');
        showView('dashboard-view');
        loadDashboardData();
        initProfileAndNavigation();
        startStatsPolling();
    } catch (e) {
        // masterApiCall handles the redirect/view state on auth failure
    }
}

function showView(viewId) {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById(viewId).classList.remove('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('master-user').value;
    const password = document.getElementById('master-pass').value;

    try {
        const res = await fetch('/api/master/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (res.ok) {
            const data = await res.json();
            if (data.requires2FA) {
                window.tempMfaToken = data.mfaToken;
                document.getElementById('login-form').classList.add('hidden');
                document.getElementById('mfa-form').classList.remove('hidden');
                document.getElementById('mfa-code').value = '';
                document.getElementById('mfa-code').focus();
                document.getElementById('login-error').classList.add('hidden');
                return;
            }
            if (data.token) {
                localStorage.setItem('masterToken', data.token);
            }
            document.getElementById('login-error').classList.add('hidden');
            showView('dashboard-view');
            loadDashboardData();
            initProfileAndNavigation();
            startStatsPolling();
        } else {
            document.getElementById('login-error').classList.remove('hidden');
        }
    } catch (err) {
        document.getElementById('login-error').classList.remove('hidden');
    }
}

async function handleMfaVerify(e) {
    e.preventDefault();
    const code = document.getElementById('mfa-code').value;
    const mfaToken = window.tempMfaToken;
    if (!mfaToken) {
        alert("Session expired, please log in again.");
        cancelMfa();
        return;
    }

    try {
        const res = await fetch('/api/master/login/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mfaToken, code })
        });

        if (res.ok) {
            const data = await res.json();
            if (data.token) {
                localStorage.setItem('masterToken', data.token);
            }
            document.getElementById('login-error').classList.add('hidden');
            showView('dashboard-view');
            loadDashboardData();
            initProfileAndNavigation();
            startStatsPolling();
            cancelMfa();
        } else {
            const errData = await res.json();
            alert(errData.error || "Invalid verification code.");
        }
    } catch (err) {
        alert("Verification failed: " + err.message);
    }
}

function cancelMfa() {
    window.tempMfaToken = null;
    document.getElementById('mfa-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

async function logout() {
    if (uptimeInterval) clearInterval(uptimeInterval);
    if (statsPollingInterval) clearInterval(statsPollingInterval);
    const token = localStorage.getItem('masterToken');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    await fetch('/api/logout', { method: 'POST', headers }).catch(() => { });
    localStorage.removeItem('masterToken');
    window.location.reload();
}

function loadDashboardData() {
    loadConfig();
    loadUsers();
}

async function loadStats() {
    try {
        const res = await masterApiCall('/api/master/stats');
        if (res.ok) {
            const data = await res.json();
            document.getElementById('stat-users').innerText = data.totalUsers;
            document.getElementById('stat-storage').innerText = data.totalStorageMB;
            serverUptimeSeconds = data.uptimeSeconds;
            currentMasterUser = data.masterUser || 'admin';
            const uptimeEl = document.getElementById('stat-uptime');
            if (uptimeEl) uptimeEl.innerText = formatUptime(serverUptimeSeconds);
        }
    } catch (e) { }
}

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

async function loadConfig() {
    try {
        const res = await masterApiCall('/api/master/config');
        if (res.ok) {
            const config = await res.json();
            document.getElementById('config-quota').value = Math.floor(config.quotaLimit / (1024 * 1024));
            document.getElementById('config-signups').checked = config.signupsEnabled !== false;
        }
    } catch (e) { }
}

async function loadUsers() {
    try {
        const res = await masterApiCall('/api/master/users');
        if (res.ok) {
            const users = await res.json();
            const tbody = document.getElementById('users-table-body');
            tbody.innerHTML = '';

            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50 transition";

                // Generate a nice avatar based on their name
                const name = user.name || user.username;
                const initial = name.charAt(0).toUpperCase();

                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                                ${initial}
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                                    ${escapeHtml(user.name || 'N/A')}
                                    ${user.twoFactorEnabled ? `<span class="text-indigo-600" title="2FA Active"><i class="fa-solid fa-shield-halved text-xs"></i></span>` : ''}
                                </div>
                                <div class="text-sm text-slate-500">${escapeHtml(user.username)}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-600 font-mono">
                            ${escapeHtml(user._id)}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.plan === 'premium' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">
                            ${escapeHtml(user.plan || 'unpaid')} / ${escapeHtml(user.subscriptionStatus || 'none')}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        ${user.twoFactorEnabled ? `
                        <button onclick="resetUser2FA('${escapeHtml(user._id)}', '${escapeHtml(user.username)}')" class="text-amber-600 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded transition mr-2">
                            <i class="fa-solid fa-shield-halved mr-1"></i> Reset 2FA
                        </button>
                        ` : ''}
                        <button onclick="openEditPlanModal('${escapeHtml(user._id)}', '${escapeHtml(user.username)}', '${escapeHtml(user.plan || 'unpaid')}', '${escapeHtml(user.subscriptionStatus || 'none')}', ${user.subscriptionExpiresAt || 0})" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition mr-2">
                            <i class="fa-solid fa-credit-card mr-1"></i> Plan
                        </button>
                        <button onclick="deleteUser('${escapeHtml(user._id)}')" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition">
                            <i class="fa-solid fa-trash mr-1"></i> Wipe
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) { }
}

async function updateConfig(e) {
    e.preventDefault();
    const quotaMB = document.getElementById('config-quota').value;
    const signupsEnabled = document.getElementById('config-signups').checked;

    try {
        const res = await masterApiCall('/api/master/config', {
            method: 'POST',
            body: JSON.stringify({
                quotaLimit: quotaMB * 1024 * 1024,
                signupsEnabled
            })
        });

        if (res.ok) alert("Configuration updated successfully!");
        else alert("Failed to update config.");
    } catch (e) {
        alert("Failed to update config: " + e.message);
    }
}

async function runCleanup() {
    const days = document.getElementById('cleanup-days').value;
    if (!confirm(`Are you sure you want to delete all backups older than ${days} days?`)) return;

    try {
        const res = await masterApiCall('/api/master/cleanup', {
            method: 'POST',
            body: JSON.stringify({ daysOld: days })
        });

        const data = await res.json();
        alert(data.message || data.error);
        loadStats();
    } catch (e) {
        alert("Cleanup failed: " + e.message);
    }
}

async function deleteUser(id) {
    if (!confirm("CRITICAL WARNING: This will permanently delete the user and WIPE all their backups. Proceed?")) return;

    try {
        const res = await masterApiCall(`/api/master/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
            loadUsers();
            loadStats();
        } else {
            alert("Failed to delete user.");
        }
    } catch (e) {
        alert("Failed to delete user: " + e.message);
    }
}

async function resetUser2FA(id, email) {
    if (!confirm(`Are you sure you want to force-disable 2FA for user ${email}?`)) return;

    try {
        const res = await masterApiCall(`/api/master/users/${encodeURIComponent(id)}/disable-2fa`, { method: 'POST' });
        if (res.ok) {
            alert(`2FA disabled for ${email}`);
            loadUsers();
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "Failed to disable user 2FA."));
        }
    } catch (e) {
        alert("Failed to disable 2FA: " + e.message);
    }
}

// Master 2FA Handlers
async function openMfaModal() {
    try {
        const res = await masterApiCall('/api/master/profile');
        if (res.ok) {
            const profile = await res.json();
            if (profile.twoFactorEnabled) {
                showActiveMfaView();
            } else {
                await startMfaSetup();
            }
            document.getElementById('mfaModal').classList.remove('hidden');
        }
    } catch (err) {
        alert("Failed to retrieve profile status: " + err.message);
    }
}

function closeMfaModal() {
    document.getElementById('mfaModal').classList.add('hidden');
}

async function startMfaSetup() {
    try {
        const res = await masterApiCall('/api/master/2fa/setup', { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            const qrContainer = document.getElementById('mfa-qrcode');
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: data.otpauthUrl,
                width: 160,
                height: 160,
                colorDark : "#0f172a",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
            document.getElementById('mfa-secret-text').innerText = data.secret;
            
            document.getElementById('mfa-setup-view').classList.remove('hidden');
            document.getElementById('mfa-active-view').classList.add('hidden');
            document.getElementById('mfa-disable-view').classList.add('hidden');
        } else {
            alert("Failed to start 2FA setup.");
        }
    } catch (err) {
        alert("2FA setup initialization error: " + err.message);
    }
}

function showActiveMfaView() {
    document.getElementById('mfa-setup-view').classList.add('hidden');
    document.getElementById('mfa-active-view').classList.remove('hidden');
    document.getElementById('mfa-disable-view').classList.add('hidden');
}

function showDisableMfaForm() {
    document.getElementById('mfa-setup-view').classList.add('hidden');
    document.getElementById('mfa-active-view').classList.add('hidden');
    document.getElementById('mfa-disable-view').classList.remove('hidden');
    document.getElementById('mfa-disable-pwd').value = '';
    document.getElementById('mfa-disable-code').value = '';
}

async function confirmMfaSetup(e) {
    e.preventDefault();
    const code = document.getElementById('mfa-setup-code').value;
    try {
        const res = await masterApiCall('/api/master/2fa/verify', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
        if (res.ok) {
            alert("2FA enabled successfully!");
            document.getElementById('mfa-setup-code').value = '';
            showActiveMfaView();
            loadMasterProfile(); // Refresh navbar status/dropdown info
        } else {
            const data = await res.json();
            alert(data.error || "Incorrect code. Please try again.");
        }
    } catch (err) {
        alert("Verification request failed: " + err.message);
    }
}

async function submitDisableMfa(e) {
    e.preventDefault();
    const password = document.getElementById('mfa-disable-pwd').value;
    const code = document.getElementById('mfa-disable-code').value;
    try {
        const res = await masterApiCall('/api/master/2fa/disable', {
            method: 'POST',
            body: JSON.stringify({ password, code })
        });
        if (res.ok) {
            alert("2FA disabled successfully.");
            closeMfaModal();
            loadMasterProfile(); // Refresh navbar status/dropdown info
        } else {
            const data = await res.json();
            alert(data.error || "Failed to disable 2FA. Check password and code.");
        }
    } catch (err) {
        alert("Disabling request failed: " + err.message);
    }
}

// ── Navigation & View Switching ──
function switchMainView(viewType, event) {
    if (event) event.preventDefault();

    const overview = document.getElementById('overview-view-content');
    const homepage = document.getElementById('homepage-view-content');
    const blogs = document.getElementById('blogs-view-content');
    const plans = document.getElementById('plans-view-content');
    const billingAudit = document.getElementById('billing-audit-view-content');
    const logs = document.getElementById('logs-view-content');
    const title = document.getElementById('header-title');

    overview.classList.add('hidden');
    homepage.classList.add('hidden');
    if (blogs) blogs.classList.add('hidden');
    if (plans) plans.classList.add('hidden');
    if (billingAudit) billingAudit.classList.add('hidden');
    if (logs) logs.classList.add('hidden');

    const navOverview = document.getElementById('nav-overview');
    const navHomepage = document.getElementById('nav-homepage');
    const navBlogs = document.getElementById('nav-blogs');
    const navPlans = document.getElementById('nav-plans');
    const navBillingAudit = document.getElementById('nav-billing-audit');
    const navLogs = document.getElementById('nav-logs');

    const inactiveClass = "flex items-center space-x-3 text-slate-400 hover:bg-slate-800 hover:text-white px-4 py-3 rounded-lg transition";
    const activeClass = "flex items-center space-x-3 bg-indigo-600 text-white px-4 py-3 rounded-lg shadow transition";

    if (navOverview) navOverview.className = inactiveClass;
    if (navHomepage) navHomepage.className = inactiveClass;
    if (navBlogs) navBlogs.className = inactiveClass;
    if (navPlans) navPlans.className = inactiveClass;
    if (navBillingAudit) navBillingAudit.className = inactiveClass;
    if (navLogs) navLogs.className = inactiveClass;

    if (viewType === 'overview') {
        overview.classList.remove('hidden');
        title.textContent = 'System Dashboard';
        if (navOverview) navOverview.className = activeClass;
    } else if (viewType === 'homepage') {
        homepage.classList.remove('hidden');
        title.textContent = 'Home Page';
        if (navHomepage) navHomepage.className = activeClass;
        const iframe = document.getElementById('homepage-iframe');
        if (iframe) iframe.src = iframe.src;
        loadSiteSettingsForm();
    } else if (viewType === 'blogs') {
        if (blogs) blogs.classList.remove('hidden');
        title.textContent = 'Manage Blogs';
        if (navBlogs) navBlogs.className = activeClass;
        loadAdminBlogs();
    } else if (viewType === 'plans') {
        if (plans) plans.classList.remove('hidden');
        title.textContent = 'Manage Plans & Subscriptions';
        if (navPlans) navPlans.className = activeClass;
        loadPlansAndSubscriptions();
    } else if (viewType === 'billing-audit') {
        if (billingAudit) billingAudit.classList.remove('hidden');
        title.textContent = 'Billing Audit Report';
        if (navBillingAudit) navBillingAudit.className = activeClass;
        loadBillingAuditReport();
    } else if (viewType === 'logs') {
        if (logs) logs.classList.remove('hidden');
        title.textContent = 'Server Logs';
        if (navLogs) navLogs.className = activeClass;
        loadAdminLogs();
    }
}

// ── Blogs Management System ──
async function loadAdminBlogs() {
    try {
        const res = await masterApiCall('/api/blogs');
        if (res.ok) {
            const blogs = await res.json();
            const tbody = document.getElementById('blogs-table-body');
            tbody.innerHTML = '';

            if (blogs.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="3" class="px-6 py-8 text-center text-slate-500">
                            <i class="fa-solid fa-folder-open text-3xl mb-2 block text-slate-300"></i>
                            No blog posts published yet. Click "Create Post" to write your first entry.
                        </td>
                    </tr>
                `;
                return;
            }

            blogs.forEach(blog => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50 transition";
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center">
                                <i class="fa-solid fa-file-lines text-lg"></i>
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-semibold text-slate-900 max-w-xs truncate" title="${escapeHtml(blog.title)}">${escapeHtml(blog.title)}</div>
                                <div class="text-xs text-slate-500">
                                    <span class="px-2 py-0.5 inline-flex text-xxs font-semibold rounded-full bg-indigo-50 text-indigo-700 uppercase tracking-wider">${escapeHtml(blog.category)}</span>
                                    <span class="ml-2 font-mono text-slate-400 text-[10px]">${escapeHtml(blog.slug)}</span>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-slate-600 font-medium">${escapeHtml(blog.date)}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex justify-end gap-2">
                            <button onclick="openEditBlogModal('${escapeHtml(blog._id)}')" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition">
                                <i class="fa-solid fa-pen-to-square mr-1"></i> Edit
                            </button>
                            <button onclick="deleteBlog('${escapeHtml(blog._id)}')" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition">
                                <i class="fa-solid fa-trash mr-1"></i> Delete
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error("Failed to load blogs:", e);
    }
}

function openCreateBlogModal() {
    document.getElementById('blogId').value = '';
    document.getElementById('blogForm').reset();
    document.getElementById('blogModalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square text-indigo-500 mr-2"></i> Create Blog Post';
    document.getElementById('blogModal').classList.remove('hidden');
}

async function openEditBlogModal(id) {
    try {
        const res = await masterApiCall('/api/blogs');
        if (res.ok) {
            const blogs = await res.json();
            const blog = blogs.find(b => b._id === id);
            if (blog) {
                document.getElementById('blogId').value = blog._id;
                document.getElementById('blogTitle').value = blog.title;
                document.getElementById('blogCategory').value = blog.category;
                document.getElementById('blogDate').value = blog.date || '';
                document.getElementById('blogImageUrl').value = blog.imageUrl === '/assets/images/blog_hero.png' ? '' : (blog.imageUrl || '');
                document.getElementById('blogExcerpt').value = blog.excerpt;
                document.getElementById('blogContent').value = blog.content;

                document.getElementById('blogModalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square text-indigo-500 mr-2"></i> Edit Blog Post';
                document.getElementById('blogModal').classList.remove('hidden');
            }
        }
    } catch (e) {
        alert("Failed to load blog post details: " + e.message);
    }
}

function closeBlogModal() {
    document.getElementById('blogModal').classList.add('hidden');
}

async function handleBlogFormSubmit(e) {
    e.preventDefault();
    const blogId = document.getElementById('blogId').value;
    const title = document.getElementById('blogTitle').value;
    const category = document.getElementById('blogCategory').value;
    const date = document.getElementById('blogDate').value;
    const imageUrl = document.getElementById('blogImageUrl').value;
    const excerpt = document.getElementById('blogExcerpt').value;
    const content = document.getElementById('blogContent').value;

    const payload = { title, category, excerpt, content, imageUrl, date };

    const method = blogId ? 'PUT' : 'POST';
    const endpoint = blogId ? `/api/master/blogs/${encodeURIComponent(blogId)}` : '/api/master/blogs';

    try {
        const res = await masterApiCall(endpoint, {
            method,
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeBlogModal();
            loadAdminBlogs();
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "Failed to save blog post."));
        }
    } catch (err) {
        alert("Failed to save: " + err.message);
    }
}

async function deleteBlog(id) {
    if (!confirm("Are you sure you want to permanently delete this blog post?")) return;

    try {
        const res = await masterApiCall(`/api/master/blogs/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
            loadAdminBlogs();
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "Failed to delete blog post."));
        }
    } catch (e) {
        alert("Failed to delete: " + e.message);
    }
}


// ── Shared Profile System ──

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
let currentAvatarIndex = 0;

function updateNavbarAvatar(index) {
    const av = AVATARS[index % AVATARS.length];
    document.getElementById('profileIconBtn').innerHTML =
        `<i class="${av.icon}" style="color:${av.color}; font-size:1.3rem;"></i>`;
}

async function loadMasterProfile() {
    try {
        const res = await masterApiCall('/api/master/profile');
        if (res.ok) {
            const profile = await res.json();
            document.getElementById('dropdownUserName').textContent = profile.name || 'Master Admin';
            document.getElementById('dropdownUserEmail').textContent = profile.email || 'admin@logbook';
            if (profile.profilePicIndex !== undefined) {
                currentAvatarIndex = profile.profilePicIndex;
                updateNavbarAvatar(currentAvatarIndex);
            }
        }
    } catch (e) { }
}

async function openEditProfileModal() {
    try {
        const res = await masterApiCall('/api/master/profile');
        if (res.ok) {
            const profile = await res.json();
            document.getElementById('editName').value = profile.name || 'Master Admin';
            document.getElementById('editEmail').value = profile.email || 'admin@logbook';
            currentAvatarIndex = profile.profilePicIndex !== undefined ? profile.profilePicIndex : 0;
        }
    } catch (e) { }
    buildAvatarGrid('editAvatarGrid', currentAvatarIndex, idx => { currentAvatarIndex = idx; });
    document.getElementById('editProfileModal').classList.remove('hidden');
}

function openChangePwdModal() {
    document.getElementById('currentPwd').value = '';
    document.getElementById('newPwd').value = '';
    document.getElementById('confirmPwd').value = '';
    document.getElementById('pwdError').textContent = '';
    document.getElementById('changePwdModal').classList.remove('hidden');
}

function buildAvatarGrid(containerId, selectedIdx, onSelect) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    grid.innerHTML = '';
    AVATARS.forEach((av, idx) => {
        const div = document.createElement('div');
        div.className = `avatar-option flex items-center justify-center p-2 rounded-xl bg-slate-50 border-2 cursor-pointer transition ${selectedIdx === idx ? 'border-indigo-600 bg-indigo-50/50' : 'border-transparent hover:border-slate-200'}`;
        div.innerHTML = `<i class="${av.icon}" style="font-size:1.5rem; color:${av.color};"></i>`;
        div.onclick = () => {
            grid.querySelectorAll('.avatar-option').forEach(o => o.className = o.className.replace('border-indigo-600 bg-indigo-50/50', 'border-transparent hover:border-slate-200'));
            div.className = `avatar-option flex items-center justify-center p-2 rounded-xl border-2 cursor-pointer transition border-indigo-600 bg-indigo-50/50`;
            onSelect(idx);
        };
        grid.appendChild(div);
    });
}

async function loadPlansAndSubscriptions() {
    await loadAdminLicenses();
    await loadMonthlySubscribers();
    await loadPricingConfigForm();
}

async function loadMonthlySubscribers() {
    try {
        const res = await masterApiCall('/api/master/users');
        if (res.ok) {
            const users = await res.json();
            const tbody = document.getElementById('subscribers-table-body');
            tbody.innerHTML = '';

            const premiumUsers = users.filter(u => u.plan === 'premium');

            if (premiumUsers.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-6 py-8 text-center text-slate-500">
                            <i class="fa-solid fa-folder-open text-3xl mb-2 block text-slate-300"></i>
                            No active monthly premium subscribers found.
                        </td>
                    </tr>
                `;
                return;
            }

            premiumUsers.forEach(user => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50 transition";
                
                const expiresDate = user.subscriptionExpiresAt > 0 
                    ? new Date(user.subscriptionExpiresAt).toLocaleDateString() 
                    : 'Lifetime / Legacy';
                
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="ml-2">
                                <div class="text-sm font-semibold text-slate-900">${escapeHtml(user.name || 'N/A')}</div>
                                <div class="text-xs text-slate-500">${escapeHtml(user.username)}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800 uppercase">
                            ${escapeHtml(user.subscriptionStatus || 'active')}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        ${expiresDate}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="openEditPlanModal('${escapeHtml(user._id)}', '${escapeHtml(user.username)}', '${escapeHtml(user.plan || 'unpaid')}', '${escapeHtml(user.subscriptionStatus || 'none')}', ${user.subscriptionExpiresAt || 0})" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition mr-2">
                            <i class="fa-solid fa-pen mr-1"></i> Edit
                        </button>
                        <button onclick="revokeSubscription('${escapeHtml(user._id)}', '${escapeHtml(user.username)}')" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition">
                            <i class="fa-solid fa-ban mr-1"></i> Revoke
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error("Failed to load monthly subscribers:", e);
    }
}

async function revokeSubscription(id, email) {
    if (!confirm(`Are you sure you want to permanently revoke the monthly premium subscription for ${email}?`)) return;

    try {
        const res = await masterApiCall(`/api/master/users/${encodeURIComponent(id)}/revoke-subscription`, { method: 'POST' });
        if (res.ok) {
            alert("Subscription revoked successfully!");
            loadMonthlySubscribers();
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "Failed to revoke subscription."));
        }
    } catch (e) {
        alert("Failed to revoke subscription: " + e.message);
    }
}

function openEditPlanModal(id, email, plan, status, expiresAt) {
    document.getElementById('editPlanUserId').value = id;
    document.getElementById('editPlanUserEmail').value = email;
    document.getElementById('editPlanSelect').value = plan;
    document.getElementById('editPlanStatusSelect').value = status;
    
    const expiresInput = document.getElementById('editPlanExpiresAt');
    if (expiresAt && expiresAt > 0) {
        const date = new Date(expiresAt);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        expiresInput.value = `${yyyy}-${mm}-${dd}`;
    } else {
        expiresInput.value = '';
    }
    
    document.getElementById('editPlanModal').classList.remove('hidden');
}

function closeEditPlanModal() {
    document.getElementById('editPlanModal').classList.add('hidden');
}

async function handleEditPlanSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editPlanUserId').value;
    const plan = document.getElementById('editPlanSelect').value;
    const subscriptionStatus = document.getElementById('editPlanStatusSelect').value;
    const expiresVal = document.getElementById('editPlanExpiresAt').value;
    
    let subscriptionExpiresAt = 0;
    if (expiresVal) {
        subscriptionExpiresAt = new Date(expiresVal).getTime();
    }
    
    try {
        const res = await masterApiCall(`/api/master/users/${encodeURIComponent(id)}/plan`, {
            method: 'POST',
            body: JSON.stringify({
                plan,
                subscriptionStatus,
                subscriptionExpiresAt
            })
        });
        
        if (res.ok) {
            alert("User plan updated successfully!");
            closeEditPlanModal();
            loadUsers();
            loadMonthlySubscribers();
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "Failed to update user plan."));
        }
    } catch (err) {
        alert("Failed to update user plan: " + err.message);
    }
}

// ── License Management System ──
async function loadAdminLicenses() {
    try {
        const res = await masterApiCall('/api/master/licenses');
        if (res.ok) {
            const licenses = await res.json();
            const tbody = document.getElementById('licenses-table-body');
            tbody.innerHTML = '';

            if (licenses.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-6 py-8 text-center text-slate-500">
                            <i class="fa-solid fa-folder-open text-3xl mb-2 block text-slate-300"></i>
                            No licenses generated yet. Click "Generate License" to create one.
                        </td>
                    </tr>
                `;
                return;
            }

            licenses.forEach(lic => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-slate-50 transition";
                
                const expiresDate = new Date(lic.expiresAt).toLocaleDateString();
                const keySnippet = lic.licenseKey ? (lic.licenseKey.substring(0, 15) + '...') : 'N/A';
                
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-semibold text-slate-900">${escapeHtml(lic.licensee)}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        ${expiresDate}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-2">
                            <span class="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded select-all" title="${escapeHtml(lic.licenseKey)}">${keySnippet}</span>
                            <button onclick="navigator.clipboard.writeText('${escapeHtml(lic.licenseKey)}').then(() => alert('Copied key!'))" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded transition" title="Copy Key">
                                <i class="fa-regular fa-copy"></i>
                            </button>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="openEditLicenseModal('${escapeHtml(lic._id)}', '${escapeHtml(lic.licensee)}', ${lic.expiresAt})" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded transition mr-2">
                            <i class="fa-solid fa-pen mr-1"></i> Edit
                        </button>
                        <button onclick="revokeLicense('${escapeHtml(lic._id)}')" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition">
                            <i class="fa-solid fa-ban mr-1"></i> Revoke
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error("Failed to load licenses:", e);
    }
}

async function revokeLicense(id) {
    if (!confirm("Are you sure you want to permanently revoke this license key? The user will lose self-hosting capabilities.")) return;

    try {
        const res = await masterApiCall(`/api/master/licenses/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
            alert("License revoked successfully!");
            loadAdminLicenses();
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "Failed to revoke license key."));
        }
    } catch (e) {
        alert("Failed to revoke license: " + e.message);
    }
}

function openEditLicenseModal(id, licensee, expiresAt) {
    document.getElementById('editLicenseId').value = id;
    document.getElementById('editLicenseeEmail').value = licensee;
    
    const expiresInput = document.getElementById('editLicenseExpiresAt');
    if (expiresAt && expiresAt > 0) {
        const date = new Date(expiresAt);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        expiresInput.value = `${yyyy}-${mm}-${dd}`;
    } else {
        expiresInput.value = '';
    }
    
    document.getElementById('editLicenseModal').classList.remove('hidden');
}

function closeEditLicenseModal() {
    document.getElementById('editLicenseModal').classList.add('hidden');
}

async function handleEditLicenseSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editLicenseId').value;
    const expiresVal = document.getElementById('editLicenseExpiresAt').value;
    
    if (!expiresVal) {
        alert("Please select an expiration date.");
        return;
    }
    
    const expiresAt = new Date(expiresVal).getTime();
    
    try {
        const res = await masterApiCall(`/api/master/licenses/${encodeURIComponent(id)}/plan`, {
            method: 'POST',
            body: JSON.stringify({
                expiresAt
            })
        });
        
        if (res.ok) {
            alert("License expiration updated successfully!");
            closeEditLicenseModal();
            loadAdminLicenses();
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "Failed to update license expiration."));
        }
    } catch (err) {
        alert("Failed to update license expiration: " + err.message);
    }
}

function openCreateLicenseModal() {
    document.getElementById('licenseeEmail').value = '';
    document.getElementById('licenseDuration').value = '365';
    document.getElementById('generatedKeyContainer').classList.add('hidden');
    document.getElementById('generatedLicenseOutput').value = '';
    document.getElementById('genLicenseSubmitBtn').disabled = false;
    document.getElementById('genLicenseSubmitBtn').innerText = 'Generate Key';
    document.getElementById('licenseModal').classList.remove('hidden');
}

function closeLicenseModal() {
    document.getElementById('licenseModal').classList.add('hidden');
}

async function handleLicenseFormSubmit(e) {
    e.preventDefault();
    const licensee = document.getElementById('licenseeEmail').value;
    const durationDays = document.getElementById('licenseDuration').value;
    const btn = document.getElementById('genLicenseSubmitBtn');

    btn.disabled = true;
    btn.innerText = 'Generating...';

    try {
        const res = await masterApiCall('/api/master/licenses/generate', {
            method: 'POST',
            body: JSON.stringify({ licensee, durationDays })
        });

        if (res.ok) {
            const data = await res.json();
            document.getElementById('generatedLicenseOutput').value = data.licenseKey;
            document.getElementById('generatedKeyContainer').classList.remove('hidden');
            btn.innerText = 'Generated ✓';
            loadAdminLicenses();
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "Failed to generate license."));
            btn.disabled = false;
            btn.innerText = 'Generate Key';
        }
    } catch (err) {
        alert("Failed to generate: " + err.message);
        btn.disabled = false;
        btn.innerText = 'Generate Key';
    }
}

// ── Server Logs Management System ──
let allLogs = [];
let currentLogLevelFilter = 'all';

async function loadAdminLogs() {
    try {
        const res = await masterApiCall('/api/master/logs');
        if (res.ok) {
            allLogs = await res.json();
            updateLogCounts();
            renderLogs();
        }
    } catch (e) {
        console.error("Failed to load server logs:", e);
    }
}

function updateLogCounts() {
    const counts = { all: allLogs.length, alarm: 0, critical: 0, warning: 0, info: 0 };
    allLogs.forEach(log => {
        const lvl = log.level ? log.level.toLowerCase() : 'info';
        if (counts[lvl] !== undefined) {
            counts[lvl]++;
        }
    });
    
    const countAllEl = document.getElementById('count-all');
    const countAlarmEl = document.getElementById('count-alarm');
    const countCriticalEl = document.getElementById('count-critical');
    const countWarningEl = document.getElementById('count-warning');
    const countInfoEl = document.getElementById('count-info');

    if (countAllEl) countAllEl.textContent = counts.all;
    if (countAlarmEl) countAlarmEl.textContent = counts.alarm;
    if (countCriticalEl) countCriticalEl.textContent = counts.critical;
    if (countWarningEl) countWarningEl.textContent = counts.warning;
    if (countInfoEl) countInfoEl.textContent = counts.info;
}

function setLogLevelFilter(level) {
    currentLogLevelFilter = level;
    
    const filterButtons = {
        all: document.getElementById('btn-filter-all'),
        alarm: document.getElementById('btn-filter-alarm'),
        critical: document.getElementById('btn-filter-critical'),
        warning: document.getElementById('btn-filter-warning'),
        info: document.getElementById('btn-filter-info')
    };
    
    const activeClass = "px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-indigo-700 shadow-sm transition flex items-center gap-2";
    const inactiveClass = "px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white/80 transition flex items-center gap-2";
    
    Object.keys(filterButtons).forEach(key => {
        const btn = filterButtons[key];
        if (btn) {
            btn.className = (key === level) ? activeClass : inactiveClass;
        }
    });
    
    renderLogs();
}

function filterLogs() {
    renderLogs();
}

function renderLogs() {
    const tbody = document.getElementById('logs-table-body');
    if (!tbody) return;
    
    const searchEl = document.getElementById('log-search');
    const searchQuery = searchEl ? searchEl.value.toLowerCase().trim() : '';
    tbody.innerHTML = '';
    
    const filtered = allLogs.filter(log => {
        if (currentLogLevelFilter !== 'all') {
            const lvl = log.level ? log.level.toLowerCase() : 'info';
            if (lvl !== currentLogLevelFilter) return false;
        }
        if (searchQuery) {
            const msg = log.message ? log.message.toLowerCase() : '';
            const metadataStr = log.metadata ? JSON.stringify(log.metadata).toLowerCase() : '';
            if (!msg.includes(searchQuery) && !metadataStr.includes(searchQuery)) return false;
        }
        return true;
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-8 text-center text-slate-500 font-sans">
                    <i class="fa-solid fa-terminal text-3xl mb-2 block text-slate-300"></i>
                    No matching server logs found.
                </td>
            </tr>
        `;
        return;
    }
    
    filtered.forEach(log => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition border-b border-slate-100";
        
        const timestamp = new Date(log.timestamp).toLocaleString();
        
        let levelBadge = '';
        const lvl = log.level ? log.level.toLowerCase() : 'info';
        if (lvl === 'alarm') {
            levelBadge = `<span class="px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full border bg-rose-50 text-rose-700 border-rose-200 uppercase tracking-wide">Alarm</span>`;
        } else if (lvl === 'critical') {
            levelBadge = `<span class="px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full border bg-purple-100 text-purple-800 border-purple-200 uppercase tracking-wide">Critical</span>`;
        } else if (lvl === 'warning') {
            levelBadge = `<span class="px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-wide">Warning</span>`;
        } else {
            levelBadge = `<span class="px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full border bg-sky-50 text-sky-700 border-sky-200 uppercase tracking-wide">Info</span>`;
        }
        
        let metaDetails = '-';
        if (log.metadata && Object.keys(log.metadata).length > 0) {
            metaDetails = `<span class="text-[10px] text-slate-400 select-all max-w-[240px] truncate block" title="${escapeHtml(JSON.stringify(log.metadata))}">${escapeHtml(JSON.stringify(log.metadata))}</span>`;
        }
        
        tr.innerHTML = `
            <td class="px-6 py-3.5 whitespace-nowrap text-slate-500 font-medium font-sans text-xs">${timestamp}</td>
            <td class="px-6 py-3.5 whitespace-nowrap">${levelBadge}</td>
            <td class="px-6 py-3.5 text-slate-800 font-sans font-medium text-xs break-all">${escapeHtml(log.message)}</td>
            <td class="px-6 py-3.5 text-right whitespace-nowrap font-mono text-xs">${metaDetails}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function clearAdminLogs() {
    if (!confirm("Are you sure you want to permanently clear all server diagnostic logs?")) return;
    
    try {
        const res = await masterApiCall('/api/master/logs/clear', { method: 'POST' });
        if (res.ok) {
            loadAdminLogs();
        } else {
            alert("Failed to clear server logs.");
        }
    } catch (e) {
        alert("Failed to clear server logs: " + e.message);
    }
}

// Initialize listeners and checks on dashboard load
function initProfileAndNavigation() {
    loadMasterProfile();

    // Mobile Sidebar Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn && sidebar && sidebarOverlay) {
        const toggleMobileSidebar = () => {
            const isOpen = sidebar.classList.contains('translate-x-0');
            if (isOpen) {
                sidebar.classList.remove('translate-x-0');
                sidebar.classList.add('-translate-x-full');
                sidebarOverlay.classList.add('hidden');
                document.body.classList.remove('overflow-hidden');
            } else {
                sidebar.classList.add('translate-x-0');
                sidebar.classList.remove('-translate-x-full');
                sidebarOverlay.classList.remove('hidden');
                document.body.classList.add('overflow-hidden');
            }
        };

        mobileMenuBtn.addEventListener('click', toggleMobileSidebar);
        sidebarOverlay.addEventListener('click', toggleMobileSidebar);

        // Auto-close sidebar on link click on mobile
        const sidebarLinks = sidebar.querySelectorAll('a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768) toggleMobileSidebar();
            });
        });
    }

    // Toggle profile dropdown
    document.getElementById('profileIconBtn').addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('dropdownMenu').classList.toggle('hidden');
    });
    window.addEventListener('click', () => {
        const dropdown = document.getElementById('dropdownMenu');
        if (dropdown) dropdown.classList.add('hidden');
    });

    // Edit Profile item click
    document.getElementById('editProfileItem').addEventListener('click', () => {
        document.getElementById('dropdownMenu').classList.add('hidden');
        openEditProfileModal();
    });

    // Change Password item click
    document.getElementById('changePasswordItem').addEventListener('click', () => {
        document.getElementById('dropdownMenu').classList.add('hidden');
        openChangePwdModal();
    });

    // 2FA Authenticator item click
    document.getElementById('mfaSettingsItem').addEventListener('click', () => {
        document.getElementById('dropdownMenu').classList.add('hidden');
        openMfaModal();
    });

    // Save Profile changes
    document.getElementById('saveProfileBtn').addEventListener('click', async () => {
        const name = document.getElementById('editName').value;
        const email = document.getElementById('editEmail').value;
        try {
            const res = await masterApiCall('/api/master/profile', {
                method: 'POST',
                body: JSON.stringify({ name, email, profilePicIndex: currentAvatarIndex })
            });
            if (res.ok) {
                document.getElementById('dropdownUserName').textContent = name || 'Master Admin';
                document.getElementById('dropdownUserEmail').textContent = email || '';
                updateNavbarAvatar(currentAvatarIndex);
                document.getElementById('editProfileModal').classList.add('hidden');

                // Sync with the iframe if present
                const iframe = document.getElementById('homepage-iframe');
                if (iframe && iframe.contentWindow) {
                    try {
                        iframe.contentWindow.localStorage.setItem('masterPortalProfile', JSON.stringify({ name, email, avatarIndex: currentAvatarIndex }));
                        if (typeof iframe.contentWindow.loadMasterProfile === 'function') {
                            iframe.contentWindow.loadMasterProfile();
                        }
                    } catch (err) { }
                }
            } else {
                alert("Failed to save master profile.");
            }
        } catch (e) {
            alert("Connection error: " + e.message);
        }
    });

    // Update password
    document.getElementById('updatePwdBtn').addEventListener('click', async () => {
        const oldPass = document.getElementById('currentPwd').value;
        const newPass = document.getElementById('newPwd').value;
        const conf = document.getElementById('confirmPwd').value;
        const errSpan = document.getElementById('pwdError');
        errSpan.style.color = '#ef4444'; // Tailwind red-500

        if (newPass.length < 8) { errSpan.textContent = 'New password must be at least 8 characters.'; return; }
        if (newPass !== conf) { errSpan.textContent = 'Passwords do not match.'; return; }

        try {
            const res = await masterApiCall('/api/master/change-password', {
                method: 'POST',
                body: JSON.stringify({ oldPass, newPass })
            });
            if (res.ok) {
                errSpan.style.color = '#10b981'; // Tailwind emerald-500
                errSpan.textContent = '✓ Master password changed successfully!';
                setTimeout(() => {
                    document.getElementById('changePwdModal').classList.add('hidden');
                    errSpan.textContent = '';
                }, 2400);
            } else {
                const data = await res.json();
                errSpan.textContent = data.error || 'Failed to update master password.';
            }
        } catch (e) {
            errSpan.textContent = 'Connection error. Please try again.';
        }
    });

    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        // FIX: Use classList to toggle hidden (consistent with Tailwind-based modals)
        btn.addEventListener('click', () => {
            const modal = btn.closest('.fixed');
            if (modal) modal.classList.add('hidden');
        });
    });
    window.addEventListener('click', e => {
        if (e.target.classList.contains('bg-slate-900/60')) e.target.classList.add('hidden');
    });
}

// ── Website Page Setup Configurations (CMS) ──
async function loadSiteSettingsForm() {
    try {
        const res = await masterApiCall('/api/site-settings');
        if (res.ok) {
            const settings = await res.json();
            document.getElementById('site-badge').value = settings.heroBadge || '';
            document.getElementById('site-title').value = settings.heroTitle || '';
            document.getElementById('site-desc').value = settings.heroDesc || '';
            document.getElementById('site-feat-title').value = settings.featuresTitle || '';
            document.getElementById('site-feat-desc').value = settings.featuresDesc || '';
        }
    } catch (e) {
        console.error("Failed to load website setup details:", e);
    }
}

async function updateSiteSettings(e) {
    e.preventDefault();
    const heroBadge = document.getElementById('site-badge').value;
    const heroTitle = document.getElementById('site-title').value;
    const heroDesc = document.getElementById('site-desc').value;
    const featuresTitle = document.getElementById('site-feat-title').value;
    const featuresDesc = document.getElementById('site-feat-desc').value;

    const payload = { heroBadge, heroTitle, heroDesc, featuresTitle, featuresDesc };

    try {
        const res = await masterApiCall('/api/master/site-settings', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Website setup details updated successfully!");
            // Refresh preview iframe
            const iframe = document.getElementById('homepage-iframe');
            if (iframe) iframe.src = iframe.src;
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "Failed to update website setup."));
        }
    } catch (err) {
        alert("Failed to save: " + err.message);
    }
}

// ── Plans & Pricing Configurations ──
async function loadPricingConfigForm() {
    try {
        const res = await masterApiCall('/api/master/pricing');
        if (res.ok) {
            const config = await res.json();
            
            // Free plan
            document.getElementById('free-title').value = config.free.title || '';
            document.getElementById('free-features').value = (config.free.features || []).join('\n');
            
            // Premium plan
            document.getElementById('premium-title').value = config.premium.title || '';
            document.getElementById('premium-amount').value = config.premium.amount || 0;
            document.getElementById('premium-original').value = config.premium.originalAmount || '';
            document.getElementById('premium-period').value = config.premium.period || 'month';
            document.getElementById('premium-features').value = (config.premium.features || []).join('\n');
            
            // Self-Hosted plan
            document.getElementById('self-hosted-title').value = config.selfHosted.title || '';
            document.getElementById('self-hosted-amount').value = config.selfHosted.amount || 0;
            document.getElementById('self-hosted-original').value = config.selfHosted.originalAmount || '';
            document.getElementById('self-hosted-period').value = config.selfHosted.period || 'year';
            document.getElementById('self-hosted-features').value = (config.selfHosted.features || []).join('\n');
        }
    } catch (e) {
        console.error("Failed to load plans pricing details:", e);
    }
}

async function updatePlansPricing(e) {
    e.preventDefault();
    
    const payload = {
        free: {
            title: document.getElementById('free-title').value,
            amount: 0,
            originalAmount: null,
            currency: "₹",
            period: "forever",
            features: document.getElementById('free-features').value.split('\n').map(x => x.trim()).filter(x => x.length > 0)
        },
        premium: {
            title: document.getElementById('premium-title').value,
            amount: parseInt(document.getElementById('premium-amount').value, 10) || 0,
            originalAmount: parseInt(document.getElementById('premium-original').value, 10) || null,
            currency: "₹",
            period: document.getElementById('premium-period').value,
            features: document.getElementById('premium-features').value.split('\n').map(x => x.trim()).filter(x => x.length > 0)
        },
        selfHosted: {
            title: document.getElementById('self-hosted-title').value,
            amount: parseInt(document.getElementById('self-hosted-amount').value, 10) || 0,
            originalAmount: parseInt(document.getElementById('self-hosted-original').value, 10) || null,
            currency: "₹",
            period: document.getElementById('self-hosted-period').value,
            features: document.getElementById('self-hosted-features').value.split('\n').map(x => x.trim()).filter(x => x.length > 0)
        }
    };

    try {
        const res = await masterApiCall('/api/master/pricing', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Pricing and plan offering details updated successfully!");
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "Failed to update plans pricing."));
        }
    } catch (err) {
        alert("Failed to save plans pricing: " + err.message);
    }
}

// ── Billing Audit Report System ──
let allBillingLogs = [];

async function loadBillingAuditReport() {
    try {
        // Fetch all required data in parallel using existing master APIs
        const [usersRes, licensesRes, pricingRes, logsRes] = await Promise.all([
            masterApiCall('/api/master/users'),
            masterApiCall('/api/master/licenses'),
            masterApiCall('/api/master/pricing'),
            masterApiCall('/api/master/logs')
        ]);

        if (!usersRes.ok || !licensesRes.ok || !pricingRes.ok || !logsRes.ok) {
            console.error("Failed to load admin data for billing audit report.");
            return;
        }

        const users = await usersRes.json();
        const licenses = await licensesRes.json();
        const pricing = await pricingRes.json();
        const rawLogs = await logsRes.json();

        // 1. Calculate and update Metric Cards
        // Active Subscriptions: Users with plan = premium and subscriptionStatus = active
        const activeSubs = users.filter(u => u.plan === 'premium' && u.subscriptionStatus === 'active');
        document.getElementById('stat-active-subs').textContent = activeSubs.length;

        // Active Licenses: Licenses where expiresAt is in the future
        const now = Date.now();
        const activeLics = licenses.filter(lic => lic.expiresAt > now);
        document.getElementById('stat-active-lics').textContent = activeLics.length;

        // Estimated ARR = (Active Premium Subscribers * Premium Price * 12) + (Active Licenses * Licensed Price)
        const premiumPrice = pricing.premium?.amount || 50;
        const licensePrice = pricing.selfHosted?.amount || 1499;
        const arr = (activeSubs.length * premiumPrice * 12) + (activeLics.length * licensePrice);
        document.getElementById('stat-arr').textContent = "₹" + arr.toLocaleString('en-IN');

        // 2. Render Pricing Configurations Sidebar Panel
        document.getElementById('audit-pricing-premium-title').textContent = pricing.premium?.title || "Cloud Premium Backup";
        document.getElementById('audit-pricing-premium-amount').textContent = "₹" + (pricing.premium?.amount || 50) + "/month";
        document.getElementById('audit-pricing-selfhosted-title').textContent = pricing.selfHosted?.title || "Self-Hosted License";
        document.getElementById('audit-pricing-selfhosted-amount').textContent = "₹" + (pricing.selfHosted?.amount || 1499) + "/year";

        // 3. Filter and parse billing events from server diagnostic logs
        const billingKeywords = [
            "verified Play Billing",
            "verification failed",
            "activated premium",
            "cancelled subscription",
            "generated license",
            "revoked license",
            "verify-purchase",
            "payment",
            "license/purchase",
            "subscription/cancel",
            "license purchase",
            "subscription activation",
            "billing"
        ];

        allBillingLogs = rawLogs.filter(log => {
            const message = log.message || "";
            // Check if log matches any keyword
            const matchesKeyword = billingKeywords.some(kw => message.toLowerCase().includes(kw.toLowerCase()));
            
            // Also check metadata if present
            let matchesMetadata = false;
            if (log.metadata) {
                const metaStr = JSON.stringify(log.metadata).toLowerCase();
                matchesMetadata = billingKeywords.some(kw => metaStr.includes(kw.toLowerCase()));
            }
            
            return matchesKeyword || matchesMetadata;
        });

        // Reset filter and search inputs
        document.getElementById('billing-log-filter').value = 'all';
        document.getElementById('billing-log-search').value = '';
        renderBillingLogs(allBillingLogs);

        // Render graphical statistics charts
        renderBillingCharts(activeSubs.length, activeLics.length, premiumPrice, licensePrice);

    } catch (e) {
        console.error("Error loading billing audit report:", e);
    }
}

function renderBillingLogs(logsToRender) {
    const tbody = document.getElementById('billing-logs-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (logsToRender.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="px-6 py-8 text-center text-slate-500 font-sans">
                    <i class="fa-solid fa-list text-3xl mb-2 block text-slate-300"></i>
                    No billing audit events found.
                </td>
            </tr>
        `;
        return;
    }

    logsToRender.forEach(log => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition border-b border-slate-100";
        
        const timestamp = new Date(log.timestamp).toLocaleString();
        
        let levelBadge = '';
        const lvl = log.level ? log.level.toLowerCase() : 'info';
        if (lvl === 'alarm') {
            levelBadge = `<span class="px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full border bg-rose-50 text-rose-700 border-rose-200 uppercase tracking-wide">Alarm</span>`;
        } else if (lvl === 'critical') {
            levelBadge = `<span class="px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full border bg-purple-100 text-purple-800 border-purple-200 uppercase tracking-wide">Critical</span>`;
        } else if (lvl === 'warning') {
            levelBadge = `<span class="px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full border bg-amber-50 text-amber-700 border-amber-200 uppercase tracking-wide">Warning</span>`;
        } else {
            levelBadge = `<span class="px-2 py-0.5 inline-flex text-[10px] leading-5 font-semibold rounded-full border bg-sky-50 text-sky-700 border-sky-200 uppercase tracking-wide">Info</span>`;
        }

        tr.innerHTML = `
            <td class="px-6 py-3.5 whitespace-nowrap text-slate-500 font-medium font-sans text-xs">${timestamp}</td>
            <td class="px-6 py-3.5 whitespace-nowrap">${levelBadge}</td>
            <td class="px-6 py-3.5 text-slate-800 font-sans font-medium text-xs break-all">${escapeHtml(log.message)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterBillingLogs() {
    const filterType = document.getElementById('billing-log-filter').value;
    const searchVal = document.getElementById('billing-log-search').value.toLowerCase().trim();

    let filtered = allBillingLogs;

    // Filter by type
    if (filterType === 'subscriptions') {
        filtered = filtered.filter(log => {
            const msg = (log.message || "").toLowerCase();
            return msg.includes('subscription') || msg.includes('premium');
        });
    } else if (filterType === 'licenses') {
        filtered = filtered.filter(log => {
            const msg = (log.message || "").toLowerCase();
            return msg.includes('license') || msg.includes('self-hosted') || msg.includes('licensed') || msg.includes('licenced');
        });
    } else if (filterType === 'payments') {
        filtered = filtered.filter(log => {
            const msg = (log.message || "").toLowerCase();
            return msg.includes('verified play billing') || msg.includes('verify-purchase') || msg.includes('payment');
        });
    } else if (filterType === 'failures') {
        filtered = filtered.filter(log => {
            const msg = (log.message || "").toLowerCase();
            const lvl = (log.level || "").toLowerCase();
            const hasFailureTerm = msg.includes('fail') || msg.includes('rejected') || msg.includes('revoke') || msg.includes('error');
            const isHighSeverity = lvl === 'critical' || lvl === 'alarm' || lvl === 'warning';
            return hasFailureTerm || isHighSeverity;
        });
    }

    // Filter by search query
    if (searchVal) {
        filtered = filtered.filter(log => {
            const msg = (log.message || "").toLowerCase();
            const meta = log.metadata ? JSON.stringify(log.metadata).toLowerCase() : "";
            return msg.includes(searchVal) || meta.includes(searchVal);
        });
    }

    renderBillingLogs(filtered);
}

// ── Chart.js Instances and Rendering ──
let arrPieChartInstance = null;
let arrBarChartInstance = null;

function renderBillingCharts(activeSubsCount, activeLicsCount, premiumPrice, licensePrice) {
    const pieCtx = document.getElementById('arr-pie-chart')?.getContext('2d');
    const barCtx = document.getElementById('arr-bar-chart')?.getContext('2d');

    if (!pieCtx || !barCtx) return;

    // Destroy existing instances to avoid reuse errors on canvas
    if (arrPieChartInstance) {
        arrPieChartInstance.destroy();
    }
    if (arrBarChartInstance) {
        arrBarChartInstance.destroy();
    }

    // 1. Render Pie Chart (Distribution)
    arrPieChartInstance = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: ['Monthly Subscriptions', 'Yearly Licenses'],
            datasets: [{
                data: [activeSubsCount, activeLicsCount],
                backgroundColor: ['#6366f1', '#10b981'],
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        font: { size: 11, family: 'Inter' }
                    }
                }
            }
        }
    });

    // 2. Render Bar Chart (Projected ARR)
    const subARR = activeSubsCount * premiumPrice * 12;
    const licARR = activeLicsCount * licensePrice;

    arrBarChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['Monthly Premium ARR', 'Yearly License ARR'],
            datasets: [{
                label: 'ARR (₹)',
                data: [subARR, licARR],
                backgroundColor: ['#4f46e5', '#059669'],
                borderRadius: 6,
                maxBarThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 10, family: 'Inter' },
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    },
                    grid: {
                        color: '#f1f5f9'
                    }
                },
                x: {
                    ticks: {
                        font: { size: 10, family: 'Inter' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
