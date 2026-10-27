// Menyambungkan panggung 3D ke halaman: scroll → kamera & bab, kontrol pattern/teks, preset kamera.
import { BASIC_STYLES, BASIC_PALETTES } from '../studio/basic.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const WEIGHTS = [1, 1, 1.3, 1.7, 1.7];
const LABELS = ['Intro', 'Kain', 'Pola jahit', 'Pattern', 'Nama dan nomor'];
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,800;1,800&family=Anton&family=Bebas+Neue&family=Kanit:ital,wght@0,800;1,800&family=Big+Shoulders+Display:wght@900&family=Saira+Condensed:wght@800&family=Teko:wght@700&family=Oswald:wght@700&family=Russo+One&family=Squada+One&family=Staatliches&family=Fjalla+One&family=Passion+One:wght@900&family=Racing+Sans+One&family=Black+Ops+One&family=Chakra+Petch:wght@700&family=Orbitron:wght@800&family=Bungee&family=Graduate&family=Alfa+Slab+One&family=Bowlby+One&family=Changa+One&family=Archivo+Black&family=Rubik+Mono+One&family=Permanent+Marker&family=Bricolage+Grotesque:wght@800&display=swap';
const fmt = n => (+n).toFixed(1).replace('.', ',');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function hasWebGL2() { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } }

