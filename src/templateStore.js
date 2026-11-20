// =====================================================================
// Template store: template balasan disimpan di DATABASE (bisa diedit
// dari dashboard secara live, tanpa restart). Seed awal diambil dari
// templates.js (default). Custom rules = keyword -> balasan otomatis.
// =====================================================================
const db = require('./db');
const T = require('./templates');

let cache = { builtin: {}, custom: [] };

// Daftar template bawaan (seed) — diambil dari templates.js
function builtinSeed() {
  const list = [
    ['WELCOME', 'Pesan Sambutan / Menu Utama', T.WELCOME],
    ['STRUKTUR_MENU', 'Menu Struktur Partai', T.STRUKTUR_MENU],
    ['BADAN_MENU', 'Menu Badan/Sayap Partai', T.BADAN_MENU],
    ['PENYAMPAIAN_MENU', 'Menu Penyampaian', T.PENYAMPAIAN_MENU],
    ['INFORMASI_MENU', 'Menu Informasi', T.INFORMASI_MENU],
    ['DPC_MENU', 'Menu Pilihan DPC', T.DPC_MENU],
    ['FORM_NAMA_JABATAN', 'Form Nama & Jabatan', T.FORM_NAMA_JABATAN],
    ['FORM_PENYAMPAIAN_PARTAI', 'Form Penyampaian (Partai)', T.FORM_PENYAMPAIAN_PARTAI],
    ['FORM_PENYAMPAIAN_WARGA', 'Form Penyampaian (Warga)', T.FORM_PENYAMPAIAN_WARGA],
    ['FORM_PERIZINAN', 'Form Perizinan Kegiatan', T.FORM_PERIZINAN],
    ['FORM_PENGIRIMAN', 'Form Pengiriman', T.FORM_PENGIRIMAN],
    ['ACTIVITY_DPD', 'Pilihan Kegiatan (DPD)', T.ACTIVITY_DPD],
    ['ACTIVITY_STRUKTUR_LAIN', 'Pilihan Kegiatan (DPC/PAC/Ranting)', T.ACTIVITY_STRUKTUR_LAIN],
    ['ACTIVITY_BADAN', 'Pilihan Kegiatan (Badan/Sayap)', T.ACTIVITY_BADAN],
    ['KONFIRMASI', 'Menu Konfirmasi Kehadiran', T.KONFIRMASI],
    ['THANKS_KEHADIRAN', 'Penutup (Konfirmasi Kehadiran)', T.THANKS_KEHADIRAN],
    ['THANKS_PENYAMPAIAN', 'Penutup (Penyampaian Partai)', T.THANKS_PENYAMPAIAN],
    ['THANKS_PENYAMPAIAN_WARGA', 'Penutup (Aspirasi Warga)', T.THANKS_PENYAMPAIAN_WARGA],
    ['THANKS_PERIZINAN', 'Penutup (Perizinan)', T.THANKS_PERIZINAN],
    ['THANKS_PENGIRIMAN', 'Penutup (Pengiriman)', T.THANKS_PENGIRIMAN],
    ['THANKS_INFO', 'Penutup (Informasi)', T.THANKS_INFO],
    ['INFO_ALAMAT_DPD', 'Info Alamat Kantor DPD', T.INFO_ALAMAT_DPD],
    ['INFO_MEDIA_SOSIAL', 'Info Media Sosial', T.INFO_MEDIA_SOSIAL],
    ['INFO_KTA', 'Info Pembuatan KTA', T.INFO_KTA],
  ];
  for (let i = 1; i <= 6; i++) {
    const d = T.infoDpcText(i);
    list.push([`INFO_DPC_${i}`, `Info Alamat DPC (${['Jakarta Pusat','Jakarta Timur','Jakarta Selatan','Jakarta Barat','Jakarta Utara','Kepulauan Seribu'][i-1]})`, d]);
  }
  return list;
}

function seedIfEmpty() {
  if (db.countTemplates() > 0) return;
  for (const [name, label, text] of builtinSeed()) {
    db.insertTemplate({ type: 'builtin', name, keyword: null, label, text });
  }
  console.log('[tpl] Seed template bawaan selesai.');
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

// Ambil teks template bawaan berdasarkan nama key
function get(name) {
  return cache.builtin[name] || '';
}

// Cocokkan pesan dengan custom keyword rules (prioritas pertama).
// Mengembalikan teks balasan jika cocok, atau null.
function matchCustom(text) {
  const t = (text || '').toLowerCase().trim();
  if (!t) return null;
  for (const rule of cache.custom) {
    if (!rule.keyword) continue;
    // cocokkan: pesan mengandung keyword ATAU persis sama
    if (t === rule.keyword || t.includes(rule.keyword)) return rule.text;
  }
  return null;
}

// Info DPC per pilihan (1-6) — diambil dari template DB
function infoDpcText(choice) {
  return get(`INFO_DPC_${choice}`) || null;
}

// Inisialisasi saat pertama kali di-require
reload();

module.exports = { reload, get, matchCustom, infoDpcText, seedIfEmpty };
