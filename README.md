# Hotline WhatsApp Auto-Reply Gateway + Dashboard

Sistem balas pesan otomatis untuk nomor hotline WhatsApp **NARAHUBUNG DPD PDI Perjuangan DKI Jakarta**, sesuai alur pada file `FLOW NARAHUBUNG DPD.docx`.

## ✅ Fitur Utama

| Fitur | Keterangan |
|---|---|
| **Auto-reply multi-level menu** | 6 menu utama (Struktur Partai, Badan/Sayap Partai, Perizinan, Aspirasi, Pengiriman, Informasi) + sub-menu + form isian, sesuai alur terbaru |
| **Perintah di setiap pesan** | Ketik `0` Menu Utama, `9` Menu Sebelumnya, `#` Mengakhiri percakapan |
| **Tutup otomatis idle 2 menit** | Jika end user tidak membalas selama 2 menit, percakapan ditutup dengan pesan penutup; pesan berikutnya dianggap pesan awal baru |
| **Balasan sopan khusus** | Pesan tidak dikenal / di luar konteks / tidak sesuai dijawab dengan balasan ketidakcocokan yang sudah ditetapkan |
| **Tanpa verifikasi Meta** | Pakai protokol WhatsApp Web (Multi Device) — cukup **scan QR** sekali dengan HP nomor hotline. Tidak perlu akun Business API, tidak perlu approval Meta |
| **Dashboard web** | Status koneksi, QR, statistik, log pesan, riwayat percakapan, editor template, dan tab **Laporan** per kategori menu |
| **Laporan Excel** | Tab Laporan: tabel per kategori menu utama, filter **Harian / Mingguan / Bulanan** + rentang tanggal, tombol **Download Excel (.xlsx)** |
| **Hak akses admin** | Template/alur bawaan hanya bisa ditambah/diubah/ditambah alurnya oleh Administrator yang login dashboard; aturan keyword tambahan dikelola terpisah |
| **Database lokal** | Semua pesan tersimpan di `data/hotline.db` (SQLite) — tidak ada data dikirim ke pihak ketiga |
| **Reconnect otomatis** | Jika koneksi putus, bot menyambung ulang sendiri. Sesi login tersimpan (tidak perlu scan ulang setiap restart) |
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

3. **(Opsional) Konfigurasi lewat `.env`:**
   ```bash
   cp .env.example .env
   # edit .env: isi PORT dan DASHBOARD_PASSWORD
   ```
   File dibaca otomatis saat aplikasi start. `.env` asli berisi password dan **tidak di-push ke GitHub**; yang tersimpan di repo hanya `.env.example` (template tanpa rahasia).

4. Jalankan aplikasi:
   ```bash
   npm start
   ```

5. Buka browser, akses **http://localhost:3000** (atau `http://<ip-server>:3000` dari komputer lain).

6. Akan muncul **QR Code**. Di HP nomor hotline:
   - Buka WhatsApp → **Setelan** → **Perangkat Tertaut** → **Tautkan Perangkat**
   - Arahkan kamera HP ke QR di dashboard
   - Setelah ter-scan, status berubah menjadi **"Terhubung"** dan nomor hotline tampil di pojok kanan atas

7. Selesai. Setiap pesan masuk ke nomor hotline akan dibalas otomatis sesuai alur menu, dan tercatat di dashboard.

> Agar bot berjalan terus (24 jam), jalankan di laptop/server yang selalu menyala. Di Windows bisa gunakan `pm2 start src/index.js --name hotline` (install pm2 via `npm i -g pm2`) agar berjalan di background.

## 📊 Dashboard

- **Tab Ringkasan** — kartu statistik (hari ini/minggu ini/bulan ini), grafik 14 hari, **Menu Paling Sering Dipilih (6 menu utama)**, **Top 10 Pengirim**, dan panel **Keamanan Dashboard** (status login + tombol **Ganti Password**)
- **Ganti Password** — tombol di tab Ringkasan: isi password lama → password baru (min. 6 karakter) → Simpan. Password di-hash (scrypt) dan disimpan di `data/hotline.db`; browser minta login ulang dengan password baru. Tombol *Kembalikan ke Password Environment* untuk menghapus password kustom.
- **Tab Log Pesan** — semua pesan masuk & keluar, bisa cari berdasarkan isi/nama/nomor, filter tanggal, pagination
- **Tab Percakapan** — lihat utuh percakapan per pengirim (seperti chat WhatsApp)
- **Tab Template Balasan** — editor CRUD (Edit, Tambah, Simpan, Hapus). Template bawaan bertanda **Khusus Admin**
- **Tab Laporan** — menampilkan **data formulir terstruktur** per menu (bukan kutipan chat mentah); pilih kategori (Struktur Partai, Badan/Sayap Partai, Perizinan Kegiatan, Aspirasi, Pengiriman, Informasi) dan periode Harian/Mingguan/Bulanan. Kolom tabel menyesuaikan formulir tiap menu (termasuk kolom **Status Kehadiran / Izin** pada Perizinan Kehadiran). Tombol **Download Excel (.xlsx)** mengunduh **satu file workbook** dengan **satu sheet terpisah untuk tiap menu** + sheet Ringkasan.
- **Tombol Export PDF Log** — download log percakapan operasional (tab Log Pesan) sesuai filter tanggal; laporan formulir tidak diexport sebagai CSV.
- **Tombol Reconnect** — menyambung ulang koneksi tanpa scan ulang
- **Tombol Scan Ulang** — menghapus sesi lama dan menampilkan QR baru (jika nomor hotline berganti atau keluar)

