// Vectorize: gambar raster -> SVG (kuantisasi warna + pelacakan kontur + penghalusan kurva).
// Seluruhnya jalan di browser, tanpa library.

export const TRACE_PRESETS = [
  { id: 'logo', name: 'Logo bersih', hint: '3 warna, tepi halus', o: { mode: 'color', colors: 3, detail: 320, smooth: 70, speckle: 12, dropBg: true, invert: false, usePalette: false } },
  { id: 'siluet', name: 'Siluet', hint: 'Satu warna solid', o: { mode: 'mono', threshold: 0, detail: 400, smooth: 60, speckle: 20, dropBg: true, invert: false, usePalette: false } },
  { id: 'poster', name: 'Poster 4 warna', hint: 'Gaya sablon', o: { mode: 'color', colors: 4, detail: 360, smooth: 55, speckle: 10, dropBg: false, invert: false, usePalette: false } },
  { id: 'foto', name: 'Foto detail', hint: '8 warna, banyak detail', o: { mode: 'color', colors: 8, detail: 480, smooth: 35, speckle: 4, dropBg: false, invert: false, usePalette: false } },
  { id: 'sketsa', name: 'Sketsa garis', hint: 'Garis tipis tajam', o: { mode: 'mono', threshold: 105, detail: 480, smooth: 40, speckle: 3, dropBg: true, invert: false, usePalette: false } },
  { id: 'palet', name: 'Warna jersey', hint: '3 warna ikut palet', o: { mode: 'color', colors: 3, detail: 280, smooth: 75, speckle: 10, dropBg: true, invert: false, usePalette: true } },
  { id: 'negatif', name: 'Negatif', hint: 'Terang jadi bentuk', o: { mode: 'mono', threshold: 0, detail: 400, smooth: 60, speckle: 16, dropBg: false, invert: true, usePalette: false } },
];

export const TRACE_DEFAULT = { mode: 'color', colors: 3, detail: 320, smooth: 70, speckle: 12, threshold: 0, dropBg: true, invert: false, usePalette: false, ink: '#111111' };

const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const lumaOf = (r, g, b) => .2126 * r + .7152 * g + .0722 * b;

/** Ambil piksel gambar pada resolusi kerja. */
function sample(img, detail) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const k = Math.min(1, detail / Math.max(iw, ih));
  const W = Math.max(8, Math.round(iw * k)), H = Math.max(8, Math.round(ih * k));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, W, H);
  return { W, H, data: x.getImageData(0, 0, W, H).data };
}

function otsu(hist, total) {
  let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
  let wB = 0, sB = 0, best = 0, th = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]; if (!wB) continue; const wF = total - wB; if (!wF) break;
    sB += t * hist[t]; const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) * (mB - mF);
    if (v > best) { best = v; th = t; }
  }
  return th;
}

/** k-means deterministik pada piksel yang ikut. */
function kmeans(px, n, k) {
  // inisialisasi: titik terjauh bertahap (deterministik)
  const cs = [[px[0], px[1], px[2]]];
  const stride = Math.max(1, Math.floor(n / 4000));
  while (cs.length < k) {
    let bd = -1, bi = 0;
    for (let i = 0; i < n; i += stride) {
      let md = 1e9;
      for (const c of cs) { const d = (px[i * 3] - c[0]) ** 2 + (px[i * 3 + 1] - c[1]) ** 2 + (px[i * 3 + 2] - c[2]) ** 2; if (d < md) md = d; }
      if (md > bd) { bd = md; bi = i; }
    }
    cs.push([px[bi * 3], px[bi * 3 + 1], px[bi * 3 + 2]]);
  }
  const lab = new Uint8Array(n);
  for (let it = 0; it < 8; it++) {
    const sum = cs.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < n; i += (it < 5 ? stride : 1)) {
      let bd = 1e9, bj = 0;
      for (let j = 0; j < k; j++) { const c = cs[j], d = (px[i * 3] - c[0]) ** 2 + (px[i * 3 + 1] - c[1]) ** 2 + (px[i * 3 + 2] - c[2]) ** 2; if (d < bd) { bd = d; bj = j; } }
      lab[i] = bj; const s = sum[bj]; s[0] += px[i * 3]; s[1] += px[i * 3 + 1]; s[2] += px[i * 3 + 2]; s[3]++;
    }
    cs.forEach((c, j) => { const s = sum[j]; if (s[3]) { c[0] = s[0] / s[3]; c[1] = s[1] / s[3]; c[2] = s[2] / s[3]; } });
  }
  for (let i = 0; i < n; i++) {
    let bd = 1e9, bj = 0;
    for (let j = 0; j < k; j++) { const c = cs[j], d = (px[i * 3] - c[0]) ** 2 + (px[i * 3 + 1] - c[1]) ** 2 + (px[i * 3 + 2] - c[2]) ** 2; if (d < bd) { bd = d; bj = j; } }
    lab[i] = bj;
  }
  return { cs, lab };
}

