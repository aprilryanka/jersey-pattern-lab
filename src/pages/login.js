import '../styles/base.css';
import '../styles/auth.css';
import { sb } from '../lib/supabase.js';
import { mountNav } from '../lib/nav.js';
import { $ } from '../lib/ui.js';

const params = new URLSearchParams(location.search);
const next = (params.get('next') || '/studio').startsWith('/') ? params.get('next') || '/studio' : '/studio';
let mode = params.get('mode') === 'signup' ? 'signup' : 'login';
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
};
$('#form').onsubmit = async e => {
  e.preventDefault();
  const email = $('#email').value.trim(), pw = $('#pw').value, btn = $('#submit');
  $('#err').textContent = ''; $('#ok').textContent = '';
  if (mode !== 'reset' && !/^\S+@\S+\.\S+$/.test(email)) { $('#err').textContent = 'Tulis email yang valid.'; return; }
  if (mode !== 'forgot' && pw.length < 8) { $('#err').textContent = 'Password minimal 8 karakter.'; return; }
  btn.disabled = true;
  try {
    if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password: pw });
      if (error) throw error;
      location.href = next;
    } else if (mode === 'signup') {
      const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { name: $('#name').value.trim() }, emailRedirectTo: location.origin + next } });
      if (error) throw error;
      if (data.session) location.href = next;
      else $('#ok').textContent = 'Akun dibuat. Cek email kamu dan klik link konfirmasi, lalu masuk.';
    } else if (mode === 'forgot') {
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/login' });
      if (error) throw error;
      $('#ok').textContent = 'Link reset terkirim. Cek email kamu.';
    } else if (mode === 'reset') {
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) throw error;
      $('#ok').textContent = 'Password tersimpan. Mengalihkan ke Studio…';
      setTimeout(() => location.href = '/studio', 900);
    }
  } catch (err) {
    $('#err').textContent = MSG[err.message] || err.message || 'Terjadi kesalahan. Coba lagi.';
  } finally { btn.disabled = false; }
};

setMode(mode);
mountNav('login');