## ✏️ Mengubah Template Balasan (Edit / Tambah / Hapus / Simpan)

**Cara termudah: lewat dashboard** — buka tab **"Template Balasan"**. Ada dua jenis:
- **Template Bawaan** (alur menu: sambutan, menu, form, penutup, info) — ditandai badge **Khusus Admin**. Hanya Administrator yang login dashboard yang dapat mengedit, menyimpan, dan menambah alur bawaan baru (tombol **+ Tambah Alur Bawaan**); tidak bisa dihapus. Perubahan langsung aktif, **tanpa restart**.
- **Aturan Tambahan** (keyword → balasan otomatis) — klik **"+ Tambah Aturan Keyword"**, isi keyword (mis. "jam operasional") dan teks balasan. Jika pesan masuk mengandung keyword tersebut, bot membalas dengan teks itu. Bisa **Edit** dan **Hapus**.

Semua template disimpan di database (`data/hotline.db`), bukan di file. Backup database = backup template.

Jika ingin mengubah default (seed awal), edit **`src/templates.js`**. Versi seed (`SEED_VERSION` di `src/templateStore.js`) otomatis mengganti template bawaan lama saat aplikasi start, sedangkan aturan keyword buatan admin tetap dipertahankan.

## 🔄 Alur Percakapan (sesuai FLOW NARAHUBUNG DPD)

```
Pesan masuk → Welcome + Menu Utama (6 opsi) + jejak perintah (0 / 9 / #)
├─ 1. Struktur Partai → DPD / DPC / PAC → Struktur Pengurus Tingkatan
├─ 2. Badan/Sayap Partai → BSPN/BPEK/BBHAR/BAGUNA/BAMUSI/BMI/TMP → Struktur Pengurus Badan/Sayap
├─ 3. Perizinan
│   ├─ Kehadiran → DPD/DPC/PAC/Badan-Sayap → Form data → Pilih Kegiatan → Konfirmasi (Tidak Hadir/Izin Sakit) → Keterangan → Penutup Konfirmasi
│   └─ Peminjaman → Barang/Aset (form data peminjam + barang) / Ruangan (form data peminjam + agenda) → Penutup Peminjaman
├─ 4. Aspirasi → Laporan Partai / Aspirasi Kepartaian / Aspirasi Kader (form) → Penutup Aspirasi
├─ 5. Pengiriman → Form data pengirim, jenis kiriman, tujuan → Penutup Pengiriman
└─ 6. Informasi → Alamat DPD / Kontak DPC (6 wilayah) / Media Sosial / KTA / Agenda Kegiatan

Perintah: 0 = Menu Utama, 9 = Menu Sebelumnya, # = Akhiri.
Idle 2 menit atau ketik # → pesan penutup; pesan berikutnya mulai dari awal.
Pesan tidak dikenal / di luar konteks → balasan sopan khusus (Mohon Maaf …).

## 📁 Struktur Folder

```
wa-hotline-bot/
├── package.json          # daftar dependensi
├── README.md             # panduan ini
├── .env.example          # contoh konfigurasi (salin ke .env; .env asli tidak di-push)
├── src/
│   ├── index.js          # entry point (jalankan bot + dashboard)
│   ├── loadEnv.js        # pembaca file .env otomatis
│   ├── whatsapp.js       # koneksi WhatsApp (Baileys) + QR + kirim pesan
│   ├── bot.js            # mesin percakapan / state machine (0/9/#, idle, reject) + simpan entri formulir
│   ├── forms.js          # parser formulir: pesan berlabel -> fields terstruktur
│   ├── reportSchema.js  # skema kolom laporan per menu utama + pemetaan sheet Excel
│   ├── scheduler.js      # penutup otomatis percakapan idle 2 menit
│   ├── templates.js      # semua teks balasan bawaan (FLOW NARAHUBUNG DPD)
│   ├── templateStore.js  # seed versioning + cache template dari DB
│   ├── db.js             # SQLite: log pesan, form_entries, state, template, pengaturan
│   └── server.js         # API dashboard, laporan Excel multi-sheet, export PDF log
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
