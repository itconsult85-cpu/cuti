// =====================================================================
// Template balasan WhatsApp NARAHUBUNG DPD PDI PERJUANGAN DKI JAKARTA
// Sumber: "FLOW NARAHUBUNG DPD.docx" (terbaru).
// Teks bisa diedit langsung dari dashboard (tab Template Balasan).
// =====================================================================

// Jejak perintah di akhir balasan menu/info (BUKAN untuk pesan penutup).
const HINT = `(Ketik 0 untuk kembali ke menu utama, ketik 9 untuk menu sebelumnya, ketik # untuk mengakhiri)`;

const WELCOME = `Merdeka !!!
Semoga kita sehat selalu dalam lindungan Tuhan YME.

Selamat datang di NARAHUBUNG DPD PDI PERJUANGAN DKI JAKARTA,
yang terhubung dengan SEKRETARIAT DPD.

"Orang Ikut Partai, Bukan Orang ikut Orang"

Silahkan pilih keperluan Bapak/Ibu/Saudara/I di menu berikut :

1. Struktur Partai
2. Badan/Sayap Partai
3. Perizinan
4. Aspirasi
5. Pengiriman
6. Informasi

Catatan :
Nomor ini bukan untuk menerima dan membalas panggilan, nomor ini hanya khusus
membalas pesan dari Bapak/Ibu/Saudara/I sekalian yang bersifat Informasi.`;

// ---- Menu utama ----
const STRUKTUR_MENU = `Silahkan Bapak/Ibu/Saudara/I pilih dari menu berikut :
1. DPD
2. DPC
3. PAC`;

const BADAN_MENU = `Silahkan Bapak/Ibu/Saudara/I pilih dari menu berikut :
1. BSPN
2. BPEK
3. BBHAR
4. BAGUNA
5. BAMUSI
6. BMI
7. TMP`;

const PERIZINAN_MENU = `Silahkan Bapak/Ibu/Saudara/I pilih jenis perizinan :
1. Kehadiran
2. Peminjaman`;

const ASPIRASI_MENU = `Silahkan Bapak/Ibu/Saudara/I pilih dari menu berikut :
1. Laporan Partai
2. Aspirasi Kepartaian
3. Aspirasi Kader`;

const INFORMASI_MENU = `Silahkan Bapak/Ibu/Saudara/I pilih Informasi yang ingin didapatkan :
1. Alamat Kantor DPD
2. Alamat dan Kontak DPC
3. Media Sosial DPD
4. Pembuatan KTA PDI PERJUANGAN
5. Agenda Kegiatan Partai`;

const DPC_MENU = `Silahkan Bapak/Ibu/Saudara/I pilih wilayah berikut :
1. DPC JAKARTA PUSAT
2. DPC JAKARTA TIMUR
3. DPC JAKARTA SELATAN
4. DPC JAKARTA BARAT
5. DPC JAKARTA UTARA
6. KEPULAUAN SERIBU`;

// ---- Hasil info struktur / badan ----
const STRUKTUR_RESULT = `Struktur Pengurus Masing Masing Tingkatan`;
const BADAN_RESULT = `Struktur Pengurus Masing Masing Badan/Sayap Partai`;

// ---- Perizinan Kehadiran ----
const IZIN_TARGET_MENU = `Silahkan Bapak/Ibu/Saudara/I pilih dari menu berikut :
1. DPD
2. DPC
3. PAC
4. BADAN/SAYAP PARTAI`;

const FORM_IZIN_DPD = `(Copy Pesan Ini)
Tolong masukan data Bapak/Ibu/Saudara/I :
Nama :
Jabatan :`;

const FORM_IZIN_LAIN = `(Copy Pesan Ini)
Tolong masukan data Bapak/Ibu/Saudara/I :
Nama :
Lembaga :
Jabatan :
Wilayah :`;

const FORM_IZIN_BADAN = `(Copy Pesan Ini)
Tolong masukan data Bapak/Ibu/Saudara/I :
Nama :
Lembaga :
Jabatan :
Wilayah :`;

const ACTIVITY_DPD = `Kegiatan yang Bapak/Ibu/Saudara/I ikuti adalah :
1. Piket Harian DPD
2. Rapat Pleno
3. Rapat gabungan
4. Agenda Eksternal
5. Kegiatan Partai`;

const ACTIVITY_LAIN = `Kegiatan yang Bapak/Ibu/Saudara/I ikuti adalah :
1. Rapat gabungan
2. Agenda eksternal
3. Kegiatan Partai`;

const ACTIVITY_BADAN = `Kegiatan yang Bap/Ibu/Saudara/I ikuti adalah :
1. Kegiatan Badan/Sayap
2. Rapat gabungan
3. Kegiatan Partai`;

