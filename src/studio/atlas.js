// Atlas tekstur: menggambar semua panel pola jahit ke satu kanvas yang
// koordinatnya sama dengan UV model (mm dari DXF CLO3D).
import { drawBasic } from './basic.js';

export const FONTS = [['Anton', 'Anton', 400], ['Bebas Neue', 'Bebas Neue', 400], ['Barlow Condensed Italic', 'Barlow Condensed', 800, 1], ['Barlow Condensed', 'Barlow Condensed', 800], ['Kanit Italic', 'Kanit', 800, 1], ['Kanit', 'Kanit', 800], ['Big Shoulders', 'Big Shoulders Display', 900], ['Saira Condensed', 'Saira Condensed', 800], ['Teko', 'Teko', 700], ['Oswald', 'Oswald', 700], ['Russo One', 'Russo One', 400], ['Squada One', 'Squada One', 400], ['Staatliches', 'Staatliches', 400], ['Fjalla One', 'Fjalla One', 400], ['Passion One', 'Passion One', 900], ['Racing Sans One', 'Racing Sans One', 400], ['Black Ops One', 'Black Ops One', 400], ['Chakra Petch', 'Chakra Petch', 700], ['Orbitron', 'Orbitron', 800], ['Bungee', 'Bungee', 400], ['Graduate (kampus)', 'Graduate', 400], ['Alfa Slab One', 'Alfa Slab One', 400], ['Bowlby One', 'Bowlby One', 400], ['Changa One', 'Changa One', 400], ['Archivo Black', 'Archivo Black', 400], ['Rubik Mono One', 'Rubik Mono One', 400], ['Permanent Marker', 'Permanent Marker', 400], ['Bricolage Grotesque', 'Bricolage Grotesque', 800]];
export const fontCss = (L, px) => { const f = FONTS[L.font] || FONTS[0]; return `${(L.italic || f[3]) ? 'italic ' : ''}${f[2]} ${px}px "${f[1]}", sans-serif`; };

/** Siapkan geometri panel + tata letak "ruang pola" (unwrap badan) untuk sebuah model. */
export function layoutModel(panels, uv) {
  const P = panels.map(p => {
    const xs = p.pts.map(q => q[0]), ys = p.pts.map(q => q[1]);
    const bb = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    return { ...p, bb, w: bb.maxX - bb.minX, h: bb.maxY - bb.minY, rib: p.role === 'rib' };
  });
  const torso = [...P.filter(p => p.role === 'front'), ...P.filter(p => p.role === 'back')];
  const body = P.filter(p => !p.rib);
  const top = Math.max(...(torso.length ? torso : body).map(p => p.bb.maxY));
  const bottom = Math.min(...(torso.length ? torso : body).map(p => p.bb.minY));
  let cur = 0;
  for (const p of torso) { p.sx = p.bb.minX - cur; cur += p.w; }
  const GW = cur || (body[0]?.w || 500);
  cur += 60;
  for (const p of P) if (p.sx === undefined) { p.sx = p.bb.minX - cur; cur += p.w + 60; }
  return { panels: P, byId: Object.fromEntries(P.map(p => [p.id, p])), top, GW, GH: top - bottom, uMin: uv.uMin, vTop: uv.vTop, Wmm: uv.Wmm, Hmm: uv.Hmm };
}

/** Koordinat ruang pola untuk panel p. seam=true: badan depan+belakang menyambung. */
function anchor(L, p, seam) {
  return seam ? { ax: p.sx, ay: L.top, pivot: [L.GW / 2, L.GH / 2] } : { ax: p.bb.minX, ay: p.bb.maxY, pivot: [p.w / 2, p.h / 2] };
}

function editMatrix(e, pivot) {
  const m = new DOMMatrix();
  m.translateSelf(pivot[0] + (e.offX || 0), pivot[1] + (e.offY || 0));
  m.rotateSelf(e.rot || 0);
  m.scaleSelf((e.scale || 1) * (e.flip ? -1 : 1), e.scale || 1);
  m.translateSelf(-pivot[0], -pivot[1]);
  return m;
}

