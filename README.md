# Hotline WhatsApp Auto-Reply Gateway + Dashboard

Sistem balas pesan otomatis untuk nomor hotline WhatsApp **DPD PDI Perjuangan DKI Jakarta**, sesuai template pada file `WA CHAT BOT.docx`.

## ✅ Fitur Utama

| Fitur | Keterangan |
|---|---|
| **Auto-reply multi-level menu** | 6 menu utama (Struktur Partai, Badan/Sayap, Penyampaian, Perizinan, Pengiriman, Informasi) + sub-menu + form isian, persis seperti template |
| **Tanpa verifikasi Meta** | Pakai protokol WhatsApp Web (Multi Device) — cukup **scan QR** sekali dengan HP nomor hotline. Tidak perlu akun Business API, tidak perlu approval Meta |
| **Dashboard web** | Buka di browser: status koneksi, QR, statistik, log pesan, riwayat percakapan per pengirim |
| **Laporan / Export** | Export **CSV** (bisa dibuka Excel) dan **PDF**, bisa filter per periode tanggal + pencarian |
| **Database lokal** | Semua pesan tersimpan di `data/hotline.db` (SQLite) — tidak ada data dikirim ke pihak ketiga |
| **Reconnect otomatis** | Jika koneksi putus, bot menyambung ulang sendiri. Sesi login tersimpan (tidak perlu scan ulang setiap restart) |
| **Kembali ke menu utama** | Ketik `0` atau `menu` kapan saja untuk kembali ke menu utama |
| **Keamanan dashboard** | Login `admin`; password bisa diganti langsung dari panel dashboard (tersimpan ter-hash di database, tanpa restart) |

## 🚀 Cara Menjalankan

