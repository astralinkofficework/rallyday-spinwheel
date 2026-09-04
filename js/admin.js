let currentPage = 1;
let currentQuery = '';
let totalPages = 1;
let submissionsOpen = true;
let isAuthenticated = false;

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const entriesTable = document.getElementById('entriesTable');
const emptyState = document.getElementById('emptyState');
const pagination = document.getElementById('pagination');
const winnersList = document.getElementById('winnersList');
const winnersEmpty = document.getElementById('winnersEmpty');
const entryCount = document.getElementById('entryCount');
const winnerCount = document.getElementById('winnerCount');
const submissionsStatus = document.getElementById('submissionsStatus');
const submissionsToggle = document.getElementById('submissionsToggle');
const resetBtn = document.getElementById('resetBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginSection = document.getElementById('loginSection');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const adminPassword = document.getElementById('adminPassword');
const loginMessage = document.getElementById('loginMessage');

async function checkAuth() {
  try {
    const res = await fetch('/api/admin/check');
    const data = await res.json();
    isAuthenticated = data.authenticated;
    updateAuthUI();
  } catch (e) {
    console.warn('Could not check auth status');
  }
}

function updateAuthUI() {
  if (isAuthenticated) {
    loginSection.style.display = 'none';
    adminPanel.style.display = 'block';
    loadAdminData();
  } else {
    loginSection.style.display = 'block';
    adminPanel.style.display = 'none';
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = adminPassword.value;
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) {
      showLoginMessage(data.error || 'Login failed', 'error');
      playSound('error');
      return;
    }
    isAuthenticated = true;
    updateAuthUI();
    playSound('click');
  } catch (e) {
    showLoginMessage('Network error', 'error');
    playSound('error');
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
  } catch (e) {}
  isAuthenticated = false;
  updateAuthUI();
  playSound('click');
});

function showLoginMessage(msg, type) {
  const icon = type === 'success' ? Icons.check : Icons.alert;
  loginMessage.innerHTML = icon + ' ' + escapeHtml(msg);
  loginMessage.className = `form-message show ${type}`;
  clearTimeout(loginMessage._timeout);
  loginMessage._timeout = setTimeout(() => loginMessage.classList.remove('show'), 4500);
}

