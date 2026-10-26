// Export: pattern (tile), pola jahit skala 1:1 (SVG/PNG), dan snapshot 3D.
import { drawBasic } from './basic.js';
import { renderAtlas, renderPanel, panelPath, watermark } from './atlas.js';

const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const toBlob = (c, type = 'image/png', q) => new Promise(r => c.toBlob(r, type, q));

/** Tile pattern persegi. Basic: area 600×600 mm. Advanced: tile generator asli. */
export async function exportPattern({ S, adv, size, jpg, wm, texSize }) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (S.mode === 'advanced') {
    adv.ensure(size); ctx.drawImage(adv.pat, 0, 0, size, size); adv.ensure(texSize);
  } else {
    ctx.scale(size / 600, size / 600);
    drawBasic(ctx, { x0: 0, y0: 0, x1: 600, y1: 600 }, { ...S.basic, gh: 600 });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  if (wm) watermark(ctx, size, size, .5);
  return toBlob(c, jpg ? 'image/jpeg' : 'image/png', .93);
}

/** Pola jahit SVG skala 1:1 (mm). Setiap panel = gambar desain + garis potong + label. */
export async function exportSewingSVG({ L, S, adv, dpi = 100, modelName = 'Jersey', size = 'M', progress = () => { } }) {
  const sc = dpi / 25.4, m = 15;
  const minX = L.uMin - m, maxY = L.vTop + m, W = L.Wmm + m * 2, H = L.Hmm + m * 2 + 30;
  const parts = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W.toFixed(2)}mm" height="${H.toFixed(2)}mm" viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}">`);
  parts.push(`<title>${esc(modelName)} · ukuran ${esc(size)} · pola jahit skala 1:1 (mm)</title>`);
  const tx = x => (x - minX).toFixed(2), ty = y => (maxY - y).toFixed(2);
  let i = 0;
  for (const p of L.panels) {
    progress(.05 + .85 * i / L.panels.length, `Menyiapkan panel ${p.label}…`); i++;
    await new Promise(r => setTimeout(r, 0));
    const c = renderPanel(L, S, adv, p, sc, 0);
    const url = c.toDataURL('image/png');
    const d = 'M' + p.pts.map(q => `${tx(q[0])} ${ty(q[1])}`).join('L') + 'Z';
    parts.push(`<g id="${esc(p.id)}"><title>${esc(p.label)}</title>`);
    parts.push(`<image x="${tx(p.bb.minX)}" y="${ty(p.bb.maxY)}" width="${p.w.toFixed(2)}" height="${p.h.toFixed(2)}" preserveAspectRatio="none" xlink:href="${url}"/>`);
    parts.push(`<path d="${d}" fill="none" stroke="#000" stroke-width="0.35"/>`);
    if (!p.rib) {
      const cx = (p.bb.minX + p.bb.maxX) / 2;
      parts.push(`<line x1="${tx(cx)}" y1="${(maxY - p.bb.maxY + 25).toFixed(2)}" x2="${tx(cx)}" y2="${(maxY - p.bb.minY - 25).toFixed(2)}" stroke="#000" stroke-width="0.3" stroke-dasharray="4 3" opacity=".6"/>`);
      parts.push(`<text x="${tx(cx)}" y="${(maxY - p.bb.minY + 9).toFixed(2)}" font-family="Arial, sans-serif" font-size="6" text-anchor="middle">${esc(p.label)} · ${(p.w / 10).toFixed(1)} × ${(p.h / 10).toFixed(1)} cm · ${esc(size)}</text>`);
    }
    parts.push('</g>');
  }
  parts.push(`<text x="${m}" y="${(H - 8).toFixed(2)}" font-family="Arial, sans-serif" font-size="5" fill="#333">Jersey Pattern Lab · ${esc(modelName)} · ukuran ${esc(size)} · skala 1:1 (mm) · cetak 100% tanpa "fit to page" · ${new Date().toLocaleDateString('id-ID')}</text>`);
  parts.push(`<g transform="translate(${m} ${(H - 22).toFixed(2)})"><rect width="100" height="4" fill="#000"/><text y="-2" font-family="Arial" font-size="4">10 cm (cek skala)</text></g>`);
  parts.push('</svg>');
  progress(.97, 'Menyusun file SVG…');
  return new Blob(parts, { type: 'image/svg+xml' });
}

/** Pola jahit PNG: layout semua panel di satu lembar pada DPI tertentu. */
export async function exportSewingPNG({ L, S, adv, dpi = 100, size = 'M', wm = false, progress = () => { } }) {
  const sc = dpi / 25.4;
  const c = document.createElement('canvas'); c.width = Math.ceil(L.Wmm * sc); c.height = Math.ceil(L.Hmm * sc);
  if (c.width * c.height > 200e6) throw new Error('Resolusi terlalu besar untuk browser ini. Pilih DPI lebih kecil.');
  const ctx = c.getContext('2d');
  progress(.2, 'Menggambar desain…'); await new Promise(r => setTimeout(r, 0));
  renderAtlas(ctx, L, S, adv, sc, { layers: true });
  // hapus area di luar panel → transparan
  ctx.globalCompositeOperation = 'destination-in';
  ctx.setTransform(sc, 0, 0, sc, 0, 0); ctx.fillStyle = '#000';
  ctx.beginPath(); for (const p of L.panels) { p.pts.forEach((q, i) => i ? ctx.lineTo(q[0] - L.uMin, L.vTop - q[1]) : ctx.moveTo(q[0] - L.uMin, L.vTop - q[1])); ctx.closePath(); }
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  progress(.7, 'Menambah garis potong…');
  ctx.strokeStyle = '#000'; ctx.lineWidth = .35;
  for (const p of L.panels) { panelPath(ctx, p, x => x - L.uMin, y => L.vTop - y); ctx.stroke(); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (wm) watermark(ctx, c.width, c.height, .35);
  progress(.9, 'Menyimpan PNG…');
  return toBlob(c);
}

export const exportViews = ['front', 'back', 'side'];
