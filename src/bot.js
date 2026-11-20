// =====================================================================
// Mesin percakapan (state machine) — template balasan diambil dari
// DATABASE (bisa diedit live dari dashboard) via templateStore.
// Custom keyword rules (tambahan user) dicek paling awal.
// =====================================================================
const T = require('./templates'); // hanya untuk FOOTER & label menu
const Store = require('./templateStore');
const db = require('./db');

const FOOTER = T.FOOTER;

// Keyword mapping untuk menu (user bisa ketik angka ATAU kata kunci)
const MAIN_KEYWORDS = {
  1: ['struktur'],
  2: ['badan', 'sayap'],
  3: ['penyampaian', 'laporan', 'aspirasi'],
  4: ['perizinan', 'izin', 'kegiatan'],
  5: ['pengiriman', 'kirim', 'barang', 'dokumen'],
  6: ['informasi', 'info', 'alamat', 'medsos', 'media sosial', 'kta', 'kontak'],
};
const STRUKTUR_KEYWORDS = {
  1: ['dpd'],
  2: ['dpc'],
  3: ['pac'],
  4: ['ranting'],
  5: ['anak ranting', 'anakranting'],
};
const BADAN_KEYWORDS = {
  1: ['tmp'], 2: ['bmi'], 3: ['bbhar'], 4: ['bamusi'],
  5: ['gnti'], 6: ['bspn'], 7: ['baguna'], 8: ['bpek'],
};
const PENYAMPAIAN_KEYWORDS = {
  1: ['laporan partai', 'laporan'],
  2: ['aspirasi kepartaian', 'kepartaian'],
  3: ['aspirasi warga', 'warga jakarta', 'warga'],
};
const INFORMASI_KEYWORDS = {
  1: ['alamat kantor', 'alamat dpd', 'kantor dpd', 'lokasi'],
  2: ['media sosial', 'medsos', 'instagram', 'tiktok', 'website'],
  3: ['kta', 'pembuatan kta', 'kartu anggota'],
  4: ['alamat dpc', 'kontak dpc', 'dpc', 'kepulauan seribu'],
};
const DPC_KEYWORDS = {
  1: ['pusat', 'jakarta pusat'],
  2: ['timur', 'jakarta timur'],
  3: ['selatan', 'jakarta selatan'],
  4: ['barat', 'jakarta barat'],
  5: ['utara', 'jakarta utara'],
  6: ['kepulauan seribu', 'seribu', 'pula seribu'],
};

function pick(text, mapping, max) {
  const t = text.trim().toLowerCase();
  if (/^\d+$/.test(t)) {
    const n = parseInt(t, 10);
    if (n >= 1 && n <= max) return n;
    return null;
  }
  for (const [k, words] of Object.entries(mapping)) {
    if (words.some(w => t.includes(w))) return parseInt(k, 10);
  }
  return null;
}

function isBackToMenu(text) {
  const t = text.trim().toLowerCase();
  return t === '0' || t === 'menu' || t.includes('kembali') || t.includes('menu utama');
}

function send(state, stage, data) {
  return { stage, data: { ...(state.data || {}), ...(data || {}) } };
}

