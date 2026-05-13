# Session Log: Product Detail Page — Swarm Implementation

> Tanggal: 2026-05-03
> Fase: Phase 4 (partial — UI-first, dummy data, belum integrasi Supabase)

---

## Pekerjaan yang Diselesaikan

### File Baru / Dimodifikasi

| File                                              | Aksi      | Keterangan                                                                                                          |
| ------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `apps/web/app/(shop)/products/[slug]/page.tsx`    | Update    | Ganti stub — server component, lookup by slug, notFound()                                                           |
| `apps/web/app/(shop)/products/[slug]/_client.tsx` | Buat baru | Full client component (gallery, variants, qty, CTA bar)                                                             |
| `apps/web/components/shared/product-gallery.tsx`  | Buat baru | Swipeable image carousel, dot indicator, Framer Motion drag                                                         |
| `apps/web/components/shared/variant-selector.tsx` | Buat baru | Chip selector, stok indicator, out-of-stock state                                                                   |
| `apps/web/lib/dummy-products.ts`                  | Update    | Tambah type `DetailedProduct`, `ProductVariantDetail`, `DETAILED_PRODUCTS` (5 produk dengan variants + multi-image) |
| `apps/web/stores/cart-store.ts`                   | Update    | Tambah `variantId` + `variantName` ke `CartItem`, variant-aware merge logic di `addItem` + `removeItem`             |

### Fitur yang Diimplementasi

- [x] Image gallery swipeable (Framer Motion drag) + dot pagination
- [x] Product name, category badge, type badge (frozen/parcel)
- [x] Rating stars + stats (rating · ulasan · terjual)
- [x] Price + diskon % badge, support promo_price
- [x] Variant selector — chip style, stok "Sisa X" jika ≤5, disabled jika habis
- [x] Quantity stepper — bounded by stok aktif
- [x] Low stock warning — "Stok terbatas, sisa X item"
- [x] Expandable description — "Lihat selengkapnya"
- [x] Fixed bottom CTA bar — total harga + "Tambah ke Keranjang" dengan animasi spring
- [x] Cart store enhanced — variant-aware, backward compatible
- [x] Back button (router.back())
- [x] 404 via notFound() jika slug tidak ditemukan
- [x] TypeScript strict — `pnpm type-check` 0 error

### Schema Alignment

Implementasi sudah sesuai dengan schema `prd.md`:

- `products`: slug, price, promo_price, stock, type, avg_rating, review_count, sold_count, description ✅
- `product_variants`: id, name, price, promo_price, stock ✅
- `product_images`: url (sebagai array `images[]`) ✅
- `cart_items`: product_id + variant_id ✅

---

## ⚠️ DESIGN BELUM DIVERIFIKASI TERHADAP user-flow.html

> **Status: PERLU REVIEW VISUAL**

Implementasi ini menggunakan design language yang diambil dari komponen existing (warna, font, animasi) — **bukan dari `user-flow.html`**.

Sesuai aturan di `CLAUDE.md`:

> `user-flow.html` adalah referensi untuk **logic & flow** (halaman apa yang ada, bagaimana koneksi antar halaman).
> **JANGAN** gunakan sebagai referensi visual/CSS.
> **The True Design System** ada di codebase existing.

Namun, **layout struktur halaman** (urutan section, navigasi, CTA placement) belum dikonfirmasi cocok dengan flow yang didefinisikan di `user-flow.html`.

### Yang perlu dicek manual terhadap user-flow.html:

- [ ] Apakah back button mengarah ke halaman yang benar (products list / category / search sesuai entry point)?
- [ ] Apakah ada section review/ulasan yang harus ditampilkan di halaman detail?
- [ ] Apakah ada tombol "Wishlist" / simpan produk yang harus ada?
- [ ] Apakah ada rekomendasi produk terkait di bagian bawah halaman?
- [ ] Apakah sticky CTA bar tidak konflik dengan bottom navigation?

---

## Yang Belum Dikerjakan (Next Steps)

1. **Verifikasi layout vs `user-flow.html`** — cek section yang mungkin missing
2. **Integrasi Supabase** — ganti `DETAILED_PRODUCTS` dengan fetch dari `products` + `product_variants` + `product_images` (Phase 4 Supabase)
3. **SEO** — `generateMetadata` untuk product detail (title, description, og:image)
4. **Review section** — tampilkan ulasan user dari tabel `reviews`
5. **Related products** — produk lain dari kategori yang sama
6. **Wishlist button** — jika ada di user-flow.html
7. **Share button** — native share API atau copy link
