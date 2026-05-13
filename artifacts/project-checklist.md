# Bananasbindery Project Checklist 🐾

Dokumen ini adalah daftar tugas (TODO list) yang merangkum apa saja yang sudah selesai dan apa saja yang masih perlu dikerjakan, diurutkan berdasarkan strategi **Front-End First**.

## ✅ 0. Fondasi & Selesai

- [x] **Infrastruktur**: Monorepo Turborepo + pnpm + Next.js 15.
- [x] **Database**: 26 tabel Supabase, RLS, Trigger, dan Indexing.
- [x] **App Shell**: Layout Header & Bottom Nav (Mobile-First).
- [x] **Home Page**: Hero Banner 3D, Feature Strip, Category Chips, Grooming Banner.
- [x] **Native Optimization**: Safe area, Tap highlight fixes, dan Web App meta tags.
- [x] **Local State**: Zustand Cart Store dengan persistence.

---

## 🎨 1. Front-End UI/UX (Prioritas Saat Ini)

_Fokus: Slicing UI dari `user-flow.html` menjadi komponen premium._

### Phase A: Core E-Commerce UI

- [ ] **Product Listing (`/products`)**:
  - [ ] Grid produk dengan filter kategori.
  - [ ] Empty state & Skeleton loading.
- [ ] **Product Detail (`/products/[slug]`)**:
  - [ ] Image Gallery (Swipeable).
  - [ ] Varian selector (Size/Weight) & Quantity stepper.
  - [ ] Deskripsi produk & Related products.
- [ ] **Full Cart Page (`/cart`)**:
  - [ ] List belanja dengan edit quantity/remove.
  - [ ] Summary harga & CTA Checkout.

### Phase B: Auth & Account UI

- [ ] **Auth Pages**: Login, Register, dan OTP Input UI.
- [ ] **Account Pages**: Profile, Daftar Pesanan, Wishlist UI.
- [ ] **Pet Profile**: List hewan piaraan & Form tambah hewan UI.

### Phase C: Checkout & Booking UI

- [ ] **Checkout Flow**: Pilih Alamat, Ekspedisi, dan Metode Pembayaran UI.
- [ ] **Booking Flow**: Pilih Layanan, Pilih Tanggal/Slot, dan Form detail hewan UI.

### Phase D: Admin Dashboard UI

- [ ] **Admin Pages**: Dashboard statistik, Manajemen Produk, dan Manajemen Pesanan UI.

---

## ⚙️ 2. Backend & Logic Integration

_Fokus: Menghubungkan UI ke data asli Supabase & API pihak ketiga._

- [ ] **Auth Logic**: Integrasi Supabase Auth (OTP & Google Login).
- [ ] **Data Fetching**: Ganti mock data dengan Supabase query (Server Components).
- [ ] **Cart Sync**: Sinkronisasi Zustand cart ke database saat user login.
- [ ] **Payment**: Integrasi Midtrans (Snap JS & Webhooks).
- [ ] **Shipping**: Integrasi RajaOngkir (Cek ongkir & Tracking).
- [ ] **Booking Logic**: Validasi ketersediaan slot (locking) & Notifikasi WhatsApp.
- [ ] **Loyalty**: Perhitungan poin otomatis & sistem reedem.

---

## 🏗️ 3. Scaling & Architecture

- [ ] **NestJS Migration**: Memindahkan logic penulisan data berat ke dedicated API.
- [ ] **Final Audit**: Performance optimization & SEO final check.

---

_Gunakan checklist ini sebagai panduan setiap sesi. Tandai `[x]` jika sudah selesai._
