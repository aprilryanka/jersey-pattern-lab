import '../styles/base.css';
import '../styles/studio.css';
import '../styles/arc.css';
import { initArc } from '../studio/arc-ui.js';
import { sb, isPro } from '../lib/supabase.js';
import { mountNav } from '../lib/nav.js';
import { $, $$, E, toast, modal, download, withProgress, shrinkImage } from '../lib/ui.js';
import { BASIC_STYLES, BASIC_PALETTES, drawBasicThumb, drawBasic } from '../studio/basic.js';
import { initAdvanced } from '../studio/advanced.js';
import { layoutModel, renderAtlas, renderLayers, FONTS } from '../studio/atlas.js';
import { Viewer3D } from '../studio/viewer3d.js';
import { Editor2D } from '../studio/editor2d.js';
import { exportPattern, exportSewingSVG, exportSewingPNG } from '../studio/exporter.js';
import { startTour, tourSeen } from '../studio/tour.js';
import { VEC_DEFAULT, VEC_SLIDERS, vecSource, vectorize } from '../studio/vectorize.js';
import DEFAULT_PANELS from '../studio/default-panels.json';

const fmt = (n, d = 1) => (+n).toFixed(d).replace('.', ',');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const PHONE = matchMedia('(max-width: 760px)').matches;
const TEX_PX = PHONE ? 2048 : 3072; // tekstur lebih kecil di HP agar ringan
const DEFAULT_MODEL = { id: null, name: 'Jersey Basic V-Neck', slug: 'jersey-basic-v-neck', size_label: 'M', glb_url: '/models/jersey-basic-v-neck.glb', panels: DEFAULT_PANELS };

/* ---------------- state ---------------- */
const S = {
  mode: 'basic',
  basic: { style: 'chevron', colors: [...BASIC_PALETTES[0]], seed: 11, scale: 1 },
  edit: { scale: 1, rot: 0, offX: 0, offY: 0, flip: false, seam: true, repeats: 2 },
  panelFill: {}, ribColor: '#f2b705',
  layers: [],
  fabric: { knit: 2.7, normal: .25, sheen: .25 },
  bg: { mode: 'studio', color: '#ffffff' }, shadow: true,
};
let me = null, pro = false, L = null, model = null, models = [], adv = null, advPending = null;
let projectId = null, dirtySince = 0, layerSeq = 1, selId = null, units = 'cm';
let base, bctx, atlas, actx, sc = 1;

/* ---------------- render pipeline ---------------- */
let needBase = true, needLayers = true;
const invalidateBase = () => { needBase = true; needLayers = true; patDirty = true; markDirty(); };
const invalidateLayers = () => { needLayers = true; markDirty(); };
let layout = 'split', patDirty = true, patRep = 2;
const show3D = () => layout === 'split' || layout === '3d';
const show2D = () => layout === 'split' || layout === '2d';
function frame() {
  requestAnimationFrame(frame);
  if (!L || !base) return;
  if (layout === 'pattern') { if (patDirty) { patDirty = false; drawPatternPane(); } return; } // atlas & 3D tidak dirender
  if (needBase) { renderAtlas(bctx, L, S, adv, sc, { layers: false }); needBase = false; }
  if (needLayers) {
    actx.setTransform(1, 0, 0, 1, 0, 0); actx.drawImage(base, 0, 0);
    renderLayers(actx, L, S, sc);
    if (show3D()) viewer.setTexture(atlas);
    editor.invalidate(); needLayers = false;
  }
}

/** Pastikan tekstur 3D terbaru (dipakai sebelum snapshot saat pane 3D sedang disembunyikan). */
function flushTexture() {
  if (!L || !base) return;
  if (needBase) { renderAtlas(bctx, L, S, adv, sc, { layers: false }); needBase = false; }
  actx.setTransform(1, 0, 0, 1, 0, 0); actx.drawImage(base, 0, 0); renderLayers(actx, L, S, sc);
  viewer.setTexture(atlas); needLayers = !show2D() ? false : needLayers;
}

