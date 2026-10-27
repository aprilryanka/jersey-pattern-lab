import '../styles/base.css';
import '../styles/page.css';
import { sb, isAdmin } from '../lib/supabase.js';
import { mountNav } from '../lib/nav.js';
import { $, $$, E, rp, fmtDate, toast, modal, shrinkImage } from '../lib/ui.js';
import { panelsFromDXF, matchPanels } from '../lib/dxf.js';

let me = null;
const view = $('#view');
const STATUS = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' };
const ORDER_ST = ['pending_payment', 'waiting_verification', 'paid', 'production', 'shipped', 'done', 'cancelled'];
const ORDER_LB = { pending_payment: 'Belum bayar', waiting_verification: 'Cek bayar', paid: 'Lunas', production: 'Produksi', shipped: 'Dikirim', done: 'Selesai', cancelled: 'Batal' };
const slugify = s => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60);
const card = (title, ...kids) => E('section', { className: 'card-l' }, title ? E('h2', { text: title }) : null, ...kids);
const tbl = (head, rows) => E('div', { className: 'tw' }, E('table', { className: 'tbl' }, E('thead', {}, E('tr', {}, head.map(h => E('th', { text: h })))), E('tbody', {}, rows)));
const confirmBtn = (label, fn, cls = 'btn sm danger') => { const b = E('button', { className: cls, text: label }); b.onclick = async () => { if (b.dataset.c !== '1') { b.dataset.c = '1'; b.textContent = 'Yakin?'; setTimeout(() => { b.dataset.c = ''; b.textContent = label; }, 3000); return; } b.disabled = true; await fn(); }; return b; };

/* ---------- Ringkasan ---------- */
async function overview() {
  const { data: s, error } = await sb.rpc('admin_stats');
  if (error) { view.append(card('Ringkasan', E('p', { className: 'err', text: error.message }))); return; }
  const k = (label, val, sub, alert) => E('div', { className: 'kpi' + (alert ? ' alert' : '') }, E('span', { text: label }), E('b', { text: val }), sub ? E('small', { text: sub }) : null);
  view.append(E('div', { className: 'kpis' },
    k('Pendapatan bulan ini', rp(s.revenue_month), 'Total ' + rp(s.revenue_total)),
    k('Member Pro aktif', s.pro_active, 'dari ' + s.users + ' pengguna'),
    k('Menunggu verifikasi', s.pending_payments, s.pending_payments ? 'Buka tab Pembayaran' : 'Semua sudah diproses', s.pending_payments > 0),
    k('Pengguna baru 30 hari', s.users_30d, s.projects + ' project tersimpan'),
  ));
  view.append(E('div', { className: 'kpis' },
    k('Pesanan berjalan', s.orders_open), k('Model 3D aktif', s.models), k('Total pengguna', s.users), k('Project', s.projects)));
  view.append(await trafficCard());
  const { data: recent } = await sb.from('payments').select('created_at,amount,status,user_id').order('created_at', { ascending: false }).limit(6);
  view.append(card('Pembayaran terbaru', tbl(['Tanggal', 'Jumlah', 'Status'], (recent || []).map(r => E('tr', {}, E('td', { text: fmtDate(r.created_at) }), E('td', { className: 'num', text: rp(r.amount) }), E('td', {}, E('span', { className: 'pill-s ' + r.status, text: STATUS[r.status] })))))));
  setBadge(s.pending_payments);
}
/* ---------- statistik pengunjung ---------- */
const NS = 'http://www.w3.org/2000/svg';
const S = (tag, attrs = {}, ...kids) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); kids.forEach(c => c != null && el.append(c)); return el; };
const nf = n => (+n || 0).toLocaleString('id-ID');
const dLabel = d => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

function trafficChart(daily) {
  const W = 760, H = 240, L = 36, R = 10, T = 14, B = 26, iw = W - L - R, ih = H - T - B;
  const max = Math.max(4, ...daily.map(d => d.views));
  const step = Math.pow(10, Math.floor(Math.log10(max))), top = Math.ceil(max / step) * step;
  const y = v => T + ih - (v / top) * ih, bw = iw / daily.length;
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 'tchart', role: 'img', 'aria-label': 'Grafik pengunjung harian' });
  for (let i = 0; i <= 4; i++) { const v = top * i / 4, yy = y(v); svg.append(S('line', { x1: L, x2: W - R, y1: yy, y2: yy, class: 'grid' }), S('text', { x: L - 6, y: yy + 4, class: 'ax', 'text-anchor': 'end' }, nf(Math.round(v)))); }
  const every = Math.ceil(daily.length / 7);
  daily.forEach((d, i) => {
    const x = L + i * bw, h = Math.max(0, T + ih - y(d.visitors));
    const g = S('g', { class: 'col' }, S('title', {}, `${dLabel(d.day)}: ${nf(d.visitors)} pengunjung, ${nf(d.views)} halaman dibuka`),
      S('rect', { x: x, y: T, width: bw, height: ih, class: 'hit' }),
      S('rect', { x: x + bw * .18, y: T + ih - h, width: Math.max(1, bw * .64), height: h, rx: Math.min(3, bw * .2), class: 'bar' }));
    svg.append(g);
    if (i % every === 0 || i === daily.length - 1) svg.append(S('text', { x: x + bw / 2, y: H - 8, class: 'ax', 'text-anchor': 'middle' }, dLabel(d.day)));
  });
  const pts = daily.map((d, i) => `${(L + i * bw + bw / 2).toFixed(1)},${y(d.views).toFixed(1)}`).join(' ');
  svg.append(S('polyline', { points: pts, class: 'line' }));
  daily.forEach((d, i) => svg.append(S('circle', { cx: L + i * bw + bw / 2, cy: y(d.views), r: daily.length > 40 ? 0 : 2.5, class: 'dot' })));
  return svg;
}

