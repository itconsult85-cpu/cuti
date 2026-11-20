// =====================================================================
// Entry point: jalankan WhatsApp gateway + dashboard bersamaan.
//   node src/index.js
// lalu buka http://localhost:3000 untuk scan QR & melihat laporan.
// Konfigurasi opsional: salin .env.example ke .env dan isi nilai;
// loader di bawah membacanya otomatis sebelum server aktif.
// =====================================================================
require('./loadEnv');

const { startSock } = require('./whatsapp');
const { startServer } = require('./server');
const db = require('./db');

db.logEvent('app_started');
startServer();
startSock().catch(err => {
  console.error('[fatal] gagal start WhatsApp:', err.message);
  db.logEvent('start_failed', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err?.message || err);
});
