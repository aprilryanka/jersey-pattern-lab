// Acid: gradient cair psychedelic bergrain (domain warping + LUT warna + grain). Tile periodik, seamless.
export const ACID_STYLES = [
  ['ac_liquid', 'Cair'], ['ac_thermal', 'Termal'], ['ac_iris', 'Iridescent'], ['ac_blob', 'Blob Biru-Oranye'], ['ac_forest', 'Hutan Neon'], ['ac_tiger', 'Harimau Acid'],
];
// Palet [c1, c2, c3] = tiga warna utama gradasi (gelap dan terang ditambahkan otomatis di ujung).
export const ACID_PALETTES = [
  ['#3a1480', '#8a4fd8', '#b6e41a'], ['#5a1fd0', '#ff4a1c', '#ffb81c'], ['#0a7fe0', '#2fe0c8', '#ff4fa3'],
  ['#1a8ae8', '#ffffff', '#ff5a1c'], ['#0d4a36', '#1fae6a', '#ff5a1c'], ['#1a2fd6', '#ff4fa3', '#ffd84a'],
  ['#ff3d9a', '#7a4dff', '#19e0ff'], ['#ff7a00', '#ff2a6d', '#7a1fff'], ['#00c2a8', '#2a5bff', '#ff4fd8'],
  ['#111111', '#7a4dff', '#e6ff3a'], ['#e63946', '#ff9a2a', '#ffe36a'], ['#0b1a6b', '#2a8cff', '#9be7ff'],
];
export const ACID_STYLE_PALETTE = { ac_liquid: 0, ac_thermal: 1, ac_iris: 2, ac_blob: 3, ac_forest: 4, ac_tiger: 5 };
const hx = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
function H(i, j, s, k = 0) { let n = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(s | 0, 1013) + Math.imul(k, 2654435761); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
const q5 = t => t * t * t * (t * (t * 6 - 15) + 10);
function vn(x, y, P, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = q5(x - xi), fy = q5(y - yi), a = (i, j) => H(((i % P) + P) % P, ((j % P) + P) % P, s); const v00 = a(xi, yi), v10 = a(xi + 1, yi), v01 = a(xi, yi + 1), v11 = a(xi + 1, yi + 1); return (v00 + (v10 - v00) * fx) * (1 - fy) + (v01 + (v11 - v01) * fx) * fy; }
function fbm(x, y, P, oct, s) { let a = 1, t = 0, n = 0, m = 1; for (let o = 0; o < oct; o++) { t += a * vn(x * m, y * m, P * m, s + o); n += a; a *= .5; m *= 2; } return t / n; }
const TAU = Math.PI * 2;

export function renderAcidTile(ctx, N, st) {
  const seed = st.seed | 0, cc = st.colors.map(hx), mixc = (A, B, t) => A.map((v, i) => v + (B[i] - v) * t), stops = [mixc(cc[0], [0, 0, 8], .78), cc[0], cc[1], cc[2], mixc(cc[2], [255, 255, 255], .3)], img = ctx.createImageData(N, N), d = img.data;
  const lut = new Uint8Array(1024 * 3);
  for (let i = 0; i < 1024; i++) { const t = i / 1023 * (stops.length - 1), k = Math.min(stops.length - 2, Math.floor(t)), f = t - k, s = f * f * (3 - 2 * f); for (let c = 0; c < 3; c++) lut[i * 3 + c] = stops[k][c] + (stops[k + 1][c] - stops[k][c]) * s; }
  const warp = st.style === 'ac_tiger' ? .9 : st.style === 'ac_thermal' ? 1.5 : 1.25, P = st.style === 'ac_forest' ? 3 : 2;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N;
    const wx = fbm(u * P, v * P, P, 3, seed) - .5, wy = fbm(u * P + .37, v * P + .71, P, 3, seed + 11) - .5;
    const f = fbm((u + warp * wx) * P, (v + warp * wy) * P, P, 3, seed + 3);
    let t;
    if (st.style === 'ac_tiger') t = .5 + .5 * Math.sin(TAU * (f * 6 + (u + v) * 3));
    else if (st.style === 'ac_blob') t = Math.min(1, Math.max(0, (f - .3) * 2.6));
    else if (st.style === 'ac_iris') t = .5 + .5 * Math.sin(TAU * f * 2.2);
    else t = Math.min(1, Math.max(0, (f - .3) * 2.4));
    // grain: dither kuat di tengah gradasi, hilang di ujung
    const g = (H(x, y, seed, 99) - .5) * .15 * (1 - Math.abs(t - .5) * 1.2); t = Math.min(1, Math.max(0, t + g));
    const k = (t * 1023) | 0, o = (y * N + x) * 4; d[o] = lut[k * 3]; d[o + 1] = lut[k * 3 + 1]; d[o + 2] = lut[k * 3 + 2]; d[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

export const ACID_TILE_MM = 480;
const mk = (w, h) => { if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; } return globalThis.__mkCanvas(w, h); };
const CACHE = new Map();
function getTile(st, N) {
  const key = [st.style, N, st.seed | 0, st.colors.join(',')].join('|');
  let t = CACHE.get(key);
  if (!t) { t = mk(N, N); renderAcidTile(t.getContext('2d'), N, st); CACHE.set(key, t); if (CACHE.size > 10) CACHE.delete(CACHE.keys().next().value); }
  return t;
}
/** Gambar motif Acid menutupi area r (mm); tile seamless di-cache per (gaya, seed, warna). */
export function drawAcid(ctx, r, st) {
  if (!ACID_STYLES.some(a => a[0] === st.style)) return false;
  const tile = getTile(st, st.thumb ? 128 : 512), size = ACID_TILE_MM * (st.scale || 1);
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  for (let j = Math.floor(r.y0 / size); j < Math.ceil(r.y1 / size); j++) for (let i = Math.floor(r.x0 / size); i < Math.ceil(r.x1 / size); i++) ctx.drawImage(tile, i * size, j * size, size + .8, size + .8);
  ctx.restore();
  return true;
}
