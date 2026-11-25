// =====================================================================
// Skema Laporan: kolom per kategori menu utama + pemetaan baris dari
// tabel form_entries. Dipakai bersama oleh endpoint dashboard (tabel
// Laporan) dan ekspor Excel (satu sheet per kategori).
// Kolom hanya berisi data FORMULIR terstruktur — bukan teks chat mentah.
// =====================================================================

function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
}

const val = (obj, key) => String(obj && obj[key] != null ? obj[key] : '').trim();

// Urutan chip di dashboard juga urutan sheet Excel.
const CATEGORIES = [
  {
    key: 'struktur',
    label: 'Struktur Partai',
    dbLabel: 'Struktur Partai',
    sheet: '1. Struktur Partai',
    columns: [
      { k: 'waktu', t: 'Waktu' },
      { k: 'nama', t: 'Nama' },
      { k: 'nomor', t: 'Nomor WhatsApp' },
      { k: 'subkategori', t: 'Submenu Dipilih' },
    ],
    map: (e) => ({
      waktu: fmtTime(e.ts),
      nama: val(e, 'name'),
      nomor: val(e, 'nomor'),
      subkategori: val(e, 'subkategori'),
    }),
  },
  {
    key: 'badan',
    label: 'Badan/Sayap Partai',
    dbLabel: 'Badan/Sayap Partai',
    sheet: '2. Badan Sayap Partai',
    columns: [
      { k: 'waktu', t: 'Waktu' },
      { k: 'nama', t: 'Nama' },
      { k: 'nomor', t: 'Nomor WhatsApp' },
      { k: 'subkategori', t: 'Badan/Sayap Dipilih' },
    ],
    map: (e) => ({
      waktu: fmtTime(e.ts),
      nama: val(e, 'name'),
      nomor: val(e, 'nomor'),
      subkategori: val(e, 'subkategori'),
    }),
  },
  {
    key: 'perizinan',
    label: 'Perizinan Kegiatan',
    dbLabel: 'Perizinan Kegiatan',
    sheet: '3. Perizinan Kegiatan',
    columns: [
      { k: 'waktu', t: 'Waktu' },
      { k: 'nama', t: 'Nama' },
      { k: 'nomor', t: 'Nomor WhatsApp' },
      { k: 'jenis', t: 'Jenis Izin / Permohonan' },
      { k: 'target', t: 'Target Tingkat' },
      { k: 'badan', t: 'Badan/Sayap' },
      { k: 'kegiatan', t: 'Kegiatan' },
      { k: 'status', t: 'Status Kehadiran / Izin' },
      { k: 'jabatan', t: 'Jabatan' },
      { k: 'lembaga', t: 'Lembaga' },
      { k: 'wilayah', t: 'Wilayah' },
      { k: 'telp', t: 'No Telp/WA Aktif' },
      { k: 'hari_pinjam', t: 'Hari Peminjaman' },
      { k: 'tgl_pinjam', t: 'Tanggal Peminjaman' },
      { k: 'hari_kembali', t: 'Hari Kembali' },
      { k: 'tgl_kembali', t: 'Tanggal Kembali' },
      { k: 'ruangan', t: 'Ruangan' },
      { k: 'waktu_pakai', t: 'Waktu Pemakaian' },
      { k: 'peserta', t: 'Jumlah Peserta' },
      { k: 'rincian', t: 'Keperluan / Keterangan' },
    ],
    map: (e) => {
      const f = e.fields || {};
      let jenis = val(e, 'subkategori');
      if (jenis.startsWith('Kehadiran')) jenis = 'Kehadiran';
      else if (jenis.startsWith('Peminjaman Barang')) jenis = 'Peminjaman Barang/Aset';
      else if (jenis.startsWith('Peminjaman Ruangan')) jenis = 'Peminjaman Ruangan';
      const rincian = [f.keterangan, f.keperluan, f.barang].map(v => String(v || '').trim()).filter(Boolean).join(' | ');
      return {
        waktu: fmtTime(e.ts),
        nama: val(f, 'nama') || val(e, 'name'),
        nomor: val(e, 'nomor'),
        jenis,
        target: val(f, 'target'),
        badan: val(f, 'badan'),
        kegiatan: val(e, 'kegiatan'),
        status: val(e, 'status'),
        jabatan: val(f, 'jabatan'),
        lembaga: val(f, 'lembaga'),
        wilayah: val(f, 'wilayah'),
        telp: val(f, 'telp'),
        hari_pinjam: val(f, 'hari_pinjam'),
        tgl_pinjam: val(f, 'tgl_pinjam'),
        hari_kembali: val(f, 'hari_kembali'),
        tgl_kembali: val(f, 'tgl_kembali'),
        ruangan: val(f, 'ruangan'),
        waktu_pakai: val(f, 'waktu'),
        peserta: val(f, 'peserta'),
        rincian,
      };
    },
  },
  {
    key: 'aspirasi',
    label: 'Aspirasi',
    dbLabel: 'Aspirasi',
    sheet: '4. Aspirasi',
    columns: [
      { k: 'waktu', t: 'Waktu' },
      { k: 'nama', t: 'Nama' },
      { k: 'nomor', t: 'Nomor WhatsApp' },
      { k: 'jenis', t: 'Jenis Aspirasi' },
      { k: 'kta', t: 'NO KTA' },
      { k: 'jabatan', t: 'Jabatan' },
      { k: 'lembaga_wilayah', t: 'Lembaga/Wilayah' },
      { k: 'telp', t: 'No Telp/WA Aktif' },
      { k: 'alamat', t: 'Alamat' },
      { k: 'isi', t: 'Yang Disampaikan' },
    ],
    map: (e) => {
      const f = e.fields || {};
      return {
        waktu: fmtTime(e.ts),
        nama: val(f, 'nama') || val(e, 'name'),
        nomor: val(e, 'nomor'),
        jenis: val(e, 'subkategori'),
        kta: val(f, 'kta'),
        jabatan: val(f, 'jabatan'),
        lembaga_wilayah: val(f, 'lembaga_wilayah'),
        telp: val(f, 'telp'),
        alamat: val(f, 'alamat'),
        isi: val(f, 'isi'),
      };
    },
  },
  {
    key: 'pengiriman',
    label: 'Pengiriman',
    dbLabel: 'Pengiriman',
    sheet: '5. Pengiriman',
    columns: [
      { k: 'waktu', t: 'Waktu' },
      { k: 'nama', t: 'Nama Pengirim' },
      { k: 'nomor', t: 'Nomor WhatsApp' },
      { k: 'lembaga', t: 'Lembaga' },
      { k: 'jabatan', t: 'Jabatan' },
      { k: 'instansi', t: 'Nama Instansi/Perusahaan' },
      { k: 'telp', t: 'No Telp/WA Aktif' },
      { k: 'jenis', t: 'Jenis Kiriman (Barang/Dokumen)' },
      { k: 'jumlah', t: 'Jumlah/Banyaknya' },
      { k: 'kurir', t: 'Kurir' },
      { k: 'tujuan', t: 'Ditujukan Kepada' },
      { k: 'hari', t: 'Hari' },
      { k: 'tanggal', t: 'Tanggal' },
    ],
    map: (e) => {
      const f = e.fields || {};
      return {
        waktu: fmtTime(e.ts),
        nama: val(f, 'nama') || val(e, 'name'),
        nomor: val(e, 'nomor'),
        lembaga: val(f, 'lembaga'),
        jabatan: val(f, 'jabatan'),
        instansi: val(f, 'instansi'),
        telp: val(f, 'telp'),
        jenis: val(f, 'jenis'),
        jumlah: val(f, 'jumlah'),
        kurir: val(f, 'kurir'),
        tujuan: val(f, 'tujuan'),
        hari: val(f, 'hari'),
        tanggal: val(f, 'tanggal'),
      };
    },
  },
  {
    key: 'informasi',
    label: 'Informasi',
    dbLabel: 'Informasi',
    sheet: '6. Informasi',
    columns: [
      { k: 'waktu', t: 'Waktu' },
      { k: 'nama', t: 'Nama' },
      { k: 'nomor', t: 'Nomor WhatsApp' },
      { k: 'jenis', t: 'Jenis Informasi' },
      { k: 'rincian', t: 'Rincian Permintaan' },
    ],
    map: (e) => {
      const f = e.fields || {};
      return {
        waktu: fmtTime(e.ts),
        nama: val(e, 'name'),
        nomor: val(e, 'nomor'),
        jenis: val(e, 'subkategori'),
        rincian: val(f, 'wilayah') || val(f, 'rincian'),
      };
    },
  },
];

