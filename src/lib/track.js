// Statistik pengunjung ringan (tanpa cookie pihak ketiga): satu baris per halaman yang dibuka.
import { sb } from './supabase.js';

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp/i;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];

function visitorId() {
  let v = null;
  try { v = localStorage.getItem('jpl-v'); if (!v) { v = crypto.randomUUID().replace(/-/g, '').slice(0, 20); localStorage.setItem('jpl-v', v); } }
  catch { v = 'nostore' + Math.random().toString(36).slice(2, 12); }
  return v;
}

function externalReferrer() {
  try { const r = document.referrer && new URL(document.referrer); if (r && r.host !== location.host) return r.host.replace(/^www\./, '').slice(0, 120); } catch { /* abaikan */ }
  return null;
}

// Atribusi disimpan di perangkat: UTM/fbclid terbaru menimpa yang lama, referrer eksternal pertama dipertahankan.
// Jadi pendaftaran yang terjadi beberapa halaman kemudian tetap tahu asalnya.
function attribution() {
  let a = {};
  try { a = JSON.parse(localStorage.getItem('jpl-attr') || '{}') || {}; } catch { a = {}; }
  try {
    const p = new URLSearchParams(location.search);
    let touched = false;
    UTM_KEYS.forEach(k => { const x = p.get(k); if (x) { a[k] = x.slice(0, 100); touched = true; } });
    if (p.get('fbclid')) { a.fbclid_present = true; touched = true; }
    const ref = externalReferrer();
    if (ref && !a.ref) { a.ref = ref; touched = true; }
    if (touched) localStorage.setItem('jpl-attr', JSON.stringify(a));
  } catch { /* abaikan */ }
  return a;
}

// Dipakai saat daftar akun: dikirim sebagai metadata, lalu disalin trigger ke tabel profiles.
export function signupAttribution() {
  const a = attribution();
  const out = { signup_visitor: visitorId() };
  if (a.ref) out.signup_referrer = a.ref;
  UTM_KEYS.forEach(k => { if (a[k]) out[k] = a[k]; });
  if (a.fbclid_present) out.fbclid_present = 'true';
  return out;
}

export function trackView() {
  try {
    if (BOT.test(navigator.userAgent) || navigator.webdriver) return;
    const path = (location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/') || '/').slice(0, 200);
    if (path.startsWith('/admin')) return; // jangan hitung kunjungan admin ke dashboard
    const v = visitorId();
    const referrer = externalReferrer();
    const a = attribution();
    const w = Math.min(screen.width, innerWidth), device = w < 768 ? 'mobile' : w < 1100 ? 'tablet' : 'desktop';
    sb.from('page_views').insert({
      path, visitor: v, referrer, device,
      utm_source: a.utm_source || null, utm_medium: a.utm_medium || null,
      utm_campaign: a.utm_campaign || null, utm_content: a.utm_content || null,
      fbclid_present: !!a.fbclid_present,
    }).then(() => {}, () => {});
  } catch { /* statistik tidak boleh mengganggu halaman */ }
}
