// Panggung 3D untuk landing: satu jersey, kamera sinematik, DOF, kain bergerak,
// unfold ke pola jahit, dan pipeline atlas yang sama dengan Studio.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { loadGarment } from '../studio/viewer3d.js';
import { layoutModel, renderAtlas, renderLayers, panelPath, FONTS } from '../studio/atlas.js';
import { BASIC_STYLES, BASIC_PALETTES } from '../studio/basic.js';
import DEFAULT_PANELS from '../studio/default-panels.json';

const MODEL_URL = '/models/jersey-basic-v-neck.glb';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const rad = d => d * Math.PI / 180;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- warna ---------- */
const lum = hex => { const n = parseInt(hex.slice(1), 16); return (.2126 * (n >> 16) + .7152 * (n >> 8 & 255) + .0722 * (n & 255)) / 255; };
function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}
/** Palet acak yang tetap enak dilihat: warna utama, aksen, dan netral. */
export function randomPalette(rnd = Math.random) {
  const h = rnd() * 360, scheme = Math.floor(rnd() * 4), sat = .55 + rnd() * .35;
  const dark = rnd() < .5;
  const c1 = hsl(h, sat, dark ? .2 + rnd() * .14 : .42 + rnd() * .12);
  const hue2 = [h + 180, h + 30, h + 120, h + 200][scheme];
  const c2 = hsl(hue2, .7 + rnd() * .25, .5 + rnd() * .12);
  const c3 = dark ? hsl(h, .25, .94) : hsl(h, .2, .1 + rnd() * .06);
  return [c1, c2, c3];
}

/* ---------- tekstur rajut ---------- */
function makeKnit() {
  const N = 256, per = 16, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), nrm = x.createImageData(N, N), alb = document.createElement('canvas'); alb.width = alb.height = N;
  const ax = alb.getContext('2d'), aimg = ax.createImageData(N, N), h = new Float32Array(N * N), rr = mulberry32(5);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = (i % per) / per, v = (j % per) / per;
    h[j * N + i] = .5 + .5 * Math.cos(2 * Math.PI * (v + Math.abs(2 * t - 1) * .38)) + (rr() - .5) * .08;
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const L = h[j * N + (i - 1 + N) % N], R = h[j * N + (i + 1) % N], U = h[((j - 1 + N) % N) * N + i], D = h[((j + 1) % N) * N + i];
    let nx = -(R - L) * 3.4, ny = -(D - U) * 3.4, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const o = (j * N + i) * 4;
    nrm.data[o] = (nx * .5 + .5) * 255; nrm.data[o + 1] = (ny * .5 + .5) * 255; nrm.data[o + 2] = (nz * .5 + .5) * 255; nrm.data[o + 3] = 255;
    const g = clamp(.74 + h[j * N + i] * .34, 0, 1.2) * 215; // sela rajutan lebih gelap, punggung benang lebih terang
    aimg.data[o] = aimg.data[o + 1] = aimg.data[o + 2] = g; aimg.data[o + 3] = 255;
  }
  x.putImageData(nrm, 0, 0); ax.putImageData(aimg, 0, 0);
  const mk = cv => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
  return { normal: mk(c), detail: mk(alb), stitches: N / per };
}

/* ---------- lingkungan studio (softbox, bukan HDRI file) ---------- */
function studioEnv(renderer, accent) {
  const s = new THREE.Scene();
  const box = (w, h, d, x, y, z, col, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(i) }));
    m.position.set(x, y, z); s.add(m); return m;
  };
  s.add(new THREE.Mesh(new THREE.SphereGeometry(30, 24, 12), new THREE.MeshBasicMaterial({ color: 0x0b0f0f, side: THREE.BackSide })));
  box(9, .3, 7, 0, 7, 1, 0xffffff, 7);          // softbox atas
  box(.3, 6, 7, 8, 3, 4, 0xfff4e8, 5.5);         // softbox kunci kanan-depan
  box(.3, 6, 5, -9, 2.5, -3, 0xdff1ff, 3.2);     // pengisi kiri
  box(5, 7, .3, -2, 3, -9, new THREE.Color(accent), 4.5); // lampu rim belakang berwarna aksen
  box(2, 8, .3, 7, 3, -7, 0xffffff, 3);          // strip rim kanan
  box(14, .2, 10, 0, -3, 2, 0x39403f, .9);       // pantulan lantai
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, .035); pm.dispose();
  s.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return rt.texture;
}