function invBounds(m, x0, y0, x1, y1, pad = 30) {
  const inv = m.inverse();
  const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => inv.transformPoint(new DOMPoint(x, y)));
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return { x0: Math.min(...xs) - pad, y0: Math.min(...ys) - pad, x1: Math.max(...xs) + pad, y1: Math.max(...ys) + pad };
}

export function panelPath(ctx, p, tx = x => x, ty = y => y) {
  ctx.beginPath();
  p.pts.forEach((q, i) => i ? ctx.lineTo(tx(q[0]), ty(q[1])) : ctx.moveTo(tx(q[0]), ty(q[1])));
  ctx.closePath();
}

/** Rasio tinggi huruf kapital terhadap ukuran font (diukur dari glyph asli). */
const _cap = new Map();
function capRatio(ctx, L) {
  const f = FONTS[L.font] || FONTS[0], key = f[1] + (L.italic ? 'i' : '');
  const ready = document.fonts ? document.fonts.check(`100px "${f[1]}"`) : true;
  if (ready && _cap.has(key)) return _cap.get(key);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = fontCss(L, 100);
  const m = ctx.measureText('H09');
  ctx.restore();
  const r = Math.min(1.2, Math.max(.45, ((m.actualBoundingBoxAscent || 72) + (m.actualBoundingBoxDescent || 0)) / 100));
  if (ready) _cap.set(key, r);
  return r;
}

/** Ukuran kotak layer (mm) untuk hit-test & seleksi. */
export function measureLayer(ctx, L) {
  if (L.type === 'image') { const ar = L.img && L.img.width ? L.img.height / L.img.width : 1; L._w = L.w; L._h = L.w * ar; return; }
  const cr = capRatio(ctx, L);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = fontCss(L, 100);
  const lines = String(L.text || ' ').split('\n');
  const w = Math.max(...lines.map(s => ctx.measureText(L.upper === false ? s : s.toUpperCase()).width)) / 100 * L.size / cr;
  ctx.restore();
  L._w = Math.max(4, w); L._h = L.size * (1 + (lines.length - 1) * 1.25); L._cr = cr;
}

function drawLayer(ctx, L) {
  ctx.save();
  ctx.translate(L.lx, L.ly);
  if (L.rot) ctx.rotate(L.rot * Math.PI / 180);
  ctx.globalAlpha = L.opacity ?? 1;
  if (L.type === 'image') {
    if (L.img && L.img.complete && L.img.width) {
      const h = L.w * L.img.height / L.img.width;
      ctx.drawImage(L.img, -L.w / 2, -h / 2, L.w, h);
    }
  } else {
    const px = L.size / (L._cr || .72);
    ctx.font = fontCss(L, px);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    const lines = String(L.text || '').split('\n').map(s => L.upper === false ? s : s.toUpperCase());
    const lh = L.size * 1.25, y0 = -(lines.length - 1) * lh / 2 + L.size / 2; // baseline: huruf kapital pas di tengah
    lines.forEach((s, i) => {
      if (L.strokeW > 0) { ctx.lineWidth = L.strokeW * 2; ctx.strokeStyle = L.stroke; ctx.strokeText(s, 0, y0 + i * lh); }
      ctx.fillStyle = L.color; ctx.fillText(s, 0, y0 + i * lh);
    });
  }
  ctx.restore();
}

export function watermark(ctx, w, h, a = .4) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(w / 2, h / 2); ctx.rotate(-.5);
  const fs = Math.max(14, Math.min(w, h) * .035); ctx.font = `700 ${fs}px "Barlow Condensed", sans-serif`; ctx.textAlign = 'center';
  ctx.lineWidth = fs * .12; ctx.lineJoin = 'round'; ctx.strokeStyle = `rgba(0,0,0,${a * .9})`; ctx.fillStyle = `rgba(255,255,255,${a})`;
  const gx = fs * 21, gy = fs * 5.5, n = Math.ceil(Math.hypot(w, h) / gy / 2) + 1;
  for (let i = -n; i <= n; i++) for (let j = -3; j <= 3; j++) { const x = j * gx + (i % 2 ? gx / 2 : 0); ctx.strokeText('JERSEY PATTERN LAB · PREVIEW', x, i * gy); ctx.fillText('JERSEY PATTERN LAB · PREVIEW', x, i * gy); }
  ctx.restore();
}