async function trafficCard() {
  const range = E('div', { className: 'seg-a', role: 'group', 'aria-label': 'Rentang waktu' });
  const body = E('div', { className: 'tbody-a' }, E('p', { className: 'empty', text: 'Memuat statistik…' }));
  const c = card('Pengunjung web', range, body);
  const list = (title, rows, map = k => k) => E('div', { className: 'tlist' }, E('h3', { text: title }),
    rows.length ? E('ol', {}, rows.map(r => E('li', {}, E('span', { text: map(r.k) }), E('b', { text: nf(r.n) })))) : E('p', { className: 'empty', text: 'Belum ada data.' }));
  const PATH = { '/': 'Beranda', '/studio': 'Studio', '/login': 'Masuk / daftar', '/billing': 'Langganan', '/akun': 'Akun' };
  const DEV = { mobile: 'HP', tablet: 'Tablet', desktop: 'Laptop / PC' };
  async function load(days) {
    [...range.children].forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.d === days)));
    const { data, error } = await sb.rpc('admin_traffic', { p_days: days });
    if (error) { body.replaceChildren(E('p', { className: 'err', text: error.message })); return; }
    const k = (label, val) => E('div', { className: 'tk' }, E('span', { text: label }), E('b', { text: nf(val) }));
    body.replaceChildren(
      E('div', { className: 'tks' }, k('Pengunjung hari ini', data.today_visitors), k(`Pengunjung ${days} hari`, data.total_visitors), k(`Halaman dibuka ${days} hari`, data.total_views)),
      E('div', { className: 'tlegend' }, E('span', { className: 'lg-bar', text: 'Pengunjung unik' }), E('span', { className: 'lg-line', text: 'Halaman dibuka' })),
      E('div', { className: 'tchart-w' }, trafficChart(data.daily)),
      E('div', { className: 'tlists' }, list('Halaman teratas', data.pages, p => PATH[p] || p), list('Sumber pengunjung', data.referrers), list('Perangkat', data.devices, d => DEV[d] || d)),
      ...(data.total_views ? [] : [E('p', { className: 'hint', text: 'Statistik mulai tercatat sejak fitur ini aktif. Data akan terisi seiring orang membuka website.' })]));
  }
  [[7, '7 hari'], [30, '30 hari'], [90, '90 hari']].forEach(([d, t]) => range.append(E('button', { type: 'button', text: t, 'data-d': d, on: { click: () => load(d) } })));
  load(30);
  return c;
}

function setBadge(n) { const b = $('#badgePay'); b.hidden = !n; b.textContent = n; }

