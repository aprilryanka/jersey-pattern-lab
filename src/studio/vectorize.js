// Vectorize pattern -> SVG (warna datar / posterize).
// Mesin yang sama dengan versi Jersey Pattern Lab sebelumnya: k-means warna, lapisan bertumpuk
// (gelap ke terang), pelacakan kontur per lapisan, penyederhanaan Douglas-Peucker, kurva kuadratik.
// Berjalan penuh di browser, tanpa library dan tanpa server.
import { drawBasic } from './basic.js';

export const VEC_DEFAULT = { colors: 8, smooth: 12, speckle: 30, blur: 1, res: 900 };
export const VEC_SLIDERS = [ // [key, label, min, max, step, format]
  ['colors', 'Jumlah warna', 2, 16, 1, v => v + ' warna'],
  ['smooth', 'Kehalusan', 1, 40, 1, v => v],
  ['speckle', 'Buang bintik kecil', 0, 300, 5, v => v ? v + ' px²' : 'Mati'],
  ['blur', 'Haluskan gambar', 0, 4, .5, v => v ? v : 'Mati'],
  ['res', 'Resolusi tracing', 500, 1400, 50, v => v + ' px'],
];

const lumA = c => c[0] * .3 + c[1] * .59 + c[2] * .11;

function traceMask(m, w, h, has) {
  const W1 = w + 1, starts = []; has.fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!m[y * w + x]) continue;
    if (y === 0 || !m[(y - 1) * w + x]) { const e = (y * W1 + x) * 4; has[e] = 1; starts.push(e); }
    if (x === w - 1 || !m[y * w + x + 1]) { const e = (y * W1 + x + 1) * 4 + 1; has[e] = 1; starts.push(e); }
    if (y === h - 1 || !m[(y + 1) * w + x]) { const e = ((y + 1) * W1 + x + 1) * 4 + 2; has[e] = 1; starts.push(e); }
    if (x === 0 || !m[y * w + x - 1]) { const e = ((y + 1) * W1 + x) * 4 + 3; has[e] = 1; starts.push(e); }
  }
  const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1], loops = [];
  for (const s of starts) {
    if (!has[s]) continue; has[s] = 0;
    let v = s >> 2, d = s & 3, pd = -1; const L = [];
    for (;;) {
      const x = v % W1, y = (v / W1) | 0; if (d !== pd) { L.push([x, y]); pd = d; }
      const nv = (y + DY[d]) * W1 + x + DX[d]; let nd = -1;
      for (const t of [(d + 1) & 3, d, (d + 3) & 3]) { const e = nv * 4 + t; if (e === s) { nd = -2; break; } if (has[e]) { nd = t; break; } }
      if (nd < 0) break; has[nv * 4 + nd] = 0; v = nv; d = nd;
    }
    loops.push(L);
  }
  return loops;
}

