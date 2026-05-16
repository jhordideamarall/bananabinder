Secara codebase, project ini sudah “compile-ready”, tapi belum bisa aku bilang “flow checkout/product/admin berfungsi production-ready” tanpa fix beberapa blocker.

    Status validasi teknis:
    - pnpm type-check PASS
    - pnpm lint PASS
    - pnpm build PASS
    - pnpm test PASS

    Tapi itu baru bukti code bisa compile dan unit test kecil lewat. Bukan bukti flow bisnis end-to-end sudah aman.

    Kesimpulan codebase saat ini:
    - Product storefront: sebagian besar sudah jalan kalau Supabase env + seed produk sudah benar.
    - Checkout: belum aman production-ready.
    - Payment Xendit: ada flow dasar, tapi webhook/lifecycle belum rapi.
    - Shipping Biteship: ada flow dasar, tapi ada bug shape item dan cache.
    - Admin product: bisa list/create/edit secara basic, tapi belum aman untuk produk yang sudah pernah punya order.
    - Admin order: belum lengkap, ada route detail missing dan status update belum punya UI.
    - Promo/voucher: admin bisa buat, tapi belum terhubung ke cart/checkout.

    Blocker codebase yang harus dibereskan sebelum project dianggap jalan:

    1. Shipping rate salah membaca cart item
    File:
    - apps/web/app/api/shipping/rates/route.ts
    - packages/store/src/cart.ts
    - apps/web/app/checkout/page.tsx

    Masalah:
    Cart item punya field top-level seperti name, price, weight, quantity, tapi API shipping membaca item.product?.weight, item.product?.price, dll.

    Dampak:
    Ongkir bisa salah karena weight/value fallback, bukan data produk sebenarnya.

    Prioritas: HIGH.

    2. Shipping cache bisa error setelah expired
    File:
    - apps/web/app/api/shipping/rates/route.ts
    - migration shipping_rates_cache

    Masalah:
    Ada unique constraint untuk cache, tapi kalau row expired, kode melakukan insert baru, bukan upsert/update.

    Dampak:
    Request ongkir bisa gagal karena duplicate key setelah cache expired.

    Prioritas: HIGH.

    3. Stok dikurangi saat order dibuat, tapi tidak dikembalikan saat payment expired
    File:
    - packages/api-client/src/orders.ts
    - apps/web/app/api/payment/webhook/route.ts
    - migration release_order_inventory_v1

    Masalah:
    RPC create_order_v1 sudah reserve/kurangi stok. Tapi ketika Xendit webhook EXPIRED, webhook belum memanggil release_order_inventory_v1.

    Dampak:
    Stok bisa “hilang” kalau customer checkout tapi tidak bayar.

    Prioritas: CRITICAL.

    4. Payment webhook belum update transactions
    File:
    - apps/web/app/api/payment/create/route.ts
    - apps/web/app/api/payment/webhook/route.ts

    Masalah:
    Saat invoice dibuat, row transactions diinsert. Tapi saat webhook PAID/EXPIRED, yang diupdate hanya orders, bukan transactions.

    Dampak:
    Order bisa paid, tapi transaksi tetap status lama. Laporan finansial/audit jadi tidak akurat.

    Prioritas: HIGH.

    5. Payment webhook bisa terbuka kalau env callback token kosong
    File:
    - apps/web/app/api/payment/webhook/route.ts

    Masalah:
    Validasi token hanya jalan kalau XENDIT_CALLBACK_TOKEN ada. Kalau lupa set env production, webhook tetap menerima request.

    Dampak:
    Security risk.

    Prioritas: CRITICAL.

    6. Admin page belum punya guard akses yang konsisten
    File:
    - apps/web/app/admin/layout.tsx
    - apps/web/app/admin/page.tsx
    - apps/web/app/admin/products/page.tsx
    - apps/web/app/admin/orders/page.tsx
    - apps/web/app/admin/promos/page.tsx

    Masalah:
    Admin layout/page belum enforce redirect/role guard secara eksplisit.

    Dampak:
    RLS mungkin melindungi data, tapi UX/security admin belum rapi. Shell admin bisa kebuka.

    Prioritas: HIGH.

    7. Role admin tidak konsisten
    File:
    - apps/web/app/admin/actions.ts
    - apps/web/lib/admin.ts
    - apps/web/app/api/admin/products/route.ts
    - Supabase policies

    Masalah:
    Sebagian kode menerima admin, owner, staff; sebagian hanya menerima admin.

    Dampak:
    Owner/staff bisa gagal runtime atau ditolak API meskipun harusnya boleh.

    Prioritas: HIGH.

    8. Admin order detail route belum ada
    File:
    - apps/web/app/admin/orders/page.tsx

    Masalah:
    Link mengarah ke /admin/orders/[id], tapi route detail belum ada.

    Dampak:
    Klik order detail akan 404.

    Prioritas: HIGH.

    9. Admin belum punya UI update status order/tracking
    File:
    - apps/web/app/admin/orders/page.tsx
    - apps/web/app/admin/actions.ts
    - apps/web/app/api/admin/orders/[id]/route.ts

    Masalah:
    Action/API ada, tapi UI belum memakainya.

    Dampak:
    Admin belum bisa operasikan fulfillment order dari dashboard.

    Prioritas: HIGH.

    10. Query admin orders pakai kolom full_name, tapi schema pakai name
    File:
    - apps/web/lib/admin-data.ts
    - packages/types/src/supabase.ts

    Masalah:
    Query:
    profiles:user_id(full_name, phone)

    Tapi generated types/schema profile punya name, bukan full_name.

    Dampak:
    Admin orders bisa error runtime.

    Prioritas: CRITICAL.

    11. Edit product delete semua variant/image lalu insert ulang
    File:
    - apps/web/lib/admin-data.ts

    Masalah:
    Edit produk menghapus semua product_variants, lalu insert ulang.

    Dampak:
    Kalau variant sudah dipakai order_items.variant_id, delete bisa gagal karena FK. Atau ID variant berubah dan histori order/cart bisa rusak.

    Prioritas: CRITICAL untuk production.

    12. ProductForm belum cukup untuk produk production
    File:
    - apps/web/components/admin/ProductForm.tsx
    - apps/web/lib/admin-data.ts

    Masalah:
    Belum expose:
    - category
    - promo price
    - cost price real
    - is_active toggle
    - default variant wajib
    - validasi image domain/storage

    Dampak:
    Produk bisa aktif dengan 0 varian/0 stok, dan data katalog kurang akurat.

    Prioritas: MEDIUM-HIGH.

    13. Voucher/promo admin belum terhubung ke cart/checkout
    File:
    - apps/web/app/admin/promos/page.tsx
    - apps/web/app/cart/page.tsx
    - apps/web/app/checkout/page.tsx

    Masalah:
    Admin bisa buat voucher, tapi cart input voucher masih statis dan checkout hardcode discount = 0.

    Dampak:
    Promo belum benar-benar jalan untuk customer.

    Prioritas: MEDIUM.

    Jadi jawaban paling jujur:

    Tidak, migration saja tidak cukup.

    Urutan kerja agar project benar-benar bisa dijalankan:

    1. Fix blocker codebase runtime dulu
    Prioritas:
    - admin orders query full_name → name
    - shipping item shape
    - shipping cache upsert
    - payment webhook token wajib
    - payment webhook update transactions
    - expired payment release inventory
    - admin guard
    - admin order detail/update status
    - product edit jangan destructive delete variant

    2. Baru migration/schema
    - Pastikan live Supabase punya RPC/tables yang dibutuhkan.
    - Drop/ignore legacy table dengan migration resmi.
    - Regenerate Supabase types.
    - Seed catalog binder.

    3. Baru E2E local
    Test manual:
    - login user
    - lihat produk
    - product detail
    - add to cart
    - checkout
    - shipping rate
    - create payment invoice
    - webhook paid
    - order berubah paid
    - shipping metadata masuk
    - admin lihat order

    4. Baru production deploy readiness
    - env Vercel
    - Xendit callback token
    - Biteship key/origin
    - Supabase service role
    - webhook URL live
    - smoke test production

    Kalau kamu setuju, next step paling benar adalah aku lanjut bukan ke migration dulu, tapi ke “Codebase Flow Stabilization Phase”:

    Batch 1 critical fix:
    1. Fix admin orders query full_name bug.
    2. Fix shipping rates item shape.
    3. Fix shipping cache upsert.
    4. Harden Xendit webhook token requirement.
    5. Add transaction status update + inventory release on expired.

    Setelah batch ini pass build, baru lanjut admin guard/order detail/product edit safety.
