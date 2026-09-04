const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const resetBtn = document.getElementById('resetBtn');
const removeWinnerToggle = document.getElementById('removeWinnerToggle');
const wheelPointer = document.getElementById('wheelPointer');
const winnerOverlay = document.getElementById('winnerOverlay');
const winnerName = document.getElementById('winnerName');
const winnerCloseBtn = document.getElementById('winnerCloseBtn');

let currentRotation = 0;
let spinning = false;

function getEntryName(entry) {
  if (entry === null || entry === undefined) return '';
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'object' && entry.name) return entry.name;
  return String(entry);
}

function getEntryId(entry) {
  if (entry && typeof entry === 'object' && entry.id) return entry.id;
  return null;
}

function drawWheel(rotation = 0) {
  const size = canvas.width;
  const center = size / 2;
  const radius = Math.max(50, center - 25);
  ctx.clearRect(0, 0, size, size);

  // Outer glow
  const glowGrad = ctx.createRadialGradient(center, center, radius - 5, center, center, radius + 20);
  glowGrad.addColorStop(0, 'rgba(255, 45, 146, 0)');
  glowGrad.addColorStop(0.5, 'rgba(255, 45, 146, 0.3)');
  glowGrad.addColorStop(1, 'rgba(255, 45, 146, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(center, center, radius + 20, 0, Math.PI * 2);
  ctx.fill();

  const entries = currentData.entries || [];
  if (entries.length === 0) {
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#2a1845';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 22px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No entries yet', center, center - 12);
    ctx.font = '15px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('Add names via the form to start!', center, center + 18);
    drawCenterHub(center, radius);
    return;
  }

  const segAngle = (Math.PI * 2) / entries.length;
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(rotation);

  entries.forEach((entry, i) => {
    const entryName = getEntryName(entry);
    const startAngle = i * segAngle - Math.PI / 2 - segAngle / 2;
    const endAngle = startAngle + segAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();

    const segGrad = ctx.createRadialGradient(0, 0, 30, 0, 0, radius);
    const baseColor = wheelColors[i % wheelColors.length];
    segGrad.addColorStop(0, baseColor);
    segGrad.addColorStop(1, shadeColor(baseColor, -25));
    ctx.fillStyle = segGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Segment text
    ctx.save();
    ctx.rotate(startAngle + segAngle / 2);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    const fontSize = Math.max(12, Math.min(22, segAngle * 30));
    ctx.font = `800 ${fontSize}px Outfit, sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    const maxLen = Math.max(8, Math.floor((radius - 50) / (fontSize * 0.55)));
    let display = entryName;
    if (entryName.length > maxLen) {
      display = entryName.substring(0, maxLen - 1) + '…';
    }
    ctx.fillText(display, radius - 20, 0);
    ctx.shadowColor = 'transparent';
    ctx.restore();
  });

  ctx.restore();

  // Perimeter rim lights
  const dotCount = Math.max(16, Math.min(36, entries.length * 2));
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2 - Math.PI / 2;
    const x = center + Math.cos(angle) * (radius + 8);
    const y = center + Math.sin(angle) * (radius + 8);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0 ? '#ffd60a' : '#ffffff';
    ctx.fill();
  }

  drawCenterHub(center, radius);
}

function drawCenterHub(center, radius) {
  ctx.beginPath();
  ctx.arc(center, center, 38, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#ff2d92';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = '#ff2d92';
  ctx.font = '800 14px Bungee, Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPIN!', center, center);
}

async function spin(forcedTarget = null) {
  if (spinning) return;
  const entries = currentData.entries || [];
  if (entries.length === 0) {
    showToast('Add some entries first via the form!', Icons.alert);
    playSound('error');
    return;
  }
  spinning = true;
  spinBtn.disabled = true;
  spinBtn.classList.remove('pulse');
  playSound('spin');

  // Determine winner index:
  // 1. Check if forcedTarget is provided directly or in currentData.forcedWinner
  const target = forcedTarget || currentData.forcedWinner;
  let winnerIndex = -1;

  if (target) {
    const targetId = typeof target === 'object' ? target.id : null;
    const targetName = typeof target === 'object' ? target.name : String(target);
    winnerIndex = entries.findIndex(e => {
      if (targetId && typeof e === 'object' && e.id === targetId) return true;
      const eName = getEntryName(e);
      return targetName && eName.toLowerCase() === targetName.toLowerCase();
    });
  }

  if (winnerIndex === -1) {
    winnerIndex = Math.floor(Math.random() * entries.length);
  }

  const segAngle = (Math.PI * 2) / entries.length;
  const targetRotation = -winnerIndex * segAngle;
  const fullRotations = 6 * Math.PI * 2;
  const randomOffset = (Math.random() - 0.5) * segAngle * 0.4;
  const finalRotation = targetRotation + fullRotations + randomOffset;

  const startRotation = currentRotation % (Math.PI * 2);
  currentRotation = startRotation;
  const totalDelta = finalRotation - startRotation;
  const duration = 5500;
  const startTime = performance.now();
  let lastBoundaries = 0;

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    currentRotation = startRotation + totalDelta * eased;
    drawWheel(currentRotation);

    const totalRotAbs = Math.abs(currentRotation - startRotation);
    const boundaries = Math.floor(totalRotAbs / segAngle);
    if (boundaries > lastBoundaries) {
      playSound('tick');
      wheelPointer.classList.add('wiggle');
      setTimeout(() => wheelPointer.classList.remove('wiggle'), 100);
      lastBoundaries = boundaries;
    }

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      spinBtn.disabled = false;
      spinBtn.classList.add('pulse');

      const winnerEntry = entries[winnerIndex];
      const winnerNameStr = getEntryName(winnerEntry);
      const winnerId = getEntryId(winnerEntry);

      if (removeWinnerToggle && removeWinnerToggle.checked) {
        fetch('/api/winner', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: winnerNameStr, id: winnerId })
        }).catch(e => console.error('Failed to record winner:', e));
      }

      setTimeout(() => showWinner(winnerNameStr), 300);
    }
  }
  requestAnimationFrame(animate);
}

spinBtn.addEventListener('click', () => { initAudio(); spin(); });

resetBtn.addEventListener('click', async () => {
  if (spinning) return;
  playSound('click');
  if (currentData.winners.length === 0 && currentData.entries.length > 0) {
    showToast('Nothing to reset!', Icons.alert);
    return;
  }
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    const data = await res.json();
    await loadState();
    renderEntries();
    drawWheel(currentRotation);
    showToast('Wheel reset! All entries restored.', Icons.refresh);
    broadcastStateChange();
  } catch (e) {
    showToast('Reset failed. Try again.', Icons.alert);
  }
});

const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
  refreshBtn.addEventListener('click', async () => {
    playSound('click');
    const syncDot = document.getElementById('syncDot');
    if (syncDot) syncDot.classList.add('syncing');
    await loadState();
    renderEntries();
    if (!spinning) drawWheel(currentRotation);
    if (syncDot) syncDot.classList.remove('syncing');
    showToast('Entries refreshed', Icons.refresh);
  });
}

function showWinner(name) {
  const displayName = getEntryName(name);
  winnerName.textContent = displayName;
  winnerOverlay.classList.add('show');
  playSound('win');
  celebrate();
  renderEntries();
}

winnerCloseBtn.addEventListener('click', () => {
  playSound('click');
  winnerOverlay.classList.remove('show');
  if (currentData.entries.length === 0) {
    showToast('All winners drawn! Reset to play again.', Icons.trophy);
  }
});

winnerOverlay.addEventListener('click', (e) => {
  if (e.target === winnerOverlay) winnerOverlay.classList.remove('show');
});

function renderEntries() {
  const list = document.getElementById('entriesList');
  const countEl = document.getElementById('entriesCount');
  const entries = currentData.entries || [];
  if (countEl) countEl.textContent = entries.length;

  if (!list) return;

  if (entries.length === 0) {
    list.innerHTML = '<div class="entries-empty">No entries yet. Add some via the form!</div>';
  } else {
    list.innerHTML = entries.map((entry, i) => {
      const name = getEntryName(entry);
      const color = wheelColors[i % wheelColors.length];
      return `
        <div class="entry-item">
          <div class="entry-dot" style="background:${color};color:${color}"></div>
          <div class="entry-name">${escapeHtml(name)}</div>
        </div>
      `;
    }).join('');
  }

  const wSection = document.getElementById('winnersSection');
  const wList = document.getElementById('winnersList');
  const winners = currentData.winners || [];
  if (wSection && wList) {
    if (winners.length > 0) {
      wSection.style.display = 'block';
      wList.innerHTML = winners.map(w => {
        const name = getEntryName(w);
        return `<span class="winner-chip">${escapeHtml(name)}</span>`;
      }).join('');
    } else {
      wSection.style.display = 'none';
    }
  }
}

onStateChange(() => {
  const syncDot = document.getElementById('syncDot');
  if (syncDot) {
    syncDot.classList.add('syncing');
    setTimeout(() => syncDot.classList.remove('syncing'), 400);
  }
  renderEntries();
  if (!spinning) {
    drawWheel(currentRotation);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    winnerOverlay.classList.remove('show');
  }
  if (e.key === ' ' && !spinning && !winnerOverlay.classList.contains('show')) {
    e.preventDefault();
    spin();
  }
});

initSoundToggle();
loadState().then(() => {
  renderEntries();
  drawWheel(currentRotation);
  startPolling(2000);
});
