# Jersey Pattern Lab v2

SaaS desain jersey: generator pattern (Basic + Advanced), pratinjau 3D, dan export pola jahit skala 1:1.
Stack: Vite (vanilla JS, multi-halaman) + Three.js + Supabase (auth, database, storage).

## Halaman

| Path | Isi |
| --- | --- |
| `/` | Landing: hero, fitur, alur, harga, CTA cetak via WhatsApp, testimoni (dari admin), FAQ, footer |
| `/login` | Masuk / daftar / lupa password (Supabase Auth email + password) |
| `/studio` | Editor: pola jahit 2D, 3D, Basic & Advanced, edit pattern, teks/logo/sponsor, export, guide tour, simpan project |
| `/billing` | Langganan Pro Rp150.000/30 hari: transfer BCA + upload bukti |
| `/admin` | Dashboard admin: ringkasan, verifikasi pembayaran, pengguna, model 3D (import GLB+DXF), pesanan, testimoni, FAQ, pengaturan |

## Jalankan lokal

```bash
npm install
cp .env.example .env   # sudah berisi URL & publishable key Supabase project jersey-pattern-lab
npm run dev
```

## Deploy ke Vercel

1. Import repo ini di vercel.com → New Project. Framework: **Vite** (otomatis). Build `npm run build`, output `dist`.
2. Environment variables:
   - `VITE_SUPABASE_URL` = `https://mwprkmudrelyxevdsncr.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = publishable key (lihat `.env.example`)
3. Setelah dapat domain (mis. `jersey-pattern-lab.vercel.app`), buka Supabase → Authentication → URL Configuration:
   - **Site URL**: domain Vercel kamu
   - **Redirect URLs**: `https://DOMAIN/**`
   Tanpa ini, link konfirmasi email dan reset password akan mengarah ke localhost.

## Database (Supabase)

Tabel utama: `profiles` (role, plan, plan_until), `projects`, `payments` (status pending/approved/rejected),
`plans`, `settings`, `faqs`, `testimonials`, `garment_models`, `orders`.
Fungsi admin: `review_payment(id, approve, note)`, `admin_users()`, `admin_stats()` (semua mengecek `is_admin()`).
Email di `settings.admin_emails` otomatis menjadi admin saat mendaftar.

## Model 3D baru (oleh admin)

Dari CLO3D ekspor dua file untuk satu garmen:
- **GLB** (glTF) dengan UV pola (Unified/Pattern UV) → koordinat UV = koordinat pola dalam mm.
- **DXF** pola (DXF-AAMA/ASTM) → garis potong tiap panel di layer 1.

Upload di Admin → Model 3D → Import. Panel dicocokkan otomatis ke mesh (bbox UV) dan perannya ditebak
dari posisi 3D (depan/belakang/lengan/rib); bisa dikoreksi sebelum disimpan.
