// =====================================================================
// Dashboard server: API + static frontend + export CSV/PDF
// =====================================================================
const path = require('path');
const express = require('express');
const PDFDocument = require('pdfkit');

const db = require('./db');
const wa = require('./whatsapp');
const Store = require('./templateStore');

const app = express();

// ---- Proteksi dashboard (Basic Auth, username selalu "admin") ----
// Prioritas password:
//  1. hash tersimpan di DB hasil tombol "Ganti Password" di dashboard (tabel app_settings)
//  2. environment DASHBOARD_PASSWORD
//  3. tidak terkunci — hanya untuk pemakaian lokal development
const crypto = require('crypto');
const ADMIN_USER = 'admin';

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plain), salt, 64).toString('hex');
  return salt + ':' + hash;
}
function verifyPassword(plain, stored) {
  if (!stored || typeof plain !== 'string') return false;
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(plain, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}
function safeEqual(a, b) {
  const A = Buffer.from(String(a ?? ''));
  const B = Buffer.from(String(b ?? ''));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}
function authMode() {
  const custom = db.getSetting('dashboard_password_hash');
  if (custom) return { kind: 'custom', verify: (p) => verifyPassword(p, custom) };
  if (process.env.DASHBOARD_PASSWORD) return { kind: 'env', verify: (p) => safeEqual(p, process.env.DASHBOARD_PASSWORD) };
  return { kind: 'none', verify: () => true };
}

app.use(express.json());
app.use((req, res, next) => {
  const mode = authMode();
  if (mode.kind === 'none') return next();
  const header = req.headers.authorization || '';
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    const user = idx > -1 ? decoded.slice(0, idx) : decoded;
    const pass = idx > -1 ? decoded.slice(idx + 1) : '';
    if (user === ADMIN_USER && mode.verify(pass)) return next();
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="Hotline Dashboard"');
  return res.status(401).json({ error: 'Autentikasi diperlukan. Username: admin.' });
});
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---- helpers tanggal ----
function dayStart(d) { const x = new Date(d + 'T00:00:00'); return isNaN(x) ? null : x.getTime(); }
function dayEnd(d) { const x = new Date(d + 'T23:59:59.999'); return isNaN(x) ? null : x.getTime(); }
function parseRange(q) {
  let fromTs = null, toTs = null;
  if (q.from) fromTs = dayStart(q.from);
  if (q.to) toTs = dayEnd(q.to);
  return { fromTs, toTs };
}

// ---- status & events ----
app.get('/api/status', (req, res) => {
  res.json({ ...wa.getStatus(), uptime: process.uptime() });
});

app.get('/api/events', (req, res) => {
  res.json(db.lastEvents(30));
});

app.post('/api/reconnect', (req, res) => { wa.reconnect(); res.json({ ok: true }); });
app.post('/api/rescan', (req, res) => { wa.rescan(); res.json({ ok: true }); });

// ---- Akun dashboard: status, ganti password, kembali ke password environment ----
app.get('/api/auth/status', (req, res) => {
  const mode = authMode();
  res.json({
    username: ADMIN_USER,
    mode: mode.kind,
    locked: mode.kind !== 'none',
    message: mode.kind === 'custom'
      ? 'Menggunakan password kustom yang disimpan lewat dashboard.'
      : mode.kind === 'env'
        ? 'Menggunakan password dari environment DASHBOARD_PASSWORD.'
        : 'Tidak ada password — hanya untuk lokal. Segera ganti password saat dipublikasikan.',
  });
});

app.post('/api/change-password', (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  const mode = authMode();
  if (mode.kind !== 'none' && !mode.verify(oldPassword || '')) {
    return res.status(401).json({ error: 'Password lama salah.' });
  }
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
  }
  db.setSetting('dashboard_password_hash', hashPassword(String(newPassword)));
  res.json({ ok: true, message: 'Password berhasil diganti. Silakan login ulang dengan password baru.' });
});

app.post('/api/auth/reset-password', (req, res) => {
  db.deleteSetting('dashboard_password_hash');
  res.json({ ok: true, mode: authMode().kind, message: 'Password kustom dihapus; kembali ke konfigurasi environment.' });
});

// ---- Template balasan (CRUD: lihat, edit, tambah, hapus, simpan) ----
app.get('/api/templates', (req, res) => {
  res.json(db.getAllTemplates());
});

app.post('/api/templates', (req, res) => {
  // Tambah CUSTOM rule baru (keyword -> balasan). Template builtin tidak bisa ditambah.
  const { label, keyword, text } = req.body || {};
  if (!keyword || !text) return res.status(400).json({ error: 'Keyword dan isi balasan wajib diisi.' });
  const name = 'custom_' + Date.now();
  const id = db.insertTemplate({ type: 'custom', name, keyword: keyword.trim(), label: label || keyword.trim(), text });
  Store.reload();
  res.json({ ok: true, id });
});

app.put('/api/templates/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { label, keyword, text } = req.body || {};
  if (text == null) return res.status(400).json({ error: 'Isi balasan tidak boleh kosong.' });
  const existing = db.getAllTemplates().find(t => t.id === id);
  if (!existing) return res.status(404).json({ error: 'Template tidak ditemukan.' });
  // builtin: hanya label & text yang bisa diubah; keyword diabaikan
  const changes = db.updateTemplate(id, {
    label: label || existing.label,
    keyword: existing.type === 'custom' ? (keyword || existing.keyword) : null,
    text,
  });
  Store.reload();
  res.json({ ok: true, changes });
});

