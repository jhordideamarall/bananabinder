# ✨ Bananasbindery: Seamless Binder Customer Journey

Dokumen ini merangkum user flow Bananasbindery untuk konversi tinggi pada penjualan binder, photocard organizer, refill, custom-name binder, dan gift bundle.

---

## 🚀 1. Frictionless Onboarding (Tanpa OTP)

- **Login**: Customer memakai email/password; tidak ada verifikasi kode WhatsApp.
- **Checkout guest**: App membuat anonymous Supabase session agar order tetap punya `auth.uid()` dan tunduk pada RLS tanpa meminta OTP.
- **Fallback**: Jika anonymous sign-in belum aktif, customer diarahkan ke login email/password tanpa kehilangan cart.
- **Dampak**: Customer bisa checkout tanpa ketergantungan device WhatsApp/Fonnte, sementara ownership order tetap terisolasi per session.

## 📱 2. Mobile-First App-Like Experience

- **Keunggulan**: Web terasa seperti aplikasi native iOS/Android.
- **Design Mandates**:
  - **Bottom Navigation**: navigasi utama ada di jempol.
  - **Zero Footer**: mengurangi distraksi di storefront utama.
  - **Premium Animations**: spring-physics animation yang mewah dan responsif.

## 🛍️ 3. Intuitive Product Discovery

- **Keunggulan**: Customer cepat menemukan binder/refill sesuai kebutuhan.
- **Fitur Unggulan**:
  - **3D Stacking Carousel**: banner promo/drop product yang estetik.
  - **Smart Category Tags**: filter kategori tanpa reload halaman.
  - **Sticky Search Bar**: pencarian selalu siap untuk keyword seperti A5, A6, custom, refill, atau photocard.

## 🛒 4. The 3-Step Checkout (Anti-Ribet)

1. **Direct Address Sheet**: tambah/pilih alamat tanpa berpindah halaman.
2. **Integrated Shipping**: pilihan kurir Biteship muncul dengan estimasi harga akurat.
3. **One-Click Payment**: Xendit mendukung QRIS, VA, dan e-wallet dengan konfirmasi instan.

## 🔔 5. Real-Time Engagement

- **Keunggulan**: Customer selalu tahu status order binder mereka.
- **Fitur**: Notifikasi internal untuk pembayaran sukses, order diproses, resi dikirim, dan pesanan selesai.

---

**💡 Filosofi Bananasbindery**: _"Merapikan koleksi dan kenangan harus semudah memilih binder favorit."_