/* ---------- Pembayaran ---------- */
async function payments() {
  const filter = E('select', { className: 'in' }, E('option', { value: 'pending', text: 'Menunggu verifikasi' }), E('option', { value: 'all', text: 'Semua' }));
  const box = E('div');
  view.append(card('Pembayaran', E('div', { className: 'toolbar' }, filter), box));
  const users = await userMap();
  async function load() {
    box.replaceChildren(E('p', { className: 'empty', text: 'Memuat…' }));
    let q = sb.from('payments').select('*').order('created_at', { ascending: false }).limit(200);
    if (filter.value === 'pending') q = q.eq('status', 'pending');
    const { data, error } = await q;
    if (error) { box.replaceChildren(E('p', { className: 'err', text: error.message })); return; }
    setBadge(filter.value === 'pending' ? data.length : (data.filter(d => d.status === 'pending').length));
    if (!data.length) { box.replaceChildren(E('p', { className: 'empty', text: 'Tidak ada pembayaran untuk ditampilkan.' })); return; }
    const rows = await Promise.all(data.map(async r => {
      const { data: su } = await sb.storage.from('payment-proofs').createSignedUrl(r.proof_url, 3600);
      const img = su ? E('img', { className: 'proof', src: su.signedUrl, alt: 'Bukti transfer', on: { click: () => modal('Bukti transfer', E('img', { src: su.signedUrl, alt: 'Bukti transfer', style: { width: '100%', borderRadius: '10px' } }), { wide: true }) } }) : E('span', { text: '—' });
      const note = E('input', { className: 'in', placeholder: 'Catatan (opsional)', maxLength: 140, style: { minWidth: '140px' } });
      const u = users[r.user_id];
      const act = r.status === 'pending' ? E('div', { className: 'acts' }, note,
        E('button', { className: 'btn sm primary', text: 'Setujui', on: { click: e => review(r.id, true, note.value, e.target) } }),
        E('button', { className: 'btn sm danger', text: 'Tolak', on: { click: e => review(r.id, false, note.value || 'Bukti tidak valid', e.target) } }))
        : E('span', { className: 'hint', text: (r.note || '') + (r.verified_at ? ' · ' + fmtDate(r.verified_at) : '') });
      return E('tr', {}, E('td', {}, img), E('td', {}, E('b', { text: u?.email || r.user_id.slice(0, 8) }), E('br'), E('small', { className: 'hint', text: fmtDate(r.created_at) })),
        E('td', { text: r.subscription_plan ? 'Pro 30 hari' : 'Pesanan' }), E('td', { className: 'num', text: rp(r.amount) }),
        E('td', {}, E('span', { className: 'pill-s ' + r.status, text: STATUS[r.status] })), E('td', {}, act));
    }));
    box.replaceChildren(tbl(['Bukti', 'Pengguna', 'Paket', 'Jumlah', 'Status', 'Aksi'], rows));
  }
  async function review(id, ok, note, btn) {
    btn.disabled = true;
    const { error } = await sb.rpc('review_payment', { p_id: id, p_approve: ok, p_note: note || null });
    if (error) { toast('Gagal: ' + error.message); btn.disabled = false; return; }
    toast(ok ? 'Disetujui. Pro aktif 30 hari.' : 'Pembayaran ditolak.'); load();
  }
  filter.onchange = load; load();
}

let _users = null;
async function userMap(force) {
  if (_users && !force) return _users;
  const { data } = await sb.rpc('admin_users');
  _users = Object.fromEntries((data || []).map(u => [u.id, u]));
  return _users;
}

/* ---------- Pengguna ---------- */
async function users() {
  const q = E('input', { className: 'in', type: 'search', placeholder: 'Cari email atau nama' });
  const box = E('div');
  view.append(card('Pengguna', E('div', { className: 'toolbar' }, q), box));
  const map = await userMap(true), list = Object.values(map);
  const draw = () => {
    const s = q.value.toLowerCase();
    const rows = list.filter(u => !s || (u.email || '').toLowerCase().includes(s) || (u.name || '').toLowerCase().includes(s)).slice(0, 300).map(u => {
      const active = u.plan !== 'free' && u.plan_until && new Date(u.plan_until) > new Date();
      const left = active ? Math.ceil((new Date(u.plan_until) - Date.now()) / 864e5) : 0;
      const upd = async (patch, msg) => { const { error } = await sb.from('profiles').update(patch).eq('id', u.id); if (error) return toast('Gagal: ' + error.message); Object.assign(u, patch); toast(msg); draw(); };
      const endOfDay = d => { const x = new Date(d); x.setHours(23, 59, 59, 0); return x; };
      // tambah hari (dari tanggal berakhir bila masih aktif)
      const days = E('input', { className: 'in', type: 'number', value: 30, min: 1, max: 3650, style: { width: '70px' }, 'aria-label': 'Jumlah hari' });
      const addDays = () => { const n = Math.round(+days.value); if (!n || n < 1) return toast('Isi jumlah hari'); const base = active ? new Date(u.plan_until) : new Date(); base.setDate(base.getDate() + n); upd({ plan: 'pro', plan_until: base.toISOString() }, `Pro +${n} hari, berakhir ${fmtDate(base)}`); };
      // atur sisa hari persis (dihitung dari hari ini)
      const setLeft = () => { const n = Math.round(+days.value); if (n == null || n < 1) return toast('Isi jumlah hari'); const d = new Date(); d.setDate(d.getDate() + n); upd({ plan: 'pro', plan_until: endOfDay(d).toISOString() }, `Sisa Pro diatur ${n} hari, berakhir ${fmtDate(d)}`); };
      // atur tanggal berakhir langsung
      const iso = active ? new Date(new Date(u.plan_until).getTime() + 7 * 36e5).toISOString().slice(0, 10) : '';
      const date = E('input', { className: 'in', type: 'date', value: iso, min: new Date().toISOString().slice(0, 10), style: { width: '150px' }, 'aria-label': 'Tanggal berakhir Pro' });
      const setDate = () => { if (!date.value) return toast('Pilih tanggal berakhir'); const d = endOfDay(date.value + 'T00:00:00'); if (d <= new Date()) return toast('Tanggal harus setelah hari ini'); upd({ plan: 'pro', plan_until: d.toISOString() }, 'Pro berakhir ' + fmtDate(d)); };
      const status = u.role === 'admin' ? E('span', { className: 'pill-s pro', text: 'ADMIN' })
        : active ? E('div', {}, E('span', { className: 'pill-s approved', text: 'PRO s/d ' + fmtDate(u.plan_until) }), E('br'), E('small', { className: 'hint' + (left <= 5 ? ' warn-t' : ''), text: 'sisa ' + left + ' hari' }))
        : E('span', { className: 'pill-s', text: 'GRATIS' });
      const acts = u.role === 'admin' ? E('span', { className: 'hint', text: 'Admin selalu Pro' }) : E('div', { className: 'uacts' },
        E('div', { className: 'acts' }, days, E('span', { className: 'hint', text: 'hari' }),
          E('button', { className: 'btn sm', text: active ? '+ Tambah' : '+ Pro', title: 'Tambah hari dari tanggal berakhir', on: { click: addDays } }),
          active ? E('button', { className: 'btn sm', text: 'Atur sisa', title: 'Jadikan sisa masa Pro persis sejumlah hari ini, dihitung dari hari ini', on: { click: setLeft } }) : null),
        E('div', { className: 'acts' }, date, E('button', { className: 'btn sm', text: 'Atur tanggal', on: { click: setDate } }),
          active ? confirmBtn('Cabut Pro', () => upd({ plan: 'free', plan_until: null }, 'Pro dicabut'), 'btn sm') : null,
          u.id !== me.user.id ? E('button', { className: 'btn sm danger', text: u.banned ? 'Buka blokir' : 'Blokir', on: { click: () => upd({ banned: !u.banned }, u.banned ? 'Blokir dibuka' : 'Pengguna diblokir') } }) : null));
      return E('tr', {},
        E('td', {}, E('b', { text: u.email }), E('br'), E('small', { className: 'hint', text: (u.name || '—') + ' · daftar ' + fmtDate(u.created_at) })),
        E('td', {}, status, u.banned ? E('span', { className: 'pill-s rejected', text: ' DIBLOKIR' }) : null),
        E('td', { className: 'num', text: u.projects }),
        E('td', {}, acts));
    });
    box.replaceChildren(rows.length ? tbl(['Pengguna', 'Status', 'Project', 'Aksi'], rows) : E('p', { className: 'empty', text: 'Tidak ada pengguna yang cocok.' }));
  };
  q.oninput = draw; draw();
}

