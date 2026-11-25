// =====================================================================
// Mesin percakapan (state machine) — FLOW NARAHUBUNG DPD PDI PERJUANGAN
// DKI JAKARTA. Template diambil dari database (bisa diedit live dashboard).
// Perintah global: 0 = Menu Utama, 9 = Menu Sebelumnya, # = Akhiri.
// Data formulir yang dikirim user disimpan TERSTRUKTUR ke tabel
// form_entries (sumber tab Laporan & ekspor Excel per sheet menu); teks
// chat mentah hanya tersimpan di tabel messages (Log Pesan operasional).
// Percakapan yang idle 2 menit ditutup otomatis oleh scheduler.
// =====================================================================
const T = require('./templates');
const Store = require('./templateStore');
const db = require('./db');
const { parseForm, nomorFromJid } = require('./forms');

function g(name, fallback) { return Store.get(name) || fallback || ''; }
const hint = () => g('HINT', T.HINT);
const withHint = (text) => (text ? `${text}\n\n${hint()}` : text);

// ---- Keyword mapping (user boleh ketik angka ATAU kata kunci) ----
const MAIN_KEYWORDS = {
  1: ['struktur', 'partai'],
  2: ['badan', 'sayap'],
  3: ['perizinan', 'izin', 'kegiatan'],
  4: ['aspirasi', 'laporan'],
  5: ['pengiriman', 'kirim', 'barang', 'dokumen'],
  6: ['informasi', 'info', 'alamat', 'medsos', 'media sosial', 'kta', 'kontak'],
};
const STRUKTUR_KEYWORDS = { 1: ['dpd'], 2: ['dpc'], 3: ['pac'] };
const STRUKTUR_NAMES = ['DPD', 'DPC', 'PAC'];
const BADAN_KEYWORDS = { 1: ['bspn'], 2: ['bpek'], 3: ['bbhar'], 4: ['baguna'], 5: ['bamusi'], 6: ['bmi'], 7: ['tmp'] };
const BADAN_NAMES = ['BSPN', 'BPEK', 'BBHAR', 'BAGUNA', 'BAMUSI', 'BMI', 'TMP'];
const IZIN_JENIS_KEYWORDS = { 1: ['kehadiran', 'hadir', 'presensi'], 2: ['peminjaman', 'pinjam'] };
const IZIN_TARGET_KEYWORDS = { 1: ['dpd'], 2: ['dpc'], 3: ['pac'], 4: ['badan', 'sayap'] };
const PEMINJAMAN_KEYWORDS = { 1: ['barang', 'aset'], 2: ['ruangan', 'ruang'] };
const ASPIRASI_KEYWORDS = { 1: ['laporan partai', 'laporan'], 2: ['kepartaian'], 3: ['kader'] };
const INFORMASI_KEYWORDS = { 1: ['kantor dpd', 'alamat kantor', 'alamat'], 2: ['dpc'], 3: ['media', 'sosial', 'instagram', 'website'], 4: ['kta'], 5: ['agenda', 'kalender'] };
const DPC_KEYWORDS = { 1: ['pusat'], 2: ['timur'], 3: ['selatan'], 4: ['barat'], 5: ['utara'], 6: ['seribu'] };
const DPC_NAMES = ['Jakarta Pusat', 'Jakarta Timur', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Utara', 'Kepulauan Seribu'];
const KONFIRMASI_KEYWORDS = { 1: ['tidak hadir', 'tidak'], 2: ['izin sakit', 'sakit', 'izin'] };

// Daftar kegiatan per target + keyword numerik/teks.
const ACT_DPD = ['Piket Harian DPD', 'Rapat Pleno', 'Rapat gabungan', 'Agenda Eksternal', 'Kegiatan Partai'];
const ACT_LAIN = ['Rapat gabungan', 'Agenda eksternal', 'Kegiatan Partai'];
const ACT_BADAN = ['Kegiatan Badan/Sayap', 'Rapat gabungan', 'Kegiatan Partai'];
const ACT_DPD_KEY = { 1: ['piket'], 2: ['pleno'], 3: ['gabungan'], 4: ['eksternal', 'agenda'], 5: ['partai'] };
const ACT_LAIN_KEY = { 1: ['gabungan'], 2: ['eksternal', 'agenda'], 3: ['partai'] };
const ACT_BADAN_KEY = { 1: ['badan', 'sayap'], 2: ['gabungan'], 3: ['partai'] };

function pick(text, map, max) {
  const t = (text || '').trim().toLowerCase();
  if (/^\d+$/.test(t)) { const n = parseInt(t, 10); return (n >= 1 && n <= max) ? n : null; }
  for (let n = 1; n <= max; n++) {
    const kws = map[n] || [];
    if (kws.some(k => t.includes(k))) return n;
  }
  return null;
}

function out(replies, opts = {}) {
  return {
    replies,
    stage: opts.stage,
    menuChoice: opts.menuChoice || null,
    formData: opts.formData || null,
    closed: !!opts.closed,
  };
}

// ---- Catat satu entri data terstruktur untuk tabel Laporan / Excel ----
function record(jid, name, entry) {
  db.insertFormEntry({
    jid,
    name: name || null,
    nomor: nomorFromJid(jid),
    kategori: entry.kategori,
    subkategori: entry.subkategori || null,
    status: entry.status || null,
    kegiatan: entry.kegiatan || null,
    fields: entry.fields || {},
    sourceStage: entry.sourceStage || null,
  });
}

// Render ulang prompt sebuah stage untuk perintah "9" (menu sebelumnya)
function renderStage(stage) {
  switch (stage) {
    case 'struktur_menu': return withHint(g('STRUKTUR_MENU', T.STRUKTUR_MENU));
    case 'badan_menu': return withHint(g('BADAN_MENU', T.BADAN_MENU));
    case 'perizinan_menu': return withHint(g('PERIZINAN_MENU', T.PERIZINAN_MENU));
    case 'aspirasi_menu': return withHint(g('ASPIRASI_MENU', T.ASPIRASI_MENU));
    case 'informasi_menu': return withHint(g('INFORMASI_MENU', T.INFORMASI_MENU));
    case 'dpc_menu': return withHint(g('DPC_MENU', T.DPC_MENU));
    case 'izin_target_menu': return withHint(g('IZIN_TARGET_MENU', T.IZIN_TARGET_MENU));
    case 'peminjaman_menu': return withHint(g('PEMINJAMAN_MENU', T.PEMINJAMAN_MENU));
    case 'badan_pilih': return withHint(g('BADAN_MENU', T.BADAN_MENU));
    case 'form_izin_dpd': return g('FORM_IZIN_DPD', T.FORM_IZIN_DPD);
    case 'form_izin_lain': return g('FORM_IZIN_LAIN', T.FORM_IZIN_LAIN);
    case 'form_izin_badan': return g('FORM_IZIN_BADAN', T.FORM_IZIN_BADAN);
    case 'activity_dpd': return withHint(g('ACTIVITY_DPD', T.ACTIVITY_DPD));
    case 'activity_lain': return withHint(g('ACTIVITY_LAIN', T.ACTIVITY_LAIN));
    case 'activity_badan': return withHint(g('ACTIVITY_BADAN', T.ACTIVITY_BADAN));
    case 'konfirmasi': return withHint(g('KONFIRMASI_IZIN', T.KONFIRMASI_IZIN));
    case 'form_keterangan': return g('FORM_KETERANGAN', T.FORM_KETERANGAN);
    default: return withHint(g('WELCOME', T.WELCOME));
  }
}

function handle(jid, name, rawText) {
  const trimmed = (rawText || '').trim();
  const lower = trimmed.toLowerCase();
  let state = db.getState(jid) || { stage: 'new', data: {} };
  if (state.stage === 'closed') state = { stage: 'new', data: {} };
  let data = state.data || {};
  const stage = state.stage || 'new';

  // ---- Perintah # : akhiri percakapan ----
  if (trimmed === '#') {
    db.setState(jid, name, { stage: 'closed', data: { ...data, endedAt: Date.now(), reason: 'user-#' } });
    return out([g('CLOSING_END', T.CLOSING_END)], { stage: 'closed', menuChoice: '# (Akhiri Percakapan)', closed: true });
  }
  // ---- Perintah 0 : kembali ke menu utama ----
  if (trimmed === '0' || lower === 'menu' || lower === 'menu utama') {
    db.setState(jid, name, { stage: 'main', data: {} });
    return out([withHint(g('WELCOME', T.WELCOME))], { stage: 'main', menuChoice: '0 (Menu Utama)' });
  }
  // ---- Perintah 9 : menu sebelumnya ----
  if (trimmed === '9') {
    const prev = data.prev;
    if (!prev || prev === 'main' || prev === 'new' || prev === 'closed') {
      db.setState(jid, name, { stage: 'main', data: {} });
      return out([withHint(g('WELCOME', T.WELCOME))], { stage: 'main', menuChoice: '9 (Menu Utama)' });
    }
    data.prev = 'main';
    db.setState(jid, name, { stage: prev, data });
    return out([renderStage(prev)], { stage: prev, menuChoice: '9 (Menu Sebelumnya)' });
  }
  // ---- Aturan custom (keyword -> balasan tambahan) dari dashboard ----
  const custom = Store.matchCustom(lower);
  if (custom) {
    db.setState(jid, name, state);
    return out([custom], { stage });
  }

  const reject = () => {
    db.setState(jid, name, state);
    return out([g('POLITE_REJECT', T.POLITE_REJECT)], { stage });
  };

  switch (stage) {
    case 'new':
    case 'main': {
      const c = pick(trimmed, MAIN_KEYWORDS, 6);
      if (!c) return reject();
      const label = T.MAIN_MENU_LABELS[c];
      data.prev = 'main';
      if (c === 1) { db.setState(jid, name, { stage: 'struktur_menu', data }); return out([withHint(g('STRUKTUR_MENU', T.STRUKTUR_MENU))], { stage: 'struktur_menu', menuChoice: label }); }
      if (c === 2) { db.setState(jid, name, { stage: 'badan_menu', data }); return out([withHint(g('BADAN_MENU', T.BADAN_MENU))], { stage: 'badan_menu', menuChoice: label }); }
      if (c === 3) { db.setState(jid, name, { stage: 'perizinan_menu', data }); return out([withHint(g('PERIZINAN_MENU', T.PERIZINAN_MENU))], { stage: 'perizinan_menu', menuChoice: label }); }
      if (c === 4) { db.setState(jid, name, { stage: 'aspirasi_menu', data }); return out([withHint(g('ASPIRASI_MENU', T.ASPIRASI_MENU))], { stage: 'aspirasi_menu', menuChoice: label }); }
      if (c === 5) { db.setState(jid, name, { stage: 'form_pengiriman', data }); return out([g('FORM_PENGIRIMAN', T.FORM_PENGIRIMAN)], { stage: 'form_pengiriman', menuChoice: label }); }
      db.setState(jid, name, { stage: 'informasi_menu', data });
      return out([withHint(g('INFORMASI_MENU', T.INFORMASI_MENU))], { stage: 'informasi_menu', menuChoice: label });
    }

    // ---- Menu 1: Struktur Partai (DPD / DPC / PAC) ----
    case 'struktur_menu': {
      const c = pick(trimmed, STRUKTUR_KEYWORDS, 3);
      if (!c) return reject();
      const nama = STRUKTUR_NAMES[c - 1];
      record(jid, name, {
        kategori: 'Struktur Partai', subkategori: nama,
        fields: {}, sourceStage: 'struktur_menu',
      });
      db.setState(jid, name, { stage: 'main', data: { prev: 'main' } });
      return out([withHint(g('STRUKTUR_RESULT', T.STRUKTUR_RESULT))], {
        stage: 'main', menuChoice: 'Struktur Partai — ' + nama,
        formData: { kategori: 'Struktur Partai', subkategori: nama },
      });
    }

    // ---- Menu 2: Badan/Sayap Partai ----
    case 'badan_menu': {
      const c = pick(trimmed, BADAN_KEYWORDS, 7);
      if (!c) return reject();
      const nama = BADAN_NAMES[c - 1];
      record(jid, name, {
        kategori: 'Badan/Sayap Partai', subkategori: nama,
        fields: {}, sourceStage: 'badan_menu',
      });
      db.setState(jid, name, { stage: 'main', data: { prev: 'main' } });
      return out([withHint(g('BADAN_RESULT', T.BADAN_RESULT))], {
        stage: 'main', menuChoice: 'Badan/Sayap Partai — ' + nama,
        formData: { kategori: 'Badan/Sayap Partai', subkategori: nama },
      });
    }

    // ---- Menu 3: Perizinan -> Kehadiran / Peminjaman ----
    case 'perizinan_menu': {
      const c = pick(trimmed, IZIN_JENIS_KEYWORDS, 2);
      if (!c) return reject();
      data.prev = 'perizinan_menu';
      if (c === 1) { db.setState(jid, name, { stage: 'izin_target_menu', data }); return out([withHint(g('IZIN_TARGET_MENU', T.IZIN_TARGET_MENU))], { stage: 'izin_target_menu', menuChoice: 'Perizinan — Kehadiran' }); }
      db.setState(jid, name, { stage: 'peminjaman_menu', data });
      return out([withHint(g('PEMINJAMAN_MENU', T.PEMINJAMAN_MENU))], { stage: 'peminjaman_menu', menuChoice: 'Perizinan — Peminjaman' });
    }

    case 'izin_target_menu': {
      const c = pick(trimmed, IZIN_TARGET_KEYWORDS, 4);
      if (!c) return reject();
      data.prev = 'izin_target_menu';
      data.target = c === 1 ? 'DPD' : c === 2 ? 'DPC' : c === 3 ? 'PAC' : 'Badan/Sayap Partai';
      data.fields = data.fields || {};
      data.fields.target = data.target;
      if (c === 1) { db.setState(jid, name, { stage: 'form_izin_dpd', data }); return out([g('FORM_IZIN_DPD', T.FORM_IZIN_DPD)], { stage: 'form_izin_dpd', menuChoice: 'Kehadiran — DPD' }); }
      if (c === 4) { db.setState(jid, name, { stage: 'badan_pilih', data }); return out([withHint(g('BADAN_MENU', T.BADAN_MENU))], { stage: 'badan_pilih', menuChoice: 'Kehadiran — Badan/Sayap' }); }
      db.setState(jid, name, { stage: 'form_izin_lain', data });
      return out([g('FORM_IZIN_LAIN', T.FORM_IZIN_LAIN)], { stage: 'form_izin_lain', menuChoice: 'Kehadiran — ' + data.target });
    }

    case 'badan_pilih': {
      const c = pick(trimmed, BADAN_KEYWORDS, 7);
      if (!c) return reject();
      data.badan = BADAN_NAMES[c - 1];
      data.fields = data.fields || {};
      data.fields.badan = data.badan;
      data.prev = 'izin_target_menu';
      db.setState(jid, name, { stage: 'form_izin_badan', data });
      return out([g('FORM_IZIN_BADAN', T.FORM_IZIN_BADAN)], { stage: 'form_izin_badan', menuChoice: 'Kehadiran — Badan/Sayap — ' + data.badan });
    }

    // ---- Form Kehadiran: isi data diri, lalu pilih kegiatan ----
    case 'form_izin_dpd': {
      data.fields = Object.assign({}, data.fields, parseForm(trimmed, 'izin_dpd'));
      data.prev = 'izin_target_menu';
      db.setState(jid, name, { stage: 'activity_dpd', data });
      return out([withHint(g('ACTIVITY_DPD', T.ACTIVITY_DPD))], { stage: 'activity_dpd', formData: { formulir: 'Kehadiran DPD', fields: data.fields } });
    }
    case 'form_izin_lain': {
      data.fields = Object.assign({}, data.fields, parseForm(trimmed, 'izin_lain'));
      data.prev = 'izin_target_menu';
      db.setState(jid, name, { stage: 'activity_lain', data });
      return out([withHint(g('ACTIVITY_LAIN', T.ACTIVITY_LAIN))], { stage: 'activity_lain', formData: { formulir: 'Kehadiran ' + data.target, fields: data.fields } });
    }
    case 'form_izin_badan': {
      data.fields = Object.assign({}, data.fields, parseForm(trimmed, 'izin_badan'));
      data.prev = 'badan_pilih';
      db.setState(jid, name, { stage: 'activity_badan', data });
      return out([withHint(g('ACTIVITY_BADAN', T.ACTIVITY_BADAN))], { stage: 'activity_badan', formData: { formulir: 'Kehadiran Badan/Sayap ' + data.badan, fields: data.fields } });
    }

    case 'activity_dpd': {
      const c = pick(trimmed, ACT_DPD_KEY, ACT_DPD.length);
      if (!c) return reject();
      data.kegiatan = ACT_DPD[c - 1];
      data.prev = 'form_izin_dpd';
      db.setState(jid, name, { stage: 'konfirmasi', data });
      return out([withHint(g('KONFIRMASI_IZIN', T.KONFIRMASI_IZIN))], { stage: 'konfirmasi', menuChoice: 'Kegiatan DPD: ' + data.kegiatan });
    }
    case 'activity_lain': {
      const c = pick(trimmed, ACT_LAIN_KEY, ACT_LAIN.length);
      if (!c) return reject();
      data.kegiatan = ACT_LAIN[c - 1];
      data.prev = 'form_izin_lain';
      db.setState(jid, name, { stage: 'konfirmasi', data });
      return out([withHint(g('KONFIRMASI_IZIN', T.KONFIRMASI_IZIN))], { stage: 'konfirmasi', menuChoice: 'Kegiatan ' + data.target + ': ' + data.kegiatan });
    }
    case 'activity_badan': {
      const c = pick(trimmed, ACT_BADAN_KEY, ACT_BADAN.length);
      if (!c) return reject();
      data.kegiatan = ACT_BADAN[c - 1];
      data.prev = 'form_izin_badan';
      db.setState(jid, name, { stage: 'konfirmasi', data });
      return out([withHint(g('KONFIRMASI_IZIN', T.KONFIRMASI_IZIN))], { stage: 'konfirmasi', menuChoice: 'Kegiatan Badan: ' + data.kegiatan });
    }

    case 'konfirmasi': {
      const c = pick(trimmed, KONFIRMASI_KEYWORDS, 2);
      if (!c) return reject();
      data.status = c === 1 ? 'Tidak Hadir' : 'Izin Sakit';
      data.prev = stage;
      db.setState(jid, name, { stage: 'form_keterangan', data });
      return out([g('FORM_KETERANGAN', T.FORM_KETERANGAN)], { stage: 'form_keterangan', menuChoice: 'Konfirmasi: ' + data.status });
    }
    case 'form_keterangan': {
      data.fields.keterangan = trimmed;
      const subkategori = data.target === 'DPD'
        ? 'Kehadiran — DPD'
        : data.target === 'Badan/Sayap Partai'
          ? 'Kehadiran — Badan/Sayap — ' + (data.badan || '')
          : 'Kehadiran — ' + data.target;
      record(jid, name, {
        kategori: 'Perizinan Kegiatan',
        subkategori,
        status: data.status,
        kegiatan: data.kegiatan,
        fields: data.fields,
        sourceStage: 'form_keterangan',
      });
      db.setState(jid, name, { stage: 'closed', data: { ...data, endedAt: Date.now(), reason: 'form-selesai' } });
      return out([g('CLOSING_KONFIRMASI', T.CLOSING_KONFIRMASI)], {
        stage: 'closed', closed: true,
        formData: { kategori: 'Perizinan Kegiatan', subkategori, status: data.status, kegiatan: data.kegiatan, fields: data.fields },
      });
    }

    // ---- Perizinan Peminjaman ----
    case 'peminjaman_menu': {
      const c = pick(trimmed, PEMINJAMAN_KEYWORDS, 2);
      if (!c) return reject();
      data.prev = 'peminjaman_menu';
      if (c === 1) { db.setState(jid, name, { stage: 'form_peminjaman_aset', data }); return out([g('FORM_PEMINJAMAN_ASET', T.FORM_PEMINJAMAN_ASET)], { stage: 'form_peminjaman_aset', menuChoice: 'Perizinan — Peminjaman Barang/Aset' }); }
      db.setState(jid, name, { stage: 'form_peminjaman_ruangan', data });
      return out([g('FORM_PEMINJAMAN_RUANGAN', T.FORM_PEMINJAMAN_RUANGAN)], { stage: 'form_peminjaman_ruangan', menuChoice: 'Perizinan — Peminjaman Ruangan' });
    }
    case 'form_peminjaman_aset': {
      const fields = parseForm(trimmed, 'pinjam_aset');
      record(jid, name, {
        kategori: 'Perizinan Kegiatan',
        subkategori: 'Peminjaman Barang/Aset',
        fields, sourceStage: 'form_peminjaman_aset',
      });
      db.setState(jid, name, { stage: 'closed', data: { ...data, endedAt: Date.now(), reason: 'form-selesai' } });
      return out([g('CLOSING_PEMINJAMAN', T.CLOSING_PEMINJAMAN)], {
        stage: 'closed', closed: true,
        formData: { kategori: 'Perizinan Kegiatan', subkategori: 'Peminjaman Barang/Aset', fields },
      });
    }
    case 'form_peminjaman_ruangan': {
      const fields = parseForm(trimmed, 'pinjam_ruangan');
      record(jid, name, {
        kategori: 'Perizinan Kegiatan',
        subkategori: 'Peminjaman Ruangan',
        fields, sourceStage: 'form_peminjaman_ruangan',
      });
      db.setState(jid, name, { stage: 'closed', data: { ...data, endedAt: Date.now(), reason: 'form-selesai' } });
      return out([g('CLOSING_PEMINJAMAN', T.CLOSING_PEMINJAMAN)], {
        stage: 'closed', closed: true,
        formData: { kategori: 'Perizinan Kegiatan', subkategori: 'Peminjaman Ruangan', fields },
      });
    }

    // ---- Menu 4: Aspirasi ----
    case 'aspirasi_menu': {
      const c = pick(trimmed, ASPIRASI_KEYWORDS, 3);
      if (!c) return reject();
      data.prev = 'aspirasi_menu';
      data.sub = c;
      if (c === 3) { db.setState(jid, name, { stage: 'form_aspirasi_kader', data }); return out([g('FORM_ASPIRASI_KADER', T.FORM_ASPIRASI_KADER)], { stage: 'form_aspirasi_kader', menuChoice: 'Aspirasi — Kader' }); }
      db.setState(jid, name, { stage: 'form_aspirasi_umum', data });
      return out([g('FORM_ASPIRASI_UMUM', T.FORM_ASPIRASI_UMUM)], { stage: 'form_aspirasi_umum', menuChoice: 'Aspirasi — ' + ['Laporan Partai', 'Kepartaian'][c - 1] });
    }
    case 'form_aspirasi_umum': {
      const fields = parseForm(trimmed, 'aspirasi_umum');
      const subkategori = data.sub === 2 ? 'Aspirasi Kepartaian' : 'Laporan Partai';
      record(jid, name, { kategori: 'Aspirasi', subkategori, fields, sourceStage: 'form_aspirasi_umum' });
      db.setState(jid, name, { stage: 'closed', data: { ...data, endedAt: Date.now(), reason: 'form-selesai' } });
      return out([g('CLOSING_ASPIRASI', T.CLOSING_ASPIRASI)], {
        stage: 'closed', closed: true,
        formData: { kategori: 'Aspirasi', subkategori, fields },
      });
    }
    case 'form_aspirasi_kader': {
      const fields = parseForm(trimmed, 'aspirasi_kader');
      record(jid, name, { kategori: 'Aspirasi', subkategori: 'Aspirasi Kader', fields, sourceStage: 'form_aspirasi_kader' });
      db.setState(jid, name, { stage: 'closed', data: { ...data, endedAt: Date.now(), reason: 'form-selesai' } });
      return out([g('CLOSING_ASPIRASI', T.CLOSING_ASPIRASI)], {
        stage: 'closed', closed: true,
        formData: { kategori: 'Aspirasi', subkategori: 'Aspirasi Kader', fields },
      });
    }

    // ---- Menu 5: Pengiriman ----
    case 'form_pengiriman': {
      const fields = parseForm(trimmed, 'pengiriman');
      record(jid, name, { kategori: 'Pengiriman', subkategori: 'Pengiriman Kiriman', fields, sourceStage: 'form_pengiriman' });
      db.setState(jid, name, { stage: 'closed', data: { ...data, endedAt: Date.now(), reason: 'form-selesai' } });
      return out([g('CLOSING_PENGIRIMAN', T.CLOSING_PENGIRIMAN)], {
        stage: 'closed', closed: true,
        formData: { kategori: 'Pengiriman', subkategori: 'Pengiriman Kiriman', fields },
      });
    }

    // ---- Menu 6: Informasi ----
    case 'informasi_menu': {
      const c = pick(trimmed, INFORMASI_KEYWORDS, 5);
      if (!c) return reject();
      data.prev = 'informasi_menu';
      const infoLabel = ['Alamat Kantor DPD', 'Alamat dan Kontak DPC', 'Media Sosial DPD', 'Pembuatan KTA PDI PERJUANGAN', 'Agenda Kegiatan Partai'][c - 1];
      if (c === 2) { db.setState(jid, name, { stage: 'dpc_menu', data }); return out([withHint(g('DPC_MENU', T.DPC_MENU))], { stage: 'dpc_menu', menuChoice: 'Informasi — ' + infoLabel }); }
      record(jid, name, { kategori: 'Informasi', subkategori: infoLabel, fields: {}, sourceStage: 'informasi_menu' });
      let text;
      if (c === 1) text = g('INFO_DPD', T.INFO_DPD);
      else if (c === 3) text = g('INFO_MEDSOS', T.INFO_MEDSOS);
      else if (c === 4) text = g('INFO_KTA', T.INFO_KTA);
      else text = g('INFO_AGENDA', T.INFO_AGENDA);
      db.setState(jid, name, { stage: 'informasi_menu', data });
      return out([withHint(text)], {
        stage: 'informasi_menu', menuChoice: 'Informasi — ' + infoLabel,
        formData: { kategori: 'Informasi', subkategori: infoLabel },
      });
    }

    case 'dpc_menu': {
      const c = pick(trimmed, DPC_KEYWORDS, 6);
      if (!c) return reject();
      const wilayah = DPC_NAMES[c - 1];
      record(jid, name, {
        kategori: 'Informasi',
        subkategori: 'Alamat dan Kontak DPC — ' + wilayah,
        fields: { wilayah }, sourceStage: 'dpc_menu',
      });
      const row = Store.infoDpcText(c) || T.infoDpcText(c);
      db.setState(jid, name, { stage: 'informasi_menu', data });
      return out([withHint(row)], {
        stage: 'informasi_menu', menuChoice: 'Informasi DPC — ' + wilayah,
        formData: { kategori: 'Informasi', subkategori: 'Alamat dan Kontak DPC — ' + wilayah, fields: { wilayah } },
      });
    }

    default:
      db.setState(jid, name, { stage: 'main', data: {} });
      return out([withHint(g('WELCOME', T.WELCOME))], { stage: 'main' });
  }
}

module.exports = { handle };