/* ---------------- pane Pattern (paling ringan: hanya motif) ---------------- */
function drawPatternPane() {
  const c = $('#cpat'), r = c.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
  if (!r.width) return;
  c.width = Math.round(r.width * d); c.height = Math.round(r.height * d);
  const ctx = c.getContext('2d'), side = Math.min(r.width, r.height) - 32, x0 = (r.width - side) / 2, y0 = (r.height - side) / 2;
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--stage'); ctx.fillRect(0, 0, r.width, r.height);
  ctx.save(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0, y0, side, side, 14) : ctx.rect(x0, y0, side, side); ctx.clip();
  if (S.mode === 'advanced' && adv) {
    const t = side / patRep;
    for (let i = 0; i < patRep; i++) for (let j = 0; j < patRep; j++) ctx.drawImage(adv.pat, x0 + i * t, y0 + j * t, t, t);
    $('#patInfo').textContent = 'Tile Advanced · bisa diulang tanpa sambungan';
  } else {
    const mm = 300 * patRep, k = side / mm;
    ctx.translate(x0, y0); ctx.scale(k, k);
    ctx.translate(mm / 2, mm / 2); ctx.rotate((S.edit.rot || 0) * Math.PI / 180); ctx.scale((S.edit.scale || 1) * (S.edit.flip ? -1 : 1), S.edit.scale || 1); ctx.translate(-mm / 2, -mm / 2);
    const pad = mm;
    drawBasic(ctx, { x0: -pad, y0: -pad, x1: mm + pad, y1: mm + pad }, { ...S.basic, gh: mm });
    $('#patInfo').textContent = `Area ${mm / 10} × ${mm / 10} cm`;
  }
  ctx.restore();
}
$$('[data-rep]').forEach(b => b.onclick = () => { patRep = +b.dataset.rep; $$('[data-rep]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); patDirty = true; });
new ResizeObserver(() => { patDirty = true; }).observe($('#panePat'));

/* ---------------- 3D + 2D ---------------- */
const viewer = new Viewer3D($('#c3d'));
viewer.onUserMove = () => $$('[data-cam]').forEach(b => b.setAttribute('aria-pressed', 'false'));
const editor = new Editor2D($('#c2d'), {
  getLayout: () => L, getAtlas: () => atlas, getState: () => S, getUnits: () => units,
  onLayerChange: () => { invalidateLayers(); syncLayerForm(); },
  onSelect: id => { selId = id; syncLayers(); },
  onPanelClick: p => { highlightFill(p && p.id); },
});
editor.onZoom = pct => { $('#zPct').textContent = pct + '%'; };
$('#zIn').onclick = () => editor.zoomBy(1.25);
$('#zOut').onclick = () => editor.zoomBy(.8);
$('#zFit').onclick = () => editor.fit();

async function loadModels() {
  const q = sb.from('garment_models').select('id,name,slug,neck,size_label,glb_url,panels,is_default,sort').eq('active', true).order('is_default', { ascending: false }).order('sort');
  const { data, error } = await Promise.race([q, new Promise(r => setTimeout(() => r({ error: 'timeout' }), 6000))]);
  models = !error && data && data.length ? data : [DEFAULT_MODEL];
  const sel = $('#modelSel'); sel.innerHTML = '';
  models.forEach((m, i) => sel.append(E('option', { value: i, text: `${m.name} · ${m.size_label || 'M'}` })));
}

async function useModel(m, keepLayers = true) {
  $('#ov3d').hidden = false; $('#ov3d').textContent = 'Memuat model 3D…';
  try {
    const g = await viewer.setModel(m.glb_url);
    const lay = layoutModel(m.panels, g.uv);
    model = m; L = lay;
    // jaga tinggi atlas di bawah batas tekstur GPU (kalau lewat, model 3D tampil putih)
    sc = Math.min(TEX_PX / L.Wmm, Math.min(viewer.maxTex, 8192) / L.Hmm);
    if (!base) { base = E('canvas'); atlas = E('canvas'); bctx = base.getContext('2d'); actx = atlas.getContext('2d'); }
    base.width = atlas.width = Math.round(L.Wmm * sc); base.height = atlas.height = Math.round(L.Hmm * sc);
    // pindahkan layer ke panel padanannya (berdasarkan peran) bila model berganti
    const roleOf = id => (L.byId[id] ? null : 'x');
    for (const Ly of S.layers) if (roleOf(Ly.panel)) { const want = Ly._role || 'front'; const p = L.panels.find(q => q.role === want) || L.panels.find(q => !q.rib); Ly.panel = p.id; Ly.lx = clamp(Ly.lx, 0, p.w); Ly.ly = clamp(Ly.ly, 0, p.h); }
    if (!keepLayers || !S.layers.length) defaultLayers();
    for (const id of Object.keys(S.panelFill)) if (!L.byId[id]) delete S.panelFill[id];
    $('#pcount').textContent = `${L.panels.length} panel · ukuran ${m.size_label || 'M'}`;
    $('#foot2d').textContent = `Atlas UV ${fmt(L.Wmm)} × ${fmt(L.Hmm)} mm · tekstur ${atlas.width}×${atlas.height} px`;
    buildPanelFills(); buildPanelSelect(); syncLayers();
    editor.fitted = false; editor.fit(true);
    viewer.applyFabric(S.fabric); viewer.setShadow(S.shadow);
    $('#ov3d').hidden = true;
    invalidateBase();
  } catch (e) {
    console.error(e);
    $('#ov3d').textContent = 'Model 3D gagal dimuat: ' + (e.message || e);
  }
}

/* ---------------- default layer ---------------- */
const panelByRole = r => L.panels.find(p => p.role === r) || L.panels.find(p => !p.rib);
function newText(role, o) {
  const p = panelByRole(role);
  const Ly = { id: 'l' + (layerSeq++), type: 'text', panel: p.id, _role: role, text: 'TEKS', font: 0, size: 70, color: '#ffffff', stroke: '#0b1d3a', strokeW: 0, rot: 0, opacity: 1, italic: false, lx: p.w / 2, ly: p.h * .5, ...o };
  if (typeof Ly.lx === 'function') Ly.lx = Ly.lx(p); if (typeof Ly.ly === 'function') Ly.ly = Ly.ly(p);
  S.layers.push(Ly); return Ly;
}
function defaultLayers() {
  S.layers = [];
  newText('front', { text: 'JAPAN', size: 62, ly: p => p.h * .3 }); // tanpa angka, belakang kosong
  contrastText();
}
const lum = hex => { const n = parseInt(hex.slice(1), 16); return (.2126 * (n >> 16) + .7152 * (n >> 8 & 255) + .0722 * (n & 255)) / 255; };
function contrastText() {
  const c = S.mode === 'basic' ? (lum(S.basic.colors[0]) > .55 ? '#111111' : '#ffffff') : '#ffffff';
  for (const Ly of S.layers) if (Ly.type === 'text') { Ly.color = c; Ly.stroke = c === '#ffffff' ? '#0b1d3a' : '#ffffff'; }
}

/* ---------------- tab, layout, unit, kamera ---------------- */
function setTab(name) {
  $$('.tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  $$('.tabpane').forEach(p => p.hidden = p.dataset.pane !== name);
}
$$('.tabs [data-tab]').forEach(b => b.onclick = () => setTab(b.dataset.tab));
function setLayout(name) {
  layout = name;
  $('#main').dataset.layout = name;
  $$('[data-layout]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.layout === name)));
  viewer.paused = !show3D(); editor.hidden = !show2D();
  needLayers = true; patDirty = true;
  try { localStorage.setItem('jpl_layout', name); } catch (e) { }
  requestAnimationFrame(() => { if (show2D()) { editor.resize(); editor.fit(true); } if (show3D()) viewer.resize(); });
}
$$('[data-layout]').forEach(b => b.onclick = () => setLayout(b.dataset.layout));
{ // HP: default satu tampilan (Pola 2D) agar ringan; pilihan terakhir diingat
  let saved = null; try { saved = localStorage.getItem('jpl_layout'); } catch (e) { }
  setLayout(['split', '2d', '3d', 'pattern'].includes(saved) ? saved : PHONE ? '2d' : 'split');
}
$$('[data-unit]').forEach(b => b.onclick = () => { units = b.dataset.unit; $$('[data-unit]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); editor.invalidate(); });
$$('[data-cam]').forEach(b => b.onclick = () => { viewer.setView(b.dataset.cam); $$('[data-cam]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
$('#spin').onclick = e => { viewer.controls.autoRotate = !viewer.controls.autoRotate; e.currentTarget.setAttribute('aria-pressed', String(viewer.controls.autoRotate)); };
$('#modelSel').onchange = e => useModel(models[+e.target.value]);

/* ---------------- mode Basic / Advanced ---------------- */
function setMode(mode) {
  $$('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  $('#basicPanel').hidden = mode !== 'basic'; $('#advPanel').hidden = mode !== 'advanced';
  if (mode === 'advanced') {
    ensureAdv();
    const ok = pro || !!import.meta.env.VITE_PREVIEW;
    $('#advLock').hidden = ok; $('#advHost').classList.toggle('locked', !ok);
    if (!ok) { toast('Mode Advanced khusus member Pro'); return; }
  }
  S.mode = mode; $('#repWrap').hidden = mode !== 'advanced';
  invalidateBase();
}
$$('[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));
let hiT = 0;
function ensureAdv() {
  if (adv) return adv;
  adv = initAdvanced($('#advHost'), {
    onChange: () => {
      if (S.mode !== 'advanced') return;
      invalidateBase();
      clearTimeout(hiT); hiT = setTimeout(() => { if (S.mode === 'advanced') { adv.ensure(1024); invalidateBase(); } }, 650);
    },
  });
  if (advPending) { adv.setState(advPending); advPending = null; }
  setTimeout(() => adv.thumbs(), 400);
  return adv;
}

/* ---------------- Basic UI ---------------- */
const styleBox = $('#styles');
for (const [id, label] of BASIC_STYLES) {
  const b = E('button', { type: 'button', 'data-style': id, 'aria-pressed': 'false' }, E('canvas', { width: 72, height: 72 }), label);
  b.onclick = () => { S.basic.style = id; syncBasic(); invalidateBase(); };
  styleBox.append(b);
}
BASIC_PALETTES.forEach(p => {
  const b = E('button', { type: 'button', title: p.join(' '), 'aria-label': 'Palet ' + p.join(' '), style: { background: `linear-gradient(90deg,${p[0]} 50%,${p[1]} 50% 82%,${p[2]} 82%)` } });
  b.onclick = () => { S.basic.colors = [...p]; contrastText(); syncBasic(); invalidateBase(); };
  $('#palettes').append(b);
});
function drawThumbs() { $$('#styles button').forEach(b => drawBasicThumb(b.querySelector('canvas'), { ...S.basic, style: b.dataset.style })); }
function syncBasic() {
  $$('#styles button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.style === S.basic.style)));
  S.basic.colors.forEach((c, i) => $('#col' + i).value = c);
  $('#bScale').value = S.basic.scale; $('#vScale').textContent = '×' + fmt(S.basic.scale, 2);
  drawThumbs();
}
for (let i = 0; i < 3; i++) $('#col' + i).oninput = e => { S.basic.colors[i] = e.target.value; drawThumbs(); invalidateBase(); };
$('#bScale').oninput = e => { S.basic.scale = +e.target.value; $('#vScale').textContent = '×' + fmt(S.basic.scale, 2); drawThumbs(); invalidateBase(); };
function rollColors() { const p = BASIC_PALETTES[Math.random() * BASIC_PALETTES.length | 0]; S.basic.colors = Math.random() < .5 ? [...p] : [...p].sort(() => Math.random() - .5); }
$('#rollCol').onclick = () => { rollColors(); contrastText(); syncBasic(); invalidateBase(); invalidateLayers(); };
$('#rollSeed').onclick = () => { S.basic.seed = Math.random() * 99999 | 0; invalidateBase(); };
$('#rollAll').onclick = () => {
  const ch = BASIC_STYLES.map(s => s[0]).filter(s => s !== 'solid');
  S.basic.style = ch[Math.random() * ch.length | 0]; S.basic.seed = Math.random() * 99999 | 0; S.basic.scale = +(.6 + Math.random() * 1.3).toFixed(2);
  S.edit.rot = [0, 0, 0, 15, 30, 45, 60, 90][Math.random() * 8 | 0];
  rollColors(); S.ribColor = S.basic.colors[1 + (Math.random() * 2 | 0)]; contrastText();
  syncBasic(); syncEdit(); buildPanelFills(); invalidateBase();
};

/* ---------------- Edit pattern ---------------- */
const EDIT = [['eScale', 'scale', v => '×' + fmt(v, 2)], ['eRot', 'rot', v => Math.round(v) + '°'], ['eX', 'offX', v => (units === 'in' ? fmt(v / 25.4) + ' in' : fmt(v / 10) + ' cm')], ['eY', 'offY', v => (units === 'in' ? fmt(v / 25.4) + ' in' : fmt(v / 10) + ' cm')], ['eRep', 'repeats', v => '×' + v]];
function syncEdit() {
  for (const [id, k, f] of EDIT) { $('#' + id).value = S.edit[k]; $('#v' + id.replace('e', 'E')).textContent = f(S.edit[k]); }
  $('#eFlip').checked = !!S.edit.flip; $('#eSeam').checked = S.edit.seam !== false; $('#ribColor').value = S.ribColor;
}
for (const [id, k, f] of EDIT) $('#' + id).oninput = e => { S.edit[k] = +e.target.value; $('#v' + id.replace('e', 'E')).textContent = f(S.edit[k]); invalidateBase(); };
$('#eFlip').onchange = e => { S.edit.flip = e.target.checked; invalidateBase(); };
$('#eSeam').onchange = e => { S.edit.seam = e.target.checked; invalidateBase(); };
$('#eReset').onclick = () => { Object.assign(S.edit, { scale: 1, rot: 0, offX: 0, offY: 0, flip: false, seam: true, repeats: 2 }); syncEdit(); invalidateBase(); };
$('#ribColor').oninput = e => { S.ribColor = e.target.value; buildPanelFills(); invalidateBase(); };

function buildPanelFills() {
  const box = $('#panelFills'); box.innerHTML = '';
  if (!L) return;
  for (const p of L.panels) {
    const f = S.panelFill[p.id] || (p.rib ? { mode: 'solid', color: S.ribColor } : { mode: 'pattern', color: S.basic.colors[0] });
    const sel = E('select', { 'aria-label': 'Isi ' + p.label }, E('option', { value: 'pattern', text: 'Pattern', selected: f.mode === 'pattern' }), E('option', { value: 'solid', text: 'Warna polos', selected: f.mode === 'solid' }));
    const col = E('input', { type: 'color', value: f.color || S.ribColor, 'aria-label': 'Warna ' + p.label, disabled: f.mode !== 'solid' });
    const upd = () => { S.panelFill[p.id] = { mode: sel.value, color: col.value }; col.disabled = sel.value !== 'solid'; invalidateBase(); };
    sel.onchange = upd; col.oninput = upd;
    box.append(E('div', { className: 'pf', 'data-panel': p.id }, E('span', { text: p.label }), sel, col));
  }
}
function highlightFill(id) {
  $$('.pf').forEach(r => r.classList.toggle('sel', r.dataset.panel === id));
  if (id) { setTab('edit'); const r = $(`.pf[data-panel="${id}"]`); r && r.scrollIntoView({ block: 'nearest' }); }
}

/* ---------------- Elemen (teks, logo, sponsor) ---------------- */
FONTS.forEach((f, i) => $('#lFont').append(E('option', { value: i, text: f[0], style: { fontFamily: `"${f[1]}"` } })));
function buildPanelSelect() { const s = $('#lPanel'); s.innerHTML = ''; L.panels.filter(p => !p.rib).forEach(p => s.append(E('option', { value: p.id, text: p.label }))); }
const cur = () => S.layers.find(l => l.id === selId);
function syncLayers() {
  const box = $('#layerList'); box.innerHTML = '';
  [...S.layers].reverse().forEach(Ly => {
    const b = E('button', { type: 'button', 'aria-pressed': String(Ly.id === selId) },
      Ly.type === 'image' ? E('img', { src: Ly.src, alt: '' }) : null,
      E('span', { text: Ly.type === 'image' ? (Ly.name || 'Gambar') : (Ly.text || '(kosong)') }),
      E('small', { text: L?.byId[Ly.panel]?.label || '' }));
    b.onclick = () => { selId = Ly.id; editor.sel = Ly.id; editor.invalidate(); syncLayers(); };
    box.append(b);
  });
  editor.sel = selId; editor.invalidate();
  syncLayerForm();
}
function syncLayerForm() {
  const Ly = cur(), f = $('#layerForm');
  f.classList.toggle('off', !Ly);
  if (!Ly) return;
  const isImg = Ly.type === 'image';
  $$('[data-for="text"]', f).forEach(el => el.hidden = isImg);
  $$('[data-for="image"]', f).forEach(el => el.hidden = !isImg);
  if (!isImg) {
    if (document.activeElement !== $('#lText')) $('#lText').value = Ly.text;
    $('#lFont').value = Ly.font; $('#lSize').value = Ly.size; $('#vLSize').textContent = Math.round(Ly.size) + ' mm';
    $('#lColor').value = Ly.color; $('#lStroke').value = Ly.stroke; $('#lStrokeW').value = Ly.strokeW; $('#vLSW').textContent = fmt(Ly.strokeW) + ' mm'; $('#lItalic').checked = !!Ly.italic;
  } else { $('#lW').value = Ly.w; $('#vLW').textContent = Math.round(Ly.w) + ' mm'; }
  $('#lRot').value = Ly.rot || 0; $('#vLRot').textContent = Math.round(Ly.rot || 0) + '°';
  $('#lOp').value = Ly.opacity ?? 1; $('#vLOp').textContent = Math.round((Ly.opacity ?? 1) * 100) + '%';
  $('#lPanel').value = Ly.panel;
}
const bindL = (id, ev, fn) => $('#' + id).addEventListener(ev, e => { const Ly = cur(); if (!Ly) return; fn(Ly, e.target); invalidateLayers(); syncLayerForm(); if (id === 'lText' || id === 'lPanel') syncLayersSoft(); });
function syncLayersSoft() { const keep = document.activeElement; syncLayers(); keep && keep.focus && keep.focus(); }
bindL('lText', 'input', (Ly, t) => Ly.text = t.value);
bindL('lFont', 'change', (Ly, t) => { Ly.font = +t.value; document.fonts.load(`80px "${FONTS[Ly.font][1]}"`).then(invalidateLayers); });
bindL('lSize', 'input', (Ly, t) => Ly.size = +t.value);
bindL('lW', 'input', (Ly, t) => Ly.w = +t.value);
bindL('lColor', 'input', (Ly, t) => Ly.color = t.value);
bindL('lStroke', 'input', (Ly, t) => Ly.stroke = t.value);
bindL('lStrokeW', 'input', (Ly, t) => Ly.strokeW = +t.value);
bindL('lItalic', 'change', (Ly, t) => Ly.italic = t.checked);
bindL('lRot', 'input', (Ly, t) => Ly.rot = +t.value);
bindL('lOp', 'input', (Ly, t) => Ly.opacity = +t.value);
bindL('lPanel', 'change', (Ly, t) => { const p = L.byId[t.value]; Ly.panel = p.id; Ly._role = p.role; Ly.lx = clamp(Ly.lx, 0, p.w); Ly.ly = clamp(Ly.ly, 0, p.h); });
$('#lCenter').onclick = () => { const Ly = cur(); if (!Ly) return; Ly.lx = L.byId[Ly.panel].w / 2; invalidateLayers(); };
$('#lDup').onclick = () => { const Ly = cur(); if (!Ly) return; const c = { ...Ly, id: 'l' + (layerSeq++), ly: Ly.ly + 40 }; S.layers.push(c); selId = c.id; syncLayers(); invalidateLayers(); };
$('#lDel').onclick = () => { const i = S.layers.findIndex(l => l.id === selId); if (i < 0) return; S.layers.splice(i, 1); selId = null; syncLayers(); invalidateLayers(); };
const move = d => { const i = S.layers.findIndex(l => l.id === selId), j = i + d; if (i < 0 || j < 0 || j >= S.layers.length) return; [S.layers[i], S.layers[j]] = [S.layers[j], S.layers[i]]; syncLayers(); invalidateLayers(); };
$('#lUp').onclick = () => move(1); $('#lDown').onclick = () => move(-1);
const addT = (role, o) => { const Ly = newText(role, o); if (S.mode === 'basic') { const c = lum(S.basic.colors[0]) > .55 ? '#111111' : '#ffffff'; Ly.color = c; } selId = Ly.id; syncLayers(); invalidateLayers(); setTab('elements'); };
$('#addName').onclick = () => addT('back', { text: 'NAMA', size: 58, ly: p => p.h * .2 });
$('#addNumber').onclick = () => addT('back', { text: '10', size: 250, ly: p => p.h * .46 });
$('#addText').onclick = () => addT('front', { text: 'TEKS', size: 60, ly: p => p.h * .6 });
function addImage(file, role, o) {
  if (!file) return;
  if (file.size > 8e6) { toast('Gambar terlalu besar, maksimal 8 MB'); return; }
  shrinkImage(file, 1400, 'image/png').then(({ dataUrl }) => {
    const p = panelByRole(role), img = new Image();
    img.onload = () => {
      const Ly = { id: 'l' + (layerSeq++), type: 'image', panel: p.id, _role: role, src: dataUrl, img, name: file.name.replace(/\.[^.]+$/, '').slice(0, 30), rot: 0, opacity: 1, ...o, lx: o.lx(p), ly: o.ly(p) };
      S.layers.push(Ly); selId = Ly.id; syncLayers(); invalidateLayers(); toast('Gambar ditambahkan. Seret di pola 2D untuk memindahkan.');
    };
    img.src = dataUrl;
  }).catch(() => toast('Gambar tidak bisa dibaca'));
}
$('#upTeam').onchange = e => { addImage(e.target.files[0], 'front', { w: 80, lx: p => p.w * .7, ly: p => p.h * .2 }); e.target.value = ''; };
$('#upSponsor').onchange = e => { addImage(e.target.files[0], 'front', { w: 230, lx: p => p.w / 2, ly: p => p.h * .36 }); e.target.value = ''; };
$('#upApparel').onchange = e => { addImage(e.target.files[0], 'front', { w: 55, lx: p => p.w * .3, ly: p => p.h * .2 }); e.target.value = ''; };
document.addEventListener('keydown', e => {
  const t = e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
  const Ly = cur(); if (!Ly) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); $('#lDel').click(); }
  else if (e.key.startsWith('Arrow')) { e.preventDefault(); const d = e.shiftKey ? 20 : 2; if (e.key === 'ArrowLeft') Ly.lx -= d; if (e.key === 'ArrowRight') Ly.lx += d; if (e.key === 'ArrowUp') Ly.ly -= d; if (e.key === 'ArrowDown') Ly.ly += d; invalidateLayers(); }
});

/* ---------------- Tampilan ---------------- */
function syncView() {
  $$('[data-bg]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.bg === S.bg.mode)));
  const w = $('#wrap3d');
  w.classList.toggle('bg-studio', S.bg.mode === 'studio'); w.classList.toggle('bg-transparent', S.bg.mode === 'transparent');
  w.style.background = S.bg.mode === 'solid' ? S.bg.color : '';
  $('#bgColorWrap').hidden = S.bg.mode !== 'solid'; $('#bgColor').value = S.bg.color;
  $('#floorShadow').checked = S.shadow; viewer.setShadow(S.shadow);
  for (const [id, k, f] of [['knit', 'knit', v => fmt(v) + ' mm'], ['normal', 'normal', v => fmt(v, 2)], ['sheen', 'sheen', v => fmt(v, 2)]]) { $('#' + id).value = S.fabric[k]; $('#v' + id[0].toUpperCase() + id.slice(1)).textContent = f(S.fabric[k]); }
}
$$('[data-bg]').forEach(b => b.onclick = () => { S.bg.mode = b.dataset.bg; syncView(); markDirty(); });
$('#bgColor').oninput = e => { S.bg.color = e.target.value; syncView(); markDirty(); };
$('#floorShadow').onchange = e => { S.shadow = e.target.checked; syncView(); markDirty(); };
for (const [id, f] of [['knit', v => fmt(v) + ' mm'], ['normal', v => fmt(v, 2)], ['sheen', v => fmt(v, 2)]]) {
  $('#' + id).oninput = e => { S.fabric[id] = +e.target.value; $('#v' + id[0].toUpperCase() + id.slice(1)).textContent = f(S.fabric[id]); viewer.applyFabric(S.fabric); markDirty(); };
}

/* ---------------- Export SVG pattern (vectorize) ---------------- */
// Sama seperti versi sebelumnya: sumber = pattern yang sedang dibuat. Pratinjau gratis (bertanda air),
// unduh / salin SVG khusus Pro.
let vecOpt = { ...VEC_DEFAULT }, vecKind = 'pattern';
function watermark(ctx, w, h) {
  ctx.save(); ctx.globalAlpha = .5; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = Math.max(1, w / 900);
  ctx.font = `600 ${Math.round(w / 22)}px Inter, sans-serif`; ctx.textAlign = 'center';
  ctx.translate(w / 2, h / 2); ctx.rotate(-Math.PI / 6);
  const step = w / 4;
  for (let y = -h; y < h; y += step * .6) for (let x = -w; x < w; x += step * 1.4) { ctx.strokeText('JERSEY PATTERN LAB', x, y); ctx.fillText('JERSEY PATTERN LAB', x, y); }
  ctx.restore();
}
function openVector() {
  let result = null, busy = false, url = null;
  const src = E('select', { className: 'in' },
    E('option', { value: 'pattern', text: S.mode === 'advanced' ? 'Pattern saat ini (tile seamless)' : 'Pattern saat ini (area 60 × 60 cm)', selected: vecKind === 'pattern' }),
    E('option', { value: 'sheet', text: 'Pola jahit lengkap (semua panel + teks)', selected: vecKind === 'sheet' }));
  src.onchange = () => { vecKind = src.value; };
  const sliders = VEC_SLIDERS.map(([k, label, mn, mx, st, f]) => {
    const v = E('span', { className: 'v', text: f(vecOpt[k]) });
    const r = E('input', { type: 'range', min: mn, max: mx, step: st, value: vecOpt[k] });
    r.oninput = () => { vecOpt[k] = +r.value; v.textContent = f(vecOpt[k]); };
    return E('label', { className: 'field' }, label, v, r);
  });
  const go = E('button', { className: 'btn primary', type: 'button', text: 'Buat vector' });
  const img = E('img', { alt: 'Hasil vektor SVG' });
  const stat = E('p', { className: 'hint', role: 'status', 'aria-live': 'polite' });
  const dl = E('button', { className: 'btn primary', type: 'button', text: 'Unduh SVG' });
  const cp = E('button', { className: 'btn', type: 'button', text: 'Salin kode SVG' });
  const up = E('a', { className: 'btn primary', href: me ? '/billing' : '/login?mode=signup&next=/billing', text: 'Unduh SVG khusus member Pro' });
  const actions = E('div', { className: 'row' }, ...(pro ? [dl, cp] : [up]));
  const out = E('div', { className: 'vecout', hidden: true }, E('div', { className: 'vecpv checker' }, img), stat, actions);
  const body = E('div', { className: 'vecmod' },
    E('p', { className: 'hint', style: { margin: 0 }, text: 'Hasilnya berwarna datar (posterize), bukan foto asli. Makin banyak warna dan resolusi, makin detail tapi file makin besar.' }),
    E('label', { className: 'field' }, 'Sumber', src), ...sliders, go, out);
  const m = modal('Export SVG pattern', body, { wide: true, onClose: () => { url && URL.revokeObjectURL(url); } });
  go.onclick = () => {
    if (busy) return; busy = true; go.disabled = true; go.textContent = 'Membuat vector…'; stat.textContent = '';
    flushTexture();
    setTimeout(() => {
      try {
        const s = vecSource({ kind: vecKind, S, adv, atlas, res: vecOpt.res, blur: vecOpt.blur, texSize: S.mode === 'advanced' ? 1024 : 560 });
        result = vectorize(s, vecOpt);
        if (S.mode === 'advanced') invalidateBase();
        if (!result) { stat.textContent = 'Tidak ada bentuk yang bisa diproses.'; return; }
        out.hidden = false;
        stat.textContent = `${result.colors} warna · ${result.paths} lapis · ${result.kb.toLocaleString('id-ID')} KB · ${result.w} × ${result.h}`;
        url && URL.revokeObjectURL(url);
        url = URL.createObjectURL(new Blob([result.svg], { type: 'image/svg+xml' }));
        if (pro) img.src = url;
        else {
          const im = new Image();
          im.onload = () => {
            const c = E('canvas', { width: result.w, height: result.h }), x = c.getContext('2d');
            x.drawImage(im, 0, 0); watermark(x, result.w, result.h); img.src = c.toDataURL('image/jpeg', .8);
            URL.revokeObjectURL(url); url = null; result.svg = '';
          };
          im.src = url;
        }
      } catch (e) { console.error(e); stat.textContent = 'Gagal membuat vector: ' + (e.message || e); }
      finally { busy = false; go.disabled = false; go.textContent = 'Buat ulang vector'; }
    }, 40);
  };
  dl.onclick = () => { if (!pro || !result?.svg) return; download(new Blob([result.svg], { type: 'image/svg+xml' }), `jpl-pattern-vector-${vecKind}.svg`); toast('SVG diunduh'); };
  cp.onclick = async () => { if (!pro || !result?.svg) return; try { await navigator.clipboard.writeText(result.svg); toast('Kode SVG disalin'); } catch { toast('Tidak bisa menyalin, pakai Unduh SVG'); } };
  return m;
}
$('#btnVector').onclick = openVector;
// ganti tema: kanvas 2D & pane pattern membaca token warna, jadi gambar ulang
document.addEventListener('themechange', () => { editor.invalidate(); patDirty = true; });

/* ---------------- simpan / muat ---------------- */
function serialize() {
  return {
    pattern_config: { v: 2, mode: S.mode, basic: { ...S.basic, trace: S.basic.trace ? { src: S.basic.trace.src, tile: S.basic.trace.tile, gap: S.basic.trace.gap, half: S.basic.trace.half } : undefined }, edit: S.edit, adv: adv ? adv.getState() : advPending },
    editor_state: { v: 2, model: model?.slug, panelFill: S.panelFill, ribColor: S.ribColor, fabric: S.fabric, bg: S.bg, shadow: S.shadow, layers: S.layers.map(({ img, _w, _h, ...r }) => r) },
  };
}
async function deserialize(pc = {}, es = {}) {
  if (pc.basic) S.basic = { ...S.basic, ...pc.basic };
  if (S.basic.trace && S.basic.trace.src) { const T = S.basic.trace; T.img = new Image(); await new Promise(r => { T.img.onload = T.img.onerror = r; T.img.src = T.src; }); } else { S.basic.trace = undefined; }
  if (pc.edit) S.edit = { ...S.edit, ...pc.edit };
  Object.assign(S, { panelFill: es.panelFill || {}, ribColor: es.ribColor || S.ribColor, fabric: { ...S.fabric, ...(es.fabric || {}) }, bg: { ...S.bg, ...(es.bg || {}) }, shadow: es.shadow !== false });
  S.layers = (es.layers || []).map(l => ({ ...l }));
  layerSeq = S.layers.reduce((m, l) => Math.max(m, +String(l.id).slice(1) || 0), 0) + 1;
  await Promise.all(S.layers.filter(l => l.type === 'image' && l.src).map(l => new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = l.src; l.img = i; })));
  S.layers.filter(l => l.type === 'text').forEach(l => document.fonts.load(`80px "${(FONTS[l.font] || FONTS[0])[1]}"`).then(invalidateLayers, () => { }));
  if (pc.adv) { if (adv) adv.setState(pc.adv); else advPending = pc.adv; }
  const m = models.find(x => x.slug === es.model);
  if (m && m !== model) { $('#modelSel').value = models.indexOf(m); await useModel(m, true); }
  syncBasic(); syncEdit(); syncView(); buildPanelFills(); syncLayers();
  setMode(pc.mode === 'advanced' && (pro || import.meta.env.VITE_PREVIEW) ? 'advanced' : 'basic');
  invalidateBase();
}
function markDirty() { dirtySince = Date.now(); $('#saveState').textContent = projectId ? 'Ada perubahan' : 'Belum disimpan'; scheduleDraft(); }
let draftT = 0;
function scheduleDraft() { clearTimeout(draftT); draftT = setTimeout(() => { try { localStorage.setItem('jpl_draft', JSON.stringify({ name: $('#projName').value, id: projectId, ...serialize() })); } catch (e) { } }, 1200); }

async function snapshotBlob(size = 480) {
  flushTexture();
  const c = await viewer.snapshot({ width: size, height: size, bg: S.bg.mode === 'transparent' ? { mode: 'studio' } : S.bg, views: ['front'] });
  return new Promise(r => c.toBlob(r, 'image/jpeg', .85));
}
async function save() {
  if (!me) { scheduleDraft(); location.href = '/login?next=' + encodeURIComponent('/studio'); return; }
  const btn = $('#btnSave'); btn.disabled = true; btn.textContent = 'Menyimpan…';
  try {
    const row = { name: $('#projName').value.trim() || 'Desain tanpa judul', ...serialize() };
    let res;
    if (projectId) res = await sb.from('projects').update(row).eq('id', projectId).select('id').single();
    else res = await sb.from('projects').insert({ ...row, user_id: me.user.id }).select('id').single();
    if (res.error) throw res.error;
    projectId = res.data.id;
    history.replaceState(null, '', '/studio?p=' + projectId);
    // thumbnail (tidak menggagalkan simpan bila error)
    try {
      const blob = await snapshotBlob();
      const path = `${me.user.id}/${projectId}.jpg`;
      const up = await sb.storage.from('thumbnails').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (!up.error) { const { data } = sb.storage.from('thumbnails').getPublicUrl(path); await sb.from('projects').update({ thumbnail_url: data.publicUrl + '?t=' + Date.now() }).eq('id', projectId); }
    } catch (e) { console.warn(e); }
    $('#saveState').textContent = 'Tersimpan ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    toast('Project tersimpan');
  } catch (e) {
    if (String(e.message || '').includes('project_limit_reached')) {
      modal('Batas project tercapai', E('div', { style: { display: 'grid', gap: '12px' } },
        E('p', { text: 'Akun gratis bisa menyimpan 3 project. Hapus project lama, atau berlangganan Pro untuk project tanpa batas.', style: { margin: 0 } }),
        E('a', { className: 'btn primary', href: '/billing', text: 'Berlangganan Pro · Rp150.000/bulan' })));
    } else toast('Gagal menyimpan: ' + (e.message || e));
  } finally { btn.disabled = false; btn.textContent = 'Simpan'; }
}
$('#btnSave').onclick = save;
addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); } });
$('#projName').oninput = markDirty;

async function openProject(id) {
  const { data, error } = await sb.from('projects').select('*').eq('id', id).maybeSingle();
  if (error || !data) { toast('Project tidak ditemukan'); return; }
  projectId = data.id; $('#projName').value = data.name;
  await deserialize(data.pattern_config, data.editor_state);
  $('#saveState').textContent = 'Dibuka';
  history.replaceState(null, '', '/studio?p=' + projectId);
}
$('#btnProjects').onclick = async () => {
  if (!me) { location.href = '/login?next=/studio'; return; }
  const grid = E('div', { className: 'projgrid' }, E('p', { className: 'hint', text: 'Memuat…' }));
  const m = modal('Project saya', E('div', { style: { display: 'grid', gap: '12px' } },
    E('div', { className: 'row' }, E('button', { className: 'btn sm primary', text: '+ Desain baru', on: { click: () => { m.close(); newProject(); } } }),
      E('span', { className: 'hint', text: pro ? 'Project tanpa batas' : 'Akun gratis: maksimal 3 project' })), grid), { wide: true });
  const { data } = await sb.from('projects').select('id,name,thumbnail_url,updated_at').eq('user_id', me.user.id).order('updated_at', { ascending: false });
  grid.innerHTML = '';
  if (!data || !data.length) grid.append(E('p', { className: 'hint', text: 'Belum ada project tersimpan.' }));
  (data || []).forEach(p => grid.append(E('div', { className: 'pc' },
    p.thumbnail_url ? E('img', { src: p.thumbnail_url, alt: '', loading: 'lazy' }) : E('div', { className: 'ph' }),
    E('div', { className: 'meta' }, E('b', { text: p.name }), E('small', { text: new Date(p.updated_at).toLocaleString('id-ID') }),
      E('div', { className: 'row' },
        E('button', { className: 'btn sm primary', text: 'Buka', on: { click: async () => { m.close(); await openProject(p.id); } } }),
        E('button', { className: 'btn sm danger', text: 'Hapus', on: { click: async e => { if (e.target.dataset.c !== '1') { e.target.dataset.c = '1'; e.target.textContent = 'Yakin?'; return; } await sb.from('projects').delete().eq('id', p.id); if (projectId === p.id) projectId = null; e.target.closest('.pc').remove(); toast('Project dihapus'); } } }))))));
};
function newProject() { projectId = null; $('#projName').value = 'Desain tanpa judul'; history.replaceState(null, '', '/studio'); defaultLayers(); S.panelFill = {}; syncLayers(); buildPanelFills(); invalidateBase(); $('#saveState').textContent = 'Desain baru'; }

/* ---------------- Export (khusus Pro) ---------------- */
function exportUpsell() {
  const feats = ['Pattern PNG/JPG hingga 3000 px', 'Pola jahit skala 1:1 (SVG vektor atau PNG cetak)', 'Snapshot 3D hingga 4096 px, latar studio, polos, atau transparan'];
  modal('Export khusus member Pro', E('div', { style: { display: 'grid', gap: '14px' } },
    E('p', { style: { margin: 0 }, text: 'Akun gratis bisa mendesain dan melihat hasilnya di 2D dan 3D. Untuk mengunduh file, berlangganan Pro.' }),
    E('ul', { className: 'upsell' }, feats.map(f => E('li', { text: f }))),
    me ? E('a', { className: 'btn primary lg', href: '/billing', text: 'Berlangganan Pro · Rp150.000/bulan' })
      : E('div', { className: 'row' }, E('a', { className: 'btn primary', href: '/login?mode=signup&next=/billing', text: 'Daftar dan berlangganan' }), E('a', { className: 'btn', href: '/login?next=/studio', text: 'Sudah punya akun? Masuk' })),
    E('p', { className: 'hint', text: 'Desainmu tetap tersimpan di browser ini.' })));
}
$('#btnExport').onclick = () => {
  if (!pro) { scheduleDraft(); exportUpsell(); return; }
  const pSize = E('select', { className: 'in' }, [1024, 2048, 3000].map(v => E('option', { value: v, text: v + ' px', selected: v === 3000 })));
  const pFmt = E('select', { className: 'in' }, E('option', { value: 'png', text: 'PNG' }), E('option', { value: 'jpg', text: 'JPG' }));
  const bPat = E('button', { className: 'btn primary', text: 'Unduh pattern' });
  const sFmt = E('select', { className: 'in' }, E('option', { value: 'svg', text: 'SVG skala 1:1 (vektor + gambar)' }), E('option', { value: 'png', text: 'PNG lembar penuh' }));
  const sDpi = E('select', { className: 'in' }, [[72, '72 dpi (cepat)'], [100, '100 dpi'], [150, '150 dpi (cetak)']].map(([v, t]) => E('option', { value: v, text: t, selected: v === 100 })));
  const bSew = E('button', { className: 'btn primary', text: 'Unduh pola jahit' });
  const tView = E('select', { className: 'in' }, [['current', 'Sudut saat ini'], ['front', 'Depan'], ['back', 'Belakang'], ['three', 'Depan · belakang · samping']].map(([v, t]) => E('option', { value: v, text: t })));
  const tSize = E('select', { className: 'in' }, [[1080, '1080 px'], [2048, '2048 px'], [4096, '4096 px']].map(([v, t]) => E('option', { value: v, text: t, selected: v === 2048 })));
  const bShot = E('button', { className: 'btn primary', text: 'Unduh snapshot 3D' });
  const body = E('div', { className: 'xgrid' },
    E('div', { className: 'xcard' }, E('h4', { text: 'Pattern' }), E('p', { text: S.mode === 'advanced' ? 'Tile pattern Advanced yang bisa diulang tanpa sambungan.' : 'Motif Basic area 60 × 60 cm.' }),
      E('label', { className: 'field' }, 'Ukuran', pSize), E('label', { className: 'field' }, 'Format', pFmt), bPat,
      E('button', { className: 'btn', type: 'button', text: 'Export SVG (vektor)', on: { click: () => { m.close(); openVector(); } } })),
    E('div', { className: 'xcard' }, E('h4', { text: 'Pola jahit' }), E('p', { text: `Semua ${L?.panels.length || ''} panel ukuran ${model?.size_label || 'M'} dengan desain, garis potong, dan arah serat. Cetak 100% tanpa "fit to page".` }),
      E('label', { className: 'field' }, 'Format', sFmt), E('label', { className: 'field' }, 'Resolusi gambar', sDpi), bSew),
    E('div', { className: 'xcard' }, E('h4', { text: 'Snapshot 3D' }), E('p', { text: `Latar mengikuti pengaturan Tampilan (${S.bg.mode === 'transparent' ? 'transparan' : S.bg.mode === 'solid' ? 'polos' : 'studio'}).` }),
      E('label', { className: 'field' }, 'Sudut', tView), E('label', { className: 'field' }, 'Ukuran', tSize), bShot));
  const m = modal('Export', body, { wide: true });
  bPat.onclick = async () => {
    m.close();
    const size = +pSize.value, jpg = pFmt.value === 'jpg';
    const blob = await withProgress(`Menyiapkan pattern ${size} px`, async set => { set(.3); return exportPattern({ S, adv, size, jpg, texSize: S.mode === 'advanced' ? 1024 : 560 }); });
    download(blob, `jpl-pattern-${size}px.${jpg ? 'jpg' : 'png'}`); if (S.mode === 'advanced') invalidateBase();
  };
  bSew.onclick = async () => {
    m.close();
    const dpi = +sDpi.value, svg = sFmt.value === 'svg';
    try {
      const blob = await withProgress('Menyiapkan pola jahit', set => svg
        ? exportSewingSVG({ L, S, adv, dpi, modelName: model.name, size: model.size_label || 'M', progress: set })
        : exportSewingPNG({ L, S, adv, dpi, size: model.size_label || 'M', progress: set }));
      download(blob, `jpl-pola-jahit-${model.slug}-${model.size_label || 'M'}-${dpi}dpi.${svg ? 'svg' : 'png'}`);
      toast('Pola jahit siap. Cetak pada skala 100%.');
    } catch (e) { toast(e.message || 'Export gagal'); }
  };
  bShot.onclick = async () => {
    m.close();
    const size = +tSize.value, v = tView.value;
    const views = v === 'current' ? null : v === 'three' ? ['front', 'back', 'side'] : [v];
    flushTexture();
    const c = await withProgress('Merender snapshot 3D', async set => { set(.4); return viewer.snapshot({ width: size, height: size, bg: S.bg, views }); });
    c.toBlob(b => download(b, `jpl-3d-${v}-${size}px.png`), 'image/png');
  };
};

/* ---------------- proteksi gambar untuk akun gratis ---------------- */
// Akun gratis tidak bisa klik kanan / tekan lama untuk menyimpan gambar desain.
function protectImages() {
  if (pro) return;
  document.body.classList.add('protect');
  const block = e => { if (e.target.closest('canvas, .styles, .adv, .layers img')) e.preventDefault(); };
  document.addEventListener('contextmenu', block);
  document.addEventListener('dragstart', block);
}

/* ---------------- tur ---------------- */
$('#btnTour').onclick = () => startTour(undefined, { onTab: t => setTab(t === 'vector' ? 'pattern' : t) });

/* ---------------- boot ---------------- */
const boot = (p, msg) => { const b = $('#bootBar'); if (b) b.style.width = Math.round(p * 100) + '%'; if (msg) $('#bootMsg').textContent = msg; };
const bootDone = () => { boot(1, 'Siap'); setTimeout(() => { $('#boot').classList.add('done'); setTimeout(() => $('#boot').remove(), 400); }, 180); };
requestAnimationFrame(frame);
initArc();
(async () => {
  boot(.15, 'Memeriksa akun…');
  me = await mountNav('studio', { tag: 'STUDIO' });
  pro = isPro(me) || (import.meta.env.DEV && location.search.includes('devpro'));
  protectImages();
  syncBasic(); syncEdit(); syncView();
  boot(.35, 'Memuat daftar model…');
  await loadModels();
  const startModel = models[0];
  boot(.55, 'Memuat model 3D…');
  await useModel(startModel, false);
  boot(.85, 'Menggambar pola…');
  const fontsReady = Promise.all(FONTS.slice(0, 6).map(f => document.fonts.load(`80px "${f[1]}"`).catch(() => { }))).then(invalidateLayers);
  const pid = new URLSearchParams(location.search).get('p');
  if (pid && me) await openProject(pid);
  else {
    try {
      const d = JSON.parse(localStorage.getItem('jpl_draft') || 'null');
      if (d && d.editor_state) { $('#projName').value = d.name || 'Desain tanpa judul'; projectId = me ? d.id || null : null; await deserialize(d.pattern_config, d.editor_state); $('#saveState').textContent = 'Draft dipulihkan'; }
    } catch (e) { }
  }
  await Promise.race([fontsReady, new Promise(r => setTimeout(r, 2500))]);
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  bootDone();
  if (!tourSeen()) setTimeout(() => startTour(undefined, { onTab: t => setTab(t === 'vector' ? 'pattern' : t) }), 900);
})();
