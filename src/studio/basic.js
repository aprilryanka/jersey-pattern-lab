// Motif Basic: 8 motif cepat, digambar di "ruang garmen" (mm, y ke bawah).
// Posisi acak memakai hash per sel grid global, jadi motif menyambung antar panel.

export const BASIC_STYLES = [
  ['solid', 'Polos'], ['stripes', 'Garis'], ['chevron', 'Chevron'], ['waves', 'Gelombang'],
  ['gradient', 'Gradien'], ['shards', 'Shards'], ['camo', 'Kamuflase'], ['halftone', 'Halftone'],
];

export const BASIC_PALETTES = [
  ['#0b3d91', '#f2b705', '#ffffff'], ['#b3122b', '#111111', '#f4f4f4'], ['#0e6b4f', '#f2e8c9', '#1b1b1b'],
  ['#5b2a86', '#f4c430', '#ffffff'], ['#101820', '#e8613c', '#f7f1e3'], ['#0a8f8f', '#1f2a44', '#fdfdfd'],
  ['#f3f3f3', '#1d3557', '#e63946'], ['#f26a00', '#0d0d0d', '#ffd9b3'], ['#2b2d42', '#8d99ae', '#edf2f4'],
  ['#1b4332', '#95d5b2', '#ffffff'], ['#d7263d', '#1b1b3a', '#f5cb5c'], ['#0d1b2a', '#00b4d8', '#caf0f8'],
];

