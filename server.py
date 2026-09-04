import os
import sys
import json
import time
import io
import re
import socket
import shutil
import subprocess
import threading
import queue
import urllib.request
import urllib.parse
from datetime import datetime
from functools import wraps

from flask import (
    Flask,
    request,
    jsonify,
    session,
    send_from_directory,
    send_file,
    Response
)
from flask_cors import CORS
import qrcode
from PIL import Image

app = Flask(__name__, static_folder=None)
CORS(app)

PORT = int(os.environ.get('PORT', 5000))
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin')
app.secret_key = os.environ.get('SESSION_SECRET', 'rally-day-secret-change-me')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'entries.json')
PUBLIC_DIR = BASE_DIR

file_lock = threading.Lock()
clients_lock = threading.Lock()
sse_subscribers = []

PUBLIC_URL = None
SHORT_JOIN_URL = "https://spoo.me/ngis-rallyday"
SHORT_WHEEL_URL = "https://spoo.me/ngis-wheel"
SHORT_KIOSK_URL = "https://spoo.me/ngis-kiosk"
SHORT_ADMIN_URL = "https://spoo.me/ngis-admin"
tunnel_process = None

def get_local_ip():
    """Detect local LAN IP address so devices on Wi-Fi can connect."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

def shorten_url(target_url):
    """Try multiple high-reliability shorteners in sequence."""
    # Provider 1: cleanuri
    try:
        data = urllib.parse.urlencode({'url': target_url}).encode('utf-8')
        req = urllib.request.Request(
            'https://cleanuri.com/api/v1/shorten',
            data=data,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=4) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            if 'result_url' in res:
                return res['result_url']
    except Exception:
        pass

    # Provider 2: clck.ru
    try:
        url = f"https://clck.ru/--?url={urllib.parse.quote(target_url)}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=4) as resp:
            short = resp.read().decode('utf-8').strip()
            if short.startswith('http'):
                return short
    except Exception:
        pass

    # Provider 3: spoo.me
    try:
        data = urllib.parse.urlencode({'url': target_url}).encode('utf-8')
        req = urllib.request.Request(
            'https://spoo.me/',
            data=data,
            headers={'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=4) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            if 'short_url' in res:
                return res['short_url']
    except Exception:
        pass

    return target_url

def start_public_tunnel(port):
    """Automatically launches Cloudflare Tunnel to expose the server to the public internet."""
    global PUBLIC_URL, SHORT_JOIN_URL, SHORT_WHEEL_URL, SHORT_KIOSK_URL, SHORT_ADMIN_URL, tunnel_process
    cf_paths = [
        r"C:\Program Files (x86)\cloudflared\cloudflared.exe",
        r"C:\Program Files\cloudflared\cloudflared.exe",
        os.path.join(BASE_DIR, "cloudflared.exe"),
        "cloudflared"
    ]
    cf_binary = None
    for p in cf_paths:
        if os.path.exists(p) or (p == "cloudflared" and shutil.which("cloudflared")):
            cf_binary = p
            break

    if not cf_binary:
        print("[!] cloudflared not found. Running in local network mode only.", flush=True)
        return

    try:
        tunnel_process = subprocess.Popen(
            [cf_binary, "tunnel", "--url", f"http://localhost:{port}"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace'
        )

        def monitor_tunnel():
            global PUBLIC_URL, SHORT_JOIN_URL, SHORT_WHEEL_URL, SHORT_KIOSK_URL, SHORT_ADMIN_URL
            for line in tunnel_process.stdout:
                match = re.search(r'https://[a-zA-Z0-9-]+\.trycloudflare\.com', line)
                if match:
                    PUBLIC_URL = match.group(0)

                    # Generate live short URLs
                    try:
                        SHORT_JOIN_URL = shorten_url(f"{PUBLIC_URL}/join")
                        SHORT_WHEEL_URL = shorten_url(f"{PUBLIC_URL}/wheel")
                        SHORT_KIOSK_URL = shorten_url(f"{PUBLIC_URL}/kiosk")
                        SHORT_ADMIN_URL = shorten_url(f"{PUBLIC_URL}/admin")
                    except Exception:
                        pass

                    try:
                        with open(os.path.join(BASE_DIR, 'tunnel_url.txt'), 'w', encoding='utf-8') as f:
                            f.write(f"PUBLIC_URL={PUBLIC_URL}\n")
                            f.write(f"JOIN_URL={SHORT_JOIN_URL or (PUBLIC_URL + '/join')}\n")
                            f.write(f"WHEEL_URL={SHORT_WHEEL_URL or (PUBLIC_URL + '/wheel')}\n")
                            f.write(f"KIOSK_URL={SHORT_KIOSK_URL or (PUBLIC_URL + '/kiosk')}\n")
                            f.write(f"ADMIN_URL={SHORT_ADMIN_URL or (PUBLIC_URL + '/admin')}\n")
                    except Exception:
                        pass

                    print()
                    print("=" * 66, flush=True)
                    print("  🌟 PUBLIC INTERNET URLS ACTIVATED!", flush=True)
                    print("=" * 66, flush=True)
                    print(f"  📱 Join Form:      {SHORT_JOIN_URL}  (or {PUBLIC_URL}/join)", flush=True)
                    print(f"  🎡 Prize Wheel:    {SHORT_WHEEL_URL}  (or {PUBLIC_URL}/wheel)", flush=True)
                    print(f"  📺 Kiosk Display:  {SHORT_KIOSK_URL}  (or {PUBLIC_URL}/kiosk)", flush=True)
                    print(f"  ⚙️ Admin Panel:    {SHORT_ADMIN_URL}  (or {PUBLIC_URL}/admin - Password: {ADMIN_PASSWORD})", flush=True)
                    print("=" * 66, flush=True)
                    print(f"  [Direct Tunnel: {PUBLIC_URL}]", flush=True)
                    print("=" * 66, flush=True)
                    print()
                    break

        t = threading.Thread(target=monitor_tunnel, daemon=True)
        t.start()
    except Exception as e:
        print(f"[!] Could not start public tunnel: {e}", flush=True)

def read_data():
    """Thread-safe read from entries.json."""
    with file_lock:
        if not os.path.exists(DATA_FILE):
            default_data = {
                "entries": [],
                "winners": [],
                "submissionsOpen": True,
                "forcedWinner": None
            }
            try:
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(default_data, f, indent=2)
            except Exception:
                pass
            return default_data

        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                content = f.read()
                if not content.strip():
                    return {
                        "entries": [],
                        "winners": [],
                        "submissionsOpen": True,
                        "forcedWinner": None
                    }
                parsed = json.loads(content)
                return {
                    "entries": parsed.get("entries", []) if isinstance(parsed.get("entries"), list) else [],
                    "winners": parsed.get("winners", []) if isinstance(parsed.get("winners"), list) else [],
                    "submissionsOpen": parsed.get("submissionsOpen", True) is not False,
                    "forcedWinner": parsed.get("forcedWinner", None)
                }
        except Exception as e:
            print(f"Error reading {DATA_FILE}: {e}")
            return {
                "entries": [],
                "winners": [],
                "submissionsOpen": True,
                "forcedWinner": None
            }

def write_data(data):
    """Thread-safe write to entries.json."""
    with file_lock:
        try:
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            return True
        except Exception as e:
            print(f"Error writing {DATA_FILE}: {e}")
            return False

def broadcast_event(event_obj):
    """Push real-time SSE event to all connected clients."""
    payload = f"data: {json.dumps(event_obj)}\n\n"
    with clients_lock:
        for q in list(sse_subscribers):
            try:
                q.put_nowait(payload)
            except Exception:
                pass

def broadcast_state(custom_data=None):
    """Broadcast state-update event to all connected devices."""
    current = custom_data if custom_data is not None else read_data()
    broadcast_event({"type": "state-update", "data": current})

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin'):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function

# ==================== SSE REAL-TIME STREAM ====================
@app.route('/api/events')
def sse_events():
    def stream():
        q = queue.Queue()
        with clients_lock:
            sse_subscribers.append(q)
        
        initial = read_data()
        yield f"data: {json.dumps({'type': 'state-update', 'data': initial})}\n\n"
        
        try:
            while True:
                try:
                    msg = q.get(timeout=20)
                    yield msg
                except queue.Empty:
                    yield ": keepalive\n\n"
        except GeneratorExit:
            with clients_lock:
                if q in sse_subscribers:
                    sse_subscribers.remove(q)

    res = Response(stream(), mimetype='text/event-stream')
    res.headers['Cache-Control'] = 'no-cache'
    res.headers['X-Accel-Buffering'] = 'no'
    res.headers['Access-Control-Allow-Origin'] = '*'
    return res

# ==================== INFO & CONFIG ====================
@app.route('/api/info', methods=['GET'])
def get_info():
    local_ip = get_local_ip()
    return jsonify({
        "local_ip": local_ip,
        "port": PORT,
        "public_url": PUBLIC_URL,
        "short_join_url": SHORT_JOIN_URL,
        "short_wheel_url": SHORT_WHEEL_URL,
        "short_kiosk_url": SHORT_KIOSK_URL,
        "short_admin_url": SHORT_ADMIN_URL,
        "join_url": SHORT_JOIN_URL or (f"{PUBLIC_URL}/join" if PUBLIC_URL else f"http://{local_ip}:{PORT}/join"),
        "wheel_url": SHORT_WHEEL_URL or (f"{PUBLIC_URL}/wheel" if PUBLIC_URL else f"http://{local_ip}:{PORT}/wheel"),
        "kiosk_url": SHORT_KIOSK_URL or (f"{PUBLIC_URL}/kiosk" if PUBLIC_URL else f"http://{local_ip}:{PORT}/kiosk"),
        "admin_url": SHORT_ADMIN_URL or (f"{PUBLIC_URL}/admin" if PUBLIC_URL else f"http://{local_ip}:{PORT}/admin")
    })

# ==================== AUTH ROUTES ====================
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json(silent=True) or {}
    password = data.get('password', '')
    if password == ADMIN_PASSWORD:
        session['admin'] = True
        return jsonify({"success": True})
    return jsonify({"error": "Invalid password"}), 401

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin', None)
    return jsonify({"success": True})

@app.route('/api/admin/check', methods=['GET'])
def admin_check():
    return jsonify({"authenticated": bool(session.get('admin'))})

# ==================== ENTRIES & WHEEL API ====================
@app.route('/api/entries', methods=['GET'])
def get_entries():
    data = read_data()
    return jsonify(data)

@app.route('/api/entries', methods=['POST'])
def add_entry():
    req_data = request.get_json(silent=True) or {}
    name = req_data.get('name', '').strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    data = read_data()

    if not session.get('admin') and not data.get('submissionsOpen', True):
        return jsonify({"error": "Submissions are currently closed"}), 403

    name_lower = name.lower()
    for e in data['entries']:
        e_name = e.get('name', '') if isinstance(e, dict) else str(e)
        if e_name.lower() == name_lower:
            return jsonify({"error": "This name is already in the wheel list!"}), 409

    entry = {
        "id": f"{int(time.time() * 1000)}-{os.urandom(4).hex()}",
        "name": name,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    data['entries'].append(entry)
    write_data(data)
    broadcast_state(data)
    return jsonify(entry), 201

@app.route('/api/winner', methods=['POST'])
def record_winner():
    req_data = request.get_json(silent=True) or {}
    name = req_data.get('name')
    entry_id = req_data.get('id')

    if not name and not entry_id:
        return jsonify({"error": "Name or ID is required"}), 400

    data = read_data()
    entry_index = -1

    for idx, e in enumerate(data['entries']):
        if entry_id and isinstance(e, dict) and e.get('id') == entry_id:
            entry_index = idx
            break
        e_name = e.get('name', '') if isinstance(e, dict) else str(e)
        if name and e_name.lower() == str(name).lower():
            entry_index = idx
            break

    if entry_index == -1:
        return jsonify({"error": "Entry not found"}), 404

    entry = data['entries'].pop(entry_index)
    winner = {
        "id": entry.get('id', str(int(time.time() * 1000))) if isinstance(entry, dict) else str(int(time.time() * 1000)),
        "name": entry.get('name', str(entry)) if isinstance(entry, dict) else str(entry),
        "wonAt": datetime.utcnow().isoformat() + "Z"
    }

    data['winners'].insert(0, winner)
    if len(data['winners']) > 50:
        data['winners'] = data['winners'][:50]
    data['forcedWinner'] = None

    write_data(data)
    broadcast_state(data)
    return jsonify(winner)

@app.route('/api/reset', methods=['POST'])
def reset_wheel():
    data = read_data()
    restored = []
    for w in reversed(data.get('winners', [])):
        restored.append({
            "id": w.get('id', f"{int(time.time() * 1000)}-{os.urandom(4).hex()}"),
            "name": w.get('name', ''),
            "timestamp": w.get('wonAt', datetime.utcnow().isoformat() + "Z")
        })
    data['entries'].extend(restored)
    data['winners'] = []
    data['forcedWinner'] = None

    write_data(data)
    broadcast_state(data)
    return jsonify({"message": "Reset complete", "entries": len(data['entries'])})

@app.route('/api/ban', methods=['POST'])
@require_auth
def ban_entry():
    req_data = request.get_json(silent=True) or {}
    entry_id = req_data.get('id')
    name = req_data.get('name')

    data = read_data()
    if entry_id:
        data['entries'] = [e for e in data['entries'] if not (isinstance(e, dict) and e.get('id') == entry_id)]
    elif name:
        name_lower = str(name).lower()
        data['entries'] = [
            e for e in data['entries']
            if (e.get('name', '') if isinstance(e, dict) else str(e)).lower() != name_lower
        ]

    if data.get('forcedWinner'):
        fw = data['forcedWinner']
        if (entry_id and fw.get('id') == entry_id) or (name and fw.get('name', '').lower() == str(name).lower()):
            data['forcedWinner'] = None

    write_data(data)
    broadcast_state(data)
    return jsonify({"message": "Banned", "entries": len(data['entries'])})

@app.route('/api/force-win', methods=['POST'])
@require_auth
def force_win():
    req_data = request.get_json(silent=True) or {}
    entry_id = req_data.get('id')
    name = req_data.get('name')

    data = read_data()
    found_entry = None

    for e in data['entries']:
        if entry_id and isinstance(e, dict) and e.get('id') == entry_id:
            found_entry = e
            break
        e_name = e.get('name', '') if isinstance(e, dict) else str(e)
        if name and e_name.lower() == str(name).lower():
            found_entry = e
            break

    if not found_entry:
        return jsonify({"error": "Entry not found or already won"}), 404

    target = {
        "id": found_entry.get('id', str(int(time.time() * 1000))) if isinstance(found_entry, dict) else str(int(time.time() * 1000)),
        "name": found_entry.get('name', str(found_entry)) if isinstance(found_entry, dict) else str(found_entry)
    }
    data['forcedWinner'] = target
    write_data(data)
    broadcast_state(data)
    return jsonify({"success": True, "message": f"Next winner set to {target['name']}", "target": target, "forcedWinner": target})

@app.route('/api/force-win/clear', methods=['POST'])
@require_auth
def clear_force_win():
    data = read_data()
    data['forcedWinner'] = None
    write_data(data)
    broadcast_state(data)
    return jsonify({"success": True, "message": "Target winner cleared"})

@app.route('/api/entries/search', methods=['GET'])
@require_auth
def search_entries():
    q = request.args.get('q', '').strip().lower()
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    start = (page - 1) * limit

    data = read_data()
    filtered = data['entries']
    if q:
        filtered = [
            e for e in filtered
            if q in (e.get('name', '') if isinstance(e, dict) else str(e)).lower()
        ]

    total = len(filtered)
    total_pages = max(1, (total + limit - 1) // limit)
    page_items = filtered[start:start + limit]

    return jsonify({
        "entries": page_items,
        "winners": data.get('winners', []),
        "forcedWinner": data.get('forcedWinner'),
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": total_pages,
            "hasNext": page < total_pages,
            "hasPrev": page > 1
        }
    })

@app.route('/api/submissions', methods=['POST'])
@require_auth
def update_submissions():
    req_data = request.get_json(silent=True) or {}
    open_status = req_data.get('open', True) is not False

    data = read_data()
    data['submissionsOpen'] = open_status
    write_data(data)
    broadcast_state(data)
    return jsonify({"submissionsOpen": data['submissionsOpen']})

@app.route('/api/submissions', methods=['GET'])
def get_submissions():
    data = read_data()
    return jsonify({"submissionsOpen": data.get('submissionsOpen', True) is not False})

@app.route('/api/qr', methods=['GET'])
def generate_qr():
    try:
        # Use short memorable link for QR code so anyone scanning with camera gets immediate access
        join_url = SHORT_JOIN_URL or (f"{PUBLIC_URL}/pages/join.html" if PUBLIC_URL else f"http://{get_local_ip()}:{PORT}/pages/join.html")

        qr = qrcode.QRCode(
            version=1,
            box_size=10,
            border=2,
        )
        qr.add_data(join_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#1a0b3a", back_color="#ffffff")
        
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        return send_file(buf, mimetype='image/png')
    except Exception as e:
        print(f"QR generation error: {e}")
        return "QR generation failed", 500


# ==================== SHORT CLEAN ROUTES ====================
@app.route('/join')
def serve_join():
    return send_file(os.path.join(PUBLIC_DIR, 'pages', 'join.html'))

@app.route('/wheel')
def serve_wheel():
    return send_file(os.path.join(PUBLIC_DIR, 'pages', 'wheel.html'))

@app.route('/kiosk')
def serve_kiosk():
    return send_file(os.path.join(PUBLIC_DIR, 'pages', 'kiosk.html'))

@app.route('/admin')
def serve_admin():
    return send_file(os.path.join(PUBLIC_DIR, 'pages', 'admin.html'))

# ==================== STATIC FILES ====================
@app.route('/')
def serve_root():
    return send_from_directory(PUBLIC_DIR, 'index.html')

@app.route('/<path:filepath>')
def serve_static(filepath):
    safe_path = os.path.normpath(os.path.join(PUBLIC_DIR, filepath))
    if not safe_path.startswith(PUBLIC_DIR):
        return "Access denied", 403
    if os.path.exists(safe_path) and os.path.isfile(safe_path):
        return send_file(safe_path)
    return "File not found", 404

if __name__ == '__main__':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

    local_ip = get_local_ip()
    print("=" * 66)
    print("  [+] Rally Day Prize Wheel Server (Python) Starting...")
    print("=" * 66)
    print(f"  Local URL:      http://localhost:{PORT}")
    print(f"  Network URL:    http://{local_ip}:{PORT} (Share on Wi-Fi!)")
    print("=" * 66)

    # Start public internet tunnel automatically
    start_public_tunnel(PORT)
    
    app.run(host='0.0.0.0', port=PORT, threaded=True, debug=False)
