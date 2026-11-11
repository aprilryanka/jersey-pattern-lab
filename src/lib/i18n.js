// Sistem bahasa ID / EN.
// Teks sumber tetap bahasa Indonesia di HTML dan JS. Saat bahasa EN aktif, modul ini
// menerjemahkan teks yang tampil (termasuk yang dibuat JS belakangan) memakai kamus di bawah.
// Teks yang tidak ada di kamus dibiarkan apa adanya, jadi aman untuk konten buatan pengguna.
//
// Urutan pemilihan bahasa: ?lang=en|id di URL → pilihan tersimpan → bahasa browser / zona waktu.
// Pengunjung dari Indonesia (bahasa browser "id" atau zona waktu WIB/WITA/WIT) otomatis ID, lainnya EN.

const KEY = 'jpl-lang';
const ID_TZ = /^Asia\/(Jakarta|Pontianak|Makassar|Jayapura)$/;

function detect() {
  // Halaman yang isinya satu bahasa (mis. /license berbahasa Inggris) mengunci bahasanya lewat
  // <meta name="jpl-lang" content="en">. Tidak disimpan, jadi tidak mengubah pilihan di halaman lain.
  const forced = document.querySelector('meta[name="jpl-lang"]')?.content;
  if (forced === 'en' || forced === 'id') return forced;
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'id') { localStorage.setItem(KEY, q); return q; }
  } catch { /* abaikan */ }
  try { const s = localStorage.getItem(KEY); if (s === 'en' || s === 'id') return s; } catch { /* mode privat */ }
  const langs = navigator.languages || [navigator.language || ''];
  if (langs.some(l => /^(id|in)\b/i.test(l))) return 'id';
  try { if (ID_TZ.test(Intl.DateTimeFormat().resolvedOptions().timeZone)) return 'id'; } catch { /* abaikan */ }
  return 'en';
}

export const lang = detect();
export const isEn = lang === 'en';
/** Locale untuk format tanggal & angka non-rupiah. */
export const locale = isEn ? 'en-US' : 'id-ID';

export function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch { /* abaikan */ }
  const u = new URL(location.href);
  u.searchParams.delete('lang');
  location.href = u.pathname + u.search + u.hash;
}

