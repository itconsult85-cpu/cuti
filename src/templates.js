// =====================================================================
// Template balasan WhatsApp Hotline DPD PDI PERJUANGAN DKI JAKARTA
// Diambil dari file "WA CHAT BOT.docx".
// Semua teks bisa diedit di file ini tanpa mengubah kode program.
// =====================================================================

const FOOTER = '\n\n_(Ketik *0* kapan saja untuk kembali ke menu utama)_';

const WELCOME = `Merdeka !!!
Semoga kita sehat selalu dalam lindungan Tuhan YME.
Selamat datang di HOTLINE DPD PDI PERJUANGAN DKI JAKARTA,
yang terhubung dengan SEKRETARIAT DPD.

Silahkan pilih kebutuhan Bapak/Ibu/Saudara/I di menu berikut :
1. Struktur Partai
2. Badan/Sayap Partai
3. Penyampaian
4. Perizinan Kegiatan
5. Pengiriman
6. Informasi`;

const STRUKTUR_MENU = `Silahkan Bapak/Ibu/Saudara/I pilih dari menu berikut :
1. DPD
2. DPC
3. PAC
4. RANTING
5. ANAK RANTING`;

const BADAN_MENU = `Silahkan Bapak/Ibu/Saudara/I pilih dari menu berikut :
1. TMP
2. BMI
3. BBHAR
4. BAMUSI
5. GNTI
6. BSPN
7. BAGUNA
8. BPEK`;

const PENYAMPAIAN_MENU = `Silahkan Bapak/Ibu/Saudara/I pilih dari menu berikut :
1. Laporan Partai
2. Aspirasi Kepartaian
3. Aspirasi Warga Jakarta`;

const INFORMASI_MENU = `Silahkan Bapak/Ibu/Saudara/I pilih Informasi yang ingin di dapatkan :
1. Informasi Alamat Kantor DPD
2. Informasi Media Sosial
3. Informasi Pembuatan KTA
4. Informasi Alamat dan Kontak DPC`;

const DPC_MENU = `Silahkan Bapak/Ibu/Saudara/I pilih Informasi berikut :
1. DPC JAKARTA PUSAT
2. DPC JAKARTA TIMUR
3. DPC JAKARTA SELATAN
4. DPC JAKARTA BARAT
5. DPC JAKARTA UTARA
6. KEPULAUAN SERIBU`;

// Formulir (dikirim dengan instruksi "copy pesan ini", diisi lalu dibalas)
const FORM_NAMA_JABATAN = `*(Copy Pesan Ini)*
Tolong masukan data Bapak/Ibu/Saudara/I :
Nama :
Jabatan :`;

const FORM_PENYAMPAIAN_PARTAI = `*(Copy Pesan Ini)*
Silahkan Bapak/Ibu/Saudara/I lengkapi form berikut :
Nama :
Struktur :
Jabatan :

Yang disampaikan :`;

const FORM_PENYAMPAIAN_WARGA = `*(Copy Pesan Ini)*
Silahkan Bapak/Ibu/Saudara/I lengkapi form berikut :
Nama :
NIK/KTP :
Alamat :

Yang disampaikan :`;

const FORM_PERIZINAN = `*(Copy Pesan Berikut)*
Silahkan Bapak/Ibu/Saudara/I lengkapi data berikut :
Nama :
Struktur/Badan/Sayap Partai :
Jabatan :
Jenis Kegiatan :
Hari dan Tanggal :
Waktu :
Ruangan/Lokasi Kegiatan :
Jumlah Peserta :
Agenda :`;

const FORM_PENGIRIMAN = `*(Copy Pesan Berikut)*
Silahkan Bapak/Ibu/Saudara/I lengkapi data berikut :
Nama Pengirim :
Struktur/Badan/Sayap Partai :
Jabatan :
Nama Instansi/Perusahaan :
Jenis Barang/Dokumen :
Jumlah/Banyaknya :
Ditujukan kepada :
Hari dan Tanggal :`;

