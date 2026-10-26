// Pratinjau 3D: memuat GLB CLO3D, menormalkan UV (mm → 0..1), kain realistis,
// latar studio/polos/transparan, zoom halus, dan snapshot.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/** Muat GLB & ukur UV mentah. UV CLO3D: u = x DXF (mm), v = -y DXF. */
export async function loadGarment(url) {
  const gltf = await new GLTFLoader().loadAsync(url);
  const meshes = [];
  gltf.scene.traverse(o => { if (o.isMesh) meshes.push(o); });
  if (!meshes.length) throw new Error('GLB tidak berisi mesh.');
  let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9, tris = 0;
  for (const m of meshes) {
    const a = m.geometry.attributes.uv;
    if (!a) throw new Error('Mesh "' + (m.name || '?') + '" tidak punya UV.');
    tris += (m.geometry.index ? m.geometry.index.count : a.count) / 3;
    for (let i = 0; i < a.count; i++) { const u = a.getX(i), v = a.getY(i); if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; }
  }
  const uv = { uMin: u0, vTop: -v0, Wmm: u1 - u0, Hmm: v1 - v0, v0 };
  for (const m of meshes) {
    const a = m.geometry.attributes.uv, n = new Float32Array(a.count * 2);
    for (let i = 0; i < a.count; i++) { n[2 * i] = (a.getX(i) - uv.uMin) / uv.Wmm; n[2 * i + 1] = (a.getY(i) - uv.v0) / uv.Hmm; }
    m.geometry.setAttribute('uv', new THREE.BufferAttribute(n, 2));
    if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
  }
  return { scene: gltf.scene, meshes, uv, tris: Math.round(tris) };
}