const KONFIRMASI_IZIN = `Konfirmasi Bapak/Ibu/Saudara/I pada kegiatan tersebut :
1. Tidak Hadir
2. Izin Sakit`;

const FORM_KETERANGAN = `Berikan Keterangan Ketidakhadiran / izin :`;

// ---- Perizinan Peminjaman ----
const PEMINJAMAN_MENU = `Silahkan Bapak/Ibu/Saudara/I pilih jenis peminjaman :
1. Barang/Aset
2. Ruangan`;

const FORM_PEMINJAMAN_ASET = `(Copy Pesan Berikut)
Silahkan Bapak/Ibu/Saudara/I lengkapi data berikut :

DATA PEMINJAM
Nama :
Jabatan :
Lembaga :
Wilayah :
No Telp/WA Aktif :
Hari Peminjaman :
Tanggal Peminjaman :
Hari Kembali :
Tanggal Kembali :
Untuk Keperluan :

DATA BARANG/ASET
(Masukan keperluan Bapak/Ibu)`;

const FORM_PEMINJAMAN_RUANGAN = `(Copy Pesan Berikut)
Silahkan Bapak/Ibu/Saudara/I lengkapi data berikut :

DATA PEMINJAM :
Nama :
Jabatan :
Lembaga :
Wilayah :
No Telp/WA Aktif :
Untuk Keperluan :

AGENDA PEMAKAIAN :
Hari :
Tanggal :
Waktu :
Ruangan :
Jumlah Peserta :`;

// ---- Aspirasi ----
const FORM_ASPIRASI_UMUM = `(Copy Pesan Ini)
Silahkan Bapak/Ibu/Saudara/I isi form berikut :
Nama :
Lembaga/Wilayah :
Jabatan :
Yang disampaikan :`;

const FORM_ASPIRASI_KADER = `(Copy Pesan Ini)
Silahkan Bapak/Ibu/Saudara/I isi form berikut :
Nama :
NO KTA :
No Telp/WA Aktif :
Wilayah :
Alamat :
Yang disampaikan :`;

// ---- Pengiriman ----
const FORM_PENGIRIMAN = `(Copy Pesan Berikut)
Silahkan Bapak/Ibu/Saudara/I lengkapi data berikut :

DATA PENGIRIM:
Nama Lengkap :
Lembaga :
Jabatan :
Nama Instansi/Perusahaan :
No Telp/WA Aktif :

JENIS KIRIMAN:
Barang/Dokumen :
Jumlah/Banyaknya :
Kurir :

TUJUAN PENGIRIMAN:
Ditujukan kepada :
Hari :
Tanggal :`;

// ---- Penutup ----
const CLOSING_END = `Terimakasih, telah menghubungi DPD PDI PERJUANGAN DKI JAKARTA
melalui kontak NARAHUBUNG kami dan semoga informasi yang diberikan dapat bermanfaat.

Selamat Bertugas dan Sehat Selalu.
Merdeka !!!

SEKRETARIAT DPD.`;

const CLOSING_KONFIRMASI = `Terimakasih, atas konfirmasi yang telah Bapak/Ibu/Saudara/I sampaikan kepada
DPD PDI PERJUANGAN DKI JAKARTA

Selamat Bertugas dan Sehat Selalu.
Merdeka !!!

SEKRETARIAT DPD.`;

const CLOSING_PEMINJAMAN = `Pengisian ini hanya bersifat INFORMASI INTERNAL DPD.
Untuk Peminjaman ASET, Surat Resmi berkop Surat (Fisik) juga DIPERLUKAN,
ditujukan ke Sekretariat DPD.

Terimakasih,
Selamat Bertugas dan Sehat Selalu.
Merdeka !!!

SEKRETARIAT DPD.`;

const CLOSING_ASPIRASI = `Terimakasih, atas Laporan yang telah Bapak/Ibu/Saudara/I sampaikan kepada
DPD PDI PERJUANGAN DKI JAKARTA

Selamat Bertugas dan Sehat Selalu.
Merdeka !!!

SEKRETARIAT DPD.`;

const CLOSING_PENGIRIMAN = `Terimakasih, atas informasi yang telah Bapak/Ibu/Saudara/I sampaikan kepada
DPD PDI PERJUANGAN DKI JAKARTA

Selamat Bertugas dan Sehat Selalu.
Merdeka !!!

SEKRETARIAT DPD.`;

// ---- Balasan untuk pesan tidak dikenali ----
const POLITE_REJECT = `Mohon Maaf,
Bahasa/Balasan anda tidak sesuai, silahkan lihat kembali pesan yang kami sampaikan, terima kasih.

SEKRETARIAT DPD.`;

// ---- Konten Informasi ----
const INFO_DPD = `GEDUNG DPD PDI PERJUANGAN DKI JAKARTA
Jl. Agung Sedayu City No.10A, Cakung Bar., Kec. Cakung,
Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13910`;