/* ------------------------------------------------------------------ */
/* Kamus: teks Indonesia persis → teks Inggris                         */
/* ------------------------------------------------------------------ */
const EN = {
  // ---- umum / navigasi
  'Beranda': 'Home', 'Studio': 'Studio', 'Harga': 'Pricing', 'FAQ': 'FAQ', 'Akun': 'Account', 'Langganan': 'Subscription',
  'Admin': 'Admin', 'Navigasi utama': 'Main navigation', 'GRATIS': 'FREE', 'Gratis': 'Free', 'Akun saya': 'My account',
  'Keluar': 'Sign out', 'Buka Studio': 'Open Studio', 'Masuk': 'Sign in', 'Mulai desain': 'Start designing', 'Menu': 'Menu',
  'Menyiapkan Studio…': 'Preparing Studio…', 'Membuka Studio…': 'Opening Studio…', 'Menyiapkan…': 'Preparing…', 'Selesai': 'Done',
  'Tutup': 'Close', 'Tampilkan password': 'Show password', 'Sembunyikan password': 'Hide password',
  'Ganti ke mode terang': 'Switch to light mode', 'Ganti ke mode gelap': 'Switch to dark mode', 'Mode terang': 'Light mode', 'Mode gelap': 'Dark mode',
  'Mode pratinjau: tampilan saja. Login, langganan, dan data database aktif setelah deploy.': 'Preview mode: display only. Sign-in, subscriptions and database data work after deploy.',
  'Memuat…': 'Loading…', 'Menyimpan…': 'Saving…', 'Mengirim…': 'Sending…', 'Simpan': 'Save', 'Hapus': 'Delete', 'Buka': 'Open',
  'Yakin?': 'Sure?', 'Kembali': 'Back', 'Lanjut': 'Next', 'Lewati': 'Skip', 'Salin': 'Copy', 'Siap': 'Ready',

  // ---- landing: hero & bab
  'Jersey 3D interaktif': 'Interactive 3D jersey',
  'Generator pattern · Pratinjau 3D · Pola jahit': 'Pattern generator · 3D preview · Sewing pattern',
  'Desain jersey, lihat di 3D, langsung jadi pola jahit.': 'Design a jersey, see it in 3D, get a print-ready sewing pattern.',
  'Pilih motif atau racik pattern sendiri, tambah nama, nomor, logo, dan sponsor. Semuanya tampil di model 3D dan diekspor sebagai pola jahit skala 1:1 yang siap dicetak.':
    'Pick a motif or build your own pattern, then add names, numbers, logos and sponsors. Everything shows on a 3D model and exports as a 1:1 scale sewing pattern, ready to print.',
  'Mulai desain gratis': 'Start designing free', 'Lihat harga': 'See pricing',
  'Pratinjau 3D realistis': 'Realistic 3D preview',
  'Kainnya terasa, bukan gambar datar.': 'You can feel the fabric, not a flat picture.',
  'Rajutan, kilap serat, jahitan panel, dan bayangan lantai ikut dihitung. Latar studio, polos, atau transparan untuk materi promosi.':
    'Knit texture, fiber sheen, panel seams and floor shadow are all rendered. Studio, solid or transparent backgrounds for your promo materials.',
  'Detail kain': 'Fabric details', 'Rajut 2,7 mm': '2.7 mm knit', 'Kilap serat': 'Fiber sheen', 'Jahitan tiap panel': 'Seams on every panel',
  'Pola jahit skala 1:1': '1:1 scale sewing pattern',
  'Satu desain, jadi pola siap cetak.': 'One design, one print-ready pattern.',
  'Setiap panel diekspor lengkap dengan desain, garis potong, dan arah serat. Motif menyambung di jahitan sisi seperti kain fullprint.':
    'Every panel exports with its design, cut lines and grain direction. The motif continues across the side seams, just like full-print fabric.',
  'Ukuran panel': 'Panel sizes',
  'Racik pattern sampai ketemu.': 'Mix patterns until it clicks.',
  'Motif': 'Motif', 'Palet': 'Palette', 'Warna sendiri': 'Your colors', 'Warna 1': 'Color 1', 'Warna 2': 'Color 2', 'Warna 3': 'Color 3',
  'Acak pattern': 'Randomize pattern',
  'Setiap klik membuat kombinasi baru. Mode Advanced di Studio menambah 9 gaya noise, 12 palet, efek glass, dan foto sebagai sumber pattern.':
    'Every click makes a new combination. Advanced mode in the Studio adds 9 noise styles, 12 palettes, glass effects and photos as a pattern source.',
  'Nama, nomor, dan font tim kamu.': 'Your team name, numbers and font.',
  'Nama tim': 'Team name', 'Nomor': 'Number', 'Nama pemain': 'Player name', 'Font': 'Font', 'Animasi masuk': 'Intro animation',
  'Muncul': 'Rise', 'Ketik': 'Type', 'Glitch': 'Glitch', 'Tanpa': 'None', 'Putar animasi': 'Play animation', 'Posisi kamera': 'Camera position',
  'Depan': 'Front', 'Belakang': 'Back', 'Kerah': 'Collar', 'Lengan': 'Sleeve', 'Kain': 'Fabric', 'Samping': 'Side',
  'Lanjut di Studio': 'Continue in Studio', '28 font jersey, logo, dan sponsor ada di Studio.': '28 jersey fonts, logos and sponsors are in the Studio.',
  'Bagian': 'Sections', 'Gulir untuk mendekat': 'Scroll to zoom in', 'Memuat model 3D…': 'Loading 3D model…',
  'Intro': 'Intro', 'Pola jahit': 'Sewing pattern', 'Pattern': 'Pattern', 'Nama dan nomor': 'Name and number',

  // ---- landing: alur, harga, cetak, testimoni, faq, footer
  'Alurnya': 'How it works', 'Desain di Studio': 'Design in the Studio',
  'Pilih motif, atur warna, tambah nama dan nomor pemain.': 'Pick a motif, set the colors, add player names and numbers.',
  'Export pola jahit': 'Export the sewing pattern',
  'Unduh SVG skala 1:1 untuk printer sublimasi atau tim produksi.': 'Download a 1:1 scale SVG for your sublimation printer or production team.',
  'Cetak jersey fisik': 'Print physical jerseys',
  'Kirim ke kami lewat WhatsApp. Estimasi 14 hari kerja untuk di bawah 100 pcs.': 'Send it to us on WhatsApp. About 14 working days for orders under 100 pcs.',
  'Jadikan desain jersey kamu menjadi jersey fisik.': 'Turn your jersey design into real jerseys.',
  'Pesan cetak via WhatsApp': 'Order printing via WhatsApp', 'Kata pelanggan': 'What customers say', 'Pertanyaan umum': 'FAQ',
  'Jersey Pattern Lab, beranda': 'Jersey Pattern Lab, home', 'Tautan footer': 'Footer links',
  'Kelola langganan': 'Manage subscription', 'Berlangganan Pro': 'Subscribe to Pro', 'Mulai gratis': 'Start free',
  '/ bulan': '/ month', 'selamanya': 'forever',
  'Mode Basic: 8 motif': 'Basic mode: 8 motifs', 'Pratinjau 3D dan pola jahit 2D': '3D preview and 2D sewing pattern',
  'Simpan 3 project': 'Save 3 projects', 'Tanpa export file': 'No file export', 'Mode Advanced penuh': 'Full Advanced mode',
  'Export pattern hingga 3000 px': 'Pattern export up to 3000 px', 'Export pola jahit skala 1:1 (SVG/PNG)': '1:1 scale sewing pattern export (SVG/PNG)',
  'Export pola jahit skala 1:1': '1:1 scale sewing pattern export', 'Snapshot 3D hingga 4096 px': '3D snapshots up to 4096 px',
  'Project tanpa batas': 'Unlimited projects', 'Semua fitur Pro': 'All Pro features', '5 anggota': '5 members', 'Prioritas produksi': 'Production priority',
  'Apa bedanya Basic dan Advanced?': 'What is the difference between Basic and Advanced?',
  'Basic berisi 8 motif cepat. Advanced memakai generator pattern Jersey Pattern Lab lengkap: 9 gaya noise, palet, finishing, efek glass, brush, dan foto sebagai sumber pattern. Advanced penuh khusus member Pro.':
    'Basic has 8 quick motifs. Advanced uses the full Jersey Pattern Lab pattern generator: 9 noise styles, palettes, finishing, glass effects, brushes and photos as a pattern source. Full Advanced is for Pro members.',
  'Basic berisi 8 motif cepat (garis, chevron, gelombang, gradien, shards, kamuflase, halftone, polos). Advanced memakai generator pattern Jersey Pattern Lab: 9 gaya noise, palet, finishing, efek glass, brush, dan foto sebagai sumber pattern. Advanced penuh khusus member Pro.':
    'Basic has 8 quick motifs (stripes, chevron, waves, gradient, shards, camo, halftone, solid). Advanced uses the Jersey Pattern Lab pattern generator: 9 noise styles, palettes, finishing, glass effects, brushes and photos as a pattern source. Full Advanced is for Pro members.',
  'Berapa harga langganan Pro?': 'How much is the Pro subscription?',
  'Rp150.000 per bulan (30 hari).': 'Rp150,000 per month (30 days).',
  'Rp150.000 per bulan (30 hari). Pro membuka mode Advanced penuh dan semua export: pattern hingga 3000 px, pola jahit skala 1:1, dan snapshot 3D hingga 4096 px, plus project tanpa batas. Akun gratis bisa mendesain dan melihat hasilnya, tapi tidak bisa mengunduh file.':
    'Rp150,000 per month (30 days). Pro unlocks full Advanced mode and every export: patterns up to 3000 px, 1:1 scale sewing patterns and 3D snapshots up to 4096 px, plus unlimited projects. Free accounts can design and preview, but cannot download files.',
  'Bagaimana cara berlangganan?': 'How do I subscribe?',
  'Buat akun, buka halaman Langganan, transfer ke rekening BCA yang tertera, lalu upload bukti transfer. Admin memverifikasi dan akun Pro aktif 30 hari.':
    'Create an account, open the Subscription page, transfer to the BCA account shown and upload your proof of payment. An admin verifies it and Pro is active for 30 days. Paying from outside Indonesia? Message us on WhatsApp for an international payment option.',
  'Berapa lama pengerjaan jersey fisik?': 'How long does physical jersey production take?',
  'Estimasi 14 hari kerja untuk pesanan di bawah 100 pcs. Untuk 100 pcs ke atas, estimasi dikonfirmasi lewat WhatsApp.':
    'About 14 working days for orders under 100 pcs. For 100 pcs or more, we confirm the timeline on WhatsApp.',
  'Berapa harga jersey fisik?': 'How much do physical jerseys cost?',
  '1–11 pcs Rp165.000/pcs, 12–23 pcs Rp155.000, min. 24 pcs Rp150.000, min. 60 pcs Rp135.000, min. 120 pcs Rp125.000, min. 300 pcs Rp110.000. Di atas 300 pcs, chat WhatsApp.':
    '1–11 pcs Rp165,000/pc, 12–23 pcs Rp155,000, min. 24 pcs Rp150,000, min. 60 pcs Rp135,000, min. 120 pcs Rp125,000, min. 300 pcs Rp110,000. Above 300 pcs, chat with us on WhatsApp.',
  'File apa yang perlu disiapkan untuk cetak?': 'What files do I need for printing?',
  'Logo asli (PNG transparan atau vektor), file pola jahit dari Studio, rincian ukuran, serta nama dan nomor pemain.':
    'Original logos (transparent PNG or vector), the sewing pattern file from the Studio, a size breakdown, and player names and numbers.',
  'Apa isi export pola jahit?': 'What is in the sewing pattern export?',
  'File SVG skala 1:1 dalam milimeter berisi tiap panel (depan, belakang, lengan, rib) lengkap dengan desain dan garis potong, siap dibuka di Illustrator, CorelDraw, atau Inkscape, plus PNG resolusi cetak.':
    'A 1:1 scale SVG in millimeters with every panel (front, back, sleeves, rib) including the design and cut lines, ready for Illustrator, CorelDraw or Inkscape, plus a print-resolution PNG.',
  'Halo Jerseypreneur, saya mau cetak jersey fullprint dari desain Jersey Pattern Lab. Boleh info harga dan bahan?':
    'Hi Jerseypreneur, I would like to print full-print jerseys from my Jersey Pattern Lab design. Could you share prices and fabric options?',
  'Halo, saya mau cetak jersey fisik dari Jersey Pattern Lab': 'Hi, I would like to print physical jerseys from Jersey Pattern Lab',
  'Panggung 3D tidak bisa dimuat, memakai tampilan statis.': '3D stage could not load, using the static view.',

  // ---- login
  'Selamat datang kembali': 'Welcome back', 'Masuk ke Studio': 'Sign in to the Studio', 'Nama': 'Name', 'Email': 'Email', 'Password': 'Password',
  'Ulangi password': 'Repeat password', 'Lupa password?': 'Forgot password?', 'Belum punya akun?': "Don't have an account?", 'Daftar gratis': 'Sign up free',
  'Akun gratis': 'Free account', 'Buat akun': 'Create account', 'Daftar': 'Sign up', 'Sudah punya akun?': 'Already have an account?',
  'Lupa password': 'Forgot password', 'Atur ulang password': 'Reset password', 'Kirim link reset': 'Send reset link', 'Ingat password?': 'Remember your password?',
  'Password baru': 'New password', 'Buat password baru': 'Create a new password', 'Simpan password': 'Save password', 'Kembali ke': 'Back to',
  'Ketik ulang password di kolom kedua.': 'Type the password again in the second field.', 'Password belum sama.': "Passwords don't match yet.",
  '✓ Password cocok.': '✓ Passwords match.', 'Email atau password salah.': 'Wrong email or password.',
  'Email belum dikonfirmasi. Cek kotak masuk (dan folder spam) untuk link konfirmasi.': 'Email not confirmed yet. Check your inbox (and spam folder) for the confirmation link.',
  'Email ini sudah terdaftar. Silakan masuk.': 'This email is already registered. Please sign in.',
  'Server sedang sibuk mengirim email. Tunggu beberapa menit lalu coba lagi, atau hubungi admin via WhatsApp 0896-3454-7665.':
    'Our server is busy sending emails. Wait a few minutes and try again, or contact the admin on WhatsApp +62 896-3454-7665.',
  'Tulis email yang valid.': 'Enter a valid email.', 'Password minimal 8 karakter.': 'Password must be at least 8 characters.',
  'Password dan ulangi password belum sama.': "Password and repeat password don't match.",
  'Akun dibuat. Cek email kamu dan klik link konfirmasi, lalu masuk.': 'Account created. Check your email, click the confirmation link, then sign in.',
  'Kalau email itu terdaftar, link atur ulang password sudah kami kirim. Cek kotak masuk dan folder spam. Link hanya berlaku sementara.':
    'If that email is registered, we have sent a password reset link. Check your inbox and spam folder. The link expires soon.',
  'Password tersimpan. Mengalihkan ke akunmu…': 'Password saved. Redirecting to your account…', 'Terjadi kesalahan. Coba lagi.': 'Something went wrong. Please try again.',

  // ---- akun
  'Dashboard pengguna': 'User dashboard', 'Memuat akun…': 'Loading account…', 'Status': 'Status', 'Sisa masa Pro': 'Pro time left',
  'Project tersimpan': 'Saved projects', 'Profil': 'Profile', 'Simpan profil': 'Save profile', 'Langganan Pro': 'Pro subscription',
  'Ganti password': 'Change password', 'Password saat ini': 'Current password', 'Ulangi password baru': 'Repeat new password',
  'Simpan password baru': 'Save new password', 'Lupa password saat ini?': 'Forgot your current password?',
  'Semua fitur Pro aktif': 'All Pro features active', 'Tanpa batas': 'Unlimited', 'Aktif': 'Active', 'Perpanjang Pro': 'Renew Pro',
  'Upgrade untuk mode Advanced & export': 'Upgrade for Advanced mode & exports', '0 hari': '0 days', 'Belum berlangganan': 'Not subscribed',
  'Profil tersimpan.': 'Profile saved.', 'Ketik ulang password baru.': 'Type the new password again.', 'Password baru belum sama.': "New passwords don't match yet.",
  'Isi password saat ini.': 'Enter your current password.', 'Password baru minimal 8 karakter.': 'New password must be at least 8 characters.',
  'Password baru dan ulangi password belum sama.': "New password and repeat password don't match.",
  'Password baru harus berbeda dari password saat ini.': 'The new password must be different from the current one.',
  'Password saat ini salah.': 'Current password is wrong.',
  'Password berhasil diganti. Gunakan password baru saat masuk berikutnya.': 'Password changed. Use the new password next time you sign in.',
  'Password baru harus berbeda dari yang lama.': 'The new password must be different from the old one.', 'Gagal mengganti password.': 'Could not change the password.',

  // ---- langganan / billing
  '/ 30 hari': '/ 30 days', 'Cara bayar': 'How to pay', 'ke rekening berikut.': 'to the account below.',
  'Upload foto atau screenshot bukti transfer di bawah ini.': 'Upload a photo or screenshot of your transfer receipt below.',
  'Admin memverifikasi (biasanya di hari yang sama). Pro aktif 30 hari, dan diperpanjang otomatis dari tanggal berakhir bila kamu bayar sebelum habis.':
    'An admin verifies it (usually the same day). Pro is active for 30 days and extends from the end date if you pay before it expires.',
  'Bukti transfer (JPG/PNG, maks. 5 MB)': 'Transfer receipt (JPG/PNG, max. 5 MB)', 'Pratinjau bukti transfer': 'Receipt preview',
  'Catatan (opsional)': 'Note (optional)', 'Misal: transfer atas nama Budi, BCA': 'E.g. transfer from Budi, BCA',
  'Kirim bukti transfer': 'Send receipt', 'Tanya admin via WhatsApp': 'Ask the admin on WhatsApp', 'Riwayat pembayaran': 'Payment history',
  'Tanggal': 'Date', 'Paket': 'Plan', 'Jumlah': 'Amount', 'Catatan admin': 'Admin note',
  'Menunggu verifikasi': 'Awaiting verification', 'Disetujui': 'Approved', 'Ditolak': 'Rejected', 'Nomor rekening tersalin': 'Account number copied',
  'Akun admin: semua fitur Pro aktif.': 'Admin account: all Pro features active.', 'Status:': 'Status:', 'aktif sampai': 'active until',
  '. Bayar lagi sebelum tanggal itu untuk memperpanjang.': '. Pay again before that date to extend.',
  '. Upgrade untuk membuka mode Advanced dan semua export file.': '. Upgrade to unlock Advanced mode and all file exports.',
  'Belum ada pembayaran.': 'No payments yet.', 'Pro 30 hari': 'Pro 30 days', 'Pesanan': 'Order',
  'Ada pembayaran yang sedang diverifikasi admin.': 'A payment is being verified by the admin.', 'Pilih foto bukti transfer dulu.': 'Choose a receipt photo first.',
  'File terlalu besar. Maksimal 5 MB.': 'File too large. Max 5 MB.',
  'Masih ada pembayaran yang menunggu verifikasi. Tunggu admin memprosesnya dulu.': 'A payment is still awaiting verification. Please wait for the admin to process it.',
  'Bukti transfer terkirim. Admin akan memverifikasi, dan status Pro aktif setelah disetujui.': 'Receipt sent. The admin will verify it and Pro activates once approved.',
  'Membayar dari luar Indonesia? Transfer BCA hanya untuk rekening Indonesia. Hubungi kami via WhatsApp untuk opsi pembayaran internasional.':
    'Paying from outside Indonesia? BCA transfer only works from Indonesian accounts. Message us on WhatsApp for an international payment option.',

  // ---- studio: bar & panel
  'Anda sedang menggunakan versi Gratis.': 'You are using the Free version.', 'Upgrade ke Pro →': 'Upgrade to Pro →',
  'Desain tanpa judul': 'Untitled design', 'Nama project': 'Project name', 'Tampilan': 'View', 'Split': 'Split', 'Pola': 'Panels', '3D': '3D',
  'Project saya': 'My projects', 'Export': 'Export', 'Mulai panduan': 'Start guide', 'Panduan': 'Guide', 'Satuan': 'Units',
  'Pola jahit. Seret untuk menggeser, scroll atau pinch untuk zoom.': 'Sewing pattern. Drag to pan, scroll or pinch to zoom.',
  'Perkecil': 'Zoom out', 'Perbesar': 'Zoom in', 'Fit': 'Fit', 'Pratinjau 3D': '3D preview', 'Model jersey': 'Jersey model', 'Sudut kamera': 'Camera angle',
  'Geser model: seret untuk menggeser, bukan memutar': 'Pan model: drag to move instead of rotate', 'Geser': 'Pan', 'Putar': 'Rotate',
  'Pratinjau 3D. Seret untuk memutar, aktifkan Geser atau klik kanan untuk menggeser, scroll untuk zoom.':
    '3D preview. Drag to rotate, turn on Pan or right-click to move, scroll to zoom.',
  'Live preview': 'Live preview', 'Pratinjau pattern': 'Pattern preview', 'Ulangan pratinjau': 'Preview repeat', 'Kontrol desain': 'Design controls',
  'Edit': 'Edit', 'Elemen': 'Elements', 'Mode generator': 'Generator mode', 'Basic': 'Basic', 'Advanced': 'Advanced',
  'Acak semua': 'Randomize all', 'Warna 1 (dasar)': 'Color 1 (base)', 'Palet cepat': 'Quick palettes', 'Acak warna': 'Random colors',
  'Acak bentuk': 'Random shapes', 'Ukuran motif': 'Motif size', 'Export SVG': 'SVG export',
  'Ubah pattern yang sedang kamu buat jadi vektor SVG berwarna datar. Bisa diperbesar tanpa pecah dan dibuka di Illustrator, CorelDraw, atau Inkscape.':
    'Turn your current pattern into a flat-color SVG vector. It scales without blurring and opens in Illustrator, CorelDraw or Inkscape.',
  'Buat SVG dari pattern': 'Make SVG from pattern', 'Edit pattern': 'Edit pattern', 'Skala': 'Scale', 'Rotasi': 'Rotation',
  'Geser horizontal': 'Horizontal offset', 'Geser vertikal': 'Vertical offset', 'Ulangan keliling badan': 'Repeats around the body',
  'Cermin horizontal': 'Mirror horizontally', 'Sambung motif depan–belakang': 'Join motif front–back',
  'Saat disambung, motif badan depan berlanjut ke belakang di jahitan sisi, seperti kain fullprint sungguhan.':
    'When joined, the front body motif continues onto the back at the side seams, like real full-print fabric.',
  'Reset edit': 'Reset edits', 'Isi per panel': 'Fill per panel',
  'Setiap panel bisa punya isi sendiri: pattern utama, warna polos, pattern sendiri (generate per panel), atau gambar yang kamu upload. Klik panel di pola 2D atau model 3D untuk memilihnya.':
    'Each panel can have its own fill: the main pattern, a solid color, its own pattern (generated per panel) or an image you upload. Click a panel on the 2D pattern or the 3D model to select it.',
  'Warna rib / trim default': 'Default rib / trim color', 'Tambah': 'Add', '+ Nama': '+ Name', '+ Nomor': '+ Number', '+ Teks': '+ Text',
  '+ Logo tim': '+ Team logo', '+ Sponsor': '+ Sponsor', '+ Logo apparel': '+ Apparel logo',
  'Upload PNG transparan, maksimal 8 MB. Seret di pola 2D untuk memindahkan.': 'Upload a transparent PNG, max 8 MB. Drag on the 2D pattern to move it.',
  'Layer': 'Layers', 'Isi teks': 'Text', 'Tinggi huruf': 'Letter height', 'Lebar gambar': 'Image width', 'Warna': 'Color', 'Garis tepi': 'Outline',
  'Tebal garis tepi': 'Outline width', 'Miring': 'Italic', 'Opasitas': 'Opacity', 'Panel': 'Panel', 'Tengah': 'Center', 'Duplikat': 'Duplicate',
  'Naikkan': 'Move up', 'Turunkan': 'Move down', 'Latar 3D': '3D background', 'Latar': 'Background', 'Polos': 'Solid', 'Transparan': 'Transparent',
  'Warna latar': 'Background color', 'Bayangan lantai': 'Floor shadow',
  'Latar ikut tersimpan di snapshot 3D. Transparan menghasilkan PNG tanpa latar.': 'The background is saved in 3D snapshots. Transparent gives a PNG with no background.',
  'Ukuran rajut': 'Knit size', 'Kedalaman tekstur': 'Texture depth', 'Sudah puas dengan desainnya?': 'Happy with your design?',
  '🧵 Cetak jersey fisik': '🧵 Print physical jerseys',

  // ---- studio: dinamis
  'Pattern utama': 'Main pattern', 'Warna polos': 'Solid color', 'Pattern sendiri': 'Own pattern', 'Upload gambar': 'Upload image',
  'Acak': 'Shuffle', 'Acak motif, warna, dan seed untuk panel ini': 'Shuffle motif, colors and seed for this panel', 'Seed baru': 'New seed',
  'Gambar': 'Image', '(kosong)': '(empty)', 'Ukuran ulangan': 'Repeat size', 'Zoom': 'Zoom', 'Isi': 'Fill',
  'Gambar terlalu besar, maksimal 8 MB': 'Image too large, max 8 MB', 'Gambar ditambahkan. Seret di pola 2D untuk memindahkan.': 'Image added. Drag on the 2D pattern to move it.',
  'Gambar tidak bisa dibaca': 'Could not read the image', 'Tile Advanced · bisa diulang tanpa sambungan': 'Advanced tile · repeats seamlessly',
  'Pattern saat ini (tile seamless)': 'Current pattern (seamless tile)', 'Pattern saat ini (area 60 × 60 cm)': 'Current pattern (60 × 60 cm area)',
  'Pola jahit lengkap (semua panel + teks)': 'Full sewing pattern (all panels + text)', 'Sumber': 'Source', 'Buat vector': 'Make vector',
  'Hasil vektor SVG': 'SVG vector result', 'Unduh SVG': 'Download SVG', 'Salin kode SVG': 'Copy SVG code', 'Unduh SVG khusus member Pro': 'SVG download is for Pro members',
  'Hasilnya berwarna datar (posterize), bukan foto asli. Makin banyak warna dan resolusi, makin detail tapi file makin besar.':
    'The result uses flat colors (posterized), not a photo. More colors and resolution give more detail but a bigger file.',
  'Export SVG pattern': 'Export pattern as SVG', 'Membuat vector…': 'Making vector…', 'Tidak ada bentuk yang bisa diproses.': 'No shapes to process.',
  'Buat ulang vector': 'Remake vector', 'SVG diunduh': 'SVG downloaded', 'Kode SVG disalin': 'SVG code copied', 'Tidak bisa menyalin, pakai Unduh SVG': "Couldn't copy, use Download SVG",
  'Jumlah warna': 'Number of colors', 'Kehalusan': 'Smoothness', 'Buang bintik kecil': 'Remove small specks', 'Mati': 'Off',
  'Haluskan gambar': 'Smooth image', 'Resolusi tracing': 'Tracing resolution',
  'Ada perubahan': 'Unsaved changes', 'Belum disimpan': 'Not saved', 'Batas project tercapai': 'Project limit reached',
  'Akun gratis bisa menyimpan 3 project. Hapus project lama, atau berlangganan Pro untuk project tanpa batas.':
    'Free accounts can save 3 projects. Delete an old project, or subscribe to Pro for unlimited projects.',
  'Berlangganan Pro · Rp150.000/bulan': 'Subscribe to Pro · Rp150,000/month', 'Project tidak ditemukan': 'Project not found', 'Dibuka': 'Opened',
  '+ Desain baru': '+ New design', 'Akun gratis: maksimal 3 project': 'Free account: up to 3 projects', 'Belum ada project tersimpan.': 'No saved projects yet.',
  'Project dihapus': 'Project deleted', 'Desain baru': 'New design', 'Pattern PNG/JPG hingga 3000 px': 'Pattern PNG/JPG up to 3000 px',
  'Pola jahit skala 1:1 (SVG vektor atau PNG cetak)': '1:1 scale sewing pattern (SVG vector or print PNG)',
  'Snapshot 3D hingga 4096 px, latar studio, polos, atau transparan': '3D snapshots up to 4096 px with studio, solid or transparent background',
  'Export khusus member Pro': 'Exports are for Pro members',
  'Akun gratis bisa mendesain dan melihat hasilnya di 2D dan 3D. Untuk mengunduh file, berlangganan Pro.':
    'Free accounts can design and preview in 2D and 3D. To download files, subscribe to Pro.',
  'Daftar dan berlangganan': 'Sign up and subscribe', 'Sudah punya akun? Masuk': 'Already have an account? Sign in',
  'Desainmu tetap tersimpan di browser ini.': 'Your design stays saved in this browser.', 'Upload gambar khusus member Pro': 'Image upload is for Pro members',
  'Pakai gambar sendiri sebagai isi panel atau sumber pattern hanya untuk member Pro. Generator pattern acak dan semua pilihan lain tetap gratis.':
    'Using your own images as a panel fill or pattern source is for Pro members. The random pattern generator and every other option stay free.',
  'Unduh pattern': 'Download pattern', 'SVG skala 1:1 (vektor + gambar)': '1:1 scale SVG (vector + image)', 'PNG lembar penuh': 'Full-sheet PNG',
  '72 dpi (cepat)': '72 dpi (fast)', '150 dpi (cetak)': '150 dpi (print)', 'Unduh pola jahit': 'Download sewing pattern', 'Sudut saat ini': 'Current angle',
  'Depan · belakang · samping': 'Front · back · side', 'Unduh snapshot 3D': 'Download 3D snapshot',
  'Tile pattern Advanced yang bisa diulang tanpa sambungan.': 'Advanced pattern tile that repeats seamlessly.', 'Motif Basic area 60 × 60 cm.': 'Basic motif, 60 × 60 cm area.',
  'Ukuran': 'Size', 'Format': 'Format', 'Export SVG (vektor)': 'SVG export (vector)', 'Resolusi gambar': 'Image resolution', 'Snapshot 3D': '3D snapshot', 'Sudut': 'Angle',
  'Menyiapkan pola jahit': 'Preparing sewing pattern', 'Pola jahit siap. Cetak pada skala 100%.': 'Sewing pattern ready. Print at 100% scale.',
  'Export gagal': 'Export failed', 'Merender snapshot 3D': 'Rendering 3D snapshot', 'Memeriksa akun…': 'Checking account…',
  'Memuat daftar model…': 'Loading model list…', 'Menggambar pola…': 'Drawing pattern…', 'Draft dipulihkan': 'Draft restored', 'Menyusun file SVG…': 'Building SVG file…', 'Menggambar desain…': 'Drawing design…',
  'GLB tidak berisi mesh.': 'The GLB contains no mesh.', 'Tidak ada mesh kain dengan UV pola (mm).': 'No fabric mesh with pattern UVs (mm).',

  // ---- studio: panduan
  'Basic atau Advanced': 'Basic or Advanced',
  'Basic berisi 8 motif cepat. Advanced memakai generator Jersey Pattern Lab lengkap: gaya noise, palet, finishing, efek glass, dan foto sebagai sumber pattern.':
    'Basic has 8 quick motifs. Advanced uses the full Jersey Pattern Lab generator: noise styles, palettes, finishing, glass effects and photos as a pattern source.',
  'Pilih dan acak motif': 'Pick and shuffle motifs',
  'Klik motif untuk memakainya. Tombol Acak semua mengganti motif, warna, dan bentuk sekaligus.': 'Click a motif to use it. Randomize all changes the motif, colors and shapes at once.',
  'Atur skala, rotasi, posisi, dan cermin pattern di seluruh jersey. Kamu juga bisa membuat panel tertentu (misalnya lengan atau rib) berwarna polos.':
    'Set the scale, rotation, position and mirroring of the pattern across the jersey. You can also make specific panels (like sleeves or rib) a solid color.',
  'Teks, logo, sponsor': 'Text, logos, sponsors',
  'Tambah nama, nomor, logo tim, dan sponsor. Upload PNG transparan untuk hasil terbaik.': 'Add names, numbers, team logos and sponsors. Upload transparent PNGs for the best result.',
  'Ubah pattern yang sedang kamu buat jadi vektor SVG berwarna datar, siap dibuka di Illustrator, CorelDraw, atau Inkscape. Pratinjau gratis, unduh khusus Pro.':
    'Turn your current pattern into a flat-color SVG vector, ready for Illustrator, CorelDraw or Inkscape. Preview is free, download is Pro.',
  'Pola jahit 2D': '2D sewing pattern',
  'Ini panel pola jahit asli dari file DXF. Seret teks atau logo untuk memindahkan, tarik kotak kecil di sudutnya untuk mengubah ukuran. Scroll atau pinch untuk zoom.':
    'These are the real sewing pattern panels from the DXF file. Drag text or logos to move them, pull the small corner box to resize. Scroll or pinch to zoom.',
  'Semua perubahan langsung tampil di model 3D. Seret untuk memutar, scroll untuk zoom, atau pilih sudut kamera. Aktifkan Geser (atau klik kanan) untuk menggeser model.':
    'Every change shows instantly on the 3D model. Drag to rotate, scroll to zoom, or pick a camera angle. Turn on Pan (or right-click) to move the model.',
  'Mode tampilan': 'View mode', 'Pilih Split, Pola, 3D, atau Pattern. Di HP, pakai satu tampilan saja agar lebih ringan.': 'Choose Split, Panels, 3D or Pattern. On phones, use a single view to keep it light.',
  'Latar dan kain': 'Background and fabric', 'Ganti latar studio, polos, atau transparan, dan atur tekstur rajutan kain.': 'Switch between studio, solid or transparent backgrounds and adjust the knit texture.',
  'Unduh pattern, pola jahit skala 1:1 (SVG/PNG), atau snapshot 3D. Pola jahit dan resolusi tinggi khusus member Pro.':
    'Download the pattern, a 1:1 scale sewing pattern (SVG/PNG) or a 3D snapshot. Sewing patterns and high resolution are for Pro members.',
  'Simpan project': 'Save project', 'Simpan desain ke akunmu supaya bisa dibuka lagi kapan saja.': 'Save the design to your account so you can open it again any time.',

  // ---- studio: Advanced generator
  'Halus': 'Smooth', 'Garis': 'Stripes', 'Blur foto': 'Photo blur', 'Detail': 'Detail', 'Lengkung': 'Warp', 'Kontras': 'Contrast',
  'Jumlah pita': 'Band count', 'Tepi lembut': 'Soft edges', 'Ukuran dot': 'Dot size', 'Pusaran': 'Swirl', 'Gelombang': 'Waves', 'Cipratan': 'Splatter',
  'Fade bawah': 'Bottom fade', 'Lebar glass': 'Glass width', 'Kekuatan glass': 'Glass strength', 'Ukuran brush': 'Brush size',
  'Vertikal': 'Vertical', 'Bulat': 'Round', 'Pratinjau tile pattern': 'Pattern tile preview', 'Tampilan tile': 'Tile view', 'Acak total': 'Randomize everything',
  '↶ Kembali': '↶ Undo', 'Acak tanpa fade bawah': 'Randomize without bottom fade', 'Sample desain': 'Design samples', 'Gaya': 'Style',
  'Simetris kiri-kanan': 'Left–right symmetry', 'Balik terang/gelap': 'Invert light/dark', 'Bentuk': 'Shape', 'Referensi warna': 'Color references',
  'Ambil warna dari gambar': 'Pick colors from image', 'Warna diambil dari gambar': 'Colors taken from the image', 'Pakai foto': 'Use photo',
  'Brush: lukis area glass di pratinjau': 'Brush: paint the glass area on the preview', 'Pilih foto': 'Choose photo',
  'Efek glass': 'Glass effect', 'Efek tambahan': 'Extra effects', 'Foto sebagai sumber': 'Photo as source',
  'Foto': 'Photo', 'TEKS': 'TEXT', 'NAMA': 'NAME', 'Neon Garis': 'Neon Stripes',

  // ---- motif Basic & font
  'Chevron': 'Chevron', 'Gradien': 'Gradient', 'Kamuflase': 'Camo', 'Graduate (kampus)': 'Graduate (college)',
};

