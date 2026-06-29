// --- 9 Avatars ---
const AVATARS = [
  { icon: "fas fa-user-astronaut", color: "#6c5ce7" },
  { icon: "fas fa-cat", color: "#e17055" },
  { icon: "fas fa-dog", color: "#6ab04c" },
  { icon: "fas fa-robot", color: "#0984e3" },
  // FIX #15: Color was #2d3436 in dashboard but #8ba3b8 in dev-portal — unified to #2d3436
  { icon: "fas fa-user-ninja", color: "#2d3436" },
  { icon: "fas fa-feather-alt", color: "#a29bfe" },
  { icon: "fas fa-crown", color: "#fdcb6e" },
  { icon: "fas fa-cloud-sun", color: "#00b894" },
  { icon: "fas fa-music", color: "#e84393" }
];

let currentAvatarIndex = 0;

// FIX #24: Escape HTML including single quotes to prevent injection in onclick attributes
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

// Helper: extract a readable message from a server error response
async function parseError(res, fallback = 'Request failed') {
  try {
    const data = await res.json();
    return data.error || data.message || fallback;
  } catch {
    return fallback;
  }
}

// Helper: console activity logs and UI
function addActivity(text, isError = false) {
  const ul = document.getElementById('activityLog');
  if (ul) {
    const li = document.createElement('li');
    li.innerText = `${new Date().toLocaleTimeString()} • ${text}`;
    if (isError) li.style.color = '#c95a5a';
    ul.prepend(li);
    if (ul.children.length > 18) ul.removeChild(ul.lastChild);
  }
}

// Helper: fetch with auth token
async function apiCall(endpoint, options = {}) {
  // NOTE: Do not use apiCall for multipart file uploads — it forces JSON Content-Type.
  // Use fetch() directly for FormData uploads.
  const token = localStorage.getItem('authToken');
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
      // FIX #31: Redirect to /app/ not /app/index.html
      localStorage.removeItem('authToken');
      window.location.href = '/app/';
      throw new Error('Unauthorized');
    }
    const msg = await parseError(res, 'Request failed');
    throw new Error(msg);
  }
  return res;
}

