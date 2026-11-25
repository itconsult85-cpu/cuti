// =====================================================================
// Template store: template bawaan disimpan di DATABASE (bisa diedit live
// dari dashboard, tanpa restart). Seed awal dari templates.js.
// Custom rules = keyword -> balasan otomatis (bebas ditambah admin).
// Perubahan alur bawaan di templates.js memicu reseed otomatis lewat
// SEED_VERSION; aturan custom buatan admin TIDAK dihapus.
// =====================================================================
const db = require('./db');
const T = require('./templates');

const SEED_VERSION = '2.0-narahubung';

let cache = { builtin: {}, custom: [] };

function builtinSeed() {
  const list = [
    ['WELCOME', 'Pesan Sambutan / Menu Utama', T.WELCOME],
    ['HINT', 'Jejak Perintah (0 / 9 / #)', T.HINT],
    ['STRUKTUR_MENU', 'Menu 1 — Struktur Partai (DPD/DPC/PAC)', T.STRUKTUR_MENU],
    ['BADAN_MENU', 'Menu 2 — Badan/Sayap Partai', T.BADAN_MENU],
    ['PERIZINAN_MENU', 'Menu 3 — Perizinan (Kehadiran/Peminjaman)', T.PERIZINAN_MENU],
    ['ASPIRASI_MENU', 'Menu 4 — Aspirasi', T.ASPIRASI_MENU],
    ['INFORMASI_MENU', 'Menu 6 — Informasi', T.INFORMASI_MENU],
    ['DPC_MENU', 'Menu DPC per Wilayah', T.DPC_MENU],
    ['STRUKTUR_RESULT', 'Jawaban Struktur Pengurus Tingkatan', T.STRUKTUR_RESULT],
    ['BADAN_RESULT', 'Jawaban Struktur Pengurus Badan/Sayap', T.BADAN_RESULT],
    ['IZIN_TARGET_MENU', 'Perizinan Kehadiran — Pilih Target', T.IZIN_TARGET_MENU],
    ['FORM_IZIN_DPD', 'Form Kehadiran DPD (Nama/Jabatan)', T.FORM_IZIN_DPD],
    ['FORM_IZIN_LAIN', 'Form Kehadiran DPC/PAC', T.FORM_IZIN_LAIN],
    ['FORM_IZIN_BADAN', 'Form Kehadiran Badan/Sayap', T.FORM_IZIN_BADAN],
    ['ACTIVITY_DPD', 'Kegiatan (DPD)', T.ACTIVITY_DPD],
    ['ACTIVITY_LAIN', 'Kegiatan (DPC/PAC)', T.ACTIVITY_LAIN],
    ['ACTIVITY_BADAN', 'Kegiatan (Badan/Sayap)', T.ACTIVITY_BADAN],
    ['KONFIRMASI_IZIN', 'Konfirmasi Kehadiran', T.KONFIRMASI_IZIN],
    ['FORM_KETERANGAN', 'Form Keterangan Ketidakhadiran/Izin', T.FORM_KETERANGAN],
    ['PEMINJAMAN_MENU', 'Perizinan Peminjaman — Jenis', T.PEMINJAMAN_MENU],
    ['FORM_PEMINJAMAN_ASET', 'Form Peminjaman Barang/Aset', T.FORM_PEMINJAMAN_ASET],
    ['FORM_PEMINJAMAN_RUANGAN', 'Form Peminjaman Ruangan', T.FORM_PEMINJAMAN_RUANGAN],
    ['FORM_ASPIRASI_UMUM', 'Form Laporan Partai / Aspirasi Kepartaian', T.FORM_ASPIRASI_UMUM],
    ['FORM_ASPIRASI_KADER', 'Form Aspirasi Kader', T.FORM_ASPIRASI_KADER],
    ['FORM_PENGIRIMAN', 'Menu 5 — Form Pengiriman', T.FORM_PENGIRIMAN],
    ['CLOSING_END', 'Penutup Akhir Percakapan (# / timeout)', T.CLOSING_END],
    ['CLOSING_KONFIRMASI', 'Penutup Konfirmasi Kehadiran', T.CLOSING_KONFIRMASI],
    ['CLOSING_PEMINJAMAN', 'Penutup Peminjaman', T.CLOSING_PEMINJAMAN],
    ['CLOSING_ASPIRASI', 'Penutup Laporan/Aspirasi', T.CLOSING_ASPIRASI],
    ['CLOSING_PENGIRIMAN', 'Penutup Pengiriman', T.CLOSING_PENGIRIMAN],
    ['POLITE_REJECT', 'Balasan Pesan Tidak Dikenali', T.POLITE_REJECT],
    ['INFO_DPD', 'Info Alamat Kantor DPD', T.INFO_DPD],
    ['INFO_MEDSOS', 'Info Media Sosial DPD', T.INFO_MEDSOS],
    ['INFO_KTA', 'Info Pembuatan KTA', T.INFO_KTA],
    ['INFO_AGENDA', 'Info Agenda Kegiatan Partai', T.INFO_AGENDA],
  ];
  const names = ['Jakarta Pusat', 'Jakarta Timur', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Utara', 'Kepulauan Seribu'];
  for (let i = 1; i <= 6; i++) {
    list.push([`INFO_DPC_${i}`, `Info Alamat DPC (${names[i - 1]})`, T.infoDpcText(i)]);
  }
  return list;
}

// Reseed bawaan hanya saat versi berubah; aturan custom tetap utuh.
function seedIfEmpty() {
  if (db.getSetting('seed_version') === SEED_VERSION) return;
  db.deleteBuiltinTemplates();
  for (const [name, label, text] of builtinSeed()) {
    db.insertTemplate({ type: 'builtin', name, keyword: null, label, text });
  }
  db.setSetting('seed_version', SEED_VERSION);
  console.log(`[tpl] Seed template bawaan v${SEED_VERSION} diterapkan (custom rule dipertahankan).`);
}

function reload() {
  seedIfEmpty();
  const rows = db.getAllTemplates();
  const builtin = {};
  const custom = [];
  for (const r of rows) {
    if (r.type === 'builtin') builtin[r.name] = r.text;
    else custom.push({ id: r.id, keyword: (r.keyword || '').toLowerCase(), text: r.text, label: r.label });
  }
  cache = { builtin, custom };
  console.log(`[tpl] Cache dimuat: ${Object.keys(builtin).length} builtin, ${custom.length} custom rules.`);
}

function get(name) {
  return cache.builtin[name] || '';
}

function matchCustom(text) {
  const t = (text || '').toLowerCase().trim();
  if (!t) return null;
  for (const rule of cache.custom) {
    if (!rule.keyword) continue;
    if (t === rule.keyword || t.includes(rule.keyword)) return rule.text;
  }
  return null;
}

function infoDpcText(choice) {
  return get(`INFO_DPC_${choice}`) || null;
}

reload();

module.exports = { reload, get, matchCustom, infoDpcText, seedIfEmpty, SEED_VERSION };