/* Aturan untuk teks yang memuat angka/nama dinamis. */
const RULES = [
  [/^Pola #(\d+)$/, 'Pattern #$1'],
  [/^Minimal 8 karakter \((\d+)\/8\)\.$/, 'At least 8 characters ($1/8).'],
  [/^Halo, (.+)$/, 'Hi, $1'],
  [/^(.+) · bergabung (.+)$/, '$1 · joined $2'],
  [/^(\d+) hari$/, '$1 days'],
  [/^Berakhir (.+)$/, 'Ends $1'],
  [/^Pro berakhir (.+)$/, 'Pro ended $1'],
  [/^\(Pro berakhir (.+)\)$/, '(Pro ended $1)'],
  [/^a\.n\. (.+)$/, 'Account name: $1'],
  [/^Salin manual: (.*)$/, 'Copy manually: $1'],
  [/^Gagal mengirim: (.*)$/s, 'Failed to send: $1'],
  [/^Gagal menyimpan: (.*)$/s, 'Failed to save: $1'],
  [/^Gagal membuat vector: (.*)$/s, 'Failed to make vector: $1'],
  [/^Gagal: (.*)$/s, 'Failed: $1'],
  [/^Model 3D gagal dimuat: (.*)$/s, '3D model failed to load: $1'],
  [/^Tersimpan (.+)$/, 'Saved $1'],
  [/^Tersalin (.+)$/, 'Copied $1'],
  [/^Salin (#\w+)$/, 'Copy $1'],
  [/^Gambar dipasang di (.+)$/, 'Image placed on $1'],
  [/^Menyiapkan pattern (\d+) px$/, 'Preparing pattern $1 px'],
  [/^Menyiapkan panel (.+)…$/, 'Preparing panel $1…'],
  [/^Buka bagian (.+)$/, (m, s) => 'Open section ' + t(s)],
  [/^(Warna|Motif|Isi|Skala|Putar|Zoom|Ukuran ulangan|Upload gambar|Mode gambar|Palet) (.+)$/, (m, a, b) => (EN[a] || (a === 'Mode gambar' ? 'Image mode' : a)) + ' ' + panelLabel(b)],
  [/^(Depan|Belakang|Lengan)( · .+)$/, (m, a, b) => EN[a] + b],
  [/^(\d+) warna$/, '$1 colors'],
  [/^(.+) panel · ukuran (.+)$/, '$1 panels · size $2'],
  [/^Area (.+) cm$/, 'Area $1 cm'],
  [/^Atlas UV (.+) · tekstur (.+)$/, 'UV atlas $1 · texture $2'],
  [/^(\d+) warna · (\d+) lapis · (.+)$/, '$1 colors · $2 layers · $3'],
  [/^Semua (\d*) ?panel ukuran (.+) dengan desain, garis potong, dan arah serat\. Cetak 100% tanpa "fit to page"\.$/,
    'All $1 panels in size $2 with the design, cut lines and grain direction. Print at 100% without "fit to page".'],
  [/^Latar mengikuti pengaturan Tampilan \((transparan|polos|studio)\)\.$/, (m, a) => `Background follows the View setting (${({ transparan: 'transparent', polos: 'solid', studio: 'studio' })[a]}).`],
  [/^(.+) · Pro$/, (m, a) => t(a) + ' · Pro'],
  [/^Halo admin Jersey Pattern Lab, saya sudah transfer (.+) untuk langganan Pro\. Email akun: (.+)$/,
    'Hi Jersey Pattern Lab admin, I have transferred $1 for the Pro subscription. Account email: $2'],
  [/^(.+) · Jersey Pattern Lab$/, (m, a) => t(a) + ' · Jersey Pattern Lab'],
];

/* Nama panel pola jahit (dari DXF / database). */
const PANELS = {
  'Depan': 'Front', 'Belakang': 'Back', 'Lengan kanan': 'Right sleeve', 'Lengan kiri': 'Left sleeve',
  'Rib leher': 'Neck rib', 'Rib leher belakang': 'Back neck rib', 'Rib V kanan': 'Right V rib', 'Rib V kiri': 'Left V rib',
  'Rib belakang': 'Back rib', 'Rib depan': 'Front rib', 'Rib depan kanan': 'Right front rib', 'Rib depan kiri': 'Left front rib',
  'Kerah': 'Collar', 'Manset': 'Cuff',
};
export function panelLabel(s) {
  if (!isEn || !s) return s;
  if (PANELS[s]) return PANELS[s];
  const m = /^(.+?) (\d+)$/.exec(s);
  if (m && PANELS[m[1]]) return PANELS[m[1]] + ' ' + m[2];
  return s;
}

/** Terjemahkan satu teks (tanpa mengubah spasi di tepi). Variabel {nama} diganti dari vars. */
export function t(s, vars) {
  if (s == null) return s;
  let out = String(s);
  if (isEn) {
    const lead = out.match(/^\s*/)[0], trail = out.match(/\s*$/)[0];
    const core = out.trim();
    let tr = EN[core];
    if (tr == null && core) {
      for (const [re, rep] of RULES) { if (re.test(core)) { tr = core.replace(re, rep); break; } }
    }
    if (tr != null) out = lead + tr + trail;
  }
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return out;
}

/* ------------------------------------------------------------------ */
/* Terjemahan DOM otomatis (hanya saat EN)                             */
/* ------------------------------------------------------------------ */
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'NOSCRIPT']);
const hasLetters = s => /[A-Za-z]/.test(s);

function trText(node) {
  const v = node.nodeValue;
  if (!v || !hasLetters(v)) return;
  const p = node.parentElement;
  if (!p || SKIP.has(p.tagName) || p.closest('[data-no-i18n],[contenteditable="true"]')) return;
  const n = t(v);
  if (n !== v) node.nodeValue = n;
}
function trAttrs(el) {
  if (el.closest('[data-no-i18n]')) return;
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v && hasLetters(v)) { const n = t(v); if (n !== v) el.setAttribute(a, n); }
  }
  if (el.tagName === 'META' && /^(description|og:title|og:description)$/.test(el.getAttribute('name') || el.getAttribute('property') || '')) {
    const v = el.getAttribute('content'); const n = META[v]; if (n) el.setAttribute('content', n);
  }
}
function trTree(root) {
  if (root.nodeType === 3) { trText(root); return; }
  if (root.nodeType !== 1 && root.nodeType !== 9) return;
  if (root.nodeType === 1) { if (SKIP.has(root.tagName)) return; trAttrs(root); }
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    if (n.nodeType === 3) trText(n);
    else if (!SKIP.has(n.tagName)) trAttrs(n);
  }
}

