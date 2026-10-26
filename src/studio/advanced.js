// Mode ADVANCED: generator pattern Jersey Pattern Lab (versi asli), dipindahkan apa adanya
// ke modul. Menghasilkan tile pattern persegi yang bisa diulang (noise periodik).
// Semua id elemen memakai awalan "a_" agar tidak bentrok dengan Studio.

import { E, toast } from '../lib/ui.js';

export const STY = { blur: 'Soft blur', liquid: 'Liquid flow', ripple: 'Ripple', smoke: 'Smoke', silk: 'Silk', marble: 'Marble', cells: 'Cells', topo: 'Topo', bands: 'Bands' };
const FIN = { none: 'Halus', half: 'Halftone', dith: 'Dither', line: 'Garis' };
export const PAL = {
  'B&W': ['#050505', '#3a3a3a', '#bdbdbd', '#f6f6f6'], Ice: ['#050f16', '#0e4b5a', '#6fd0d6', '#eafcff'], Ember: ['#0a0200', '#5a1200', '#ff5a1f', '#ffe3a0'],
  Violet: ['#07040f', '#2a1466', '#9b5cff', '#ffd1f2'], Neon: ['#020a06', '#0a5c3a', '#27f08a', '#e8ff6a'], Forest: ['#0b150d', '#2e5a38', '#8fb36a', '#efe8cf'],
  Sunset: ['#0b1d6b', '#1e6bff', '#ff4fd8', '#ffe14a'], Blue: ['#02040f', '#0b2a8f', '#4f8cff', '#e6f0ff'], Acid: ['#070707', '#2b2b2b', '#c6ff00', '#f4ffd0'],
  Candy: ['#2a0a3a', '#ff3d9a', '#ff9a3d', '#fff3c4'], Desert: ['#1a0f0a', '#7a3e1d', '#e0a458', '#fbeed2'], Custom: ['#0a0a0a', '#1d4ed8', '#f472b6', '#fff7ae'],
};
const SL = [
  ['ib', 'Blur foto', 0, 20, 3, 0], ['sc', 'Detail', 1, 6, 2, 1], ['wp', 'Lengkung', 0, 300, 150, 1], ['ct', 'Kontras', 10, 60, 25, 1], ['bd', 'Jumlah pita', 2, 14, 5, 1],
  ['sf', 'Tepi lembut', 2, 50, 22, 1], ['dt', 'Ukuran dot', 4, 24, 9, 1], ['sw', 'Pusaran', 0, 100, 0, 1],
  ['ps', 'Posterize', 0, 8, 0, 2], ['rg', 'RGB split', 0, 20, 0, 2], ['rl', 'Relief 3D', 0, 100, 0, 2], ['px', 'Pixelate', 0, 30, 0, 2], ['wv', 'Gelombang', 0, 40, 0, 2],
  ['gl', 'Glitch', 0, 100, 0, 2], ['sl', 'Scanline', 0, 100, 0, 2], ['sp', 'Cipratan', 0, 100, 0, 2], ['fd', 'Fade bawah', 0, 100, 0, 2], ['vg', 'Vignette', 0, 100, 0, 2], ['gr', 'Grain', 0, 100, 45, 2],
  ['gw', 'Lebar glass', 6, 80, 24, 5], ['gk', 'Kekuatan glass', 0, 100, 60, 5], ['gb', 'Ukuran brush', 10, 160, 60, 5],
];
const VIS = { ct: ['blur', 'silk', 'smoke', 'cells'], bd: ['liquid', 'ripple', 'marble', 'topo', 'bands'], sf: ['liquid', 'ripple', 'marble', 'topo', 'bands'] };
const GLS = { '': 'Off', v: 'Vertikal', h: 'Horizontal', d: 'Diagonal', c: 'Bulat', r: 'Ring' };
const PRE = [['Liquid Mono', {}, {}], ['Aurora Ice', { sty: 'blur', pal: 'Ice', seed: 42 }, { wp: 180, ct: 30, gr: 55 }], ['Ember Smoke', { sty: 'smoke', pal: 'Ember', seed: 7 }, { rl: 30, gr: 50 }], ['Night Halftone', { sty: 'silk', pal: 'Violet', fin: 'half', seed: 19 }, { dt: 8, sc: 3 }], ['Neon Topo', { sty: 'topo', pal: 'Neon', seed: 5 }, { bd: 9, sf: 20 }], ['Desert Camo', { sty: 'cells', pal: 'Desert', fin: 'dith', seed: 23 }, { dt: 8, sc: 3, ct: 30 }], ['Candy Marble', { sty: 'marble', pal: 'Candy', seed: 31 }, { bd: 8, sf: 18 }], ['Blue Waves', { sty: 'bands', pal: 'Blue', seed: 3 }, { wv: 10, bd: 7 }], ['Glass Aurora', { sty: 'blur', pal: 'Sunset', seed: 60, glass: 'v' }, { gw: 22, gk: 70, wp: 200 }], ['Ring Mono', { sty: 'ripple', pal: 'B&W', seed: 9, glass: 'r' }, { bd: 6, gw: 18, gk: 55 }],
  ['Forest Silk', { sty: 'silk', pal: 'Forest', seed: 14 }, { sc: 3, gr: 40 }], ['Acid Cells', { sty: 'cells', pal: 'Acid', seed: 8 }, { sc: 4, ct: 35 }], ['Sunset Liquid', { sty: 'liquid', pal: 'Sunset', seed: 27 }, { bd: 7, sf: 25 }], ['Mono Topo', { sty: 'topo', pal: 'B&W', seed: 33 }, { bd: 11, sf: 12 }],
  ['Violet Glass', { sty: 'blur', pal: 'Violet', seed: 71, glass: 'h' }, { gw: 26, gk: 65 }], ['Ice Diagonal', { sty: 'blur', pal: 'Ice', seed: 12, glass: 'd' }, { gw: 30, gk: 60, wp: 220 }], ['Candy Lens', { sty: 'blur', pal: 'Candy', seed: 5, glass: 'c' }, { gw: 20, gk: 70 }], ['Ember Dither', { sty: 'smoke', pal: 'Ember', seed: 44, fin: 'dith' }, { dt: 6, ct: 30 }],
  ['Neon Garis', { sty: 'liquid', pal: 'Neon', seed: 16, fin: 'line' }, { dt: 6, bd: 6 }], ['Desert Marble', { sty: 'marble', pal: 'Desert', seed: 52 }, { bd: 10, sf: 14 }], ['Blue Smoke', { sty: 'smoke', pal: 'Blue', seed: 38 }, { gr: 60, vg: 30 }], ['Candy Bands', { sty: 'bands', pal: 'Candy', seed: 66 }, { bd: 9, wv: 8 }],
  ['Pixel Camo', { sty: 'cells', pal: 'Forest', seed: 19, fin: 'dith' }, { dt: 10, sc: 5, px: 6 }], ['Glitch Night', { sty: 'liquid', pal: 'Violet', seed: 90 }, { gl: 40, rg: 6, bd: 6 }], ['Army Halftone', { sty: 'silk', pal: 'Forest', seed: 25, fin: 'half' }, { dt: 7 }], ['Ripple Sunset', { sty: 'ripple', pal: 'Sunset', seed: 21 }, { bd: 5 }]];
