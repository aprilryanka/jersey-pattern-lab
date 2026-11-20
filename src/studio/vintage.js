// Kategori Vintage: pola jersey retro 80-90an (checker, harlequin, chevron, kilat, prisma, dll).
// Semua motif digambar per-sel global (hash) supaya menyambung antar panel garmen.
export const VINTAGE_STYLES = [
  ['vt_checker', 'Checker Besar'], ['vt_mini_check', 'Checker Mini'], ['vt_diamond', 'Harlequin'],
  ['vt_chevron', 'Zigzag 90an'], ['vt_herring', 'Herringbone'], ['vt_prism', 'Prisma Segitiga'],
  ['vt_lightning', 'Kilat Tajam'], ['vt_steps', 'Tangga Diagonal'], ['vt_fade', 'Strip Memudar'],
  ['vt_shards', 'Pecahan Kaca'], ['vt_memphis', 'Memphis Konfeti'], ['vt_dots', 'Polkadot'], ['vt_ink', 'Goresan Tinta'],
];
// Palet diambil dari jersey referensi (warna agak pudar khas kain lama): [dasar, motif, aksen]
export const VINTAGE_PALETTES = [
  ['#bcd3ee', '#f4f1ea', '#2a4f9b'], // Man Utd away: biru muda-putih
  ['#f1ece0', '#1b2f6b', '#8fb0de'], // navy-krem
  ['#f1ece0', '#1d6b3a', '#e8b923'], // hijau-kuning (Rapid/Celtic)
  ['#1c3f94', '#f1ece0', '#c8102e'], // royal blue 90an
  ['#d3202f', '#e8706f', '#f4d9d4'], // CCCP merah
  ['#1c2a4a', '#3b5f9e', '#0b0f1a'], // Umbro navy prisma
  ['#f1ece0', '#d3202f', '#2b4a9a'], // OMO/Ajax merah-biru
  ['#6f1d2b', '#e8b923', '#f1ece0'], // maroon-mustard
  ['#14141c', '#ff4fa3', '#19c7a6'], // memphis hitam-pink-teal
  ['#1d7a3a', '#f1ece0', '#0f4d24'], // hijau botol
  ['#f1ece0', '#14213d', '#14213d'], // Watford navy-krem
  ['#e8b923', '#1b2f6b', '#c8102e'], // kuning-navy-merah
];
// Palet alami per gaya (indeks ke VINTAGE_PALETTES)
export const VINTAGE_STYLE_PALETTE = { vt_checker: 0, vt_mini_check: 1, vt_diamond: 2, vt_chevron: 3, vt_herring: 4, vt_prism: 5, vt_lightning: 6, vt_steps: 3, vt_fade: 9, vt_shards: 0, vt_memphis: 8, vt_dots: 6, vt_ink: 10 };
export const VINTAGE_THUMB = { vt_checker: 1.6, vt_mini_check: 1.2, vt_diamond: 1.6, vt_chevron: 1.6, vt_herring: 1.6, vt_prism: 1.4, vt_lightning: 1.7, vt_steps: 1.3, vt_fade: 1.8, vt_shards: 1.8, vt_memphis: 1.7, vt_dots: 1.3, vt_ink: 1.8 };

function hash(i, j, s, k = 0) {
  let n = Math.imul(i | 0, 374761393) + Math.imul(j | 0, 668265263) + Math.imul(s | 0, 1013) + Math.imul(k, 2654435761);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
const hx = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const rgba = (h, a) => { const c = hx(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); };
function cells(r, cw, ch, fn, pad = 1) {
  const i0 = Math.floor(r.x0 / cw) - pad, i1 = Math.ceil(r.x1 / cw) + pad, j0 = Math.floor(r.y0 / ch) - pad, j1 = Math.ceil(r.y1 / ch) + pad;
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) fn(i, j);
}

