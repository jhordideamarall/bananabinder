# Biteship Fix — Item Dimensions for Instant Courier

**Tanggal:** 2026-05-05
**Error sebelum fix:** `40002021 — Request failed with status code 400`
**Trigger:** Customer pilih `gojek/instant` (atau grab/instant). Reguler (jne, sicepat, dll) tidak terkena issue ini.

## Akar Masalah

Setelah fix sebelumnya (kode kurir asli per order — lihat `biteship-fix-report.md`), payload sudah benar pakai `courier_company: gojek`, `courier_type: instant`. Tapi Biteship reject karena **item tidak punya dimensi 3D**.

Untuk instant courier (Gojek/Grab), Biteship butuh `length/width/height` di setiap item. Untuk kurir reguler cukup `weight`. Database `products` belum punya kolom dimensi → payload tanpa dimensi → 40002021.

## Yang Diubah

**File:** `apps/web/app/api/payment/webhook/route.ts` (sekitar line 158-176)

**Sebelum:**

```ts
return {
  name: ...,
  description: '-',
  value: it.price,
  quantity: it.quantity,
  weight: Math.max(1, it.products?.weight_grams || 100),
};
```

**Sesudah:**

```ts
return {
  name: ...,
  description: '-',
  value: it.price,
  quantity: it.quantity,
  weight: Math.max(1, it.products?.weight_grams || 100),
  length: 10,  // cm, default
  width: 10,
  height: 10,
};
```

## Rasional

- Default 10×10×10 cm aman untuk mayoritas produk petshop (sisir, obat, sachet).
- Produk besar (karung pakan 4kg+) idealnya punya dimensi sendiri di DB — TODO di bawah.
- Tanpa default ini, instant courier 100% gagal.

## Catatan Sandbox Biteship

Walaupun dimensi sudah lengkap, **Gojek/Grab instant di sandbox tetap bisa gagal** untuk endpoint `/v1/orders` karena tidak ada simulasi driver. Untuk testing end-to-end yang reliable di sandbox, pakai kurir reguler:

- JNE Reguler/OKE
- SiCepat Reguler
- J&T EZ
- AnterAja Reguler

Production (`BITESHIP_API_KEY` non-test) akan jalan normal untuk semua kurir.

## TODO Lanjutan (Tidak Diimplementasi Sekarang)

1. Tambah kolom `length_cm`, `width_cm`, `height_cm` di tabel `products` & `product_variants` agar dimensi akurat per produk.
2. Fallback: jika sandbox dan customer pilih instant, tampilkan warning di checkout UI.
3. Endpoint `/api/shipping/retry/[orderId]` untuk re-trigger pembuatan order Biteship tanpa harus resend webhook Xendit.

## Cara Revert

Hapus 3 baris `length/width/height` di `webhook/route.ts` line ~171-174.
