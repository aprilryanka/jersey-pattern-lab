import { DYE_STYLES, drawDye } from './dye.js';
import { STRIPEX_STYLES, STRIPEX_PALETTES, drawStripeX } from './stripex.js';
import { VINTAGE_STYLES, VINTAGE_PALETTES, VINTAGE_STYLE_PALETTE, VINTAGE_THUMB, drawVintage } from './vintage.js';

// Motif kategori Tie-dye (dye.js), Strip, dan Fauna. Digambar di "ruang garmen" (mm, y ke bawah), sama seperti Basic.
// Posisi acak memakai hash per sel grid global, jadi motif menyambung antar panel.
// Warna: c1 = dasar, c2 = warna utama motif, c3 = aksen.

export const TIEDYE_STYLES = DYE_STYLES;
export const VINTAGE = { styles: VINTAGE_STYLES, palettes: VINTAGE_PALETTES };
export const STRIPE_STYLES = [
  ['st_classic', 'Klasik'], ['st_pin', 'Pinstripe'], ['st_chalk', 'Chalk'], ['st_double', 'Ganda'],
  ['st_wide_thin', 'Lebar-tipis'], ['st_triple', 'Tiga'], ['st_hoops', 'Hoops'], ['st_diag', 'Diagonal'],
  ['st_sash', 'Selempang'], ['st_racing', 'Racing'], ['st_fade', 'Pudar'], ['st_grow', 'Menebal'],
  ['st_barcode', 'Barcode'], ['st_zigzag', 'Zigzag'], ['st_wavy', 'Bergelombang'], ['st_dash', 'Putus-putus'],
  ['st_broken', 'Patah'],
  ...STRIPEX_STYLES,
];
export const FAUNA_STYLES = [
  ['fa_zebra', 'Zebra'], ['fa_tiger', 'Harimau'], ['fa_leopard', 'Macan tutul'], ['fa_jaguar', 'Jaguar'],
  ['fa_cheetah', 'Cheetah'], ['fa_giraffe', 'Jerapah'], ['fa_cow', 'Sapi'], ['fa_dalmatian', 'Dalmatian'],
  ['fa_snake', 'Ular'], ['fa_scales', 'Sisik ikan'], ['fa_peacock', 'Merak'],
];

export const TIEDYE_PALETTES = [ // c1 = bagian terang/resist, c2 = warna tengah, c3 = celupan paling pekat
  ['#f3f8fd', '#3a6fae', '#0c2552'], ['#ffd6e8', '#e83e9a', '#15131a'], ['#f1f1f1', '#8d8d8d', '#1b1b1d'], ['#eefbff', '#2ab3d8', '#0a3f7a'],
  ['#fff4e0', '#ff8a3d', '#7a1d4a'], ['#f4eaff', '#9b5cff', '#2a1466'], ['#f2fff4', '#2dc98a', '#0b3d3a'], ['#fff0f0', '#e63946', '#3a0b18'],
  ['#fffbe6', '#f2b705', '#7a3b00'], ['#e8f0ff', '#5b7bd5', '#1a1f5c'], ['#fdeff7', '#ff4fd8', '#3a1a8f'], ['#f7f1e3', '#a7885a', '#2b2216'],
];
export const STRIPE_PALETTES = [
  ['#ffffff', '#111111', '#e8c547'], ['#ffffff', '#0b3d91', '#f2b705'], ['#c8102e', '#ffffff', '#111111'], ['#0b3d91', '#ffffff', '#e63946'],
  ['#006b3f', '#ffffff', '#f2b705'], ['#111111', '#ffffff', '#c8102e'], ['#7b1fa2', '#ffffff', '#f2b705'], ['#f2b705', '#111111', '#ffffff'],
  ['#6ec6ff', '#ffffff', '#0b3d91'], ['#800020', '#6ec6ff', '#ffffff'], ['#ff7a00', '#111111', '#ffffff'], ['#0a8f8f', '#ffffff', '#1f2a44'],
  ...STRIPEX_PALETTES,
];
export const FAUNA_PALETTES = [
  ['#f5f5f0', '#101010', '#9a9a9a'], ['#f08a24', '#1a1208', '#f6e6c8'], ['#d9a441', '#2a1a0c', '#a8742a'], ['#e6e3dc', '#3a3a3a', '#a9a59c'],
  ['#ffffff', '#111111', '#8a8a8a'], ['#e8cf9a', '#7a4a1e', '#4a2c10'], ['#8a7a3a', '#3b2f12', '#d8c88a'], ['#ffffff', '#141414', '#6b4a2a'],
  ['#2f6b3a', '#0f2a14', '#b8d98a'], ['#0a6ea8', '#06314f', '#7fd3f5'], ['#0a7a6a', '#0b2a6b', '#e0b030'], ['#c8302a', '#1a0a08', '#f6c8a0'],
];