/* ---------- Model 3D ---------- */
async function models() {
  const grid = E('div', { className: 'mgrid' });
  view.append(card('Model 3D jersey',
    E('p', { className: 'hint', text: 'Setiap model butuh dua file dari CLO3D: GLB (Export → glTF dengan Unified/Pattern UV) dan DXF pola (Export → DXF-AAMA). UV di GLB harus memakai koordinat pola dalam mm.' }),
    E('div', { className: 'toolbar' }, E('button', { className: 'btn primary', text: '+ Import model baru', on: { click: importModel } })), grid));
  const { data, error } = await sb.from('garment_models').select('*').order('sort');
  if (error) { grid.append(E('p', { className: 'err', text: error.message })); return; }
  (data || []).forEach(m => {
    const name = E('input', { className: 'in', value: m.name, 'aria-label': 'Nama model' });
    const size = E('input', { className: 'in', value: m.size_label || 'M', 'aria-label': 'Ukuran', style: { width: '70px' } });
    grid.append(E('article', { className: 'mcard' },
      E('div', { className: 'th' }, m.thumbnail_url ? E('img', { src: m.thumbnail_url, alt: m.name }) : E('span', { className: 'hint', text: 'Tanpa thumbnail' })),
      E('div', { className: 'body' },
        E('b', { text: m.name }), E('small', { text: `${m.slug} · ${m.neck || '—'} · ${m.panels.length} panel` }),
        E('div', { className: 'row' }, name, size),
        E('div', { className: 'acts' },
          m.is_default ? E('span', { className: 'pill-s pro', text: 'DEFAULT' }) : E('button', { className: 'btn sm', text: 'Jadikan default', on: { click: async () => { await sb.from('garment_models').update({ is_default: false }).neq('id', m.id); await sb.from('garment_models').update({ is_default: true }).eq('id', m.id); toast('Model default diganti'); go('models'); } } }),
          E('button', { className: 'btn sm', text: m.active ? 'Sembunyikan' : 'Tampilkan', on: { click: async () => { await sb.from('garment_models').update({ active: !m.active }).eq('id', m.id); go('models'); } } }),
          E('button', { className: 'btn sm', text: 'Simpan', on: { click: async () => { const { error } = await sb.from('garment_models').update({ name: name.value.trim() || m.name, size_label: size.value.trim() || 'M' }).eq('id', m.id); toast(error ? 'Gagal: ' + error.message : 'Tersimpan'); } } }),
          m.is_default ? null : confirmBtn('Hapus', async () => {
            if (m.glb_url.includes('/storage/v1/object/public/models/')) await sb.storage.from('models').remove([m.glb_url.split('/models/').pop(), `${m.slug}.png`]);
            await sb.from('garment_models').delete().eq('id', m.id); toast('Model dihapus'); go('models');
          })))));
  });
}

