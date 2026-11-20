// =====================================================================
// Database SQLite: log pesan, state percakapan, event koneksi
// =====================================================================
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'hotline.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('in','out')),
  jid TEXT NOT NULL,
  name TEXT,
  text TEXT,
  stage TEXT,
  menu_choice TEXT,
  form_data TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_ts ON messages(ts);
CREATE INDEX IF NOT EXISTS idx_messages_jid ON messages(jid);

CREATE TABLE IF NOT EXISTS conversations (
  jid TEXT PRIMARY KEY,
  name TEXT,
  state TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS connection_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  event TEXT NOT NULL,
  detail TEXT
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('builtin','custom')),
  name TEXT NOT NULL,
  keyword TEXT,
  label TEXT NOT NULL,
  text TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_name ON templates(name);
`);

// ---- messages ----
const insertMsg = db.prepare(`
  INSERT INTO messages (ts, direction, jid, name, text, stage, menu_choice, form_data)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
function logMessage({ direction, jid, name, text, stage, menu_choice, form_data }) {
  return insertMsg.run(Date.now(), direction, jid, name || null, text || null,
    stage || null, menu_choice || null, form_data ? JSON.stringify(form_data) : null);
}

const countMsg = db.prepare('SELECT COUNT(*) AS n FROM messages WHERE ts >= ? AND ts < ? AND direction = ?');
function countBetween(fromTs, toTs, direction = 'in') {
  return countMsg.get(fromTs || 0, toTs || Date.now() + 86400000, direction).n;
}

const distinctSenders = db.prepare('SELECT COUNT(DISTINCT jid) AS n FROM messages WHERE ts >= ? AND ts < ? AND direction = ?');
function distinctSendersBetween(fromTs, toTs) {
  return distinctSenders.get(fromTs || 0, toTs || Date.now() + 86400000, 'in').n;
}

const topSendersStmt = db.prepare(`
  SELECT jid, name, COUNT(*) AS n FROM messages
  WHERE ts >= ? AND ts < ? AND direction = 'in'
  GROUP BY jid ORDER BY n DESC LIMIT ?
`);
function topSenders(fromTs, toTs, limit = 10) {
  return topSendersStmt.all(fromTs || 0, toTs || Date.now() + 86400000, limit);
}

const menuBreakdownStmt = db.prepare(`
  SELECT menu_choice, COUNT(*) AS n FROM messages
  WHERE ts >= ? AND ts < ? AND direction = 'in' AND menu_choice IS NOT NULL
  GROUP BY menu_choice ORDER BY n DESC
`);
function menuBreakdown(fromTs, toTs) {
  return menuBreakdownStmt.all(fromTs || 0, toTs || Date.now() + 86400000);
}

function getMessages({ fromTs, toTs, q, jid, limit = 200, offset = 0 }) {
  const where = [];
  const args = [];
  if (fromTs) { where.push('ts >= ?'); args.push(fromTs); }
  if (toTs) { where.push('ts < ?'); args.push(toTs); }
  if (jid) { where.push('jid = ?'); args.push(jid); }
  if (q) { where.push('(text LIKE ? OR name LIKE ? OR jid LIKE ?)'); args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = db.prepare(`SELECT * FROM messages ${w} ORDER BY ts DESC LIMIT ? OFFSET ?`)
    .all(...args, limit, offset);
  const total = db.prepare(`SELECT COUNT(*) AS n FROM messages ${w}`).get(...args).n;
  return { rows, total };
}

function getConversation(jid) {
  return db.prepare('SELECT * FROM messages WHERE jid = ? ORDER BY ts ASC LIMIT 500').all(jid);
}

function listConversations() {
  return db.prepare(`
    SELECT c.jid, c.name, c.updated_at, c.state,
           (SELECT text FROM messages m WHERE m.jid = c.jid ORDER BY ts DESC LIMIT 1) AS last_text,
           (SELECT direction FROM messages m WHERE m.jid = c.jid ORDER BY ts DESC LIMIT 1) AS last_dir
    FROM conversations c ORDER BY c.updated_at DESC LIMIT 200
  `).all();
}

function exportRows({ fromTs, toTs }) {
  const where = []; const args = [];
  if (fromTs) { where.push('ts >= ?'); args.push(fromTs); }
  if (toTs) { where.push('ts < ?'); args.push(toTs); }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  return db.prepare(`SELECT * FROM messages ${w} ORDER BY ts ASC`).all(...args);
}

// ---- conversations / state ----
const upsertConv = db.prepare(`
  INSERT INTO conversations (jid, name, state, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(jid) DO UPDATE SET name = excluded.name, state = excluded.state, updated_at = excluded.updated_at
`);
const getConv = db.prepare('SELECT * FROM conversations WHERE jid = ?');

function getState(jid) {
  const row = getConv.get(jid);
  try { return row ? JSON.parse(row.state) : null; } catch { return null; }
}
function setState(jid, name, state) {
  const now = Date.now();
  const row = getConv.get(jid);
  upsertConv.run(jid, name || (row && row.name) || null, JSON.stringify(state), row ? row.created_at : now, now);
}

// ---- connection events ----
const insertEvt = db.prepare('INSERT INTO connection_events (ts, event, detail) VALUES (?, ?, ?)');
function logEvent(event, detail) { return insertEvt.run(Date.now(), event, detail || null); }
function lastEvents(limit = 20) {
  return db.prepare('SELECT * FROM connection_events ORDER BY ts DESC LIMIT ?').all(limit);
}

// ---- templates (CRUD, disimpan di DB, bisa diedit dari dashboard) ----
const allTpl = db.prepare('SELECT * FROM templates ORDER BY type DESC, id ASC');
function getAllTemplates() { return allTpl.all(); }
const getTplByName = db.prepare('SELECT * FROM templates WHERE name = ?');
function getTemplateByName(name) { return getTplByName.get(name); }
const insertTpl = db.prepare(`INSERT INTO templates (type, name, keyword, label, text, updated_at) VALUES (?, ?, ?, ?, ?, ?)`);
function insertTemplate({ type, name, keyword, label, text }) {
  return insertTpl.run(type, name, keyword || null, label, text, Date.now()).lastInsertRowid;
}
const updateTpl = db.prepare('UPDATE templates SET label = ?, keyword = ?, text = ?, updated_at = ? WHERE id = ?');
function updateTemplate(id, { label, keyword, text }) {
  return updateTpl.run(label, keyword || null, text, Date.now(), id).changes;
}
const deleteTpl = db.prepare('DELETE FROM templates WHERE id = ?');
function deleteTemplate(id) { return deleteTpl.run(id).changes; }
const countTpl = db.prepare('SELECT COUNT(*) AS n FROM templates');
function countTemplates() { return countTpl.get().n; }

module.exports = {
  db,
  logMessage,
  countBetween,
  distinctSendersBetween,
  topSenders,
  menuBreakdown,
  getMessages,
  getConversation,
  listConversations,
  exportRows,
  getState,
  setState,
  logEvent,
  lastEvents,
  getAllTemplates,
  getTemplateByName,
  insertTemplate,
  updateTemplate,
  deleteTemplate,
  countTemplates,
};