const INFO_MEDSOS = `Website DPD : https://pdiperjuanganjakarta.id/
Instagram DPD : https://www.instagram.com/dpdpdipjakarta/`;

const INFO_KTA = `Untuk Pembuatan KTA Bapak/Ibu/Saudara/I dapat mempersiapkan
dokumen sebagai berikut :

1. KTP
2. PAS FOTO 3x4 Terbaru, dengan Latar Belakang Merah

Silahkan dokumen tersebut dibawa ke Kantor DPC masing-masing wilayah (diutamakan)
atau ke kantor DPD, untuk melakukan proses selanjutnya.`;

const INFO_AGENDA = `Berikut adalah Kalender Kegiatan Partai
PDI PERJUANGAN dan DPD PDI PERJUANGAN DKI JAKARTA.

(Agenda kegiatan akan diperbarui oleh Sekretariat DPD.)`;

const INFO_DPC = {
  1: { nama: 'KANTOR DPC JAKARTA PUSAT', alamat: 'Jl. Kalibaru Timur VI No. 106, RT.03/RW.08, Utan Panjang, Kecamatan Kemayoran, Kota Jakarta Pusat', telp: 'No Telp Sekretariat DPC JAKARTA PUSAT : (diisi Sekretariat DPD)' },
  2: { nama: 'KANTOR DPC JAKARTA TIMUR', alamat: 'Jl. H. Naman No. 3, RT.013/RW.03, Pondok Kelapa, Kec. Duren Sawit, Kota Jakarta Timur', telp: 'No Telp Sekretariat DPC JAKARTA TIMUR : (diisi Sekretariat DPD)' },
  3: { nama: 'KANTOR DPC JAKARTA SELATAN', alamat: 'JL. Pasir No.3, RT.01/RW.006, Ciganjur, Kec. Jagakarsa, Kota Jakarta Selatan', telp: 'No Telp Sekretariat DPC JAKARTA SELATAN : (diisi Sekretariat DPD)' },
  4: { nama: 'KANTOR DPC JAKARTA BARAT', alamat: 'JL. Semanan Pintu Air No.08, RT.10/RW.08, Semanan, Kec. Kalideres, Kota Jakarta Barat', telp: 'No Telp Sekretariat DPC JAKARTA BARAT : (diisi Sekretariat DPD)' },
  5: { nama: 'KANTOR DPC JAKARTA UTARA', alamat: 'Jl. Kesatriaan Raya No. 03, Cilincing, Kec. Cilincing, Kota Jakarta Utara', telp: 'No Telp Sekretariat DPC JAKARTA UTARA : (diisi Sekretariat DPD)' },
  6: { nama: 'KANTOR DPC KEP. SERIBU', alamat: 'Pulau Kelapa RW.07/RW.04, Pulau Kelapa, Kec. Kepulauan Seribu Utara, Kabupaten Kepulauan Seribu', telp: 'No Telp Sekretariat DPC Kep. Seribu : (diisi Sekretariat DPD)' },
};

function infoDpcText(choice) {
  const d = INFO_DPC[choice];
  if (!d) return null;
  return `*${d.nama}*
Alamat :
${d.alamat}

${d.telp}`;
}

// Label 6 menu utama (untuk statistik dashboard)
const MAIN_MENU_LABELS = {
  1: 'Struktur Partai',
  2: 'Badan/Sayap Partai',
  3: 'Perizinan',
  4: 'Aspirasi',
  5: 'Pengiriman',
  6: 'Informasi',
};

module.exports = {
  HINT,
  WELCOME,
  STRUKTUR_MENU, BADAN_MENU, PERIZINAN_MENU, ASPIRASI_MENU, INFORMASI_MENU, DPC_MENU,
  STRUKTUR_RESULT, BADAN_RESULT,
  IZIN_TARGET_MENU,
  FORM_IZIN_DPD, FORM_IZIN_LAIN, FORM_IZIN_BADAN,
  ACTIVITY_DPD, ACTIVITY_LAIN, ACTIVITY_BADAN, KONFIRMASI_IZIN, FORM_KETERANGAN,
  PEMINJAMAN_MENU, FORM_PEMINJAMAN_ASET, FORM_PEMINJAMAN_RUANGAN,
  FORM_ASPIRASI_UMUM, FORM_ASPIRASI_KADER,
  FORM_PENGIRIMAN,
  CLOSING_END, CLOSING_KONFIRMASI, CLOSING_PEMINJAMAN, CLOSING_ASPIRASI, CLOSING_PENGIRIMAN,
  POLITE_REJECT,
  INFO_DPD, INFO_MEDSOS, INFO_KTA, INFO_AGENDA,
  infoDpcText, MAIN_MENU_LABELS,
};
