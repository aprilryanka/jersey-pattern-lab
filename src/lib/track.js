// Statistik pengunjung ringan (tanpa cookie pihak ketiga): satu baris per halaman yang dibuka.
import { sb } from './supabase.js';

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp/i;

export function trackView() {
  try {
    if (BOT.test(navigator.userAgent) || navigator.webdriver) return;
    const path = (location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/').slice(0, 200);
    if (path.startsWith('/admin')) return; // jangan hitung kunjungan admin ke dashboard
    let v = null;
    try { v = localStorage.getItem('jpl-v'); if (!v) { v = crypto.randomUUID().replace(/-/g, '').slice(0, 20); localStorage.setItem('jpl-v', v); } }
    catch { v = 'nostore' + Math.random().toString(36).slice(2, 12); }
    let referrer = null;
    try { const r = document.referrer && new URL(document.referrer); if (r && r.host !== location.host) referrer = r.host.replace(/^www\./, '').slice(0, 120); } catch { /* abaikan */ }
    const w = Math.min(screen.width, innerWidth), device = w < 768 ? 'mobile' : w < 1100 ? 'tablet' : 'desktop';
    sb.from('page_views').insert({ path, visitor: v, referrer, device }).then(() => {}, () => {});
  } catch { /* statistik tidak boleh mengganggu halaman */ }
}
