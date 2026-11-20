// Konfigurasi PM2 — dipakai saat deploy di VPS.
// Jalankan: pm2 start ecosystem.config.js
// Password dashboard diambil dari env DASHBOARD_PASSWORD saat start:
//   DASHBOARD_PASSWORD=rahasia123 pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'hotline',
      script: 'src/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_restarts: 15,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        // Hanya teruskan password bila diisi saat start; tanpa env, dashboard pakai
        // mode tanpa password (lokal) — atau langsung ganti lewat panel dashboard.
        ...(process.env.DASHBOARD_PASSWORD ? { DASHBOARD_PASSWORD: process.env.DASHBOARD_PASSWORD } : {})
      },
      error_file: __dirname + '/data/pm2-error.log',
      out_file: __dirname + '/data/pm2-out.log'
    }
  ]
};