/** Filter modus 3x3: membuang noise piksel tunggal. label -1 = latar. */
function majority(lab, W, H, k) {
  const out = new Int8Array(lab.length), cnt = new Uint8Array(k + 1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; cnt.fill(0);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      cnt[lab[yy * W + xx] + 1]++;
    }
    let b = lab[i] + 1, bc = cnt[b] + 0.5; // sedikit condong ke label asli
    for (let j = 0; j <= k; j++) if (cnt[j] > bc) { bc = cnt[j]; b = j; }
    out[i] = b - 1;
  }
  return out;
}

/** Buang komponen kecil (bintik): hubungkan ke label tetangga dominan. */
function despeckle(lab, W, H, minArea) {
  if (minArea <= 0) return lab;
  const seen = new Uint8Array(lab.length), stack = [];
  for (let s = 0; s < lab.length; s++) {
    if (seen[s]) continue;
    const L = lab[s], comp = []; stack.push(s); seen[s] = 1;
    const nb = new Map();
    while (stack.length) {
      const i = stack.pop(); comp.push(i);
      const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx;
        if (lab[j] === L) { if (!seen[j]) { seen[j] = 1; stack.push(j); } } else nb.set(lab[j], (nb.get(lab[j]) || 0) + 1);
      }
    }
    if (comp.length < minArea && nb.size) {
      let bl = L, bc = -1; for (const [l, c] of nb) if (c > bc) { bc = c; bl = l; }
      for (const i of comp) lab[i] = bl;
    }
  }
  return lab;
}

/** Kontur dari topeng biner -> daftar loop [[x,y],...] pada kisi piksel. */
function contours(mask, W, H) {
  const VW = W + 1, nv = VW * (H + 1);
  const o1 = new Int32Array(nv).fill(-1), o2 = new Int32Array(nv).fill(-1);
  const add = (a, b) => { if (o1[a] < 0) o1[a] = b; else o2[a] = b; };
  const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (mask[y * W + x] !== 1) continue;
    if (!on(x, y - 1)) add(y * VW + x, y * VW + x + 1);
    if (!on(x + 1, y)) add(y * VW + x + 1, (y + 1) * VW + x + 1);
    if (!on(x, y + 1)) add((y + 1) * VW + x + 1, (y + 1) * VW + x);
    if (!on(x - 1, y)) add((y + 1) * VW + x, y * VW + x);
  }
  const loops = [];
  for (let v = 0; v < nv; v++) {
    while (o1[v] >= 0 || o2[v] >= 0) {
      const loop = []; let cur = v, guard = 0;
      do {
        loop.push(cur);
        let nx;
        if (o1[cur] >= 0) { nx = o1[cur]; o1[cur] = -1; } else { nx = o2[cur]; o2[cur] = -1; }
        if (nx < 0) break; cur = nx;
      } while (cur !== v && ++guard < 4e6);
      if (loop.length > 3) loops.push(loop.map(i => [i % VW, (i / VW) | 0]));
    }
  }
  return loops;
}

/** Hapus titik segaris, lalu Douglas-Peucker. */
function simplify(pts, eps) {
  const n = pts.length; if (n < 4) return pts;
  // buang titik kolinear dahulu
  const a = [];
  for (let i = 0; i < n; i++) {
    const p = pts[(i + n - 1) % n], c = pts[i], q = pts[(i + 1) % n];
    if ((c[0] - p[0]) * (q[1] - c[1]) - (c[1] - p[1]) * (q[0] - c[0]) !== 0) a.push(c);
  }
  if (a.length < 4 || eps <= 0) return a;
  // DP pada loop: pecah di dua titik terjauh
  let i0 = 0, i1 = 0, md = -1;
  for (let i = 1; i < a.length; i++) { const d = (a[i][0] - a[0][0]) ** 2 + (a[i][1] - a[0][1]) ** 2; if (d > md) { md = d; i1 = i; } }
  const dp = (s, e, out) => {
    let bd = -1, bi = -1; const A = a[s], B = a[e % a.length], dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy || 1;
    for (let i = s + 1; i < e; i++) {
      const P = a[i % a.length], t = Math.max(0, Math.min(1, ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / L2));
      const d = Math.hypot(P[0] - (A[0] + t * dx), P[1] - (A[1] + t * dy));
      if (d > bd) { bd = d; bi = i; }
    }
    if (bd > eps) { dp(s, bi, out); out.push(a[bi % a.length]); dp(bi, e, out); }
  };
  const out = [a[i0]]; dp(i0, i1, out); out.push(a[i1]); dp(i1, a.length, out);
  return out.length >= 3 ? out : a;
}

