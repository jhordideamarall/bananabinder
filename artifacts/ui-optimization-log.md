# UI Optimization Log

## 2026-08-16 — Mobile Product Action dan Legacy Cart Recovery

- File: `apps/web/app/(shop)/products/[slug]/_client.tsx`
- Perubahan: produk dengan stok utama habis dan tepat satu varian tersedia sekarang memilih varian itu otomatis; validasi stok/harga juga muncul sebagai toast dari area bottom action.
- Rationale: cart tersimpan per perangkat. Item lama di HP dapat kehilangan `variantId`, sedangkan pesan error inline berada di bawah fold sehingga sentuhan tombol terlihat tidak bekerja.
- Verifikasi: touch emulation viewport 390×844 berhasil menambah varian yang benar dan `Beli Sekarang` berpindah ke `/checkout`.
- Revert: kembalikan initial state `selectedVariant` ke `null`, tampilkan kembali opsi produk utama tanpa syarat, dan hapus toast validasi.

## 2026-08-16 — Customer Auth dan Checkout Tanpa OTP

- File: `apps/web/app/(auth)/login/page.tsx`
- File: `apps/web/app/(auth)/register/page.tsx`
- File: `apps/web/components/checkout/address-sheet.tsx`
- Perubahan: form mobile auth memakai email/password biasa; checkout guest langsung menyimpan alamat melalui anonymous session tanpa sheet kode OTP.
- Rationale: menghapus ketergantungan pengiriman WhatsApp/Fonnte dari critical path order, menjaga form tetap ramah viewport mobile, dan mempertahankan ownership order melalui Supabase Auth/RLS.
- Revert: kembalikan halaman auth dan address sheet ke implementasi sebelum artifact `068`, lalu nonaktifkan anonymous sign-ins.

## 2026-06-20 — Manual Payment QR Ratio

- File: `apps/web/app/checkout/page.tsx`
- File: `apps/web/app/(shop)/account/orders/[id]/page.tsx`
- Perubahan: render QR/QRIS customer tidak lagi dipaksa `aspect-square`; frame QR memakai padding lebih kecil dan image memakai `max-w-[320px]` + `max-h-[260px]`.
- Rationale: QR owner bisa berupa gambar/poster QRIS rasio 4:3. Memaksa square membuat QR terlihat terlalu kecil di mobile checkout dan detail order re-upload.
- Revert: kembalikan class image ke `aspect-square w-full max-w-[220px] object-contain` dan frame ke `p-3`.

## 2026-06-20 — COD Payment Step

- File: `apps/web/app/checkout/page.tsx`
- File: `apps/web/app/(shop)/account/orders/page.tsx`
- File: `apps/web/app/(shop)/account/orders/[id]/page.tsx`
- Perubahan: step pembayaran mobile menampilkan pilihan COD default dan transfer manual opsional; COD order detail tidak menampilkan upload bukti.
- Rationale: COD butuh flow yang lebih ringkas dan tidak boleh terlihat seperti transfer manual. Customer harus langsung melihat total tagihan, kurir, dan status bayar saat terima.
- Revert: hapus pilihan COD di checkout dan kembalikan conditional order pending agar selalu memakai upload bukti transfer.