export function drawVintage(ctx, r, st) {
  const [c1, c2, c3] = st.colors, k = st.scale || 1, seed = st.seed | 0, gh = st.gh || 760;
  const W = r.x1 - r.x0, H = r.y1 - r.y0;
  ctx.fillStyle = c1; ctx.fillRect(r.x0, r.y0, W, H);
  switch (st.style) {
    case 'vt_checker': case 'vt_mini_check': {
      const s = (st.style === 'vt_checker' ? 44 : 17) * k;
      cells(r, s, s, (i, j) => { if ((i + j) & 1) { ctx.fillStyle = c2; ctx.fillRect(i * s - .3, j * s - .3, s + .6, s + .6); } });
      if (st.style === 'vt_checker') cells(r, s * 4, s * 4, (i, j) => { ctx.fillStyle = c3; ctx.fillRect(i * s * 4 - .3, j * s * 4 - .3, s + .6, s + .6); });
      break;
    }
    case 'vt_diamond': {
      const hw = 34 * k, hh = 52 * k;
      cells(r, hw, hh, (i, j) => {
        for (const [oi, oj] of [[0, 0], [.5, .5]]) {
          const cx = (i + oi) * hw * 2, cy = (j + oj) * hh * 2;
          ctx.fillStyle = oi ? c2 : c1; poly(ctx, [[cx, cy - hh], [cx + hw, cy], [cx, cy + hh], [cx - hw, cy]]);
          ctx.strokeStyle = c3; ctx.lineWidth = 2.2 * k; ctx.stroke();
        }
      });
      break;
    }
    case 'vt_chevron': {
      const py = 66 * k, th = 24 * k, am = 20 * k, wl = 52 * k;
      for (let y = Math.floor(r.y0 / py) * py - py * 2, n = 0; y < r.y1 + py; y += py, n++) {
        const top = [], bot = [];
        for (let x = Math.floor(r.x0 / wl) * wl - wl; x < r.x1 + wl; x += wl / 2) { const up = Math.round(x / (wl / 2)) & 1 ? am : 0; top.push([x, y + up]); bot.push([x, y + up + th]); }
        ctx.fillStyle = Math.round(y / py) % 3 === 0 ? c3 : c2; poly(ctx, top.concat(bot.reverse()));
      }
      break;
    }
    case 'vt_herring': {
      const w = 54 * k, h = 24 * k, t = 14 * k;
      cells(r, w, h, (i, j) => {
        const cx = i * w + (j & 1 ? w / 2 : 0), y = j * h;
        ctx.fillStyle = (j & 1) ? c2 : c3;
        poly(ctx, [[cx, y], [cx + w / 2, y + h * .5], [cx + w / 2, y + h * .5 + t], [cx, y + t], [cx - w / 2, y + h * .5 + t], [cx - w / 2, y + h * .5]]);
      }, 2);
      break;
    }
    case 'vt_prism': {
      const s = 58 * k, rh = s * .866;
      cells(r, s, rh, (i, j) => {
        const x = (i + (j & 1 ? .5 : 0)) * s, y = j * rh;
        const tri = (pts, a) => { const h = hash(i, j, seed, a), col = h < .3 ? mix(c1, '#000000', .38) : h < .6 ? c1 : h < .85 ? mix(c1, '#ffffff', .22) : mix(c1, c2, .55); ctx.fillStyle = col; poly(ctx, pts.map(p => [p[0] + (p[0] > x ? .3 : -.3), p[1]])); };
        tri([[x, y + rh], [x + s / 2, y], [x + s, y + rh]], 1); tri([[x - s / 2, y], [x + s / 2, y], [x, y + rh]], 2);
      });
      break;
    }
    case 'vt_lightning': {
      const p = 84 * k, bw = 26 * k, step = 34 * k, a = 15 * k;
      for (let x = Math.floor(r.x0 / p) * p - p; x < r.x1 + p; x += p) {
        const L = [], R = [], L2 = [], R2 = [];
        for (let y = Math.floor(r.y0 / step) * step - step * 2; y < r.y1 + step * 2; y += step) { const o = (Math.round(y / step) & 1 ? a : -a); L.push([x + o, y]); R.push([x + o + bw, y]); L2.push([x + o + bw + 10 * k, y]); R2.push([x + o + bw + 16 * k, y]); }
        ctx.fillStyle = c2; poly(ctx, L.concat(R.slice().reverse()));
        ctx.fillStyle = c3; poly(ctx, L2.concat(R2.slice().reverse()));
      }
      break;
    }
    case 'vt_steps': {
      const s = 24 * k;
      cells(r, s, s, (i, j) => { const d = ((i + j) % 8 + 8) % 8; if (d < 3 || d === 4) { ctx.fillStyle = d === 4 ? c3 : c2; ctx.fillRect(i * s - .3, j * s - .3, s + .6, s + .6); } });
      break;
    }
    case 'vt_fade': {
      const w = 46 * k, g = ctx.createLinearGradient(0, 0, 0, gh * .75);
      g.addColorStop(0, c2); g.addColorStop(.55, rgba(c2, .65)); g.addColorStop(1, rgba(c2, 0));
      ctx.fillStyle = g;
      for (let x = Math.floor(r.x0 / (w * 2)) * w * 2 - w * 2; x < r.x1 + w * 2; x += w * 2) ctx.fillRect(x, Math.min(r.y0, 0), w, Math.max(r.y1, gh) - Math.min(r.y0, 0));
      break;
    }
    case 'vt_shards': {
      const s = 70 * k;
      cells(r, s, s, (i, j) => {
        for (let n = 0; n < 3; n++) {
          const cx = (i + hash(i, j, seed, n * 5 + 1)) * s, cy = (j + hash(i, j, seed, n * 5 + 2)) * s, a = hash(i, j, seed, n * 5 + 3) * 6.283, L = (24 + hash(i, j, seed, n * 5 + 4) * 26) * k;
          ctx.fillStyle = hash(i, j, seed, n * 5 + 7) < .55 ? c2 : c3;
          poly(ctx, [0, 1, 2].map(q => { const aa = a + q * 2.2 + hash(i, j, seed, q + 40) * .5; return [cx + Math.cos(aa) * L * (q ? .8 : 1.3), cy + Math.sin(aa) * L * (q ? .8 : 1.3)]; }));
        }
      });
      break;
    }
    case 'vt_memphis': {
      const s = 84 * k;
      cells(r, s, s, (i, j) => {
        const cx = (i + .2 + hash(i, j, seed, 1) * .6) * s, cy = (j + .2 + hash(i, j, seed, 2) * .6) * s, a = hash(i, j, seed, 3) * 6.283, t = Math.floor(hash(i, j, seed, 4) * 4), col = hash(i, j, seed, 5) < .5 ? c2 : c3, z = 15 * k;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 4.5 * k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        if (t === 0) poly(ctx, [[0, -z], [z, z * .8], [-z, z * .8]]);
        else if (t === 1) { ctx.beginPath(); ctx.arc(0, 0, z * .6, 0, 6.283); ctx.fill(); }
        else if (t === 2) { ctx.beginPath(); for (let q = -3; q <= 3; q++) ctx.lineTo(q * z * .45, (q & 1 ? -1 : 1) * z * .45); ctx.stroke(); }
        else { ctx.beginPath(); for (let q = 0; q <= 12; q++) ctx.lineTo(-z * 1.2 + q * z * .2, Math.sin(q * .9) * z * .5); ctx.stroke(); }
        ctx.restore();
      });
      break;
    }
    case 'vt_dots': {
      const s = 46 * k, rd = 15 * k;
      cells(r, s, s * .5, (i, j) => { const x = (i + (j & 1 ? .5 : 0)) * s, y = j * s * .5; ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(x, y, rd, 0, 6.283); ctx.fill(); ctx.fillStyle = c3; ctx.beginPath(); ctx.arc(x, y, rd * .42, 0, 6.283); ctx.fill(); }, 2);
      break;
    }
    case 'vt_ink': {
      const cw = 9 * k, seg = 150 * k;
      cells(r, cw, seg, (i, j) => {
        const h = hash(i, j, seed, 1); if (h < .45) return;
        const w = (1 + Math.floor(hash(i, j, seed, 2) * 3)) * cw, y0 = j * seg + hash(i, j, seed, 3) * seg * .3, L = seg * (.45 + hash(i, j, seed, 4) * .7);
        const g = ctx.createLinearGradient(0, y0, 0, y0 + L); const a = .75 + hash(i, j, seed, 5) * .25;
        g.addColorStop(0, rgba(c2, 0)); g.addColorStop(.18, rgba(c2, a)); g.addColorStop(.8, rgba(c2, a)); g.addColorStop(1, rgba(c2, 0));
        ctx.fillStyle = g; ctx.fillRect(i * cw, y0, w, L);
      }, 2);
      break;
    }
    default: return false;
  }
  return true;
}
