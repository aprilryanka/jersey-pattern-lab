// Motif kategori Tie-dye, Strip, dan Fauna. Digambar di "ruang garmen" (mm, y ke bawah), sama seperti Basic.
// Posisi acak memakai hash per sel grid global, jadi motif menyambung antar panel.
// Warna: c1 = dasar, c2 = warna utama motif, c3 = aksen.

export const TIEDYE_STYLES = [
  ['td_spiral', 'Spiral'], ['td_swirl', 'Pusaran'], ['td_mini', 'Mini spiral'], ['td_sunburst', 'Sunburst'],
  ['td_bullseye', 'Bullseye'], ['td_diamond', 'Diamond'], ['td_pleat', 'Lipat'], ['td_ombre', 'Ombre'],
  ['td_ice', 'Ice dye'], ['td_marble', 'Lava'],
];
export const STRIPE_STYLES = [
  ['st_classic', 'Klasik'], ['st_pin', 'Pinstripe'], ['st_chalk', 'Chalk'], ['st_double', 'Ganda'],
  ['st_wide_thin', 'Lebar-tipis'], ['st_triple', 'Tiga'], ['st_hoops', 'Hoops'], ['st_diag', 'Diagonal'],
  ['st_sash', 'Selempang'], ['st_racing', 'Racing'], ['st_fade', 'Pudar'], ['st_grow', 'Menebal'],
  ['st_barcode', 'Barcode'], ['st_zigzag', 'Zigzag'], ['st_wavy', 'Bergelombang'], ['st_dash', 'Putus-putus'],
  ['st_broken', 'Patah'],
];
export const FAUNA_STYLES = [
  ['fa_zebra', 'Zebra'], ['fa_tiger', 'Harimau'], ['fa_leopard', 'Macan tutul'], ['fa_jaguar', 'Jaguar'],
  ['fa_cheetah', 'Cheetah'], ['fa_giraffe', 'Jerapah'], ['fa_cow', 'Sapi'], ['fa_dalmatian', 'Dalmatian'],
  ['fa_snake', 'Ular'], ['fa_scales', 'Sisik ikan'], ['fa_peacock', 'Merak'],
];

export const TIEDYE_PALETTES = [
  ['#fdfdfd', '#ff4f9a', '#2f6bff'], ['#fffbe8', '#ffb703', '#fb5607'], ['#f8f9fa', '#06d6a0', '#118ab2'], ['#ffffff', '#7b2cbf', '#ff4fd8'],
  ['#0d1b2a', '#ff006e', '#3a86ff'], ['#111111', '#ffbe0b', '#fb5607'], ['#f0fff4', '#2dc653', '#0077b6'], ['#fff1e6', '#e63946', '#f4a261'],
  ['#e0f2ff', '#1d4ed8', '#7dd3fc'], ['#ffffff', '#111111', '#8a8a8a'], ['#ffe5ec', '#ff8fab', '#8338ec'], ['#fefae0', '#bc6c25', '#606c38'],
];
export const STRIPE_PALETTES = [
  ['#ffffff', '#111111', '#e8c547'], ['#ffffff', '#0b3d91', '#f2b705'], ['#c8102e', '#ffffff', '#111111'], ['#0b3d91', '#ffffff', '#e63946'],
  ['#006b3f', '#ffffff', '#f2b705'], ['#111111', '#ffffff', '#c8102e'], ['#7b1fa2', '#ffffff', '#f2b705'], ['#f2b705', '#111111', '#ffffff'],
  ['#6ec6ff', '#ffffff', '#0b3d91'], ['#800020', '#6ec6ff', '#ffffff'], ['#ff7a00', '#111111', '#ffffff'], ['#0a8f8f', '#ffffff', '#1f2a44'],
];
export const FAUNA_PALETTES = [
  ['#f5f5f0', '#101010', '#9a9a9a'], ['#f08a24', '#1a1208', '#f6e6c8'], ['#d9a441', '#2a1a0c', '#a8742a'], ['#e6e3dc', '#3a3a3a', '#a9a59c'],
  ['#ffffff', '#111111', '#8a8a8a'], ['#e8cf9a', '#7a4a1e', '#4a2c10'], ['#8a7a3a', '#3b2f12', '#d8c88a'], ['#ffffff', '#141414', '#6b4a2a'],
  ['#2f6b3a', '#0f2a14', '#b8d98a'], ['#0a6ea8', '#06314f', '#7fd3f5'], ['#0a7a6a', '#0b2a6b', '#e0b030'], ['#c8302a', '#1a0a08', '#f6c8a0'],
];