async function loadAdminData() {
  if (!isAuthenticated) return;

  const params = new URLSearchParams();
  params.set('page', currentPage);
  params.set('limit', '10');
  if (currentQuery) params.set('q', currentQuery);

  try {
    const res = await fetch(`/api/entries/search?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load');
    const data = await res.json();
    totalPages = data.pagination.totalPages;
    renderTargetStatus(data.forcedWinner);
    renderEntries(data.entries, data.forcedWinner);
    renderPagination(data.pagination);
    renderWinners(data.winners);
    updateStats(data);
  } catch (e) {
    showToast('Failed to load admin data', Icons.alert);
  }
}

function renderTargetStatus(forcedWinner) {
  let targetBox = document.getElementById('targetWinnerBox');
  if (!targetBox) {
    targetBox = document.createElement('div');
    targetBox.id = 'targetWinnerBox';
    targetBox.style.marginBottom = '1.5rem';
    const statsGrid = document.querySelector('.admin-stat')?.parentElement;
    if (statsGrid) {
      statsGrid.parentNode.insertBefore(targetBox, statsGrid.nextSibling);
    }
  }

  if (forcedWinner && forcedWinner.name) {
    targetBox.innerHTML = `
      <div style="background:rgba(255,214,10,0.15);border:1px solid var(--yellow);padding:1rem 1.25rem;border-radius:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.75rem">
        <div style="display:flex;align-items:center;gap:.75rem">
          <span style="font-size:1.5rem">🎯</span>
          <div>
            <div style="font-weight:800;color:var(--yellow);font-size:1rem">Target Winner Queued: ${escapeHtml(forcedWinner.name)}</div>
            <div style="font-size:.8rem;color:var(--text-muted)">The wheel will spin and land directly on ${escapeHtml(forcedWinner.name)}</div>
          </div>
        </div>
        <button class="admin-btn danger" style="padding:.4rem .9rem;font-size:.8rem" onclick="clearForcedWinner()">Cancel Target</button>
      </div>
    `;
    targetBox.style.display = 'block';
  } else {
    targetBox.style.display = 'none';
    targetBox.innerHTML = '';
  }
}

window.clearForcedWinner = async function() {
  try {
    await fetch('/api/force-win/clear', { method: 'POST' });
    showToast('Target winner cancelled', Icons.refresh);
    await loadAdminData();
  } catch (e) {
    showToast('Failed to cancel target', Icons.alert);
  }
};

function renderEntries(entries, forcedWinner) {
  if (!entries || entries.length === 0) {
    entriesTable.innerHTML = '';
    emptyState.style.display = 'block';
    pagination.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  pagination.style.display = 'flex';
  entriesTable.innerHTML = entries.map(entry => {
    const name = typeof entry === 'string' ? entry : (entry.name || '');
    const id = typeof entry === 'object' && entry.id ? entry.id : '';
    const ts = typeof entry === 'object' && entry.timestamp ? new Date(entry.timestamp).toLocaleString() : new Date().toLocaleString();
    const color = wheelColors[Math.floor(Math.random() * wheelColors.length)];
    const isTarget = forcedWinner && ((id && forcedWinner.id === id) || (name && forcedWinner.name.toLowerCase() === name.toLowerCase()));

    return `
      <tr style="border-bottom:1px solid var(--glass-border);background:${isTarget ? 'rgba(255,214,10,0.1)' : 'transparent'};transition:background .2s" onmouseenter="this.style.background='rgba(255,255,255,.05)'" onmouseleave="this.style.background='${isTarget ? 'rgba(255,214,10,0.1)' : 'transparent'}'">
        <td style="padding:.85rem 1rem">
          <div style="display:flex;align-items:center;gap:.75rem">
            <div class="entry-dot" style="background:${color};color:${color}"></div>
            <div>
              <div style="font-weight:700;font-size:.95rem;display:flex;align-items:center;gap:.5rem">
                ${escapeHtml(name)}
                ${isTarget ? '<span style="background:var(--yellow);color:#000;font-size:.65rem;font-weight:800;padding:.15rem .45rem;border-radius:999px">NEXT WINNER</span>' : ''}
              </div>
              <div style="font-size:.75rem;color:var(--text-muted);margin-top:.15rem">${escapeHtml(id.slice(0, 8))}...</div>
            </div>
          </div>
        </td>
        <td style="padding:.85rem 1rem;font-size:.85rem;color:var(--text-muted)">${ts}</td>
        <td style="padding:.85rem 1rem;text-align:center">
          <span class="status-badge entry-badge">Entry</span>
        </td>
        <td style="padding:.85rem 1rem;text-align:right">
          <div style="display:flex;gap:.5rem;justify-content:flex-end">
            <button class="action-btn win" data-action="win" data-id="${escapeHtml(id)}" data-name="${escapeHtml(name)}" title="Spin & Land on ${escapeHtml(name)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
            </button>
            <button class="action-btn ban" data-action="ban" data-id="${escapeHtml(id)}" data-name="${escapeHtml(name)}" title="Ban User">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  entriesTable.querySelectorAll('.action-btn.win').forEach(btn => {
    btn.addEventListener('click', () => forceWin(btn.dataset.id, btn.dataset.name));
  });
  entriesTable.querySelectorAll('.action-btn.ban').forEach(btn => {
    btn.addEventListener('click', () => banUser(btn.dataset.id, btn.dataset.name));
  });
}

function renderWinners(winners) {
  if (!winners || winners.length === 0) {
    winnersList.innerHTML = '';
    winnersEmpty.style.display = 'block';
    return;
  }

  winnersEmpty.style.display = 'none';
  winnersList.innerHTML = winners.slice(0, 20).map(w => `
    <span class="winner-chip">${escapeHtml(w.name)} <span style="opacity:.7;font-size:.75em">${new Date(w.wonAt).toLocaleTimeString()}</span></span>
  `).join('');
}

function renderPagination(pagination) {
  if (pagination.totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  const { page, totalPages: total, hasNext, hasPrev } = pagination;
  let html = '<div style="display:flex;gap:.5rem;align-items:center">';
  html += `<button class="admin-btn" ${!hasPrev ? 'disabled' : ''} onclick="goToPage(${page - 1})">Prev</button>`;
  html += `<span style="color:var(--text-muted);font-size:.85rem;font-weight:600">Page ${page} of ${total}</span>`;
  html += `<button class="admin-btn" ${!hasNext ? 'disabled' : ''} onclick="goToPage(${page + 1})">Next</button>`;
  html += '</div>';
  html += `<div style="color:var(--text-muted);font-size:.85rem">${pagination.total} total entries</div>`;
  pagination.innerHTML = html;
}

window.goToPage = function(page) {
  currentPage = page;
  loadAdminData();
};

async function banUser(id, name) {
  if (!confirm(`Ban "${name}"? This will remove them from entries.`)) return;
  try {
    const res = await fetch('/api/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to ban', Icons.alert);
      return;
    }
    showToast(`${name} has been banned`, Icons.close);
    await loadAdminData();
  } catch (e) {
    showToast('Failed to ban user', Icons.alert);
  }
}

async function forceWin(id, name) {
  if (!confirm(`Set "${name}" as the NEXT winner?\n\nWhen a player clicks SPIN on the wheel, the wheel will spin normally and land on ${name}.`)) return;
  try {
    const res = await fetch('/api/force-win', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name })
    });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Already a winner or not found', Icons.alert);
      return;
    }
    showToast(`🎯 Next winner set to "${name}". Ready on wheel!`, Icons.trophy);
    await loadAdminData();
  } catch (e) {
    showToast('Failed to set next winner', Icons.alert);
  }
}

