// Editor pola jahit 2D: tampilkan atlas yang dipotong per panel, label ukuran,
// seret/ubah ukuran layer, pan, zoom halus (wheel, trackpad, pinch).
import { panelPath } from './atlas.js';

const fmt = (n, d = 1) => n.toFixed(d).replace('.', ',');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export class Editor2D {
  constructor(canvas, { getLayout, getAtlas, getState, onLayerChange, onSelect, onPanelClick, getUnits }) {
    Object.assign(this, { canvas, getLayout, getAtlas, getState, onLayerChange, onSelect, onPanelClick, getUnits });
    this.V = { k: .3, ox: 0, oy: 0 }; this.goal = null; this.dirty = true; this.sel = null;
    this.pointers = new Map(); this.drag = null;
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(canvas.parentElement);
    canvas.addEventListener('pointerdown', e => this.down(e));
    canvas.addEventListener('pointermove', e => this.move(e));
    const up = e => this.up(e);
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      // trackpad pinch (ctrlKey) lebih sensitif; scroll biasa lebih halus
      const f = Math.exp(-e.deltaY * (e.ctrlKey ? .012 : .0018));
      this.zoomTo((this.goal?.k ?? this.V.k) * f, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    this.mq = matchMedia('(prefers-color-scheme: dark)'); this.mq.addEventListener('change', () => this.invalidate());
    this._tick = this._tick.bind(this); requestAnimationFrame(this._tick);
  }
  invalidate() { this.dirty = true; }
  resize() {
    const r = this.canvas.getBoundingClientRect(), d = devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(r.width * d)); this.canvas.height = Math.max(1, Math.round(r.height * d));
    if (!this.fitted) this.fit(true);
    this.invalidate();
  }
  get W() { return this.canvas.width / (devicePixelRatio || 1); }
  get H() { return this.canvas.height / (devicePixelRatio || 1); }
  fit(instant) {
    const L = this.getLayout(); if (!L || !this.W) return;
    const k = Math.max(.05, Math.min((this.W - 40) / L.Wmm, (this.H - 90) / L.Hmm));
    const t = { k, ox: (this.W - L.Wmm * k) / 2, oy: (this.H - L.Hmm * k) / 2 - 6 };
    if (instant) { this.V = t; this.goal = null; } else this.goal = t;
    this.fitted = true; this.invalidate();
  }
  zoomTo(k, sx, sy) {
    const L = this.getLayout(); if (!L) return;
    const base = this.goal || this.V;
    k = clamp(k, .05, 3);
    const wx = (sx - base.ox) / base.k, wy = (sy - base.oy) / base.k;
    this.goal = { k, ox: sx - wx * k, oy: sy - wy * k };
  }
  zoomBy(f) { this.zoomTo((this.goal?.k ?? this.V.k) * f, this.W / 2, this.H / 2); }
  get zoomPct() { return Math.round((this.goal?.k ?? this.V.k) / .3 * 100); }

  // atlas mm → layar
  X(x) { return this.V.ox + (x - this.getLayout().uMin) * this.V.k; }
  Y(y) { return this.V.oy + (this.getLayout().vTop - y) * this.V.k; }
  wx(sx) { return (sx - this.V.ox) / this.V.k + this.getLayout().uMin; }
  wy(sy) { return this.getLayout().vTop - (sy - this.V.oy) / this.V.k; }

  _tick() {
    requestAnimationFrame(this._tick);
    if (this.goal) {
      const g = this.goal, V = this.V, a = .22;
      V.k += (g.k - V.k) * a; V.ox += (g.ox - V.ox) * a; V.oy += (g.oy - V.oy) * a;
      if (Math.abs(g.k - V.k) < 1e-4 && Math.abs(g.ox - V.ox) < .2 && Math.abs(g.oy - V.oy) < .2) { Object.assign(V, g); this.goal = null; }
      this.dirty = true; this.onZoom && this.onZoom(this.zoomPct);
    }
    if (this.dirty) { this.dirty = false; this.draw(); }
  }

  cssv(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }

  draw() {
    const L = this.getLayout(), ctx = this.canvas.getContext('2d'), d = devicePixelRatio || 1, W = this.W, H = this.H;
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.fillStyle = this.cssv('--stage'); ctx.fillRect(0, 0, W, H);
    if (!L) return;
    const atlas = this.getAtlas(), S = this.getState();
    // grid 10 cm
    ctx.strokeStyle = this.cssv('--grid'); ctx.lineWidth = 1; ctx.beginPath();
    for (let x = Math.ceil(this.wx(0) / 100) * 100; x < this.wx(W); x += 100) { ctx.moveTo(this.X(x), 0); ctx.lineTo(this.X(x), H); }
    for (let y = Math.ceil(this.wy(H) / 100) * 100; y < this.wy(0); y += 100) { ctx.moveTo(0, this.Y(y)); ctx.lineTo(W, this.Y(y)); }
    ctx.stroke();
    const ink = this.cssv('--outline'), lab = this.cssv('--label'), acc = this.cssv('--accent'), mono = this.cssv('--f-mono'), disp = this.cssv('--f-display');
    const inch = this.getUnits && this.getUnits() === 'in';
    ctx.imageSmoothingQuality = 'high';
    for (const p of L.panels) {
      panelPath(ctx, p, x => this.X(x), y => this.Y(y));
      if (atlas) { ctx.save(); ctx.clip(); ctx.drawImage(atlas, this.X(L.uMin), this.Y(L.vTop), L.Wmm * this.V.k, L.Hmm * this.V.k); ctx.restore(); }
      const selP = this.selPanel === p.id;
      ctx.strokeStyle = selP ? acc : ink; ctx.lineWidth = selP ? 2.4 : 1.3; ctx.stroke();
      if (!p.rib) {
        ctx.setLineDash([5, 4]); ctx.globalAlpha = .35; ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.beginPath();
        const cx = this.X((p.bb.minX + p.bb.maxX) / 2); ctx.moveTo(cx, this.Y(p.bb.maxY) + 8); ctx.lineTo(cx, this.Y(p.bb.minY) - 8); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = lab; ctx.textAlign = 'center';
      const cx = this.X((p.bb.minX + p.bb.maxX) / 2);
      const dim = inch ? `${fmt(p.w / 25.4)} × ${fmt(p.h / 25.4)} in` : `${fmt(p.w / 10)} × ${fmt(p.h / 10)} cm`;
      if (p.rib) {
        ctx.font = `500 10px ${mono}`;
        // label rib bergantian kiri/kanan agar tidak bertumpuk
        const left = p.bb.maxX < (L.uMin + L.Wmm / 2) && L.panels.some(q => q.rib && q !== p && Math.abs(q.bb.minY - p.bb.minY) < 5 && q.bb.minX > p.bb.maxX && q.bb.minX - p.bb.maxX < 120);
        const right = L.panels.some(q => q.rib && q !== p && Math.abs(q.bb.minY - p.bb.minY) < 5 && q.bb.maxX < p.bb.minX && p.bb.minX - q.bb.maxX < 120);
        if (left) { ctx.textAlign = 'right'; ctx.fillText(p.label, this.X(p.bb.maxX), this.Y(p.bb.maxY) - 7); }
        else if (right) { ctx.textAlign = 'left'; ctx.fillText(p.label, this.X(p.bb.minX), this.Y(p.bb.maxY) - 7); }
        else ctx.fillText(p.label, cx, this.Y(p.bb.maxY) - 7);
      } else {
        ctx.font = `600 13px ${disp}`; ctx.fillText(p.label.toUpperCase(), cx, this.Y(p.bb.minY) + 19);
        ctx.font = `400 11px ${mono}`; ctx.fillText(dim, cx, this.Y(p.bb.minY) + 34);
      }
    }
    // seleksi layer
    const Ly = S.layers.find(l => l.id === this.sel);
    if (Ly && Ly._w) {
      const p = L.byId[Ly.panel];
      if (p) {
        const c = this.layerCorners(Ly, p);
        ctx.setLineDash([4, 3]); ctx.strokeStyle = acc; ctx.lineWidth = 1.5; ctx.beginPath();
        c.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
        const hd = c[2]; ctx.fillStyle = acc; ctx.fillRect(hd[0] - 5, hd[1] - 5, 10, 10);
      }
    }
    // skala 10 cm
    const bx = 14, by = H - 16, len = 100 * this.V.k;
    ctx.strokeStyle = lab; ctx.lineWidth = 2; ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx + len, by); ctx.moveTo(bx, by - 4); ctx.lineTo(bx, by + 4); ctx.moveTo(bx + len, by - 4); ctx.lineTo(bx + len, by + 4); ctx.stroke();
    ctx.fillStyle = lab; ctx.textAlign = 'left'; ctx.font = `400 10px ${mono}`; ctx.fillText(inch ? '3,9 in' : '10 cm', bx, by - 8);
  }

  /** Sudut kotak layer di layar (urut: kiri-atas, kanan-atas, kanan-bawah, kiri-bawah). */
  layerCorners(Ly, p) {
    const pad = 4, w = Ly._w / 2 + pad, h = Ly._h / 2 + pad, a = (Ly.rot || 0) * Math.PI / 180, co = Math.cos(a), si = Math.sin(a);
    return [[-w, -h], [w, -h], [w, h], [-w, h]].map(([x, y]) => {
      const lx = Ly.lx + x * co - y * si, ly = Ly.ly + x * si + y * co;
      return [this.X(p.bb.minX + lx), this.Y(p.bb.maxY - ly)];
    });
  }

  hitLayer(sx, sy) {
    const L = this.getLayout(), S = this.getState();
    for (let i = S.layers.length - 1; i >= 0; i--) {
      const Ly = S.layers[i], p = L.byId[Ly.panel]; if (!p || !Ly._w) continue;
      if (Ly.id === this.sel) { const hd = this.layerCorners(Ly, p)[2]; if (Math.hypot(sx - hd[0], sy - hd[1]) < 11) return { Ly, resize: true }; }
      const a = -(Ly.rot || 0) * Math.PI / 180, dx = this.wx(sx) - (p.bb.minX + Ly.lx), dy = (p.bb.maxY - this.wy(sy)) - Ly.ly;
      const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
      if (Math.abs(lx) <= Ly._w / 2 + 5 && Math.abs(ly) <= Ly._h / 2 + 5) return { Ly };
    }
    return null;
  }
  hitPanel(sx, sy) {
    const L = this.getLayout(), ctx = this.canvas.getContext('2d'), d = devicePixelRatio || 1;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    for (const p of L.panels) { panelPath(ctx, p, x => this.X(x), y => this.Y(y)); if (ctx.isPointInPath(sx * d, sy * d)) return p; }
    return null;
  }

  pos(e) { const r = this.canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  down(e) {
    this.canvas.setPointerCapture(e.pointerId);
    const [sx, sy] = this.pos(e); this.pointers.set(e.pointerId, [sx, sy]);
    if (this.pointers.size === 2) { // pinch
      const [a, b] = [...this.pointers.values()];
      this.drag = { t: 'pinch', d0: Math.hypot(a[0] - b[0], a[1] - b[1]), k0: this.V.k, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 };
      return;
    }
    const hit = this.hitLayer(sx, sy);
    if (hit) {
      const p = this.getLayout().byId[hit.Ly.panel];
      this.sel = hit.Ly.id; this.onSelect && this.onSelect(hit.Ly.id);
      if (hit.resize) this.drag = { t: 'resize', Ly: hit.Ly, p, d0: Math.hypot(this.wx(sx) - (p.bb.minX + hit.Ly.lx), this.wy(sy) - (p.bb.maxY - hit.Ly.ly)), v0: hit.Ly.type === 'image' ? hit.Ly.w : hit.Ly.size };
      else this.drag = { t: 'layer', Ly: hit.Ly, p, dx: this.wx(sx) - (p.bb.minX + hit.Ly.lx), dy: this.wy(sy) - (p.bb.maxY - hit.Ly.ly) };
    } else {
      this.drag = { t: 'pan', sx, sy, ox: this.V.ox, oy: this.V.oy, moved: false };
    }
    this.canvas.classList.add('drag'); this.invalidate();
  }
  move(e) {
    if (!this.pointers.has(e.pointerId)) {
      // hover cursor
      const [sx, sy] = this.pos(e), h = this.hitLayer(sx, sy);
      this.canvas.style.cursor = h ? (h.resize ? 'nwse-resize' : 'move') : 'grab'; return;
    }
    const [sx, sy] = this.pos(e); this.pointers.set(e.pointerId, [sx, sy]);
    const D = this.drag; if (!D) return;
    if (D.t === 'pinch' && this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      const k = clamp(D.k0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / D.d0, .05, 3);
      const wx = (D.cx - this.V.ox) / this.V.k, wy = (D.cy - this.V.oy) / this.V.k;
      this.V.k = k; this.V.ox = D.cx - wx * k; this.V.oy = D.cy - wy * k; this.goal = null; this.invalidate(); this.onZoom && this.onZoom(this.zoomPct);
    } else if (D.t === 'pan') {
      this.goal = null; this.V.ox = D.ox + sx - D.sx; this.V.oy = D.oy + sy - D.sy; D.moved = D.moved || Math.hypot(sx - D.sx, sy - D.sy) > 4; this.invalidate();
    } else if (D.t === 'layer') {
      const { Ly, p } = D;
      Ly.lx = clamp(this.wx(sx) - D.dx - p.bb.minX, 0, p.w); Ly.ly = clamp(p.bb.maxY - (this.wy(sy) - D.dy), 0, p.h);
      this.onLayerChange && this.onLayerChange(Ly);
    } else if (D.t === 'resize') {
      const { Ly, p } = D, d1 = Math.hypot(this.wx(sx) - (p.bb.minX + Ly.lx), this.wy(sy) - (p.bb.maxY - Ly.ly));
      const v = clamp(D.v0 * d1 / Math.max(1, D.d0), 8, 900);
      if (Ly.type === 'image') Ly.w = Math.round(v); else Ly.size = Math.round(v);
      this.onLayerChange && this.onLayerChange(Ly);
    }
  }
  up(e) {
    this.pointers.delete(e.pointerId);
    const D = this.drag;
    if (D && D.t === 'pan' && !D.moved) {
      const [sx, sy] = this.pos(e), p = this.hitPanel(sx, sy);
      this.sel = null; this.onSelect && this.onSelect(null);
      this.selPanel = p ? p.id : null; this.onPanelClick && this.onPanelClick(p);
    }
    if (this.pointers.size < 2) { this.drag = null; this.canvas.classList.remove('drag'); }
    this.invalidate();
  }
}
