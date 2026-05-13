# Session Report — Supabase Binder MCP & Order RPC Hardening

Tanggal: 2026-05-14 00:34 WIB

## Konteks
Je diminta menghubungkan Hermes ke Supabase project Binder sebelum melanjutkan development, lalu melanjutkan pekerjaan dengan presisi tanpa mengubah style UI yang sudah bagus.

Project ref Supabase Binder: `xiumxugolyfsvwnwzenp`
Nama MCP server Hermes: `supabase-binder`

## Apa yang diubah

### 1. Hermes MCP Supabase Binder dikonfigurasi
- File konfigurasi lokal Hermes: `/Users/jhordideamarall/.hermes/config.yaml`
- Perubahan:
  - Menambahkan MCP server `supabase-binder` berbasis stdio:
    - command: `npx`
    - package: `@supabase/mcp-server-supabase@latest`
    - arg project: `--project-ref xiumxugolyfsvwnwzenp`
    - env token: `${SUPABASE_ACCESS_TOKEN}`
- Alasan:
  - Remote HTTP MCP Supabase meminta auth dan gagal 401 saat non-interactive add.
  - Stdio MCP memakai PAT yang sudah ada di environment Hermes dan berhasil discovery tools.

### 2. Migration hardening `create_order_v1`
- File: `supabase/migrations/20260514003000_harden_create_order_v1_inventory_pricing.sql`
- Perubahan:
  - Menambahkan/menjamin kolom order yang dibutuhkan checkout dan accounting:
    - `service_fee`
    - `shipping_courier_code`
    - `shipping_service_code`
    - `total_weight_grams`
    - `shipping_metadata`
    - `payment_metadata`
  - Menghapus signature RPC lama agar tidak ada ambiguitas overload.
  - Membuat ulang `public.create_order_v1(...)` dengan:
    - `SECURITY DEFINER`
    - `SET search_path = public`
    - validasi alamat harus milik user
    - validasi cart item tidak kosong
    - row lock `FOR UPDATE` pada `products` / `product_variants`
    - decrement stock atomik saat order dibuat
    - pencatatan `stock_movements`
    - server-side price recalculation dari harga produk/varian di database
    - server-side subtotal, tax absorbed 11%, HPP, profit, total weight, total order
    - mengabaikan `p_total` dan `p_subtotal` client sebagai sumber kebenaran untuk mencegah manipulasi harga dari browser
- Alasan:
  - Menutup P0 audit finding: RPC order lama belum menahan overselling dan masih terlalu percaya angka dari client.
  - Mengikuti monorepo integrity mandate: kalkulasi bisnis kritis harus konsisten dan aman, bukan dipercaya dari UI.

## Validasi
- `hermes mcp test supabase-binder` → PASS, connected, 20 tools discovered.
- `pnpm --filter @bananasbindery/api-client type-check` → PASS.
- `pnpm --filter @bananasbindery/core test` → PASS, 4 tests passed.
- `pnpm --filter web type-check` → PASS.

## Belum dilakukan
- Migration SQL belum di-apply ke remote Supabase production; ini sengaja agar tidak membuat side-effect database tanpa konfirmasi eksplisit.
- SQL belum diuji runtime di database live/local karena tidak menjalankan `supabase db push/reset` pada sesi ini.

## Catatan revert cepat
- Revert MCP local config: hapus entry `mcp_servers.supabase-binder` dari `/Users/jhordideamarall/.hermes/config.yaml`.
- Revert database hardening: hapus file migration `supabase/migrations/20260514003000_harden_create_order_v1_inventory_pricing.sql` sebelum migration diterapkan.

## Next paling aman
Setelah user approve, apply migration ke Supabase Binder lalu verifikasi RPC dengan skenario checkout test: stok cukup, stok kurang, harga client dimanipulasi, dan multi-order concurrent.
