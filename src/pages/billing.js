import '../styles/base.css';
import '../styles/page.css';
import { sb, getMe, planOf, getSettings } from '../lib/supabase.js';
import { mountNav } from '../lib/nav.js';
import { $, E, rp, fmtDate, toast, waLink, shrinkImage } from '../lib/ui.js';

const STATUS = { pending: 'Menunggu verifikasi', approved: 'Disetujui', rejected: 'Ditolak' };

(async () => {
  const me = await mountNav('billing');
  if (!me) { location.href = '/login?next=/billing'; return; }
  const set = await getSettings().catch(() => ({}));
  const sub = set.subscription || { price: 150000, days: 30 };
  const price = +sub.price || 150000;
  const bca = set.bca || {}; const wa = (set.whatsapp || '6289634547665').replace(/\D/g, '');
  $('#price').textContent = rp(price); $('#amount').textContent = rp(price);
  $('#bank').textContent = bca.bank || 'BCA'; $('#acctNo').textContent = bca.account_no || '—';
  $('#acctName').textContent = bca.account_name ? 'a.n. ' + bca.account_name : '';
  $('#copyAcct').onclick = () => navigator.clipboard?.writeText(bca.account_no || '').then(() => toast('Nomor rekening tersalin'), () => toast('Salin manual: ' + bca.account_no));
  $('#waConfirm').href = waLink(`Halo admin Jersey Pattern Lab, saya sudah transfer ${rp(price)} untuk langganan Pro. Email akun: ${me.user.email}`, wa);

  const { data: plan } = await sb.from('plans').select('features').eq('id', 'pro').maybeSingle();
  const feats = plan?.features || ['Mode Advanced penuh', 'Export pattern hingga 3000 px', 'Export pola jahit skala 1:1', 'Snapshot 3D hingga 4096 px', 'Project tanpa batas'];
  $('#feat').replaceChildren(...feats.map(f => E('li', { text: f })));

  function renderStatus() {
    const p = me.profile, eff = planOf(me);
    const st = $('#status'); st.replaceChildren();
    if (p.role === 'admin') st.append('Akun admin: semua fitur Pro aktif.');
    else if (eff === 'pro') st.append('Status: ', E('span', { className: 'pill-s pro', text: 'PRO' }), ' aktif sampai ', E('b', { text: fmtDate(p.plan_until) }), '. Bayar lagi sebelum tanggal itu untuk memperpanjang.');
    else st.append('Status: ', E('b', { text: 'Gratis' }), p.plan_until ? ` (Pro berakhir ${fmtDate(p.plan_until)})` : '', '. Upgrade untuk membuka mode Advanced dan semua export file.');
  }
  renderStatus();

  async function loadHist() {
    const { data } = await sb.from('payments').select('id,created_at,subscription_plan,amount,status,note').eq('user_id', me.user.id).order('created_at', { ascending: false });
    const tb = $('#hist tbody'); tb.replaceChildren();
    if (!data || !data.length) { tb.append(E('tr', {}, E('td', { colSpan: 5, className: 'empty', text: 'Belum ada pembayaran.' }))); return data || []; }
    data.forEach(r => tb.append(E('tr', {},
      E('td', { text: fmtDate(r.created_at) }), E('td', { text: r.subscription_plan ? 'Pro 30 hari' : 'Pesanan' }),
      E('td', { className: 'num', text: rp(r.amount) }),
      E('td', {}, E('span', { className: 'pill-s ' + r.status, text: STATUS[r.status] || r.status })),
      E('td', { text: r.note || '—' }))));
    return data;
  }
  let hist = await loadHist();
  const pending = () => hist.some(h => h.status === 'pending');
  if (pending()) $('#ok').textContent = 'Ada pembayaran yang sedang diverifikasi admin.';

  $('#proof').onchange = async e => {
    const f = e.target.files[0]; const img = $('#proofPrev');
    if (!f) { img.hidden = true; return; }
    img.src = URL.createObjectURL(f); img.hidden = false;
  };
  $('#payForm').onsubmit = async e => {
    e.preventDefault();
    $('#err').textContent = ''; $('#ok').textContent = '';
    const f = $('#proof').files[0];
    if (!f) { $('#err').textContent = 'Pilih foto bukti transfer dulu.'; return; }
    if (f.size > 5e6) { $('#err').textContent = 'File terlalu besar. Maksimal 5 MB.'; return; }
    if (pending()) { $('#err').textContent = 'Masih ada pembayaran yang menunggu verifikasi. Tunggu admin memprosesnya dulu.'; return; }
    const btn = $('#send'); btn.disabled = true; btn.textContent = 'Mengirim…';
    try {
      const { canvas } = await shrinkImage(f, 1600, 'image/jpeg', .85);
      const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', .85));
      const path = `${me.user.id}/${Date.now()}.jpg`;
      const up = await sb.storage.from('payment-proofs').upload(path, blob, { contentType: 'image/jpeg' });
      if (up.error) throw up.error;
      const ins = await sb.from('payments').insert({ user_id: me.user.id, subscription_plan: 'pro', amount: price, proof_url: path, note: $('#note').value.trim() || null });
      if (ins.error) throw ins.error;
      // Meta Pixel: calon member kirim bukti bayar = InitiateCheckout
      try { if (typeof fbq !== 'undefined') fbq('track', 'InitiateCheckout', { value: price, currency: 'IDR', num_items: 1 }); } catch {}
      $('#ok').textContent = 'Bukti transfer terkirim. Admin akan memverifikasi, dan status Pro aktif setelah disetujui.';
      $('#payForm').reset(); $('#proofPrev').hidden = true;
      hist = await loadHist();
    } catch (err) {
      $('#err').textContent = 'Gagal mengirim: ' + (err.message || err);
    } finally { btn.disabled = false; btn.textContent = 'Kirim bukti transfer'; }
  };
})();