const f1 = v => (Math.round(v * 10) / 10).toString();
/** Poligon -> path: sudut tajam dipertahankan, sisanya kurva kuadratik lewat titik tengah. */
function toPath(pts, smooth, corner) {
  const n = pts.length; if (n < 3) return '';
  if (smooth <= 0) return 'M' + pts.map(p => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';
  const sharp = pts.map((c, i) => {
    const p = pts[(i + n - 1) % n], q = pts[(i + 1) % n];
    const a1 = Math.atan2(c[1] - p[1], c[0] - p[0]), a2 = Math.atan2(q[1] - c[1], q[0] - c[0]);
    let d = Math.abs(a2 - a1); if (d > Math.PI) d = 2 * Math.PI - d;
    return d > corner;
  });
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  let d = 'M' + f1(start[0]) + ' ' + f1(start[1]);
  for (let i = 0; i < n; i++) {
    const c = pts[i], q = pts[(i + 1) % n], m = mid(c, q);
    if (sharp[i]) d += 'L' + f1(c[0]) + ' ' + f1(c[1]) + 'L' + f1(m[0]) + ' ' + f1(m[1]);
    else d += 'Q' + f1(c[0]) + ' ' + f1(c[1]) + ' ' + f1(m[0]) + ' ' + f1(m[1]);
  }
  return d + 'Z';
}

/**
 * Trace gambar. Hasil: { W, H, layers:[{color, d, area}], hasContent }
 * layers diurutkan dari paling bawah (terbesar) ke paling atas.
 */
export function traceImage(img, o = {}) {
  o = { ...TRACE_DEFAULT, ...o };
  const { W, H, data } = sample(img, o.detail), N = W * H;
  const bg = new Uint8Array(N); // 1 = latar
  const hist = new Float64Array(256); let opaque = 0;
  for (let i = 0; i < N; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
    if (a < 128) { bg[i] = 1; continue; }
    if (o.dropBg && r > 244 && g > 244 && b > 244) { bg[i] = 1; continue; }
    hist[Math.round(lumaOf(r, g, b))]++; opaque++;
  }
  if (!opaque) return { W, H, layers: [], hasContent: false };
  let lab = new Int8Array(N).fill(-1), palette = [];
  if (o.mode === 'mono') {
    const th = o.threshold > 0 ? o.threshold : otsu(hist, opaque);
    for (let i = 0; i < N; i++) {
      if (bg[i]) continue;
      const l = lumaOf(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
      lab[i] = (o.invert ? l >= th : l < th) ? 0 : -1;
    }
    palette = [[...hexToRgb(o.ink)]];
  } else {
    const idx = []; for (let i = 0; i < N; i++) if (!bg[i]) idx.push(i);
    const px = new Float32Array(idx.length * 3);
    idx.forEach((s, j) => { px[j * 3] = data[s * 4]; px[j * 3 + 1] = data[s * 4 + 1]; px[j * 3 + 2] = data[s * 4 + 2]; });
    const k = Math.max(2, Math.min(10, o.colors | 0));
    const km = kmeans(px, idx.length, Math.min(k, idx.length));
    idx.forEach((s, j) => lab[s] = km.lab[j]);
    palette = km.cs.map(c => c.map(Math.round));
    if (o.invert) { palette = palette.map(c => c.map(v => 255 - v)); }
  }
  const K = palette.length;
  lab = majority(lab, W, H, K);
  lab = despeckle(lab, W, H, Math.round(o.speckle));
  // urutkan warna dari terbesar (paling bawah)
  const area = new Array(K).fill(0); for (let i = 0; i < N; i++) if (lab[i] >= 0) area[lab[i]]++;
  const order = [...Array(K).keys()].filter(j => area[j] > 0).sort((a, b) => area[b] - area[a]);
  const eps = .35 + (o.smooth / 100) * 1.25, corner = (.95 - (o.smooth / 100) * .35); // radian
  const layers = [];
  order.forEach((j, rank) => {
    // tumpuk: warna ini + semua warna di atasnya => tanpa celah antar warna
    const upper = new Set(order.slice(rank));
    const mask = new Uint8Array(N); let cnt = 0;
    for (let i = 0; i < N; i++) if (lab[i] >= 0 && upper.has(lab[i])) { mask[i] = 1; cnt++; }
    if (!cnt) return;
    const d = contours(mask, W, H).map(l => toPath(simplify(l, eps), o.smooth, corner)).filter(Boolean).join('');
    if (d) layers.push({ color: hex(...palette[j]), d, area: area[j] });
  });
  return { W, H, layers, hasContent: layers.length > 0 };
}

function hexToRgb(h) { const n = parseInt(h.replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }

/** Susun SVG. colors (opsional) mengganti warna per lapis, urut dari paling bawah. */
export function traceToSVG(res, { colors, outW = 1000 } = {}) {
  const h = Math.round(outW * res.H / res.W);
  const body = res.layers.map((l, i) => `<path fill="${(colors && colors[i]) || l.color}" fill-rule="evenodd" d="${l.d}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${outW}" height="${h}" viewBox="0 0 ${res.W} ${res.H}">${body}</svg>`;
}
export const svgToDataURI = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
