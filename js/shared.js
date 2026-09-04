// ==================== ICONS ====================
const Icons = {
  wheel: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="20" r="14"/><circle cx="24" cy="20" r="2.5" fill="currentColor"/><path d="M24 6v28M10 20h28M14.1 10.1l19.8 19.8M33.9 10.1L14.1 29.9"/><path d="M18 44h12M20 44V34M28 44V34"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  trophy: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 6h20v8a10 10 0 0 1-20 0V6z" fill="currentColor" fill-opacity="0.15"/><path d="M14 10H8a4 4 0 0 0 4 4h2M34 10h6a4 4 0 0 1-4 4h-2"/><path d="M24 24v6M18 36h12M16 42h16M20 36v6M28 36v6"/></svg>',
  party: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-1.29.37a2 2 0 0 1-2.42-1.29l-.13-.38"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="18" y1="14" x2="18" y2="18"/><line x1="21" y1="18" x2="21" y2="21"/></svg>',
  soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
};

// ==================== STATE (Real-time SSE + Polling + BroadcastChannel) ====================
let currentData = { entries: [], winners: [], submissionsOpen: true, forcedWinner: null };
const stateListeners = [];
let pollTimer = null;
let sseSource = null;
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('rally_day_sync') : null;

function sanitizeData(raw) {
  if (!raw) return { entries: [], winners: [], submissionsOpen: true, forcedWinner: null };
  return {
    entries: Array.isArray(raw.entries) ? raw.entries : [],
    winners: Array.isArray(raw.winners) ? raw.winners : [],
    submissionsOpen: raw.submissionsOpen !== false,
    forcedWinner: raw.forcedWinner || null
  };
}

async function loadState() {
  try {
    const res = await fetch('/api/entries', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load state');
    const fresh = await res.json();
    currentData = sanitizeData(fresh);
    notifyState({ type: 'state-update', data: currentData });
  } catch (e) {
    console.warn('Could not reach server, using cached state:', e.message);
  }
}

function notifyState(payload) {
  stateListeners.forEach(fn => {
    try {
      fn(currentData, payload);
    } catch (err) {
      console.error('Error in state listener:', err);
    }
  });
}

function onStateChange(fn) {
  stateListeners.push(fn);
  if (currentData && (currentData.entries.length > 0 || currentData.winners.length > 0)) {
    try { fn(currentData, { type: 'state-update', data: currentData }); } catch (e) {}
  }
}

function initSSE() {
  if (typeof EventSource === 'undefined') return;
  try {
    if (sseSource) {
      sseSource.close();
    }
    sseSource = new EventSource('/api/events');
    sseSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload) {
          if (payload.data) {
            currentData = sanitizeData(payload.data);
          }
          notifyState(payload);
        }
      } catch (e) {
        console.error('SSE JSON error:', e);
      }
    };
    sseSource.onerror = () => {
      // EventSource will auto-reconnect
    };
  } catch (e) {
    console.warn('SSE init failed, relying on polling:', e);
  }
}

function startPolling(intervalMs = 2500) {
  if (pollTimer) return;
  loadState();
  pollTimer = setInterval(loadState, intervalMs);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

if (bc) {
  bc.addEventListener('message', (e) => {
    loadState().then(() => {
      if (e.data) notifyState(e.data);
    });
  });
}

function broadcastStateChange(payload) {
  if (bc) {
    try { bc.postMessage(payload || { type: 'state-changed' }); } catch (e) {}
  }
}

// Automatically start real-time connection on load
initSSE();
loadState();

// ==================== AUDIO ====================
let audioCtx;
let soundEnabled = (() => {
  try { return localStorage.getItem('rallySound') !== 'off'; } catch (e) { return true; }
})();

function initAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, duration, type = 'sine', volume = 0.2) {
  if (!soundEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function playSound(type) {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;
  switch(type) {
    case 'click': playTone(800, 0.05, 'square', 0.08); break;
    case 'pop':
      playTone(440, 0.08, 'sine', 0.2);
      setTimeout(() => playTone(660, 0.08, 'sine', 0.2), 60);
      setTimeout(() => playTone(880, 0.1, 'sine', 0.2), 120);
      break;
    case 'tick': playTone(1400, 0.02, 'square', 0.06); break;
    case 'spin': {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.6);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.6);
      } catch (e) {}
      break;
    }
    case 'win': {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => setTimeout(() => playTone(f, 0.25, 'triangle', 0.22), i * 100));
      setTimeout(() => {
        playTone(523.25, 0.6, 'triangle', 0.18);
        playTone(659.25, 0.6, 'triangle', 0.18);
        playTone(783.99, 0.6, 'triangle', 0.18);
      }, 500);
      break;
    }
    case 'error':
      playTone(200, 0.15, 'sawtooth', 0.12);
      setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.12), 100);
      break;
  }
}

// ==================== SOUND TOGGLE ====================
function initSoundToggle() {
  const btn = document.getElementById('soundToggle');
  if (!btn) return;
  btn.innerHTML = soundEnabled ? Icons.soundOn : Icons.soundOff;
  btn.classList.toggle('off', !soundEnabled);
  btn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    try { localStorage.setItem('rallySound', soundEnabled ? 'on' : 'off'); } catch(e) {}
    btn.innerHTML = soundEnabled ? Icons.soundOn : Icons.soundOff;
    btn.classList.toggle('off', !soundEnabled);
    if (soundEnabled) { initAudio(); playSound('click'); }
    showToast(soundEnabled ? 'Sound on' : 'Sound off', soundEnabled ? Icons.soundOn : Icons.soundOff);
  });
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadState();
  }
});

document.addEventListener('click', () => initAudio(), { once: true });

// ==================== TOAST ====================
function showToast(msg, iconSvg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = (iconSvg || '') + ' ' + msg;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==================== CONFETTI ====================
const wheelColors = ['#ff2d92','#00d9ff','#ffd60a','#7eff00','#ff6b35','#a855f7','#06ffa5','#ff006e','#fb5607','#3a86ff','#ffbe0b','#8338ec'];

function celebrate(small = false) {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const count = small ? 80 : 250;
  const originY = small ? window.innerHeight - 120 : window.innerHeight / 2;
  const originX = window.innerWidth / 2;

  for (let i = 0; i < count; i++) {
    const angle = small ? -Math.PI / 2 + (Math.random() - 0.5) * Math.PI : Math.random() * Math.PI * 2;
    const velocity = small ? 10 + Math.random() * 15 : 8 + Math.random() * 22;
    particles.push({
      x: originX + (Math.random() - 0.5) * 80,
      y: originY,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity - (small ? 5 : 0),
      gravity: 0.35,
      size: Math.random() * 8 + 5,
      color: wheelColors[Math.floor(Math.random() * wheelColors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.4,
      life: 1,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      if (p.life <= 0) return;
      alive = true;
      p.vy += p.gravity;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.life -= 0.008;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    if (alive) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

// ==================== HELPERS ====================
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const d = document.createElement('div');
  d.textContent = String(text);
  return d.innerHTML;
}

function shadeColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, (num >> 8 & 0xFF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0xFF) + amt));
  return '#' + ((R << 16) | (G << 8) | B).toString(16).padStart(6, '0');
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const dur = 600, t0 = performance.now();
  function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}