async function toggleSubmissions() {
  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ open: !submissionsOpen })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Failed');
    submissionsOpen = data.submissionsOpen;
    updateSubmissionsUI();
    showToast(submissionsOpen ? 'Submissions opened' : 'Submissions closed', submissionsOpen ? Icons.check : Icons.close);
  } catch (e) {
    showToast('Failed to toggle submissions', Icons.alert);
  }
}

function updateSubmissionsUI() {
  submissionsStatus.textContent = submissionsOpen ? 'Open' : 'Closed';
  submissionsStatus.style.color = submissionsOpen ? 'var(--green)' : 'var(--red)';
  submissionsToggle.innerHTML = submissionsOpen
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg> Close Submissions'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg> Open Submissions';
}

function updateStats(data) {
  entryCount.textContent = data.entries.length;
  winnerCount.textContent = data.winners.length;
}

searchBtn.addEventListener('click', () => {
  currentQuery = searchInput.value.trim();
  currentPage = 1;
  loadAdminData();
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  currentQuery = '';
  currentPage = 1;
  loadAdminData();
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    currentQuery = searchInput.value.trim();
    currentPage = 1;
    loadAdminData();
  }
});

submissionsToggle.addEventListener('click', toggleSubmissions);

resetBtn.addEventListener('click', async () => {
  if (!confirm('Reset all? Winners will be restored to entries.')) return;
  try {
    await fetch('/api/reset', { method: 'POST' });
    showToast('All reset', Icons.refresh);
    await loadAdminData();
  } catch (e) {
    showToast('Reset failed', Icons.alert);
  }
});

const adminAddEntryForm = document.getElementById('adminAddEntryForm');
const adminAddNameInput = document.getElementById('adminAddNameInput');

if (adminAddEntryForm && adminAddNameInput) {
  adminAddEntryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = adminAddNameInput.value.trim();
    if (!name) {
      showToast('Please enter a participant name', Icons.alert);
      return;
    }

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to add participant', Icons.alert);
        playSound('error');
        return;
      }
      showToast(`🎉 "${name}" added to the wheel!`, Icons.check);
      playSound('pop');
      adminAddNameInput.value = '';
      adminAddNameInput.focus();
      await loadAdminData();
    } catch (err) {
      showToast('Network error — failed to add participant', Icons.alert);
      playSound('error');
    }
  });
}

onStateChange(() => {
  if (isAuthenticated) {
    loadAdminData();
  }
});

async function initAdmin() {
  await checkAuth();
}

initAdmin();
