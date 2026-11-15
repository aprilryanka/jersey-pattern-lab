// Mode demo untuk calon pembeli lisensi source code (pasar luar negeri).
// Aktif di domain demo (jpl-demo.*, demo.*) atau saat dibuka dengan ?demo=1 (untuk uji).
// Di mode demo: bahasa Inggris saja, semua fitur Pro terbuka, file ekspor diberi watermark,
// dan semua jalur langganan/login/WhatsApp diganti ajakan membeli lisensi.

const KEY = 'jpl-demo';
function detect() {
  try {
    if (/^(jpl-demo|demo)[.-]/i.test(location.hostname)) return true;
    const q = new URLSearchParams(location.search).get('demo');
    if (q === '1') { sessionStorage.setItem(KEY, '1'); return true; }
    if (q === '0') { sessionStorage.removeItem(KEY); return false; }
    return sessionStorage.getItem(KEY) === '1';
  } catch { return false; }
}

export const DEMO = detect();
export const GUMROAD_BASIC = 'https://aprilryan.gumroad.com/l/wahhpe';
export const GUMROAD_PRO = 'https://aprilryan.gumroad.com/l/jpl-pro';

if (DEMO && typeof document !== 'undefined') document.documentElement.classList.add('demo');

const MARK = 'JERSEY PATTERN LAB · DEMO';

/** Tambahkan watermark DEMO ke file gambar (PNG/JPG) atau SVG. File lain dikembalikan apa adanya. */
export async function watermark(blob) {
  if (!DEMO || !blob) return blob;
  const type = blob.type || '';
  if (type === 'image/svg+xml') {
    const svg = await blob.text();
    const vb = /viewBox="([\d.\-\s]+)"/.exec(svg);
    const [x, y, w, h] = vb ? vb[1].trim().split(/\s+/).map(Number) : [0, 0, 1000, 1000];
    const fs = Math.max(w, h) / 30;
    let marks = '';
    for (let yy = y + fs; yy < y + h; yy += fs * 5) for (let xx = x - w * .2; xx < x + w; xx += fs * 14)
      marks += `<text x="${xx.toFixed(1)}" y="${yy.toFixed(1)}" font-family="Arial,sans-serif" font-weight="700" font-size="${fs.toFixed(1)}" fill="#000" fill-opacity=".14" transform="rotate(-20 ${xx.toFixed(1)} ${yy.toFixed(1)})">${MARK}</text>`;
    return new Blob([svg.replace(/<\/svg>\s*$/, `<g id="demo-watermark" pointer-events="none">${marks}</g></svg>`)], { type });
  }
  if (!/^image\/(png|jpeg|webp)$/.test(type)) return blob;
  const bmp = await createImageBitmap(blob);
  const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
  const g = c.getContext('2d'); g.drawImage(bmp, 0, 0);
  const fs = Math.max(18, Math.round(Math.max(c.width, c.height) / 28));
  g.font = `700 ${fs}px Arial, sans-serif`; g.textBaseline = 'middle';
  g.save(); g.translate(c.width / 2, c.height / 2); g.rotate(-20 * Math.PI / 180);
  const span = Math.hypot(c.width, c.height);
  for (let yy = -span / 2; yy < span / 2; yy += fs * 4.5) for (let xx = -span / 2; xx < span / 2; xx += fs * 15) {
    g.fillStyle = 'rgba(255,255,255,.22)'; g.fillText(MARK, xx + 1, yy + 1);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillText(MARK, xx, yy);
  }
  g.restore();
  return new Promise(r => c.toBlob(b => r(b || blob), type, .92));
}
