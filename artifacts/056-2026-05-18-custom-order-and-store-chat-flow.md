# 056 — Custom Order, Fonnte Confirmation, Store Chat Flow

Waktu: 2026-05-18 00:45 WIB

## Ringkasan

Pekerjaan ini merapikan dua flow customer experience yang saling berdekatan:

1. Custom order binder tidak lagi diarahkan keluar ke link WhatsApp dan tidak memakai Xendit di awal. Customer membuat request di web, request langsung masuk ke `Pesanan Saya`, lalu server mengirim WhatsApp otomatis via Fonnte.
2. Chat toko dibuat native di web, dimulai dari detail produk, terikat langsung ke produk yang ditanyakan, dan sekarang realtime untuk customer/admin.

## Flow Custom Order Saat Ini

### 1. Customer isi detail di `/custom`

Path utama:

- `apps/web/app/(shop)/custom/page.tsx`
- `apps/web/app/api/custom-orders/reference-upload/route.ts`
- `apps/web/app/api/custom-orders/route.ts`

Customer memilih:

- Ukuran/varian binder.
- Material.
- Teks/nama custom.
- Catatan desain opsional.
- Link referensi opsional.
- Foto referensi opsional.
- Quantity.

Saat klik `Buat Custom Order`, page custom:

- Mengambil produk asli dari slug `binder-custom-nama`.
- Memilih variant yang cocok dengan ukuran.
- Upload foto referensi ke bucket private `custom-order-references` jika ada.
- Membuat order langsung via `/api/custom-orders`.
- Tidak membuka `wa.me`, tidak masuk cart, dan tidak membuat invoice Xendit.

### 2. Order tracking dibuat langsung

Path utama:

- `apps/web/app/api/custom-orders/route.ts`
- `supabase/migrations/20260517231500_custom_order_details_and_whatsapp.sql`
- `supabase/migrations/20260517221147_custom_order_reference_uploads.sql`

API custom order membuat:

- `orders.status = pending`
- `orders.payment_status = unpaid`
- `orders.payment_method = custom_request`
- `orders.payment_metadata.flow = custom_request`
- `order_items.custom_details` berisi detail custom, WhatsApp customer, dan metadata foto referensi.

Database:

- `order_items.custom_details JSONB` menyimpan detail custom.
- Bucket `custom-order-references` dibuat private, limit 5MB, format JPG/PNG/WebP/HEIC/HEIF.
- File disimpan dengan prefix `user.id`, lalu admin membaca preview melalui signed URL.

### 3. Fonnte WhatsApp otomatis setelah request dibuat

Path utama:

- `apps/web/app/api/custom-orders/route.ts`
- `packages/api-client/src/fonnte.ts`

Setelah order custom berhasil dibuat:

- Server mengambil nomor customer dari `profiles.phone` atau `addresses.phone`.
- Server membangun pesan ringkasan custom order.
- Server mengirim WhatsApp via `sendWhatsAppMessage()` dengan `FONNTE_API_TOKEN`.
- Kegagalan Fonnte tidak menggagalkan order.
- Hasil attempt disimpan di `orders.payment_metadata.custom_order_whatsapp`.

Contoh data yang disimpan:

- `attempted`
- `success`
- `target`
- `provider_ids`
- `reason`
- `sent_at`

## Admin Dashboard Handling

### Detail order admin

Path utama:

- `apps/web/lib/admin-data.ts`
- `apps/web/app/admin/orders/[id]/page.tsx`

Admin detail order sekarang menampilkan:

- Detail custom per item:
  - Ukuran.
  - Material.
  - Teks/nama.
  - Catatan desain.
  - Link referensi.
  - Foto referensi dari signed URL jika ada.
- Panel `Konfirmasi WhatsApp Custom`.

Panel WhatsApp menampilkan:

- Status `Terkirim`, `Gagal terkirim`, atau `Belum dicoba`.
- Nomor tujuan.
- Waktu attempt.
- Provider ID Fonnte jika tersedia.
- Reason/error jika gagal.

Tujuannya:

- Admin tidak perlu cek log server untuk tahu apakah pesan otomatis terkirim.
- Admin tetap bisa lanjut manual follow-up kalau Fonnte gagal.

### Page khusus custom order admin