export async function initStage(root) {
  if (!root) return;
  const saveData = navigator.connection && navigator.connection.saveData;
  if (!hasWebGL2() || saveData || /[?&]static\b/.test(location.search)) { root.classList.add('static'); return; }

  const qs = new URLSearchParams(location.search), testTier = qs.get('tier'), testMode = !!testTier;
  const status = $('#stageStatus', root); status.hidden = false; status.textContent = 'Memuat model 3D…';
  let mod, stage;
  try {
    mod = await import('./stage.js');
    stage = await mod.createStage($('#stageCanvas', root), testTier ? { tier: testTier, lock: true } : {});
  } catch (e) {
    console.warn('Panggung 3D tidak bisa dimuat, memakai tampilan statis.', e);
    root.classList.add('static'); status.hidden = true; return;
  }
  status.hidden = true; root.classList.add('ready'); if (testMode) stage.pause(true);
  root.style.setProperty('--len', WEIGHTS.reduce((a, b) => a + b, 0));

  /* ---------- keyframe kamera per bab ---------- */
  const mobile = () => matchMedia('(max-width: 760px)').matches;
  function buildShots() {
    const m = mobile(), wide = !m && innerWidth >= 1100, sx = m ? 0 : .2, sy = m ? .25 : 0, far = m ? 4.3 : 2.6, fit = stage.fitFlatDist(stage.aspect);
    return [
      { az: 28, el: 5, d: far, ty: m ? 0 : .02, shiftX: sx, shiftY: sy, ap: 0, wind: 1 },
      { az: -24, el: 8, d: m ? .85 : .78, ty: .18, shiftX: m ? 0 : .22, shiftY: m ? .17 : 0, ap: .035, wind: .35 },
      // pola jahit: sejajar kartu teks di layar lebar, di bawah kartu di layar sempit
      wide ? { az: 0, el: 0, d: fit * 1.78, unfold: 1, wind: 0, shiftX: .225, shiftY: -.02, ap: 0, exposure: 1.3 }
        : { az: 0, el: 0, d: fit * (m ? 1.08 : 1.3), unfold: 1, wind: 0, shiftY: m ? -.26 : -.14, ap: 0, exposure: 1.3 },
      { az: -16, el: 4, d: m ? 4.3 : 2.35, ty: m ? 0 : .02, shiftX: sx, shiftY: sy, ap: 0, wind: 1 },
      { az: -168, el: 4, d: m ? 4.1 : 2.35, ty: .02, shiftX: sx, shiftY: sy, ap: 0, wind: 1 },
    ];
  }
  let shots = buildShots();
  const PRESETS = {
    front: { az: 0, el: 4, d: 2.2 },
    back: { az: 180, el: 4, d: 2.1, ty: .05 },
    collar: { az: 8, el: 14, d: .8, ty: .4, ap: .04 },
    sleeve: { az: 66, el: 6, d: .95, tx: .3, ty: .2, ap: .04 },
    fabric: { az: -24, el: 8, d: .78, ty: .18, ap: .035 },
  };
  const mix = (a, b, t) => { const o = {}; for (const k of Object.keys(mod.DEFAULT_SHOT)) { const x = a[k] ?? mod.DEFAULT_SHOT[k], y = b[k] ?? mod.DEFAULT_SHOT[k]; o[k] = x + (y - x) * t; } return o; };

  /* ---------- ukuran panel (dari pola nyata) ---------- */
  const d = stage.dims, tag = (n, x) => x ? `<li>${n} · ${fmt(x.w)} × ${fmt(x.h)} cm</li>` : '';
  $('#dimTags', root).innerHTML = tag('Depan', d.front) + tag('Belakang', d.back) + tag('Lengan', d.sleeve || d.sleeveR);

  /* ---------- kontrol pattern ---------- */
  const styleBox = $('#styleChips'), palBox = $('#palSw'), cols = [0, 1, 2].map(i => $('#col' + i)), seedOut = $('#seedOut');
  BASIC_STYLES.forEach(([id, label]) => {
    const b = Object.assign(document.createElement('button'), { type: 'button', textContent: label }); b.dataset.id = id;
    b.onclick = () => { stage.pattern.setStyle(id); syncPattern(); };
    styleBox.append(b);
  });
  BASIC_PALETTES.forEach((p, i) => {
    const b = Object.assign(document.createElement('button'), { type: 'button' }); b.dataset.i = i;
    b.setAttribute('aria-label', 'Palet ' + (i + 1)); b.style.background = `linear-gradient(90deg, ${p[0]} 0 34%, ${p[1]} 34% 67%, ${p[2]} 67%)`;
    b.onclick = () => { stage.pattern.setPalette(p); syncPattern(); };
    palBox.append(b);
  });
  cols.forEach((inp, i) => {
    let raf = 0;
    inp.addEventListener('input', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { stage.pattern.setColor(i, inp.value); syncPattern(true); }); });
  });
  $('#btnRand').onclick = () => { stage.pattern.randomize(); syncPattern(); };
  function syncPattern(keepInputs) {
    const st = stage.pattern.state;
    $$('button', styleBox).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === st.style)));
    $$('button', palBox).forEach(b => b.setAttribute('aria-pressed', String(BASIC_PALETTES[+b.dataset.i].every((c, k) => c.toLowerCase() === st.colors[k].toLowerCase()))));
    if (!keepInputs) cols.forEach((inp, i) => { inp.value = st.colors[i]; });
    seedOut.textContent = 'Pola #' + st.seed;
  }
  syncPattern();

  /* ---------- kontrol teks ---------- */
  const inTeam = $('#inTeam'), inName = $('#inName'), inNum = $('#inNum'), selFont = $('#selFont'), selMotion = $('#selMotion');
  stage.FONTS.forEach((f, i) => selFont.append(Object.assign(document.createElement('option'), { value: i, textContent: f[0] })));
  selFont.value = 3;
  let fontsLink = null;
  function ensureFonts() {
    if (fontsLink) return; fontsLink = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: FONT_URL }); document.head.append(fontsLink);
  }
  let txTimer = 0;
  const pushText = () => { clearTimeout(txTimer); txTimer = setTimeout(() => stage.text.set({ team: inTeam.value.toUpperCase(), name: inName.value.toUpperCase(), number: inNum.value.replace(/\D/g, '') }), 60); };
  [inTeam, inName].forEach(i => i.addEventListener('input', pushText));
  inNum.addEventListener('input', () => { inNum.value = inNum.value.replace(/\D/g, '').slice(0, 2); pushText(); });
  selFont.addEventListener('focus', ensureFonts);
  selFont.addEventListener('change', async () => {
    ensureFonts(); const idx = +selFont.value, f = stage.FONTS[idx];
    try { await Promise.race([document.fonts.load(`${f[3] ? 'italic ' : ''}${f[2]} 100px "${f[1]}"`, 'GARUDA 09'), new Promise(r => setTimeout(r, 2500))]); } catch { /* font gagal: pakai cadangan */ }
    stage.text.set({ font: idx });
  });
  selMotion.addEventListener('change', () => stage.text.play(selMotion.value));
  $('#btnPlay').onclick = () => stage.text.play(selMotion.value === 'none' ? 'rise' : selMotion.value);

  /* ---------- scroll → bab ---------- */
  const chaps = $$('.chap', root), N = chaps.length, total = WEIGHTS.reduce((a, b) => a + b, 0);
  const cum = WEIGHTS.map((_, i) => WEIGHTS.slice(0, i).reduce((a, b) => a + b, 0));
  const dots = $('#stageDots'), dotBtns = [];
  LABELS.forEach((l, i) => {
    const li = document.createElement('li'), b = Object.assign(document.createElement('button'), { type: 'button' });
    b.innerHTML = `<span>${l}</span><i></i>`; b.setAttribute('aria-label', 'Buka bagian ' + l);
    b.onclick = () => {
      const top = root.getBoundingClientRect().top + scrollY, span = root.offsetHeight - innerHeight;
      scrollTo({ top: top + (cum[i] + .38 * WEIGHTS[i]) / total * span, behavior: reduced.matches ? 'auto' : 'smooth' });
    };
    li.append(b); dots.append(li); dotBtns.push(b);
  });
  const hint = $('#stageHint');

  let override = null, overrideP = 0, curChap = -1, auto4 = false, camBtns = $$('[data-cam]');
  camBtns.forEach(b => b.onclick = () => {
    const base = shots[curChap < 0 ? 3 : curChap];
    override = { ...base, ...PRESETS[b.dataset.cam], wind: 1 }; overrideP = lastP; stage.setShot(override);
    camBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  });
  const clearOverride = () => { override = null; camBtns.forEach(x => x.setAttribute('aria-pressed', 'false')); };

  let lastP = -1, lastGoal = shots[0];
  function update() {
    const r = root.getBoundingClientRect(), span = root.offsetHeight - innerHeight;
    const p = clamp(-r.top / span, 0, 1);
    if (override && Math.abs(p - overrideP) > .012) clearOverride();
    lastP = p;
    // bab aktif + posisi lokal
    let x = p * total, i = 0; while (i < N - 1 && x >= WEIGHTS[i]) { x -= WEIGHTS[i]; i++; }
    const u = clamp(x / WEIGHTS[i], 0, 1);
    chaps.forEach((el, j) => {
      let a = 0, y = 0;
      if (j === i) {
        const fin = j === 0 ? 1 : smooth(u / .16), fout = j === N - 1 ? 1 : 1 - smooth((u - .84) / .16);
        a = Math.min(fin, fout); y = (1 - fin) * 22 - (1 - fout) * 22;
      }
      el.style.setProperty('--a', a.toFixed(3)); el.style.setProperty('--y', y.toFixed(1) + 'px');
      el.style.setProperty('--v', a > .02 ? 'visible' : 'hidden'); el.classList.toggle('live', a > .5);
    });
    if (!override) { lastGoal = i < N - 1 ? mix(shots[i], shots[i + 1], smooth((u - .72) / .28)) : shots[i]; stage.setShot(lastGoal); }
    if (i !== curChap) {
      curChap = i; if (override) clearOverride();
      dotBtns.forEach((b, j) => (j === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
      if (i >= 3) ensureFonts();
    }
    hint.style.setProperty('--h', String(1 - smooth(p * 22)));
    if (i === 4 && u > .22 && !auto4 && selMotion.value !== 'none') { auto4 = true; setTimeout(() => stage.text.play(selMotion.value), 380); }
    if (i < 3) auto4 = false;
  }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; update(); }); } }, { passive: true });
  addEventListener('resize', () => { shots = buildShots(); update(); });
  update();
  // tampilan awal langsung di posisi bab (tanpa melayang dari default)
  stage.setShot(lastGoal, true); update();
  if (testMode) { window.__stage = stage; window.__snap = () => { stage.setShot(override || lastGoal, true); stage.renderOnce(window.__ms || 0); }; }
  return stage;
}
