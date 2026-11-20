// =====================================================================
// Loader .env ringan (tanpa dependensi tambahan).
// Membaca file .env lalu data/.env; variabel yang sudah ada di shell
// tidak ditimpa (environment luar tetap menang).
// Pakai: letakkan `require('./loadEnv')` paling awal di entry point.
// =====================================================================
const fs = require('fs');
const path = require('path');

function parseEnv(text) {
  const out = {};
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key) out[key] = val;
  }
  return out;
}

function loadEnvFiles() {
  const files = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', 'data', '.env'),
  ];
  let loaded = [];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const parsed = parseEnv(fs.readFileSync(f, 'utf8'));
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] === undefined) process.env[k] = v;
    }
    loaded.push(f);
  }
  if (loaded.length) console.log('[env] Dimuat:', loaded.map(p => path.basename(path.dirname(p)) + '/' + path.basename(p)).join(', '));
  return loaded;
}

loadEnvFiles();

module.exports = { parseEnv, loadEnvFiles };