// --- Update navbar avatar ---
function updateNavbarAvatar(index, userId) {
  const avatar = AVATARS[index % AVATARS.length];
  const profileIconEl = document.querySelector('.profile-icon');
  if (!profileIconEl) return;
  
  if (userId) {
    const customImgUrl = `/api/profile/avatar/${userId}?_t=${Date.now()}`;
    const img = new Image();
    img.src = customImgUrl;
    img.onload = () => {
      profileIconEl.innerHTML = `<img src="${customImgUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
    };
    img.onerror = () => {
      profileIconEl.innerHTML = `<i class="${avatar.icon}" style="color:${avatar.color}; font-size:1.5rem;"></i>`;
    };
  } else {
    profileIconEl.innerHTML = `<i class="${avatar.icon}" style="color:${avatar.color}; font-size:1.5rem;"></i>`;
  }
}

// --- Load user profile (including avatar) ---
let currentProfileName = '';

async function loadUserProfile() {
  try {
    const res = await apiCall(`/api/profile?_t=${Date.now()}`, { method: 'GET' });
    const profile = await res.json();
    currentProfileName = profile.name || '';
    
    if (profile.name) document.getElementById('dropdownUserName').innerText = profile.name;
    if (profile.email) document.getElementById('dropdownUserEmail').innerText = profile.email;
    if (profile.profilePicIndex !== undefined) {
      currentAvatarIndex = profile.profilePicIndex;
      updateNavbarAvatar(currentAvatarIndex, profile.userId);
    }
    document.getElementById('welcomeMsg').innerHTML = `Welcome ${profile.name || 'User'}`;

    // Trigger unique username migration popup for legacy users
    const nameVal = profile.name || '';
    const needsMigration = !nameVal || nameVal.includes(' ') || nameVal.length < 3 || nameVal.length > 15 || !/^[a-zA-Z0-9_]+$/.test(nameVal);
    if (needsMigration) {
      showUsernameMigrationModal(profile);
    }

    // Check self-hosted license and conditionally show the Self-Host Guide link
    try {
      const licenseRes = await apiCall(`/api/licenses/check?_t=${Date.now()}`, { method: 'GET' });
      const licenseData = await licenseRes.json();
      const selfHostItem = document.getElementById('selfHostItem');
      if (selfHostItem) {
        selfHostItem.style.display = licenseData.hasLicense ? '' : 'none';
      }
    } catch (licErr) {
      console.warn('Could not check self-hosted license status', licErr);
    }
  } catch (e) {
    console.warn('Could not load profile', e);
  }
}

// --- Dynamic Username Migration Modal ---
function showUsernameMigrationModal(profile) {
  if (document.getElementById('usernameMigrationModal')) return;

  const modal = document.createElement('div');
  modal.id = 'usernameMigrationModal';
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.style.zIndex = '9999';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width:400px; text-align: left;">
      <div class="modal-header" style="border-bottom: 1px solid #eef2f8; padding-bottom: 12px; margin-bottom: 16px;">
        <span style="font-weight:700; color:#0f1c2e; font-size:1.15rem;"><i class="fas fa-user-shield" style="color:#0066ff; margin-right:8px;"></i>Set Unique Username</span>
      </div>
      <p style="font-size:0.85rem; color:#5d7f9c; line-height:1.5; margin-bottom:16px;">
        We are transitioning from legacy full names to unique usernames. Please choose a unique username (3-15 characters, alphanumeric/underscores) to continue using your dashboard.
      </p>
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="font-weight:600; color:#1d4d6f; font-size:0.85rem; display:block; margin-bottom:6px;">Unique Username</label>
        <input type="text" id="migrationUsernameInput" placeholder="e.g. john_doe" style="width:100%; padding:10px 12px; border:1.5px solid #dce8f0; border-radius:12px; font-family:inherit; font-size:0.9rem; outline:none; box-sizing:border-box;">
        <div id="migrationStatus" style="font-size:0.75rem; margin-top:6px; color:#64748b;">Letters, numbers, or underscores only</div>
      </div>
      <button class="btn-primary" id="saveMigrationUsernameBtn" style="width:100%; background:#0066ff; color:white; border:none; padding:12px; border-radius:12px; font-weight:700; cursor:pointer; font-size:0.9rem; transition:0.2s;">Save Username</button>
    </div>
  `;
  document.body.appendChild(modal);

  const input = document.getElementById('migrationUsernameInput');
  const status = document.getElementById('migrationStatus');
  const btn = document.getElementById('saveMigrationUsernameBtn');
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.style.cursor = 'not-allowed';

  let checkTimeout = null;
  input.addEventListener('input', (e) => {
    const username = e.target.value.trim();
    clearTimeout(checkTimeout);
    
    if (username.length < 3 || username.length > 15 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      status.innerHTML = '❌ Must be 3-15 characters, alphanumeric/underscores.';
      status.style.color = '#dc3545';
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.style.cursor = 'not-allowed';
      return;
    }

    status.innerHTML = '⏳ Checking availability...';
    status.style.color = '#64748b';

    checkTimeout = setTimeout(async () => {
      try {
        const res = await fetch('/api/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.exists) {
            status.innerHTML = '❌ Username is already taken.';
            status.style.color = '#dc3545';
            btn.disabled = true;
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
          } else {
            status.innerHTML = '✅ Username is available!';
            status.style.color = '#28a745';
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
          }
        }
      } catch {
        status.innerHTML = '⚠️ Failed to verify availability.';
      }
    }, 500);
  });

  btn.addEventListener('click', async () => {
    const username = input.value.trim();
    if (username.length < 3 || username.length > 15 || !/^[a-zA-Z0-9_]+$/.test(username)) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Saving...';

    try {
      const success = await updateProfile(username, profile.email, profile.profilePicIndex);
      if (success) {
        modal.remove();
        alert('Username updated successfully!');
        window.location.reload();
      } else {
        status.innerHTML = '❌ Failed to save username. Try a different one.';
        status.style.color = '#dc3545';
        btn.disabled = false;
        btn.innerHTML = 'Save Username';
      }
    } catch (err) {
      status.innerHTML = '❌ Error saving username: ' + err.message;
      status.style.color = '#dc3545';
      btn.disabled = false;
      btn.innerHTML = 'Save Username';
    }
  });
}

// --- Save profile (including avatar) ---
async function updateProfile(name, email, avatarIndex) {
  try {
    await apiCall('/api/profile', {
      method: 'POST',
      body: JSON.stringify({ name, email, profilePicIndex: avatarIndex })
    });
    addActivity('Profile updated successfully');
    document.getElementById('dropdownUserName').innerText = name || 'User';
    document.getElementById('dropdownUserEmail').innerText = email || '';
    document.getElementById('welcomeMsg').innerHTML = `Welcome ${name || 'User'}`;
    updateNavbarAvatar(avatarIndex);
    return true;
  } catch (e) {
    addActivity('Profile update failed: ' + e.message, true);
    return false;
  }
}

// --- Download / Restore Backup File ---
async function restoreBackup(filename) {
  try {
    addActivity(`Downloading backup: ${filename}...`);
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    const res = await fetch(`/api/restore/${encodeURIComponent(filename)}`, { headers });
    if (!res.ok) throw new Error(await parseError(res, 'Download failed'));
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    addActivity(`Successfully downloaded: ${filename}`);
  } catch (e) {
    addActivity(`Download error: ${e.message}`, true);
    alert('Failed to download: ' + e.message);
  }
}

// --- Delete Single Backup File ---
async function deleteBackup(filename) {
  if (!confirm(`Are you sure you want to delete backup: ${filename}?`)) return;
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
    const res = await fetch(`/api/backup/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error(await parseError(res, 'Delete failed'));
    addActivity(`Deleted ${filename}`);
    await loadDashboard();
  } catch (e) {
    addActivity(`Delete failed: ${e.message}`, true);
  }
}

// --- Render Backups Vault List ---
function renderBackupList(backups) {
  const container = document.getElementById('backupListContainer');
  if (!container) return;
  container.innerHTML = '';

  if (backups.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:#6c8eaa;">
        <i class="fas fa-folder-open" style="font-size:3.5rem; color:#cbdde9; margin-bottom:12px; display:block;"></i>
        No backups stored in your vault, upload backup files from app.
      </div>`;
    return;
  }

  backups.forEach(b => {
    const item = document.createElement('div');
    item.className = 'backup-item';

    const date = new Date(b.time);
    const formattedDate = date.toLocaleString();
    // FIX #24: escapeHtml now also escapes ' and " so onclick attribute values are safe
    const safeName = escapeHtml(b.name);

    item.innerHTML = `
      <div class="backup-info" style="display:flex; align-items:center; gap:12px; min-width:200px;">
        <div style="background:#eef5fc; width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#1c6ef2;">
          <i class="fas fa-file-archive" style="font-size:1.2rem;"></i>
        </div>
        <div style="text-align: left;">
          <div class="backup-name" style="font-weight:600; color:#0e2f44; font-size:0.9rem; word-break:break-all;">${safeName}</div>
          <div class="backup-meta" style="font-size:0.75rem; color:#6c8eaa; margin-top:2px;">
            <span>${escapeHtml(b.size)}</span> • <span>${formattedDate}</span>
          </div>
        </div>
      </div>
      <div class="backup-actions" style="display:flex; gap:8px; margin-top:8px;">
        <button class="btn-download" onclick="restoreBackup('${safeName}')" style="background:#eef5fc; border:none; color:#1c6ef2; padding:8px 14px; border-radius:40px; font-weight:600; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; gap:6px; transition:0.2s;"><i class="fas fa-download"></i> Download</button>
        <button class="btn-delete" onclick="deleteBackup('${safeName}')" style="background:#fff2f2; border:none; color:#dc6b6b; padding:8px 14px; border-radius:40px; font-weight:600; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; gap:6px; transition:0.2s;"><i class="fas fa-trash-alt"></i> Delete</button>
      </div>
    `;
    container.appendChild(item);
  });
}

// --- Load Dashboard Data (Stats & Vault) ---
async function loadDashboard() {
  try {
    // 1. Fetch quota/info stats
    const infoRes = await fetch(`/api/info?_t=${Date.now()}`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('authToken') || '') }
    });
    if (!infoRes.ok) throw new Error('Failed to fetch info');
    const info = await infoRes.json();

    document.getElementById('backupCount').innerText = `${info.totalBackups || 0} / 3`;
    document.getElementById('storageUsed').innerText = `${info.storageUsedMB || '0.00'} / 240 MB`;

    // 2. Fetch backups list
    const backupsRes = await apiCall(`/api/backups?_t=${Date.now()}`);
    const backups = await backupsRes.json();

    // 3. Render list items
    renderBackupList(backups);

    // 4. Update last backup time and status
    if (backups.length > 0) {
      const latest = backups[0];
      const latestDate = new Date(latest.time).toLocaleString();
      document.getElementById('lastBackup').innerText = latestDate;
      document.getElementById('secureStatus').innerHTML = '<span style="color:#10b981; font-weight:600;">● Online</span>';

      const storageMB = parseFloat(info.storageUsedMB) || 0;
      // FIX #16: Use real quota from server instead of hardcoded 450 MB
      const quotaMB = parseFloat(info.quotaLimitMB) || 240;
      const warnThreshold = quotaMB * 0.85; // warn at 85% of quota
      if (storageMB > warnThreshold) {
        const warning = document.getElementById('storageWarning');
        warning.innerText = `⚠️ Warning: Storage quota almost full (${storageMB.toFixed(1)} / ${quotaMB} MB). Older backups will be automatically purged.`;
        warning.style.display = 'block';
      } else {
        document.getElementById('storageWarning').style.display = 'none';
      }
    } else {
      document.getElementById('lastBackup').innerText = '—';
      document.getElementById('secureStatus').innerHTML = '<span style="color:#94a3b8; font-weight:600;">● Empty</span>';
      document.getElementById('storageWarning').style.display = 'none';
    }
  } catch (e) {
    console.error('Error loading dashboard:', e);
    addActivity('Failed to refresh dashboard statistics', true);
  }
}

