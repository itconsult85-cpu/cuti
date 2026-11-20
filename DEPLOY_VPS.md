# Panduan Deploy ke VPS — folder `/home/bonichi/`

Panduan ini men-deploy **WhatsApp Hotline Bot** di VPS Ubuntu/Debian (mis. IDCloudHost, Rumahweb, Niagahoster, Vultr, DigitalOcean) memakai user `bonichi`, dengan kode di `/home/bonichi/wa-hotline-bot`.

Prasyarat:
- VPS Ubuntu 22.04/24.04 atau Debian 11/12, RAM minimal 1 GB
- Akses SSH ke user `bonichi` (punya `sudo` bila memungkinkan; tanpa sudo pun bisa lewat nvm)
- Nomor WhatsApp hotline untuk scan QR sekali di awal

> Versi ringkas otomatis: jalankan `bash deploy-bonichi.sh` setelah SSH. Panduan manual di bawah untuk memahami tiap langkah.

---

## Langkah 1 — Masuk ke VPS via SSH

```bash
ssh bonichi@IP_VPS_ANDA
```

Perbarui sistem (jika ada sudo):

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget
```

## Langkah 2 — Pasang Node.js 22

### Opsi A — dengan sudo (disarankan)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # harus v22.x
```

### Opsi B — tanpa sudo (nvm, userspace)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
node -v
```

## Langkah 3 — Ambil kode dari GitHub ke `/home/bonichi/wa-hotline-bot`

Repo: `https://github.com/itconsult85-cpu/cuti.git`

**Jika repo public:**

```bash
cd /home/bonichi
git clone https://github.com/itconsult85-cpu/cuti.git wa-hotline-bot
cd wa-hotline-bot
```

**Jika repo private** (git akan meminta username + Personal Access Token, **bukan password akun GitHub**):

```bash
cd /home/bonichi
# Simpan kredensial sekali saja agar tidak ditanya tiap pull:
git config --global credential.helper store
git clone https://github.com/itconsult85-cpu/cuti.git wa-hotline-bot
# Username : itconsult85-cpu
# Password : tempel Personal Access Token (BUKAN password login GitHub)
cd wa-hotline-bot
```

Cara membuat token (classic, paling pasti): GitHub web → **Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)** → centang scope **`repo`** → Generate → salin (`ghp_...`). Token fine-grained (`github_pat_...`) harus diberi **Contents: Read and write** dan akses ke repo `cuti`, kalau tidak muncul error `403 Permission denied`.

> Folder hasil: `/home/bonichi/wa-hotline-bot/` (bukan langsung di `/home/bonichi/`). Jika ingin seluruh kode berada tepat di `/home/bonichi/`, ganti `wa-hotline-bot` di perintah clone dengan `.`

## Langkah 4 — Install dependensi

```bash
cd /home/bonichi/wa-hotline-bot
npm install --omit=dev --no-audit --no-fund
```

## Langkah 5 — Pasang PM2 (penjaga proses agar hidup 24 jam & restart otomatis)

Dengan sudo:

```bash
sudo npm install -g pm2
```

Tanpa sudo (lokal di proyek):

```bash
npm install --no-save pm2
export PATH="$PWD/node_modules/.bin:$PATH"
```

## Langkah 6 — Set password dashboard & jalankan

```bash
cd /home/bonichi/wa-hotline-bot
mkdir -p data
DASHBOARD_PASSWORD="BuatPasswordRahasiaAnda" PORT=3000 pm2 start ecosystem.config.js
pm2 save
```

Cek status:

```bash
pm2 list          # status harus "online"
pm2 logs hotline  # cari tulisan "Terhubung sebagai 628xxx" dan QR
```

## Langkah 7 — Buka dashboard & scan QR

### Akses lokal/VPS langsung (buka port 3000 di firewall)

```bash
# jika UFW aktif:
sudo ufw allow 3000/tcp
```

Buka browser: `http://IP_VPS:3000` → login `admin` / password Langkah 6 → muncul QR → scan dari WhatsApp nomor hotline (Setelan → Perangkat Tertaut).

### Akses lewat Tunnel gratis Cloudflare (tanpa buka port, dapat URL HTTPS publik)

```bash
mkdir -p ~/.local/bin
curl -L -o ~/.local/bin/cloudflared \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x ~/.local/bin/cloudflared
nohup ~/.local/bin/cloudflared tunnel --url http://localhost:3000 > data/cloudflared.log 2>&1 &
grep trycloudflare data/cloudflared.log
```

URL seperti `https://xxxx.trycloudflare.com` dibuka di browser. Untuk tunnel yang tidak berubah-ubah, daftarkan akun Cloudflare gratis dan buat named tunnel.

## Langkah 8 — Auto-hidup saat VPS reboot

Dengan sudo:

```bash
sudo env PATH=$PATH:/usr/bin:/usr/local/bin pm2 startup systemd -u bonichi --hp /home/bonichi
# jalankan perintah yang ditampilkan output, lalu:
pm2 save
```

Tanpa sudo (user service):

```bash
loginctl enable-linger bonichi
pm2 startup systemd -u bonichi --hp /home/bonichi
pm2 save
```

## Saat diminta Username & Password (ketahui konteksnya)

Ada tiga kemungkinan layar login saat deploy, isi dengan berbeda:

