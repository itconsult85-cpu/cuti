// =====================================================================
// Mesin percakapan (state machine) — FLOW NARAHUBUNG DPD PDI PERJUANGAN
// DKI JAKARTA. Template diambil dari database (bisa diedit live dashboard).
// Perintah global: 0 = Menu Utama, 9 = Menu Sebelumnya, # = Akhiri.
// Percakapan yang idle 2 menit ditutup otomatis oleh scheduler.
// =====================================================================
const T = require('./templates');
const Store = require('./templateStore');
const db = require('./db');

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
const BADAN_KEYWORDS = { 1: ['bspn'], 2: ['bpek'], 3: ['bbhar'], 4: ['baguna'], 5: ['bamusi'], 6: ['bmi'], 7: ['tmp'] };
const IZIN_JENIS_KEYWORDS = { 1: ['kehadiran', 'hadir', 'presensi'], 2: ['peminjaman', 'pinjam'] };
const IZIN_TARGET_KEYWORDS = { 1: ['dpd'], 2: ['dpc'], 3: ['pac'], 4: ['badan', 'sayap'] };
const PEMINJAMAN_KEYWORDS = { 1: ['barang', 'aset'], 2: ['ruangan', 'ruang'] };
const ASPIRASI_KEYWORDS = { 1: ['laporan partai', 'laporan'], 2: ['kepartaian'], 3: ['kader'] };
const INFORMASI_KEYWORDS = { 1: ['kantor dpd', 'alamat kantor'], 2: ['dpc'], 3: ['media', 'sosial', 'instagram', 'website'], 4: ['kta'], 5: ['agenda', 'kalender'] };
const DPC_KEYWORDS = { 1: ['pusat'], 2: ['timur'], 3: ['selatan'], 4: ['barat'], 5: ['utara'], 6: ['seribu'] };
const KONFIRMASI_KEYWORDS = { 1: ['tidak hadir', 'tidak'], 2: ['izin sakit', 'sakit'] };

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

    case 'struktur_menu': {
      const c = pick(trimmed, STRUKTUR_KEYWORDS, 3);
      if (!c) return reject();
      db.setState(jid, name, { stage: 'main', data: { prev: 'main' } });
      return out([withHint(g('STRUKTUR_RESULT', T.STRUKTUR_RESULT))], { stage: 'main', menuChoice: 'Struktur Partai — ' + ['DPD', 'DPC', 'PAC'][c - 1] });
    }

    case 'badan_menu': {
      const c = pick(trimmed, BADAN_KEYWORDS, 7);
      if (!c) return reject();
      db.setState(jid, name, { stage: 'main', data: { prev: 'main' } });
      return out([withHint(g('BADAN_RESULT', T.BADAN_RESULT))], { stage: 'main', menuChoice: 'Badan/Sayap Partai — ' + ['BSPN', 'BPEK', 'BBHAR', 'BAGUNA', 'BAMUSI', 'BMI', 'TMP'][c - 1] });
    }

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
      if (c === 1) { db.setState(jid, name, { stage: 'form_izin_dpd', data }); return out([g('FORM_IZIN_DPD', T.FORM_IZIN_DPD)], { stage: 'form_izin_dpd', menuChoice: 'Kehadiran — DPD' }); }
      if (c === 4) { db.setState(jid, name, { stage: 'badan_pilih', data }); return out([withHint(g('BADAN_MENU', T.BADAN_MENU))], { stage: 'badan_pilih', menuChoice: 'Kehadiran — Badan/Sayap' }); }
      db.setState(jid, name, { stage: 'form_izin_lain', data });
      return out([g('FORM_IZIN_LAIN', T.FORM_IZIN_LAIN)], { stage: 'form_izin_lain', menuChoice: 'Kehadiran — ' + ['DPD', 'DPC', 'PAC'][c - 1] });
    }

    case 'badan_pilih': {
      const c = pick(trimmed, BADAN_KEYWORDS, 7);
      if (!c) return reject();
      data.badan = ['BSPN', 'BPEK', 'BBHAR', 'BAGUNA', 'BAMUSI', 'BMI', 'TMP'][c - 1];
      data.prev = 'izin_target_menu';
      db.setState(jid, name, { stage: 'form_izin_badan', data });
      return out([g('FORM_IZIN_BADAN', T.FORM_IZIN_BADAN)], { stage: 'form_izin_badan', menuChoice: 'Kehadiran — Badan/Sayap — ' + data.badan });
    }

    // ---- Form kehadiran (free text diterima apa adanya) ----
    case 'form_izin_dpd': {
      data.prev = 'izin_target_menu';
      db.setState(jid, name, { stage: 'activity_dpd', data });
      return out([withHint(g('ACTIVITY_DPD', T.ACTIVITY_DPD))], { stage: 'activity_dpd', formData: { jawaban: trimmed, formulir: 'Kehadiran DPD' } });
    }
    case 'form_izin_lain': {
      data.prev = 'izin_target_menu';
      db.setState(jid, name, { stage: 'activity_lain', data });
      return out([withHint(g('ACTIVITY_LAIN', T.ACTIVITY_LAIN))], { stage: 'activity_lain', formData: { jawaban: trimmed, formulir: 'Kehadiran DPC/PAC' } });
    }
    case 'form_izin_badan': {
      data.prev = 'badan_pilih';
      db.setState(jid, name, { stage: 'activity_badan', data });
      return out([withHint(g('ACTIVITY_BADAN', T.ACTIVITY_BADAN))], { stage: 'activity_badan', formData: { jawaban: trimmed, badan: data.badan, formulir: 'Kehadiran Badan/Sayap' } });
    }

    case 'activity_dpd': {
      data.activity = trimmed;
      data.prev = 'form_izin_dpd';
      db.setState(jid, name, { stage: 'konfirmasi', data });
      return out([withHint(g('KONFIRMASI_IZIN', T.KONFIRMASI_IZIN))], { stage: 'konfirmasi', menuChoice: 'Kegiatan DPD: ' + trimmed.slice(0, 80) });
    }
    case 'activity_lain': {
      data.activity = trimmed;
      data.prev = 'form_izin_lain';
      db.setState(jid, name, { stage: 'konfirmasi', data });
      return out([withHint(g('KONFIRMASI_IZIN', T.KONFIRMASI_IZIN))], { stage: 'konfirmasi', menuChoice: 'Kegiatan DPC/PAC: ' + trimmed.slice(0, 80) });
    }
    case 'activity_badan': {
      data.activity = trimmed;
      data.prev = 'form_izin_badan';
      db.setState(jid, name, { stage: 'konfirmasi', data });
      return out([withHint(g('KONFIRMASI_IZIN', T.KONFIRMASI_IZIN))], { stage: 'konfirmasi', menuChoice: 'Kegiatan Badan: ' + trimmed.slice(0, 80) });
    }

    case 'konfirmasi': {
      const c = pick(trimmed, KONFIRMASI_KEYWORDS, 2);
      if (!c) return reject();
      data.konfirmasi = c === 1 ? 'Tidak Hadir' : 'Izin Sakit';
      data.prev = stage;
      db.setState(jid, name, { stage: 'form_keterangan', data });
      return out([g('FORM_KETERANGAN', T.FORM_KETERANGAN)], { stage: 'form_keterangan', menuChoice: 'Konfirmasi: ' + data.konfirmasi });
    }
    case 'form_keterangan': {
      data.keterangan = trimmed;
      db.setState(jid, name, { stage: 'closed', data: { ...data, endedAt: Date.now(), reason: 'form-selesai' } });
      return out([g('CLOSING_KONFIRMASI', T.CLOSING_KONFIRMASI)], { stage: 'closed', formData: { keterangan: trimmed, konfirmasi: data.konfirmasi, kegiatan: data.activity }, closed: true });
    }

    case 'peminjaman_menu': {
      const c = pick(trimmed, PEMINJAMAN_KEYWORDS, 2);
      if (!c) return reject();
      data.prev = 'peminjaman_menu';
      if (c === 1) { db.setState(jid, name, { stage: 'form_peminjaman_aset', data }); return out([g('FORM_PEMINJAMAN_ASET', T.FORM_PEMINJAMAN_ASET)], { stage: 'form_peminjaman_aset', menuChoice: 'Perizinan — Peminjaman Barang/Aset' }); }
      db.setState(jid, name, { stage: 'form_peminjaman_ruangan', data });
      return out([g('FORM_PEMINJAMAN_RUANGAN', T.FORM_PEMINJAMAN_RUANGAN)], { stage: 'form_peminjaman_ruangan', menuChoice: 'Perizinan — Peminjaman Ruangan' });
    }
    case 'form_peminjaman_aset': {
      db.setState(jid, name, { stage: 'closed', data: { ...data, endedAt: Date.now(), reason: 'form-selesai' } });
      return out([g('CLOSING_PEMINJAMAN', T.CLOSING_PEMINJAMAN)], { stage: 'closed', formData: { jawaban: trimmed, formulir: 'Peminjaman Barang/Aset' }, closed: true });
    }
    case 'form_peminjaman_ruangan': {
      db.setState(jid, name, { stage: 'closed', data: { ...data, endedAt: Date.now(), reason: 'form-selesai' } });
      return out([g('CLOSING_PEMINJAMAN', T.CLOSING_PEMINJAMAN)], { stage: 'closed', formData: { jawaban: trimmed, formulir: 'Peminjaman Ruangan' }, closed: true });
    }

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
      db.setState(jid, name, { stage: 'closed', data: { ...data, endedAt: Date.now(), reason: 'form-selesai' } });
      const formulir = data.sub === 2 ? 'Aspirasi Kepartaian' : 'Laporan Partai';
      return out([g('CLOSING_ASPIRASI', T.CLOSING_ASPIRASI)], { stage: 'closed', formData: { jawaban: trimmed, formulir }, closed: true });
    }
    case 'form_aspirasi_kader': {
      db.setState(jid, name, { stage: 'closed', data: { ...data, endedAt: Date.now(), reason: 'form-selesai' } });
      return out([g('CLOSING_ASPIRASI', T.CLOSING_ASPIRASI)], { stage: 'closed', formData: { jawaban: trimmed, formulir: 'Aspirasi Kader' }, closed: true });
    }

    case 'form_pengiriman': {
      db.setState(jid, name, { stage: 'closed', data: { ...data, endedAt: Date.now(), reason: 'form-selesai' } });
      return out([g('CLOSING_PENGIRIMAN', T.CLOSING_PENGIRIMAN)], { stage: 'closed', formData: { jawaban: trimmed, formulir: 'Pengiriman' }, closed: true });
    }

    case 'informasi_menu': {
      const c = pick(trimmed, INFORMASI_KEYWORDS, 5);
      if (!c) return reject();
      data.prev = 'informasi_menu';
      if (c === 1) { db.setState(jid, name, { stage: 'informasi_menu', data }); return out([withHint(g('INFO_DPD', T.INFO_DPD))], { stage: 'informasi_menu', menuChoice: 'Informasi — Alamat Kantor DPD' }); }
      if (c === 2) { db.setState(jid, name, { stage: 'dpc_menu', data }); return out([withHint(g('DPC_MENU', T.DPC_MENU))], { stage: 'dpc_menu', menuChoice: 'Informasi — Alamat dan Kontak DPC' }); }
      if (c === 3) { db.setState(jid, name, { stage: 'informasi_menu', data }); return out([withHint(g('INFO_MEDSOS', T.INFO_MEDSOS))], { stage: 'informasi_menu', menuChoice: 'Informasi — Media Sosial DPD' }); }
      if (c === 4) { db.setState(jid, name, { stage: 'informasi_menu', data }); return out([withHint(g('INFO_KTA', T.INFO_KTA))], { stage: 'informasi_menu', menuChoice: 'Informasi — Pembuatan KTA' }); }
      db.setState(jid, name, { stage: 'informasi_menu', data });
      return out([withHint(g('INFO_AGENDA', T.INFO_AGENDA))], { stage: 'informasi_menu', menuChoice: 'Informasi — Agenda Kegiatan Partai' });
    }

    case 'dpc_menu': {
      const c = pick(trimmed, DPC_KEYWORDS, 6);
      if (!c) return reject();
      const row = Store.infoDpcText(c) || T.infoDpcText(c);
      db.setState(jid, name, { stage: 'informasi_menu', data });
      return out([withHint(row)], { stage: 'informasi_menu', menuChoice: 'Informasi DPC — ' + ['Jakarta Pusat', 'Jakarta Timur', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Utara', 'Kepulauan Seribu'][c - 1] });
    }

    default:
      db.setState(jid, name, { stage: 'main', data: {} });
      return out([withHint(g('WELCOME', T.WELCOME))], { stage: 'main' });
  }
}

module.exports = { handle };
