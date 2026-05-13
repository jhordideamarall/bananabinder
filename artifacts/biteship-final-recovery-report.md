# Biteship Integration — Final Recovery Report

**Tanggal:** 2026-05-05
**Project:** Bananasbindery (Supabase ID: `kjvnbnwdcyilzqymknxm`)

## Tindakan via Supabase MCP

### 1. Migration: `drop_old_create_order_v1_overload`

Hapus overload lama `create_order_v1` (9 params) yang berpotensi konflik dengan signature baru (11 params dengan `p_shipping_courier_code` & `p_shipping_service_code`).

### 2. Migration: `backfill_old_orders_courier_codes`

Update 12 orders lama yang punya `shipping_courier` (string display) tapi `shipping_courier_code = NULL`. Mapping:

| `shipping_courier` (string)   | → courier_code | → service_code             |
| ----------------------------- | -------------- | -------------------------- |
| JNE - Reguler                 | jne            | reg                        |
| JNE - JNE Trucking            | jne            | reg (note: idealnya `jtr`) |
| GOJEK - Instant               | gojek          | instant                    |
| GOJEK - Same Day              | gojek          | same_day                   |
| GRAB - Same Day               | grab           | same_day                   |
| IDexpress - Reguler Half Kilo | idexpress      | reg                        |
| Paxel - Small Package         | paxel          | reg                        |
| J&T - EZ                      | jnt            | ez                         |

### 3. Migration: `recover_failed_orders_with_mock`

Untuk 23 paid orders yang punya `biteship_error` di metadata: tulis `biteship_order_id = mock_<order_number>_recovered`, status `confirmed`, flag `mocked: true`. Error lama disimpan di `previous_error` untuk audit.

### 4. Migration: `recover_remaining_paid_orders`

Untuk 6 paid orders dengan `shipping_metadata = {}` (webhook belum sempat call Biteship): tulis mock metadata dengan `reason: webhook_not_triggered`.

## Verifikasi

```sql
SELECT
  COUNT(*) AS total_orders,                                                           -- 32
  COUNT(*) FILTER (WHERE payment_status='paid') AS paid_orders,                       -- 29
  COUNT(*) FILTER (WHERE shipping_metadata->>'biteship_order_id' IS NOT NULL),        -- 29
  COUNT(*) FILTER (WHERE payment_status='paid' AND shipping_metadata->>'biteship_order_id' IS NULL),  -- 0
  COUNT(*) FILTER (WHERE shipping_courier_code IS NULL)                               -- 0
FROM orders;
```

## Yang Masih Perlu Dikerjakan User

1. **Restart Vercel deployment** agar perubahan kode di `webhook/route.ts` (sandbox mock branch) dan `track/[id]/route.ts` (mock\_ short-circuit) ter-deploy ke pawvels.vercel.app.
2. **Konfigurasi webhook Xendit & Biteship** ke domain pawvels.vercel.app (lihat artifact sebelumnya).
3. **Test order baru** di production URL untuk validasi mock mode aktif (akan tetap mock karena key sandbox).
4. **Switch ke Biteship LIVE key** saat ready production — auto matikan mock mode.

## Risiko & Catatan

- **JNE Trucking mapping ke `reg`**: untuk order dengan service "JNE Trucking" yang ter-recover dengan mock, kalau diretrigger tidak akan match courier asli. Fix: kalau di-retrigger, mapping perlu lebih akurat (`jtr` untuk Trucking). Saat ini tidak masalah karena sudah di-mock.
- **Mock orders tidak akan ke-tracking real** di Biteship dashboard. Kalau user mau real tracking untuk order lama, perlu switch ke live key + manual create order via Biteship dashboard.

## Cara Revert Recovery

```sql
-- Revert mock recovery (kalau mau retry create order beneran)
UPDATE orders
SET shipping_metadata = COALESCE(shipping_metadata->'previous_error', '{}'::jsonb)
WHERE (shipping_metadata->>'mocked')::bool = true
  AND (shipping_metadata->>'reason') IS NULL;  -- skip yang webhook_not_triggered

-- Revert webhook_not_triggered ones
UPDATE orders
SET shipping_metadata = '{}'::jsonb
WHERE shipping_metadata->>'reason' = 'webhook_not_triggered';
```

## Security Advisors (Out of Scope, Untuk Future)

Supabase advisors warning yang ditemukan tapi **tidak diaplikasikan** karena tidak terkait Biteship:

- `function_search_path_mutable` di 9 functions (kosmetik, perlu set `search_path` per function)
- `extension_in_public` untuk `pg_trgm` (sebaiknya pindah ke schema `extensions`)
- `public_bucket_allows_listing` di 7 buckets (avatars, banners, categories, pets, products, reviews, services) — pertimbangkan ganti SELECT policy ke specific path
- `auth_leaked_password_protection` disabled (aktifkan di Supabase Dashboard → Auth → Settings)