### Prasyarat
- **Node.js** versi 18 atau lebih baru (download di https://nodejs.org) — sudah termasuk `npm`
- HP dengan nomor hotline yang terinstall WhatsApp (bisa WhatsApp biasa, **tidak harus** WhatsApp Business)

### Langkah-langkah

1. **Extract** folder `wa-hotline-bot` ini ke komputer/laptop/server yang akan berjalan 24 jam.

2. Buka terminal/command prompt di dalam folder tersebut, lalu install dependensi (hanya sekali):
   ```bash
   npm install
   ```

3. Jalankan aplikasi:
   ```bash
   npm start
   ```

4. Buka browser, akses **http://localhost:3000** (atau `http://<ip-server>:3000` dari komputer lain).

5. Akan muncul **QR Code**. Di HP nomor hotline:
   - Buka WhatsApp → **Setelan** → **Perangkat Tertaut** → **Tautkan Perangkat**
   - Arahkan kamera HP ke QR di dashboard
   - Setelah ter-scan, status berubah menjadi **"Terhubung"** dan nomor hotline tampil di pojok kanan atas

6. Selesai. Setiap pesan masuk ke nomor hotline akan dibalas otomatis sesuai alur menu, dan tercatat di dashboard.

> Agar bot berjalan terus (24 jam), jalankan di laptop/server yang selalu menyala. Di Windows bisa gunakan `pm2 start src/index.js --name hotline` (install pm2 via `npm i -g pm2`) agar berjalan di background.

## 📊 Dashboard

- **Tab Ringkasan** — kartu statistik (hari ini/minggu ini/bulan ini), grafik 14 hari, menu paling sering dipilih, top pengirim, dan panel **Keamanan Dashboard** (status login + tombol **Ganti Password**)
- **Ganti Password** — tombol di tab Ringkasan: isi password lama → password baru (min. 6 karakter) → Simpan. Password di-hash (scrypt) dan disimpan di `data/hotline.db`; browser minta login ulang dengan password baru. Tombol *Kembalikan ke Password Environment* untuk menghapus password kustom.
- **Tab Log Pesan** — semua pesan masuk & keluar, bisa cari berdasarkan isi/nama/nomor, filter tanggal, pagination
- **Tab Percakapan** — lihat utuh percakapan per pengirim (seperti chat WhatsApp)
- **Tab Template Balasan** — melihat template balasan aktif
- **Tombol Export CSV / Export PDF** — download laporan sesuai filter tanggal yang dipilih
- **Tombol Reconnect** — menyambung ulang koneksi tanpa scan ulang
- **Tombol Scan Ulang** — menghapus sesi lama dan menampilkan QR baru (jika nomor hotline berganti atau keluar)

## ✏️ Mengubah Template Balasan (Edit / Tambah / Hapus / Simpan)

**Cara termudah: lewat dashboard** — buka tab **"Template Balasan"**. Ada dua jenis:
- **Template Bawaan** (alur menu: sambutan, menu, form, penutup, info) — klik **Edit** teksnya lalu **Simpan**. Perubahan langsung aktif, **tanpa restart**. Tidak bisa dihapus (karena dipakai alur menu).
- **Aturan Tambahan** (keyword → balasan otomatis) — klik **"+ Tambah Aturan Balasan"**, isi keyword (mis. "jam operasional") dan teks balasan. Jika pesan masuk mengandung keyword tersebut, bot membalas dengan teks itu. Bisa **Edit** dan **Hapus**.

Semua template disimpan di database (`data/hotline.db`), bukan di file. Backup database = backup template.

Jika ingin mengubah default (seed awal), edit **`src/templates.js`** lalu hapus tabel templates di DB (atau hapus `data/hotline.db` untuk reset total).

## 🔄 Alur Percakapan (sesuai template)

```
Pesan masuk → Welcome + Menu Utama (6 opsi)
├─ 1. Struktur Partai → pilih DPD/DPC/PAC/Ranting/Anak Ranting → form Nama+Jabatan → pilih Kegiatan → Konfirmasi kehadiran → Terimakasih
├─ 2. Badan/Sayap → pilih TMP/BMI/BBHAR/BAMUSI/GNTI/BSPN/BAGUNA/BPEK → form → pilih Kegiatan → Konfirmasi → Terimakasih
├─ 3. Penyampaian → Laporan Partai / Aspirasi Kepartaian / Aspirasi Warga → form → Terimakasih
├─ 4. Perizinan Kegiatan → form lengkap → Terimakasih
├─ 5. Pengiriman → form → Terimakasih
└─ 6. Informasi → Alamat Kantor DPD / Media Sosial / Pembuatan KTA / Alamat DPC (per kota) → info + Terimakasih
```

## 📁 Struktur Folder

```
wa-hotline-bot/
├── package.json          # daftar dependensi
├── README.md             # panduan ini
├── src/
│   ├── index.js          # entry point (jalankan bot + dashboard)
│   ├── whatsapp.js       # koneksi WhatsApp (Baileys) + QR
│   ├── bot.js            # mesin percakapan / state machine
│   ├── templates.js      # semua teks balasan (EDIT DI SINI)
│   ├── db.js             # database SQLite (log pesan & state)
│   └── server.js         # API dashboard + export CSV/PDF
├── public/               # tampilan dashboard (HTML/CSS/JS)
└── data/                 # database & sesi login (dibuat otomatis)
```

## ⚠️ Catatan Penting

1. **Nomor hotline harus aktif** dan HP-nya terkadang perlu online (WhatsApp Web multi-device tetap bisa terima pesan walau HP offline, tapi disarankan HP tetap menyala).
2. **Hindari spam** — beri jeda antar pesan (sudah diatur 400ms). Jika nomor diblokir WhatsApp karena terdeteksi spam, sistem tidak bisa mencegahnya; gunakan dengan wajar.
3. **Backup data** — file `data/hotline.db` berisi semua laporan. Backup secara berkala.
4. Jika ingin mengakses dashboard dari luar jaringan (mis. dari kantor lain), gunakan VPS/cloud dan buka port 3000, atau gunakan tunnel seperti `ngrok`.
5. **Keamanan dashboard** — saat dipasang di server publik, set `DASHBOARD_PASSWORD` saat start, atau langsung ganti lewat panel **Keamanan Dashboard** (tab Ringkasan). Username login tetap `admin`. Jika lupa dan terkunci, hapus hash tersimpan: dari folder proyek jalankan `node -e "require('./src/db').deleteSetting('dashboard_password_hash')"` lalu restart.

## ❓ Troubleshooting

| Masalah | Solusi |
|---|---|
| QR tidak muncul / terus berputar | Pastikan internet stabil, klik **Reconnect** |
| Status "logged_out" | Klik **Scan Ulang**, lalu scan QR lagi |
| Pesan tidak terbalas | Cek tab Log Pesan — apakah pesan masuk tercatat? Jika tidak, koneksi WhatsApp terputus, klik Reconnect |
| `npm install` gagal | Pastikan Node.js versi ≥ 18 (`node -v`), coba `npm install --force` |
| Port 3000 dipakai aplikasi lain | Jalankan dengan `PORT=3001 npm start` (Linux/Mac) atau `set PORT=3001 && npm start` (Windows) |