// Palet alami per motif fauna: dipakai otomatis saat motif dipilih (selama warna belum diubah manual).
export const STYLE_PALETTE = {
  ...Object.fromEntries(Object.entries(VINTAGE_STYLE_PALETTE)),
  ...Object.fromEntries(Object.entries({ sx_bold: 0, sx_rhythm: 2, sx_multi: 5, sx_pin_gold: 1, sx_fade: 4, sx_rainbow: 5, sx_blur: 3, sx_zig_in: 3, sx_line_in: 0, sx_pixel: 0, sx_bolt: 2, sx_ibiza: 7 }).map(([k, v]) => [k, v + 12])),
  fa_zebra: 0, fa_tiger: 1, fa_leopard: 2, fa_jaguar: 2, fa_cheetah: 2, fa_giraffe: 5, fa_cow: 4, fa_dalmatian: 7, fa_snake: 6, fa_scales: 9, fa_peacock: 10,
};

// Motif berukuran besar perlu area thumbnail lebih luas supaya terlihat utuh.
export const THUMB_SCALE = {
  ...VINTAGE_THUMB, sx_bold: 1.6, sx_rhythm: 1.8, sx_multi: 1.3, sx_pin_gold: 1.2, sx_fade: 2, sx_rainbow: 1.6, sx_blur: 1.6, sx_zig_in: 1.7, sx_line_in: 1.6, sx_pixel: 2, sx_bolt: 1.6, sx_ibiza: 1.5,
  td_spiral: 3.3, td_swirl: 3.3, td_burst: 3, td_mini: 1.8, td_ombre: 3.8, td_crush: 2.7, td_cloud: 3.8,
  st_sash: 3, st_racing: 1.6, st_grow: 2, st_triple: 1.4, st_barcode: 1.4, st_broken: 1.2,
  fa_zebra: 2, fa_tiger: 1.8, fa_leopard: 1.6, fa_jaguar: 1.6, fa_cheetah: 1.3, fa_giraffe: 1.8, fa_cow: 3.2, fa_dalmatian: 1.5, fa_snake: 2.4, fa_scales: 1, fa_peacock: 1.8,
};

/* ---------- helper ---------- */
function hash(i, j, s, k = 0) {
  let n = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(s | 0, 1013) + Math.imul(k, 2654435761);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hx = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const rgba = (h, a) => { const c = hx(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };

function eachCell(r, cw, ch, fn) {
  const i0 = Math.floor(r.x0 / cw) - 1, i1 = Math.ceil(r.x1 / cw) + 1, j0 = Math.floor(r.y0 / ch) - 1, j1 = Math.ceil(r.y1 / ch) + 1;
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) fn(i, j);
}
// Grid heksagonal: baris bergeser setengah sel.
function eachHex(r, cell, fn, extra = 1) {
  const rh = cell * .866, j0 = Math.floor(r.y0 / rh) - extra, j1 = Math.ceil(r.y1 / rh) + extra;
  const i0 = Math.floor(r.x0 / cell) - extra, i1 = Math.ceil(r.x1 / cell) + extra;
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) fn(i, j, (i + ((j & 1) ? .5 : 0)) * cell, j * rh);
}
function smoothClosed(ctx, pts) {
  const m = pts.length, mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const s = mid(pts[m - 1], pts[0]); ctx.moveTo(s[0], s[1]);
  for (let i = 0; i < m; i++) { const e = mid(pts[i], pts[(i + 1) % m]); ctx.quadraticCurveTo(pts[i][0], pts[i][1], e[0], e[1]); }
  ctx.closePath();
}
function blob(ctx, cx, cy, r, salt, seed, m = 10, v = .7) {
  const pts = [];
  for (let i = 0; i < m; i++) { const a = i / m * TAU, rr = r * (1 - v / 2 + hash(salt, i, seed, 31) * v); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  ctx.beginPath(); smoothClosed(ctx, pts); ctx.fill();
}
// Putar sistem koordinat: hitung batas area dalam kerangka yang diputar.
function rotated(ctx, r, deg, fn) {
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const xs = [], ys = [];
  for (const [x, y] of [[r.x0, r.y0], [r.x1, r.y0], [r.x0, r.y1], [r.x1, r.y1]]) { xs.push(x * c + y * s); ys.push(-x * s + y * c); }
  ctx.save(); ctx.rotate(a);
  fn({ x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) });
  ctx.restore();
}
function vbars(ctx, r, period, bars) { // bars: [offset, width, color]
  for (let x = Math.floor(r.x0 / period) * period - period; x < r.x1 + period; x += period) for (const [o, w, col] of bars) { ctx.fillStyle = col; ctx.fillRect(x + o, r.y0, w, r.y1 - r.y0); }
}

