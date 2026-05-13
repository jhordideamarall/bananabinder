# Sesi Rebranding & UI Refinement - 12 Mei 2026

## Konteks
Sesi ini difokuskan pada pembersihan total identitas "Petshop" (Pawvels) yang masih tertinggal di codebase setelah migrasi arsitektur. Selain rebranding teks dan warna, dilakukan juga perbaikan pada layout yang sempat "broken" akibat penghapusan fitur lama.

## Manifest File
- `apps/web/app/(shop)/page.tsx` (Modified: Fix layout, remove orange, delete unused icons, add Custom banner)
- `apps/web/components/layout/header.tsx` (Modified: Cleanup legacy shadow & search placeholder)
- `apps/web/components/layout/bottom-nav.tsx` (Modified: Rebrand Booking -> Custom, change icons)
- `apps/web/components/layout/desktop-nav.tsx` (Modified: Rebrand PawIcon -> BinderIcon, Booking -> Custom)
- `apps/web/app/layout.tsx` (Modified: Update metadata & SEO)
- `apps/web/components/shared/product-card.tsx` (Modified: Remove orange from logic/animate props)
- `apps/web/app/cart/page.tsx` (Modified: Update promo code & initial fallback)
- `packages/ui/src/components/*` (Modified: Batch replace orange to blue)
- `apps/web/app/booking/` (Deleted: Irrelevant feature)
- `apps/web/app/(account)/account/pets/` (Deleted: Irrelevant feature)

## Surgical Breakdown
### 1. Visual Identity
- Mengganti seluruh `rgba(224, 123, 57, ...)` menjadi `rgba(126, 200, 227, ...)` untuk konsistensi tema Biru Muda.
- Mengganti seluruh `#E07B39` menjadi `#7EC8E3`.
- Mengupdate `desktop-nav.tsx` dengan ikon binder murni SVG (menggantikan ikon telapak kaki).

### 2. User Experience (UX)
- Mengubah menu "Booking" di navigasi bawah dan desktop menjadi "Custom" agar lebih relevan dengan jasa pembuatan binder personal.
- Redesign Navigasi Bawah menjadi **Floating Apple Style Dock** (Melayang, Glassmorphism, Liquid Active Indicator).
- Menambahkan banner "Custom Order" di Home Page slider.

### 3. SEO & System
- Mengarahkan sitemap dan robots.txt ke domain `bananasbindery.com`.
- Mengupdate webhook payment contact email agar profesional.

## Validasi
- `pnpm tsc --noEmit` di `apps/web`: **LULUS** (Setelah menghapus 2 variabel unused).
- Visual Audit: Seluruh tombol "Tambah ke Keranjang" sekarang berwarna biru murni tanpa bayangan oranye.

## Catatan
Fitur Booking sudah dihapus total dari sisi client. Pastikan di sisi Supabase, tabel `bookings` dan `pets` tidak digunakan lagi untuk flow utama produk.