/* --- Upload Backup File ---
async function uploadBackup(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('policy', 'backup');

  const uploadBtn = document.getElementById('uploadBtn');
  const originalText = uploadBtn.innerHTML;
  uploadBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Uploading...';
  uploadBtn.disabled = true;

  try {
    // NOTE: Using fetch directly (not apiCall) to avoid overriding multipart Content-Type
    const res = await fetch('/api/backup', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    if (!res.ok) throw new Error(await parseError(res, 'Upload failed'));

    addActivity(`Uploaded backup: ${file.name}`);
    await loadDashboard();
  } catch (e) {
    addActivity(`Upload failed: ${e.message}`, true);
    alert('Upload failed: ' + e.message);
  } finally {
    uploadBtn.innerHTML = originalText;
    uploadBtn.disabled = false;
    document.getElementById('fileInput').value = '';
    document.getElementById('fileChosenText').innerText = 'Choose a file...';
  }
}*/

// --- Change Password ---
async function changePassword(oldPass, newPass, confirmPass) {
  if (newPass !== confirmPass) throw new Error('New passwords do not match');
  // FIX #7: Updated minimum to match server (8 chars)
  if (newPass.length < 8) throw new Error('Password must be at least 8 characters');
  await apiCall('/api/change-password', {
    method: 'POST',
    body: JSON.stringify({ oldPass, newPass })
  });
  addActivity('Password changed successfully');
}

