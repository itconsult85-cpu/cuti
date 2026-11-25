// =====================================================================
// Scheduler: percakapan yang tidak dibalas end user selama 2 menit
// (atau setelah form selesai/ketik # sudah ditangani bot.js) ditutup
// otomatis dengan pesan penutup. Pesan berikutnya dianggap pesan awal.
// =====================================================================
const db = require('./db');
const T = require('./templates');
const Store = require('./templateStore');

const IDLE_MS = 2 * 60 * 1000;
let timer = null;

async function tick(sendText) {
  const rows = db.listConversations();
  const now = Date.now();
  for (const c of rows) {
    let st;
    try { st = JSON.parse(c.state || '{}'); } catch { continue; }
    if (!st || st.stage === 'closed' || st.stage === 'new') continue;
    if (now - (c.updated_at || 0) < IDLE_MS) continue;

    const text = Store.get('CLOSING_END') || T.CLOSING_END;
    try {
      await sendText(c.jid, text);
    } catch (e) {
      console.error('[scheduler] gagal kirim pesan penutup:', e.message);
    }
    db.setState(c.jid, c.name, {
      stage: 'closed',
      data: { ...(st.data || {}), endedAt: now, reason: 'timeout-2menit' },
    });
    db.logMessage({ direction: 'out', jid: c.jid, name: c.name, text, stage: 'closed', menu_choice: '# Timeout 2 menit' });
    console.log(`[scheduler] ${c.jid} ditutup otomatis (idle 2 menit).`);
  }
}

function start(sendText) {
  if (timer) return;
  timer = setInterval(() => {
    tick(sendText).catch(err => console.error('[scheduler] error:', err.message));
  }, 20000);
  console.log('[scheduler] Penutup otomatis idle 2 menit aktif (cek tiap 20 detik).');
}

module.exports = { start, tick };
