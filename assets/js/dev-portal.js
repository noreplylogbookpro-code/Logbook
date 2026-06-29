// dev-portal.js — Master Dev Portal JS
// FIX #1: Removed hardcoded MASTER_USER / MASTER_PASS constants.
// Authentication now goes through the real /api/master/login server endpoint.
// The lock screen is no longer bypassable by reading the JS source.

// ── Avatars (identical to dashboard) ──
const AVATARS = [
  { icon: 'fas fa-user-astronaut', color: '#6c5ce7' },
  { icon: 'fas fa-cat', color: '#e17055' },
  { icon: 'fas fa-dog', color: '#6ab04c' },
  { icon: 'fas fa-robot', color: '#0984e3' },
  // FIX #15: Unified color with dashboard.js (#2d3436)
  { icon: 'fas fa-user-ninja', color: '#2d3436' },
  { icon: 'fas fa-feather-alt', color: '#a29bfe' },
  { icon: 'fas fa-crown', color: '#fdcb6e' },
  { icon: 'fas fa-cloud-sun', color: '#00b894' },
  { icon: 'fas fa-music', color: '#e84393' },
];
let currentAvatarIndex = 0;

// ── Lock screen ──
document.getElementById('lockBtn').addEventListener('click', authenticate);
document.getElementById('lockPass').addEventListener('keydown', e => { if (e.key === 'Enter') authenticate(); });

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
      document.getElementById('portal').style.display = 'none';
      document.getElementById('lockScreen').style.display = 'flex';
      throw new Error('Unauthorized');
    }
  }
  return res;
}

// FIX #1: authenticate() now calls the real server API
async function authenticate() {
  const u = document.getElementById('lockUser').value.trim();
  const p = document.getElementById('lockPass').value;
  const err = document.getElementById('lockError');

  try {
    const res = await fetch('/api/master/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('masterToken', data.token);
      }
      document.getElementById('lockScreen').style.display = 'none';
      document.getElementById('portal').style.display = 'block';
      loadMasterProfile();
    } else {
      err.textContent = 'Invalid credentials — please try again.';
      document.getElementById('lockPass').value = '';
      document.getElementById('lockPass').focus();
      setTimeout(() => err.textContent = '', 3000);
    }
  } catch (e) {
    err.textContent = 'Connection error. Please try again.';
    setTimeout(() => err.textContent = '', 3000);
  }
}

// ── Update navbar avatar (identical to dashboard) ──
function updateNavbarAvatar(index) {
  const av = AVATARS[index % AVATARS.length];
  document.querySelector('.profile-icon').innerHTML =
    `<i class="${av.icon}" style="color:${av.color}; font-size:1.5rem;"></i>`;
}

// ── Load master profile from localStorage ──
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

// ── Dropdown (exact same logic as dashboard) ──
document.getElementById('profileIconBtn').addEventListener('click', e => {
  e.stopPropagation();
  document.getElementById('dropdownMenu').classList.toggle('show');
});
window.addEventListener('click', () => document.getElementById('dropdownMenu').classList.remove('show'));

document.getElementById('editProfileItem').addEventListener('click', () => {
  document.getElementById('dropdownMenu').classList.remove('show');
  openEditProfileModal();
});

document.getElementById('changePasswordItem').addEventListener('click', () => {
  document.getElementById('dropdownMenu').classList.remove('show');
  openChangePwdModal();
});

// Logout → back to lock screen
document.getElementById('logoutItem').addEventListener('click', () => {
  const token = localStorage.getItem('masterToken');
  const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
  // Also destroy the server-side master session
  fetch('/api/logout', { method: 'POST', headers }).catch(() => { });
  localStorage.removeItem('masterToken');
  document.getElementById('portal').style.display = 'none';
  document.getElementById('lockScreen').style.display = 'flex';
  document.getElementById('lockUser').value = '';
  document.getElementById('lockPass').value = '';
});

// ── Edit profile modal (same flow as dashboard) ──
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
  document.getElementById('editProfileModal').style.display = 'flex';
}

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
      document.getElementById('editProfileModal').style.display = 'none';
    } else {
      alert("Failed to save master profile.");
    }
  } catch (e) {
    alert("Connection error: " + e.message);
  }
});