async function importModel() {
  const { Viewer3D } = await import('../studio/viewer3d.js');
  const nameI = E('input', { className: 'in', placeholder: 'Jersey Basic O-Neck' });
  const slugI = E('input', { className: 'in', placeholder: 'jersey-basic-o-neck' });
  const neckI = E('input', { className: 'in', placeholder: 'O-neck' });
  const sizeI = E('input', { className: 'in', value: 'M' });
  const glbI = E('input', { type: 'file', accept: '.glb,model/gltf-binary' });
  const dxfI = E('input', { type: 'file', accept: '.dxf' });
  const status = E('p', { className: 'hint', text: 'Pilih file GLB dan DXF untuk mulai menganalisis.' });
  const plist = E('div', { style: { display: 'grid', gap: '6px' } });
  const save = E('button', { className: 'btn primary', text: 'Simpan model', disabled: true });
  const cv = E('canvas'); const pv = E('div', { className: 'preview3d' }, cv);
  const m = modal('Import model 3D', E('div', { className: 'import' },
    E('div', { style: { display: 'grid', gap: '10px', alignContent: 'start' } },
      E('label', { className: 'field' }, 'Nama model', nameI), E('div', { className: 'formgrid' }, E('label', { className: 'field' }, 'Slug', slugI), E('label', { className: 'field' }, 'Kerah', neckI)),
      E('label', { className: 'field' }, 'Ukuran pola', sizeI),
      E('label', { className: 'field' }, 'File GLB (CLO3D)', glbI), E('label', { className: 'field' }, 'File DXF pola', dxfI),
      status, plist, save),
    pv), { wide: true, onClose: () => { viewer && viewer.renderer.dispose(); } });
  nameI.oninput = () => { if (!slugI.dataset.touched) slugI.value = slugify(nameI.value); };
  slugI.oninput = () => { slugI.dataset.touched = '1'; };
  let viewer = null, panels = null, glbFile = null, glbUrl = null;

  async function analyze() {
    if (!glbI.files[0] || !dxfI.files[0]) return;
    save.disabled = true; plist.replaceChildren(); status.textContent = 'Menganalisis…';
    try {
      glbFile = glbI.files[0]; glbUrl && URL.revokeObjectURL(glbUrl); glbUrl = URL.createObjectURL(glbFile);
      if (!viewer) viewer = new Viewer3D(cv, { autoRotate: true });
      const g = await viewer.setModel(glbUrl);
      // info mesh: bbox UV mentah dalam koordinat DXF + titik tengah 3D
      const THREE = await import('three');
      const info = g.meshes.map(mesh => {
        const a = mesh.geometry.attributes.uv; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (let i = 0; i < a.count; i++) { const u = a.getX(i) * g.uv.Wmm + g.uv.uMin, v = a.getY(i) * g.uv.Hmm + g.uv.v0, y = -v; if (u < x0) x0 = u; if (u > x1) x1 = u; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        const c = new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3());
        return { uvBB: { minX: x0, maxX: x1, minY: y0, maxY: y1 }, center: c };
      });
      const center = new THREE.Box3().setFromObject(g.scene).getCenter(new THREE.Vector3());
      info.forEach(i => { i.center = { x: i.center.x - center.x, y: i.center.y - center.y, z: i.center.z - center.z }; });
      const dxf = panelsFromDXF(await dxfI.files[0].text());
      if (!dxf.length) throw new Error('Tidak ada garis potong (polyline tertutup) di DXF.');
      panels = matchPanels(dxf, info);
      const bad = panels.filter(p => p.err > 20);
      status.textContent = `${g.meshes.length} mesh · ${dxf.length} panel · ${g.tris.toLocaleString('id-ID')} segitiga · atlas ${g.uv.Wmm.toFixed(0)} × ${g.uv.Hmm.toFixed(0)} mm`;
      if (g.uv.Wmm < 50) status.textContent += ' · UV terlihat 0..1, bukan mm: ekspor ulang dari CLO3D dengan opsi Unified/Pattern UV.';
      panels.forEach(p => {
        const role = E('select', { className: 'in' }, ['front', 'back', 'sleeve', 'rib', 'other'].map(r => E('option', { value: r, text: { front: 'Depan', back: 'Belakang', sleeve: 'Lengan', rib: 'Rib / trim', other: 'Lainnya' }[r], selected: p.role === r })));
        const lab = E('input', { className: 'in', value: p.label });
        role.onchange = () => p.role = role.value; lab.oninput = () => p.label = lab.value;
        plist.append(E('div', { className: 'prow' }, lab, role, E('small', { className: 'hint', text: `${((p.bb.maxX - p.bb.minX) / 10).toFixed(1)}×${((p.bb.maxY - p.bb.minY) / 10).toFixed(1)} cm` }),
          E('span', { className: p.err <= 20 ? 'ok-dot' : 'bad-dot', title: p.err <= 20 ? 'Cocok dengan mesh' : 'Tidak cocok dengan UV mesh mana pun' })));
      });
      if (bad.length) status.textContent += ` · ${bad.length} panel tidak cocok dengan UV, periksa ekspor.`;
      save.disabled = !!bad.length || !panels.some(p => p.role === 'front');
    } catch (e) { status.textContent = 'Gagal menganalisis: ' + (e.message || e); }
  }
  glbI.onchange = analyze; dxfI.onchange = analyze;

  save.onclick = async () => {
    const slug = slugify(slugI.value || nameI.value);
    if (!nameI.value.trim() || !slug) { status.textContent = 'Isi nama model dulu.'; return; }
    save.disabled = true; save.textContent = 'Mengunggah…';
    try {
      const up = await sb.storage.from('models').upload(`${slug}.glb`, glbFile, { upsert: true, contentType: 'model/gltf-binary' });
      if (up.error) throw up.error;
      const glb_url = sb.storage.from('models').getPublicUrl(`${slug}.glb`).data.publicUrl;
      let thumbnail_url = null;
      try {
        viewer.controls.autoRotate = false; viewer.setView('three', true);
        const c = await viewer.snapshot({ width: 600, height: 600, bg: { mode: 'transparent' }, views: ['three'] });
        const blob = await new Promise(r => c.toBlob(r, 'image/png'));
        const t = await sb.storage.from('models').upload(`${slug}.png`, blob, { upsert: true, contentType: 'image/png' });
        if (!t.error) thumbnail_url = sb.storage.from('models').getPublicUrl(`${slug}.png`).data.publicUrl + '?t=' + Date.now();
      } catch (e) { console.warn(e); }
      const row = { name: nameI.value.trim(), slug, neck: neckI.value.trim() || null, size_label: sizeI.value.trim() || 'M', glb_url, thumbnail_url,
        panels: panels.map(p => ({ id: p.id, label: p.label, role: p.role, pts: p.pts })), meta: { source: 'CLO3D', uv_units: 'mm', imported_by: me.user.email } };
      const { error } = await sb.from('garment_models').upsert(row, { onConflict: 'slug' });
      if (error) throw error;
      toast('Model tersimpan dan langsung tersedia di Studio'); m.close(); go('models');
    } catch (e) { status.textContent = 'Gagal menyimpan: ' + (e.message || e); save.disabled = false; save.textContent = 'Simpan model'; }
  };
}

