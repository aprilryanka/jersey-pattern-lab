import '../styles/base.css';
import '../styles/landing.css';
import { sb, getMe, isPro } from '../lib/supabase.js';
import { mountNav, LOGO_SVG } from '../lib/nav.js';
import { $, E, rp, waLink } from '../lib/ui.js';

const FAQ_FALLBACK = [
  ['Apa bedanya Basic dan Advanced?', 'Basic berisi 8 motif cepat. Advanced memakai generator pattern Jersey Pattern Lab lengkap: 9 gaya noise, palet, finishing, efek glass, brush, dan foto sebagai sumber pattern. Advanced penuh khusus member Pro.'],
  ['Berapa harga langganan Pro?', 'Rp150.000 per bulan (30 hari).'],
  ['Bagaimana cara berlangganan?', 'Buat akun, buka halaman Langganan, transfer ke rekening BCA yang tertera, lalu upload bukti transfer. Admin memverifikasi dan akun Pro aktif 30 hari.'],
  ['Berapa lama pengerjaan jersey fisik?', 'Estimasi 14 hari kerja untuk pesanan di bawah 100 pcs. Untuk 100 pcs ke atas, estimasi dikonfirmasi lewat WhatsApp.'],
];
const PLAN_FALLBACK = [
  { id: 'free', name: 'Gratis', price_monthly: 0, features: ['Mode Basic: 8 motif', 'Pratinjau 3D dan pola jahit 2D', 'Export pattern 1024 px dengan watermark', 'Simpan 3 project'] },
  { id: 'pro', name: 'Pro', price_monthly: 150000, features: ['Mode Advanced penuh', 'Export pattern hingga 3000 px', 'Export pola jahit skala 1:1 (SVG/PNG)', 'Snapshot 3D resolusi tinggi', 'Tanpa watermark', 'Project tanpa batas'] },
];
const withTimeout = (p, ms = 6000) => Promise.race([p, new Promise(r => setTimeout(() => r({ data: null, error: 'timeout' }), ms))]);

$('#flogo').innerHTML = LOGO_SVG;
$('#yr').textContent = new Date().getFullYear();
$('#waCetak').href = waLink('Halo Jerseypreneur, saya mau cetak jersey fullprint dari desain Jersey Pattern Lab. Boleh info harga dan bahan?');

async function plans(me) {
  const { data } = await withTimeout(sb.from('plans').select('*').in('id', ['free', 'pro']).order('sort'));
  const list = data && data.length ? data.map(p => p.id === 'free' ? { ...p, name: 'Gratis', features: PLAN_FALLBACK[0].features } : p) : PLAN_FALLBACK;
  const box = $('#plans'); box.innerHTML = '';
  const pro = isPro(me);
  for (const p of list) {
    const isP = p.id !== 'free';
    const cta = isP
      ? E('a', { className: 'btn primary lg', href: me ? '/billing' : '/login?mode=signup&next=/billing', text: pro ? 'Kelola langganan' : 'Berlangganan Pro' })
      : E('a', { className: 'btn lg', href: '/studio', text: 'Mulai gratis' });
    box.append(E('article', { className: 'plan' + (isP ? ' pro' : '') },
      E('h3', { text: p.name }),
      E('div', { className: 'price' }, p.price_monthly ? rp(p.price_monthly) : 'Rp0', E('small', { text: p.price_monthly ? ' / bulan' : ' selamanya' })),
      E('ul', {}, (Array.isArray(p.features) ? p.features : []).map(f => E('li', { text: f }))),
      cta));
  }
}

async function faqs() {
  const { data } = await withTimeout(sb.from('faqs').select('question,answer').order('sort'));
  const list = data && data.length ? data.map(f => [f.question, f.answer]) : FAQ_FALLBACK;
  const box = $('#faqList'); box.innerHTML = '';
  list.forEach(([q, a]) => {
    const d = E('details', {}, E('summary', { text: q }), E('div', { className: 'ans', text: a }));
    d.addEventListener('toggle', () => { if (d.open) box.querySelectorAll('details[open]').forEach(o => o !== d && (o.open = false)); });
    box.append(d);
  });
}

async function testimonials() {
  const { data } = await withTimeout(sb.from('testimonials').select('name,role,quote,photo_url').eq('active', true).order('sort').limit(3));
  if (!data || !data.length) return; // tanpa testimoni asli, section tetap tersembunyi
  const box = $('#tgrid'); box.innerHTML = '';
  data.forEach(t => box.append(E('figure', { className: 'tcard' },
    E('blockquote', { text: t.quote }),
    E('figcaption', {},
      t.photo_url ? E('img', { src: t.photo_url, alt: 'Foto ' + t.name, loading: 'lazy', width: 46, height: 46 }) : E('span', { className: 'av', text: (t.name || '?').trim()[0].toUpperCase(), 'aria-hidden': 'true' }),
      E('div', {}, E('b', { text: t.name }), t.role ? E('small', { text: t.role }) : null)))));
  $('#testimoni').hidden = false;
}

(async () => {
  const me = await mountNav('home');
  await Promise.all([plans(me), faqs(), testimonials()]);
})();
