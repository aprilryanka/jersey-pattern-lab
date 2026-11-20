// Tie-dye realistis: field pewarna dihitung per piksel (noise periodik + lipatan spiral), disimpan sebagai tile
// 0..255 yang bisa diulang tanpa sambungan, lalu diwarnai dari 3 warna palet. Field di-cache per (gaya, seed),
// jadi mengganti warna atau ukuran motif tidak menghitung ulang.

const TAU = Math.PI * 2;

export const DYE_KINDS = {
  td_spiral: { label: 'Spiral', c: 'burst', arms: 12, tw: 2.4, rings: 2.4, tile: 560 },
  td_swirl: { label: 'Pusaran', c: 'burst', arms: 9, tw: 4.4, rings: 3.2, tile: 560 },
  td_burst: { label: 'Burst', c: 'burst', arms: 24, tw: .3, rings: 1.4, tile: 520 },
  td_mini: { label: 'Mini spiral', c: 'burst', arms: 10, tw: 2, rings: 2, tile: 300 },
  td_ombre: { label: 'Ombre', c: 'ombre', tile: 640 },
  td_crush: { label: 'Crush', c: 'crush', tile: 460 },
  td_cloud: { label: 'Awan', c: 'cloud', tile: 640 },
};
export const DYE_STYLES = Object.entries(DYE_KINDS).map(([id, k]) => [id, k.label]);

function hash(x, y, s) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1013904223);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
const ss = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
function vn(x, y, px, py, s) { // value noise; px/py = periode kisi (0 = tanpa periode)
  const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const x0 = px ? ((ix % px) + px) % px : ix, x1 = px ? (x0 + 1) % px : ix + 1, y0 = py ? ((iy % py) + py) % py : iy, y1 = py ? (y0 + 1) % py : iy + 1;
  const a = hash(x0, y0, s), b = hash(x1, y0, s), c = hash(x0, y1, s), d = hash(x1, y1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
function fbmP(u, v, fx, fy, s, o) { // periodik pada tile satuan
  let val = 0, a = .5, n = 0;
  for (let i = 0; i < o; i++) { const px = fx << i, py = fy << i; val += a * vn(u * px, v * py, px, py, s + i * 17); n += a; a *= .5; }
  return val / n;
}
function fbm(x, y, s, o) { // tidak periodik (dipakai di koordinat polar relatif terhadap pusat)
  let val = 0, a = .5, n = 0, f = 1;
  for (let i = 0; i < o; i++) { val += a * vn(x * f, y * f, 0, 0, s + i * 17); n += a; a *= .5; f *= 2.03; }
  return val / n;
}

const S_UNIT = .46; // jari-jari satuan burst dalam satuan tile

function makeField(id, N, seed) {
  const K = DYE_KINDS[id], out = new Uint8ClampedArray(N * N), s0 = seed * 101 + 7;
  const CEN = [];
  if (K.c === 'burst') for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) CEN.push([.5 + a, .5 + b]);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = (i + .5) / N, w = (j + .5) / N;
    const grain = fbmP(u, w, 24, 24, s0 + 41, 4), mot = fbmP(u, w, 64, 64, s0 + 81, 3), hi = fbmP(u, w, 96, 96, s0 + 51, 2);
    let v = 0, fold = 0;
    if (K.c === 'burst') {
      const wx = (fbmP(u, w, 5, 5, s0, 4) - .5) * .34, wy = (fbmP(u + .37, w, 5, 5, s0 + 5, 4) - .5) * .34;
      let dmin = 9; const ds = CEN.map(([cx, cy]) => { const d = Math.hypot(u - cx, w - cy); if (d < dmin) dmin = d; return d; });
      let sw = 0, sv = 0, sf = 0;
      for (let q = 0; q < CEN.length; q++) {
        const wt = Math.exp(-(ds[q] - dmin) / .05); if (wt < .02) continue;
        const px = (u - CEN[q][0]) / S_UNIT + wx, py = (w - CEN[q][1]) / S_UNIT + wy;
        const r = Math.hypot(px, py), th = Math.atan2(py, px);
        const sp = th / TAU * K.arms + K.tw * Math.log(1 + r * 4), core = ss(.05, .3, r);
        const wedge = .5 + (.5 * Math.cos(sp * TAU)) * core, fd = Math.pow(Math.abs(Math.cos(sp * Math.PI)), 6) * core;
        const rw = r + (fbmP(u, w, 11, 11, s0 + 11, 3) - .5) * .16, ring = .5 + .5 * Math.cos(rw * K.rings * TAU);
        const uu = th * K.arms * 1.7 + K.tw * Math.log(1 + r * 4) * K.arms * .3;
        const st = fbm(uu * .9, r * 7 + fbm(uu * .3, r * 3, s0 + 3, 3) * 2, s0 + 21, 5), st2 = fbm(uu * 2.3, r * 13, s0 + 31, 4);
        let vv = wedge * .34 + ring * .3 + fd * .26 + (st - .5) * (.38 + r * .35) + (st2 - .5) * .3 + .12;
        vv += (1 - ss(0, .3, r)) * .3;
        sw += wt; sv += vv * wt; sf += fd * wt;
      }
      v = sv / sw + (mot - .5) * .34; fold = sf / sw;
    } else if (K.c === 'ombre') {
      const g = .5 - .5 * Math.cos(TAU * (u + (fbmP(u, w, 3, 3, s0 + 2, 3) - .5) * .5));
      const streak = fbmP(u, w, 14, 2, s0 + 3, 4), s2 = fbmP(u, w, 30, 3, s0 + 4, 3);
      v = g * .8 + (streak - .5) * .6 + (s2 - .5) * .25 + (mot - .5) * .2 + .08;
    } else if (K.c === 'crush') {
      v = (fbmP(u, w, 4, 4, s0 + 5, 5) - .5) * 1.5 + .5 + (mot - .5) * .3 + .08;
    } else {
      v = (fbmP(u, w, 3, 3, s0 + 9, 5) - .5) * 1.9 + .5 + (mot - .5) * .2 + .05;
    }
    const grain2 = fbmP(u, w, 18, 18, s0 + 61, 4), fine = fbmP(u, w, 160, 160, s0 + 91, 1);
    const d1 = ss(.34, .62, v + (grain - .5) * .34 + (hi - .5) * .16);
    const d2 = ss(.52, .95, v + (grain2 - .5) * .5 + fold * .2) * d1;
    let t = d1 * .55 + d2 * .38 + ss(.12, .55, v + (grain - .5) * .3) * .26 * (1 - d1);
    const mid = Math.min(t, 1 - t) * 2; t += (fine - .5) * .34 * Math.min(1, mid * 1.6 + .15);
    const edge = 1 - Math.abs(d1 - .5) * 2;
    if (hi > .66 && edge > .25) t -= ss(.66, .8, hi) * edge * .35;
    if (hi < .3 && edge > .25) t += ss(.3, .18, hi) * edge * .28;
    out[j * N + i] = Math.round(Math.min(1, Math.max(0, t)) * 255);
  }
  return out;
}