/* ---------- latar & kosmetik ---------- */
function cssColor(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
}
function backdropTexture(dark, bg, accent) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512; const x = c.getContext('2d');
  const base = new THREE.Color(bg), mid = base.clone(), edge = base.clone();
  if (dark) { mid.lerp(new THREE.Color(accent), .05).lerp(new THREE.Color(0x232b2a), .55); edge.multiplyScalar(.5); }
  else { mid.lerp(new THREE.Color(0xffffff), .55); edge.multiplyScalar(.86); }
  const g = x.createRadialGradient(256, 210, 10, 256, 260, 380);
  g.addColorStop(0, '#' + mid.getHexString()); g.addColorStop(1, '#' + edge.getHexString());
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function blobTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(.45, 'rgba(0,0,0,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
}

const FINISH = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: .035 }, uVig: { value: .32 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uGrain, uVig; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - .5; float v = smoothstep(.85, .2, length(d * vec2(1.0, .85)));
      c.rgb *= mix(1.0 - uVig, 1.0, v); c.rgb += (h(vUv * 1400.0) - .5) * uGrain; gl_FragColor = c; }`,
};

/* ---------- shader kain: angin, dorongan kursor, unfold, wipe pattern, detail rajut ---------- */
function patchFabric(mat, U) {
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec3 aFlat; attribute float aFlip; attribute float aDelay;
        uniform float uTime, uUnfold, uWind, uPushAmt, uPushR; uniform vec3 uPush;`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        float jamp = uWind * smoothstep(1.52, 0.55, position.y) * (1.0 - uUnfold);
        float jp1 = position.y * 7.0 + position.x * 4.0 + position.z * 3.0 - uTime * 1.7;
        float jp2 = position.y * 13.0 - position.x * 6.0 + uTime * 1.1;
        float jd = jamp * (0.0045 * sin(jp1) + 0.0020 * sin(jp2));
        vec2 jg = jamp * vec2(0.0045 * 4.0 * cos(jp1) - 0.0020 * 6.0 * cos(jp2), 0.0045 * 7.0 * cos(jp1) + 0.0020 * 13.0 * cos(jp2));
        vec3 jdl = position - uPush; float jf = exp(-dot(jdl, jdl) / (uPushR * uPushR)) * uPushAmt * (1.0 - uUnfold);
        jd += jf * 0.03; jg += jf * 0.03 * (-2.0 * jdl.xy / (uPushR * uPushR));
        vec3 jN0 = normalize(objectNormal);
        vec3 jgv = vec3(jg, 0.0); jgv -= dot(jgv, jN0) * jN0;
        vec3 jNw = normalize(jN0 - jgv * 0.8);
        float jte = clamp(uUnfold * 1.5 - aDelay * 0.5, 0.0, 1.0); float jE = jte * jte * (3.0 - 2.0 * jte);
        vec3 jNm = mix(jNw, vec3(0.0, 0.0, aFlip), jE);
        objectNormal = dot(jNm, jNm) > 1e-4 ? normalize(jNm) : vec3(0.0, 0.0, aFlip);`)
      .replace('#include <begin_vertex>', `vec3 transformed = position + jN0 * jd;
        transformed = mix(transformed, aFlat, jE);
        transformed.z += sin(jE * 3.14159) * (0.05 + aDelay * 0.22);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uMap2, uKnit; uniform float uWipe, uKnitAmt; uniform vec2 uKnitRep;`)
      .replace('#include <map_fragment>', `
        #ifdef USE_MAP
          vec4 jA = texture2D(map, vMapUv); vec4 jB = texture2D(uMap2, vMapUv);
          float jw = vMapUv.x * 0.8 + vMapUv.y * 0.3 + 0.1 * sin(vMapUv.y * 22.0);
          float jk = smoothstep(uWipe - 0.16, uWipe, jw); // 0 = pola baru, 1 = pola lama
          vec4 jM = mix(jA, jB, jk);
          vec2 jkuv = vMapUv * uKnitRep;
          jFade = 1.0 - smoothstep(0.012, 0.05, length(fwidth(jkuv)));
          float jKn = texture2D(uKnit, jkuv).r;
          jM.rgb *= mix(1.0, jKn, uKnitAmt * jFade);
          diffuseColor *= jM;
        #endif`)
      .replace('#include <normal_fragment_maps>', `vec3 jNg = normal;
        #include <normal_fragment_maps>
        normal = normalize(mix(jNg, normal, jFade));`)
      .replace('void main() {', 'void main() {\n float jFade = 1.0;');
  };
  mat.customProgramCacheKey = () => 'jpl-fabric-2';
}

