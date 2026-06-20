# 066 — QR Payment Ratio Tuning

Tanggal: 2026-06-20

## Apa Yang Diubah

- Mengubah render QR/QRIS customer agar tidak dipaksa `aspect-square`.
- Membesarkan area tampil QR dari `max-w-[220px]` menjadi `max-w-[320px]`.
- Mengurangi padding frame QR dari `p-3` menjadi `p-1.5` supaya gambar 4:3 tidak terlihat terlalu kecil.

## Di Mana

- `apps/web/app/checkout/page.tsx`
- `apps/web/app/(shop)/account/orders/[id]/page.tsx`
- `artifacts/ui-optimization-log.md`

## Mengapa

- QR yang diupload owner bisa berupa gambar 4:3 atau poster QRIS, bukan selalu square murni.
- Class `aspect-square` membuat gambar 4:3 terlihat letterboxed dan mengecil di mobile checkout.
- Customer perlu melihat QR lebih besar agar lebih mudah discan tanpa mengubah struktur payment flow.

## Catatan Revert

- Kembalikan frame QR ke `p-3`.
- Kembalikan image class ke `aspect-square w-full max-w-[220px] object-contain` pada dua file customer jika layout QR perlu kembali ke ukuran lama.

## Validasi

- Pass: `pnpm --filter @bananasbindery/web lint`
- Pass: `pnpm --filter @bananasbindery/web build`