### 1. Saat perintah `git clone` / `git pull` di terminal VPS
```
Username for 'https://github.com': itconsult85-cpu
Password for 'https://itconsult85-cpu@github.com': <tempel Personal Access Token>
```
- **Jangan** isi password akun GitHub — Git HTTPS GitHub sudah menolak password biasa dan akan gagal `403 Authentication failed`.
- Password di sini = token `ghp_...` (scope `repo`). Saat mengetik token, layar tidak menampilkan karakter (normal), tekan Enter saja.
- Biar tidak ditanya lagi: `git config --global credential.helper store` (kredensial tersimpan di `~/.git-credentials`).

### 2. Saat membuka dashboard di browser (pop-up / halaman login)
- **Username:** `admin`
- **Password:** nilai `DASHBOARD_PASSWORD` yang Anda ketik di Langkah 6.
- Pakai script otomatis? Password dibuat otomatis dan dibaca dengan:
```bash
cat /home/bonichi/wa-hotline-bot/data/.dashboard_password
```
- Lupa / ganti password:
```bash
cd /home/bonichi/wa-hotline-bot
pm2 delete hotline
DASHBOARD_PASSWORD="PasswordBaruYangKuat" PORT=3000 pm2 start ecosystem.config.js
pm2 save
```

### 3. Saat perintah `sudo ... pm2 startup ...`
- Itu meminta **password user VPS `bonichi`** (password SSH), bukan GitHub dan bukan password dashboard. Saat diketik tidak ada karakter yang muncul — itu normal, tekan Enter.

## Struktur folder di VPS

```
/home/bonichi/
└── wa-hotline-bot/
    ├── ecosystem.config.js     # konfigurasi pm2
    ├── deploy-bonichi.sh      # script otomatis
    ├── src/                   # kode bot + server dashboard
    ├── public/                # tampilan dashboard
    ├── data/                  # dibuat otomatis (JANGAN dihapus asal-asalan)
    │   ├── hotline.db         # seluruh data pesan + template (BACKUP REGULER)
    │   ├── auth/               # sesi WhatsApp (tanpa ini, scan ulang QR)
    │   └── .dashboard_password
    └── node_modules/
```

## Operasi harian

| Tujuan | Perintah |
|---|---|
| Lihat log real-time | `pm2 logs hotline` |
| Restart setelah update kode | `cd /home/bonichi/wa-hotline-bot && git pull && npm install && pm2 restart hotline` |
| Stop sementara | `pm2 stop hotline` |
| Cek status | `pm2 list` |
| Backup laporan | `cp data/hotline.db data/hotline-$(date +%F).db` |

## Update kode dari GitHub

Setelah ada perubahan di repo:

```bash
cd /home/bonichi/wa-hotline-bot
git pull origin main
npm install --omit=dev
pm2 restart hotline
```

## Troubleshooting

| Gejala | Penyebab / Solusi |
|---|---|
| `npm: command not found` | Node.js belum terpasang ulang setelah reboot (nvm): `source ~/.bashrc` |
| pm2 online tapi dashboard 401 | Password salah; cek env saat start atau reset di Langkah 6 |
| Dashboard terbuka tapi status "logged_out" | Di dashboard klik **Scan Ulang**, lalu scan QR baru |
| Pesan masuk tanpa balasan | `pm2 logs hotline`; pastikan status `Terhubung`; restart tunnel jika pakai cloudflared |
| QR tidak muncul di dashboard | Cek `pm2 logs hotline`; hapus folder `data/auth` lalu restart untuk QR baru |
| Port 3000 diblokir provider | Pakai opsi tunnel Cloudflare (Langkah 7 bagian B) |
| `EADDRINUSE: 3000` / "port 3000 terpakai" | Lihat bagian khusus di bawah: hentikan proses lama **atau** pindahkan bot ke port 3100 |

## Jika port 3000 terpakai

Cek siapa pemilik port:

```bash
sudo ss -ltnp | grep ':3000'
# atau: sudo lsof -i :3000
```

### Opsi A — hentikan proses lama (jika itu bot versi lama atau aplikasi yang tidak penting)

```bash
cd /home/bonichi/wa-hotline-bot
pm2 delete hotline
# jika pemiliknya bukan pm2, pakai PID dari output ss:  kill <PID>
```

Lalu ulangi Langkah 6.

### Opsi B — pindahkan bot ke port lain (mis. 3100)

PM2 menyimpan environment lama, jadi hapus dulu, lalu start ulang dengan port baru:

```bash
cd /home/bonichi/wa-hotline-bot
pm2 delete hotline
PORT=3100 DASHBOARD_PASSWORD="PasswordAnda" pm2 start ecosystem.config.js
pm2 save
sudo ufw allow 3100/tcp        # hanya bila akses langsung lewat IP VPS
# tunnel cloudflared diarahkan ke port baru:
nohup ~/.local/bin/cloudflared tunnel --url http://localhost:3100 > data/cloudflared.log 2>&1 &
```

Verifikasi: `pm2 list` harus `online`, dan `ss -ltnp | grep 3100` menampilkan proses bot.

> Catatan: `deploy-bonichi.sh` otomatis memilih port bebas (3000 → 3100 → …) bila port sebelumnya sudah dipakai, jadi masalah ini umumnya tidak muncul saat pakai script.

## Catatan keamanan

- Dashboard di belakang password; jika dipublikasikan, batasi akses (IP allowlist / basic auth reverse proxy).
- `data/hotline.db` dan `data/auth/` tidak ikut di GitHub (lihat `.gitignore`) — backup manual ke lokasi lain.
- Setelah tidak dipakai, cabut akses token GitHub yang dipakai saat clone private repo.