/* ---------- STRIP ---------- */
function drawStripe(ctx, r, st, c) {
  const [c1, c2, c3] = c, k = st.scale || 1, seed = st.seed | 0, gh = st.gh || 760;
  const H = r.y1 - r.y0;
  switch (st.style) {
    case 'st_classic': { const w = 46 * k; vbars(ctx, r, w * 2, [[0, w, c2]]); break; }
    case 'st_pin': { const p = 24 * k; vbars(ctx, r, p, [[p / 2 - 1.6 * k, 3.2 * k, c2]]); break; }
    case 'st_chalk': { // garis kapur halus di atas dasar gelap (c2); c1 = warna kapur
      const p = 36 * k, seg = 64 * k;
      ctx.fillStyle = c2; ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, H);
      for (let x = Math.floor(r.x0 / p) * p - p; x < r.x1 + p; x += p) {
        const i = Math.round(x / p);
        for (let y = Math.floor(r.y0 / seg) * seg - seg; y < r.y1 + seg; y += seg) {
          const j = Math.round(y / seg), w = (2 + hash(i, j, seed, 1) * .9) * k;
          ctx.fillStyle = rgba(c1, .72 + hash(i, j, seed, 3) * .28); ctx.fillRect(x + (hash(i, j, seed, 2) - .5) * .6 * k, y, w, seg + .6);
        }
      }
      break;
    }
    case 'st_double': { const p = 60 * k, w = 7 * k; vbars(ctx, r, p, [[p / 2 - w * 1.6, w, c2], [p / 2 + w * .6, w, c2]]); break; }
    case 'st_wide_thin': { const w = 42 * k, t = 7 * k, p = w + t + 28 * k; vbars(ctx, r, p, [[0, w, c2], [w + 14 * k, t, c3]]); break; }
    case 'st_triple': { const a = 26 * k, b = 12 * k, g = 14 * k, p = a * 2 + b + g * 2 + 56 * k; vbars(ctx, r, p, [[0, a, c2], [a + g, b, c3], [a + g + b + g, a, c2]]); break; }
    case 'st_hoops': {
      const h = 44 * k, p = h * 2;
      ctx.fillStyle = c2; for (let y = Math.floor(r.y0 / p) * p - p; y < r.y1 + p; y += p) ctx.fillRect(r.x0, y, r.x1 - r.x0, h);
      break;
    }
    case 'st_diag': rotated(ctx, r, 45, q => { const w = 40 * k; ctx.fillStyle = c2; for (let x = Math.floor(q.x0 / (w * 2)) * w * 2 - w * 2; x < q.x1 + w * 2; x += w * 2) ctx.fillRect(x, q.y0, w, q.y1 - q.y0); }); break;
    case 'st_sash': rotated(ctx, r, 35, q => {
      const p = 520 * k, w = 110 * k, e = 9 * k;
      for (let x = Math.floor(q.x0 / p) * p - p; x < q.x1 + p; x += p) {
        ctx.fillStyle = c2; ctx.fillRect(x, q.y0, w, q.y1 - q.y0);
        ctx.fillStyle = c3; ctx.fillRect(x - e * 2.2, q.y0, e, q.y1 - q.y0); ctx.fillRect(x + w + e * 1.2, q.y0, e, q.y1 - q.y0);
      }
    }); break;
    case 'st_racing': { const w = 64 * k, l = 7 * k, g = 11 * k, p = 230 * k; vbars(ctx, r, p, [[0, w, c2], [-g - l, l, c3], [w + g, l, c3]]); break; }
    case 'st_fade': {
      const w = 46 * k, p = w * 2, g = ctx.createLinearGradient(0, 0, 0, gh);
      g.addColorStop(0, c2); g.addColorStop(1, c3);
      ctx.fillStyle = g; for (let x = Math.floor(r.x0 / p) * p - p; x < r.x1 + p; x += p) ctx.fillRect(x, r.y0, w, H);
      break;
    }
    case 'st_grow': {
      const ws = [10, 16, 24, 34, 46, 60].map(v => v * k), gap = 18 * k; let P = 0; for (const w of ws) P += w + gap;
      for (let x0 = Math.floor(r.x0 / P) * P - P; x0 < r.x1 + P; x0 += P) {
        let x = x0; ctx.fillStyle = c2; for (const w of ws) { ctx.fillRect(x, r.y0, w, H); x += w + gap; }
      }
      break;
    }
    case 'st_barcode': {
      const u = 11 * k; let x = -3600 * Math.max(.4, k) + hash(seed, 1, seed) * u * 3, i = 0;
      while (x < r.x1) {
        const w = (1 + Math.floor(hash(i, 5, seed, 8) * 4)) * u, pick = hash(i, 6, seed, 9);
        if (x + w > r.x0) { ctx.fillStyle = pick < .5 ? c2 : pick < .78 ? c3 : c1; ctx.fillRect(x, r.y0, w, H); }
        x += w; i++;
      }
      break;
    }
    case 'st_zigzag': case 'st_wavy': {
      const w = 40 * k, p = w * 2, A = 15 * k, L = 70 * k, wave = st.style === 'st_wavy';
      const off = y => wave ? A * Math.sin(y / L * TAU) : A * (Math.abs(((y / L) % 1 + 1) % 1 * 2 - 1) * 2 - 1);
      ctx.fillStyle = c2;
      for (let x = Math.floor(r.x0 / p) * p - p - A; x < r.x1 + p + A; x += p) {
        ctx.beginPath(); const step = wave ? 6 : L / 2, ys = Math.floor((r.y0 - L) / step) * step;
        for (let y = ys; y <= r.y1 + L; y += step) ctx.lineTo(x + off(y), y);
        for (let y = Math.ceil((r.y1 + L) / step) * step; y >= ys; y -= step) ctx.lineTo(x + w + off(y), y);
        ctx.closePath(); ctx.fill();
      }
      break;
    }
    case 'st_dash': {
      const w = 32 * k, p = w * 2, dl = 64 * k, gp = 24 * k;
      for (let x = Math.floor(r.x0 / p) * p - p; x < r.x1 + p; x += p) {
        const i = Math.round(x / p), ph = hash(i, 0, seed, 4) * (dl + gp);
        ctx.fillStyle = c2; for (let y = Math.floor(r.y0 / (dl + gp)) * (dl + gp) - dl - ph; y < r.y1; y += dl + gp) ctx.fillRect(x, y, w, dl);
        ctx.fillStyle = c3; ctx.fillRect(x + w + 4 * k, r.y0, 3 * k, H);
      }
      break;
    }
    case 'st_broken': {
      const w = 36 * k, sh = 78 * k;
      eachCell(r, w, sh, (i, j) => {
        const q = hash(i, j, seed, 11);
        if (q > .72) return;
        ctx.fillStyle = q < .46 ? c2 : c3;
        const len = sh * (.55 + hash(i, j, seed, 13) * .45);
        ctx.fillRect(i * w, j * sh + hash(i, j, seed, 12) * (sh - len), w * .64, len);
      });
      break;
    }
    default: return false;
  }
  return true;
}

