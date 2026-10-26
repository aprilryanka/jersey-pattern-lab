// Guide tour ringan: sorot elemen [data-tour] satu per satu dengan kartu penjelasan.
import { E } from '../lib/ui.js';

export const STUDIO_TOUR = [
  ['mode', 'Basic atau Advanced', 'Basic berisi 8 motif cepat. Advanced memakai generator Jersey Pattern Lab lengkap: gaya noise, palet, finishing, efek glass, dan foto sebagai sumber pattern.'],
  ['motif', 'Pilih dan acak motif', 'Klik motif untuk memakainya. Tombol Acak semua mengganti motif, warna, dan bentuk sekaligus.'],
  ['tab-edit', 'Edit pattern', 'Atur skala, rotasi, posisi, dan cermin pattern di seluruh jersey. Kamu juga bisa membuat panel tertentu (misalnya lengan atau rib) berwarna polos.'],
  ['tab-elements', 'Teks, logo, sponsor', 'Tambah nama, nomor, logo tim, dan sponsor. Upload PNG transparan untuk hasil terbaik.'],
  ['pane2d', 'Pola jahit 2D', 'Ini panel pola jahit asli dari file DXF. Seret teks atau logo untuk memindahkan, tarik kotak kecil di sudutnya untuk mengubah ukuran. Scroll atau pinch untuk zoom.'],
  ['pane3d', 'Pratinjau 3D', 'Semua perubahan langsung tampil di model 3D. Seret untuk memutar, scroll untuk zoom, atau pilih sudut kamera.'],
  ['tab-view', 'Latar dan kain', 'Ganti latar studio, polos, atau transparan, dan atur tekstur rajutan kain.'],
  ['export', 'Export', 'Unduh pattern, pola jahit skala 1:1 (SVG/PNG), atau snapshot 3D. Pola jahit dan resolusi tinggi khusus member Pro.'],
  ['save', 'Simpan project', 'Simpan desain ke akunmu supaya bisa dibuka lagi kapan saja.'],
];

export function startTour(steps = STUDIO_TOUR, { onTab } = {}) {
  let i = 0;
  const hole = E('div', { className: 'tour-hole' });
  const title = E('h4'), text = E('p'), count = E('span', { className: 'tour-count' });
  const prev = E('button', { className: 'btn sm', text: 'Kembali' });
  const next = E('button', { className: 'btn sm primary', text: 'Lanjut' });
  const skip = E('button', { className: 'btn sm ghost', text: 'Lewati' });
  const card = E('div', { className: 'tour-card', role: 'dialog', 'aria-live': 'polite' }, count, title, text, E('div', { className: 'tour-actions' }, skip, E('span', { style: { flex: 1 } }), prev, next));
  const wrap = E('div', { className: 'tour' }, hole, card);
  document.body.append(wrap);
  const end = () => { wrap.remove(); removeEventListener('resize', place); document.removeEventListener('keydown', key); try { localStorage.setItem('jpl_tour_done', '1'); } catch (e) { } };
  const key = e => { if (e.key === 'Escape') end(); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); };
  document.addEventListener('keydown', key);
  function place() {
    const [id, t, d] = steps[i];
    if (id.startsWith('tab-') && onTab) onTab(id.slice(4));
    const el = document.querySelector(`[data-tour="${id}"]`);
    title.textContent = t; text.textContent = d; count.textContent = `${i + 1} / ${steps.length}`;
    prev.disabled = i === 0; next.textContent = i === steps.length - 1 ? 'Selesai' : 'Lanjut';
    if (!el) { hole.style.cssText = 'left:50%;top:40%;width:0;height:0'; card.style.cssText = 'left:50%;top:45%;transform:translate(-50%,0)'; return; }
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const r = el.getBoundingClientRect(), pad = 6;
    hole.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
    const cw = Math.min(320, innerWidth - 24), below = r.bottom + 14 + 190 < innerHeight;
    let left = Math.min(Math.max(12, r.left + r.width / 2 - cw / 2), innerWidth - cw - 12);
    let top = below ? r.bottom + 14 : Math.max(12, r.top - 14 - card.offsetHeight);
    if (r.height > innerHeight * .6) { top = Math.min(innerHeight - card.offsetHeight - 12, r.top + 20); }
    card.style.cssText = `left:${left}px;top:${top}px;width:${cw}px`;
  }
  function go(d) { i += d; if (i >= steps.length) return end(); if (i < 0) i = 0; requestAnimationFrame(() => requestAnimationFrame(place)); }
  next.onclick = () => go(1); prev.onclick = () => go(-1); skip.onclick = end;
  addEventListener('resize', place);
  requestAnimationFrame(place);
}

export function tourSeen() { try { return localStorage.getItem('jpl_tour_done') === '1'; } catch (e) { return true; } }
