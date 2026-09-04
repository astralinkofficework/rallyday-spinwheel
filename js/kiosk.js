const showQRBtn = document.getElementById('showQRBtn');
const qrModal = document.getElementById('qrModal');
const closeQRBtn = document.getElementById('closeQRBtn');

function buildMarquee() {
  const mc = document.getElementById('marqueeContent');
  const segment =
    Icons.star + ' NGIS RALLY DAY 2026 ' +
    Icons.wheel + ' SPIN TO WIN ' +
    Icons.trophy + ' EPIC PRIZES ' +
    Icons.note + ' JOIN THE FUN ';
  mc.innerHTML = segment.repeat(4);
}

function updateQR() {
  const qrImg = document.getElementById('qrImage');
  if (!qrImg) return;
  qrImg.src = '/api/qr?' + Date.now();
}

showQRBtn.addEventListener('click', () => {
  playSound('click');
  updateQR();
  qrModal.classList.add('show');
});

closeQRBtn.addEventListener('click', () => {
  playSound('click');
  qrModal.classList.remove('show');
});

qrModal.addEventListener('click', (e) => {
  if (e.target === qrModal) qrModal.classList.remove('show');
});

function updateKioskStats() {
  animateCounter('entryCountKiosk', currentData.entries.length);
  animateCounter('spinCountKiosk', currentData.winners.length);
  animateCounter('prizesLeft', currentData.entries.length);
}

onStateChange(() => updateKioskStats());

initSoundToggle();
buildMarquee();
startPolling();
updateKioskStats();