app.delete('/api/templates/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const existing = db.getAllTemplates().find(t => t.id === id);
  if (!existing) return res.status(404).json({ error: 'Template tidak ditemukan.' });
  if (existing.type === 'builtin') return res.status(400).json({ error: 'Template bawaan tidak bisa dihapus (hanya bisa diedit). Hapus hanya untuk aturan tambahan.' });
  db.deleteTemplate(id);
  Store.reload();
  res.json({ ok: true });
});

app.post('/api/templates/reload', (req, res) => { Store.reload(); res.json({ ok: true }); });

// ---- statistik ----
app.get('/api/stats', (req, res) => {
  const { fromTs, toTs } = parseRange(req.query);
  const now = Date.now();
  const day = 86400000;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const weekStart = todayStart.getTime() - 6 * day;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const range = (f, t) => ({ from: f || 0, to: t || now + day });
  const r = range(fromTs, toTs);

  // grafik 14 hari
  const daily = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(todayStart.getTime() - i * day);
    const ds = d.getTime();
    const label = d.toISOString().slice(0, 10);
    daily.push({
      date: label,
      masuk: db.countBetween(ds, ds + day, 'in'),
      keluar: db.countBetween(ds, ds + day, 'out'),
    });
  }

  res.json({
    periode: { from: req.query.from || null, to: req.query.to || null },
    masuk_range: db.countBetween(r.from, r.to, 'in'),
    keluar_range: db.countBetween(r.from, r.to, 'out'),
    pengirim_unik_range: db.distinctSendersBetween(r.from, r.to),
    masuk_hari_ini: db.countBetween(todayStart.getTime(), now + day, 'in'),
    masuk_minggu_ini: db.countBetween(weekStart, now + day, 'in'),
    masuk_bulan_ini: db.countBetween(monthStart.getTime(), now + day, 'in'),
    top_pengirim: db.topSenders(r.from, r.to, 10),
    menu_terpilih: db.menuBreakdown(r.from, r.to),
    daily,
  });
});

// ---- log pesan ----
app.get('/api/messages', (req, res) => {
  const { fromTs, toTs } = parseRange(req.query);
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(500, parseInt(req.query.limit) || 100);
  const { rows, total } = db.getMessages({
    fromTs, toTs, q: req.query.q, jid: req.query.jid,
    limit, offset: (page - 1) * limit,
  });
  res.json({ rows, total, page, limit, pages: Math.ceil(total / limit) });
});

app.get('/api/conversations', (req, res) => {
  res.json(db.listConversations());
});

app.get('/api/conversation/:jid', (req, res) => {
  res.json(db.getConversation(req.params.jid));
});

// ---- export CSV (bisa dibuka langsung di Excel) ----
app.get('/api/export.csv', (req, res) => {
  const { fromTs, toTs } = parseRange(req.query);
  const rows = db.exportRows({ fromTs, toTs });
  const esc = (v) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return /[",\n;]/.test(s) ? `"${s}"` : s;
  };
  const header = ['Waktu', 'Arah', 'Nomor Pengirim', 'Nama', 'Isi Pesan', 'Stage', 'Pilihan Menu', 'Data Form'];
  const lines = [header.join(',')];
  for (const r of rows) {
    const t = new Date(r.ts).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    lines.push([
      t, r.direction === 'in' ? 'Masuk' : 'Keluar', r.jid.replace(/@s\.whatsapp\.net|@lid/g, ''),
      esc(r.name), esc(r.text), r.stage || '', esc(r.menu_choice || ''), esc(r.form_data || ''),
    ].join(','));
  }
  // BOM agar Excel mengenali UTF-8
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="laporan-wa-hotline.csv"`);
  res.send('﻿' + lines.join('\n'));
});

// ---- export PDF ----
app.get('/api/export.pdf', (req, res) => {
  const { fromTs, toTs } = parseRange(req.query);
  const rows = db.exportRows({ fromTs, toTs });
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="laporan-wa-hotline.pdf"`);
  doc.pipe(res);

  doc.fontSize(16).text('Laporan Pesan Hotline WhatsApp', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Periode: ${req.query.from || 'awal'} s/d ${req.query.to || 'sekarang'}`, { align: 'center' });
  doc.text(`Total pesan: ${rows.length}`, { align: 'center' });
  doc.moveDown();

  const startY = doc.y;
  let y = startY;
  doc.fontSize(8);
  for (const r of rows) {
    if (y > 780) { doc.addPage(); y = 50; }
    const t = new Date(r.ts).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const arah = r.direction === 'in' ? 'MASUK' : 'KELUAR';
    const nomor = r.jid.replace(/@s\.whatsapp\.net|@lid/g, '');
    const isi = String(r.text || '').replace(/\s+/g, ' ').slice(0, 110);
    doc.text(`${t}  [${arah}]  ${nomor}  ${r.name || ''}`, 40, y, { width: 515 });
    y += 11;
    doc.text(`    ${isi}`, 40, y, { width: 515 });
    y += 14;
  }
  doc.end();
});

const PORT = process.env.PORT || 3000;
function startServer() {
  return app.listen(PORT, () => {
    console.log(`[server] Dashboard berjalan di http://localhost:${PORT}`);
  });
}

module.exports = { startServer, app };