// Pilihan kegiatan setelah form (berbeda tergantung jalur)
const ACTIVITY_DPD = `Kegiatan yang Bapak/Ibu/Saudara/I ikuti adalah :
1. Piket Harian DPD
2. Rapat Pleno/DPD
3. Piket Harian & Pleno DPD
4. Rapat gabungan (DPP/DPD/DPC/BADAN & SAYAP)
5. Audiensi Dengan Pihak eksternal
6. Kegiatan Partai`;

const ACTIVITY_STRUKTUR_LAIN = `Kegiatan yang Bapak/Ibu/Saudara/I ikuti adalah :
1. Rapat gabungan (DPP/DPD/DPC/BADAN & SAYAP)
2. Audiensi Dengan Pihak eksternal
3. Kegiatan Partai`;

const ACTIVITY_BADAN = `Kegiatan yang Bapak/Ibu/Saudara/I ikuti adalah :
1. Rapat gabungan (DPP/DPD/DPC/BADAN & SAYAP)
2. Kegiatan Badan/Sayap
3. Piket Badan/Sayap
4. Kegiatan Partai`;

const KONFIRMASI = `Konfirmasi Bapak/Ibu/Saudara/I pada kegiatan tersebut :
1. Hadir
2. Izin Dinas Pekerjaan
3. Izin Acara/Keluarga
4. Sakit
5. Tidak hadir dengan Keterangan
6. Tidak Hadir`;

// Pesan penutup / terima kasih (beberapa varian sesuai konteks)
const THANKS_KEHADIRAN = `Terimakasih, atas konfirmasi Bapak/Ibu/Saudara/I,
kami atas nama SEKRETARIAT DPD PDI PERJUANGAN,
senang sekali dapat membantu bapak/ibu/Saudara/I Sekalian.

Selamat Bertugas dan Tetap Jaga Kesehatan.
Merdeka !!!`;

const THANKS_PENYAMPAIAN = `Terimakasih, atas Laporan/Aspirasi yang telah Bapak/Ibu/Saudara/I sampaikan kepada kami.
kami atas nama SEKRETARIAT DPD PDI PERJUANGAN,
akan segera menindaklanjuti Laporan/Aspirasi bapak/ibu/Saudara/I Sekalian.

Selamat Bertugas dan Tetap Jaga Kesehatan.
Merdeka !!!`;

const THANKS_PENYAMPAIAN_WARGA = `Terimakasih, atas Aspirasi yang telah Bapak/Ibu/Saudara/I sampaikan kepada DPD PDI PERJUANGAN DKI JAKARTA, kami akan segera menindaklanjuti Aspirasi bapak/ibu/Saudara/I Sekalian.

Tetap Jaga Kesehatan.
Merdeka !!!`;

const THANKS_PERIZINAN = `Terimakasih, atas Informasi Bapak/Ibu/Saudara/I,
kami atas nama SEKRETARIAT DPD PDI PERJUANGAN,
akan segera menindaklanjuti informasi yang bapak/ibu/Saudara/I Sekalian sampaikan.

Selamat Bertugas dan Tetap Jaga Kesehatan.
Merdeka !!!`;

const THANKS_PENGIRIMAN = `Terimakasih, atas Informasi Bapak/Ibu/Saudara/I,
kami atas nama SEKRETARIAT DPD PDI PERJUANGAN,
akan segera melanjutkan informasi yang bapak/ibu/Saudara/I Sekalian sampaikan.

Tetap Jaga Kesehatan.
Merdeka !!!`;

const THANKS_INFO = `Terimakasih, telah menghubungi HOTLINE DPD PDI PERJUANGAN DKI JAKARTA,
Semoga informasi yang diberikan kepada bapak/ibu/Saudara/I Sekalian dapat bermanfaat.

Tetap Jaga Kesehatan.
Merdeka !!!`;

