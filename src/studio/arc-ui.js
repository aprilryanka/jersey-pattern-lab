// Perilaku kecil bergaya Arc (uiarc.dev) untuk Studio vanilla JS:
// highlight geser pada segmented control dan tabs ("morph"), serta isi track pada slider.
export function initArc() {
  const SEL = ':scope > button[aria-pressed="true"], :scope > button[aria-selected="true"], :scope > button.on';
  const place = c => {
    const a = c.querySelector(SEL), hl = c._hl;
    if (!a || !c.offsetWidth) { hl.style.opacity = 0; return; }
    hl.style.opacity = 1; hl.style.width = a.offsetWidth + 'px'; hl.style.height = a.offsetHeight + 'px';
    hl.style.transform = `translate(${a.offsetLeft}px, ${a.offsetTop}px)`;
  };
  const attach = c => {
    if (c._hl) return;
    const hl = document.createElement('i'); hl.className = 'hl'; hl.setAttribute('aria-hidden', 'true');
    c.prepend(hl); c._hl = hl; c.dataset.hl = '';
    new MutationObserver(() => place(c)).observe(c, { attributes: true, subtree: true, attributeFilter: ['aria-pressed', 'aria-selected', 'class'] });
    new ResizeObserver(() => place(c)).observe(c);
    place(c); requestAnimationFrame(() => requestAnimationFrame(() => hl.classList.add('ready')));
  };
  const scan = root => root.querySelectorAll && root.querySelectorAll('.seg, .tabs').forEach(attach);
  scan(document);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => n.nodeType === 1 && (n.matches?.('.seg, .tabs') ? attach(n) : scan(n))))).observe(document.body, { childList: true, subtree: true });

  const fill = r => { const mn = +r.min || 0, mx = +r.max || 100; r.style.setProperty('--p', ((+r.value - mn) / (mx - mn || 1) * 100) + '%'); };
  document.addEventListener('input', e => { if (e.target.type === 'range') { fill(e.target); e.target._v = e.target.value; } }, true);
  setInterval(() => document.querySelectorAll('input[type=range]').forEach(r => { if (r._v !== r.value) { r._v = r.value; fill(r); } }), 200);
}
