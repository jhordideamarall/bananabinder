# UI Optimization Log

## 2026-06-20 — Manual Payment QR Ratio

- File: `apps/web/app/checkout/page.tsx`
- File: `apps/web/app/(shop)/account/orders/[id]/page.tsx`
- Perubahan: render QR/QRIS customer tidak lagi dipaksa `aspect-square`; frame QR memakai padding lebih kecil dan image memakai `max-w-[320px]` + `max-h-[260px]`.
- Rationale: QR owner bisa berupa gambar/poster QRIS rasio 4:3. Memaksa square membuat QR terlihat terlalu kecil di mobile checkout dan detail order re-upload.
- Revert: kembalikan class image ke `aspect-square w-full max-w-[220px] object-contain` dan frame ke `p-3`.
