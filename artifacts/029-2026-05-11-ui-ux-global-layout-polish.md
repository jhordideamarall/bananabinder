# Execution Audit: UI/UX Global Layout Polish

- **Date**: 2026-05-11
- **Task**: Memperbaiki UI/UX "Berantakan" dari Landing Page hingga Checkout Flow

## Apa yang Diubah & Di Mana (Path)

1. **Global Z-Index Synchronization**:
   - `apps/web/components/Navbar.tsx` (Ubah z-50 menjadi z-40)
   - `apps/web/components/FloatingChat.tsx` (Ubah z-50 menjadi z-40)
   - `apps/web/components/checkout/MapPicker.tsx` (Ubah z-1001/z-1000 menjadi z-20/z-10)
   - `packages/ui/src/components/sheet.tsx` (Ubah z-50 menjadi z-100)
   - *Tindakan*: Mencegah bentrok Z-Index yang menyebabkan elemen saling tumpang tindih secara liar, terutama saat *CheckoutSheet* dan *Map* dibuka bersilangan dengan Navbar.

2. **Landing Page Refinement**:
   - `apps/web/app/page.tsx`
   - *Tindakan*: Memperbaiki elemen dekoratif *glow/blob* di *Hero Section* agar menyesuaikan dengan lebar layar (mencegah *horizontal scroll overflow*). Menyesuaikan proporsi UI di resolusi *mobile*.
   - `apps/web/components/CategoryBento.tsx`
   - *Tindakan*: Menambahkan `min-h-[200px]` pada kartu bento di *mobile view* agar tidak tergencet/gepeng.

3. **Navbar Mobile Menu Fix**:
   - `apps/web/components/Navbar.tsx`
   - *Tindakan*: Mengubah *dropdown menu* di *mobile* agar menggunakan `absolute top-full` ketimbang mendorong tinggi elemen `nav`. Ini membuat transisi animasi lebih elegan layaknya efek *glassmorphism*.

4. **Cart & Checkout UX Polish**:
   - `apps/web/app/cart/page.tsx`
   - *Tindakan*: Memberikan `max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar` pada Order Summary agar tetap *sticky* namun bisa di-scroll jika layar terlalu pendek.
   - `packages/ui/src/components/sheet.tsx`
   - *Tindakan*: Menambahkan border-radius kustom (`sm:rounded-l-3xl`) pada kontainer CheckoutSheet untuk menyempurnakan kesan *premium*.

## Mengapa (Rasionale Teknis)
Semua perbaikan di atas dilakukan untuk mengejar standar **"Visual Excellence"** yang diminta oleh arsitektur UI/UX Anda. Komponen interaktif kompleks seperti *Leaflet Map* (yang memiliki ekosistem z-index sendiri) sangat rentan mengacak-acak layout Next.js jika tidak diisolasi dalam *stacking context* yang disiplin. Penambahan *responsiveness* di keranjang memastikan user di perangkat *mobile* berlayar kecil sekalipun tidak kesulitan menyelesaikan pembayarannya.
