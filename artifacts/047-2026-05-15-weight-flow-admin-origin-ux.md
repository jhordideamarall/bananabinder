# Weight Flow End-to-End + Admin Origin Pengiriman + UX

Tanggal: 2026-05-15

## Konteks / Masalah

Audit admin: secara fitur sudah cukup, TAPI ada gap yang bikin "miss harga ongkir":

1. **Berat produk tidak pernah sampai ke cart.** ProductForm punya field "Berat (gram)" di level produk, tapi TIDAK ADA satu pun pemanggilan `addItem` di storefront yang mengisi `weight`. Akibatnya `CartItem.weight` selalu `undefined` → API ongkir & checkout selalu pakai fallback (500/1000g), bukan berat asli produk.
2. **Varian tidak punya field berat di admin.** Schema `product_variants.weight_grams` ada, tapi `replaceProductRelations` mengisi SEMUA varian dengan `payload.weight` (berat produk). Binder A5 vs A4 jadi sama beratnya.
3. **Origin pengiriman tidak bisa diatur dari admin & tidak konsisten.** `store_settings` punya `origin_area_id` (`IDNP6M3K2W1`), tapi `origin_latitude/longitude/address` = NULL → kurir instan (Gojek/Grab) yang butuh koordinat tidak bisa hitung jarak. Route ongkir & webhook punya fallback berbeda (`IDNP3IDNC445IDND5601`) → risiko origin "miss". Tidak ada UI admin untuk set ini.

Footer toko: "Kec. Kelapa Dua, Kab. Tangerang, Banten 15811".

## Perubahan Kode

### Weight flow (produk → cart → ongkir)

- `packages/api-client/src/types.ts`: `ProductWithDetails` + field `weight_grams: number`.
- `packages/api-client/src/products.ts`: `getActiveProducts` select + map `weight_grams` (fallback 500). `getProductBySlug` variant Row + map `weight_grams` (varian override berat produk).
- `packages/api-client/src/wishlist.ts`: select tambah `weight_grams`.
- `apps/web/components/shared/product-card.tsx`: `ProductCardData` + `weight_grams?`.
- `apps/web/components/shared/variant-selector.tsx`: `VariantOption` + `weight_grams?`.
- `apps/web/lib/dummy-products.ts`: `ProductVariantDetail` & `DetailedProduct` + `weight_grams?`.
- `apps/web/app/(shop)/products/[slug]/_client.tsx`: `addItem` kirim `weight: selectedVariant?.weight_grams ?? product.weight_grams ?? 500`.
- `apps/web/app/(shop)/products/page.tsx` & `apps/web/app/(shop)/page.tsx`: `addItem` kirim `weight`.
- `apps/web/app/(shop)/account/wishlist/page.tsx`: `addItem` kirim `weight` + tipe lokal `products` tambah `weight_grams`.

### Admin: berat per-varian

- `apps/web/components/admin/ProductForm.tsx`: `Variant` & `ProductVariantRow` + `weight_grams`. `emptyVariant`/`variantFromRow` isi default. Submit payload kirim `weight_grams` (fallback ke berat produk). UI: input "Berat (gram)" baru di grid varian (grid 5→6 kolom).
- `apps/web/lib/admin-data.ts`: `AdminProductPayload.variants[]` + `weight_grams?`. `replaceProductRelations` simpan `variant.weight_grams ?? payload.weight` (bukan selalu `payload.weight`).

### Admin: Origin Pengiriman

- `apps/web/app/admin/actions.ts` `saveStoreSettings`: dipecah — label home & origin masing-masing hanya update field-nya sendiri (pakai `formData.has(...)`) supaya tidak saling timpa. Origin update `origin_area_id`, `origin_address`, `origin_latitude`, `origin_longitude`.
- `apps/web/app/admin/promos/page.tsx`: komponen baru `StoreOriginForm` (area ID, alamat, lat, lng) + helper text. Layout: HomeSectionLabelForm & StoreOriginForm jadi 2 kolom.

### Konsistensi origin

- `apps/web/app/api/shipping/rates/route.ts` & `apps/web/app/api/payment/webhook/route.ts`: fallback origin disamakan ke `IDNP6M3K2W1` (default DB store_settings), sebelumnya `IDNP3IDNC445IDND5601` yang berbeda.

## Validasi

- `pnpm type-check` → PASS (8/8 packages).
- Supabase MCP: konfirmasi `store_settings` 1 row, `origin_area_id=IDNP6M3K2W1`, lat/lng/address NULL.

## Catatan Revert

Semua perubahan additive (tambah field opsional). Revert: hapus field `weight_grams` dari tiap interface + hapus `weight:` di `addItem` calls + hapus `StoreOriginForm` + kembalikan `saveStoreSettings` ke versi lama.

## Follow-up untuk user (non-kode)

- Set Origin Pengiriman di `/admin/promos`: isi lat/lng toko Kelapa Dua + verifikasi `origin_area_id` lewat Biteship `GET /v1/maps/areas?input=Kelapa Dua 15811`.
- Cek ulang berat tiap produk & varian di `/admin/products` — yang lama mungkin masih 0/500.