// --- Logout ---
function logout() {
  const token = localStorage.getItem('authToken');
  const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
  fetch('/api/logout', { method: 'POST', headers }).catch(() => { });
  localStorage.removeItem('authToken');
  // FIX #31: Use /app/ not /app/index.html
  window.location.href = '/app/';
}

// --- Avatar Grid Builder ---
function buildAvatarGrid(containerId, selectedIdx, onSelect) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = '';
  AVATARS.forEach((av, idx) => {
    const div = document.createElement('div');
    div.className = `avatar-option ${selectedIdx === idx ? 'selected' : ''}`;
    div.innerHTML = `<i class="${av.icon}" style="font-size: 2rem; color:${av.color};"></i>`;
    div.onclick = () => {
      document.querySelectorAll(`#${containerId} .avatar-option`).forEach(opt => opt.classList.remove('selected'));
      div.classList.add('selected');
      onSelect(idx);
    };
    grid.appendChild(div);
  });
}

// --- Modal handling ---
function closeAllModals() {
  document.getElementById('editProfileModal').style.display = 'none';
  document.getElementById('changePwdModal').style.display = 'none';
  document.getElementById('securityQModal').style.display = 'none';
  if (document.getElementById('billingModal')) {
    document.getElementById('billingModal').style.display = 'none';
  }
  if (document.getElementById('mfaModal')) {
    document.getElementById('mfaModal').style.display = 'none';
  }
}

async function openEditProfileModal() {
  try {
    const res = await apiCall(`/api/profile?_t=${Date.now()}`, { method: 'GET' });
    const profile = await res.json();
    currentProfileName = profile.name || '';
    
    document.getElementById('editName').value = profile.name || '';
    document.getElementById('editEmail').value = profile.email || '';
    
    const customFile = document.getElementById('customAvatarFile');
    if (customFile) customFile.value = '';
    
    currentAvatarIndex = profile.profilePicIndex !== undefined ? profile.profilePicIndex : 0;
    buildAvatarGrid('editAvatarGrid', currentAvatarIndex, (idx) => { currentAvatarIndex = idx; });
    
    // Update label to Username
    const nameLabel = document.querySelector('#editProfileModal label');
    if (nameLabel) nameLabel.innerText = 'Username';

    // Set up status element
    let statusEl = document.getElementById('editUsernameStatus');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'editUsernameStatus';
      statusEl.style.fontSize = '0.75rem';
      statusEl.style.marginTop = '4px';
      statusEl.style.color = '#64748b';
      document.getElementById('editName').parentNode.appendChild(statusEl);
    }
    statusEl.innerHTML = 'Alphanumeric and underscores only';
    statusEl.style.color = '#64748b';

    document.getElementById('editProfileModal').style.display = 'flex';
  } catch (e) {
    console.error('Profile load error:', e);
    alert('Could not load profile data.');
  }
}

// Global setup for editName input to prevent memory leaks and handle debounced check
let editNameTimeout = null;
document.addEventListener('DOMContentLoaded', () => {
  const editNameInput = document.getElementById('editName');
  const saveBtn = document.getElementById('saveProfileBtn');
  if (!editNameInput) return;

  editNameInput.addEventListener('input', (e) => {
    const username = e.target.value.trim();
    const statusEl = document.getElementById('editUsernameStatus');
    if (!statusEl) return;

    clearTimeout(editNameTimeout);

    if (username === currentProfileName) {
      statusEl.innerHTML = '✅ Current username';
      statusEl.style.color = '#28a745';
      saveBtn.disabled = false;
      saveBtn.style.opacity = '1';
      saveBtn.style.cursor = 'pointer';
      return;
    }

    if (username.length < 3 || username.length > 15 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      statusEl.innerHTML = '❌ Must be 3-15 characters, alphanumeric/underscores.';
      statusEl.style.color = '#dc3545';
      saveBtn.disabled = true;
      saveBtn.style.opacity = '0.6';
      saveBtn.style.cursor = 'not-allowed';
      return;
    }

    statusEl.innerHTML = '⏳ Checking availability...';
    statusEl.style.color = '#64748b';

    editNameTimeout = setTimeout(async () => {
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
            saveBtn.disabled = true;
            saveBtn.style.opacity = '0.6';
            saveBtn.style.cursor = 'not-allowed';
          } else {
            statusEl.innerHTML = '✅ Username is available!';
            statusEl.style.color = '#28a745';
            saveBtn.disabled = false;
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
          }
        }
      } catch {
        statusEl.innerHTML = '⚠️ Connection error.';
      }
    }, 500);
  });
});