const META = {
  'Generator pattern jersey dengan pratinjau 3D dan export pola jahit skala 1:1. Desain, lihat di 3D, lalu cetak jersey fullprint.':
    'Jersey pattern generator with 3D preview and 1:1 scale sewing pattern export. Design, see it in 3D, then print full-print jerseys.',
  'Desain jersey, lihat di 3D, langsung jadi pola jahit skala 1:1.': 'Design a jersey, see it in 3D, get a 1:1 scale sewing pattern.',
  'Desain jersey dengan generator pattern, lihat langsung di 3D, dan export pola jahit skala 1:1.':
    'Design jerseys with a pattern generator, see them live in 3D and export 1:1 scale sewing patterns.',
};

/** Elemen [data-lang="en"] hanya tampil di EN, [data-lang="id"] hanya di ID. */
function langOnly(root) {
  (root.querySelectorAll ? root : document).querySelectorAll('[data-lang]').forEach(el => { el.hidden = el.dataset.lang !== lang; });
}

function start() {
  document.documentElement.lang = lang;
  langOnly(document);
  if (!isEn) return;
  trTree(document.documentElement);
  if (document.title) document.title = t(document.title);
  new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'characterData') trText(m.target);
      else if (m.type === 'attributes') { if (m.target.nodeType === 1) trAttrs(m.target); }
      else m.addedNodes.forEach(trTree);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
start();

/* ------------------------------------------------------------------ */
/* Tombol pilih bahasa (dipasang di navbar)                            */
/* ------------------------------------------------------------------ */
export function langButton() {
  const wrap = document.createElement('div');
  wrap.className = 'lang-switch';
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', isEn ? 'Language' : 'Bahasa');
  wrap.dataset.noI18n = '';
  for (const [code, label, name] of [['id', 'ID', 'Bahasa Indonesia'], ['en', 'EN', 'English']]) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label; b.title = name; b.lang = code;
    b.setAttribute('aria-pressed', String(code === lang));
    b.onclick = () => { if (code !== lang) setLang(code); };
    wrap.append(b);
  }
  return wrap;
}
