const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

const DATA_FILE = path.join(__dirname, 'entries.json');
const PUBLIC_DIR = __dirname;

app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));
app.use(session({
  secret: process.env.SESSION_SECRET || 'rally-day-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

let writeQueue = Promise.resolve();

function queueWrite(fn) {
  const op = writeQueue.then(() => fn(), () => fn());
  writeQueue = op.catch(() => {});
  return op;
}

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw || !raw.trim()) {
      return { entries: [], winners: [], submissionsOpen: true, forcedWinner: null };
    }
    const parsed = JSON.parse(raw);
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      winners: Array.isArray(parsed.winners) ? parsed.winners : [],
      submissionsOpen: parsed.submissionsOpen !== false,
      forcedWinner: parsed.forcedWinner || null
    };
  } catch (e) {
    return { entries: [], winners: [], submissionsOpen: true, forcedWinner: null };
  }
}

function writeData(data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8', err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

let sseClients = [];

function broadcastEvent(eventObj) {
  const payload = `data: ${JSON.stringify(eventObj)}\n\n`;
  sseClients = sseClients.filter(client => {
    try {
      client.write(payload);
      return true;
    } catch (e) {
      return false;
    }
  });
}

function broadcastState(customData) {
  const current = customData || readData();
  broadcastEvent({ type: 'state-update', data: current });
}

function requireAuth(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (res.flushHeaders) res.flushHeaders();

  const data = readData();
  res.write(`data: ${JSON.stringify({ type: 'state-update', data })}\n\n`);

  sseClients.push(res);

  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch (e) {
      clearInterval(keepAlive);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients = sseClients.filter(c => c !== res);
  });
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.admin = true;
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Invalid password' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/admin/check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.admin) });
});

app.get('/api/entries', (req, res) => {
  const data = readData();
  res.json(data);
});

app.post('/api/entries', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const trimmed = name.trim();
  queueWrite(() => {
    const data = readData();
    const exists = data.entries.some(e => (typeof e === 'string' ? e : e.name).toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return Promise.reject({ handled: true, data: { error: 'This name is already in the wheel list!' } });
    }
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: trimmed,
      timestamp: new Date().toISOString()
    };
    data.entries.push(entry);
    return writeData(data).then(() => ({ entry, data }));
  }).then(
    ({ entry, data }) => {
      broadcastState(data);
      res.status(201).json(entry);
    },
    err => {
      if (err.handled) return res.status(409).json(err.data);
      console.error(err);
      res.status(500).json({ error: 'Failed to save entry' });
    }
  );
});

app.post('/api/winner', (req, res) => {
  const { name, id } = req.body;
  if (!name && !id) {
    return res.status(400).json({ error: 'Name or ID is required' });
  }
  queueWrite(() => {
    const data = readData();
    const entryIndex = data.entries.findIndex(e => {
      if (id && typeof e === 'object' && e.id === id) return true;
      const eName = typeof e === 'string' ? e : (e.name || '');
      return name && eName.toLowerCase() === String(name).toLowerCase();
    });
    if (entryIndex === -1) {
      return Promise.reject({ handled: true, data: { error: 'Entry not found' } });
    }
    const [entry] = data.entries.splice(entryIndex, 1);
    const winner = {
      id: typeof entry === 'object' ? entry.id : `${Date.now()}`,
      name: typeof entry === 'object' ? entry.name : entry,
      wonAt: new Date().toISOString()
    };
    data.winners.unshift(winner);
    if (data.winners.length > 50) data.winners.length = 50;
    data.forcedWinner = null;
    return writeData(data).then(() => ({ winner, data }));
  }).then(
    ({ winner, data }) => {
      broadcastState(data);
      res.json(winner);
    },
    err => {
      if (err.handled) return res.status(404).json(err.data);
      console.error(err);
      res.status(500).json({ error: 'Failed to record winner' });
    }
  );
});

app.post('/api/reset', requireAuth, (req, res) => {
  queueWrite(() => {
    const data = readData();
    const restored = data.winners.map(w => ({
      id: w.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: w.name,
      timestamp: w.wonAt || new Date().toISOString()
    })).reverse();
    data.entries = [...data.entries, ...restored];
    data.winners = [];
    data.forcedWinner = null;
    return writeData(data).then(() => data);
  }).then(
    data => {
      broadcastState(data);
      res.json({ message: 'Reset complete', entries: data.entries.length });
    },
    err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to reset' });
    }
  );
});

