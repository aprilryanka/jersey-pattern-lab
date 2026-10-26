import { getMe, planOf, isAdmin, signOut } from './supabase.js';
import { E } from './ui.js';

export const LOGO_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="var(--accent)"/><path d="M20 14l-10 7 5 9 5-3v23h24V27l5 3 5-9-10-7h-6a6 6 0 0 1-12 0z" fill="var(--accent-ink)"/><path d="M26 30l6 8 6-8" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/></svg>';

/**
 * Navbar pill mengambang di tengah atas.
 * @param {string} current  id halaman aktif: home | studio | billing | admin
 */
export async function mountNav(current, { tag } = {}) {
  const me = await getMe().catch(() => null);
  const plan = planOf(me);
  const links = [
    ['home', '/', 'Beranda'],
    ['studio', '/studio', 'Studio'],
    ['pricing', '/#harga', 'Harga'],
    ['faq', '/#faq', 'FAQ'],
  ];
  if (me) links.push(['billing', '/billing', 'Langganan']);
  if (isAdmin(me)) links.push(['admin', '/admin', 'Admin']);

  const nav = E('nav', { 'aria-label': 'Navigasi utama' },
    links.map(([id, href, label]) => E('a', { href, text: label, 'aria-current': id === current ? 'page' : null })));

  const act = E('div', { className: 'act' });
  if (me) {
    act.append(
      E('span', { className: 'chip', text: plan === 'pro' ? (isAdmin(me) ? 'ADMIN' : 'PRO') : 'GRATIS' }),
      E('span', { className: 'who', text: me.user.email, title: me.user.email }),
      E('button', { className: 'btn sm ghost', text: 'Keluar', on: { click: signOut } }),
    );
    if (current !== 'studio') act.append(E('a', { className: 'btn sm primary', href: '/studio', text: 'Buka Studio' }));
  } else {
    act.append(
      E('a', { className: 'btn sm ghost', href: '/login?next=' + encodeURIComponent(location.pathname), text: 'Masuk' }),
      E('a', { className: 'btn sm primary', href: '/studio', text: 'Mulai desain' }),
    );
  }
  const menu = E('button', { className: 'btn sm ghost menu-btn', text: 'Menu', 'aria-expanded': 'false' });
  const pill = E('div', { className: 'pill' },
    E('a', { className: 'logo', href: '/', html: LOGO_SVG + '<b>Jersey Pattern Lab</b>' + (tag ? `<span class="tag">${tag}</span>` : '') }),
    nav, act, menu);
  menu.onclick = () => { const o = pill.classList.toggle('open'); menu.setAttribute('aria-expanded', String(o)); };
  const wrap = E('div', { className: 'navwrap' }, pill);
  document.body.prepend(wrap);
  if (import.meta.env.VITE_PREVIEW) {
    document.body.append(E('div', { className: 'preview-note', role: 'note', text: 'Mode pratinjau: tampilan saja. Login, langganan, dan data database aktif setelah deploy.' }));
  }
  return me;
}
