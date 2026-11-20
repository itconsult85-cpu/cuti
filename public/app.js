// Dashboard frontend — vanilla JS
const $ = (id) => document.getElementById(id);
let currentPage = 1;
let activeJid = null;

const stateLabel = {
  starting: ['Memulai…', 'badge-starting'],
  qr: ['Menunggu Scan QR', 'badge-qr'],
  open: ['Terhubung', 'badge-open'],
  closed: ['Terputus — menyambung ulang', 'badge-closed'],
  logged_out: ['Keluar — scan ulang diperlukan', 'badge-logged_out'],
};

// ---- Tabs ----
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $('tab-' + t.dataset.tab).classList.add('active');
    if (t.dataset.tab === 'pesan') loadMessages();
    if (t.dataset.tab === 'percakapan') loadConversations();
    if (t.dataset.tab === 'template') loadTemplates();
    if (t.dataset.tab === 'ringkasan') loadStats();
  });
});

function rangeParams() {
  const p = new URLSearchParams();
  if ($('filterFrom').value) p.set('from', $('filterFrom').value);
  if ($('filterTo').value) p.set('to', $('filterTo').value);
  return p;
}

// ---- Status & QR ----
async function loadStatus() {
  try {
    const s = await (await fetch('/api/status')).json();
    const [label, cls] = stateLabel[s.state] || [s.state, 'badge-starting'];
    const badge = $('statusBadge');
    badge.textContent = label;
    badge.className = 'badge ' + cls;
    $('phoneInfo').textContent = s.state === 'open' && s.phoneNumber
      ? '📱 ' + s.phoneNumber.replace(/:.*$/, '') : (s.lastError ? 'Error: ' + s.lastError : '');

    const qrPanel = $('qrPanel');
    if (s.state === 'qr' && s.qrDataUrl) {
      qrPanel.classList.remove('hidden');
      $('qrImg').src = s.qrDataUrl;
    } else {
      qrPanel.classList.add('hidden');
    }
  } catch (e) { /* server belum siap */ }
}

$('btnReconnect').addEventListener('click', async () => {
  await fetch('/api/reconnect', { method: 'POST' });
  setTimeout(loadStatus, 1000);
});
$('btnRescan').addEventListener('click', async () => {
  if (confirm('Hapus sesi lama dan tampilkan QR baru? Nomor hotline harus scan ulang.')) {
    await fetch('/api/rescan', { method: 'POST' });
    setTimeout(loadStatus, 1000);
  }
});

// ---- Stats ----
async function loadStats() {
  const s = await (await fetch('/api/stats?' + rangeParams())).json();
  $('statHariIni').textContent = s.masuk_hari_ini;
  $('statMingguIni').textContent = s.masuk_minggu_ini;
  $('statBulanIni').textContent = s.masuk_bulan_ini;
  $('statUnik').textContent = s.pengirim_unik_range;
  $('statMasuk').textContent = s.masuk_range;
  $('statKeluar').textContent = s.keluar_range;

  // chart 14 hari
  const max = Math.max(1, ...s.daily.map(d => d.masuk + d.keluar));
  $('chart').innerHTML = s.daily.map(d => {
    const hIn = (d.masuk / max) * 150;
    const hOut = (d.keluar / max) * 150;
    return `<div class="bar-col" title="${d.date}: masuk ${d.masuk}, keluar ${d.keluar}">
      <div class="bar-stack" style="height:${hIn + hOut}px">
        <div class="bar-out" style="height:${hOut}px"></div>
        <div class="bar-in" style="height:${hIn}px"></div>
      </div>
      <div class="bar-label">${d.date.slice(5)}</div>
    </div>`;
  }).join('');

  // menu breakdown
  const maxMenu = Math.max(1, ...s.menu_terpilih.map(m => m.n));
  $('menuBreakdown').innerHTML = s.menu_terpilih.length
    ? s.menu_terpilih.map(m => `<div class="row"><span>${m.menu_choice}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(m.n / maxMenu) * 100}%"></div></div>
        <span><b>${m.n}</b></span></div>`).join('')
    : '<div class="muted small">Belum ada data.</div>';

  $('topSenders').innerHTML = s.top_pengirim.length
    ? s.top_pengirim.map(t => `<div class="row"><span class="num">${(t.name || '') + ' '}${t.jid.replace(/@s\.whatsapp\.net|@lid/g, '')}</span><span><b>${t.n}</b> pesan</span></div>`).join('')
    : '<div class="muted small">Belum ada data.</div>';
}

