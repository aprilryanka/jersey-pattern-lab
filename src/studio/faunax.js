// Fauna realistis: tekstur per-piksel (noise periodik, jadi seamless) untuk zebra mengalir, bulu harimau, kuas kering,
// aliran organik, kulit ular bersisik, serta rosette macan salju. Warna: c1 = dasar, c2 = tinta, c3 = aksen/nada tengah.
export const FAUNAX_STYLES = [
  ['fx_zebra', 'Zebra Mengalir'], ['fx_flow', 'Aliran Organik'], ['fx_fur', 'Bulu Harimau'],
  ['fx_brush', 'Kuas Kering'], ['fx_snake', 'Kulit Ular'], ['fx_snowleo', 'Macan Salju'],
];
const hx = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
function H(i, j, s, k = 0) { let n = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(s | 0, 1013) + Math.imul(k, 2654435761); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
const q = t => t * t * t * (t * (t * 6 - 15) + 10);
// value noise periodik Px x Py
function vn(x, y, Px, Py, s) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = q(x - xi), fy = q(y - yi);
  const a = (i, j) => H(((i % Px) + Px) % Px, ((j % Py) + Py) % Py, s);
  const v00 = a(xi, yi), v10 = a(xi + 1, yi), v01 = a(xi, yi + 1), v11 = a(xi + 1, yi + 1);
  return (v00 + (v10 - v00) * fx) * (1 - fy) + (v01 + (v11 - v01) * fx) * fy;
}
function fbm(x, y, P, Py, oct, s) { let a = 1, t = 0, n = 0, m = 1; for (let o = 0; o < oct; o++) { t += a * vn(x * m, y * m, P * m, Py * m, s + o); n += a; a *= .5; m *= 2; } return t / n; }
const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerpc = (A, B, t) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
const TAU = Math.PI * 2;

/** Render tile N x N ke canvas `cv` (konteks 2D). */
export function renderFaunaTile(ctx, N, st) {
  const [c1, c2, c3] = st.colors.map(hx), seed = st.seed | 0, sc = st.scale || 1;
  if (st.style === 'fx_snowleo') return snowLeo(ctx, N, st);
  const img = ctx.createImageData(N, N), d = img.data;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N; let col;
    switch (st.style) {
      case 'fx_zebra': {
        const w1 = fbm(u * 2, v * 2, 2, 2, 4, seed) - .5, w2 = fbm(u * 4, v * 4, 4, 4, 4, seed + 9) - .5;
        const w3 = fbm(u * 3, v * 3, 3, 3, 4, seed + 21) - .5;
        const val = .75 * Math.sin(TAU * (7 * (u + 2 * v) + 3.6 * w1)) + .55 * Math.sin(TAU * (12 * (u + 2 * v) + 4.4 * w3)) + 2.6 * w2 + .12;
        col = lerpc(c1, c2, sm(-.14, .14, val)); break;
      }
      case 'fx_flow': {
        const w1 = fbm(u * 3, v * 3, 3, 3, 5, seed) - .5, w2 = fbm(u * 9, v * 9, 9, 9, 4, seed + 4) - .5;
        const val = Math.sin(TAU * (12 * (u + v * 2) + 6 * w1)) + 3.4 * w2 + .25;
        col = lerpc(c1, c2, sm(-.1, .1, val)); break;
      }
      case 'fx_fur': {
        const w1 = fbm(u * 2, v * 2, 2, 2, 4, seed) - .5;
        const band = Math.sin(TAU * (3 * v + u + 1.7 * w1));
        const hair = vn(u * 110, v * 34, 110, 34, seed + 3) - .5, hair2 = vn(u * 260, v * 80, 260, 80, seed + 5) - .5;
        const val = band + 1.9 * hair + 1.2 * hair2 + .1;
        col = lerpc(c1, c2, sm(-.05, .05, val)); break;
      }
      case 'fx_brush': {
        const w1 = fbm(u * 2, v * 2, 2, 2, 4, seed + 7) - .5, w2 = fbm(u * 4, v * 4, 4, 4, 3, seed + 2) - .5;
        const hair = vn(u * 90, (v + .05 * w1) * 36, 90, 36, seed + 3) - .5, hair2 = vn(u * 240, v * 90, 240, 90, seed + 6) - .5;
        const val = 1.6 * w2 + 1.3 * w1 + 1.5 * hair + .7 * hair2;
        const sp = H(x, y, seed, 77);
        let t = sm(.32, .4, val), m = sm(-.02, .06, val);
        if (Math.abs(val - .36) < .2 && sp < .13) t = Math.max(t, 1);
        if (Math.abs(val - .02) < .16 && sp > .9) m = Math.max(m, 1);
        col = lerpc(lerpc(c2, c3, m), c1, t); break;
      }
      case 'fx_snake': {
        const S = 9 * sc * (N / 330), rh = S * .78, j = Math.floor(y / rh), xo = x - ((j & 1) ? S / 2 : 0), i = Math.floor(xo / S);
        const cx = (i + .5) * S + ((j & 1) ? S / 2 : 0), cy = (j + .5) * rh, dx = (xo - (i + .5) * S) / (S * .47), dy = (y - cy) / (rh * .56);
        const inside = Math.pow(Math.abs(dx), 3.4) + Math.pow(Math.abs(dy), 3.4) < 1;
        const uu = cx / N, vv = cy / N, fu = Math.abs((uu * 2) % 1 - .5) * 2, fv = Math.abs((vv * 3) % 1 - .5) * 2;
        const dd = fu + fv + (fbm(uu * 8, vv * 8, 8, 8, 3, seed) - .5) * .5 + (H(i, j, seed, 5) - .5) * .12;
        let tone = Math.abs(dd - 1) < .15 ? 2 : (dd < 1 ? 0 : 1);
        if (Math.abs(((uu * 2) % 1) - .5) < .03 && Math.abs(dd - 1) > .2) tone = 2;
        const base = tone === 2 ? c3 : tone === 1 ? c2 : c1, shade = .92 + H(i, j, seed, 9) * .16;
        col = inside ? [base[0] * shade, base[1] * shade, base[2] * shade] : lerpc(c1, [255, 255, 255], .35); break;
      }
    }
    const k = (y * N + x) * 4; d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
function snowLeo(ctx, N, st) {
  const [c1, c2, c3] = st.colors, seed = st.seed | 0, s = 30 * (N / 330) * (st.scale || 1), rh = s * .86;
  ctx.fillStyle = c1; ctx.fillRect(0, 0, N, N);
  const el = (x, y, rx, ry, a) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, a, 0, TAU); ctx.fill(); };
  for (let j = -1; j * rh < N + rh; j++) for (let i = -1; i * s < N + s; i++) {
    const cx = (i + (j & 1 ? .5 : 0) + (H(i, j, seed, 1) - .5) * .3) * s, cy = j * rh + (H(i, j, seed, 2) - .5) * s * .2, R = s * (.3 + H(i, j, seed, 3) * .06);
    const m = 3 + Math.floor(H(i, j, seed, 4) * 4), a0 = H(i, j, seed, 5) * TAU, span = 3.6 + H(i, j, seed, 6) * 1.6;
    for (let n = 0; n < m; n++) {
      const a = a0 + n / m * span + (H(i, j, seed, 10 + n) - .5) * .5, bx = cx + Math.cos(a) * R, by = cy + Math.sin(a) * R, rx = s * (.17 + H(i, j, seed, 20 + n) * .05), ry = rx * (.62 + H(i, j, seed, 60 + n) * .35);
      ctx.fillStyle = c2; el(bx, by, rx, ry, a + 1.57); ctx.fillStyle = c3; el(bx - Math.cos(a) * ry * .25, by - Math.sin(a) * ry * .25, rx * .66, ry * .6, a + 1.57);
    }
    ctx.fillStyle = c2; for (let n = 0; n < 3; n++) el(cx + (H(i, j, seed, 40 + n) - .5) * s, cy + (H(i, j, seed, 43 + n) - .5) * rh, s * .06, s * .045, H(i, j, seed, 46) * 3);
  }
}

