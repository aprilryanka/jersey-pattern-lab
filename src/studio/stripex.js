// Strip lanjutan: jumlah/lebar bervariasi, gradient, kombinasi warna, dan pola di dalam strip.
export const STRIPEX_STYLES = [
  ['sx_bold', 'Strip Lebar'], ['sx_rhythm', 'Lebar-Tipis-Tipis'], ['sx_multi', 'Multi Warna'], ['sx_pin_gold', 'Pinstripe Emas'],
  ['sx_fade', 'Fade ke Bawah'], ['sx_rainbow', 'Strip Gradient Warna'], ['sx_blur', 'Strip Blur'], ['sx_zig_in', 'Isi Zigzag'],
  ['sx_line_in', 'Isi Garis Halus'], ['sx_pixel', 'Pixel Memudar'], ['sx_bolt', 'Tepi Kilat'], ['sx_ibiza', 'Ombre Berselang'],
];
export const STRIPEX_PALETTES = [
  ['#f1ece0', '#2a62c9', '#1b2f6b'], ['#16201c', '#1d6b3a', '#e3c36a'], ['#f1ece0', '#c8102e', '#14213d'],
  ['#14213d', '#ff6f91', '#ff9a3c'], ['#f1ece0', '#1d7a3a', '#0f4d24'], ['#101018', '#e8456b', '#3b7be0'],
  ['#e8ddc6', '#8a8d93', '#4a4d54'], ['#fbe3ea', '#ff7aa8', '#ff9a3c'],
];
const hx = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const rgba = (h, a) => { const c = hx(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
function hash(i, j, s, k = 0) { let n = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(s | 0, 1013) + Math.imul(k, 2654435761); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
const poly = (ctx, p) => { ctx.beginPath(); p.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); };
const pp = (i, n) => { const m = ((i % (n * 2 - 2)) + (n * 2 - 2)) % (n * 2 - 2); return m < n ? m : n * 2 - 2 - m; }; // ping-pong

export function drawStripeX(ctx, r, st) {
  const [c1, c2, c3] = st.colors, k = st.scale || 1, seed = st.seed | 0, gh = st.gh || 760;
  const c4 = mix(c2, c3, .5), W = r.x1 - r.x0, H = r.y1 - r.y0, y0 = Math.min(r.y0, 0), y1 = Math.max(r.y1, gh);
  const each = (p, fn) => { for (let i = Math.floor(r.x0 / p) - 1; i * p < r.x1 + p; i++) fn(i, i * p); };
  ctx.fillStyle = c1; ctx.fillRect(r.x0, r.y0, W, H);
  switch (st.style) {
    case 'sx_bold': { const w = 58 * k; each(w * 2, (i, x) => { ctx.fillStyle = c2; ctx.fillRect(x, r.y0, w + .5, H); }); break; }
    case 'sx_rhythm': { const w = 44 * k, t = 9 * k, g = 12 * k, p = w + 2 * (t + g) + g; each(p, (i, x) => { ctx.fillStyle = c2; ctx.fillRect(x, r.y0, w, H); ctx.fillStyle = c3; ctx.fillRect(x + w + g, r.y0, t, H); ctx.fillRect(x + w + g * 2 + t, r.y0, t, H); }); break; }
    case 'sx_multi': { const w = 30 * k, seq = [c1, c2, c3, c2, c4]; ctx.fillStyle = c1; for (let i = Math.floor(r.x0 / w) - 1; i * w < r.x1 + w; i++) { ctx.fillStyle = seq[((i % 5) + 5) % 5]; ctx.fillRect(i * w - .3, r.y0, w + .6, H); } break; }
    case 'sx_pin_gold': { const p = 14 * k; ctx.fillStyle = c1; ctx.fillRect(r.x0, r.y0, W, H); each(p, (i, x) => { const hv = ((i % 5) + 5) % 5 === 0; ctx.fillStyle = hv ? c3 : c2; ctx.fillRect(x, r.y0, (hv ? 3 : 2) * k, H); }); break; }
    case 'sx_fade': { const w = 36 * k, g = ctx.createLinearGradient(0, 0, 0, gh * .8); g.addColorStop(0, c2); g.addColorStop(.5, rgba(c2, .7)); g.addColorStop(1, rgba(c2, 0)); ctx.fillStyle = g; each(w * 2, (i, x) => ctx.fillRect(x, y0, w + .5, y1 - y0)); break; }
    case 'sx_rainbow': { const w = 34 * k, cols = [c2, c3, c4, mix(c2, '#ffffff', .35), c3, mix(c3, '#ffffff', .3)]; for (let i = Math.floor(r.x0 / w) - 1; i * w < r.x1 + w; i++) { const g = ctx.createLinearGradient(0, 0, 0, gh); const c = cols[((i % 6) + 6) % 6]; g.addColorStop(0, mix(c, '#000000', .35)); g.addColorStop(.55, c); g.addColorStop(1, mix(c, '#ffffff', .55)); ctx.fillStyle = g; ctx.fillRect(i * w - .3, y0, w + .6, y1 - y0); } break; }
    case 'sx_blur': { const w = 40 * k, e = 12 * k; each(w * 2, (i, x) => { const g = ctx.createLinearGradient(x - e, 0, x + w + e, 0); g.addColorStop(0, rgba(c2, 0)); g.addColorStop(e / (w + 2 * e), c2); g.addColorStop(1 - e / (w + 2 * e), c2); g.addColorStop(1, rgba(c2, 0)); ctx.fillStyle = g; ctx.fillRect(x - e, r.y0, w + 2 * e, H); }); break; }
    case 'sx_zig_in': { const w = 64 * k; each(w * 2, (i, x) => { ctx.fillStyle = c2; ctx.fillRect(x, r.y0, w, H); ctx.strokeStyle = c3; ctx.lineWidth = 2.4 * k; const st2 = 14 * k, am = 8 * k; for (const off of [.3, .5, .7]) { ctx.beginPath(); for (let y = Math.floor(r.y0 / st2) * st2 - st2, n = 0; y < r.y1 + st2; y += st2, n++) { const xx = x + w * off + (Math.round(y / st2) & 1 ? am : -am); n ? ctx.lineTo(xx, y) : ctx.moveTo(xx, y); } ctx.stroke(); } }); break; }
    case 'sx_line_in': { const w = 62 * k; each(w * 2, (i, x) => { ctx.fillStyle = c2; ctx.fillRect(x, r.y0, w, H); ctx.fillStyle = c3; for (let q = 0; q < 6; q++) ctx.fillRect(x + (q + .5) * w / 6 - .8 * k, r.y0, 1.6 * k, H); }); break; }
    case 'sx_pixel': { const w = 54 * k, s = 9 * k; each(w * 2, (i, x) => { for (let a = 0; a < w / s; a++) for (let y = Math.floor(y0 / s); y * s < y1; y++) { const dens = 1 - (y * s) / (gh * .9); if (hash(i * 9 + a, y, seed, 1) < dens * 1.15) { ctx.fillStyle = hash(i * 9 + a, y, seed, 2) < .25 ? c3 : c2; ctx.fillRect(x + a * s - .2, y * s - .2, s + .4, s + .4); } } }); break; }
    case 'sx_bolt': { const w = 46 * k, step = 36 * k, a = 11 * k; each(w * 2, (i, x) => { const L = [], R = []; for (let y = Math.floor(r.y0 / step) * step - step; y < r.y1 + step; y += step) { const o = Math.round(y / step) & 1 ? a : -a; L.push([x + o, y]); R.push([x + w + o, y]); } ctx.fillStyle = c2; poly(ctx, L.concat(R.slice().reverse())); }); break; }
    case 'sx_ibiza': { const w = 40 * k, N = 5; each(w * 2, (i, x) => { ctx.fillStyle = mix(c2, c3, pp(i, N) / (N - 1)); ctx.fillRect(x, r.y0, w + .5, H); }); break; }
    default: return false;
  }
  return true;
}
