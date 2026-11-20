// =====================================================================
// Koneksi WhatsApp via Baileys (protokol WhatsApp Web / Multi Device).
// Cukup scan QR dengan HP nomor hotline — TIDAK perlu verifikasi Meta.
// =====================================================================
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  jidNormalizedUser,
  getContentType,
} = require('@whiskeysockets/baileys');
const P = require('pino');

const db = require('./db');
const bot = require('./bot');

const AUTH_DIR = path.join(__dirname, '..', 'data', 'auth');
const DEBUG_LOG = path.join(__dirname, '..', 'data', 'debug.log');
function debugLog(...args) {
  const line = `[${new Date().toISOString()}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}\n`;
  try { fs.appendFileSync(DEBUG_LOG, line); } catch {}
  console.log(...args);
}
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

const status = {
  state: 'starting', // starting | qr | open | closed | logged_out
  qr: null,
  qrDataUrl: null,
  phoneNumber: null,
  connectedAt: null,
  lastError: null,
};

let sock = null;
let reconnectTimer = null;

function getStatus() { return { ...status }; }

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

  sock = makeWASocket({
    version,
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'silent' })) },
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    markOnlineOnConnect: false,
    connectTimeoutMs: 60_000,
    retryRequestDelayMs: 5_000,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      status.state = 'qr';
      status.qr = qr;
      try { status.qrDataUrl = await QRCode.toDataURL(qr); } catch { status.qrDataUrl = null; }
      db.logEvent('qr_generated');
      console.log('[wa] QR siap — silakan scan di dashboard (atau terminal).');
    }

    if (connection === 'open') {
      status.state = 'open';
      status.qr = null;
      status.qrDataUrl = null;
      status.phoneNumber = sock.user?.id?.split(':')[0] || sock.user?.id || null;
      status.connectedAt = Date.now();
      status.lastError = null;
      db.logEvent('connected', status.phoneNumber);
      console.log('[wa] Terhubung sebagai', status.phoneNumber);
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const reason = Object.entries(DisconnectReason).find(([, v]) => v === code)?.[0] || String(code);
      status.lastError = reason;
      db.logEvent('disconnected', reason);
      console.log('[wa] Terputus:', reason);

      if (code === DisconnectReason.loggedOut) {
        status.state = 'logged_out';
        // Hapus sesi agar QR baru bisa di-scan
        try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); fs.mkdirSync(AUTH_DIR, { recursive: true }); } catch {}
        status.qr = null; status.qrDataUrl = null;
      } else {
        status.state = 'closed';
        // Reconnect otomatis setelah 5 detik
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => startSock(), 5000);
      }
    }
  });

  // Debug: log semua event penting untuk memastikan socket menerima data
  sock.ev.on('messaging-history.set', ({ chats, messages }) => {
    debugLog(`[history] chats=${chats?.length || 0}, messages=${messages?.length || 0}`);
  });
  sock.ev.on('chats.set', ({ chats }) => debugLog(`[chats.set] count=${chats?.length || 0}`));
  sock.ev.on('contacts.set', ({ contacts }) => debugLog(`[contacts.set] count=${contacts?.length || 0}`));

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    debugLog(`[messages.upsert] type=${type}, count=${messages.length}`);
    for (const m of messages) {
      const ctype = m.message ? getContentType(m.message) : '(tanpa pesan)';
      debugLog(`  raw: fromMe=${m.key?.fromMe} jid=${m.key?.remoteJid} ctype=${ctype} pushName=${m.pushName || '-'}`);
    }
    if (type !== 'notify') return;
    for (const m of messages) {
      try {
        if (m.key?.fromMe) continue;
        const remoteJid = m.key?.remoteJid;
        if (!remoteJid) continue;
        const jid = jidNormalizedUser(remoteJid);
        // Terima chat pribadi: format lama @s.whatsapp.net ATAU format baru Linked Device @lid
        if (!jid.endsWith('@s.whatsapp.net') && !jid.endsWith('@lid')) continue; // abaikan grup & broadcast

        const msg = m.message;
        if (!msg) continue;
        const ctype = getContentType(msg);
        let text = '';
        if (ctype === 'conversation') text = msg.conversation || '';
        else if (ctype === 'extendedTextMessage') text = msg.extendedTextMessage?.text || '';
        else if (ctype === 'imageMessage') text = msg.imageMessage?.caption || '';
        else if (ctype === 'videoMessage') text = msg.videoMessage?.caption || '';
        else if (ctype === 'documentMessage') text = msg.documentMessage?.caption || '';
        else if (ctype === 'buttonsResponseMessage') text = msg.buttonsResponseMessage?.selectedDisplayText || '';
        else if (ctype === 'listResponseMessage') text = msg.listResponseMessage?.title || '';
        else continue; // abaikan voice/sticker/lokasi dll.

        const name = m.pushName || '';
        console.log(`[wa] <- ${jid} (${name}): ${text.slice(0, 60)}`);

        const result = bot.handle(jid, name, text);

        for (const reply of result.replies) {
          // jeda kecil antar pesan agar tidak terlihat spam & urut
          await new Promise(r => setTimeout(r, 400));
          await sock.sendMessage(jid, { text: reply });
          db.logMessage({ direction: 'out', jid, name, text: reply, stage: result.stage });
          console.log(`[wa] -> ${jid}: ${reply.slice(0, 60)}`);
        }
      } catch (err) {
        console.error('[wa] error proses pesan:', err.message);
        db.logEvent('message_error', err.message);
      }
    }
  });
}

function reconnect() {
  clearTimeout(reconnectTimer);
  try { sock?.end(new Error('manual reconnect')); } catch {}
  // hapus sesi? tidak — reconnect pakai sesi lama. Untuk scan ulang, gunakan /api/rescan.
  setTimeout(() => startSock(), 500);
}

function rescan() {
  clearTimeout(reconnectTimer);
  try { sock?.logout(); } catch {}
  try { sock?.end(new Error('rescan')); } catch {}
  try { fs.rmSync(AUTH_DIR, { recursive: true, force: true }); fs.mkdirSync(AUTH_DIR, { recursive: true }); } catch {}
  status.state = 'starting'; status.qr = null; status.qrDataUrl = null;
  setTimeout(() => startSock(), 500);
}

module.exports = { startSock, getStatus, reconnect, rescan };