// --- Konten Informasi (silahkan sesuaikan dengan data asli) ---
const INFO_ALAMAT_DPD = `*Alamat Kantor DPD PDI PERJUANGAN DKI JAKARTA*
Jl. Agung Sedayu City No.10A, Cakung Bar., Kec. Cakung, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13910

_(Silahkan buka Google Maps dan cari "PDIP DPD DKI Jakarta" untuk share lokasi)_`;

const INFO_MEDIA_SOSIAL = `*Media Sosial DPD PDI PERJUANGAN DKI JAKARTA*
Instagram DPD : https://instagram.com/...
Tiktok DPD : https://tiktok.com/@...
Website DPD : https://...

(Silahkan ganti link di atas dengan akun resmi asli)`;

const INFO_KTA = `*Informasi Pembuatan KTA*
Untuk Pembuatan KTA Bapak/Ibu/Saudara/I dapat melengkapi dokumen sebagai berikut dan dibawa ke Kantor DPC masing-masing wilayah atau ke kantor DPD, adapun dokumen yang perlu dibawa adalah sebagai berikut :
1. Fotocopy KTP
2. Fotocopy KK
3. Pas foto berwarna terbaru
4. Surat keterangan dari PAC/Ranting (jika ada)

(Daftar dokumen di atas dapat disesuaikan dengan ketentuan terbaru)`;

// Template alamat DPC per kota (placeholder, isi dengan data asli)
const INFO_DPC = {
  1: { nama: 'DPC JAKARTA PUSAT', alamat: 'Alamat DPC Jakarta Pusat: ...', telp: 'No Telp Sekretariat: ...' },
  2: { nama: 'DPC JAKARTA TIMUR', alamat: 'Alamat DPC Jakarta Timur: ...', telp: 'No Telp Sekretariat: ...' },
  3: { nama: 'DPC JAKARTA SELATAN', alamat: 'Alamat DPC Jakarta Selatan: ...', telp: 'No Telp Sekretariat: ...' },
  4: { nama: 'DPC JAKARTA BARAT', alamat: 'Alamat DPC Jakarta Barat: ...', telp: 'No Telp Sekretariat: ...' },
  5: { nama: 'DPC JAKARTA UTARA', alamat: 'Alamat DPC Jakarta Utara: ...', telp: 'No Telp Sekretariat: ...' },
  6: { nama: 'KEPULAUAN SERIBU', alamat: 'Alamat DPC Kepulauan Seribu: ...', telp: 'No Telp Sekretariat: ...' },
};

function infoDpcText(choice) {
  const d = INFO_DPC[choice];
  if (!d) return null;
  return `*${d.nama}*
${d.alamat}
${d.telp}`;
}

// Label menu utama (untuk logging / dashboard)
const MAIN_MENU_LABELS = {
  1: 'Struktur Partai',
  2: 'Badan/Sayap Partai',
  3: 'Penyampaian',
  4: 'Perizinan Kegiatan',
  5: 'Pengiriman',
  6: 'Informasi',
};

module.exports = {
  FOOTER,
  WELCOME,
  STRUKTUR_MENU,
  BADAN_MENU,
  PENYAMPAIAN_MENU,
  INFORMASI_MENU,
  DPC_MENU,
  FORM_NAMA_JABATAN,
  FORM_PENYAMPAIAN_PARTAI,
  FORM_PENYAMPAIAN_WARGA,
  FORM_PERIZINAN,
  FORM_PENGIRIMAN,
  ACTIVITY_DPD,
  ACTIVITY_STRUKTUR_LAIN,
  ACTIVITY_BADAN,
  KONFIRMASI,
  THANKS_KEHADIRAN,
  THANKS_PENYAMPAIAN,
  THANKS_PENYAMPAIAN_WARGA,
  THANKS_PERIZINAN,
  THANKS_PENGIRIMAN,
  THANKS_INFO,
  INFO_ALAMAT_DPD,
  INFO_MEDIA_SOSIAL,
  INFO_KTA,
  infoDpcText,
  MAIN_MENU_LABELS,
};