function openChangePwdModal() {
  document.getElementById('currentPwd').value = '';
  document.getElementById('newPwd').value = '';
  document.getElementById('confirmPwd').value = '';
  document.getElementById('pwdError').innerText = '';
  document.getElementById('changePwdModal').style.display = 'flex';
}

document.getElementById('clearAllBtn').addEventListener('click', async () => {
  if (!confirm('Are you sure you want to purge all backups? This action cannot be undone.')) return;
  // FIX #17: Check each delete result and report failures
  let failed = 0;
  try {
    const res = await apiCall(`/api/backups?_t=${Date.now()}`);
    const backups = await res.json();
    for (const b of backups) {
      const token = localStorage.getItem('authToken');
      const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
      const delRes = await fetch(`/api/backup/${encodeURIComponent(b.name)}`, { method: 'DELETE', headers });
      if (!delRes.ok) {
        failed++;
        addActivity(`Failed to delete: ${b.name}`, true);
      }
    }
    if (failed === 0) {
      addActivity('Purged all backups from the server');
    } else {
      addActivity(`Purge complete with ${failed} error(s). Check activity log.`, true);
    }
    await loadDashboard();
  } catch (e) {
    addActivity('Clear all failed: ' + e.message, true);
  }
});

// Dropdown Toggle
document.getElementById('profileIconBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  const menu = document.getElementById('dropdownMenu');
  menu.classList.toggle('show');
});

window.addEventListener('click', () => {
  document.getElementById('dropdownMenu').classList.remove('show');
});

document.getElementById('editProfileItem').addEventListener('click', () => {
  document.getElementById('dropdownMenu').classList.remove('show');
  openEditProfileModal();
});

document.getElementById('changePasswordItem').addEventListener('click', () => {
  document.getElementById('dropdownMenu').classList.remove('show');
  openChangePwdModal();
});

document.getElementById('securityQItem').addEventListener('click', () => {
  document.getElementById('dropdownMenu').classList.remove('show');
  openSecurityQModal();
});

document.getElementById('mfaSettingsItem').addEventListener('click', () => {
  document.getElementById('dropdownMenu').classList.remove('show');
  openMfaModal();
});

document.getElementById('billingItem').addEventListener('click', () => {
  document.getElementById('dropdownMenu').classList.remove('show');
  openBillingModal();
});

document.getElementById('selfHostItem').addEventListener('click', () => {
  document.getElementById('dropdownMenu').classList.remove('show');
  window.open('/self-host/', '_blank');
});

document.getElementById('logoutItem').addEventListener('click', logout);

document.getElementById('saveProfileBtn').addEventListener('click', async () => {
  const name = document.getElementById('editName').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  
  if (name.length < 3 || name.length > 15 || !/^[a-zA-Z0-9_]+$/.test(name)) {
    alert("Username must be 3-15 characters, containing only letters, numbers, or underscores.");
    return;
  }
  
  const btn = document.getElementById('saveProfileBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Saving...';
  
  const profileSuccess = await updateProfile(name, email, currentAvatarIndex);
  btn.disabled = false;
  btn.innerHTML = 'Save changes';
  if (profileSuccess) {
    const fileInput = document.getElementById('customAvatarFile');
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const formData = new FormData();
      formData.append('avatar', file);
      
      const token = localStorage.getItem('authToken');
      const headers = {};
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }
      
      addActivity('Uploading custom profile picture...');
      try {
        const uploadRes = await fetch('/api/profile/avatar', {
          method: 'POST',
          headers,
          body: formData
        });
        if (!uploadRes.ok) {
          throw new Error('Avatar upload failed');
        }
        addActivity('Custom profile picture uploaded successfully');
      } catch (uploadErr) {
        addActivity('Failed to upload custom profile picture: ' + uploadErr.message, true);
        alert('Failed to upload custom profile picture: ' + uploadErr.message);
      }
    }
  }
  
  await loadUserProfile();
  document.getElementById('editProfileModal').style.display = 'none';
});

