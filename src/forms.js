// =====================================================================
// Parser formulir NARAHUBUNG.
// User menyalin template lalu mengisi baris "Label : nilai"; modul ini
// mengubah pesan bebas menjadi objek terstruktur (fields) yang disimpan
// ke tabel form_entries dan dipakai tab Laporan + ekspor Excel per sheet.
// Tidak ada teks chat mentah yang disimpan sebagai kolom laporan.
// =====================================================================

// Spesifikasi tiap formulir: key -> daftar alias label (lowercase, bebas tanda baca).
const SPECS = {
  izin_dpd: [
    { key: 'nama', aliases: ['nama'] },
    { key: 'jabatan', aliases: ['jabatan'] },
  ],
  izin_lain: [
    { key: 'nama', aliases: ['nama'] },
    { key: 'lembaga', aliases: ['lembaga'] },
    { key: 'jabatan', aliases: ['jabatan'] },
    { key: 'wilayah', aliases: ['wilayah'] },
  ],
  izin_badan: [
    { key: 'nama', aliases: ['nama'] },
    { key: 'lembaga', aliases: ['lembaga'] },
    { key: 'jabatan', aliases: ['jabatan'] },
    { key: 'wilayah', aliases: ['wilayah'] },
  ],
  pinjam_aset: [
    { key: 'nama', aliases: ['nama'] },
    { key: 'jabatan', aliases: ['jabatan'] },
    { key: 'lembaga', aliases: ['lembaga'] },
    { key: 'wilayah', aliases: ['wilayah'] },
    { key: 'telp', aliases: ['no telp', 'no telp/wa aktif', 'telp/wa aktif', 'telp', 'no wa', 'wa aktif', 'kontak'] },
    { key: 'hari_pinjam', aliases: ['hari peminjaman', 'hari pinjam'] },
    { key: 'tgl_pinjam', aliases: ['tanggal peminjaman', 'tgl peminjaman', 'tanggal pinjam', 'tgl pinjam'] },
    { key: 'hari_kembali', aliases: ['hari kembali'] },
    { key: 'tgl_kembali', aliases: ['tanggal kembali', 'tgl kembali'] },
    { key: 'keperluan', aliases: ['untuk keperluan', 'keperluan'] },
    { key: 'barang', aliases: ['data barang/aset', 'data barang', 'barang/aset', 'barang yang dipinjam', 'barang', 'aset'] },
  ],
  // Judul seksi tanpa titik dua: baris berikutnya masuk ke key terkait.
  sections: {
    pinjam_aset: [{ re: /data barang|barang\s*\/\s*aset/i, key: 'barang' }],
  },
  pinjam_ruangan: [
    { key: 'nama', aliases: ['nama'] },
    { key: 'jabatan', aliases: ['jabatan'] },
    { key: 'lembaga', aliases: ['lembaga'] },
    { key: 'wilayah', aliases: ['wilayah'] },
    { key: 'telp', aliases: ['no telp', 'no telp/wa aktif', 'telp/wa aktif', 'telp', 'no wa', 'wa aktif', 'kontak'] },
    { key: 'keperluan', aliases: ['untuk keperluan', 'keperluan'] },
    { key: 'hari', aliases: ['hari'] },
    { key: 'tanggal', aliases: ['tanggal'] },
    { key: 'waktu', aliases: ['waktu'] },
    { key: 'ruangan', aliases: ['ruangan', 'ruang'] },
    { key: 'peserta', aliases: ['jumlah peserta', 'peserta'] },
  ],
  aspirasi_umum: [
    { key: 'nama', aliases: ['nama'] },
    { key: 'lembaga_wilayah', aliases: ['lembaga/wilayah', 'lembaga wilayah', 'lembaga', 'wilayah'] },
    { key: 'jabatan', aliases: ['jabatan'] },
    { key: 'isi', aliases: ['yang disampaikan', 'disampaikan', 'isi aspirasi', 'isi laporan', 'aspirasi', 'laporan', 'isi'] },
  ],
  aspirasi_kader: [
    { key: 'nama', aliases: ['nama'] },
    { key: 'kta', aliases: ['no kta', 'nomor kta', 'kta'] },
    { key: 'telp', aliases: ['no telp', 'no telp/wa aktif', 'telp/wa aktif', 'telp', 'no wa', 'wa aktif', 'kontak'] },
    { key: 'wilayah', aliases: ['wilayah'] },
    { key: 'alamat', aliases: ['alamat'] },
    { key: 'isi', aliases: ['yang disampaikan', 'disampaikan', 'isi aspirasi', 'aspirasi', 'isi'] },
  ],
  pengiriman: [
    { key: 'nama', aliases: ['nama lengkap', 'nama'] },
    { key: 'lembaga', aliases: ['lembaga'] },
    { key: 'jabatan', aliases: ['jabatan'] },
    { key: 'instansi', aliases: ['nama instansi/perusahaan', 'instansi/perusahaan', 'nama instansi', 'instansi', 'perusahaan'] },
    { key: 'telp', aliases: ['no telp', 'no telp/wa aktif', 'telp/wa aktif', 'telp', 'no wa', 'wa aktif', 'kontak'] },
    { key: 'jenis', aliases: ['barang/dokumen', 'jenis kiriman', 'jenis barang', 'barang', 'dokumen', 'jenis'] },
    { key: 'jumlah', aliases: ['jumlah/banyaknya', 'banyaknya', 'jumlah'] },
    { key: 'kurir', aliases: ['kurir', 'jasa kirim', 'ekspedisi'] },
    { key: 'tujuan', aliases: ['ditujukan kepada', 'ditujukan ke', 'ditujukan', 'tujuan penerima', 'tujuan'] },
    { key: 'hari', aliases: ['hari pengiriman', 'hari'] },
    { key: 'tanggal', aliases: ['tanggal pengiriman', 'tanggal'] },
  ],
};

