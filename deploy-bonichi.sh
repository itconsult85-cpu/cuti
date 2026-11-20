#!/usr/bin/env bash
# =====================================================================
# DEPLOY OTOMATIS — user NON-ROOT "bonichi", folder /home/bonichi/wa-hotline-bot
# Pakai:  bash deploy-bonichi.sh
# Jalankan sebagai user bonichi (bukan root). Opsional butuh sudo untuk
# memasang Node.js global; jika tidak ada sudo, script pakai nvm (userspace).
# =====================================================================
set -u

APP_DIR="${APP_DIR:-/home/bonichi/wa-hotline-bot}"
REPO="${REPO:-https://github.com/itconsult85-cpu/cuti.git}"
APP_NAME="hotline"

echo "============================================================"
echo "  DEPLOY HOTLINE WA BOT  ->  $APP_DIR"
echo "============================================================"

# 0) Sudo? (opsional)
SUDO=""
if sudo -n true 2>/dev/null; then SUDO="sudo"; fi
echo "[0] sudo tersedia: ${SUDO:-tidak (pakai mode userspace)}"

# 1) Node.js 22
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 18 ]; then
  echo "[1] Memasang Node.js 22..."
  if [ -n "$SUDO" ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO -E bash -
    $SUDO apt-get install -y nodejs
  else
    # nvm userspace (tanpa sudo)
    export NVM_DIR="$HOME/.nvm"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    . "$NVM_DIR/nvm.sh"
    nvm install 22
  fi
fi
echo "    Node: $(node -v) | npm: $(npm -v)"

# 2) Ambil kode dari GitHub (clone jika belum ada, pull jika sudah)
if [ -d "$APP_DIR/.git" ]; then
  echo "[2] Repo sudah ada, pull terbaru..."
  cd "$APP_DIR" && git pull origin main
else
  echo "[2] Clone $REPO -> $APP_DIR"
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO" "$APP_DIR" || {
    echo "    Gagal clone (kemungkinan repo private). Jalankan manual:"
    echo "    cd /home/bonichi && git clone https://<TOKEN>@github.com/itconsult85-cpu/cuti.git wa-hotline-bot"
    exit 1
  }
  cd "$APP_DIR"
fi
mkdir -p data

# 3) Dependensi
echo "[3] npm install..."
npm install --omit=dev --no-audit --no-fund

# 4) Password dashboard (dibuat sekali, disimpan di data/ — tidak di-commit)
PW_FILE="data/.dashboard_password"
if [ ! -f "$PW_FILE" ]; then
  NEW_PW=$(head -c 6 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 10)
  echo "$NEW_PW" > "$PW_FILE"
  chmod 600 "$PW_FILE"
fi
DASH_PW=$(cat "$PW_FILE")

# 5) PM2 (global bila ada sudo, bila tidak pakai lokal di proyek)
if ! command -v pm2 >/dev/null 2>&1; then
  if [ -n "$SUDO" ]; then
    $SUDO npm install -g pm2
  else
    npm install --no-save pm2
    export PATH="$APP_DIR/node_modules/.bin:$PATH"
  fi
fi
echo "[5] pm2: $(command -v pm2 || echo './node_modules/.bin/pm2')"

# 6) Pilih port bebas (default 3000; bila terpakai otomatis naik ke 3100 dst.)
PORT="${PORT:-3000}"
while command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | grep -q ":$PORT "; do
  echo "[6] Port $PORT sudah terpakai, mencoba port berikutnya..."
  PORT=$((PORT+1))
done
echo "[6] Menjalankan aplikasi via pm2 di port $PORT ..."
export DASHBOARD_PASSWORD="$DASH_PW" PORT="$PORT"
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# 7) Autostart saat reboot
echo ""
echo "============================================================"
echo "  DEPLOY SELESAI"
echo "============================================================"
echo "Dashboard : http://$(hostname -I 2>/dev/null | awk '{print $1}'):$PORT"
echo "Username  : admin"
echo "Password  : $DASH_PW   (tersimpan di $PW_FILE)"
echo ""
echo "Agar otomatis hidup saat VPS reboot:"
if [ -n "$SUDO" ]; then
  echo "  $SUDO env PATH=$PATH:/usr/bin pm2 startup systemd -u bonichi --hp /home/bonichi"
  echo "  lalu jalankan perintah yang ditampilkan, kemudian: pm2 save"
else
  echo "  loginctl enable-linger bonichi"
  echo "  lalu buat service user atau jalankan: pm2 startup systemd -u bonichi --hp /home/bonichi"
fi
echo ""
echo "Tunnel publik gratis (tanpa port terbuka), contoh:"
echo "  mkdir -p ~/.local/bin"
echo "  curl -L -o ~/.local/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
echo "  chmod +x ~/.local/bin/cloudflared"
echo "  nohup ~/.local/bin/cloudflared tunnel --url http://localhost:$PORT > data/cloudflared.log 2>&1 &"
echo "  (URL https://....trycloudflare.com muncul di data/cloudflared.log)"
echo ""
echo "Perintah harian:"
echo "  pm2 logs hotline        # lihat log"
echo "  pm2 restart hotline     # restart"
echo "  pm2 stop hotline        # stop"
