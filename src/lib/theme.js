// Pilihan tema terang / gelap, bergaya Arc "Theme switcher" (reveal dari tombol).
// Tanpa pilihan tersimpan, tema mengikuti sistem (prefers-color-scheme).
// Atribut data-theme dipasang lebih awal oleh skrip kecil di <head> setiap halaman agar tidak berkedip.
import { E } from './ui.js';

const KEY = 'jpl-theme';
const mq = matchMedia('(prefers-color-scheme: dark)');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

export function storedTheme() { try { return localStorage.getItem(KEY); } catch { return null; } }
export function currentTheme() {
  const t = document.documentElement.dataset.theme;
  return t === 'dark' || t === 'light' ? t : (mq.matches ? 'dark' : 'light');
}

function apply(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(KEY, t); } catch { /* mode privat */ }
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t } }));
}

/** Ganti tema dengan transisi reveal melingkar dari titik tombol. */
export function setTheme(next, trigger) {
  if (!document.startViewTransition || reduce.matches || !trigger) { apply(next); return; }
  const r = trigger.getBoundingClientRect(), root = document.documentElement;
  root.style.setProperty('--tx', `${r.left + r.width / 2}px`);
  root.style.setProperty('--ty', `${r.top + r.height / 2}px`);
  root.classList.add('theme-anim');
  const vt = document.startViewTransition(() => apply(next));
  vt.finished.finally(() => root.classList.remove('theme-anim'));
}

const SUN = '<svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
const MOON = '<svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>';

/** Tombol ikon 38px: matahari saat terang, bulan saat gelap. aria-pressed = gelap. */
export function themeButton() {
  const b = E('button', { type: 'button', className: 'theme-switch', html: SUN + MOON });
  const sync = () => {
    const t = currentTheme();
    b.dataset.mode = t;
    b.setAttribute('aria-pressed', String(t === 'dark'));
    b.setAttribute('aria-label', t === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap');
    b.title = t === 'dark' ? 'Mode terang' : 'Mode gelap';
  };
  b.onclick = () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark', b);
  document.addEventListener('themechange', sync);
  mq.addEventListener('change', () => { if (!storedTheme()) { sync(); document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: currentTheme() } })); } });
  sync();
  return b;
}