function makeKnitNormal() {
  const N = 128, per = 16, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), img = x.createImageData(N, N), h = new Float32Array(N * N), rr = mulberry32(5);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const t = (i % per) / per, v = (j % per) / per; h[j * N + i] = .5 + .5 * Math.cos(2 * Math.PI * (v + Math.abs(2 * t - 1) * .38)) + (rr() - .5) * .06; }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const dx = h[j * N + (i + 1) % N] - h[j * N + (i - 1 + N) % N], dy = h[((j + 1) % N) * N + i] - h[((j - 1 + N) % N) * N + i];
    let nx = -dx * 3.2, ny = -dy * 3.2, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const o = (j * N + i) * 4; img.data[o] = (nx * .5 + .5) * 255; img.data[o + 1] = (ny * .5 + .5) * 255; img.data[o + 2] = (nz * .5 + .5) * 255; img.data[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,.38)'); g.addColorStop(.5, 'rgba(0,0,0,.14)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export class Viewer3D {
  constructor(canvas, { autoRotate = false, interactive = true } = {}) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
    const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(1.6, 2.8, 2.2); this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfeaff, .9); fill.position.set(-2.2, 1.6, -2.4); this.scene.add(fill);
    this.camera = new THREE.PerspectiveCamera(32, 1, .05, 30);
    this.target = new THREE.Vector3(); this.dist = 1.5; this.distGoal = 1.5; this.camGoal = null;
    // zoom halus: tangani wheel sendiri sebelum OrbitControls
    canvas.addEventListener('wheel', e => {
      e.preventDefault(); e.stopImmediatePropagation();
      const k = Math.exp(e.deltaY * (e.ctrlKey ? .01 : .0012));
      this.distGoal = Math.min(this.maxDist, Math.max(this.minDist, this.distGoal * k));
    }, { passive: false });
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true; this.controls.dampingFactor = .08; this.controls.enablePan = false;
    this.controls.autoRotate = autoRotate; this.controls.autoRotateSpeed = 2;
    this.controls.enabled = interactive;
    this.controls.addEventListener('start', () => { this.camGoal = null; this.onUserMove && this.onUserMove(); });
    this.controls.addEventListener('change', () => { if (!this._zooming) this.distGoal = this.camera.position.distanceTo(this.target); });
    this.minDist = .5; this.maxDist = 4;
    this.normTex = makeKnitNormal();
    this.fabric = { knit: 5.5, normal: .5, sheen: .45 };
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.scene.add(this.shadow);
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(canvas.parentElement || canvas);
    this._loop = this._loop.bind(this); requestAnimationFrame(this._loop);
  }

  async setModel(url) {
    if (this.root) { this.scene.remove(this.root); }
    const g = await loadGarment(url);
    this.garment = g;
    this.matOut = new THREE.MeshPhysicalMaterial({ normalMap: this.normTex, roughness: .88, metalness: 0, sheen: this.fabric.sheen, sheenRoughness: .55, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide });
    for (const m of g.meshes) m.material = this.matOut;
    this.root = g.scene; this.scene.add(g.scene);
    const box = new THREE.Box3().setFromObject(g.scene); box.getCenter(this.target);
    const hgt = box.max.y - box.min.y, wid = box.max.x - box.min.x;
    this.shadow.scale.set(wid * 1.6, wid * .9, 1); this.shadow.position.set(this.target.x, box.min.y - .04, this.target.z);
    this.dist = this.distGoal = hgt / 2 / Math.tan(THREE.MathUtils.degToRad(16)) * 1.45;
    this.minDist = this.dist * .35; this.maxDist = this.dist * 2.6;
    this.controls.target.copy(this.target); this.setView('front', true);
    this.applyFabric();
    return g;
  }

  setTexture(canvas) {
    if (!this.matOut) return;
    if (!this.tex || this.tex.image !== canvas) {
      this.tex && this.tex.dispose();
      this.tex = new THREE.CanvasTexture(canvas);
      this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.flipY = false;
      this.tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      this.matOut.map = this.tex; this.matOut.needsUpdate = true;
    }
    this.tex.needsUpdate = true;
  }

  applyFabric(f) {
    if (f) Object.assign(this.fabric, f);
    if (!this.garment) return;
    const { Wmm, Hmm } = this.garment.uv, cell = this.fabric.knit * 8;
    this.normTex.repeat.set(Wmm / cell, Hmm / cell);
    this.matOut.normalScale.set(this.fabric.normal, this.fabric.normal);
    this.matOut.sheen = this.fabric.sheen;
  }

  setShadow(on) { this.shadow.visible = on; }

  setView(name, instant) {
    const dirs = { front: [0, .08, 1], back: [0, .08, -1], side: [1, .08, .12], three: [.75, .15, .8] };
    const d = new THREE.Vector3(...(dirs[name] || dirs.front)).normalize().multiplyScalar(this.distGoal).add(this.target);
    if (instant) { this.camera.position.copy(d); this.controls.update(); this.camGoal = null; } else this.camGoal = d;
  }

  resize() {
    const el = this.canvas.parentElement || this.canvas; const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  _loop() {
    requestAnimationFrame(this._loop);
    if (document.hidden) return;
    const off = this.camera.position.clone().sub(this.target);
    if (this.camGoal) {
      const goal = this.camGoal.clone().sub(this.target);
      const q = new THREE.Quaternion().setFromUnitVectors(off.clone().normalize(), goal.clone().normalize());
      off.applyQuaternion(new THREE.Quaternion().slerp(q, .14));
      if (off.clone().normalize().angleTo(goal.clone().normalize()) < .01) this.camGoal = null;
    }
    const L = off.length();
    if (Math.abs(L - this.distGoal) > 1e-4) { this._zooming = true; off.setLength(L + (this.distGoal - L) * .16); }
    this.camera.position.copy(this.target).add(off);
    this.controls.update(); this._zooming = false;
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Snapshot PNG. bg: {mode:'studio'|'solid'|'transparent', color, studio:[a,b]}
   * views: ['front'] atau beberapa sudut sekaligus (digabung berjajar).
   */
  async snapshot({ width = 1600, height = 1600, bg = { mode: 'studio' }, views = null, watermark = null } = {}) {
    const r = this.renderer, oldSize = r.getSize(new THREE.Vector2()), oldPR = r.getPixelRatio();
    const keepPos = this.camera.position.clone(), keepAuto = this.controls.autoRotate;
    this.controls.autoRotate = false;
    const list = views && views.length ? views : [null];
    const out = document.createElement('canvas'); out.width = width * list.length; out.height = height;
    const ctx = out.getContext('2d');
    paintBg(ctx, out.width, height, bg);
    r.setPixelRatio(1); r.setSize(width, height, false); this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
    for (let i = 0; i < list.length; i++) {
      if (list[i]) { this.setView(list[i], true); }
      else { this.camera.position.copy(keepPos); this.controls.update(); }
      r.render(this.scene, this.camera);
      ctx.drawImage(r.domElement, i * width, 0, width, height);
    }
    r.setPixelRatio(oldPR); r.setSize(oldSize.x, oldSize.y, false); this.resize();
    this.camera.position.copy(keepPos); this.controls.update(); this.controls.autoRotate = keepAuto;
    if (watermark) watermark(ctx, out.width, out.height);
    return out;
  }
}

export function paintBg(ctx, w, h, bg) {
  if (bg.mode === 'transparent') return;
  if (bg.mode === 'solid') { ctx.fillStyle = bg.color || '#ffffff'; ctx.fillRect(0, 0, w, h); return; }
  const [a, b] = bg.studio || ['#f4f7f6', '#c9d6d2'];
  const g = ctx.createRadialGradient(w / 2, h * .25, 0, w / 2, h * .25, Math.max(w, h) * .95);
  g.addColorStop(0, a); g.addColorStop(1, b);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