// Hasil: { replies: string[], menuChoice, formData, stage, customRule }
function handle(jid, name, rawText) {
  const text = (rawText || '').trim();
  let state = db.getState(jid) || { stage: 'new', data: {} };

  // 0) Perintah kembali ke menu utama berlaku di SEMUA stage
  if (isBackToMenu(text)) {
    state = send(state, 'main', {});
    db.setState(jid, name, state);
    db.logMessage({ direction: 'in', jid, name, text, stage: 'main', menu_choice: '0 (kembali)' });
    return { replies: [Store.get('WELCOME') + FOOTER], stage: 'main' };
  }

  // 1) Custom keyword rules (tambahan dari dashboard) — dicek paling awal,
  //    tidak mengubah state alur menu (balas lalu lanjut alur normal pesan berikutnya)
  const customReply = Store.matchCustom(text);
  if (customReply) {
    db.logMessage({ direction: 'in', jid, name, text, stage: state.stage, menu_choice: 'custom-rule' });
    return { replies: [customReply], stage: state.stage, customRule: true };
  }

  let replies = [];
  let menuChoice = null;
  let formData = null;
  let next = state;

  switch (state.stage) {
    case 'new':
    case 'main': {
      const c = pick(text, MAIN_KEYWORDS, 6);
      if (!c) {
        next = send(state, 'main');
        replies.push(Store.get('WELCOME') + FOOTER);
        break;
      }
      menuChoice = `${c}. ${T.MAIN_MENU_LABELS[c]}`;
      if (c === 1) { next = send(state, 'struktur_menu'); replies.push(Store.get('STRUKTUR_MENU') + FOOTER); }
      else if (c === 2) { next = send(state, 'badan_menu'); replies.push(Store.get('BADAN_MENU') + FOOTER); }
      else if (c === 3) { next = send(state, 'penyampaian_menu'); replies.push(Store.get('PENYAMPAIAN_MENU') + FOOTER); }
      else if (c === 4) { next = send(state, 'form_perizinan'); replies.push(Store.get('FORM_PERIZINAN')); }
      else if (c === 5) { next = send(state, 'form_pengiriman'); replies.push(Store.get('FORM_PENGIRIMAN')); }
      else if (c === 6) { next = send(state, 'informasi_menu'); replies.push(Store.get('INFORMASI_MENU') + FOOTER); }
      break;
    }

    case 'struktur_menu': {
      const c = pick(text, STRUKTUR_KEYWORDS, 5);
      if (!c) { replies.push('Pilihan tidak dikenali. ' + Store.get('STRUKTUR_MENU') + FOOTER); break; }
      menuChoice = c === 1 ? 'DPD' : ['DPC', 'PAC', 'RANTING', 'ANAK RANTING'][c - 2];
      next = send(state, c === 1 ? 'form_struktur_dpd' : 'form_struktur_lain', { struktur_choice: menuChoice });
      replies.push(Store.get('FORM_NAMA_JABATAN'));
      break;
    }

    case 'form_struktur_dpd': {
      formData = text;
      next = send(state, 'activity_dpd', { form_nama_jabatan: text });
      replies.push(Store.get('ACTIVITY_DPD') + FOOTER);
      break;
    }

    case 'form_struktur_lain': {
      formData = text;
      next = send(state, 'activity_struktur_lain', { form_nama_jabatan: text });
      replies.push(Store.get('ACTIVITY_STRUKTUR_LAIN') + FOOTER);
      break;
    }

    case 'activity_dpd':
    case 'activity_struktur_lain': {
      menuChoice = text.slice(0, 100);
      next = send(state, 'konfirmasi', { activity_choice: text });
      replies.push(Store.get('KONFIRMASI') + FOOTER);
      break;
    }

    case 'badan_menu': {
      const c = pick(text, BADAN_KEYWORDS, 8);
      if (!c) { replies.push('Pilihan tidak dikenali. ' + Store.get('BADAN_MENU') + FOOTER); break; }
      menuChoice = ['TMP', 'BMI', 'BBHAR', 'BAMUSI', 'GNTI', 'BSPN', 'BAGUNA', 'BPEK'][c - 1];
      next = send(state, 'form_badan', { badan_choice: menuChoice });
      replies.push(Store.get('FORM_NAMA_JABATAN'));
      break;
    }

    case 'form_badan': {
      formData = text;
      next = send(state, 'activity_badan', { form_nama_jabatan: text });
      replies.push(Store.get('ACTIVITY_BADAN') + FOOTER);
      break;
    }

    case 'activity_badan': {
      menuChoice = text.slice(0, 100);
      next = send(state, 'konfirmasi', { activity_choice: text });
      replies.push(Store.get('KONFIRMASI') + FOOTER);
      break;
    }

    case 'konfirmasi': {
      menuChoice = text.slice(0, 100);
      next = send(state, 'main', {});
      replies.push(Store.get('THANKS_KEHADIRAN') + FOOTER);
      break;
    }

    case 'penyampaian_menu': {
      const c = pick(text, PENYAMPAIAN_KEYWORDS, 3);
      if (!c) { replies.push('Pilihan tidak dikenali. ' + Store.get('PENYAMPAIAN_MENU') + FOOTER); break; }
      menuChoice = ['Laporan Partai', 'Aspirasi Kepartaian', 'Aspirasi Warga Jakarta'][c - 1];
      if (c === 1 || c === 2) {
        next = send(state, 'form_penyampaian_partai', { penyampaian_choice: menuChoice });
        replies.push(Store.get('FORM_PENYAMPAIAN_PARTAI'));
      } else {
        next = send(state, 'form_penyampaian_warga', { penyampaian_choice: menuChoice });
        replies.push(Store.get('FORM_PENYAMPAIAN_WARGA'));
      }
      break;
    }

    case 'form_penyampaian_partai': {
      formData = text;
      next = send(state, 'main', {});
      replies.push(Store.get('THANKS_PENYAMPAIAN') + FOOTER);
      break;
    }

    case 'form_penyampaian_warga': {
      formData = text;
      next = send(state, 'main', {});
      replies.push(Store.get('THANKS_PENYAMPAIAN_WARGA') + FOOTER);
      break;
    }

    case 'form_perizinan': {
      formData = text;
      next = send(state, 'main', {});
      replies.push(Store.get('THANKS_PERIZINAN') + FOOTER);
      break;
    }

    case 'form_pengiriman': {
      formData = text;
      next = send(state, 'main', {});
      replies.push(Store.get('THANKS_PENGIRIMAN') + FOOTER);
      break;
    }

    case 'informasi_menu': {
      const c = pick(text, INFORMASI_KEYWORDS, 4);
      if (!c) { replies.push('Pilihan tidak dikenali. ' + Store.get('INFORMASI_MENU') + FOOTER); break; }
      menuChoice = ['Alamat Kantor DPD', 'Media Sosial', 'Pembuatan KTA', 'Alamat & Kontak DPC'][c - 1];
      const thanks = '\n\n' + Store.get('THANKS_INFO') + FOOTER;
      if (c === 1) { next = send(state, 'main'); replies.push(Store.get('INFO_ALAMAT_DPD') + thanks); }
      else if (c === 2) { next = send(state, 'main'); replies.push(Store.get('INFO_MEDIA_SOSIAL') + thanks); }
      else if (c === 3) { next = send(state, 'main'); replies.push(Store.get('INFO_KTA') + thanks); }
      else if (c === 4) { next = send(state, 'dpc_menu'); replies.push(Store.get('DPC_MENU') + FOOTER); }
      break;
    }

    case 'dpc_menu': {
      const c = pick(text, DPC_KEYWORDS, 6);
      if (!c) { replies.push('Pilihan tidak dikenali. ' + Store.get('DPC_MENU') + FOOTER); break; }
      menuChoice = ['Jakarta Pusat', 'Jakarta Timur', 'Jakarta Selatan', 'Jakarta Barat', 'Jakarta Utara', 'Kepulauan Seribu'][c - 1];
      const info = Store.infoDpcText(c);
      next = send(state, 'main');
      replies.push(info + '\n\n' + Store.get('THANKS_INFO') + FOOTER);
      break;
    }

    default: {
      next = send(state, 'main');
      replies.push(Store.get('WELCOME') + FOOTER);
    }
  }

  db.setState(jid, name, next);
  db.logMessage({
    direction: 'in', jid, name, text,
    stage: next.stage, menu_choice: menuChoice, form_data: formData ? { form: formData } : null,
  });
  return { replies, stage: next.stage, menuChoice, formData };
}

module.exports = { handle };
