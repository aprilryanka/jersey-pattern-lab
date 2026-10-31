import '../styles/base.css';
import '../styles/auth.css';
import { sb } from '../lib/supabase.js';
import { mountNav } from '../lib/nav.js';
import { $, eyeToggle } from '../lib/ui.js';
import { signupAttribution } from '../lib/track.js';

eyeToggle($('#pw')); eyeToggle($('#pw2'));
const needsConfirm = () => mode === 'signup' || mode === 'reset';
function pwHint() {
  const h = $('#pwHint'), a = $('#pw').value, b = $('#pw2').value;
  if (!needsConfirm() || (!a && !b)) { h.hidden = true; return; }
  h.hidden = false;
  if (a.length < 8) { h.className = 'pw-hint bad'; h.textContent = `Minimal 8 karakter (${a.length}/8).`; }
  else if (!b) { h.className = 'pw-hint'; h.textContent = 'Ketik ulang password di kolom kedua.'; }
  else if (a !== b) { h.className = 'pw-hint bad'; h.textContent = 'Password belum sama.'; }
  else { h.className = 'pw-hint good'; h.textContent = '✓ Password cocok.'; }
}
$('#pw').addEventListener('input', pwHint); $('#pw2').addEventListener('input', pwHint);

const params = new URLSearchParams(location.search);
const next = (params.get('next') || '/studio').startsWith('/') ? params.get('next') || '/studio' : '/studio';
let mode = ['signup', 'forgot'].includes(params.get('mode')) ? params.get('mode') : 'login';
if (params.get('email')) $('#email').value = params.get('email');
if (/type=recovery/.test(location.hash)) mode = 'reset';



function setMode(m) {
  mode = m;
  const T = {
    login: ['Selamat datang kembali', 'Masuk ke Studio', 'Masuk', 'Belum punya akun?', 'Daftar gratis'],
    signup: ['Akun gratis', 'Buat akun', 'Daftar', 'Sudah punya akun?', 'Masuk'],
    forgot: ['Lupa password', 'Atur ulang password', 'Kirim link reset', 'Ingat password?', 'Masuk'],
    reset: ['Password baru', 'Buat password baru', 'Simpan password', 'Kembali ke', 'Masuk'],
  }[m];
  $('#eyebrow').textContent = T[0]; $('#title').textContent = T[1]; $('#submit').textContent = T[2];
  $('#switch').firstChild.textContent = T[3] + ' '; $('#toggle').textContent = T[4];
  $('#nameWrap').hidden = m !== 'signup';
  $('#emailWrap').hidden = m === 'reset';
  $('#pwWrap').hidden = m === 'forgot';
  $('#pw2Wrap').hidden = !(m === 'signup' || m === 'reset'); $('#pw2').value = ''; pwHint();
  $('#pw').autocomplete = m === 'login' ? 'current-password' : 'new-password';
  $('#forgot').hidden = m !== 'login';
  $('#err').textContent = ''; $('#ok').textContent = '';
  document.title = T[1] + ' · Jersey Pattern Lab';
}
$('#toggle').onclick = () => setMode(mode === 'login' ? 'signup' : 'login');
$('#forgot').onclick = () => setMode('forgot');

const MSG = {
  'Invalid login credentials': 'Email atau password salah.',
  'Email not confirmed': 'Email belum dikonfirmasi. Cek kotak masuk (dan folder spam) untuk link konfirmasi.',
  'User already registered': 'Email ini sudah terdaftar. Silakan masuk.',
  'email rate limit exceeded': 'Server sedang sibuk mengirim email. Tunggu beberapa menit lalu coba lagi, atau hubungi admin via WhatsApp 0896-3454-7665.',
  'Email rate limit exceeded': 'Server sedang sibuk mengirim email. Tunggu beberapa menit lalu coba lagi, atau hubungi admin via WhatsApp 0896-3454-7665.',
};
$('#form').onsubmit = async e => {
  e.preventDefault();
  const email = $('#email').value.trim(), pw = $('#pw').value, btn = $('#submit');
  $('#err').textContent = ''; $('#ok').textContent = '';
  if (mode !== 'reset' && !/^\S+@\S+\.\S+$/.test(email)) { $('#err').textContent = 'Tulis email yang valid.'; return; }
  if (mode !== 'forgot' && pw.length < 8) { $('#err').textContent = 'Password minimal 8 karakter.'; return; }
  if (needsConfirm() && pw !== $('#pw2').value) { $('#err').textContent = 'Password dan ulangi password belum sama.'; $('#pw2').focus(); return; }
  btn.disabled = true;
  try {
    if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password: pw });
      if (error) throw error;
      location.href = next;
    } else if (mode === 'signup') {
      const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { name: $('#name').value.trim(), ...signupAttribution() }, emailRedirectTo: location.origin + next } });
      if (error) throw error;
      if (data.session) location.href = next;
      else $('#ok').textContent = 'Akun dibuat. Cek email kamu dan klik link konfirmasi, lalu masuk.';
    } else if (mode === 'forgot') {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/login' });
      if (error) throw error;
      $('#ok').textContent = 'Kalau email itu terdaftar, link atur ulang password sudah kami kirim. Cek kotak masuk dan folder spam. Link hanya berlaku sementara.';
    } else if (mode === 'reset') {
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) throw error;
      $('#ok').textContent = 'Password tersimpan. Mengalihkan ke akunmu…';
      setTimeout(() => location.href = '/akun', 900);
    }
  } catch (err) {
    $('#err').textContent = MSG[err.message] || (/rate limit/i.test(err.message || '') ? MSG['email rate limit exceeded'] : null) || err.message || 'Terjadi kesalahan. Coba lagi.';
  } finally { btn.disabled = false; }
};

setMode(mode);
mountNav('login');