const KEYS = ['az', 'el', 'd', 'tx', 'ty', 'tz', 'shiftX', 'shiftY', 'unfold', 'wind', 'ap', 'focusOff', 'exposure'];
export const DEFAULT_SHOT = { az: 28, el: 5, d: 2.2, tx: 0, ty: 0, tz: 0, shiftX: 0, shiftY: 0, unfold: 0, wind: 1, ap: .01, focusOff: 0, exposure: 1 };

/**
 * Buat panggung. opts: { tier: 'high'|'mid'|'low', texPx, onTier }
 * Mengembalikan API untuk mengatur kamera, pattern, teks.
 */
export async function createStage(canvas, opts = {}) {
  const phone = matchMedia('(max-width: 760px)').matches;
  let tier = opts.tier || (phone ? 'low' : (navigator.hardwareConcurrency || 4) >= 8 ? 'high' : 'mid');
  const texPx = opts.texPx || (tier === 'low' ? 1536 : tier === 'mid' ? 2304 : 3072);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: tier !== 'high', alpha: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = tier === 'high'; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .05, 20);

  const accent = () => cssColor('--accent', '#3fd0c6');
  const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  let envTex = studioEnv(renderer, accent()); scene.environment = envTex;
  const key = new THREE.DirectionalLight(0xfff2e4, 2.3);
  const rim = new THREE.DirectionalLight(0xcfeeea, 1.5);
  key.castShadow = tier === 'high'; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0004; key.shadow.normalBias = .012; key.shadow.radius = 5;
  Object.assign(key.shadow.camera, { left: -1.2, right: 1.2, top: 1.4, bottom: -1.4, near: .5, far: 8 });
  scene.add(key, key.target, rim, rim.target);

  const knit = makeKnit();
  const U = {
    uTime: { value: 0 }, uUnfold: { value: 0 }, uWind: { value: 1 }, uPush: { value: new THREE.Vector3() }, uPushAmt: { value: 0 }, uPushR: { value: .16 },
    uWipe: { value: 2 }, uMap2: { value: null }, uKnit: { value: knit.detail }, uKnitAmt: { value: .55 }, uKnitRep: { value: new THREE.Vector2(1, 1) },
  };

  /* ----- model & tekstur ----- */
  const g = await loadGarment(MODEL_URL);
  const L = layoutModel(DEFAULT_PANELS, g.uv);
  const box = new THREE.Box3().setFromObject(g.scene), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const H = size.y;
  key.position.copy(center).add(new THREE.Vector3(2.1, 2.5, 1.7)); key.target.position.copy(center); rim.position.copy(center).add(new THREE.Vector3(-2.2, 1.6, -2.3)); rim.target.position.copy(center); key.shadow.camera.updateProjectionMatrix();
  const mat = new THREE.MeshPhysicalMaterial({ normalMap: knit.normal, normalScale: new THREE.Vector2(.55, .55), roughness: .86, metalness: 0, sheen: .4, sheenRoughness: .5, sheenColor: new THREE.Color(0xffffff), side: THREE.DoubleSide, envMapIntensity: .7 });
  patchFabric(mat, U);
  const fabric = { knit: 2.7 };
  const applyKnit = () => {
    const cell = fabric.knit * knit.stitches;
    knit.normal.repeat.set(g.uv.Wmm / cell, g.uv.Hmm / cell); U.uKnitRep.value.set(g.uv.Wmm / cell, g.uv.Hmm / cell);
  };
  applyKnit();

  // atribut datar: posisi pola jahit (ruang dunia → lokal mesh), arah normal, dan jeda per panel
  const flatW = g.uv.Wmm / 1000, flatH = g.uv.Hmm / 1000;
  const delayByRole = { front: 0, back: .22, sleeve: .5, rib: .8 };
  const roleAt = (x, y) => (L.panels.find(p => x >= p.bb.minX - 2 && x <= p.bb.maxX + 2 && y >= p.bb.minY - 2 && y <= p.bb.maxY + 2) || {}).role;
  g.meshes.forEach((m, mi) => {
    m.updateWorldMatrix(true, false);
    const inv = m.matrixWorld.clone().invert(), uvA = m.geometry.attributes.uv, n = uvA.count, flat = new Float32Array(n * 3), v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      v.set(center.x + (uvA.getX(i) - .5) * flatW, center.y + (.5 - uvA.getY(i)) * flatH, center.z).applyMatrix4(inv);
      flat[i * 3] = v.x; flat[i * 3 + 1] = v.y; flat[i * 3 + 2] = v.z;
    }
    // arah hadap setelah diratakan (cek urutan sisi segitiga di bidang datar)
    const idx = m.geometry.index; let area = 0; const tri = idx ? idx.count / 3 : n / 3;
    for (let t = 0; t < tri; t++) {
      const a = idx ? idx.getX(t * 3) : t * 3, b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      const ax = uvA.getX(a), ay = -uvA.getY(a), bx = uvA.getX(b), by = -uvA.getY(b), cx = uvA.getX(c), cy = -uvA.getY(c);
      area += (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    }
    let su = 0, sv = 0; for (let i = 0; i < n; i++) { su += uvA.getX(i); sv += uvA.getY(i); }
    const role = roleAt(g.uv.uMin + su / n * g.uv.Wmm, g.uv.vTop - sv / n * g.uv.Hmm);
    const dl = delayByRole[role] ?? Math.min(.8, mi * .13);
    m.geometry.setAttribute('aFlat', new THREE.BufferAttribute(flat, 3));
    m.geometry.setAttribute('aFlip', new THREE.BufferAttribute(new Float32Array(n).fill(area >= 0 ? 1 : -1), 1));
    m.geometry.setAttribute('aDelay', new THREE.BufferAttribute(new Float32Array(n).fill(dl), 1));
    m.material = mat; m.castShadow = true; m.receiveShadow = tier === 'high'; m.frustumCulled = false;
  });
  scene.add(g.scene);

  // atlas: base (pola) + atlas (pola + teks) + prev (untuk wipe)
  const sc = Math.min(texPx / L.Wmm, Math.min(renderer.capabilities.maxTextureSize, 8192) / L.Hmm);
  const mkCanvas = () => { const c = document.createElement('canvas'); c.width = Math.round(L.Wmm * sc); c.height = Math.round(L.Hmm * sc); return c; };
  const base = mkCanvas(), atlas = mkCanvas(), prev = mkCanvas();
  const bctx = base.getContext('2d'), actx = atlas.getContext('2d'), pctx = prev.getContext('2d');
  const mkTex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };
  const tex = mkTex(atlas), tex2 = mkTex(prev);
  mat.map = tex; U.uMap2.value = tex2; mat.needsUpdate = true;

  /* ----- state desain ----- */
  const S = {
    mode: 'basic', basic: { style: 'chevron', colors: [...BASIC_PALETTES[0]], seed: 11, scale: 1 },
    edit: { scale: 1, rot: 0, offX: 0, offY: 0, flip: false, seam: true, repeats: 2 },
    panelFill: {}, ribColor: BASIC_PALETTES[0][1], layers: [],
  };
  const panelOf = role => L.panels.find(p => p.role === role);
  const layerDefs = {
    team: { role: 'front', ly: p => p.h * .31, size: 38 }, fnum: { role: 'front', ly: p => p.h * .5, size: 120 },
    name: { role: 'back', ly: p => p.h * .26, size: 54 }, bnum: { role: 'back', ly: p => p.h * .52, size: 230 },
  };
  const layer = {};
  for (const [k, d] of Object.entries(layerDefs)) {
    const p = panelOf(d.role); if (!p) continue;
    const Ly = { id: k, type: 'text', panel: p.id, text: '', font: 3, size: d.size, color: '#ffffff', stroke: '#0b1d3a', strokeW: 2.5, rot: 0, opacity: 1, italic: false, lx: p.w / 2, ly: d.ly(p) };
    Ly._home = { lx: Ly.lx, ly: Ly.ly, size: Ly.size };
    layer[k] = Ly; S.layers.push(Ly);
  }
  layer.team && (layer.team.text = 'GARUDA FC'); layer.fnum && (layer.fnum.text = '09');
  layer.name && (layer.name.text = 'SETIAWAN'); layer.bnum && (layer.bnum.text = '09');

  function drawSeams(ctx) {
    ctx.save(); ctx.setTransform(sc, 0, 0, sc, 0, 0);
    for (const p of L.panels) {
      ctx.save(); panelPath(ctx, p, x => x - L.uMin, y => L.vTop - y); ctx.clip();
      ctx.lineJoin = 'round';
      [[16, .03], [9, .04], [5, .05], [2.4, .06]].forEach(([w, a]) => { panelPath(ctx, p, x => x - L.uMin, y => L.vTop - y); ctx.lineWidth = w; ctx.strokeStyle = `rgba(0,0,0,${a})`; ctx.stroke(); });
      ctx.restore();
      panelPath(ctx, p, x => x - L.uMin, y => L.vTop - y); ctx.lineWidth = .55; ctx.strokeStyle = 'rgba(0,0,0,.32)'; ctx.stroke();
    }
    ctx.restore();
  }
  function contrast() {
    const [c1, c2] = S.basic.colors, l = (lum(c1) + lum(c2)) / 2, c = l > .55 ? '#10151a' : '#ffffff';
    for (const k in layer) { layer[k].color = c; layer[k].stroke = c === '#ffffff' ? '#0b1d3a' : '#ffffff'; }
  }
  let baseDirty = true;
  function repaint(layersOnly) {
    if (baseDirty && !layersOnly) { renderAtlas(bctx, L, S, null, sc, { layers: false }); drawSeams(bctx); baseDirty = false; }
    actx.setTransform(1, 0, 0, 1, 0, 0); actx.drawImage(base, 0, 0);
    renderLayers(actx, L, S, sc);
    tex.needsUpdate = true;
  }
  /** Ganti pola dengan wipe dari pola lama ke baru. */
  function changePattern(fn, wipe = true) {
    if (wipe) { pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.drawImage(atlas, 0, 0); tex2.needsUpdate = true; }
    fn(); contrast(); baseDirty = true; repaint();
    if (wipe && !REDUCED) { U.uWipe.value = -.2; wipeAnim = true; } else U.uWipe.value = 2;
  }
  let wipeAnim = false;
  try { await Promise.race([document.fonts.load('800 60px "Barlow Condensed"', 'GARUDA 09'), new Promise(r => setTimeout(r, 1500))]); } catch { /* pakai font cadangan */ }
  repaint();

  /* ----- latar, lantai ----- */
  const floorBlob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false, opacity: .9 }));
  floorBlob.rotation.x = -Math.PI / 2; floorBlob.position.set(center.x, box.min.y - .2, center.z); floorBlob.scale.set(size.x * 1.5, size.x * .9, 1); scene.add(floorBlob);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: .32 })); floor.rotation.x = -Math.PI / 2; floor.position.set(center.x, box.min.y - .2, center.z); floor.receiveShadow = true; floor.visible = tier === 'high'; scene.add(floor);
  function tuneFinish() { if (finish) { const d = isDark(); finish.uniforms.uVig.value = d ? .36 : .14; finish.uniforms.uGrain.value = d ? .04 : .022; } }
  function themeBackdrop() {
    const dark = isDark(), bg = cssColor('--bg', dark ? '#0c1312' : '#e9eeed');
    scene.background && scene.background.dispose(); scene.background = backdropTexture(dark, bg, accent());
    floorBlob.material.opacity = dark ? .85 : .5;
    renderer.toneMappingExposure = dark ? 1 : 1.08;
    U.uKnitAmt.value = .55; tuneFinish();
    if (envTex) { envTex.dispose(); envTex = studioEnv(renderer, accent()); scene.environment = envTex; }
  }

  /* ----- post-processing ----- */
  let composer = null, bokeh = null, finish = null;
  function buildComposer() {
    composer && composer.dispose(); composer = bokeh = finish = null;
    if (tier === 'low') return;
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: tier === 'high' ? 4 : 0 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    bokeh = new BokehPass(scene, camera, { focus: 2, aperture: 0, maxblur: .012 });
    const bokehRender = bokeh.render.bind(bokeh); // BokehPass menggambar kedalaman: latar tidak boleh ikut
    bokeh.render = (...a) => { const bg = scene.background; scene.background = null; bokehRender(...a); scene.background = bg; };
    composer.addPass(bokeh);
    composer.addPass(new OutputPass());
    finish = new ShaderPass(FINISH); composer.addPass(finish);
    tuneFinish(); resize();
  }

  let W = 1, Hh = 1;
  function resize() {
    const el = canvas.parentElement || canvas, w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
    W = w; Hh = h;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, tier === 'high' ? 2 : tier === 'mid' ? 1.5 : 1.35));
    renderer.setSize(w, h, false);
    if (composer) composer.setSize(w, h);
    camera.aspect = w / h; applyView();
  }
  function applyView() {
    camera.setViewOffset(W, Hh, -cur.shiftX * W, cur.shiftY * Hh, W, Hh);
  }

  /* ----- kamera ----- */
  const cur = { ...DEFAULT_SHOT }, goal = { ...DEFAULT_SHOT };
  let follow = 4.5, pointer = { x: 0, y: 0 }, pushOn = false;
  const rayc = new THREE.Raycaster(), ndc = new THREE.Vector2(), tmpV = new THREE.Vector3();
  const T = new THREE.Vector3();
  function updateCamera(t) {
    const idle = REDUCED ? 0 : Math.sin(t * .28) * 2.2;
    const az = rad(cur.az + idle + pointer.x * 3.5), el = rad(cur.el - pointer.y * 1.6), dist = cur.d * H;
    T.set(center.x + cur.tx * H, center.y + cur.ty * H, center.z + cur.tz * H);
    camera.position.set(T.x + dist * Math.sin(az) * Math.cos(el), T.y + dist * Math.sin(el), T.z + dist * Math.cos(az) * Math.cos(el));
    camera.lookAt(T);
    applyView();
    if (bokeh) {
      const open = clamp(1 - cur.unfold * 4, 0, 1); // saat diratakan, DOF dimatikan (panel sejajar kamera)
      bokeh.uniforms.focus.value = dist + cur.focusOff * H;
      bokeh.uniforms.aperture.value = cur.ap * open;
      bokeh.uniforms.maxblur.value = .014;
    }
    renderer.toneMappingExposure = (isDark() ? 1 : 1.08) * cur.exposure;
  }

  /* ----- animasi teks ----- */
  let motion = null;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  function applyMotion(now) {
    if (!motion) return false;
    const t = (now - motion.t0) / motion.dur;
    const order = Object.keys(layer);
    order.forEach((k, i) => {
      const Ly = layer[k], hm = Ly._home, full = Ly._full ?? Ly.text;
      const lt = clamp((t * 1 - i * .1) / .7, 0, 1);
      if (motion.kind === 'rise') { Ly.opacity = easeOut(lt); Ly.ly = hm.ly + (1 - easeOut(lt)) * 38; }
      else if (motion.kind === 'type') {
        Ly.opacity = 1; const n = Math.ceil(full.length * easeOut(lt)); Ly.text = full.slice(0, n);
        Ly.size = hm.size * (k.endsWith('num') ? .6 + .4 * easeOut(lt) : 1);
      } else if (motion.kind === 'glitch') {
        const j = lt < 1 ? (Math.random() - .5) * 18 * (1 - lt) : 0;
        Ly.lx = hm.lx + j; Ly.opacity = lt < .15 ? 0 : (lt < 1 && Math.random() < .12 ? .25 : 1);
        Ly.stroke = lt < 1 ? (Math.random() < .5 ? '#ff2a6d' : '#00e5ff') : Ly._stroke; Ly.strokeW = lt < 1 ? 4 : 2.5;
      }
    });
    if (t >= 1) { endMotion(); }
    return true;
  }
  function endMotion() {
    for (const k in layer) { const Ly = layer[k], hm = Ly._home; Ly.lx = hm.lx; Ly.ly = hm.ly; Ly.size = hm.size; Ly.opacity = 1; Ly.strokeW = 2.5; if (Ly._full != null) Ly.text = Ly._full; Ly._full = null; }
    contrast(); motion = null; repaint(true);
  }
  function playMotion(kind) {
    if (kind === 'none' || REDUCED) { if (motion) endMotion(); return; }
    if (motion) endMotion();
    for (const k in layer) { layer[k]._full = layer[k].text; layer[k]._stroke = layer[k].stroke; }
    motion = { kind, t0: performance.now(), dur: kind === 'glitch' ? 900 : 1100 };
  }

  /* ----- loop ----- */
  let visible = true, last = performance.now(), frames = 0, acc = 0, lastRepaint = 0, running = true, destroyed = false;
  function draw(now, dt) {
    const k = 1 - Math.exp(-dt * follow);
    for (const key of KEYS) cur[key] += (goal[key] - cur[key]) * k;
    U.uTime.value = now / 1000; U.uUnfold.value = cur.unfold; U.uWind.value = REDUCED ? 0 : cur.wind;
    U.uPushAmt.value += ((pushOn && !REDUCED ? 1 : 0) - U.uPushAmt.value) * (1 - Math.exp(-dt * 6));
    floorBlob.material.opacity = (isDark() ? .85 : .5) * (1 - clamp(cur.unfold * 3, 0, 1)); floor.material.opacity = .32 * (1 - clamp(cur.unfold * 3, 0, 1));
    if (wipeAnim) { U.uWipe.value += dt * 1.5; if (U.uWipe.value > 1.2) { U.uWipe.value = 2; wipeAnim = false; } }
    if (motion && now - lastRepaint > 33) { applyMotion(now); repaint(true); lastRepaint = now; }
    if (finish) finish.uniforms.uTime.value = (now % 1000) / 1000;
    updateCamera(now / 1000);
    if (composer) composer.render(dt); else renderer.render(scene, camera);
  }
  function frame(now) {
    if (destroyed) return;
    requestAnimationFrame(frame);
    if (!visible || document.hidden || !running) { last = now; return; }
    const dt = Math.min(.06, (now - last) / 1000); last = now;
    draw(now, dt);
    // turunkan kualitas bila pengguna tertinggal
    if (++frames > 50) { acc += dt; if (frames % 90 === 0) { const avg = acc / 90 * 1000; acc = 0; if (avg > 36 && tier !== 'low' && !opts.lock) downgrade(); } }
  }
  function downgrade() {
    tier = tier === 'high' ? 'mid' : 'low';
    renderer.shadowMap.enabled = false; key.castShadow = false; floor.visible = false;
    g.meshes.forEach(m => { m.receiveShadow = false; });
    mat.needsUpdate = true; buildComposer(); resize();
    opts.onTier && opts.onTier(tier);
  }

  /* ----- input ----- */
  function pointerMove(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((clientX - r.left) / r.width) * 2 - 1; pointer.y = ((clientY - r.top) / r.height) * 2 - 1;
    if (cur.unfold > .05) { pushOn = false; return; }
    ndc.set(pointer.x, -pointer.y); rayc.setFromCamera(ndc, camera);
    const hit = rayc.intersectObjects(g.meshes, false)[0];
    if (hit) { tmpV.copy(hit.point); g.meshes[0].worldToLocal(tmpV); U.uPush.value.copy(tmpV); pushOn = true; } else pushOn = false;
  }
  const onMove = e => pointerMove(e.clientX, e.clientY);
  const onLeave = () => { pushOn = false; pointer.x = pointer.y = 0; };
  const host = canvas.parentElement || canvas;
  host.addEventListener('pointermove', onMove, { passive: true }); host.addEventListener('pointerleave', onLeave);
  const ro = new ResizeObserver(resize); ro.observe(host);
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }); io.observe(host);
  document.addEventListener('themechange', themeBackdrop);

  themeBackdrop(); buildComposer(); resize();
  for (const key2 of KEYS) cur[key2] = goal[key2];
  requestAnimationFrame(frame);

  /* ----- API ----- */
  const dims = Object.fromEntries(L.panels.map(p => [p.role + (p.id === 'sleeveR' ? 'R' : ''), { w: p.w / 10, h: p.h / 10 }]));
  const api = {
    H, flat: { w: flatW, h: flatH }, dims, get tier() { return tier; }, get seed() { return S.basic.seed; },
    /** target kamera (hasil scroll / preset). Nilai yang tidak diisi mengikuti DEFAULT_SHOT. */
    setShot(s, fast) { for (const key2 of KEYS) goal[key2] = s[key2] ?? DEFAULT_SHOT[key2]; if (fast) for (const key2 of KEYS) cur[key2] = goal[key2]; },
    follow(v) { follow = v; },
    fitFlatDist(aspect) { const t = Math.tan(rad(15)); return Math.max(flatH / 2 / t, flatW / 2 / (t * aspect)) * 1.12 / H; },
    get aspect() { return W / Hh; },
    pattern: {
      get state() { return { style: S.basic.style, colors: [...S.basic.colors], seed: S.basic.seed, scale: S.basic.scale }; },
      setStyle(id) { changePattern(() => { S.basic.style = id; }); },
      setPalette(colors) { changePattern(() => { S.basic.colors = [...colors]; S.ribColor = colors[1]; }); },
      setColor(i, hex) { changePattern(() => { S.basic.colors[i] = hex; if (i === 1) S.ribColor = hex; }, false); },
      randomize() {
        const r = Math.random;
        const styles = BASIC_STYLES.map(s => s[0]).filter(s => s !== 'solid');
        changePattern(() => {
          S.basic.style = styles[Math.floor(r() * styles.length)];
          S.basic.colors = r() < .35 ? [...BASIC_PALETTES[Math.floor(r() * BASIC_PALETTES.length)]] : randomPalette(r);
          S.ribColor = S.basic.colors[1]; S.basic.seed = Math.floor(r() * 9000) + 1000; S.basic.scale = .75 + r() * .8;
          S.edit.rot = [0, 0, 0, 20, -20, 45, 90][Math.floor(r() * 7)];
        });
      },
    },
    text: {
      get values() { return { team: layer.team?.text || '', name: layer.name?.text || '', number: layer.bnum?.text || '', font: layer.team?.font ?? 0 }; },
      set({ team, name, number, font, motion: m } = {}) {
        if (motion) endMotion();
        if (team != null && layer.team) layer.team.text = team;
        if (name != null && layer.name) layer.name.text = name;
        if (number != null) { layer.fnum && (layer.fnum.text = number); layer.bnum && (layer.bnum.text = number); }
        if (font != null) for (const k in layer) layer[k].font = font;
        contrast(); repaint(true); if (m) playMotion(m);
      },
      play(kind) { for (const k in layer) layer[k]._full = null; playMotion(kind); },
    },
    FONTS,
    pause(v) { running = !v; },
    renderOnce(ms = 0) { draw(performance.now() + ms, .016); },
    dispose() {
      destroyed = true; ro.disconnect(); io.disconnect(); host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('themechange', themeBackdrop); composer && composer.dispose(); renderer.dispose();
    },
  };
  return api;
}
