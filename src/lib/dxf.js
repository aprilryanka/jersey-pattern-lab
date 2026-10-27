// Parser DXF minimal untuk pola CLO3D/Marvelous: ambil garis potong (polyline tertutup)
// per BLOCK. Layer "1" = garis potong pada ekspor DXF-AAMA/ASTM dari CLO3D.

export function parseDXF(text) {
  const lines = text.split(/\r?\n/);
  const pairs = [];
  for (let i = 0; i + 1 < lines.length; i += 2) pairs.push([lines[i].trim(), lines[i + 1].trim()]);
  const blocks = []; // {name, polys:[{layer, closed, pts}]}
  let cur = null, poly = null, inBlocks = false, inEntities = false, vert = null, ent = null, lw = null;
  const top = { name: '__entities__', polys: [], texts: [] };
  const target = () => (cur || (inEntities ? top : null));
  const flushVert = () => { if (vert && poly && vert.x != null) poly.pts.push([vert.x, vert.y]); vert = null; };
  const flushLw = () => { if (lw && lw.pts.length && target()) target().polys.push(lw); lw = null; };
  for (let k = 0; k < pairs.length; k++) {
    const [c, v] = pairs[k];
    if (c === '0') {
      flushVert(); flushLw();
      if (v === 'SECTION') { const nm = pairs[k + 1]; inBlocks = nm && nm[1] === 'BLOCKS'; inEntities = nm && nm[1] === 'ENTITIES'; }
      else if (v === 'ENDSEC') { inBlocks = false; inEntities = false; }
      else if (v === 'BLOCK' && inBlocks) { cur = { name: '', polys: [], texts: [] }; ent = 'BLOCK'; }
      else if (v === 'ENDBLK') { if (cur) blocks.push(cur); cur = null; ent = null; }
      else if (v === 'POLYLINE') { poly = { layer: '', closed: false, pts: [] }; ent = 'POLYLINE'; }
      else if (v === 'VERTEX' && poly) { vert = { x: null, y: null }; ent = 'VERTEX'; }
      else if (v === 'SEQEND') { if (poly && target()) target().polys.push(poly); poly = null; ent = null; }
      else if (v === 'LWPOLYLINE') { lw = { layer: '', closed: false, pts: [], _x: null }; ent = 'LW'; }
      else if (v === 'TEXT') { ent = 'TEXT'; }
      else ent = v;
      continue;
    }
    if (ent === 'BLOCK' && c === '2' && cur && !cur.name) cur.name = v;
    else if (ent === 'POLYLINE' && poly) { if (c === '8') poly.layer = v; if (c === '70') poly.closed = (parseInt(v, 10) & 1) === 1; }
    else if (ent === 'VERTEX' && vert) { if (c === '10') vert.x = parseFloat(v); if (c === '20') vert.y = parseFloat(v); }
    else if (ent === 'LW' && lw) {
      if (c === '8') lw.layer = v; if (c === '70') lw.closed = (parseInt(v, 10) & 1) === 1;
      if (c === '10') lw._x = parseFloat(v); if (c === '20' && lw._x != null) { lw.pts.push([lw._x, parseFloat(v)]); lw._x = null; }
    }
    else if (ent === 'TEXT' && c === '1' && target()) target().texts.push(v);
  }
  flushVert(); flushLw();
  if (top.polys.length) blocks.push(top);
  return blocks;
}

const area = pts => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a / 2); };
const bbox = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }; };

/** Ambil panel (garis potong) dari DXF. Memilih polyline tertutup layer "1", atau yang terbesar per block. */
export function panelsFromDXF(text) {
  const blocks = parseDXF(text);
  const out = [];
  for (const b of blocks) {
    let cands = b.polys.filter(p => p.layer === '1' && p.pts.length >= 3);
    if (!cands.length) cands = b.polys.filter(p => p.closed && p.pts.length >= 3);
    if (!cands.length) continue;
    const list = b.name === '__entities__' ? cands : [cands.reduce((a, c) => (area(c.pts) > area(a.pts) ? c : a))];
    for (const c of list) {
      const pts = c.pts.filter((p, i, a) => i === 0 || Math.abs(p[0] - a[i - 1][0]) + Math.abs(p[1] - a[i - 1][1]) > 1e-3).map(p => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]);
      const nameTxt = (b.texts || []).find(t => /^PIECE NAME:/i.test(t));
      out.push({ block: b.name, piece: nameTxt ? nameTxt.replace(/^PIECE NAME:\s*/i, '') : b.name, pts, bb: bbox(pts), area: area(pts) });
    }
  }
  return out;
}

/**
 * Cocokkan panel DXF dengan mesh GLB (berdasarkan bbox UV) dan tebak perannya
 * dari posisi 3D mesh: depan (z+), belakang (z−), lengan (|x| besar), rib (sangat tipis).
 * meshInfo: [{uvBB:{minX,maxX,minY,maxY}, center:{x,y,z}}] dalam koordinat DXF (x=u, y=−v).
 */
export function matchPanels(panels, meshInfo) {
  const res = panels.map(p => {
    let best = null;
    meshInfo.forEach((m, i) => {
      const d = Math.abs(m.uvBB.minX - p.bb.minX) + Math.abs(m.uvBB.maxX - p.bb.maxX) + Math.abs(m.uvBB.minY - p.bb.minY) + Math.abs(m.uvBB.maxY - p.bb.maxY);
      if (!best || d < best.d) best = { d, i };
    });
    return { ...p, mesh: best ? best.i : -1, err: best ? best.d : Infinity };
  });
  const body = res.filter(p => Math.min(p.bb.maxX - p.bb.minX, p.bb.maxY - p.bb.minY) > 40);
  const byArea = [...body].sort((a, b) => b.area - a.area);
  const torso = byArea.slice(0, 2);
  for (const p of res) {
    const w = p.bb.maxX - p.bb.minX, h = p.bb.maxY - p.bb.minY, c = p.mesh >= 0 ? meshInfo[p.mesh].center : { x: 0, z: 0 };
    if (Math.min(w, h) <= 60 && Math.max(w, h) / Math.max(1, Math.min(w, h)) >= 4) { p.role = 'rib'; p.label = 'Rib ' + (c.z >= 0 ? 'depan' : 'belakang') + (Math.abs(c.x) > .02 ? (c.x > 0 ? ' kiri' : ' kanan') : ''); }
    else if (torso.includes(p)) { p.role = c.z >= 0 ? 'front' : 'back'; p.label = p.role === 'front' ? 'Depan' : 'Belakang'; }
    else if (Math.abs(c.x) > .12) { p.role = 'sleeve'; p.label = 'Lengan ' + (c.x > 0 ? 'kiri' : 'kanan'); }
    else { p.role = 'other'; p.label = p.piece; }
  }
  // pastikan satu depan & satu belakang
  if (torso.length === 2 && torso[0].role === torso[1].role) { torso[1].role = torso[0].role === 'front' ? 'back' : 'front'; torso[1].label = torso[1].role === 'front' ? 'Depan' : 'Belakang'; }
  const used = {};
  for (const p of res) { const base = { front: 'front', back: 'back', sleeve: 'sleeve', rib: 'rib', other: 'panel' }[p.role]; used[base] = (used[base] || 0) + 1; p.id = base + used[base]; }
  return res;
}
