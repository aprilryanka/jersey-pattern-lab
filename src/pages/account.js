import '../styles/base.css';
import '../styles/page.css';
import '../styles/auth.css';
import { sb, getMe, planOf, signOut } from '../lib/supabase.js';
import { mountNav } from '../lib/nav.js';
import { $, fmtDate, toast, eyeToggle } from '../lib/ui.js';

const setK = (id, val, sub) => { const k = $(id); k.querySelector('b').textContent = val; if (sub != null) k.querySelector('small').textContent = sub; };

(async () => {
  const me = await mountNav('account');
  if (!me) { location.href = '/login?next=/akun'; return; }
  const p = me.profile, plan = planOf(me), email = me.user.email;

  $('#hello').textContent = p.name ? 'Halo, ' + p.name.split(' ')[0] : 'Akun saya';
  $('#email').textContent = email + ' · bergabung ' + fmtDate(p.created_at || me.user.created_at);
  $('#name').value = p.name || ''; $('#mail').value = email;

  // status & sisa hari
  if (p.role === 'admin') { setK('#kPlan', 'ADMIN', 'Semua fitur Pro aktif'); setK('#kDays', '∞', 'Tanpa batas'); }
  else if (plan === 'pro') {
    const left = Math.max(0, Math.ceil((new Date(p.plan_until) - Date.now()) / 864e5));
    setK('#kPlan', 'PRO', 'Aktif'); setK('#kDays', left + ' hari', 'Berakhir ' + fmtDate(p.plan_until));
    if (left <= 5) $('#kDays').classList.add('alert');
    $('#upBtn').textContent = 'Perpanjang Pro';
  } else {
    setK('#kPlan', 'GRATIS', p.plan_until ? 'Pro berakhir ' + fmtDate(p.plan_until) : 'Upgrade untuk mode Advanced & export');
    setK('#kDays', '0 hari', 'Belum berlangganan');
  }
  sb.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', me.user.id)
    .then(({ count }) => setK('#kProj', String(count ?? 0)));

  $('#logout').onclick = signOut;
  $('#forgotLink').href = '/login?mode=forgot&email=' + encodeURIComponent(email);

  $('#profForm').onsubmit = async e => {
    e.preventDefault(); const btn = $('#profSave'); btn.disabled = true; $('#profOk').textContent = '';
    const name = $('#name').value.trim();
    const { error } = await sb.from('profiles').update({ name: name || null }).eq('id', me.user.id);
    await sb.auth.updateUser({ data: { name } }).catch(() => {});
    btn.disabled = false;
    if (error) return toast('Gagal: ' + error.message);
    $('#profOk').textContent = 'Profil tersimpan.'; getMe(true);
    $('#hello').textContent = name ? 'Halo, ' + name.split(' ')[0] : 'Akun saya';
  };

  // ganti password
  ['#pwOld', '#pwNew', '#pwNew2'].forEach(s => eyeToggle($(s)));
  const hint = () => {
    const h = $('#pwHint'), a = $('#pwNew').value, b = $('#pwNew2').value;
    if (!a && !b) { h.hidden = true; return; }
    h.hidden = false;
    if (a.length < 8) { h.className = 'pw-hint bad'; h.textContent = `Minimal 8 karakter (${a.length}/8).`; }
    else if (!b) { h.className = 'pw-hint'; h.textContent = 'Ketik ulang password baru.'; }
    else if (a !== b) { h.className = 'pw-hint bad'; h.textContent = 'Password baru belum sama.'; }
    else { h.className = 'pw-hint good'; h.textContent = '✓ Password cocok.'; }
  };
  $('#pwNew').oninput = hint; $('#pwNew2').oninput = hint;

  $('#pwForm').onsubmit = async e => {
    e.preventDefault();
    const old = $('#pwOld').value, a = $('#pwNew').value, b = $('#pwNew2').value, err = $('#pwErr');
    err.textContent = ''; $('#pwOk').textContent = '';
    if (!old) { err.textContent = 'Isi password saat ini.'; return; }
    if (a.length < 8) { err.textContent = 'Password baru minimal 8 karakter.'; return; }
    if (a !== b) { err.textContent = 'Password baru dan ulangi password belum sama.'; return; }
    if (a === old) { err.textContent = 'Password baru harus berbeda dari password saat ini.'; return; }
    const btn = $('#pwSave'); btn.disabled = true; btn.textContent = 'Menyimpan…';
    try {
      // verifikasi password lama dulu
      const chk = await sb.auth.signInWithPassword({ email, password: old });
      if (chk.error) throw new Error('Password saat ini salah.');
      const { error } = await sb.auth.updateUser({ password: a });
      if (error) throw error;
      $('#pwForm').reset(); hint();
      $('#pwOk').textContent = 'Password berhasil diganti. Gunakan password baru saat masuk berikutnya.';
    } catch (x) {
      err.textContent = /should be different/i.test(x.message) ? 'Password baru harus berbeda dari yang lama.' : (x.message || 'Gagal mengganti password.');
    } finally { btn.disabled = false; btn.textContent = 'Simpan password baru'; }
  };
})();