/* ---------- Pesanan ---------- */
async function orders() {
  const box = E('div');
  view.append(card('Pesanan jersey fisik', box));
  const map = await userMap();
  const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) { box.append(E('p', { className: 'err', text: error.message })); return; }
  if (!data.length) { box.append(E('p', { className: 'empty', text: 'Belum ada pesanan. Pesanan cetak saat ini masuk lewat WhatsApp.' })); return; }
  box.append(tbl(['Kode', 'Pengguna', 'Total', 'Status', 'Resi'], data.map(o => {
    const st = E('select', { className: 'in' }, ORDER_ST.map(s => E('option', { value: s, text: ORDER_LB[s], selected: o.status === s })));
    const tr = E('input', { className: 'in', value: o.tracking_no || '', placeholder: 'No. resi' });
    const sv = async () => { const { error } = await sb.from('orders').update({ status: st.value, tracking_no: tr.value.trim() || null, updated_at: new Date().toISOString() }).eq('id', o.id); toast(error ? 'Gagal: ' + error.message : 'Pesanan diperbarui'); };
    st.onchange = sv; tr.onchange = sv;
    return E('tr', {}, E('td', { className: 'num', text: o.code }), E('td', { text: map[o.user_id]?.email || '—' }), E('td', { className: 'num', text: rp(o.total) }), E('td', {}, st), E('td', {}, tr));
  })));
}