const REFS = [['Samba Red', ['#1a0508', '#8a0f1d', '#e63946', '#ffe8d6']], ['Ocean Run', ['#03111f', '#0a4f8c', '#2ec4e6', '#e8fbff']], ['Sakura', ['#220a1a', '#8e2a63', '#ff7eb6', '#fff0f6']], ['Mint Trail', ['#06201a', '#0f7a5c', '#5fe3b0', '#f0fff8']], ['Gold Rush', ['#140d02', '#6b4b0a', '#f5b700', '#fff6d1']], ['Slate', ['#0d1117', '#2f3a4a', '#8b9bb0', '#eef2f7']], ['Retro Orange', ['#1b0f0a', '#8f2d0e', '#ff7a1a', '#ffe9c7']], ['Purple Haze', ['#0f0720', '#4b1d8f', '#a96bff', '#f3e8ff']], ['Army', ['#0f140a', '#3b4a22', '#8a9a5b', '#e9edd0']], ['Sky Pastel', ['#1a2744', '#6fa8dc', '#ffd1dc', '#fffaf0']]];

/** Markup panel Advanced (dibuat sekali di dalam container). */
function markup() {
  const sec = (title, open, ...kids) => E('details', { className: 'adv-sec', open }, E('summary', { text: title }), E('div', { className: 'adv-body' }, kids));
  return [
    E('div', { className: 'adv-preview' },
      E('canvas', { id: 'a_pv', width: 640, height: 640, 'aria-label': 'Pratinjau tile pattern' }),
      E('div', { className: 'seg mini', role: 'group', 'aria-label': 'Tampilan tile' },
        E('button', { type: 'button', id: 'a_v1', className: 'on', text: '1×' }), E('button', { type: 'button', id: 'a_v2', text: '2×2' }))),
    E('div', { className: 'row3' },
      E('button', { type: 'button', className: 'btn primary', id: 'a_rnd', text: 'Acak' }),
      E('button', { type: 'button', className: 'btn', id: 'a_rall', text: 'Acak total' }),
      E('button', { type: 'button', className: 'btn', id: 'a_ub', text: '↶ Kembali', disabled: true })),
    E('div', { className: 'row' },
      E('label', { className: 'field', style: { flex: '1' } }, 'Seed', E('input', { type: 'number', id: 'a_sd' })),
      E('label', { className: 'chk', style: { alignSelf: 'end' } }, E('input', { type: 'checkbox', id: 'a_nf', checked: true }), 'Acak tanpa fade bawah')),
    sec('Sample desain', true, E('div', { className: 'adv-samples', id: 'a_sg' })),
    sec('Gaya', true, E('div', { className: 'grid3', id: 'a_styles' }), E('label', { className: 'chk' }, E('input', { type: 'checkbox', id: 'a_mir' }), 'Simetris kiri-kanan')),
    sec('Warna', true, E('div', { className: 'grid6', id: 'a_pals' }), E('div', { className: 'row', id: 'a_cps' }),
      E('label', { className: 'chk' }, E('input', { type: 'checkbox', id: 'a_inv' }), 'Balik terang/gelap'), E('div', { className: 'row', id: 'a_hexrow' })),
    sec('Finishing', true, E('div', { className: 'grid4', id: 'a_fin' })),
    sec('Bentuk', true, E('div', { className: 'sliders', id: 'a_sl1' })),
    sec('Referensi warna', false, E('div', { className: 'grid2', id: 'a_refs' }),
      E('label', { className: 'btn sm filebtn' }, 'Ambil warna dari gambar', E('input', { type: 'file', id: 'a_rff', accept: 'image/*', className: 'sr-only' }))),
    sec('Efek tambahan', false, E('div', { className: 'sliders', id: 'a_sl2' })),
    sec('Efek glass', false, E('div', { className: 'grid3', id: 'a_gmodes' }), E('div', { className: 'sliders', id: 'a_sl5' }),
      E('label', { className: 'chk' }, E('input', { type: 'checkbox', id: 'a_bm' }), 'Brush: lukis area glass di pratinjau'),
      E('button', { type: 'button', className: 'btn sm', id: 'a_bx', text: 'Hapus brush' })),
    sec('Foto sebagai sumber', false,
      E('label', { className: 'btn sm filebtn' }, 'Pilih foto', E('input', { type: 'file', id: 'a_imf', accept: 'image/*', className: 'sr-only' })),
      E('div', { className: 'row' }, E('label', { className: 'chk' }, E('input', { type: 'checkbox', id: 'a_ims' }), 'Pakai foto'), E('button', { type: 'button', className: 'btn sm', id: 'a_imx', text: 'Hapus' })),
      E('div', { className: 'sliders', id: 'a_sl0' })),
  ];
}

