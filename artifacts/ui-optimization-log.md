# UI Optimization Log

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
