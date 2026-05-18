# Product-Linked Store Chat

Waktu: 2026-05-18 00:18 WIB

## Ringkasan

Menambahkan flow chat toko sederhana yang dimulai dari detail produk. Saat customer klik tombol chat di halaman produk, percakapan otomatis membawa `product_id`, nama produk, slug produk, dan konteks varian terpilih melalui metadata pesan. Admin dapat membaca dan membalas dari panel `/admin/chats`.

## Apa yang Diubah

### 1. Database chat toko

Path:

- `supabase/migrations/20260518002000_store_chat.sql`
- `packages/types/src/supabase.ts`

Perubahan:

- Menambahkan tabel `chat_conversations` dengan relasi ke `profiles`, `orders`, dan `products`.
- Menambahkan tabel `chat_messages` untuk pesan customer/admin/AI/system.
- Menambahkan metadata AI-ready: `sender_type`, `ai_mode`, `metadata JSONB`, unread counters, dan timestamp last message.
- Menambahkan trigger `touch_chat_conversation_from_message` agar conversation otomatis update saat pesan baru masuk.
- Menambahkan RLS dasar: customer hanya membaca/membuat chat miliknya, admin/staff/owner bisa membaca; customer hanya bisa insert pesan `sender_type='customer'` pada conversation miliknya.
- Grant update conversation tidak diberikan ke authenticated agar customer tidak bisa manipulasi status/unread count secara langsung.
- Menambahkan tipe manual untuk tabel baru di `packages/types/src/supabase.ts` agar TypeScript strict tetap aman.

Alasan:

- Chat harus link langsung ke produk yang ditanyakan, bukan percakapan bebas tanpa konteks.
- Struktur `sender_type` + `metadata` membuat fitur siap untuk AI suggestion/auto-reply nanti tanpa migrasi besar.

### 2. API/client chat reusable

Path:

- `packages/api-client/src/chat.ts`
- `packages/api-client/package.json`
- `apps/web/app/api/chat/conversations/route.ts`

Perubahan:

- Menambahkan API client chat: load thread product, kirim pesan product chat, ambil conversation admin, ambil messages, dan reply admin.
- Menambahkan export subpath `@bananasbindery/api-client/chat`.
- Menambahkan route handler:
  - `GET /api/chat/conversations?productId=...` untuk load thread customer berdasarkan produk.
  - `POST /api/chat/conversations` untuk membuat/mengirim pesan chat dari product detail.
- POST menyimpan konteks produk/varian ke message metadata:
  - `source: product_detail`
  - `product_id`
  - `product_name`
  - `product_slug`
  - `variant_id`
  - `variant_name`

Alasan:

- API product chat tetap terpisah dari UI dan bisa dipakai ulang oleh future mobile.
- Server route memastikan customer terautentikasi sebelum membuat chat.

### 3. UI customer di detail produk

Path:

- `apps/web/app/(shop)/products/[slug]/_client.tsx`
- `apps/web/app/(shop)/products/[slug]/_product-chat-launcher.tsx`

Perubahan:

- Menambahkan tombol chat pada bottom action bar detail produk.
- Tombol chat membuka bottom sheet tanpa mengubah desain utama halaman.
- Bottom sheet otomatis prefill pesan:
  - `Halo admin, saya mau tanya tentang {product.name} varian {variant.name}.`
- Saat kirim, payload membawa product ID, product name, slug, dan varian terpilih.
- Jika belum login, UI menampilkan pesan agar customer login terlebih dahulu.

Alasan:

- Sesuai requirement: chat berada di detail product dan langsung link dengan produk yang ditanyakan.
- Customer tidak perlu mengetik ulang nama produk/varian.

### 4. UI admin chat

Path:

- `apps/web/app/admin/chats/page.tsx`
- `apps/web/components/admin/AdminSidebarNav.tsx`

Perubahan:

- Menambahkan menu `Chats` di sidebar admin.
- Menambahkan halaman `/admin/chats` dengan inbox conversation dan panel pesan.
- Admin bisa melihat produk yang ditanyakan, customer terkait, membuka halaman produk, dan membalas chat.
- Reply admin disimpan sebagai `sender_type='admin'`.

Alasan:

- Admin perlu tempat sederhana untuk menjawab pertanyaan product-linked tanpa masuk database/manual log.

## Validasi

Command dijalankan:

- `pnpm type-check`
- `pnpm lint`

Hasil:

- `pnpm type-check` PASS.
- `pnpm lint` PASS.

## File yang Berubah untuk Revert/Audit

Chat scope:

- `supabase/migrations/20260518002000_store_chat.sql`
- `packages/types/src/supabase.ts`
- `packages/api-client/src/chat.ts`
- `packages/api-client/package.json`
- `apps/web/app/api/chat/conversations/route.ts`
- `apps/web/app/(shop)/products/[slug]/_client.tsx`
- `apps/web/app/(shop)/products/[slug]/_product-chat-launcher.tsx`
- `apps/web/app/admin/chats/page.tsx`
- `apps/web/components/admin/AdminSidebarNav.tsx`

Catatan: `git status` masih berisi perubahan custom order binder dari pekerjaan sebelumnya dan `.claude-flow`; artifact ini hanya mencatat scope chat toko product-linked.

## Catatan Revert

Untuk revert fitur chat product-linked:

1. Hapus route `apps/web/app/api/chat/conversations/route.ts`.
2. Hapus page `apps/web/app/admin/chats/page.tsx` dan component `_product-chat-launcher.tsx`.
3. Revert perubahan `_client.tsx`, `AdminSidebarNav.tsx`, `packages/api-client/package.json`, `packages/api-client/src/chat.ts`, dan `packages/types/src/supabase.ts`.
4. Jangan apply migration `20260518002000_store_chat.sql`, atau jika sudah apply di DB, drop `chat_messages`, `chat_conversations`, trigger/function terkait dengan migration rollback terpisah.

## Follow-up / Runtime Fix

- 2026-05-18 00:18 WIB: Runtime sempat error `Could not find the table public.chat_conversations in the schema cache` karena migration chat baru sudah dibuat di repo tetapi belum diaplikasikan ke Supabase remote DB.
- Fix dilakukan dengan menjalankan migration `supabase/migrations/20260518002000_store_chat.sql` langsung ke `DATABASE_URL`, mencatat version `20260518002000` ke `supabase_migrations.schema_migrations`, lalu mengirim `NOTIFY pgrst, 'reload schema'`.
- Verifikasi REST PostgREST setelah reload: `GET /rest/v1/chat_conversations?select=id&limit=1` dengan service role mengembalikan status `200` dan `[]`.
- Next improvement opsional: badge unread count real-time di sidebar admin, mark-as-read per participant, dan AI suggestion mode untuk draft balasan admin.