// ── Change password modal ──
// FIX #13: The portal cannot change the master password (it lives in .env).
// The modal now honestly explains this and does not pretend to update anything.
function openChangePwdModal() {
  document.getElementById('currentPwd').value = '';
  document.getElementById('newPwd').value = '';
  document.getElementById('confirmPwd').value = '';
  document.getElementById('pwdError').textContent = '';
  document.getElementById('changePwdModal').style.display = 'flex';
}

document.getElementById('updatePwdBtn').addEventListener('click', async () => {
  const oldPass = document.getElementById('currentPwd').value;
  const newPass = document.getElementById('newPwd').value;
  const conf = document.getElementById('confirmPwd').value;
  const errSpan = document.getElementById('pwdError');
  errSpan.style.color = '#f47067';

  if (newPass.length < 8) { errSpan.textContent = 'New password must be at least 8 characters.'; return; }
  if (newPass !== conf) { errSpan.textContent = 'Passwords do not match.'; return; }

  try {
    const res = await masterApiCall('/api/master/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPass, newPass })
    });
    if (res.ok) {
      errSpan.style.color = '#3fb950';
      errSpan.textContent = '✓ Master password changed successfully!';
      setTimeout(() => {
        document.getElementById('changePwdModal').style.display = 'none';
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

// ── Avatar grid builder (identical to dashboard) ──
function buildAvatarGrid(containerId, selectedIdx, onSelect) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = '';
  AVATARS.forEach((av, idx) => {
    const div = document.createElement('div');
    div.className = `avatar-option ${selectedIdx === idx ? 'selected' : ''}`;
    div.innerHTML = `<i class="${av.icon}" style="font-size:2rem; color:${av.color};"></i>`;
    div.onclick = () => {
      grid.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
      div.classList.add('selected');
      onSelect(idx);
    };
    grid.appendChild(div);
  });
}

// ── Close modals (identical to dashboard) ──
document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none');
});
window.addEventListener('click', e => {
  if (e.target.classList.contains('modal')) e.target.style.display = 'none';
});

// ── Endpoint cards accordion ──
// FIX #12: Accept event as a parameter instead of using deprecated window.event
function toggleCard(card, event) {
  if (event && event.target.tagName === 'BUTTON') return;
  const wasOpen = card.classList.contains('open');
  card.closest('.api-section').querySelectorAll('.ep-card').forEach(c => c.classList.remove('open'));
  if (!wasOpen) card.classList.add('open');
}

// ── Code tabs ──
function switchTab(e, id) {
  e.stopPropagation();
  const body = e.target.closest('.ep-body');
  body.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  body.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  e.target.classList.add('active');
  document.getElementById(id).classList.add('active');
}

// ── Copy code ──
function copyCode(btn) {
  const raw = btn.parentElement.innerText.replace(/^copy\n?/, '').trim();
  navigator.clipboard.writeText(raw).then(() => {
    btn.textContent = 'copied!';
    setTimeout(() => btn.textContent = 'copy', 1600);
  });
}

// ── Sidebar active state on scroll ──
const sections = document.querySelectorAll('.api-section');
const sideLinks = document.querySelectorAll('.sidebar-link');
window.addEventListener('scroll', () => {
  let cur = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 90) cur = s.id; });
  sideLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur));
});

// ── Mobile Sidebar Toggle ──
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
  const isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.remove('open');
    sidebarOverlay.style.display = 'none';
    document.body.style.overflow = '';
  } else {
    sidebar.classList.add('open');
    sidebarOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

mobileMenuBtn.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', toggleSidebar);

// Auto-close sidebar when an endpoint link is clicked on mobile
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 768) toggleSidebar();
  });
});

// ── Check if already logged in as master ──
(async function checkSession() {
  try {
    const token = localStorage.getItem('masterToken');
    if (!token) return;
    const res = await fetch('/api/master/stats', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      document.getElementById('lockScreen').style.display = 'none';
      document.getElementById('portal').style.display = 'block';
      loadMasterProfile();
    } else {
      localStorage.removeItem('masterToken');
    }
  } catch (e) {
    console.error("Session check failed", e);
  }
})();