// Palet alami per motif fauna: dipakai otomatis saat motif dipilih (selama warna belum diubah manual).
export const STYLE_PALETTE = {
  fa_zebra: 0, fa_tiger: 1, fa_leopard: 2, fa_jaguar: 2, fa_cheetah: 2, fa_giraffe: 5, fa_cow: 4, fa_dalmatian: 7, fa_snake: 6, fa_scales: 9, fa_peacock: 10,
};

// Motif berukuran besar perlu area thumbnail lebih luas supaya terlihat utuh.
export const THUMB_SCALE = {
  td_spiral: 2.2, td_swirl: 2.2, td_mini: 1.2, td_sunburst: 1.5, td_bullseye: 2.2, td_diamond: 2.2, td_pleat: 2, td_ombre: 1, td_ice: 2.4, td_marble: 2.2,
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

/* ---------- TIE-DYE ---------- */
function spiral(ctx, cx, cy, R, arms, twist, cols, salt, seed) {
  const step = TAU / arms, N = 16;
  const ang = (a, rr) => a * step + twist * rr + (hash(salt, a % arms, seed, 3) - .5) * .1;
  const rad = (a, rr) => R * rr * (1 + (hash(salt, (a % arms) * 31 + Math.round(rr * 9), seed, 4) - .5) * .07);
  const edges = [];
  for (let a = 0; a <= arms; a++) { const pts = []; for (let s = 0; s <= N; s++) { const rr = s / N, an = ang(a, rr), r2 = rad(a, rr); pts.push([cx + Math.cos(an) * r2, cy + Math.sin(an) * r2]); } edges.push(pts); }
  for (let a = 0; a < arms; a++) {
    ctx.beginPath(); ctx.moveTo(cx, cy);
    edges[a].forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.arc(cx, cy, R, ang(a, 1), ang(a + 1, 1));
    for (let s = N; s >= 0; s--) ctx.lineTo(edges[a + 1][s][0], edges[a + 1][s][1]);
    ctx.closePath(); ctx.fillStyle = cols[a % cols.length]; ctx.fill();
  }
  // luntur pewarna di sepanjang lipatan
  ctx.lineWidth = Math.max(1.2, R * .04); ctx.lineJoin = 'round';
  for (let a = 0; a < arms; a++) {
    ctx.beginPath(); edges[a].forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.strokeStyle = rgba(mix(cols[a % cols.length], cols[(a + arms - 1) % cols.length % cols.length], .5), .32); ctx.stroke();
  }
  ctx.strokeStyle = rgba(cols[0], .2); ctx.lineWidth = R * .08; ctx.beginPath(); ctx.arc(cx, cy, R * 1.05, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,.07)'; ctx.lineWidth = Math.max(.8, R * .012);
  for (let q = 0; q < arms * 2; q++) { const an = hash(salt, q, seed, 6) * TAU, r0 = R * (.15 + hash(salt, q, seed, 7) * .5); ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); ctx.lineTo(cx + Math.cos(an + twist * .4) * R * .98, cy + Math.sin(an + twist * .4) * R * .98); ctx.stroke(); }
}
function rings(ctx, cx, cy, R, n, cols, salt, seed, diamond) {
  for (let q = n; q >= 1; q--) {
    const base = R * q / n, p1 = hash(salt, q, seed, 1) * TAU, p2 = hash(salt, q, seed, 2) * TAU;
    ctx.beginPath();
    for (let a = 0; a <= 72; a++) {
      const th = a / 72 * TAU, w = 1 + .05 * Math.sin(3 * th + p1) + .035 * Math.sin(5 * th + p2);
      const rr = diamond ? base / (Math.abs(Math.cos(th)) + Math.abs(Math.sin(th))) * w : base * w;
      const x = cx + Math.cos(th) * rr, y = cy + Math.sin(th) * rr; a ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fillStyle = cols[(n - q) % cols.length]; ctx.fill();
    ctx.strokeStyle = rgba(cols[(n - q + 1) % cols.length], .28); ctx.lineWidth = Math.max(1, R * .03); ctx.stroke();
  }
}
function drawTiedye(ctx, r, st, c) {
  const [c1, c2, c3] = c, k = st.scale || 1, seed = st.seed | 0, gh = st.gh || 760;
  const cols = [c2, c3, mix(c1, c2, .55), mix(c2, c3, .5)], cols2 = [c2, c1, c3, mix(c2, c3, .5)];
  const spots = (cell, R, fn) => eachHex(r, cell, (i, j, x, y) => fn(x + (hash(i, j, seed, 1) - .5) * cell * .12, y + (hash(i, j, seed, 2) - .5) * cell * .12, i * 7919 + j, R * (.94 + hash(i, j, seed, 5) * .14)));
  switch (st.style) {
    case 'td_spiral': { const cell = 330 * k; spots(cell, cell * .62, (x, y, s, R) => spiral(ctx, x, y, R, 8, Math.PI * 1.25, cols, s, seed)); break; }
    case 'td_swirl': { const cell = 330 * k; spots(cell, cell * .62, (x, y, s, R) => spiral(ctx, x, y, R, 12, Math.PI * 3.3, cols, s, seed)); break; }
    case 'td_mini': { const cell = 150 * k; spots(cell, cell * .62, (x, y, s, R) => spiral(ctx, x, y, R, 6, Math.PI * 1.7, cols, s, seed)); break; }
    case 'td_sunburst': { const cell = 250 * k; spots(cell, cell * .62, (x, y, s, R) => spiral(ctx, x, y, R, 20, Math.PI * .18, cols, s, seed)); break; }
    case 'td_bullseye': { const cell = 330 * k; spots(cell, cell * .6, (x, y, s, R) => rings(ctx, x, y, R, 7, cols2, s, seed, false)); break; }
    case 'td_diamond': { const cell = 330 * k; spots(cell, cell * .62, (x, y, s, R) => rings(ctx, x, y, R, 7, cols2, s, seed, true)); break; }
    case 'td_pleat': {
      const P = 58 * k, seg = 16 * k, pc = [c2, c3, mix(c2, c3, .5)];
      for (let i = Math.floor(r.x0 / P) - 2; i < Math.ceil(r.x1 / P) + 2; i++) {
        const col = pc[((i % 3) + 3) % 3], hw = P * (.46 + hash(i, 0, seed, 3) * .3), ph = hash(i, 1, seed, 4) * TAU, ph2 = hash(i, 2, seed, 5) * TAU, cx = (i + .5) * P;
        for (let y = Math.floor(r.y0 / seg) * seg - seg; y < r.y1 + seg; y += seg) {
          const o = 9 * k * Math.sin(y / (120 * k) * TAU / 2 + ph) + 5 * k * Math.sin(y / (47 * k) + ph2), g = ctx.createLinearGradient(cx - hw + o, 0, cx + hw + o, 0);
          g.addColorStop(0, rgba(col, 0)); g.addColorStop(.32, rgba(col, .92)); g.addColorStop(.68, rgba(col, .92)); g.addColorStop(1, rgba(col, 0));
          ctx.fillStyle = g; ctx.fillRect(cx - hw + o, y, hw * 2, seg + .8);
        }
      }
      break;
    }
    case 'td_ombre': {
      const g = ctx.createLinearGradient(0, -10, 0, gh + 10); g.addColorStop(0, c1); g.addColorStop(.5, c2); g.addColorStop(1, c3);
      ctx.fillStyle = g; ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
      ctx.lineWidth = 7 * k;
      for (let q = 0; q < 6; q++) {
        ctx.strokeStyle = q & 1 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)'; ctx.beginPath();
        const y0 = gh * (.12 + q * .15), ph = hash(q, 0, seed, 2) * TAU;
        for (let x = r.x0 - 10; x <= r.x1 + 10; x += 8) { const y = y0 + 14 * k * Math.sin(x / (110 * k) + ph) + 8 * k * Math.sin(x / (41 * k) + ph * 2); x === r.x0 - 10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.lineCap = 'round'; ctx.lineWidth = 5 * k;
      eachCell(r, 48 * k, gh, (i, j) => { if (hash(i, 0, seed, 6) < .55) { const x = i * 48 * k + hash(i, 1, seed, 7) * 40 * k, y0 = gh * (.55 + hash(i, 2, seed, 8) * .2); ctx.strokeStyle = rgba(c3, .45); ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + gh * (.15 + hash(i, 3, seed, 9) * .25)); ctx.stroke(); } });
      ctx.lineCap = 'butt';
      break;
    }
    case 'td_ice': {
      const cell = 150 * k, layers = [[c2, .55, 80], [c3, .55, 70], [mix(c2, c3, .5), .4, 56]];
      layers.forEach(([col, al, rs], L) => {
        ctx.fillStyle = rgba(col, al);
        eachCell(r, cell, cell, (i, j) => {
          const n = 1 + Math.floor(hash(i, j, seed, 40 + L) * 1.9);
          for (let q = 0; q < n; q++) blob(ctx, i * cell + hash(i, j, seed, 50 + q + L * 3) * cell, j * cell + hash(i, j, seed, 53 + q + L * 3) * cell, (.55 + hash(i, j, seed, 60 + q + L) * .7) * rs * k, i * 977 + j * 131 + q * 17 + L, seed, 9, .9);
        });
      });
      const sp = 26 * k;
      eachCell(r, sp, sp, (i, j) => { const h = hash(i, j, seed, 70); if (h < .42) { ctx.fillStyle = rgba(h < .2 ? c3 : c2, .5); ctx.beginPath(); ctx.arc(i * sp + hash(i, j, seed, 71) * sp, j * sp + hash(i, j, seed, 72) * sp, (1.2 + hash(i, j, seed, 73) * 3.2) * k, 0, TAU); ctx.fill(); } });
      ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = 1.4 * k; ctx.lineJoin = 'round';
      eachCell(r, 120 * k, 120 * k, (i, j) => {
        for (let q = 0; q < 2; q++) { let x = i * 120 * k + hash(i, j, seed, 80 + q) * 120 * k, y = j * 120 * k + hash(i, j, seed, 82 + q) * 120 * k, a = hash(i, j, seed, 84 + q) * TAU; ctx.beginPath(); ctx.moveTo(x, y); for (let s = 0; s < 5; s++) { a += (hash(i + s, j, seed, 86 + q) - .5) * 1.4; x += Math.cos(a) * 16 * k; y += Math.sin(a) * 16 * k; ctx.lineTo(x, y); } ctx.stroke(); }
      });
      break;
    }
    case 'td_marble': {
      const bh = 70 * k, A = bh * 1.1, f1 = TAU / (270 * k), f2 = TAU / (127 * k), pc = [c2, c3, mix(c2, c1, .5), mix(c2, c3, .5)];
      const cur = (j, x) => j * bh + A * Math.sin(x * f1 + hash(j, 1, seed, 3) * TAU) + A * .55 * Math.sin(x * f2 + hash(j, 2, seed, 4) * TAU);
      for (let j = Math.floor(r.y0 / bh) - 4; j < Math.ceil(r.y1 / bh) + 4; j++) {
        ctx.beginPath(); const xs = r.x0 - 12;
        for (let x = xs; x <= r.x1 + 12; x += 9) x === xs ? ctx.moveTo(x, cur(j, x)) : ctx.lineTo(x, cur(j, x));
        ctx.lineTo(r.x1 + 12, r.y1 + bh * 8); ctx.lineTo(xs, r.y1 + bh * 8); ctx.closePath();
        ctx.fillStyle = pc[((j % 4) + 4) % 4]; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1.6 * k;
        ctx.beginPath(); for (let x = xs; x <= r.x1 + 12; x += 9) x === xs ? ctx.moveTo(x, cur(j, x)) : ctx.lineTo(x, cur(j, x)); ctx.stroke();
      }
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
  if (id.startsWith('td_')) return drawTiedye(ctx, r, st, st.colors);
  if (id.startsWith('fa_')) return drawFauna(ctx, r, st, st.colors);
  return false;
}
