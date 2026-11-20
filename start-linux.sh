#!/bin/bash
cd "$(dirname "$0")"
echo "============================================================"
echo "  HOTLINE WHATSAPP AUTO-REPLY + DASHBOARD"
echo "============================================================"
if [ ! -d node_modules ]; then
  echo "[1/2] Install dependensi (hanya sekali)..."
  npm install || { echo "[ERROR] npm install gagal. Pastikan Node.js >= 18 terinstall."; exit 1; }
fi
echo "[2/2] Menjalankan aplikasi..."
echo "Buka http://localhost:3000 di browser untuk scan QR & lihat laporan."
echo "Tekan CTRL+C untuk menghentikan."
node src/index.js
