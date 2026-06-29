// --- Server API endpoints ---
const API_BASE = ''; // relative to same origin

// Predefined security questions
const SECURITY_QUESTIONS = [
    "What was the name of your first pet?",
    "What is your mother's maiden name?",
    "What city were you born in?",
    "What was the name of your elementary school?",
    "What is your oldest sibling's middle name?",
    "What was the make of your first car?",
    "What is the name of the street you grew up on?",
];

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// Helper: extract a readable message from a server error response
// Server always sends JSON like { error: "...", } or { message: "..." }
async function parseError(res, fallback = 'Request failed') {
    try {
        const data = await res.json();
        return data.error || data.message || fallback;
    } catch {
        return fallback;
    }
}

function showToast(msg, isErr = false) {
    let t = document.querySelector('.toast-message');
    if (t) t.remove();
    t = document.createElement('div');
    t.className = 'toast-message';
    t.style.background = isErr ? '#dc3545' : '#1e2f3e';
    t.innerHTML = `<i class="fas ${isErr ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

// --- Check if already logged in (server session) ---
async function checkSession() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return false;
        const res = await fetch('/api/backups', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            window.location.href = '/app/dashboard/';
            return true;
        } else {
            // Token expired or invalid, clean up
            localStorage.removeItem('authToken');
        }
    } catch (e) { console.log("Session check failed", e); }
    return false;
}

// --- Login via server API ---
async function loginUser(email, password) {
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password })
        });
        if (res.ok) {
            const data = await res.json();
            if (data.requires2FA) {
                return { success: true, requires2FA: true, mfaToken: data.mfaToken };
            }
            // Store JWT token for authenticated API calls
            if (data.token) {
                localStorage.setItem('authToken', data.token);
            }
            return { success: true, name: data.name, email: data.email };
        } else {
            const msg = await parseError(res, 'Login failed');
            return { success: false, message: msg };
        }
    } catch (e) {
        return { success: false, message: 'Network error' };
    }
}

// --- Signup via server API ---
async function registerUser(email, password, name, securityQuestion, securityAnswer) {
    try {
        const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password, name, securityQuestion, securityAnswer })
        });
        if (res.ok) {
            return { success: true, message: 'Account created! Please login.' };
        } else {
            const msg = await parseError(res, 'Signup failed');
            return { success: false, message: msg };
        }
    } catch (e) {
        return { success: false, message: 'Network error' };
    }
}

// --- Render Login UI ---
function renderLoginScreen() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    container.className = 'login-wrapper';
    container.innerHTML = `
        <div class="auth-card">
            <div class="auth-header">
                <div class="badge" style="display:inline-block; background:#eef5ff; padding:0.3rem 1rem; border-radius:40px; font-size:0.75rem; color:#0077ff;">Secure access</div>
                <h2>Welcome back</h2>
                <p>Sign in to manage your encrypted backups</p>
            </div>
            <form id="loginForm">
                <div class="input-group"><i class="fas fa-envelope"></i><input type="email" id="loginEmail" placeholder="Email address" required></div>
                <div class="input-group"><i class="fas fa-lock"></i><input type="password" id="loginPassword" placeholder="Password" required></div>
                <button type="submit" class="auth-btn"><i class="fas fa-arrow-right-to-bracket"></i> Access vault</button>
            </form>
            <div class="toggle-prompt" style="margin-top:10px;">
                <a id="showForgot" style="color:#1c6ef2; cursor:pointer; font-size:0.85rem;"><i class="fas fa-key" style="margin-right:4px;"></i>Forgot password?</a>
            </div>
            <div class="toggle-prompt">Don't have an account? <a id="showSignup">Create account →</a></div>
        </div>
    `;
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const email = document.getElementById('loginEmail').value.trim();
        const pwd = document.getElementById('loginPassword').value;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Signing in...';
        const res = await loginUser(email, pwd);
        if (res.success) {
            if (res.requires2FA) {
                renderMfaChallengeScreen(res.mfaToken);
            } else {
                showToast('Login successful!');
                window.location.href = '/app/dashboard/';
            }
        } else {
            showToast(res.message, true);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-arrow-right-to-bracket"></i> Access vault';
        }
    });
    document.getElementById('showSignup')?.addEventListener('click', () => renderSignupScreen());
    document.getElementById('showForgot')?.addEventListener('click', () => renderForgotStep1());
}

function renderMfaChallengeScreen(mfaToken) {
    const container = document.getElementById('appContainer');
    if (!container) return;
    container.className = 'login-wrapper';
    container.innerHTML = `
        <div class="auth-card">
            <div class="auth-header">
                <div class="badge" style="display:inline-block; background:#eef5ff; padding:0.3rem 1rem; border-radius:40px; font-size:0.75rem; color:#0077ff;">Two-Factor Auth</div>
                <h2>Security Code</h2>
                <p>Enter the 6-digit code from your authenticator app</p>
            </div>
            <form id="mfaChallengeForm">
                <div class="input-group" style="padding: 0;">
                    <input type="text" id="mfaCode" pattern="[0-9]{6}" maxlength="6" placeholder="000000" required 
                           style="width: 100%; border: 1.5px solid #d0dfef; padding: 13px 16px; border-radius: 14px; text-align: center; letter-spacing: 0.25em; font-size: 1.3rem; font-family: inherit; font-weight: 700; outline: none; background: #f5f9fd;">
                </div>
                <button type="submit" class="auth-btn" style="margin-top: 15px;"><i class="fas fa-shield-halved"></i> Verify &amp; Sign in</button>
            </form>
            <div class="toggle-prompt" style="margin-top:15px;">
                <a id="backToLoginLink" style="color:#1c6ef2; cursor:pointer; font-size:0.85rem;">← Back to Login</a>
            </div>
        </div>
    `;
    
    document.getElementById('mfaChallengeForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('mfaCode').value;
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Verifying...';
        
        try {
            const res = await fetch('/api/login/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mfaToken, code })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                }
                showToast('Login successful!');
                window.location.href = '/app/dashboard/';
            } else {
                const msg = await parseError(res, 'Verification failed');
                showToast(msg, true);
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-shield-halved"></i> Verify &amp; Sign in';
            }
        } catch {
            showToast('Network error', true);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-shield-halved"></i> Verify &amp; Sign in';
        }
    });
    
    document.getElementById('backToLoginLink')?.addEventListener('click', () => renderLoginScreen());
}


// --- Render Signup UI ---
function renderSignupScreen() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    container.className = 'login-wrapper';

    // Build security question <option> elements
    const qOptions = SECURITY_QUESTIONS.map((q, i) =>
        `<option value="${q}"${i === 0 ? ' selected' : ''}>${q}</option>`
    ).join('');

    container.innerHTML = `
        <div class="auth-card" style="max-width:440px;">
            <div class="auth-header">
                <div class="badge" style="display:inline-block; background:#eef5ff; padding:0.3rem 1rem; border-radius:40px;">Join Logbook Plus</div>
                <h2>Create account</h2>
                <p>Start managing your expenses with full privacy</p>
            </div>
            <form id="signupForm">
                <div class="input-group"><i class="fas fa-user"></i><input type="text" 
                id="signupName" placeholder="Username (3-15 chars)" required>
                </div>
                <div id="usernameStatus" style="font-size: 0.75rem; margin-top: -8px; margin-bottom: 8px; color: #64748b; padding-left: 8px; text-align: left;">
                    Alphanumeric and underscores only
                </div>
                <div class="input-group"><i class="fas fa-envelope"></i><input type="email" id="signupEmail" placeholder="Email address" required></div>
                <div class="input-group"><i class="fas fa-lock"></i><input type="password" id="signupPassword" placeholder="Password (min 8 chars)" required></div>
                <div class="input-group"><i class="fas fa-check-circle"></i><input type="password" id="confirmPassword" placeholder="Confirm password" required></div>

                <div style="margin: 14px 0 4px; font-size:0.8rem; font-weight:600; color:#4a6f8f; letter-spacing:0.03em;">
                    <i class="fas fa-shield-alt" style="margin-right:6px; color:#1c6ef2;"></i>Security Question
                    <span style="font-weight:400; color:#8aabbc; margin-left:6px;">(used to recover your account)</span>
                </div>
                <div class="input-group" style="flex-direction:column; align-items:stretch; padding:0;">
                    <select id="securityQuestion" style="width:100%; border:none; background:#f5f9fd; padding:13px 16px; border-radius:14px; color:#2c5a7a; font-size:0.9rem; font-family:inherit; cursor:pointer; outline:none;">
                        ${qOptions}
                    </select>
                </div>
                <div class="input-group"><i class="fas fa-comment-dots"></i><input type="text" id="securityAnswer" placeholder="Your answer (case-insensitive)" required></div>

                <button type="submit" class="auth-btn"><i class="fas fa-user-check"></i> Sign up</button>
            </form>
            <div class="toggle-prompt">Already have an account? <a id="showLogin">Sign in →</a></div>
        </div>
    `;

    // Real-time username availability check with debounce
    let usernameTimeout = null;
    document.getElementById('signupName')?.addEventListener('input', (e) => {
        const username = e.target.value.trim();
        const statusEl = document.getElementById('usernameStatus');
        if (!statusEl) return;
        
        clearTimeout(usernameTimeout);
        
        if (username.length < 3 || username.length > 15 || !/^[a-zA-Z0-9_]+$/.test(username)) {
            statusEl.innerHTML = '❌ Username must be 3-15 chars, alphanumeric/underscores.';
            statusEl.style.color = '#dc3545';
            return;
        }
        
        statusEl.innerHTML = '⏳ Checking availability...';
        statusEl.style.color = '#64748b';
        
        usernameTimeout = setTimeout(async () => {
            try {
                const res = await fetch('/api/check-username', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.exists) {
                        statusEl.innerHTML = '❌ Username is already taken.';
                        statusEl.style.color = '#dc3545';
                    } else {
                        statusEl.innerHTML = '✅ Username is available!';
                        statusEl.style.color = '#28a745';
                    }
                }
            } catch {
                statusEl.innerHTML = '⚠️ Connection error.';
            }
        }, 500);
    });

    document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const pwd = document.getElementById('signupPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        const securityQuestion = document.getElementById('securityQuestion').value;
        const securityAnswer = document.getElementById('securityAnswer').value.trim();

        if (name.length < 3 || name.length > 15 || !/^[a-zA-Z0-9_]+$/.test(name)) {
            return showToast("Username must be 3-15 characters, containing only letters, numbers, or underscores.", true);
        }
        if (!isEmailValid(email)) {
            return showToast("Email is not valid.", true);
        }
        if (!email || !pwd) { showToast('Email and password required', true); return; }
        if (pwd !== confirm) { showToast('Passwords do not match', true); return; }
        if (pwd.length < 8) { showToast('Password must be at least 8 characters', true); return; }
        if (!securityAnswer || securityAnswer.length < 2) { showToast('Please provide a security answer', true); return; }

        if (await isUserExists(email)) {
            showToast('Email already exists', true); return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Creating account...';

        // Final server check for username availability
        try {
            const checkRes = await fetch('/api/check-username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: name })
            });
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.exists) {
                    showToast('Username is already taken', true);
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-user-check"></i> Sign up';
                    return;
                }
            }
        } catch {
            showToast('Failed to verify username availability', true);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-check"></i> Sign up';
            return;
        }

        const res = await registerUser(email, pwd, name, securityQuestion, securityAnswer);
        if (res.success) {
            showToast(res.message);
            renderLoginScreen();
        } else {
            showToast(res.message, true);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-check"></i> Sign up';
        }
    });
    document.getElementById('showLogin')?.addEventListener('click', () => renderLoginScreen());
}

function isLettersOnly(input) {
    // Regex: Allow only A-Z, a-z (no spaces or symbols)
    const lettersRegex = /^[A-Za-z\s]+$/;
    return lettersRegex.test(input); // Returns true if input matches
}
function isEmailValid(input) {
    // Regex: Allow only A-Z, a-z (no spaces or symbols)
    const emailRegex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])+$/;
    return emailRegex.test(input); // Returns true if input matches
}

async function isUserExists(email) {
    try {
        const res = await fetch('/api/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (res.ok) {
            const data = await res.json();
            return data.exists;
        }
    } catch (e) {
        console.warn('Email check failed', e);
    }
    return false;
}
// ═══════════════════════════════════════════
// --- Forgot Password Flow (3 steps) ---
// ═══════════════════════════════════════════

// Step 1: Ask for email → fetch security question
function renderForgotStep1() {
    const container = document.getElementById('appContainer');
    if (!container) return;
    container.className = 'login-wrapper';
    container.innerHTML = `
        <div class="auth-card">
            <div class="auth-header">
                <div class="badge" style="display:inline-block; background:#fff3e0; padding:0.3rem 1rem; border-radius:40px; font-size:0.75rem; color:#e65100;">Account Recovery</div>
                <h2 style="font-size:1.6rem;">Forgot password?</h2>
                <p>Enter your email to retrieve your security question.</p>
            </div>
            <form id="forgotStep1Form">
                <div class="input-group"><i class="fas fa-envelope"></i><input type="email" id="forgotEmail" placeholder="Your account email" required></div>
                <button type="submit" class="auth-btn" style="background:linear-gradient(135deg,#f97316,#ea580c);">
                    <i class="fas fa-arrow-right"></i> Continue
                </button>
            </form>
            <div class="toggle-prompt"><a id="backToLogin" style="cursor:pointer;">← Back to Sign in</a></div>
        </div>
    `;
    document.getElementById('forgotStep1Form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const email = document.getElementById('forgotEmail').value.trim();
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Looking up...';
        try {
            const res = await fetch('/api/forgot/question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email })
            });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Something went wrong', true);
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-arrow-right"></i> Continue';
                return;
            }
            if (!data.question) {
                // Account exists but no security question set (legacy accounts)
                showToast('No security question found for this account.', true);
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-arrow-right"></i> Continue';
                return;
            }
            renderForgotStep2(email, data.question);
        } catch {
            showToast('Network error. Please try again.', true);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-arrow-right"></i> Continue';
        }
    });
    document.getElementById('backToLogin')?.addEventListener('click', () => renderLoginScreen());
}

// Step 2: Show security question → verify answer → set new password
function renderForgotStep2(email, question) {
    const container = document.getElementById('appContainer');
    if (!container) return;
    container.className = 'login-wrapper';
    container.innerHTML = `
        <div class="auth-card">
            <div class="auth-header">
                <div class="badge" style="display:inline-block; background:#fff3e0; padding:0.3rem 1rem; border-radius:40px; font-size:0.75rem; color:#e65100;">Security Verification</div>
                <h2 style="font-size:1.5rem;">Answer your question</h2>
                <p style="color:#4a6f8f; font-size:0.85rem; line-height:1.5;">
                    Recovering: <strong style="color:#1c6ef2;">${email}</strong>
                </p>
            </div>

            <div style="background:#f0f6ff; border:1px solid #d0e3ff; border-radius:16px; padding:14px 18px; margin:0 0 18px; display:flex; align-items:flex-start; gap:10px;">
                <i class="fas fa-shield-question" style="color:#1c6ef2; margin-top:3px; font-size:1.1rem;"></i>
                <p style="margin:0; font-size:0.9rem; color:#1d4d6f; font-weight:500; line-height:1.5;">${escapeHtml(question)}</p>
            </div>

            <form id="forgotStep2Form">
                <div class="input-group"><i class="fas fa-comment-dots"></i><input type="text" id="secAnswer" placeholder="Your answer (case-insensitive)" required autocomplete="off"></div>
                <div class="input-group"><i class="fas fa-lock"></i><input type="password" id="newPwd" placeholder="New password (min 8 chars)" required></div>
                <div class="input-group"><i class="fas fa-check-circle"></i><input type="password" id="confirmNewPwd" placeholder="Confirm new password" required></div>
                <button type="submit" class="auth-btn" style="background:linear-gradient(135deg,#10b981,#059669);">
                    <i class="fas fa-key"></i> Reset Password
                </button>
            </form>
            <div class="toggle-prompt"><a id="backToStep1" style="cursor:pointer;">← Try a different email</a></div>
        </div>
    `;
    document.getElementById('forgotStep2Form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const securityAnswer = document.getElementById('secAnswer').value.trim();
        const newPassword = document.getElementById('newPwd').value;
        const confirmPwd = document.getElementById('confirmNewPwd').value;

        if (newPassword !== confirmPwd) { showToast('Passwords do not match', true); return; }
        if (newPassword.length < 8) { showToast('Password must be at least 8 characters', true); return; }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Verifying...';

        try {
            const res = await fetch('/api/forgot/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: email, securityAnswer, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                showToast(data.message || 'Password reset! Please log in.');
                // Short delay so user can see the success toast
                setTimeout(() => renderLoginScreen(), 1200);
            } else {
                showToast(data.error || 'Reset failed', true);
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-key"></i> Reset Password';
            }
        } catch {
            showToast('Network error. Please try again.', true);
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-key"></i> Reset Password';
        }
    });
    document.getElementById('backToStep1')?.addEventListener('click', () => renderForgotStep1());
}

// --- Entry point: check server session first ---
(async () => {
    const loggedIn = await checkSession();
    if (!loggedIn) {
        renderLoginScreen();
    }
    // Guard against null (element only exists on pages that include this script)
    const footerYear = document.getElementById('footerYear');
    if (footerYear) footerYear.innerText = `© ${new Date().getFullYear()}`;
})();