// ---- Messages log ----
async function loadMessages() {
  const p = rangeParams();
  p.set('page', currentPage);
  p.set('limit', 100);
  if ($('searchQ').value) p.set('q', $('searchQ').value);
  const data = await (await fetch('/api/messages?' + p)).json();
  $('msgTotal').textContent = `Total ${data.total} pesan`;
  $('pageInfo').textContent = `Halaman ${data.page} dari ${data.pages || 1}`;
  $('msgBody').innerHTML = data.rows.map(r => {
    const t = new Date(r.ts).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const dir = r.direction === 'in' ? '<span class="dir-in">MASUK</span>' : '<span class="dir-out">KELUAR</span>';
    const num = r.jid.replace(/@s\.whatsapp\.net|@lid/g, '');
    return `<tr>
      <td>${t}</td><td>${dir}</td><td>${num}</td><td>${esc(r.name || '')}</td>
      <td class="cell-text">${esc(r.text || '')}</td><td>${esc(r.menu_choice || '')}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" class="muted">Tidak ada data.</td></tr>';
}
$('btnSearch').addEventListener('click', () => { currentPage = 1; loadMessages(); });
$('searchQ').addEventListener('keydown', e => { if (e.key === 'Enter') { currentPage = 1; loadMessages(); } });
$('btnReset').addEventListener('click', () => {
  $('searchQ').value = ''; $('filterFrom').value = ''; $('filterTo').value = '';
  currentPage = 1; loadMessages(); loadStats();
});
$('prevPage').addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadMessages(); } });
$('nextPage').addEventListener('click', () => { currentPage++; loadMessages(); });
$('filterFrom').addEventListener('change', () => { currentPage = 1; loadMessages(); loadStats(); });
$('filterTo').addEventListener('change', () => { currentPage = 1; loadMessages(); loadStats(); });

// ---- Conversations ----
async function loadConversations() {
  const list = await (await fetch('/api/conversations')).json();
  $('convList').innerHTML = list.length ? list.map(c => {
    const num = c.jid.replace(/@s\.whatsapp\.net|@lid/g, '');
    return `<div class="conv-item ${activeJid === c.jid ? 'active' : ''}" data-jid="${c.jid}">
      <div class="num">${esc(c.name || '')} ${num}</div>
      <div class="last">${c.last_dir === 'out' ? '→ ' : '← '}${esc((c.last_text || '').slice(0, 60))}</div>
    </div>`;
  }).join('') : '<div class="muted small">Belum ada percakapan.</div>';
  document.querySelectorAll('.conv-item').forEach(el => {
    el.addEventListener('click', () => { activeJid = el.dataset.jid; loadConversations(); loadThread(activeJid); });
  });
}
async function loadThread(jid) {
  const rows = await (await fetch('/api/conversation/' + encodeURIComponent(jid))).json();
  $('convTitle').textContent = 'Riwayat — ' + jid.replace(/@s\.whatsapp\.net|@lid/g, '');
  $('convThread').innerHTML = rows.map(r => {
    const t = new Date(r.ts).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    return `<div class="bubble ${r.direction}">${esc(r.text || '')}<span class="meta">${t}</span></div>`;
  }).join('') || '<div class="muted">Tidak ada pesan.</div>';
  $('convThread').scrollTop = $('convThread').scrollHeight;
}

// ---- Template Editor (CRUD: Edit, Tambah, Hapus, Simpan) ----
async function loadTemplates() {
  const list = await (await fetch('/api/templates')).json();
  const builtin = list.filter(t => t.type === 'builtin');
  const custom = list.filter(t => t.type === 'custom');
  $('builtinList').innerHTML = builtin.map(tplCard).join('');
  $('customList').innerHTML = custom.length
    ? custom.map(tplCard).join('')
    : '<div class="empty-hint">Belum ada aturan tambahan. Klik "+ Tambah Aturan Balasan" untuk membuat balasan otomatis berbasis keyword.</div>';
  $('tplStatus').textContent = `Total: ${builtin.length} template bawaan, ${custom.length} aturan tambahan.`;
  wireTplCards();
}

function tplCard(t) {
  const isCustom = t.type === 'custom';
  const keywordField = isCustom
    ? `<div class="tpl-row">
         <input class="tpl-input" data-field="keyword" placeholder="Keyword (misal: harga, jam operasional)" value="${esc(t.keyword || '')}">
         <input class="tpl-input" data-field="label" placeholder="Nama aturan" value="${esc(t.label || '')}">
       </div>`
    : `<input type="hidden" data-field="label" value="${esc(t.label)}">`;
  return `<div class="tpl-card ${t.type}" data-id="${t.id}">
    <div class="tpl-card-header">
      <div class="tpl-card-title">${esc(t.label)}<span class="tpl-key">${isCustom ? 'custom' : t.name}</span></div>
      <div class="tpl-card-actions">
        <span class="tpl-msg"></span>
        <button class="btn btn-sm btn-primary btn-save">Simpan</button>
        ${isCustom ? '<button class="btn btn-sm btn-danger btn-del">Hapus</button>' : ''}
      </div>
    </div>
    ${keywordField}
    <textarea class="tpl-textarea" data-field="text" placeholder="Isi balasan...">${esc(t.text)}</textarea>
  </div>`;
}

function wireTplCards() {
  document.querySelectorAll('.tpl-card').forEach(card => {
    const id = card.dataset.id;
    card.querySelector('.btn-save').addEventListener('click', async () => {
      const msg = card.querySelector('.tpl-msg');
      const body = {
        label: card.querySelector('[data-field="label"]').value,
        keyword: card.querySelector('[data-field="keyword"]')?.value || '',
        text: card.querySelector('[data-field="text"]').value,
      };
      if (!body.text.trim()) { msg.textContent = 'Isi balasan tidak boleh kosong!'; msg.className = 'tpl-msg tpl-error'; return; }
      msg.textContent = 'Menyimpan...'; msg.className = 'tpl-msg muted';
      const r = await fetch('/api/templates/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (r.ok) { msg.textContent = '✓ Tersimpan'; msg.className = 'tpl-msg tpl-saved'; setTimeout(() => msg.textContent = '', 2000); }
      else { const e = await r.json().catch(()=>({})); msg.textContent = 'Gagal: ' + (e.error || ''); msg.className = 'tpl-msg tpl-error'; }
    });
    const delBtn = card.querySelector('.btn-del');
    if (delBtn) delBtn.addEventListener('click', async () => {
      if (!confirm('Hapus aturan balasan ini?')) return;
      const r = await fetch('/api/templates/' + id, { method: 'DELETE' });
      if (r.ok) loadTemplates();
      else { const e = await r.json().catch(()=>({})); alert('Gagal hapus: ' + (e.error || '')); }
    });
  });
}

$('btnAddCustom').addEventListener('click', async () => {
  const keyword = prompt('Keyword pemicu balasan (misal: "jam operasional" atau "lokasi"):\n\nJika pesan masuk mengandung keyword ini, bot akan membalas dengan teks yang Anda tentukan.');
  if (!keyword) return;
  const text = prompt('Isi balasan otomatis untuk keyword "' + keyword + '":') || '(belum diisi)';
  const r = await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, label: keyword, text }) });
  if (r.ok) loadTemplates();
  else { const e = await r.json().catch(()=>({})); alert('Gagal tambah: ' + (e.error || '')); }
});
$('btnReloadTpl').addEventListener('click', loadTemplates);

// ---- Export ----
$('btnExportCsv').addEventListener('click', () => { window.location = '/api/export.csv?' + rangeParams(); });
$('btnExportPdf').addEventListener('click', () => { window.location = '/api/export.pdf?' + rangeParams(); });

// ---- helpers ----
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---- init + auto refresh ----
loadStatus();
loadStats();
setInterval(() => {
  loadStatus();
  if ($('tab-ringkasan').classList.contains('active')) loadStats();
  if ($('tab-pesan').classList.contains('active')) loadMessages();
}, 10000);