app.get('/api/qr', async (req, res) => {
  try {
    const host = req.get('host');
    const protocol = req.secure ? 'https' : 'http';
    const joinUrl = `${protocol}://${host}/pages/join.html`;
    const qrDataUrl = await QRCode.toDataURL(joinUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#1a0b3a', light: '#ffffff' }
    });
    const base64 = qrDataUrl.split(',')[1];
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(base64, 'base64'));
  } catch (e) {
    console.error('QR generation error:', e);
    res.status(500).send('QR generation failed');
  }
});

app.post('/api/ban', requireAuth, (req, res) => {
  const { id, name } = req.body;
  queueWrite(() => {
    const data = readData();
    if (id) {
      data.entries = data.entries.filter(e => (typeof e === 'object' ? e.id !== id : true));
    } else if (name) {
      data.entries = data.entries.filter(e => {
        const eName = typeof e === 'string' ? e : (e.name || '');
        return eName.toLowerCase() !== String(name).toLowerCase();
      });
    }
    if (data.forcedWinner && ((id && data.forcedWinner.id === id) || (name && data.forcedWinner.name.toLowerCase() === String(name).toLowerCase()))) {
      data.forcedWinner = null;
    }
    return writeData(data).then(() => data);
  }).then(
    data => {
      broadcastState(data);
      res.json({ message: 'Banned', entries: data.entries.length });
    },
    err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to ban' });
    }
  );
});

app.post('/api/force-win', requireAuth, (req, res) => {
  const { id, name } = req.body;
  queueWrite(() => {
    const data = readData();
    let entryIndex = -1;
    if (id) {
      entryIndex = data.entries.findIndex(e => typeof e === 'object' && e.id === id);
    } else if (name) {
      entryIndex = data.entries.findIndex(e => {
        const eName = typeof e === 'string' ? e : (e.name || '');
        return eName.toLowerCase() === String(name).toLowerCase();
      });
    }
    if (entryIndex === -1) {
      return Promise.reject({ handled: true, data: { error: 'Entry not found or already won' } });
    }
    const entry = data.entries[entryIndex];
    const target = {
      id: typeof entry === 'object' ? entry.id : `${Date.now()}`,
      name: typeof entry === 'object' ? entry.name : entry
    };
    data.forcedWinner = target;
    return writeData(data).then(() => ({ target, data }));
  }).then(
    ({ target, data }) => {
      broadcastState(data);
      res.json({ success: true, message: `Next winner set to ${target.name}`, target, forcedWinner: target });
    },
    err => {
      if (err.handled) return res.status(404).json(err.data);
      console.error(err);
      res.status(500).json({ error: 'Failed to force win' });
    }
  );
});

app.post('/api/force-win/clear', requireAuth, (req, res) => {
  queueWrite(() => {
    const data = readData();
    data.forcedWinner = null;
    return writeData(data).then(() => data);
  }).then(
    data => {
      broadcastState(data);
      res.json({ success: true, message: 'Target winner cleared' });
    },
    err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to clear target winner' });
    }
  );
});

app.get('/api/entries/search', requireAuth, (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  const data = readData();
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const start = (page - 1) * limit;

  let filtered = data.entries;
  if (q) {
    filtered = filtered.filter(e => {
      const eName = typeof e === 'string' ? e : (e.name || '');
      return eName.toLowerCase().includes(q);
    });
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageItems = filtered.slice(start, start + limit);

  res.json({
    entries: pageItems,
    winners: data.winners,
    forcedWinner: data.forcedWinner,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
});

app.post('/api/submissions', requireAuth, (req, res) => {
  const { open } = req.body;
  queueWrite(() => {
    const data = readData();
    data.submissionsOpen = open !== false;
    return writeData(data).then(() => data);
  }).then(
    data => {
      broadcastState(data);
      res.json({ submissionsOpen: data.submissionsOpen });
    },
    err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to update submissions' });
    }
  );
});

app.get('/api/submissions', (req, res) => {
  const data = readData();
  res.json({ submissionsOpen: data.submissionsOpen !== false });
});

app.listen(PORT, () => {
  console.log(`Rally Day Wheel running at http://localhost:${PORT}`);
  console.log(`  Join form : http://localhost:${PORT}/pages/join.html`);
  console.log(`   Kiosk    : http://localhost:${PORT}/pages/kiosk.html`);
  console.log(`   Wheel    : http://localhost:${PORT}/pages/wheel.html`);
  console.log(`   Admin    : http://localhost:${PORT}/pages/admin.html`);
});