Path utama:

- `apps/web/app/admin/custom-orders/page.tsx`
- `apps/web/components/admin/AdminSidebarNav.tsx`
- `apps/web/lib/admin-data.ts`

Admin `/admin/custom-orders`:

- Menampilkan request custom binder saja (`payment_method = custom_request`).
- Menampilkan customer, status, estimasi total, varian, material, teks/nama, catatan desain, link referensi, dan foto referensi.
- Menampilkan status WhatsApp otomatis.
- Menampilkan panel `Setup paket custom order` yang menjadi sumber data halaman `/custom`.
- Admin bisa mengontrol langsung:
  - Produk/slug sumber untuk halaman custom.
  - Nama paket/produk.
  - Varian paket.
  - Ukuran/varian yang muncul di customer.
  - Bahan/material.
  - Teks/nama custom.
  - Harga dasar, harga tiap varian, harga promo, stok, dan berat.
  - Harga estimasi/final.
  - Status order.
  - Status pembayaran.
  - Catatan internal.
- Tombol `Detail` tetap masuk ke detail order standar agar status, payment status, resi, dan catatan internal bisa diupdate dari satu tempat.

Halaman `/custom` tidak lagi memakai daftar ukuran/bahan hardcode:

- Ukuran dan harga diambil dari `products` + `product_variants` milik produk custom aktif.
- Bahan diambil dari `store_settings.custom_order_materials`.
- Slug produk custom diambil dari `store_settings.custom_order_product_slug`.

## User Order Page Handling

Path utama:

- `apps/web/app/(shop)/account/orders/page.tsx`
- `apps/web/app/(shop)/account/orders/[id]/page.tsx`

Daftar pesanan user:

- Menampilkan badge `Custom binder` kalau order punya item custom.
- Untuk `custom_request`, status pending menjadi `Menunggu Konfirmasi`.
- Tombol `Bayar Sekarang` tidak muncul, supaya user tidak diarahkan ke Xendit.
- User melihat state `Menunggu Konfirmasi Admin`.

Detail pesanan user:

- Menampilkan detail custom di item pesanan:
  - Teks/nama.
  - Ukuran.
  - Material.
  - Catatan.
  - Link referensi.
  - Nama file foto referensi jika ada.
- Menampilkan notice bahwa admin akan konfirmasi desain dan pembayaran final lewat WhatsApp.
- Rincian pembayaran untuk custom request memakai label `Konfirmasi admin` dan `Estimasi Custom`.

## Store Chat Product-Linked

### Database

Path utama:

- `supabase/migrations/20260518002000_store_chat.sql`
- `supabase/migrations/20260517173538_store_chat_realtime.sql`
- `supabase/migrations/20260517173818_store_chat_indexes_and_function_grants.sql`
- `packages/types/src/supabase.ts`

Tabel:

- `chat_conversations`
- `chat_messages`

Relasi penting:

- `chat_conversations.user_id -> profiles.id`
- `chat_conversations.product_id -> products.id`
- `chat_conversations.order_id -> orders.id`
- `chat_messages.conversation_id -> chat_conversations.id`

Realtime:

- `chat_conversations` dan `chat_messages` masuk publication `supabase_realtime`.
- Remote Supabase diubah hanya via MCP.

Security/performance:

- RLS aktif.
- Customer hanya bisa membaca/membuat chat miliknya.
- Admin/staff/owner bisa membaca.
- Customer hanya bisa insert message `sender_type='customer'`.
- Admin bisa insert message `sender_type='admin'`.
- Index FK chat ditambahkan.
- Execute untuk trigger function chat direvoke dari anon/authenticated.

### Customer product detail

Path utama:

- `apps/web/app/(shop)/products/[slug]/_client.tsx`
- `apps/web/app/(shop)/products/[slug]/_product-chat-launcher.tsx`

Flow:

- Customer membuka detail produk.
- Tombol chat membuka bottom sheet.
- Conversation otomatis link ke produk yang sedang dibuka.
- Context menampilkan:
  - Foto produk.
  - Nama produk.
  - Varian terpilih jika ada.
- Message metadata membawa:
  - `source: product_detail`
  - `product_id`
  - `product_name`
  - `product_slug`
  - `product_image_url`
  - `variant_id`
  - `variant_name`