export const FAUNAX_PALETTES = [
  ['#f4f4f2', '#0d0d0f', '#888888'], ['#17b8e8', '#06080c', '#888888'], ['#0c0c0e', '#f6f6f4', '#888888'],
  ['#f1ece0', '#15171a', '#4a4f55'], ['#ff9fd2', '#f0508f', '#c2123f'], ['#f6f6f4', '#0c0c0e', '#a9a9ad'],
  ['#f2c21b', '#0e0e12', '#888888'], ['#d92b1a', '#0b0b0d', '#888888'],
];
export const FAUNAX_TILE_MM = { fx_zebra: 420, fx_flow: 420, fx_fur: 520, fx_brush: 520, fx_snake: 360, fx_snowleo: 300 };
const mk = (w, h) => { if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; } return globalThis.__mkCanvas(w, h); };
const CACHE = new Map();
function getTile(st, N) {
  const key = [st.style, N, st.seed | 0, st.colors.join(','), st.scale || 1].join('|');
  let t = CACHE.get(key);
  if (!t) { t = mk(N, N); renderFaunaTile(t.getContext('2d'), N, { ...st, scale: 1 }); CACHE.set(key, t); if (CACHE.size > 12) CACHE.delete(CACHE.keys().next().value); }
  return t;
}
/** Gambar fauna realistis menutupi area r (mm), tile seamless di-cache. */
export function drawFaunaX(ctx, r, st) {
  const mm = FAUNAX_TILE_MM[st.style]; if (!mm) return false;
  const tile = getTile(st, st.thumb ? 128 : 512), size = mm * (st.scale || 1);
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  for (let j = Math.floor(r.y0 / size); j < Math.ceil(r.y1 / size); j++) for (let i = Math.floor(r.x0 / size); i < Math.ceil(r.x1 / size); i++) ctx.drawImage(tile, i * size, j * size, size + .8, size + .8);
  ctx.restore();
  return true;
}
