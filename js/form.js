const joinForm = document.getElementById('joinForm');
const nameInput = document.getElementById('nameInput');
const formMessage = document.getElementById('formMessage');
const formEntryCount = document.getElementById('formEntryCount');
const submitBtn = document.getElementById('submitBtn');

function updateFormCount() {
  if (formEntryCount) {
    const entries = currentData.entries || [];
    animateCounter('formEntryCount', entries.length);
  }
}

function updateFormState() {
  const closed = currentData.submissionsOpen === false;
  const closedBanner = document.getElementById('closedBanner');
  if (closedBanner) closedBanner.style.display = closed ? 'block' : 'none';
  if (submitBtn) {
    submitBtn.disabled = closed;
    if (closed) {
      submitBtn.classList.add('disabled-state');
    } else {
      submitBtn.classList.remove('disabled-state');
    }
  }
}

joinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (currentData.submissionsOpen === false) {
    showFormMessage('Submissions are currently closed.', 'error');
    playSound('error');
    return;
  }

  const name = nameInput.value.trim();
  if (!name) {
    showFormMessage('Please enter your name!', 'error');
    playSound('error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.7';

  try {
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) {
      showFormMessage(data.error || 'Could not join. Try again.', 'error');
      playSound('error');
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      return;
    }

    playSound('pop');
    showFormMessage(`🎉 You're on the wheel, ${name}! Good luck!`, 'success');
    celebrate(true);
    joinForm.reset();
    nameInput.focus();
    await loadState();
    broadcastStateChange();
  } catch (err) {
    showFormMessage('Network error — please check your connection.', 'error');
    playSound('error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    updateFormCount();
    updateFormState();
  }
});

function showFormMessage(msg, type) {
  const icon = type === 'success' ? Icons.check : Icons.alert;
  formMessage.innerHTML = icon + ' ' + escapeHtml(msg);
  formMessage.className = `form-message show ${type}`;
  clearTimeout(formMessage._timeout);
  formMessage._timeout = setTimeout(() => formMessage.classList.remove('show'), 4500);
}

onStateChange(() => {
  updateFormCount();
  updateFormState();
});

initSoundToggle();
startPolling(3000);
updateFormCount();
updateFormState();