// Tampilan "Semua Menu": ringkasan lintas kategori (tanpa teks chat mentah).
const OVERVIEW_COLUMNS = [
  { k: 'waktu', t: 'Waktu' },
  { k: 'nama', t: 'Nama' },
  { k: 'nomor', t: 'Nomor WhatsApp' },
  { k: 'kategori', t: 'Kategori Menu' },
  { k: 'subkategori', t: 'Submenu / Jenis' },
  { k: 'status', t: 'Status Kehadiran / Izin' },
  { k: 'kegiatan', t: 'Kegiatan' },
  { k: 'ringkasan', t: 'Ringkasan Data Terisi' },
];

function overviewMap(e) {
  const f = e.fields || {};
  const parts = Object.keys(f)
    .filter(k => k !== 'lainnya')
    .map(k => `${k}: ${val(f, k)}`)
    .filter(s => !/:\s*$/.test(s));
  const ringkasan = parts.join(' | ').slice(0, 160);
  return {
    waktu: fmtTime(e.ts),
    nama: val(e, 'name'),
    nomor: val(e, 'nomor'),
    kategori: val(e, 'kategori'),
    subkategori: val(e, 'subkategori'),
    status: val(e, 'status'),
    kegiatan: val(e, 'kegiatan'),
    ringkasan,
  };
}

function byKey(key) { return CATEGORIES.find(c => c.key === key) || null; }

module.exports = { CATEGORIES, OVERVIEW_COLUMNS, overviewMap, byKey, fmtTime };
