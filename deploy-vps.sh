#!/bin/bash
# =====================================================================
# SCRIPT DEPLOY OTOMATIS — Hotline WhatsApp Bot di VPS (Ubuntu/Debian)
# Jalankan di VPS baru sebagai root:  bash deploy-vps.sh
# Akan install: Node.js 22, aplikasi, PM2 (auto-start 24/7), dan
# Cloudflare Tunnel (URL publik gratis tanpa perlu domain/port terbuka).
# =====================================================================
set -e

APP_DIR="/opt/wa-hotline-bot"
DASH_PASSWORD="${DASH_PASSWORD:-$(head -c 6 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 10)}"

echo "============================================================"
echo "  DEPLOY HOTLINE WHATSAPP BOT — OTOMATIS"
echo "============================================================"

# 1. Update & install tools dasar
apt-get update -y && apt-get install -y curl wget unzip git nano

# 2. Install Node.js 22
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
echo "Node.js: $(node -v)"

# 3. Install PM2 (agar aplikasi jalan 24/7 & auto-start saat reboot)
npm install -g pm2

# 4. Download & extract aplikasi (ganti URL dengan lokasi file zip Anda,
#    ATAU upload folder wa-hotline-bot ke /opt/ secara manual lalu skip langkah ini)
mkdir -p "$APP_DIR"
cd "$APP_DIR"
# -- Contoh jika upload manual: letakkan semua file di /opt/wa-hotline-bot --
if [ ! -f package.json ]; then
  echo ""
  echo "!!! File aplikasi belum ada di $APP_DIR"
  echo "Silahkan upload folder wa-hotline-bot (isi, bukan foldernya) ke $APP_DIR"
  echo "misal via scp: scp -r wa-hotline-bot/* root@IP-VPS:/opt/wa-hotline-bot/"
  echo "lalu jalankan ulang script ini."
  exit 1
fi

# 5. Install dependensi
npm install --omit=dev --no-audit --no-fund

# 6. Jalankan dengan PM2
pm2 delete hotline 2>/dev/null || true
DASHBOARD_PASSWORD="$DASH_PASSWORD" PORT=3000 pm2 start src/index.js --name hotline
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root 2>/dev/null || true

# 7. Install Cloudflared (untuk URL publik gratis, tanpa buka port)
if ! command -v cloudflared &> /dev/null; then
  cd /tmp
  wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  dpkg -i cloudflared-linux-amd64.deb || apt-get install -f -y
fi

echo ""
echo "============================================================"
echo "  DEPLOY SELESAI"
echo "============================================================"
echo "Aplikasi berjalan di port 3000 (lokal VPS)."
echo "Password dashboard: $DASH_PASSWORD  (username: admin)"
echo ""
echo "Untuk akses publik via Cloudflare Tunnel (gratis, tanpa domain):"
echo "  cloudflared tunnel --url http://localhost:3000"
echo "  (akan muncul URL seperti https://xxxx.trycloudflare.com)"
echo ""
echo "Atau jika VPS punya IP publik & port 3000 dibuka firewall:"
echo "  Akses: http://IP-VPS-ANDA:3000"
echo ""
echo "Log aplikasi: pm2 logs hotline"
echo "Restart: pm2 restart hotline"
echo "Stop: pm2 stop hotline"
echo "============================================================"