/**
 * Pasang generator Advanced ke container.
 * @returns API { pat, build, getState, setState, randomizeAll, thumbs }
 */
export function initAdvanced(container, { onChange = () => { } } = {}) {
  container.append(...markup());
  const $ = id => document.getElementById('a_' + id);
  let R = 560;
  const pat = document.createElement('canvas'), P = pat.getContext('2d', { willReadFrequently: true });
  const pc = $('pv').getContext('2d');
  let V, LUM = null, IMG = null;
  const st = { sty: 'liquid', pal: 'B&W', fin: 'none', seed: 11, v: 1, glass: '', cx: .5, cy: .5, mir: false };
  const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
  function ramp(name, inv) { const s = PAL[name].map(rgb), L = new Uint8ClampedArray(768); for (let i = 0; i < 256; i++) { const t = inv ? 1 - i / 255 : i / 255, k = t * 3, j = Math.min(2, k | 0), f = k - j; for (let c = 0; c < 3; c++)L[i * 3 + c] = s[j][c] + (s[j + 1][c] - s[j][c]) * f; } return L; }
  function h(a, b) { let n = Math.imul(a, 374761393) + Math.imul(b, 668265263) + st.seed * 1013; n = Math.imul(n ^ n >>> 13, 1274126177); return ((n ^ n >>> 16) >>> 0) / 4294967296; }
  function vn(x, y, cx, cy) {
    const X = x * cx, Y = y * cy, ix = Math.floor(X), iy = Math.floor(Y); let fx = X - ix, fy = Y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    const x0 = ((ix % cx) + cx) % cx, x1 = (x0 + 1) % cx, y0 = ((iy % cy) + cy) % cy, y1 = (y0 + 1) % cy, a = h(x0, y0), b = h(x1, y0), c = h(x0, y1), d = h(x1, y1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function fbm(x, y, cx, cy) { let s = 0, a = .5, n = 0; for (let i = 0; i < 4; i++) { s += a * vn(x, y, cx << i, cy << i); n += a; a /= 2; } return s / n; }
  function wor(x, y, n) { const X = x * n, Y = y * n, ix = Math.floor(X), iy = Math.floor(Y); let m = 9; for (let a = -1; a <= 1; a++)for (let b = -1; b <= 1; b++) { const nx = ix + a, ny = iy + b, wx = ((nx % n) + n) % n, wy = ((ny % n) + n) % n, dx = nx + h(wx + 57, wy) - X, dy = ny + h(wx, wy + 91) - Y, d = dx * dx + dy * dy; if (d < m) m = d; } return Math.sqrt(m); }
  const ss = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
  const val = id => +$(id).value;
  function lum() {
    if (!IMG) { LUM = null; return; } const c = document.createElement('canvas'); c.width = c.height = R; const x = c.getContext('2d', { willReadFrequently: true }); x.fillStyle = '#808080'; x.fillRect(0, 0, R, R); x.filter = `blur(${val('ib') * R / 560}px)`;
    const s = Math.max(R / IMG.width, R / IMG.height), w = IMG.width * s, hh = IMG.height * s; x.drawImage(IMG, (R - w) / 2, (R - hh) / 2, w, hh); const d = x.getImageData(0, 0, R, R).data; LUM = new Float32Array(R * R); let mn = 1, mx = 0;
    for (let n = 0; n < R * R; n++) { const l = (d[n * 4] * .3 + d[n * 4 + 1] * .59 + d[n * 4 + 2] * .11) / 255; LUM[n] = l; if (l < mn) mn = l; if (l > mx) mx = l; } const r = Math.max(.05, mx - mn); for (let n = 0; n < R * R; n++)LUM[n] = (LUM[n] - mn) / r;
  }
  function field() {
    const c = val('sc'), w = val('wp') / 100, ct = val('ct') / 10, bd = val('bd'), sf = val('sf') / 100, sw = val('sw') / 100, S = st.sty, cy = S == 'silk' ? c * 6 : c, useI = LUM && $('ims').checked;
    for (let j = 0; j < R; j++)for (let i = 0; i < R; i++) {
      let x = i / R, y = j / R;
      if (sw) { const dx = x - .5, dy = y - .5, d = Math.hypot(dx, dy), a = sw * 4 * (1 - Math.min(1, d * 1.5)), co = Math.cos(a), si = Math.sin(a); x = .5 + dx * co - dy * si; y = .5 + dx * si + dy * co; }
      if (st.mir) x = Math.abs(2 * x - 1);
      const qx = fbm(x, y, c, cy), qy = fbm(x + .31, y + .67, c, cy), wx = x + (qx - .5) * w, wy = y + (qy - .5) * w;
      const b = useI ? LUM[((((wy * R) | 0) % R + R) % R) * R + (((wx * R) | 0) % R + R) % R] : fbm(wx, wy, c, cy), cb = (b - .5) * 2.4 + .5; let v;
      if (S == 'blur' || S == 'silk') v = (b - .5) * ct * 1.6 + .5;
      else if (S == 'smoke') { const r = Math.abs(b - .5) * 2; v = (1 - Math.pow(r, .55) - .5) * ct * .9 + .5; }
      else if (S == 'liquid') v = ss(.5 - sf, .5 + sf, .5 + .5 * Math.sin(cb * bd * 3.1416));
      else if (S == 'ripple') { const dd = Math.hypot(x - st.cx, y - st.cy), t = .5 + .5 * Math.sin((dd * bd * 2 + (b - .5) * w * .9) * 6.2832); v = ss(.5 - sf, .5 + sf, t) * (.35 + .65 * ss(0, .7, 1 - dd * .9)); }
      else if (S == 'marble') { const n = Math.max(1, bd >> 1), e = Math.abs(Math.sin(3.1416 * (n * (x + y) + (b - .5) * w * n * .8))); v = 1 - ss(0, .08 + sf, e); }
      else if (S == 'topo') { const u = cb * bd * .9, f = u - Math.floor(u), e = Math.min(f, 1 - f); v = 1 - ss(0, .03 + sf * .25, e); }
      else if (S == 'cells') v = (.5 - wor(wx, wy, c * 2)) * ct * .7 + .5;
      else v = ss(.5 - sf, .5 + sf, .5 + .5 * Math.sin((y * bd + (b - .5) * w * bd * .35) * 6.2832));
      V[j * R + i] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  }
  const BY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const snap = () => { const t = document.createElement('canvas'); t.width = t.height = R; t.getContext('2d').drawImage(pat, 0, 0); return t; };
  const BM = document.createElement('canvas'); BM.width = BM.height = 560; const BMx = BM.getContext('2d'); let BMd = false;
  function compose() {
    const inv = $('inv').checked, L = ramp(st.pal, inv), fin = st.fin, k = R / 560, dt = val('dt') * k, ps = val('ps'), rg = Math.round(val('rg') * k), rlf = val('rl') / 100 * 8 * k, pxs = Math.max(1, Math.round(val('px') * k));
    let sd = st.seed * 7 + 1; const rs = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296;
    const vq = n => ps > 1 ? Math.round(V[n] * (ps - 1)) / (ps - 1) : V[n], ix = (i, j) => pxs > 1 ? ((j / pxs | 0) * pxs) * R + ((i / pxs | 0) * pxs) : j * R + i;
    const im = P.createImageData(R, R), d = im.data, put = (q, o) => { d[q] = L[o * 3]; d[q + 1] = L[o * 3 + 1]; d[q + 2] = L[o * 3 + 2]; d[q + 3] = 255; };
    if (fin == 'dith') { const p = Math.max(2, Math.round(dt / 2)); for (let j = 0; j < R; j++)for (let i = 0; i < R; i++) { const a = (i / p | 0) * p, b = (j / p | 0) * p, v = vq(ix(a, b)), th = (BY[((j / p | 0) & 3) * 4 + ((i / p | 0) & 3)] + .5) / 16; put((j * R + i) * 4, v > th ? 250 : 5); } }
    else if (fin == 'line') { const g = Math.max(3, dt); for (let j = 0; j < R; j++)for (let i = 0; i < R; i++) { const u = ((i + j) % g) / g; put((j * R + i) * 4, Math.abs(u - .5) * 2 < Math.pow(vq(ix(i, j)), .9) ? 250 : 5); } }
    else for (let j = 0; j < R; j++)for (let i = 0; i < R; i++)put((j * R + i) * 4, Math.round(vq(ix(i, j)) * 255));
    if (rlf > 0 && fin != 'half') for (let j = 1; j < R - 1; j++)for (let i = 1; i < R - 1; i++) { const n = j * R + i, s = 1 + (V[n + 1] - V[n - 1] + V[n + R] - V[n - R]) * rlf, q = n * 4; d[q] *= s; d[q + 1] *= s; d[q + 2] *= s; }
    P.putImageData(im, 0, 0);
    if (fin == 'half') {
      P.fillStyle = `rgb(${L[15]},${L[16]},${L[17]})`; P.fillRect(0, 0, R, R); P.fillStyle = `rgb(${L[750]},${L[751]},${L[752]})`;
      const g = dt, cs = Math.SQRT1_2, m = R / g; P.beginPath(); for (let a = -m; a < m; a++)for (let b = -m; b < m; b++) { const x = (a * cs - b * cs) * g + R / 2, y = (a * cs + b * cs) * g + R / 2; if (x < 0 || y < 0 || x >= R || y >= R) continue; const r = g * .78 * Math.sqrt(vq(ix(x | 0, y | 0))); if (r > .4) { P.moveTo(x + r, y); P.arc(x, y, r, 0, 7); } } P.fill();
    }
    if (rg > 0) { const m = P.getImageData(0, 0, R, R), s = new Uint8ClampedArray(m.data), e = m.data; for (let j = 0; j < R; j++)for (let i = 0; i < R; i++) { const q = (j * R + i) * 4, a = (j * R + Math.min(R - 1, i + rg)) * 4, b = (j * R + Math.max(0, i - rg)) * 4; e[q] = s[a]; e[q + 2] = s[b + 2]; } P.putImageData(m, 0, 0); }
    const wv = Math.round(val('wv') * k); if (wv) { const t = snap(); for (let j = 0; j < R; j++) { const o = Math.round(Math.sin(j / R * 18.85) * wv); P.drawImage(t, 0, j, R, 1, o, j, R, 1); P.drawImage(t, 0, j, R, 1, o + (o > 0 ? -R : R), j, R, 1); } }
    const gl = val('gl'); if (gl) { const t = snap(); for (let i = 0; i < gl / 4; i++) { const y = rs() * R | 0, hh = (2 + rs() * R * .06) | 0, o = Math.round((rs() - .5) * R * .25 * gl / 100); P.drawImage(t, 0, y, R, hh, o, y, R, hh); P.drawImage(t, 0, y, R, hh, o + (o > 0 ? -R : R), y, R, hh); } }
    const gm = st.glass; if (gm) {
      const gw = Math.max(4, Math.round(val('gw') * k)), str = val('gk') / 100, t = snap(), out = document.createElement('canvas'); out.width = out.height = R; const o = out.getContext('2d');
      if (gm == 'c') { const s = gw * 2, kk = 1 + str * .9; o.drawImage(t, 0, 0); for (let y = 0; y < R + s; y += s)for (let x = 0; x < R + s; x += s) { const cx = x + s / 2, cy = y + s / 2, rr = s / 2 - 1; o.save(); o.beginPath(); o.arc(cx, cy, rr, 0, 7); o.clip(); o.translate(cx, cy); o.scale(kk, kk); o.translate(-cx, -cy); o.drawImage(t, 0, 0); o.restore(); const gr = o.createRadialGradient(cx - s * .2, cy - s * .2, 0, cx, cy, rr); gr.addColorStop(0, `rgba(255,255,255,${.3 * str})`); gr.addColorStop(.6, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(0,0,0,${.35 * str})`); o.fillStyle = gr; o.beginPath(); o.arc(cx, cy, rr, 0, 7); o.fill(); } }
      else if (gm == 'r') { o.drawImage(t, 0, 0); const c0 = R / 2, n = Math.ceil(R * .75 / gw); for (let i = n; i >= 0; i--) { const r1 = (i + 1) * gw, r0 = i * gw; o.save(); o.beginPath(); o.arc(c0, c0, r1, 0, 7); o.arc(c0, c0, r0, 0, 7, true); o.clip('evenodd'); const sc = 1 + (i % 2 ? .5 : -.25) * str; o.translate(c0, c0); o.scale(sc, sc); o.translate(-c0, -c0); o.drawImage(t, 0, 0); o.restore(); o.strokeStyle = `rgba(255,255,255,${.25 * str})`; o.lineWidth = Math.max(1, k); o.beginPath(); o.arc(c0, c0, r1 - gw * .15, 0, 7); o.stroke(); o.strokeStyle = `rgba(0,0,0,${.3 * str})`; o.beginPath(); o.arc(c0, c0, r1, 0, 7); o.stroke(); } }
      else {
        const ang = gm == 'v' ? 0 : gm == 'h' ? Math.PI / 2 : Math.PI / 4, D = Math.ceil(R * 1.5), a = document.createElement('canvas'), b = document.createElement('canvas'); a.width = a.height = b.width = b.height = D; const A = a.getContext('2d'), B = b.getContext('2d'); A.translate(D / 2, D / 2); A.rotate(-ang); A.drawImage(t, -R / 2, -R / 2); const kk = 1 + str * 1.2;
        for (let x = 0; x < D; x += gw) { const sw = gw * kk, sx = x + gw / 2 - sw / 2; B.save(); B.beginPath(); B.rect(x, 0, gw, D); B.clip(); if (str > .35) { B.translate(x * 2 + gw, 0); B.scale(-1, 1); } B.drawImage(a, sx, 0, sw, D, x, 0, gw, D); B.restore(); const gr = B.createLinearGradient(x, 0, x + gw, 0); gr.addColorStop(0, `rgba(255,255,255,${.22 * str})`); gr.addColorStop(.35, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(0,0,0,${.3 * str})`); B.fillStyle = gr; B.fillRect(x, 0, gw, D); }
        o.save(); o.translate(R / 2, R / 2); o.rotate(ang); o.drawImage(b, -D / 2, -D / 2); o.restore();
      }
      if ($('bm').checked) { const m2 = document.createElement('canvas'); m2.width = m2.height = R; const m = m2.getContext('2d'); m.drawImage(out, 0, 0); m.globalCompositeOperation = 'destination-in'; m.drawImage(BM, 0, 0, R, R); P.drawImage(m2, 0, 0); } else P.drawImage(out, 0, 0);
    }
    const fd = val('fd'); if (fd) { const g = P.createLinearGradient(0, R * .35, 0, R); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(${L[15]},${L[16]},${L[17]},${fd / 100})`); P.fillStyle = g; P.fillRect(0, 0, R, R); }
    const vg = val('vg'); if (vg) { const g = P.createRadialGradient(R / 2, R / 2, R * .3, R / 2, R / 2, R * .78); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${vg / 110})`); P.fillStyle = g; P.fillRect(0, 0, R, R); }
    const sl = val('sl'); if (sl) { P.fillStyle = `rgba(0,0,0,${sl / 120})`; for (let y = 0; y < R; y += Math.round(3 * k))P.fillRect(0, y, R, Math.max(1, k)); }
    const sp = val('sp'); if (sp) { for (let i = 0; i < sp * 6; i++) { const r = Math.pow(rs(), 3) * 7 * k + k; P.fillStyle = rs() < .5 ? `rgba(${L[750]},${L[751]},${L[752]},.75)` : `rgba(${L[15]},${L[16]},${L[17]},.8)`; P.beginPath(); P.arc(rs() * R, rs() * R, r, 0, 7); P.fill(); } }
    const gr = val('gr') * .6; if (gr > 0) { const m = P.getImageData(0, 0, R, R), e = m.data; for (let q = 0; q < e.length; q += 4) { const n = (rs() - .5) * gr; e[q] += n; e[q + 1] += n; e[q + 2] += n; } P.putImageData(m, 0, 0); }
  }
  function build(sz) { R = sz; pat.width = pat.height = sz; V = new Float32Array(sz * sz); lum(); field(); compose(); }

  // ---- pratinjau
  function draw() { pc.clearRect(0, 0, 640, 640); if (st.v == 1) pc.drawImage(pat, 0, 0, 640, 640); else for (let i = 0; i < 2; i++)for (let j = 0; j < 2; j++)pc.drawImage(pat, i * 320, j * 320, 320, 320); }
  let q = 0, version = 0;
  const changed = () => { version++; onChange(); };
  const sched = f => { cancelAnimationFrame(q); q = requestAnimationFrame(f); };
  const full = () => sched(() => { build(560); draw(); changed(); });
  const comp = () => sched(() => { if (R !== 560) build(560); else compose(); draw(); changed(); });

  function ui() {
    document.querySelectorAll('#a_styles button').forEach(b => b.classList.toggle('on', b.dataset.k == st.sty));
    document.querySelectorAll('#a_pals button').forEach(b => b.classList.toggle('on', b.dataset.k == st.pal));
    document.querySelectorAll('#a_fin button').forEach(b => b.classList.toggle('on', b.dataset.k == st.fin));
    for (const i in VIS) $('l_' + i).style.display = VIS[i].includes(st.sty) ? '' : 'none';
    $('l_dt').style.display = st.fin == 'none' ? 'none' : ''; $('l_ib').style.display = IMG ? '' : 'none';
    PAL[st.pal].forEach((c, i) => $('c' + i).value = c); $('sd').value = st.seed; $('mir').checked = st.mir;
    document.querySelectorAll('#a_gmodes button').forEach(b => b.classList.toggle('on', b.dataset.k == st.glass)); hexes();
  }
  const mk = (par, o, fn, cls) => { for (const k in o) { const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; if (cls) { b.className = cls; b.style.background = `linear-gradient(90deg,${PAL[k].join(',')})`; b.title = k; b.setAttribute('aria-label', 'Palet ' + k); } else b.textContent = o[k]; b.onclick = () => { push(); fn(k); ui(); full(); }; par.append(b); } };
  mk($('styles'), STY, k => st.sty = k); mk($('pals'), PAL, k => st.pal = k, 'pal'); mk($('fin'), FIN, k => st.fin = k);
  for (let i = 0; i < 4; i++) { const c = document.createElement('input'); c.type = 'color'; c.id = 'a_c' + i; c.setAttribute('aria-label', 'Warna ' + (i + 1)); c.oninput = () => { PAL.Custom = [0, 1, 2, 3].map(n => $('c' + n).value); st.pal = 'Custom'; document.querySelector('#a_pals [data-k=Custom]').style.background = `linear-gradient(90deg,${PAL.Custom.join(',')})`; ui(); comp(); }; $('cps').append(c); }
  const FULL = ['ib', 'sc', 'wp', 'ct', 'bd', 'sf', 'sw'];
  SL.forEach(([id, lb, mn, mx, v, g]) => {
    const l = document.createElement('label'); l.className = 'sl'; l.id = 'a_l_' + id;
    l.innerHTML = `<span>${lb}</span><input type="range" id="a_${id}" min="${mn}" max="${mx}" value="${v}">`;
    $('sl' + g).append(l); $(id).oninput = FULL.includes(id) ? full : comp;
  });
  $('inv').oninput = comp;
  $('mir').onchange = () => { st.mir = $('mir').checked; full(); };
  $('sd').onchange = () => { st.seed = +$('sd').value | 0; full(); };
  const loadImg = (f, cb) => { if (!f) return; const i = new Image(); i.onload = () => cb(i); i.src = URL.createObjectURL(f); };
  $('imf').onchange = e => loadImg(e.target.files[0], i => { IMG = i; $('ims').checked = true; ui(); full(); });
  $('ims').onchange = full; $('imx').onclick = () => { IMG = null; $('ims').checked = false; $('imf').value = ''; ui(); full(); };
  function rnd() { st.seed = Math.random() * 1e6 | 0; st.cx = .2 + Math.random() * .6; st.cy = .2 + Math.random() * .6; ui(); full(); }
  const pick = o => { const k = Object.keys(o); return k[Math.random() * k.length | 0]; };
  const rr = (id, a, b) => $(id).value = a + Math.random() * (b - a) | 0, ch = (id, p, a, b) => $(id).value = Math.random() < p ? a + Math.random() * (b - a) | 0 : 0;
  const HIST = [], PIDS = SL.map(s => s[0]), DEF = {}; SL.forEach(s => DEF[s[0]] = s[4]);
  const updUB = () => { $('ub').disabled = !HIST.length; $('ub').textContent = '↶ Kembali' + (HIST.length ? ` (${HIST.length})` : ''); };
  function getSnap() { const v = {}; PIDS.forEach(k => v[k] = $(k).value); return { s: { sty: st.sty, pal: st.pal, fin: st.fin, seed: st.seed, cx: st.cx, cy: st.cy, mir: st.mir, glass: st.glass }, v, c: [...PAL.Custom], i: $('inv').checked }; }
  function setSnap(hh) { Object.assign(st, hh.s); PIDS.forEach(k => { if (hh.v && hh.v[k] != null) $(k).value = hh.v[k]; }); if (Array.isArray(hh.c) && hh.c.length === 4) PAL.Custom = [...hh.c]; $('inv').checked = !!hh.i; document.querySelector('#a_pals [data-k=Custom]').style.background = `linear-gradient(90deg,${PAL.Custom.join(',')})`; }
  function push() { HIST.push(getSnap()); if (HIST.length > 10) HIST.shift(); updUB(); }
  function undo() { const hh = HIST.pop(); if (!hh) return; setSnap(hh); updUB(); ui(); full(); }
  $('rnd').onclick = () => { push(); rnd(); }; $('ub').onclick = undo;
  function randomizeAll() {
    push(); st.sty = pick(STY); st.pal = pick(PAL); st.fin = Math.random() < .55 ? 'none' : pick(FIN); st.mir = Math.random() < .2; st.glass = Math.random() < .2 ? pick({ v: 1, h: 1, d: 1, c: 1, r: 1 }) : ''; $('bm').checked = false;
    rr('gw', 10, 50); rr('gk', 30, 80); rr('sc', 1, 5); rr('wp', 60, 260); rr('ct', 18, 40); rr('bd', 3, 10); rr('sf', 8, 35); rr('dt', 6, 14); ch('sw', .2, 10, 70); ch('ps', .2, 3, 6); ch('rg', .3, 2, 10); ch('rl', .3, 20, 70); ch('px', .1, 4, 14); ch('wv', .15, 4, 16); ch('gl', .15, 20, 60); ch('sl', .15, 20, 60); ch('sp', .25, 10, 50);
    $('nf').checked ? $('fd').value = 0 : ch('fd', .3, 30, 80); ch('vg', .3, 20, 60); rr('gr', 20, 70); rnd();
  }
  $('rall').onclick = randomizeAll;
  const tg = (a, b, v) => { $(a).onclick = () => { st.v = v; $(a).classList.add('on'); $(b).classList.remove('on'); draw(); }; }; tg('v1', 'v2', 1); tg('v2', 'v1', 2);

  // glass + brush
  for (const k in GLS) { const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.textContent = GLS[k]; b.onclick = () => { push(); st.glass = k; ui(); comp(); }; $('gmodes').append(b); }
  const pvc = $('pv'); let painting = false, lastP = null;
  function stamp(x, y) { const r = val('gb') / 2, gr = BMx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.65, 'rgba(0,0,0,.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); BMx.fillStyle = gr; BMx.beginPath(); BMx.arc(x, y, r, 0, 7); BMx.fill(); BMd = true; }
  function bpos(e) { const r = pvc.getBoundingClientRect(); let nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height; if (st.v == 2) { nx = (nx * 2) % 1; ny = (ny * 2) % 1; } return [nx * 560, ny * 560]; }
  pvc.onpointerdown = e => { if (!$('bm').checked) return; painting = true; pvc.setPointerCapture(e.pointerId); lastP = bpos(e); stamp(lastP[0], lastP[1]); comp(); };
  pvc.onpointermove = e => { if (!painting) return; const p = bpos(e), dx = p[0] - lastP[0], dy = p[1] - lastP[1], n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (val('gb') / 6))); for (let i = 1; i <= n; i++)stamp(lastP[0] + dx * i / n, lastP[1] + dy * i / n); lastP = p; comp(); };
  pvc.onpointerup = pvc.onpointercancel = () => { painting = false; };
  $('bx').onclick = () => { BMx.clearRect(0, 0, 560, 560); BMd = false; comp(); };
  $('bm').onchange = () => { pvc.style.touchAction = $('bm').checked ? 'none' : ''; pvc.style.cursor = $('bm').checked ? 'crosshair' : ''; if ($('bm').checked && !st.glass) { st.glass = 'v'; ui(); } comp(); };

  // sample desain
  function applyPreset(p) { setSnap({ s: { sty: 'liquid', pal: 'B&W', fin: 'none', seed: 11, cx: .5, cy: .5, mir: false, glass: '', ...p[1] }, v: { ...DEF, ...p[2] }, c: PAL.Custom, i: false }); BMx.clearRect(0, 0, 560, 560); BMd = false; $('bm').checked = false; }
  PRE.forEach((p, i) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `<canvas id="a_pt${i}" width="96" height="96"></canvas><span></span>`; b.lastChild.textContent = p[0]; b.onclick = () => { push(); applyPreset(p); ui(); full(); }; $('sg').append(b); });
  let thumbsDone = false;
  function thumbs() {
    if (thumbsDone) return; thumbsDone = true;
    const keep = getSnap(), keepR = R; let i = 0;
    const step = () => { // dicicil per frame agar UI tetap responsif
      if (i >= PRE.length) { setSnap(keep); build(keepR); ui(); draw(); changed(); return; }
      applyPreset(PRE[i]); build(120); $('pt' + i).getContext('2d').drawImage(pat, 0, 0, 96, 96); i++; requestAnimationFrame(step);
    };
    step();
  }

  // referensi warna
  function setCustom(a) { PAL.Custom = a; st.pal = 'Custom'; document.querySelector('#a_pals [data-k=Custom]').style.background = `linear-gradient(90deg,${a.join(',')})`; ui(); comp(); }
  REFS.forEach(([n, a]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ref'; b.innerHTML = '<i></i><span></span>'; b.firstChild.style.background = `linear-gradient(90deg,${a[0]} 25%,${a[1]} 25% 50%,${a[2]} 50% 75%,${a[3]} 75%)`; b.lastChild.textContent = n; b.onclick = () => { push(); setCustom([...a]); }; $('refs').append(b); });
  function hexes() { const r = $('hexrow'); r.innerHTML = ''; PAL[st.pal].forEach(hx => { const b = document.createElement('button'); b.type = 'button'; b.className = 'hx'; b.textContent = hx; b.style.borderLeftColor = hx; b.title = 'Salin ' + hx; b.onclick = () => { navigator.clipboard?.writeText(hx).then(() => toast('Tersalin ' + hx), () => { }); }; r.append(b); }); }
  const hx = a => '#' + a.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  function extract(img) {
    const c = document.createElement('canvas'); c.width = c.height = 48; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 48, 48); const d = x.getImageData(0, 0, 48, 48).data, px = []; for (let i = 0; i < d.length; i += 4)px.push([d[i], d[i + 1], d[i + 2]]);
    let cs = [0, 1, 2, 3].map(i => px[Math.floor((i + .5) * px.length / 4)].slice()); for (let it = 0; it < 8; it++) { const sm = cs.map(() => [0, 0, 0, 0]); px.forEach(p => { let b = 0, bd = 1e9; cs.forEach((c, i) => { const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (dd < bd) { bd = dd; b = i; } }); const s = sm[b]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; }); cs = cs.map((c, i) => sm[i][3] ? [sm[i][0] / sm[i][3], sm[i][1] / sm[i][3], sm[i][2] / sm[i][3]] : c); }
    cs.sort((a, b) => (a[0] * .3 + a[1] * .59 + a[2] * .11) - (b[0] * .3 + b[1] * .59 + b[2] * .11)); return cs.map(hx);
  }
  $('rff').onchange = e => loadImg(e.target.files[0], i => { push(); setCustom(extract(i)); toast('Warna diambil dari gambar'); });

  // simpan / muat state (untuk project)
  function bm64() { if (!BMd) return null; const c = document.createElement('canvas'); c.width = c.height = 64; c.getContext('2d').drawImage(BM, 0, 0, 64, 64); return c.toDataURL('image/png'); }
  function getState() { return { ...getSnap(), brush: bm64() }; }
  function setState(s) {
    if (!s || !s.s) return;
    setSnap(s); BMx.clearRect(0, 0, 560, 560); BMd = false;
    if (typeof s.brush === 'string' && s.brush.startsWith('data:image/png')) { const i = new Image(); i.onload = () => { BMx.drawImage(i, 0, 0, 560, 560); BMd = true; comp(); }; i.src = s.brush; }
    ui(); full();
  }

  build(560); ui(); draw();
  return {
    pat, build, getState, setState, randomizeAll, thumbs,
    get size() { return R; },
    get version() { return version; },
    /** Pastikan tile resolusi tinggi untuk tekstur / export. Kembalikan ke 560 sesudahnya bila restore=true. */
    ensure(sz) { if (R !== sz) build(sz); },
    preview() { if (R !== 560) build(560); draw(); },
  };
}