/** Isi panel dengan sumber pattern aktif (Basic/Advanced) dalam ruang pola. */
function fillPattern(ctx, L, p, S, adv) {
  const seam = S.edit.seam !== false;
  const a = anchor(L, p, seam);
  const x0 = p.bb.minX - a.ax, x1 = p.bb.maxX - a.ax, y0 = a.ay - p.bb.maxY, y1 = a.ay - p.bb.minY;
  const m = editMatrix(S.edit, a.pivot);
  ctx.save();
  ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
  const r = invBounds(m, x0 - 8, y0 - 8, x1 + 8, y1 + 8);
  if (S.mode === 'advanced' && adv) {
    const tile = (seam ? L.GW : p.w * 2) / Math.max(1, S.edit.repeats || 2);
    const pt = ctx.createPattern(adv.pat, 'repeat');
    const k = tile / adv.pat.width;
    pt.setTransform(new DOMMatrix([k, 0, 0, k, 0, 0]));
    ctx.fillStyle = pt; ctx.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
  } else {
    drawBasic(ctx, r, { ...S.basic, gh: L.GH });
  }
  ctx.restore();
  return a;
}

/**
 * Render atlas ke ctx. sc = piksel per mm. Kanvas berukuran Wmm*sc × Hmm*sc.
 * opts: { watermark:bool, layers:bool }
 */
export function renderAtlas(ctx, L, S, adv, sc, opts = {}) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const base = S.mode === 'advanced' ? '#808080' : S.basic.colors[0];
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
  const seam = S.edit.seam !== false;
  for (const p of L.panels) {
    const fill = S.panelFill[p.id] || (p.rib ? { mode: 'solid', color: S.ribColor } : { mode: 'pattern' });
    const a = anchor(L, p, seam);
    ctx.save();
    ctx.setTransform(sc, 0, 0, sc, (a.ax - L.uMin) * sc, (L.vTop - a.ay) * sc);
    const x0 = p.bb.minX - a.ax, y0 = a.ay - p.bb.maxY;
    ctx.beginPath(); ctx.rect(x0 - 6, y0 - 6, p.w + 12, p.h + 12); ctx.clip();
    if (fill.mode === 'solid') { ctx.fillStyle = fill.color || S.ribColor; ctx.fillRect(x0 - 6, y0 - 6, p.w + 12, p.h + 12); }
    else fillPattern(ctx, L, p, S, adv);
    ctx.restore();
  }
  if (opts.layers !== false) renderLayers(ctx, L, S, sc);
  if (opts.watermark) watermark(ctx, W, H, .35);
}

/** Gambar semua layer teks/gambar di atas atlas. */
export function renderLayers(ctx, L, S, sc) {
  for (const Ly of S.layers) {
    if (Ly.hidden) continue;
    const p = L.byId[Ly.panel]; if (!p) continue;
    ctx.save();
    ctx.setTransform(sc, 0, 0, sc, (p.bb.minX - L.uMin) * sc, (L.vTop - p.bb.maxY) * sc);
    ctx.beginPath(); ctx.rect(-2, -2, p.w + 4, p.h + 4); ctx.clip();
    measureLayer(ctx, Ly);
    drawLayer(ctx, Ly);
    ctx.restore();
  }
}

/** Render satu panel saja (untuk export pola jahit), kanvas = bbox panel + margin. */
export function renderPanel(L, S, adv, p, sc, margin = 10, opts = {}) {
  const w = Math.ceil((p.w + margin * 2) * sc), h = Math.ceil((p.h + margin * 2) * sc);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  // atlas virtual yang digeser agar panel p berada di (margin, margin)
  const L2 = { ...L, uMin: p.bb.minX - margin, vTop: p.bb.maxY + margin };
  renderAtlas(ctx, L2, S, adv, sc, { layers: true });
  // potong ke bentuk panel
  ctx.globalCompositeOperation = 'destination-in';
  ctx.setTransform(sc, 0, 0, sc, 0, 0);
  panelPath(ctx, p, x => x - L2.uMin, y => L2.vTop - y);
  ctx.fillStyle = '#000'; ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  if (opts.watermark) watermark(ctx, w, h, .35);
  return c;
}
