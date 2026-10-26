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