/* ---------- Testimoni ---------- */
async function testimonials() {
  const list = E('div');
  const name = E('input', { className: 'in', placeholder: 'Nama pelanggan', maxLength: 60 });
  const role = E('input', { className: 'in', placeholder: 'Peran, misal: Kapten Garuda FC', maxLength: 80 });
  const quote = E('textarea', { className: 'in', rows: 3, placeholder: 'Kutipan asli dari pelanggan', maxLength: 400 });
  const photo = E('input', { type: 'file', accept: 'image/*' });
  const add = E('button', { className: 'btn primary', text: 'Tambah testimoni' });
  view.append(card('Testimoni',
    E('p', { className: 'hint', text: 'Hanya masukkan testimoni asli dengan izin pelanggan. Landing page menampilkan 3 testimoni aktif teratas; bila kosong, bagiannya disembunyikan.' }),
    E('div', { className: 'formgrid' }, E('label', { className: 'field' }, 'Nama', name), E('label', { className: 'field' }, 'Peran', role)),
    E('label', { className: 'field' }, 'Kutipan', quote), E('label', { className: 'field' }, 'Foto (opsional)', photo), add, list));
  async function load() {
    const { data } = await sb.from('testimonials').select('*').order('sort').order('id');
    list.replaceChildren(...(data || []).map(t => E('div', { className: 'tcard-a' },
      t.photo_url ? E('img', { src: t.photo_url, alt: '' }) : E('span', { className: 'av' }),
      E('div', {}, E('b', { text: t.name }), t.role ? E('small', { className: 'hint', text: ' · ' + t.role }) : null, E('p', { text: t.quote, style: { margin: '6px 0 0' } })),
      E('div', { className: 'acts' },
        E('button', { className: 'btn sm', text: t.active ? 'Sembunyikan' : 'Tampilkan', on: { click: async () => { await sb.from('testimonials').update({ active: !t.active }).eq('id', t.id); load(); } } }),
        E('input', { className: 'in', type: 'number', value: t.sort, style: { width: '64px' }, title: 'Urutan', on: { change: async e => { await sb.from('testimonials').update({ sort: +e.target.value }).eq('id', t.id); } } }),
        confirmBtn('Hapus', async () => { await sb.from('testimonials').delete().eq('id', t.id); load(); })))));
    if (!data || !data.length) list.append(E('p', { className: 'empty', text: 'Belum ada testimoni.' }));
  }
  add.onclick = async () => {
    if (!name.value.trim() || !quote.value.trim()) { toast('Isi nama dan kutipan'); return; }
    add.disabled = true;
    try {
      let photo_url = null;
      if (photo.files[0]) {
        const { canvas } = await shrinkImage(photo.files[0], 300, 'image/jpeg', .85);
        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', .85)), path = `testimonials/${Date.now()}.jpg`;
        const up = await sb.storage.from('cms').upload(path, blob, { contentType: 'image/jpeg' });
        if (up.error) throw up.error;
        photo_url = sb.storage.from('cms').getPublicUrl(path).data.publicUrl;
      }
      const { error } = await sb.from('testimonials').insert({ name: name.value.trim(), role: role.value.trim() || null, quote: quote.value.trim(), photo_url });
      if (error) throw error;
      name.value = role.value = quote.value = ''; photo.value = ''; toast('Testimoni ditambahkan'); load();
    } catch (e) { toast('Gagal: ' + (e.message || e)); } finally { add.disabled = false; }
  };
  load();
}

/* ---------- FAQ ---------- */
async function faqs() {
  const list = E('div', { style: { display: 'grid', gap: '10px' } });
  view.append(card('FAQ', E('div', { className: 'toolbar' }, E('button', { className: 'btn primary', text: '+ Pertanyaan baru', on: { click: async () => { await sb.from('faqs').insert({ question: 'Pertanyaan baru', answer: 'Jawaban.', sort: 99 }); load(); } } })), list));
  async function load() {
    const { data } = await sb.from('faqs').select('*').order('sort').order('id');
    list.replaceChildren(...(data || []).map(f => {
      const q = E('input', { className: 'in', value: f.question }), a = E('textarea', { className: 'in', rows: 3, value: f.answer }), s = E('input', { className: 'in', type: 'number', value: f.sort ?? 0, style: { width: '70px' } });
      return E('div', { className: 'card-l', style: { padding: '14px' } }, q, a, E('div', { className: 'acts' }, E('label', { className: 'field', style: { display: 'flex', alignItems: 'center', gap: '6px' } }, 'Urutan', s),
        E('button', { className: 'btn sm primary', text: 'Simpan', on: { click: async () => { const { error } = await sb.from('faqs').update({ question: q.value, answer: a.value, sort: +s.value }).eq('id', f.id); toast(error ? 'Gagal' : 'FAQ tersimpan'); } } }),
        confirmBtn('Hapus', async () => { await sb.from('faqs').delete().eq('id', f.id); load(); })));
    }));
  }
  load();
}