document.getElementById('updatePwdBtn').addEventListener('click', async () => {
  const oldPass = document.getElementById('currentPwd').value;
  const newPass = document.getElementById('newPwd').value;
  const confirmVal = document.getElementById('confirmPwd').value;
  const errSpan = document.getElementById('pwdError');
  try {
    await changePassword(oldPass, newPass, confirmVal);
    errSpan.innerText = '✓ Password changed!';
    errSpan.style.color = '#2b7e3a';
    setTimeout(() => {
      document.getElementById('changePwdModal').style.display = 'none';
      errSpan.innerText = '';
    }, 1500);
  } catch (e) {
    errSpan.innerText = e.message;
    errSpan.style.color = '#dc6b6b';
  }
});

// --- Open Billing & Subscriptions Modal ---
async function openBillingModal() {
  const container = document.getElementById('billingContent');
  if (!container) return;

  container.innerHTML = `<div style="text-align:center; padding: 30px;"><i class="fas fa-spinner fa-pulse" style="font-size:1.8rem; color:#0066ff;"></i></div>`;
  document.getElementById('billingModal').style.display = 'flex';

  try {
    const profileRes = await apiCall(`/api/profile?_t=${Date.now()}`, { method: 'GET' });
    const profile = await profileRes.json();

    const licenseRes = await apiCall(`/api/licenses/check?_t=${Date.now()}`, { method: 'GET' });
    const licenseData = await licenseRes.json();

    const planName = profile.plan || 'unpaid';
    const status = profile.subscriptionStatus || 'none';
    const hasLicense = licenseData.hasLicense || false;
    const licenseKey = licenseData.licenseKey || '';

    let html = `
      <div class="billing-status-card" style="background: linear-gradient(135deg, #f5f8ff, #f0f4fb); padding: 18px; border-radius: 16px; margin-bottom: 20px; border: 1px solid #dce5ef; display: flex; flex-direction: column; gap: 8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:600; color:#2c5a7a; font-size: 0.95rem;">Current Account Plan:</span>
          <span style="font-weight:800; color:#0066ff; text-transform:uppercase; font-size: 1rem;">${planName}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:600; color:#2c5a7a; font-size: 0.95rem;">Subscription Status:</span>
          <span style="font-weight:800; color:${status === 'active' ? '#10b981' : '#dc6b6b'}; font-size: 1rem;">${status === 'active' ? 'Active' : 'Inactive'}</span>
        </div>
        ${hasLicense ? `
        <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid #dce5ef; padding-top: 8px; margin-top: 4px;">
          <span style="font-weight:600; color:#2c5a7a; font-size: 0.95rem;">Self-Hosted Key Status:</span>
          <span style="font-weight:800; color:#10b981; font-size: 1rem;">Active</span>
        </div>
        ` : ''}
      </div>

      <h4 style="font-weight:700; color:#0f1c2e; margin-bottom: 12px; font-size: 1rem; border-bottom: 1px solid #e8eef6; padding-bottom: 8px;">Available Plans & Management</h4>

      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- Free Plan Row -->
        <div style="border: 1px solid #e8eef6; padding: 14px; border-radius: 14px; background: #fafcff; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; color: #0f1c2e; font-size: 0.95rem;">Free Plan</div>
            <div style="font-size: 0.78rem; color: #5d7f9c; margin-top: 2px;">Local backups only, no cloud storage</div>
          </div>
          ${(planName !== 'premium' && !hasLicense) ? `
            <span style="font-size: 0.75rem; font-weight: 700; color: #5d7f9c; background: #e8eef6; padding: 4px 10px; border-radius: 20px;">Current Plan</span>
          ` : ''}
        </div>

        <!-- Premium Subscription Row -->
        <div style="border: 1px solid #e8eef6; padding: 14px; border-radius: 14px; background: #fafcff; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; color: #0f1c2e; font-size: 0.95rem;">Cloud Premium Subscription</div>
            <div style="font-size: 0.78rem; color: #5d7f9c; margin-top: 2px;">Secure auto cloud backup vault (₹50/month)</div>
          </div>
          <div style="flex-shrink:0;">
    `;

    if (planName === 'premium' && status === 'active') {
      html += `
        <button onclick="cancelDashboardSubscription(this)" style="background:#fff2f2; border:none; color:#dc6b6b; padding:8px 16px; border-radius:40px; font-weight:600; font-size:0.8rem; cursor:pointer; display:flex; align-items:center; gap:6px; transition:0.2s;">
          <i class="fas fa-times-circle"></i> Cancel
        </button>
      `;
    } else {
      html += `
        <a href="/pricing/checkout.html?type=subscription" class="btn-primary" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px; background:#0066ff; color:white; padding:8px 16px; border-radius:40px; font-weight:700; font-size:0.8rem; width:auto; margin-top:0; border:none;">
          Subscribe
        </a>
      `;
    }

    html += `
          </div>
        </div>

        <!-- Self-Hosted License Row -->
        <div style="border: 1px solid #e8eef6; padding: 14px; border-radius: 14px; background: #fafcff; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; color: #0f1c2e; font-size: 0.95rem;">Self-Hosted License Key</div>
              <div style="font-size: 0.78rem; color: #5d7f9c; margin-top: 2px;">Deploy backend on your own server (₹1,499/year)</div>
            </div>
            <div style="flex-shrink:0;">
    `;

    if (hasLicense) {
      html += `
        <span style="font-size: 0.75rem; font-weight: 700; color: #10b981; background: #e0f5f0; padding: 4px 10px; border-radius: 20px;">Active</span>
      `;
    } else {
      html += `
        <a href="/pricing/checkout.html?type=license" class="btn-primary" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px; background:#0066ff; color:white; padding:8px 16px; border-radius:40px; font-weight:700; font-size:0.8rem; width:auto; margin-top:0; border:none;">
          Purchase
        </a>
      `;
    }

    html += `
            </div>
          </div>
    `;

    if (hasLicense) {
      html += `
          <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; padding: 12px; border-radius: 8px; margin-top: 4px; text-align: left;">
            <div style="font-size: 0.72rem; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Your Active License Key:</div>
            <div id="selfHostedKeyOutput" style="font-family: monospace; font-size: 0.8rem; word-break: break-all; color: #334155; margin-bottom: 8px; user-select: all;">${licenseKey}</div>
            <div style="display: flex; gap: 8px;">
              <button onclick="copyDashboardLicenseKey()" style="background:#e2e8f0; border:none; padding:4px 8px; border-radius:4px; font-size:0.7rem; font-weight:600; cursor:pointer; color:#334155; display:inline-flex; align-items:center; gap:4px;"><i class="far fa-copy"></i> Copy Key</button>
              <a href="/self-host/" target="_blank" style="background:#e8f0ff; text-decoration:none; padding:4px 8px; border-radius:4px; font-size:0.7rem; font-weight:600; color:#0066ff; display:inline-flex; align-items:center; gap:4px;"><i class="fas fa-book"></i> Setup Guide</a>
            </div>
          </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  } catch (e) {
    console.error('Failed to load billing status', e);
    container.innerHTML = `<div style="text-align:center; padding: 20px; color:#dc6b6b;">Failed to retrieve billing status: ${e.message}</div>`;
  }
}

function copyDashboardLicenseKey() {
  const keyEl = document.getElementById('selfHostedKeyOutput');
  if (keyEl) {
    navigator.clipboard.writeText(keyEl.innerText).then(() => {
      alert("License key copied to clipboard!");
    });
  }
}

async function cancelDashboardSubscription(btn) {
  if (!confirm("Are you sure you want to cancel your Premium Subscription?")) return;
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Cancelling...';
  btn.disabled = true;

  try {
    const res = await apiCall('/api/subscription/cancel-mock', { method: 'POST' });
    const data = await res.json();
    alert(data.message || "Subscription cancelled successfully.");
    addActivity("Premium subscription cancelled");
    await loadDashboard();
    await openBillingModal();
  } catch (e) {
    alert("Cancellation failed: " + e.message);
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

// --- Open Security Question Modal ---
async function openSecurityQModal() {
  // Reset fields
  document.getElementById('sqAnswer').value = '';
  document.getElementById('sqCurrentPwd').value = '';
  const msg = document.getElementById('sqMsg');
  msg.innerText = '';

  // Pre-select the user's current security question
  try {
    const res = await apiCall(`/api/profile/security-question?_t=${Date.now()}`);
    const data = await res.json();
    if (data.securityQuestion) {
      const sel = document.getElementById('sqQuestion');
      // Find matching option and select it
      for (const opt of sel.options) {
        if (opt.value === data.securityQuestion) {
          opt.selected = true;
          break;
        }
      }
    }
  } catch (e) {
    // Non-critical: if fetch fails just show modal with default selected
  }

  document.getElementById('securityQModal').style.display = 'flex';
}

// --- Save Security Question ---
document.getElementById('saveSecurityQBtn').addEventListener('click', async () => {
  const question = document.getElementById('sqQuestion').value;
  const answer = document.getElementById('sqAnswer').value.trim();
  const currentPassword = document.getElementById('sqCurrentPwd').value;
  const msg = document.getElementById('sqMsg');

  msg.innerText = '';
  if (!answer || answer.length < 2) {
    msg.innerText = 'Please enter your answer (at least 2 characters).';
    msg.style.color = '#dc6b6b';
    return;
  }
  if (!currentPassword) {
    msg.innerText = 'Current password is required to save.';
    msg.style.color = '#dc6b6b';
    return;
  }

  const btn = document.getElementById('saveSecurityQBtn');
  btn.disabled = true;
  btn.innerText = 'Saving...';

  try {
    const res = await apiCall('/api/profile/security', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, securityQuestion: question, securityAnswer: answer })
    });
    const data = await res.json();
    msg.innerText = '✓ ' + (data.message || 'Security question updated!');
    msg.style.color = '#2b7e3a';
    addActivity('Security question updated');
    setTimeout(() => {
      document.getElementById('securityQModal').style.display = 'none';
      msg.innerText = '';
    }, 1600);
  } catch (e) {
    msg.innerText = e.message || 'Failed to update security question.';
    msg.style.color = '#dc6b6b';
  } finally {
    btn.disabled = false;
    btn.innerText = 'Save Security Question';
  }
});

document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.modal').style.display = 'none';
  });
});

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) e.target.style.display = 'none';
});

const fileInput = document.getElementById('fileInput');
const fileChosenText = document.getElementById('fileChosenText');

if (fileInput && fileChosenText) {
  fileInput.addEventListener('change', function () {
    fileChosenText.innerText =
      this.files[0] ? this.files[0].name : 'Choose a file...';
  });
}

// --- Two-Factor Authentication (2FA) ---
async function openMfaModal() {
  try {
    const res = await apiCall(`/api/profile?_t=${Date.now()}`);
    const profile = await res.json();
    if (profile.twoFactorEnabled) {
      showActiveMfaView();
    } else {
      await startMfaSetup();
    }
    document.getElementById('mfaModal').style.display = 'flex';
  } catch (err) {
    alert("Failed to retrieve profile status: " + err.message);
  }
}

async function startMfaSetup() {
  const setupMsg = document.getElementById('mfa-setup-msg');
  setupMsg.innerText = '';
  document.getElementById('mfa-setup-code').value = '';
  
  try {
    const res = await apiCall('/api/profile/2fa/setup', { method: 'POST' });
    const data = await res.json();
    
    const qrContainer = document.getElementById('mfa-qrcode');
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: data.otpauthUrl,
      width: 160,
      height: 160,
      colorDark: "#0f172a",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    
    document.getElementById('mfa-secret-text').innerText = data.secret;
    
    document.getElementById('mfa-setup-view').style.display = 'flex';
    document.getElementById('mfa-active-view').style.display = 'none';
    document.getElementById('mfa-disable-view').style.display = 'none';
  } catch (err) {
    alert("Failed to initialize 2FA setup: " + err.message);
  }
}

function showActiveMfaView() {
  document.getElementById('mfa-setup-view').style.display = 'none';
  document.getElementById('mfa-active-view').style.display = 'flex';
  document.getElementById('mfa-disable-view').style.display = 'none';
}

function showDisableMfaForm() {
  document.getElementById('mfa-disable-pwd').value = '';
  document.getElementById('mfa-disable-code').value = '';
  document.getElementById('mfa-disable-msg').innerText = '';
  
  document.getElementById('mfa-setup-view').style.display = 'none';
  document.getElementById('mfa-active-view').style.display = 'none';
  document.getElementById('mfa-disable-view').style.display = 'flex';
}

document.getElementById('showMfaDisableBtn').addEventListener('click', showDisableMfaForm);
document.getElementById('cancelMfaDisableBtn').addEventListener('click', showActiveMfaView);

document.getElementById('confirmMfaSetupBtn').addEventListener('click', async () => {
  const code = document.getElementById('mfa-setup-code').value;
  const msg = document.getElementById('mfa-setup-msg');
  msg.innerText = '';
  
  if (!code || code.length !== 6) {
    msg.innerText = 'Please enter a 6-digit code.';
    msg.style.color = '#dc6b6b';
    return;
  }
  
  try {
    const res = await apiCall('/api/profile/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    alert("Two-Factor Authentication is now enabled!");
    showActiveMfaView();
    addActivity("Two-Factor Authentication enabled");
  } catch (err) {
    msg.innerText = err.message || 'Incorrect verification code.';
    msg.style.color = '#dc6b6b';
  }
});

document.getElementById('confirmMfaDisableBtn').addEventListener('click', async () => {
  const password = document.getElementById('mfa-disable-pwd').value;
  const code = document.getElementById('mfa-disable-code').value;
  const msg = document.getElementById('mfa-disable-msg');
  msg.innerText = '';
  
  if (!password) {
    msg.innerText = 'Password is required.';
    msg.style.color = '#dc6b6b';
    return;
  }
  if (!code || code.length !== 6) {
    msg.innerText = 'Authenticator code is required (6 digits).';
    msg.style.color = '#dc6b6b';
    return;
  }
  
  try {
    await apiCall('/api/profile/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ password, code })
    });
    alert("Two-Factor Authentication has been disabled.");
    document.getElementById('mfaModal').style.display = 'none';
    addActivity("Two-Factor Authentication disabled");
  } catch (err) {
    msg.innerText = err.message || 'Failed to disable 2FA. Check password and code.';
    msg.style.color = '#dc6b6b';
  }
});

// --- Initial load ---
(async () => {
  try {
    console.log("1. Checking session");
    await apiCall(`/api/backups?_t=${Date.now()}`);

    console.log("2. Loading profile");
    await loadUserProfile();

    console.log("3. Loading dashboard");
    await loadDashboard();
  } catch (e) {
    console.error("Init failed:", e);
  }
})();
