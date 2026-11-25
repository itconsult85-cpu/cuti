// Uji alur mesin percakapan pada DB sementara (tidak menyentuh data produksi).
// Jalankan: DB_PATH=/tmp/hotline-test.db node scripts/test-flow.js
process.env.DB_PATH = process.env.DB_PATH || '/tmp/hotline-test.db';
try { require('fs').rmSync(process.env.DB_PATH, { force: true }); } catch {}

const db = require('../src/db');
const bot = require('../src/bot');

let failures = 0;
function check(cond, label) {
  if (!cond) { failures++; console.error('FAIL:', label); }
  else console.log('PASS:', label);
}

function step(jid, name, text, expectSubstr) {
  const r = bot.handle(jid, name, text);
  const joined = r.replies.join('\n');
  console.log(`>> [${jid}] ${JSON.stringify(text)} => stage=${r.stage} closed=${r.closed} choice=${r.menuChoice || '-'}`);
  if (expectSubstr && !joined.includes(expectSubstr)) {
    failures++; console.error('   MISSING TEXT:', expectSubstr);
  }
  return r;
}

// ---- Alur 1: Perizinan Kehadiran DPD hingga tutup ----
let r = step('628111@s.whatsapp.net', 'Uji Satu', '1', 'DPD');
check(r.stage === 'struktur_menu', 'Pilihan 1 masuk struktur_menu');
r = step('628111@s.whatsapp.net', 'Uji Satu', '1', 'Struktur Pengurus');
check(r.stage === 'main', 'Struktur DPD selesai kembali ke main');
r = step('628111@s.whatsapp.net', 'Uji Satu', '3', 'Kehadiran');
check(r.stage === 'perizinan_menu', 'Pilihan 3 masuk perizinan_menu');
r = step('628111@s.whatsapp.net', 'Uji Satu', '1', 'DPD');
check(r.stage === 'izin_target_menu', 'Kehadiran -> izin_target_menu');
r = step('628111@s.whatsapp.net', 'Uji Satu', '1', 'Nama');
check(r.stage === 'form_izin_dpd', 'Target DPD -> form_izin_dpd');
r = step('628111@s.whatsapp.net', 'Uji Satu', 'Nama: Budi\nJabatan: Sekretaris', 'Piket Harian DPD');
check(r.stage === 'activity_dpd', 'Form DPD -> activity_dpd');
r = step('628111@s.whatsapp.net', 'Uji Satu', '1', 'Tidak Hadir');
check(r.stage === 'konfirmasi', 'Kegiatan 1 -> konfirmasi');
r = step('628111@s.whatsapp.net', 'Uji Satu', '1', 'Keterangan');
check(r.stage === 'form_keterangan', 'Tidak Hadir -> form_keterangan');
r = step('628111@s.whatsapp.net', 'Uji Satu', 'Ada keperluan keluarga', 'konfirmasi yang telah');
check(r.closed === true && r.stage === 'closed', 'Keterangan -> closing & closed');

// ---- Alur 2: Informasi -> DPC -> # -> pesan baru dianggap awal ----
r = step('628222@lid', 'Uji Dua', '6', 'Informasi');
check(r.stage === 'informasi_menu', 'Menu 6 informasi_menu');
r = step('628222@lid', 'Uji Dua', '2', 'DPC');
check(r.stage === 'dpc_menu', 'Info Kontak DPC -> dpc_menu');
r = step('628222@lid', 'Uji Dua', '2', 'Duren Sawit');
check(r.stage === 'informasi_menu' && /Timur/.test(r.menuChoice), 'DPC Timur dipilih');
r = step('628222@lid', 'Uji Dua', '#', 'NARAHUBUNG kami');
check(r.closed === true, 'Perintah # menutup percakapan');
r = step('628222@lid', 'Uji Dua', 'halo', 'tidak sesuai');
check(r.stage !== 'closed', 'Pesan setelah # dianggap awal (bukan closed) dan dijawab sopan');

// ---- Alur 3: Pesan tidak dikenal -> balasan sopan; perintah 0 dan 9 ----
r = step('628333@s.whatsapp.net', 'Uji Tiga', 'xyz?', 'tidak sesuai');
check(r.stage === 'new' || r.stage === 'main', 'Teks ngawur dijawab balasan sopan khusus');
r = step('628333@s.whatsapp.net', 'Uji Tiga', '5', 'DATA PENGIRIM');
check(r.stage === 'form_pengiriman', 'Menu 5 -> form_pengiriman');
r = step('628333@s.whatsapp.net', 'Uji Tiga', '9', 'NARAHUBUNG DPD');
check(r.stage === 'main', '9 kembali ke menu utama (prev main)');
r = step('628333@s.whatsapp.net', 'Uji Tiga', '0', 'NARAHUBUNG DPD');
check(r.stage === 'main', 'Perintah 0 kembali ke menu utama');
r = step('628333@s.whatsapp.net', 'Uji Tiga', '5', 'DATA PENGIRIM');
r = step('628333@s.whatsapp.net', 'Uji Tiga', 'Pak Budi, Dokumen, JNE', 'informasi yang telah');
check(r.closed === true, 'Form pengiriman ditutup otomatis dengan closing pengiriman');

// ---- Alur 4: Aspirasi Kader ----
r = step('628444@lid', 'Uji Empat', '4', 'Aspirasi');
check(r.stage === 'aspirasi_menu', 'Menu 4 aspirasi_menu');
r = step('628444@lid', 'Uji Empat', '3', 'NO KTA');
check(r.stage === 'form_aspirasi_kader', 'Aspirasi Kader -> form kader');
r = step('628444@lid', 'Uji Empat', 'Nama: Siti, NO KTA: 123', 'Laporan yang telah');
check(r.closed === true, 'Form aspirasi kader closed');

// ---- Seed bawaan terisi versi baru ----
const tpl = db.getAllTemplates();
const builtin = tpl.filter(t => t.type === 'builtin');
check(builtin.length >= 35, `Seed bawaan terisi (${builtin.length} template)`);
check(db.getSetting('seed_version') === '2.0-narahubung', 'seed_version tersimpan 2.0-narahubung');

console.log(failures === 0 ? '\nSEMUA UJI ALUR LULUS' : `\n${failures} UJI GAGAL`);
process.exit(failures === 0 ? 0 : 1);
