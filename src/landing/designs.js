// Desain showcase untuk hero: diambil dari Studio (Advanced seed 586840 & 118103, lalu Basic Halftone).
// Urutan: JAPAN -> JAKARTA -> BALI. Tiap desain membawa state generator + gaya teksnya.
import { FONTS } from '../studio/atlas.js';

const DV = { ib: 3, sc: 2, wp: 150, ct: 25, bd: 5, sf: 22, dt: 9, sw: 0, ps: 0, rg: 0, rl: 0, px: 0, wv: 0, gl: 0, sl: 0, sp: 0, fd: 0, vg: 0, gr: 45, gw: 24, gk: 60, gb: 60 };

export const DESIGNS = [
  {
    id: 'japan', label: 'Advanced · seed 586840', mode: 'advanced',
    adv: { s: { sty: 'blur', pal: 'Custom', fin: 'dith', seed: 586840, cx: .5, cy: .5, mir: false, glass: 'd' }, v: { ...DV, dt: 8, gw: 40, gk: 50, ct: 18, sc: 3, gr: 0 }, c: ['#2c3bb0', '#2c3bb0', '#ffd84a', '#ffe36e'], i: false },
    rib: '#ffd84a',
    text: { team: 'JAPAN', name: 'JAPAN', number: '10', font: 4, size: 52, color: '#2438a8', stroke: '#fff6c8', italic: true },
  },
  {
    id: 'jakarta', label: 'Advanced · seed 118103', mode: 'advanced',
    adv: { s: { sty: 'smoke', pal: 'Ember', fin: 'none', seed: 118103, cx: .5, cy: .5, mir: false, glass: '' }, v: { ...DV, sc: 1, wp: 220, ct: 25, gr: 50 }, c: ['#0a0a0a', '#1d4ed8', '#f472b6', '#fff7ae'], i: false },
    rib: '#0a0200',
    text: { team: 'JAKARTA', name: 'JAKARTA', number: '10', font: 0, size: 62, color: '#ffffff' },
  },
  {
    id: 'bali', label: 'Basic · Halftone', mode: 'basic',
    basic: { style: 'halftone', colors: ['#3ccdc0', '#b9ece6', '#ffffff'], seed: 11, scale: .55 },
    rib: '#ffffff',
    text: { team: 'BALI', name: 'BALI', number: '10', font: 24, size: 64, color: '#ffffff', italic: true },
  },
];

let fontsLink;
/** Pastikan font desain termuat sebelum menggambar teks (batas tunggu 2 dtk). */
export async function loadDesignFont(d) {
  const f = FONTS[d.text.font]; if (!f) return;
  if (!fontsLink && !document.querySelector('link[data-jpl-fonts]')) {
    const fam = f => f[1].replace(/ /g, '+') + (f[3] ? ':ital,wght@1,' + f[2] : f[2] !== 400 ? ':wght@' + f[2] : '');
    fontsLink = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?' + DESIGNS.map(x => 'family=' + fam(FONTS[x.text.font])).join('&') + '&display=swap' });
    fontsLink.dataset.jplFonts = '1'; document.head.append(fontsLink);
  }
  try { await Promise.race([document.fonts.load(`${d.text.italic ? 'italic ' : ''}${f[2]} 60px "${f[1]}"`, d.text.team), new Promise(r => setTimeout(r, 2000))]); } catch { /* font cadangan */ }
}