function normalizeLabel(s) {
  return String(s || '').toLowerCase().replace(/[*_#\-/():：.()\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Parse pesan formulir -> { key: nilai }. Baris tanpa label dikenali masuk
// ke "lainnya" agar tidak ada data yang hilang, namun kolom laporan tetap
// berisi field resmi.
function parseForm(text, specKey) {
  const spec = SPECS[specKey] || [];
  const sections = (SPECS.sections && SPECS.sections[specKey]) || [];
  const out = {};
  if (!text) return out;

  const aliases = [];
  for (const f of spec) for (const a of f.aliases) aliases.push({ key: f.key, alias: normalizeLabel(a) });
  aliases.sort((x, y) => y.alias.length - x.alias.length);

  // Judul seksi kapital tanpa titik dua, mis. "DATA PEMINJAM", "AGENDA PEMAKAIAN".
  const isHeader = (line) => /^[A-Z0-9 /().,\-]{4,48}$/.test(line) && /[A-Z]/.test(line);

  let current = null;
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(/^([^:：]{1,60})[:：]\s*(.*)$/);
    if (m) {
      const label = normalizeLabel(m[1]);
      const hit = aliases.find(a => label === a.alias || label.includes(a.alias));
      if (hit) {
        current = hit.key;
        const val = m[2].trim();
        if (val) out[current] = out[current] ? `${out[current]} ${val}` : val;
        else if (!out[current]) out[current] = '';
        continue;
      }
      current = null; // header seksi bercolon (DATA PENGIRIM: dll.)
      continue;
    }
    const sec = sections.find(s => s.re.test(line));
    if (sec) { current = sec.key; if (!out[current]) out[current] = ''; continue; }
    if (isHeader(line)) { current = null; continue; }
    if (current) out[current] = out[current] ? `${out[current]}\n${line}` : line;
    else (out.lainnya = out.lainnya ? `${out.lainnya}\n${line}` : line);
  }
  for (const k of Object.keys(out)) if (!String(out[k]).trim()) delete out[k];
  return out;
}

function nomorFromJid(jid) {
  return String(jid || '').replace(/@s\.whatsapp\.net$|@lid$|@g\.us$/, '');
}

module.exports = { SPECS, parseForm, nomorFromJid };