function hash(i, j, s, k = 0) {
  let n = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(s | 0, 1013) + Math.imul(k, 2654435761);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/**
 * Gambar motif menutupi area r = {x0,y0,x1,y1} (mm, ruang pola).
 * st: {style, colors:[c1,c2,c3], seed, scale, gh (tinggi garmen mm)}
 */
export function drawBasic(ctx, r, st) {
  const [c1, c2, c3] = st.colors, k = st.scale || 1, seed = st.seed | 0, gh = st.gh || 760;
  const { x0, y0, x1, y1 } = r;
  ctx.fillStyle = c1; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  switch (st.style) {
    case 'stripes': {
      const bw = 38 * k, p = bw * 2;
      for (let x = Math.floor(x0 / p) * p; x < x1; x += p) {
        ctx.fillStyle = c2; ctx.fillRect(x, y0, bw, y1 - y0);
        ctx.fillStyle = c3; ctx.fillRect(x + bw, y0, bw * .16, y1 - y0);
      }
      break;
    }
    case 'chevron': case 'waves': {
      const bh = 44 * k, L = 120 * k, A = L * .42, wave = st.style === 'waves', P = bh * 2;
      const xs = Math.floor(x0 / L) * L - L, xe = x1 + L;
      const edge = (y, rev) => {
        const pts = [];
        if (wave) for (let x = xs; x <= xe; x += 5) pts.push([x, y + A * .5 * Math.sin(2 * Math.PI * x / L)]);
        else for (let x = xs; x <= xe; x += L / 2) pts.push([x, y + (Math.round(x / (L / 2)) % 2 ? A : 0)]);
        return rev ? pts.reverse() : pts;
      };
      for (let y = Math.floor((y0 - A) / P) * P; y < y1 + A; y += P) {
        const top = edge(y, false), bot = edge(y + bh, true);
        ctx.beginPath(); top.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); bot.forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath();
        ctx.fillStyle = c2; ctx.fill();
        const ln = edge(y + bh + bh * .2, false);
        ctx.beginPath(); ln.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.strokeStyle = c3; ctx.lineWidth = bh * .12; ctx.stroke();
      }
      break;
    }
    case 'gradient': {
      const g = ctx.createLinearGradient(0, -10, 0, gh + 10);
      g.addColorStop(0, c1); g.addColorStop(.55, c2); g.addColorStop(1, c3);
      ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.strokeStyle = c3; ctx.globalAlpha = .12; ctx.lineWidth = 2 * k;
      const st2 = 16 * k, span = y1 - y0;
      for (let x = Math.floor((x0 - span) / st2) * st2; x < x1; x += st2) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + span * .5, y1); ctx.stroke(); }
      ctx.globalAlpha = 1;
      break;
    }
    case 'shards': {
      const cs = 74 * k, cols = [c1, c2, c3];
      const i0 = Math.floor(x0 / cs) - 1, i1 = Math.ceil(x1 / cs) + 1, j0 = Math.floor(y0 / cs) - 1, j1 = Math.ceil(y1 / cs) + 1;
      const P = (i, j) => [i * cs + (hash(i, j, seed, 1) - .5) * cs * .75, j * cs + (hash(i, j, seed, 2) - .5) * cs * .75];
      const pick = (i, j, t) => { const r = hash(i, j, seed, 3 + t); return r < .42 ? 0 : r < .78 ? 1 : 2; };
      const tri = (a, b, c, i, j, t) => {
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath();
        ctx.fillStyle = cols[pick(i, j, t)]; ctx.fill();
        const h = hash(i, j, seed, 7 + t);
        ctx.globalAlpha = h * .2; ctx.fillStyle = hash(i, j, seed, 9 + t) < .5 ? '#000' : '#fff'; ctx.fill(); ctx.globalAlpha = 1;
      };
      for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
        const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
        if (hash(i, j, seed, 5) < .5) { tri(a, b, d, i, j, 0); tri(b, c, d, i, j, 1); } else { tri(a, b, c, i, j, 0); tri(a, c, d, i, j, 1); }
      }
      break;
    }
    case 'camo': {
      const cell = 120 * k;
      const blob = (cx, cy, r, salt) => {
        const m = 11, pts = [];
        for (let i = 0; i < m; i++) { const a = i / m * Math.PI * 2, rr = r * (.62 + hash(salt, i, seed, 31) * .7); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
        const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        ctx.beginPath(); const s = mid(pts[m - 1], pts[0]); ctx.moveTo(s[0], s[1]);
        for (let i = 0; i < m; i++) { const e = mid(pts[i], pts[(i + 1) % m]); ctx.quadraticCurveTo(pts[i][0], pts[i][1], e[0], e[1]); }
        ctx.closePath(); ctx.fill();
      };
      [[c2, 2.3, 1], [c3, 1.6, .8], [c1, 1.8, .55]].forEach(([col, per, rs], L) => {
        ctx.fillStyle = col;
        const i0 = Math.floor(x0 / cell) - 1, i1 = Math.ceil(x1 / cell) + 1, j0 = Math.floor(y0 / cell) - 1, j1 = Math.ceil(y1 / cell) + 1;
        for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
          const n = Math.floor(per + hash(i, j, seed, 40 + L));
          for (let q = 0; q < n; q++) {
            const salt = (i * 73856093) ^ (j * 19349663) ^ (q * 83492791) ^ (L * 2654435);
            blob(i * cell + hash(i, j, seed, 50 + q * 3 + L) * cell, j * cell + hash(i, j, seed, 51 + q * 3 + L) * cell, (.5 + hash(i, j, seed, 52 + q * 3 + L)) * 66 * k * rs, salt);
          }
        }
      });
      break;
    }
    case 'halftone': {
      const sp = 24 * k, rowH = sp * .866;
      const r0 = Math.floor(y0 / rowH) - 1, r1 = Math.ceil(y1 / rowH) + 1;
      ctx.fillStyle = c2;
      for (let j = r0; j < r1; j++) {
        const y = j * rowH, t = clamp(y / gh, 0, 1), r = sp * .64 * Math.pow(t, .85);
        if (r < .4) continue;
        const off = (j & 1) ? sp / 2 : 0;
        for (let x = Math.floor(x0 / sp) * sp - sp + off; x < x1 + sp; x += sp) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
      }
      ctx.fillStyle = c3; ctx.globalAlpha = .9;
      for (let j = r0; j < r1; j++) {
        const y = j * rowH; if (y / gh < .82) continue;
        const off = (j & 1) ? sp / 2 : 0;
        for (let x = Math.floor(x0 / sp) * sp - sp + off; x < x1 + sp; x += sp) { ctx.beginPath(); ctx.arc(x, y, sp * .2, 0, 7); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      break;
    }
    default: break;
  }
}

/** Thumbnail motif untuk tombol pilihan. */
export function drawBasicThumb(canvas, st) {
  const x = canvas.getContext('2d'), sz = 170 * Math.max(.6, st.scale || 1);
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, canvas.width, canvas.height);
  x.save(); x.scale(canvas.width / sz, canvas.height / sz);
  drawBasic(x, { x0: 0, y0: 0, x1: sz, y1: sz }, { ...st, gh: sz });
  x.restore();
}