Realtime:

- Sheet customer subscribe ke `chat_messages` untuk conversation aktif.
- Balasan admin masuk tanpa refresh.

UI update:

- Sheet dibuat lebih tinggi: `min(88vh, 760px)`.
- Area chat memakai `flex: 1`.
- Bubble dan input dibuat lebih lega.
- Konteks produk memakai thumbnail supaya tidak membingungkan.

### Admin chat

Path utama:

- `apps/web/app/admin/chats/page.tsx`
- `apps/web/app/admin/chats/_admin-chat-realtime.tsx`
- `apps/web/components/admin/AdminSidebarNav.tsx`
- `packages/api-client/src/chat.ts`

Admin `/admin/chats`:

- Menampilkan inbox chat.
- Menampilkan customer.
- Menampilkan produk terkait.
- Menampilkan thumbnail produk.
- Menampilkan varian dari metadata jika ada.
- Admin bisa buka halaman produk.
- Admin bisa membalas.

Realtime:

- Komponen `_admin-chat-realtime.tsx` subscribe ke perubahan `chat_messages` dan `chat_conversations`.
- Saat ada perubahan, admin page melakukan `router.refresh()`.
- Inbox dan thread update tanpa manual refresh.

Fix tambahan:

- Setelah admin reply, `admin_unread_count` direset.

## Remote Supabase MCP Actions

Remote database diubah lewat Supabase MCP, bukan direct DB script.

MCP actions:

- `list_migrations`
- `apply_migration` untuk `store_chat_realtime`
- `execute_sql` verifikasi publication realtime
- `apply_migration` untuk `store_chat_indexes_and_function_grants`
- `execute_sql` verifikasi index chat
- `apply_migration` untuk `custom_order_reference_uploads`
- `execute_sql` verifikasi bucket storage private dan policy
- `apply_migration` untuk `harden_public_function_search_path`
- `apply_migration` untuk `tighten_public_storage_listing`
- `apply_migration` untuk `custom_order_admin_config`
- `get_advisors` security/performance

Migration remote yang tercatat:

- `20260517173538_store_chat_realtime`
- `20260517173818_store_chat_indexes_and_function_grants`
- `20260518002000_store_chat`
- `20260517221147_custom_order_reference_uploads`
- `20260518034654_harden_public_function_search_path`
- `20260518034744_tighten_public_storage_listing`
- `20260518034954_custom_order_admin_config`

Catatan repo:

- File placeholder migration dibuat untuk version yang dibuat MCP.
- SQL idempotent juga dimasukkan ke `20260518002000_store_chat.sql` supaya fresh local database tetap aman urutannya.
- Bucket custom reference dibuat via MCP dan file migration lokal disimpan di `supabase/migrations/20260517221147_custom_order_reference_uploads.sql`.

## Validasi

Commands dijalankan:

- `pnpm --dir apps/web type-check`
- `pnpm --dir apps/web lint`
- `pnpm --dir packages/api-client type-check`

Hasil:

- Type-check dan lint pass untuk scope yang disentuh.

MCP verification:

- `chat_conversations` dan `chat_messages` sudah ada di publication `supabase_realtime`.
- Index chat FK sudah ada:
  - `idx_chat_conversations_assigned_admin_id`
  - `idx_chat_conversations_order_id`
  - `idx_chat_conversations_product_id`
  - `idx_chat_messages_sender_id`
- Bucket `custom-order-references` ada, private, limit 5MB, dan policy read/insert terpasang.
- Supabase advisor security:
  - Warning `function_search_path_mutable` sudah hilang setelah function public dikunci ke `search_path = public, pg_temp`.
  - Warning `public_bucket_allows_listing` sudah hilang setelah broad policy `storage_public_read` dihapus.

## Follow-up Yang Disarankan

1. Tambahkan CTA `Chat admin soal pesanan ini` dari detail order user untuk custom order.
2. Validasi server-side metadata chat product agar `productName`, slug, image, dan variant tidak hanya dipercaya dari client.
3. Tambahkan unique constraint/upsert untuk mencegah double conversation product yang sama saat request paralel.
4. Harden security definer function lama yang masih muncul di Supabase advisors, di luar scope chat/custom ini.
