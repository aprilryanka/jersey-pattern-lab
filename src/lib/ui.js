export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/** Buat elemen: E('div', {className:'x', text:'hi', on:{click}}, ...anak) */
export function E(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'on') for (const ev in v) el.addEventListener(ev, v[ev]);
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k in el && k !== 'list') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(c => c != null && c !== false && el.append(c));
  return el;
}

export const rp = n => 'Rp' + (Math.round(+n) || 0).toLocaleString('id-ID');
export const WA_DEFAULT = '6289634547665';
export const waLink = (text, num = WA_DEFAULT) => `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
export const fmtDate = d => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

let tt = 0;
export function toast(msg, ms = 2200) {
  let t = document.getElementById('toast');
  if (!t) { t = E('div', { id: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), ms);
}

/** Modal sederhana. Mengembalikan {el, close}. */
export function modal(title, body, { wide = false, onClose } = {}) {
  const close = () => { wrap.remove(); document.removeEventListener('keydown', esc); onClose && onClose(); };
  const esc = e => { if (e.key === 'Escape') close(); };
  const card = E('div', { className: 'card' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    E('div', { className: 'head' }, E('h3', { text: title }), E('button', { className: 'btn sm', text: 'Tutup', on: { click: () => close() } })),
    body);
  const wrap = E('div', { className: 'modal', on: { mousedown: e => { if (e.target === wrap) close(); } } }, card);
  document.body.append(wrap);
  document.addEventListener('keydown', esc);
  return { el: card, close };
}

/** Unduh blob sebagai file. */
export function download(blob, name) {
  const u = URL.createObjectURL(blob);
  const a = E('a', { href: u, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 8000);
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Progress modal untuk proses berat (export). */
export async function withProgress(title, fn) {
  const bar = E('i');
  const note = E('p', { className: 'hint', text: 'Menyiapkan…', style: { margin: 0, color: 'var(--muted)', fontSize: '13px' } });
  const m = modal(title, E('div', { style: { display: 'grid', gap: '10px' } }, E('div', { className: 'progress' }, bar), note));
  m.el.querySelector('.head button').hidden = true;
  const set = (p, msg) => { bar.style.width = Math.round(p * 100) + '%'; if (msg) note.textContent = msg; };
  try { await sleep(60); return await fn(set); }
  finally { set(1, 'Selesai'); await sleep(250); m.close(); }
}

export function shrinkImage(file, maxW = 1600, type = 'image/png', q = .9) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxW / Math.max(img.width, img.height));
      const c = E('canvas', { width: Math.round(img.width * k), height: Math.round(img.height * k) });
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      res({ dataUrl: c.toDataURL(type, q), canvas: c, w: c.width, h: c.height });
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

const EYE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17.7 17.7 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

/** Tambahkan tombol mata (tampilkan/sembunyikan) ke input password. */
export function eyeToggle(input) {
  if (input.parentElement?.classList.contains('pw')) return input;
  const wrap = E('span', { className: 'pw' });
  const btn = E('button', { type: 'button', className: 'pw-eye', html: EYE, 'aria-label': 'Tampilkan password', 'aria-pressed': 'false' });
  btn.onclick = () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = show ? EYE_OFF : EYE;
    btn.setAttribute('aria-pressed', String(show));
    btn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
    input.focus({ preventScroll: true });
  };
  input.replaceWith(wrap); wrap.append(input, btn);
  return input;
}