const hx = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
function lut(colors) { // c1 -> c2 -> c3
  const [a, b, c] = colors.map(hx), L = new Uint8ClampedArray(256 * 3);
  const stops = [[0, a], [.3, a.map((v, i) => v + (b[i] - v) * .5)], [.62, b], [1, c]];
  for (let k = 0; k < 256; k++) {
    const t = k / 255; let q = 1; while (q < stops.length - 1 && t > stops[q][0]) q++;
    const [t0, c0] = stops[q - 1], [t1, c1] = stops[q], f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    for (let m = 0; m < 3; m++) L[k * 3 + m] = c0[m] + (c1[m] - c0[m]) * f;
  }
  return L;
}
const mkCanvas = (w, h) => { if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; } return globalThis.__mkCanvas(w, h); };

const FIELDS = new Map(), TILES = new Map();
function cached(map, key, make, max = 6) {
  if (map.has(key)) { const v = map.get(key); map.delete(key); map.set(key, v); return v; }
  const v = make(); map.set(key, v); if (map.size > max) map.delete(map.keys().next().value); return v;
}
function getTile(id, N, seed, colors) {
  const f = cached(FIELDS, `${id}|${N}|${seed}`, () => makeField(id, N, seed));
  return cached(TILES, `${id}|${N}|${seed}|${colors.join('')}`, () => {
    const cv = mkCanvas(N, N), x = cv.getContext('2d'), im = x.createImageData(N, N), d = im.data, L = lut(colors);
    for (let q = 0; q < N * N; q++) { const t = f[q] * 3, o = q * 4; d[o] = L[t]; d[o + 1] = L[t + 1]; d[o + 2] = L[t + 2]; d[o + 3] = 255; }
    x.putImageData(im, 0, 0); return cv;
  }, 8);
}

/** Gambar tie-dye menutupi area r (mm). st.thumb = true memakai resolusi rendah (thumbnail). */
export function drawDye(ctx, r, st) {
  const K = DYE_KINDS[st.style]; if (!K) return false;
  const N = st.thumb ? 96 : 640, tile = getTile(st.style, N, st.seed | 0, st.colors), size = K.tile * (st.scale || 1);
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const i0 = Math.floor(r.x0 / size), i1 = Math.ceil(r.x1 / size), j0 = Math.floor(r.y0 / size), j1 = Math.ceil(r.y1 / size);
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) ctx.drawImage(tile, i * size, j * size, size + .8, size + .8);
  ctx.restore();
  return true;
}
