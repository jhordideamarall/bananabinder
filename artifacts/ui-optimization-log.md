# UI/UX Optimization Log

## Date: 2026-05-03

## Focus: Mobile Native-Feel Enhancements (Android & iOS)

### 1. Viewport Meta Optimization

- **File**: `apps/web/app/layout.tsx`
- **Change**: Ditambahkan `interactiveWidget: 'resizes-visual'` ke dalam konfigurasi viewport.
- **Alasan**: Mencegah layout aplikasi terdorong ke atas atau tertimpa saat virtual keyboard muncul di Android, serta membantu kalkulasi ketinggian `dvh` yang akurat saat URL bar di Android Chrome disembunyikan/ditampilkan.

### 2. Layout Height Optimization (Dynamic Viewport)

- **File**: `apps/web/app/(shop)/layout.tsx`
- **Change**: Mengganti utilitas `min-h-screen` (yang menggunakan `100vh`) menjadi `min-h-[100dvh]`.
- **Alasan**: Di browser mobile (khususnya Android/iOS Safari), `100vh` mengabaikan tinggi URL bar yang dinamis, menyebabkan bagian bawah halaman "terpotong". Dengan `100dvh`, tinggi halaman akan selalu merespons ukuran _visible viewport_ secara akurat tanpa terpotong.

### 3. Android Bottom Navigation Safe Area

- **File**: `apps/web/components/layout/bottom-nav.tsx`
- **Change**: Memperbarui _padding-bottom_ dari `pb-[max(12px,env(safe-area-inset-bottom))]` menjadi `pb-[max(20px,env(safe-area-inset-bottom))]`.
- **Alasan**: Nilai `env(safe-area-inset-bottom)` di Android Web sering kali terbaca `0`. Dengan memberikan _baseline padding_ sebesar `20px` (sebelumnya `12px`), bottom nav memiliki ruang bernapas ekstra sehingga tidak akan bertabrakan dengan garis navigasi gesture atau tombol Android system di bawah layar.

### 4. Fluid Spacing & Gutter Optimization (iOS/iPhone 13 Pro Fix)

- **Files**: `apps/web/components/layout/header.tsx`, `apps/web/app/(shop)/page.tsx`
- **Change**: Mengganti padding horizontal statis (`px-5` / `20px`) menjadi nilai fluid menggunakan `clamp(16px, 5vw, 20px)`.
- **Alasan**: Pada perangkat dengan layar 390px (seperti iPhone 13 Pro), padding 20px kiri-kanan memakan terlalu banyak ruang, membuat konten terasa "sempit". Dengan fluid spacing, gutter akan mengecil secara proporsional di layar kecil, memberikan ruang bernapas lebih luas untuk konten utama.

### 5. Proportional Hero Carousel

- **File**: `apps/web/app/(shop)/page.tsx`
- **Change**: Mengubah tinggi `BannerCard` dan `Carousel Container` dari nilai statis (`210px`/`240px`) menjadi fluid (`clamp`).
- **Alasan**: Memastikan banner tetap terlihat estetis dan tidak terlalu "mendominasi" layar kecil, menjaga rasio aspek yang lebih seimbang antara visual banner dan konten di bawahnya.

### 6. Site-wide Fluid Consistency

- **Files**: `CartPage`, `CheckoutPage`, `BookingPage`, `AccountPage`
- **Change**: Propagasi `px-[clamp(16px,5vw,20px)]` ke seluruh halaman utama untuk memastikan konsistensi "ruang bernapas" di seluruh _user journey_.

### 8. Desktop Navigation "Liquid Glass" Styling

- **File**: `apps/web/components/layout/desktop-nav.tsx`
- **Change**: Implementasi gaya "Liquid Glass Apple" pada indikator link aktif dan hover.
- **Detail**:
  - **Active Link**: Menggunakan `backdrop-blur-md`, gradient transparan `white/40`, border putih halus `white/60`, dan `inner shadow` untuk efek kedalaman.
  - **Hover State**: Menambahkan `subtle glass effect` pada link yang tidak aktif saat di-hover.
  - **Animation**: Menggunakan spring physics yang lebih "organik" (`stiffness: 400`, `damping: 32`) untuk memberikan kesan pergerakan cairan (_liquid_) saat berpindah antar menu.
- **Alasan**: Meningkatkan estetika premium pada tampilan desktop agar sejalan dengan standar desain modern (Apple-style) dan memberikan feedback visual yang lebih memuaskan bagi pengguna.