/* ---------- Pengaturan ---------- */
async function settings() {
  const { data } = await sb.from('settings').select('key,value');
  const S = Object.fromEntries((data || []).map(r => [r.key, r.value]));
  const bca = S.bca || {}, sub = S.subscription || { plan: 'pro', price: 150000, days: 30 };
  const f = {
    wa: E('input', { className: 'in', value: S.whatsapp || '6289634547665' }),
    bank: E('input', { className: 'in', value: bca.bank || 'BCA' }), no: E('input', { className: 'in', value: bca.account_no || '' }), an: E('input', { className: 'in', value: bca.account_name || '' }),
    price: E('input', { className: 'in', type: 'number', value: sub.price }), days: E('input', { className: 'in', type: 'number', value: sub.days }),
  };
  const btn = E('button', { className: 'btn primary', text: 'Simpan pengaturan' });
  view.append(card('Pengaturan',
    E('div', { className: 'formgrid' },
      E('label', { className: 'field' }, 'Nomor WhatsApp (format 62…)', f.wa),
      E('label', { className: 'field' }, 'Bank', f.bank), E('label', { className: 'field' }, 'Nomor rekening', f.no), E('label', { className: 'field' }, 'Atas nama', f.an),
      E('label', { className: 'field' }, 'Harga langganan Pro (Rp)', f.price), E('label', { className: 'field' }, 'Masa aktif (hari)', f.days)),
    E('p', { className: 'hint', text: 'Harga di halaman Langganan dan nominal pembayaran mengikuti angka ini. Harga di kartu landing page mengikuti tabel plans.' }), btn));
  btn.onclick = async () => {
    btn.disabled = true;
    const price = Math.max(0, +f.price.value | 0), days = Math.max(1, +f.days.value | 0);
    const rows = [
      { key: 'whatsapp', value: f.wa.value.replace(/\D/g, '') },
      { key: 'bca', value: { bank: f.bank.value.trim(), account_no: f.no.value.trim(), account_name: f.an.value.trim() } },
      { key: 'subscription', value: { plan: 'pro', price, days } },
    ];
    const { error } = await sb.from('settings').upsert(rows);
    if (!error) await sb.from('plans').update({ price_monthly: price }).eq('id', 'pro');
    toast(error ? 'Gagal: ' + error.message : 'Pengaturan tersimpan'); btn.disabled = false;
  };
  view.append(notifyCard((S.notify || {}).ntfy_topic || ''));
}

/* notifikasi HP lewat aplikasi ntfy (gratis, tanpa akun) */
function notifyCard(topic) {
  const tI = E('input', { className: 'in num', value: topic, readOnly: true, 'aria-label': 'Topik notifikasi' });
  const copy = E('button', { className: 'btn sm', text: 'Salin', on: { click: () => navigator.clipboard?.writeText(tI.value).then(() => toast('Topik tersalin')) } });
  const test = E('button', { className: 'btn primary', text: 'Kirim notifikasi tes' });
  const regen = confirmBtn('Ganti topik', async () => {
    const t = 'jpl-' + [...crypto.getRandomValues(new Uint8Array(9))].map(b => b.toString(16).padStart(2, '0')).join('');
    const { error } = await sb.from('settings').upsert({ key: 'notify', value: { ntfy_topic: t } });
    if (error) return toast('Gagal: ' + error.message);
    tI.value = t; toast('Topik baru dibuat. Subscribe ulang di aplikasi ntfy.'); regen.disabled = false;
  }, 'btn sm');
  test.onclick = async () => { test.disabled = true; const { error } = await sb.rpc('admin_test_notify'); toast(error ? 'Gagal: ' + error.message : 'Terkirim. Cek HP kamu dalam beberapa detik.'); test.disabled = false; };
  return card('Notifikasi HP',
    E('p', { className: 'hint', text: 'Setiap ada pengguna yang mengirim bukti transfer, HP kamu langsung dapat notifikasi berisi email dan nominalnya. Ketuk notifikasinya untuk membuka tab Pembayaran.' }),
    E('ol', { className: 'pay-steps' },
      E('li', {}, 'Pasang aplikasi ', E('b', { text: 'ntfy' }), ' (gratis): ', E('a', { href: 'https://apps.apple.com/app/ntfy/id1625396347', target: '_blank', rel: 'noopener', text: 'iPhone' }), ' · ', E('a', { href: 'https://play.google.com/store/apps/details?id=io.heckel.ntfy', target: '_blank', rel: 'noopener', text: 'Android' }), '.'),
      E('li', {}, 'Buka ntfy, ketuk ', E('b', { text: '+' }), ', tempel topik di bawah, lalu Subscribe. Izinkan notifikasi saat diminta.'),
      E('li', {}, 'Tekan "Kirim notifikasi tes" untuk memastikan sudah masuk.')),
    E('div', { className: 'acts' }, tI, copy, regen),
    E('p', { className: 'hint', text: 'Rahasiakan topik ini: siapa pun yang tahu topiknya bisa ikut menerima notifikasi. Bila bocor, tekan Ganti topik.' }),
    test);
}

/* ---------- router ---------- */
const VIEWS = { overview, payments, users, models, orders, testimonials, faqs, settings };
async function go(t) {
  $$('.atabs button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.t === t)));
  view.replaceChildren();
  try { await VIEWS[t](); } catch (e) { view.append(E('p', { className: 'err', text: e.message || String(e) })); }
  history.replaceState(null, '', '/admin#' + t);
}
$$('.atabs button').forEach(b => b.onclick = () => go(b.dataset.t));

(async () => {
  me = await mountNav('admin');
  if (!me) { location.href = '/login?next=/admin'; return; }
  if (!isAdmin(me)) { view.append(card('Akses ditolak', E('p', { text: 'Halaman ini khusus admin.' }), E('a', { className: 'btn', href: '/studio', text: 'Ke Studio' }))); $('.atabs').hidden = true; return; }
  const t = location.hash.slice(1);
  go(VIEWS[t] ? t : 'overview');
})();
