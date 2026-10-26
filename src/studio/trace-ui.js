// UI tab Trace: upload gambar -> vektor SVG -> elemen (logo) atau motif jersey.
import { $, $$, E, toast } from '../lib/ui.js';
import { traceImage, traceToSVG, svgToDataURI, TRACE_PRESETS, TRACE_DEFAULT } from './trace.js';

const fmt = (n, d = 0) => (+n).toFixed(d).replace('.', ',');

export function initTrace({ getPalette, onAddLayer, onMotif, onDownload, isMotifActive }) {
  let src = null, res = null, o = { ...TRACE_DEFAULT }, tm = 0, motif = null, name = 'trace';
  const drop = $('#trDrop');

  const el = id => $('#' + id);
  const SL = [ // [id, key, format]
    ['trColors', 'colors', v => v + ' warna'], ['trDetail', 'detail', v => v + ' px'],
    ['trSmooth', 'smooth', v => v + '%'], ['trSpeckle', 'speckle', v => v + ' px'], ['trThr', 'threshold', v => (+v ? v : 'Otomatis')],
  ];

  // preset
  const chips = el('trPresets');
  TRACE_PRESETS.forEach(p => {
    const b = E('button', { type: 'button', 'data-preset': p.id, 'aria-pressed': 'false', title: p.hint }, p.name);
    b.onclick = () => { o = { ...o, ...p.o }; markPreset(p.id); syncUI(); run(0); };
    chips.append(b);
  });
  const markPreset = id => $$('[data-preset]', chips).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.preset === id)));

  function syncUI() {
    for (const [id, k, f] of SL) { el(id).value = o[k]; el('v' + id.slice(2)).textContent = f(o[k]); }
    el('trInvert').checked = !!o.invert; el('trDropBg').checked = !!o.dropBg; el('trPal').checked = !!o.usePalette; el('trInk').value = o.ink;
    $$('[data-trmode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.trmode === o.mode)));
    el('trColorsRow').hidden = o.mode !== 'color'; el('trThrRow').hidden = o.mode !== 'mono'; el('trInkRow').hidden = o.mode !== 'mono';
    el('trPalRow').hidden = o.mode !== 'color';
  }
  for (const [id, k, f] of SL) el(id).oninput = e => { o[k] = +e.target.value; el('v' + id.slice(2)).textContent = f(o[k]); markPreset(''); run(); };
  el('trInvert').onchange = e => { o.invert = e.target.checked; markPreset(''); run(0); };
  el('trDropBg').onchange = e => { o.dropBg = e.target.checked; markPreset(''); run(0); };
  el('trPal').onchange = e => { o.usePalette = e.target.checked; markPreset(''); render(); };
  el('trInk').oninput = e => { o.ink = e.target.value; render(); };
  $$('[data-trmode]').forEach(b => b.onclick = () => { o.mode = b.dataset.trmode; markPreset(''); syncUI(); run(0); });

  // file
  function load(file) {
    if (!file) return;
    if (file.size > 8e6) { toast('Gambar terlalu besar, maksimal 8 MB'); return; }
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      src = img; name = file.name.replace(/\.[^.]+$/, '').slice(0, 30) || 'trace';
      el('trSrc').src = url; el('trCmp').hidden = false; el('trCtl').hidden = false; drop.classList.add('has');
      drop.querySelector('b').textContent = 'Ganti gambar';
      if (!$$('[data-preset][aria-pressed="true"]', chips).length) { const p = TRACE_PRESETS[0]; o = { ...o, ...p.o }; markPreset(p.id); }
      syncUI(); run(0);
    };
    img.onerror = () => toast('Gambar tidak bisa dibaca');
    img.src = url;
  }
  el('trFile').onchange = e => { load(e.target.files[0]); e.target.value = ''; };
  ['dragenter', 'dragover'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', e => load(e.dataTransfer.files[0]));

  // jalankan trace (debounce)
  function run(delay = 160) {
    if (!src) return;
    clearTimeout(tm); el('trInfo').textContent = 'Memproses…';
    tm = setTimeout(() => {
      try { res = traceImage(src, o); } catch (e) { console.error(e); toast('Trace gagal: ' + (e.message || e)); return; }
      render();
    }, delay);
  }
  function currentColors() {
    if (!res) return null;
    if (o.mode === 'mono') return res.layers.map(() => o.ink);
    if (o.usePalette) { const p = getPalette(); return res.layers.map((_, i) => p[(i + 1) % 3]); }
    return null;
  }
  function svg() { return res && res.hasContent ? traceToSVG(res, { colors: currentColors() }) : null; }
  function render() {
    const s = svg(), has = !!s;
    el('trAct').querySelectorAll('button').forEach(b => b.disabled = !has);
    if (!has) { el('trOut').removeAttribute('src'); el('trInfo').textContent = res ? 'Tidak ada bentuk terdeteksi. Coba turunkan ambang atau matikan hapus latar.' : ''; return; }
    el('trOut').src = svgToDataURI(s);
    const nodes = res.layers.reduce((n, l) => n + (l.d.match(/[MLQ]/g) || []).length, 0);
    el('trInfo').textContent = `${res.layers.length} lapis · ${nodes.toLocaleString('id-ID')} titik`;
    if (isMotifActive() && motif) applyMotif(false);
  }

  // aksi
  el('trAddLayer').onclick = () => { const s = svg(); if (s) onAddLayer(svgToDataURI(s), name); };
  el('trDownload').onclick = () => { const s = svg(); if (s) onDownload(s, name); };
  el('trMotif').onclick = () => applyMotif(true);
  function applyMotif(announce) {
    const s = svg(); if (!s) return;
    const img = new Image();
    img.onload = () => {
      motif = { src: svgToDataURI(s), img, tile: +el('trTile').value, gap: +el('trGap').value / 100, half: el('trHalf').checked };
      onMotif(motif);
      if (announce) { el('trMotifOpts').hidden = false; toast('Dipakai sebagai motif jersey'); }
    };
    img.src = svgToDataURI(s);
  }
  const mo = () => { if (!motif) return; motif.tile = +el('trTile').value; motif.gap = +el('trGap').value / 100; motif.half = el('trHalf').checked; el('vTile').textContent = el('trTile').value + ' mm'; el('vGap').textContent = el('trGap').value + '%'; onMotif(motif); };
  el('trTile').oninput = mo; el('trGap').oninput = mo; el('trHalf').onchange = mo;

  syncUI();
  return {
    /** Sinkronkan slider motif setelah project dibuka. */
    syncMotif(T) {
      if (!T) { motif = null; el('trMotifOpts').hidden = true; return; }
      motif = T; el('trTile').value = T.tile; el('trGap').value = Math.round((T.gap ?? .12) * 100); el('trHalf').checked = !!T.half;
      el('vTile').textContent = T.tile + ' mm'; el('vGap').textContent = Math.round((T.gap ?? .12) * 100) + '%'; el('trMotifOpts').hidden = false;
    },
  };
}