function dp(S, tol) {
  const n = S.length, keep = new Uint8Array(n); keep[0] = keep[n - 1] = 1; const st = [[0, n - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let mi = -1, md = tol;
    const ax = S[a][0], ay = S[a][1], dx = S[b][0] - ax, dy = S[b][1] - ay, L = Math.hypot(dx, dy) || 1e-9;
    for (let i = a + 1; i < b; i++) { const q = Math.abs((S[i][0] - ax) * dy - (S[i][1] - ay) * dx) / L; if (q > md) { md = q; mi = i; } }
    if (mi >= 0) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return S.filter((_, i) => keep[i]);
}
function simp(P, tol) {
  const n = P.length; if (n < 6) return P; let fi = 1, fd = 0;
  for (let i = 1; i < n; i++) { const q = (P[i][0] - P[0][0]) ** 2 + (P[i][1] - P[0][1]) ** 2; if (q > fd) { fd = q; fi = i; } }
  const a = dp(P.slice(0, fi + 1), tol), b = dp(P.slice(fi).concat([P[0]]), tol);
  return a.concat(b.slice(1, -1));
}
const f1 = v => Math.round(v * 10) / 10;
function smoothPath(P0, Lm) {
  const P = [];
  for (let i = 0, k = P0.length; i < k; i++) {
    const a = P0[i], b = P0[(i + 1) % k], c = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / Lm));
    for (let j = 0; j < c; j++) P.push([a[0] + (b[0] - a[0]) * j / c, a[1] + (b[1] - a[1]) * j / c]);
  }
  const n = P.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m0 = mid(P[n - 1], P[0]);
  let s = 'M' + f1(m0[0]) + ' ' + f1(m0[1]);
  for (let i = 0; i < n; i++) { const c = P[i], m = mid(c, P[(i + 1) % n]); s += 'Q' + f1(c[0]) + ' ' + f1(c[1]) + ' ' + f1(m[0]) + ' ' + f1(m[1]); }
  return s + 'Z';
}
const areaOf = L => { let a = 0; for (let i = 0, n = L.length; i < n; i++) { const p = L[i], q = L[(i + 1) % n]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };

/** ImageData -> {body, colors, paths}. tol = smooth/10, minA = speckle. */
export function vecTrace(id, w, h, n, tol, minA) {
  const d = id.data, N = w * h, px = [], step = Math.max(1, Math.floor(N / 20000));
  for (let i = 0; i < N; i += step) { const q = i * 4; if (d[q + 3] >= 128) px.push([d[q], d[q + 1], d[q + 2]]); }
  if (!px.length) return null;
  n = Math.min(n, px.length); px.sort((a, b) => lumA(a) - lumA(b));
  let cs = Array.from({ length: n }, (_, i) => px[Math.floor((i + .5) * px.length / n)].slice());
  for (let it = 0; it < 8; it++) {
    const s = cs.map(() => [0, 0, 0, 0]);
    for (const p of px) {
      let b = 0, bd = 1e9;
      for (let k = 0; k < n; k++) { const c = cs[k], q = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (q < bd) { bd = q; b = k; } }
      const t = s[b]; t[0] += p[0]; t[1] += p[1]; t[2] += p[2]; t[3]++;
    }
    cs = cs.map((c, k) => s[k][3] ? [s[k][0] / s[k][3], s[k][1] / s[k][3], s[k][2] / s[k][3]] : c);
  }
  cs.sort((a, b) => lumA(a) - lumA(b));
  const idx = new Int8Array(N);
  for (let i = 0; i < N; i++) {
    const q = i * 4; if (d[q + 3] < 128) { idx[i] = -1; continue; }
    let b = 0, bd = 1e9;
    for (let k = 0; k < n; k++) { const c = cs[k], e = (d[q] - c[0]) ** 2 + (d[q + 1] - c[1]) ** 2 + (d[q + 2] - c[2]) ** 2; if (e < bd) { bd = e; b = k; } }
    idx[i] = b;
  }
  const has = new Uint8Array((w + 1) * (h + 1) * 4), m = new Uint8Array(N), out = []; let paths = 0;
  for (let k = 0; k < n; k++) {
    let cnt = 0; for (let i = 0; i < N; i++) { const v = idx[i] >= k ? 1 : 0; m[i] = v; cnt += v; }
    if (!cnt) continue;
    const col = '#' + cs[k].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    if (cnt === N) { out.push(`<rect width="${w}" height="${h}" fill="${col}"/>`); paths++; continue; }
    let ds = '';
    for (const L of traceMask(m, w, h, has)) { if (areaOf(L) < minA) continue; const s = simp(L, tol); if (s.length >= 3) ds += smoothPath(s, Math.max(2, tol * 2.5)); }
    if (ds) { out.push(`<path fill="${col}" fill-rule="evenodd" d="${ds}"/>`); paths++; }
  }
  return { body: out.join(''), colors: n, paths };
}

/**
 * Sumber raster untuk di-vector.
 * kind 'pattern': tile pattern saat ini (Advanced: tile seamless; Basic: area 60×60 cm).
 * kind 'sheet': semua panel pola jahit (atlas UV) termasuk teks/logo.
 */
export function vecSource({ kind, S, adv, atlas, res, blur, texSize }) {
  let c, w, h;
  if (kind === 'sheet' && atlas) {
    w = res; h = Math.round(res * atlas.height / atlas.width);
    c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(atlas, 0, 0, w, h);
  } else {
    w = h = res; c = document.createElement('canvas'); c.width = c.height = res;
    const x = c.getContext('2d');
    if (S.mode === 'advanced' && adv) { adv.ensure(res); x.drawImage(adv.pat, 0, 0, res, res); adv.ensure(texSize); }
    else { x.scale(res / 600, res / 600); drawBasic(x, { x0: 0, y0: 0, x1: 600, y1: 600 }, { ...S.basic, gh: 600 }); }
  }
  const c2 = document.createElement('canvas'); c2.width = w; c2.height = h;
  const x2 = c2.getContext('2d', { willReadFrequently: true });
  if (blur > 0) x2.filter = `blur(${blur * w / 900}px)`;
  x2.drawImage(c, 0, 0);
  return { id: x2.getImageData(0, 0, w, h), w, h };
}

/** Jalankan seluruh proses, hasil string SVG + info. */
export function vectorize(src, o) {
  const t = vecTrace(src.id, src.w, src.h, o.colors, o.smooth / 10, o.speckle);
  if (!t) return null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${src.w} ${src.h}" width="${src.w}" height="${src.h}" shape-rendering="geometricPrecision">${t.body}</svg>`;
  return { svg, w: src.w, h: src.h, colors: t.colors, paths: t.paths, kb: Math.round(svg.length / 1024) };
}
