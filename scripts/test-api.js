// Uji endpoint dashboard: statistik (filter menu utama, top 10),
// laporan 6 kategori, ekspor Excel, dan scheduler idle 2 menit.
// Jalankan: node scripts/test-api.js
process.env.DB_PATH = '/tmp/hotline-test-api.db';
process.env.PORT = '3998';
try { require('fs').rmSync(process.env.DB_PATH, { force: true }); } catch {}

const db = require('../src/db');
const bot = require('../src/bot');

function drive(jid, name, text) {
  const r = bot.handle(jid, name, text);
  db.logMessage({ direction: 'in', jid, name, text, stage: r.stage, menu_choice: r.menuChoice, form_data: r.formData });
  for (const reply of r.replies) {
    db.logMessage({ direction: 'out', jid, name, text: reply, stage: r.stage, menu_choice: r.menuChoice, form_data: r.formData });
  }
  return r;
}

// Buat percakapan pada beberapa kategori
drive('629001@s.whatsapp.net', 'Andi', '1');
drive('629001@s.whatsapp.net', 'Andi', '1');
drive('629002@lid', 'Budi', '3');
drive('629002@lid', 'Budi', '1');
drive('629002@lid', 'Budi', '1');
drive('629002@lid', 'Budi', 'Nama: Budi, Jabatan: Bendahara');
drive('629003@lid', 'Citra', '6');
drive('629003@lid', 'Citra', '1');
drive('629004@s.whatsapp.net', 'Dewi', '4');
drive('629004@s.whatsapp.net', 'Dewi', '3');

const { startServer } = require('../src/server');
const scheduler = require('../src/scheduler');

let failures = 0;
function check(cond, label) {
  if (!cond) { failures++; console.error('FAIL:', label); }
  else console.log('PASS:', label);
}

(async () => {
  startServer();
  await new Promise(r => setTimeout(r, 500));
  const base = 'http://127.0.0.1:3998';

  const s = await (await fetch(base + '/api/stats')).json();
  const MAIN = ['Struktur Partai', 'Badan/Sayap Partai', 'Perizinan', 'Aspirasi', 'Pengiriman', 'Informasi'];
  const nonMain = s.menu_terpilih.filter(m => !MAIN.some(k => (m.menu_choice || '').includes(k)));
  check(nonMain.length === 0, 'Grafik menu hanya berisi 6 menu utama');
  check(s.top_pengirim.length <= 10, 'Top pengirim maksimal 10 (jumlah=' + s.top_pengirim.length + ')');

  for (const kat of ['struktur', 'badan', 'perizinan', 'aspirasi', 'pengiriman', 'informasi', 'all']) {
    const l = await (await fetch(`${base}/api/laporan?kategori=${kat}&periode=month`)).json();
    check(Array.isArray(l.rows), `Laporan kategori ${kat} mengembalikan rows (${l.rows.length})`);
  }

  const ex = await fetch(base + '/api/laporan/excel?kategori=perizinan&periode=month');
  const buf = Buffer.from(await ex.arrayBuffer());
  check(ex.status === 200 && buf.length > 1000, 'Ekspor Excel berhasil (bytes=' + buf.length + ')');
  check(buf.slice(0, 2).toString() === 'PK', 'File Excel berformat ZIP/XLSX yang valid');

  // Scheduler idle 2 menit: paksa updated_at lama lalu tick dengan pengirim palsu
  db.db.prepare('UPDATE conversations SET updated_at = ? WHERE jid = ?').run(Date.now() - 130000, '629002@lid');
  let sentText = null;
  await scheduler.tick(async (jid, text) => { sentText = text; });
  const after = db.getState('629002@lid');
  check(after.stage === 'closed', 'Percakapan idle otomatis ditutup scheduler');
  check(sentText && sentText.includes('NARAHUBUNG kami'), 'Pesan penutup idle dikirim ke pengirim');

  console.log(failures === 0 ? '\nSEMUA UJI API LULUS' : `\n${failures} UJI GAGAL`);
  process.exit(failures === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