/* ---------- FAUNA ---------- */
function blade(ctx, x, y, len, W, bend, salt, seed) {
  const L = [], R = [], n = 14;
  for (let s = 0; s <= n; s++) {
    const t = s / n, cx = x + bend * Math.sin(t * Math.PI) + Math.sin(t * 9 + salt) * W * .06, w = Math.max(.2, W * Math.pow(Math.sin(Math.PI * Math.pow(t, .72)), .85) * (1 + .1 * Math.sin(t * 17 + salt * 2)));
    L.push([cx - w / 2, y + len * t]); R.push([cx + w / 2, y + len * t]);
  }
  ctx.beginPath(); L.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); for (let s = n; s >= 0; s--) ctx.lineTo(R[s][0], R[s][1]); ctx.closePath(); ctx.fill();
}
function rosette(ctx, cx, cy, R, n, col, fill, salt, seed, big) {
  ctx.fillStyle = rgba(fill, .6); ctx.beginPath(); ctx.arc(cx, cy, R * .9, 0, TAU); ctx.fill();
  ctx.fillStyle = col;
  for (let q = 0; q < n; q++) {
    const a = q / n * TAU + hash(salt, q, seed, 1) * .3, rr = R * (.88 + hash(salt, q, seed, 2) * .24), h = .8 + hash(salt, q, seed, 3) * .45;
    ctx.save(); ctx.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); ctx.rotate(a + Math.PI / 2);
    ctx.beginPath(); ctx.ellipse(0, 0, R * (big ? .42 : .36) * h, R * (big ? .26 : .2) * h, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  if (big) { ctx.beginPath(); ctx.arc(cx + (hash(salt, 9, seed) - .5) * R * .3, cy + (hash(salt, 10, seed) - .5) * R * .3, R * .16, 0, TAU); ctx.fill(); }
}
function drawFauna(ctx, r, st, c) {
  const [c1, c2, c3] = c, k = st.scale || 1, seed = st.seed | 0;
  switch (st.style) {
    case 'fa_zebra': {
      const sp = 52 * k, step = 9;
      for (let i = Math.floor(r.x0 / sp) - 3; i < Math.ceil(r.x1 / sp) + 3; i++) {
        const p1 = hash(i, 1, seed, 1) * TAU, p2 = hash(i, 2, seed, 2) * TAU, p3 = hash(i, 3, seed, 3) * TAU;
        const cx = y => i * sp + sp * .3 * Math.sin(y / (150 * k) + p1) + sp * .12 * Math.sin(y / (53 * k) + p2) + (i & 1 ? sp * .04 : 0);
        const hw = y => Math.max(sp * .07, sp * (.27 + .16 * Math.sin(y / (82 * k) + p3)));
        const ys = Math.floor(r.y0 / step) * step - step * 3, ye = r.y1 + step * 3;
        ctx.fillStyle = c2; ctx.beginPath();
        for (let y = ys; y <= ye; y += step) ctx.lineTo(cx(y) - hw(y), y);
        for (let y = ye; y >= ys; y -= step) ctx.lineTo(cx(y) + hw(y), y);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba(c3, .4); ctx.lineWidth = 3 * k; ctx.beginPath();
        for (let y = ys; y <= ye; y += step) y === ys ? ctx.moveTo(cx(y) + sp * .5, y) : ctx.lineTo(cx(y) + sp * .5, y);
        ctx.stroke();
      }
      break;
    }
    case 'fa_tiger': {
      const cw = 66 * k, ch = 140 * k;
      eachCell(r, cw, ch, (i, j) => {
        const o = (i & 1) ? ch * .4 : 0, hh = hash(i, j, seed, 1);
        const x = i * cw + cw * .5 + (hash(i, j, seed, 2) - .5) * cw * .55, y = j * ch + o + (hash(i, j, seed, 3) - .5) * ch * .3;
        if (hash(i, j, seed, 9) < .35) { ctx.fillStyle = rgba(c3, .7); ctx.beginPath(); ctx.ellipse(x + cw * .35, y + ch * .45, cw * .16, ch * .22, .2, 0, TAU); ctx.fill(); }
        if (hh < .9) { ctx.fillStyle = c2; blade(ctx, x, y, ch * (.85 + hash(i, j, seed, 4) * .6), cw * (.38 + hash(i, j, seed, 5) * .3), (hash(i, j, seed, 6) - .5) * cw * 1.1, i * 13 + j, seed); }
        if (hh < .45) { ctx.fillStyle = c2; blade(ctx, x + cw * .48, y + ch * .3, ch * .7, cw * .2, (hash(i, j, seed, 7) - .5) * cw * .8, i * 5 + j, seed); }
      });
      break;
    }
    case 'fa_leopard': case 'fa_jaguar': {
      const big = st.style === 'fa_jaguar', cell = (big ? 150 : 128) * k, R0 = (big ? 40 : 32) * k;
      eachHex(r, cell, (i, j, x, y) => {
        const s = i * 7919 + j, cx = x + (hash(i, j, seed, 1) - .5) * cell * .28, cy = y + (hash(i, j, seed, 2) - .5) * cell * .28;
        rosette(ctx, cx, cy, R0 * (.8 + hash(i, j, seed, 3) * .4), big ? 9 : 7, c2, c3, s, seed, big);
        ctx.fillStyle = c2;
        for (let q = 0; q < 3; q++) { const a = hash(i, j, seed, 20 + q) * TAU, d = cell * (.36 + hash(i, j, seed, 24 + q) * .12); blob(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, (3.5 + hash(i, j, seed, 28 + q) * 4) * k, s * 3 + q, seed, 7, .5); }
      });
      break;
    }
    case 'fa_cheetah': {
      const cell = 52 * k;
      eachCell(r, cell, cell, (i, j) => {
        for (let q = 0; q < 2; q++) {
          if (hash(i, j, seed, 1 + q) < .22) continue;
          const x = i * cell + hash(i, j, seed, 3 + q) * cell, y = j * cell + hash(i, j, seed, 5 + q) * cell, rx = (4.5 + hash(i, j, seed, 7 + q) * 6.5) * k;
          ctx.fillStyle = hash(i, j, seed, 9 + q) < .12 ? c3 : c2;
          ctx.save(); ctx.translate(x, y); ctx.rotate(hash(i, j, seed, 11 + q) * TAU); ctx.beginPath(); ctx.ellipse(0, 0, rx, rx * (.7 + hash(i, j, seed, 13 + q) * .3), 0, 0, TAU); ctx.fill(); ctx.restore();
        }
      });
      break;
    }
    case 'fa_giraffe': {
      const cs = 98 * k, P = (i, j) => [i * cs + (hash(i, j, seed, 1) - .5) * cs * .55, j * cs + (hash(i, j, seed, 2) - .5) * cs * .55];
      eachCell(r, cs, cs, (i, j) => {
        const v = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], cx = (v[0][0] + v[1][0] + v[2][0] + v[3][0]) / 4, cy = (v[0][1] + v[1][1] + v[2][1] + v[3][1]) / 4;
        const shrink = f => v.map(p => [cx + (p[0] - cx) * f, cy + (p[1] - cy) * f]);
        ctx.fillStyle = c2; ctx.beginPath(); smoothClosed(ctx, shrink(.8)); ctx.fill();
        ctx.fillStyle = rgba(c3, .35); ctx.beginPath(); smoothClosed(ctx, shrink(.5)); ctx.fill();
      });
      break;
    }
    case 'fa_cow': {
      const cell = 250 * k;
      ctx.fillStyle = c2;
      eachCell(r, cell, cell, (i, j) => {
        if (hash(i, j, seed, 1) < .5) {
          const x = i * cell + hash(i, j, seed, 2) * cell, y = j * cell + hash(i, j, seed, 3) * cell, R = (55 + hash(i, j, seed, 4) * 55) * k, s = i * 31 + j * 17;
          ctx.fillStyle = c2; blob(ctx, x, y, R, s, seed, 14, .85);
          if (hash(i, j, seed, 5) < .6) blob(ctx, x + R * .8, y + (hash(i, j, seed, 6) - .5) * R, R * .4, s + 1, seed, 9, .7);
          if (hash(i, j, seed, 7) < .5) { ctx.fillStyle = rgba(c3, .8); blob(ctx, x + (hash(i, j, seed, 8) - .5) * R * .6, y + (hash(i, j, seed, 9) - .5) * R * .6, R * .22, s + 2, seed, 8, .6); }
        }
      });
      break;
    }
    case 'fa_dalmatian': {
      const cell = 56 * k;
      eachCell(r, cell, cell, (i, j) => {
        if (hash(i, j, seed, 1) < .35) return;
        const x = i * cell + hash(i, j, seed, 2) * cell, y = j * cell + hash(i, j, seed, 3) * cell, rr = (4 + hash(i, j, seed, 4) * 8) * k;
        ctx.fillStyle = hash(i, j, seed, 5) < .08 ? c3 : c2; blob(ctx, x, y, rr, i * 7 + j, seed, 8, .45);
      });
      break;
    }
    case 'fa_snake': {
      const s = 24 * k, cell = 156 * k;
      ctx.fillStyle = c2;
      eachHex(r, cell, (i, j, x, y) => {
        const cx = x + (hash(i, j, seed, 1) - .5) * cell * .2, cy = y + (hash(i, j, seed, 2) - .5) * cell * .2, R = cell * (.3 + hash(i, j, seed, 3) * .1), pts = [];
        for (let q = 0; q < 6; q++) { const a = q / 6 * TAU + .3, rr = R * (.75 + hash(i, j, seed, 10 + q) * .5); pts.push([cx + Math.cos(a) * rr * 1.35, cy + Math.sin(a) * rr]); }
        ctx.fillStyle = c2; ctx.beginPath(); smoothClosed(ctx, pts); ctx.fill();
        ctx.fillStyle = rgba(c3, .55); ctx.beginPath(); smoothClosed(ctx, pts.map(p => [cx + (p[0] - cx) * .5, cy + (p[1] - cy) * .5])); ctx.fill();
      });
      ctx.strokeStyle = 'rgba(0,0,0,.26)'; ctx.lineWidth = Math.max(.8, s * .06); ctx.beginPath();
      const j0 = Math.floor(r.y0 / (s / 2)) - 1, j1 = Math.ceil(r.y1 / (s / 2)) + 1, i0 = Math.floor(r.x0 / s) - 1, i1 = Math.ceil(r.x1 / s) + 1;
      for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
        const x = (i + ((j & 1) ? .5 : 0)) * s, y = j * s / 2;
        ctx.moveTo(x, y - s / 2); ctx.lineTo(x + s / 2, y); ctx.lineTo(x, y + s / 2); ctx.lineTo(x - s / 2, y); ctx.closePath();
      }
      ctx.stroke();
      break;
    }
    case 'fa_scales': {
      const s = 40 * k, rows = [mix(c1, c2, .15), mix(c1, c2, .4), c1];
      const j0 = Math.floor(r.y0 / (s / 2)) - 2, j1 = Math.ceil(r.y1 / (s / 2)) + 2, i0 = Math.floor(r.x0 / s) - 2, i1 = Math.ceil(r.x1 / s) + 2;
      ctx.lineWidth = Math.max(1, s * .05);
      for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
        const x = (i + ((j & 1) ? .5 : 0)) * s, y = j * s / 2, h = hash(i, j, seed, 1);
        const g = ctx.createLinearGradient(0, y - s / 2, 0, y + s / 2); g.addColorStop(0, h < .5 ? rows[0] : rows[1]); g.addColorStop(1, h < .5 ? rows[1] : c2);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s / 2, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(c3, .75); ctx.stroke();
        ctx.strokeStyle = rgba(c3, .25); ctx.beginPath(); ctx.arc(x, y, s * .3, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      }
      break;
    }
    case 'fa_peacock': {
      const cell = 150 * k;
      eachHex(r, cell, (i, j, x, y) => {
        const cx = x + (hash(i, j, seed, 1) - .5) * cell * .1, cy = y + (hash(i, j, seed, 2) - .5) * cell * .1, rot = (hash(i, j, seed, 3) - .5) * .5, ry = cell * .5, rx = cell * .34;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
        ctx.strokeStyle = rgba(c2, .35); ctx.lineWidth = 1.5 * k;
        for (let q = 0; q < 28; q++) { const a = q / 28 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * rx * .92, Math.sin(a) * ry * .92); ctx.lineTo(Math.cos(a) * rx * 1.18, Math.sin(a) * ry * 1.18); ctx.stroke(); }
        [[1, c2], [.82, c3], [.62, mix(c2, c1, .4)], [.4, c2], [.2, c3]].forEach(([f, col]) => { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, rx * f, ry * f, 0, 0, TAU); ctx.fill(); });
        ctx.restore();
      });
      break;
    }
    default: return false;
  }
  return true;
}

/** Gambar motif kategori baru. Mengembalikan true bila style dikenali. */
export function drawMotif(ctx, r, st) {
  const id = st.style || '';
  if (id.startsWith('st_')) return drawStripe(ctx, r, st, st.colors);
  if (id.startsWith('sx_')) return drawStripeX(ctx, r, st);
  if (id.startsWith('vt_')) return drawVintage(ctx, r, st);
  if (id.startsWith('td_')) return drawDye(ctx, r, st);
  if (id.startsWith('fa_')) return drawFauna(ctx, r, st, st.colors);
  return false;
}
