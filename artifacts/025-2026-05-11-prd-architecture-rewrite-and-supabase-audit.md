# 025 — PRD & Architecture Rewrite + Supabase Audit

**Tanggal**: 2026-05-11
**Aktor**: Claude (Opus 4.7) + User (Jhordi)
**Scope**: Audit penuh PRD/ARCHITECTURE/Supabase, rewrite dokumen v2.0, identifikasi security gap.

---

## 1. Apa yang Diubah

| File                                                        | Aksi             |
| ----------------------------------------------------------- | ---------------- |
| `PRD.md`                                                    | Full rewrite v2.0 |
| `ARCHITECTURE.md`                                           | Full rewrite v2.0 |
| `artifacts/025-2026-05-11-prd-architecture-rewrite-…md`     | New (this file)   |
| `supabase/migrations/009_security_hardening.sql`            | **Tidak dibuat otomatis** — SQL ada di §4 di bawah, tunggu approval user untuk apply via MCP. |

---

## 2. Mengapa

1. **Schema mismatch**: Dokumen lama dibuat referensi ke project Supabase salah (`bananabinder` = legacy pet store "Bananasbindery"). User reconnect MCP ke project `binderbanana2` (ref `xiumxugolyfsvwnwzenp`) yang punya schema binder benar.
2. **Stack drift**: PRD v1 sebut RajaOngkir + Drizzle + Resend — semua sudah berubah di lapangan (Biteship live, no Drizzle, no email).
3. **Checkout flow baru**: User memperjelas UX → cart → map sheet → auto-fill alamat → OTP WA → kurir → bayar. Spec lama tidak menggambarkan flow ini.
4. **12 security warnings** dari Supabase advisor di project `binderbanana2`.

---

## 3. Hasil Audit Supabase (`binderbanana2`)

### 3.1 Schema (✅ CLEAN)
13 tabel, semua RLS aktif:
- Auth: `otp_codes`, `profiles`, `addresses`
- Catalog: `products` (6 rows), `product_variants` (13 rows), `product_images`
- Marketing: `coupons` (2 rows), `flash_sales`, `flash_sale_items`
- Transaction: `orders`, `order_items`
- Cart: `carts`, `cart_items`

Tidak ada residu pet store. Migrasi 001–008 sudah applied.

### 3.2 Codebase Alignment (✅ CONFIRMED)
- `.env` → URL & anon key sudah point ke `xiumxugolyfsvwnwzenp.supabase.co`.
- `packages/db/src/schema.ts` & `types.ts` 100% match binder schema.
- Library terpasang: Leaflet, react-leaflet@5, Tabler Icons, Lenis, Shadcn UI, drizzle-orm (terpasang tapi **tidak akan dipakai** sesuai keputusan).
- Service wrappers: `biteship.ts`, `fonnte.ts` sudah ada.
- API routes: Phase 4 lengkap, kecuali map picker UI belum.

### 3.3 Security Advisor (⚠️ 12 WARN)

| # | Rule                                              | Target                                        | Action                    |
| - | ------------------------------------------------- | --------------------------------------------- | ------------------------- |
| 1 | function_search_path_mutable                      | `reduce_stock`, `validate_coupon`, `use_coupon` | `SET search_path = ''`    |
| 2 | anon_security_definer_function_executable         | `reduce_stock`, `rls_auto_enable`, `use_coupon`, `validate_coupon` | `REVOKE EXECUTE FROM anon` |
| 3 | authenticated_security_definer_function_executable| Sama dengan #2                                | `REVOKE EXECUTE FROM authenticated` untuk `rls_auto_enable`; sisanya GRANT terbatas |
| 4 | public_bucket_allows_listing                      | `storage.objects` policy bucket `product-images` | Replace broad SELECT policy |
| 5 | auth_leaked_password_protection                   | Supabase Auth setting                         | Manual enable di dashboard |

---

## 4. Migration SQL Siap Pakai (BELUM DI-APPLY)

File target: `supabase/migrations/009_security_hardening.sql`

```sql
-- 009_security_hardening.sql
-- Date: 2026-05-11
-- Purpose: Resolve 11 Supabase advisor warnings (SECURITY DEFINER + bucket listing).
-- Leaked password protection (#12) must be enabled manually in Auth dashboard.

BEGIN;

-- ============================================================
-- 1. Lock search_path for SECURITY DEFINER functions
-- ============================================================
ALTER FUNCTION public.reduce_stock(uuid, int)            SET search_path = '';
ALTER FUNCTION public.validate_coupon(text, int)         SET search_path = '';
ALTER FUNCTION public.use_coupon(uuid)                   SET search_path = '';
ALTER FUNCTION public.rls_auto_enable()                  SET search_path = '';

-- ============================================================
-- 2. Revoke EXECUTE from public/anon
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.reduce_stock(uuid, int)    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.use_coupon(uuid)           FROM PUBLIC, anon;

-- rls_auto_enable is admin/maintenance only
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 3. Keep authenticated execute for RPCs called by app API
--    (server uses service_role anyway, but keep authenticated
--     path open for SSR session-bound calls)
-- ============================================================
GRANT EXECUTE ON FUNCTION public.reduce_stock(uuid, int)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_coupon(uuid)           TO authenticated;

-- ============================================================
-- 4. Storage: replace broad bucket listing policy
-- ============================================================
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;

CREATE POLICY "Public read product images by name"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- Note: Direct object URLs (CDN /storage/v1/object/public/...) still work.
-- Listing via /storage/v1/object/list/<bucket> will now require authenticated/admin.

COMMIT;
```

### Manual steps (dashboard)
- **Auth → Policies** → enable "Leaked Password Protection" (HIBP).
- **Auth → Rate Limits** → set OTP/SMS rate limit per phone per hour.

---

## 5. Validasi Pasca-Migrasi

Setelah `apply_migration`:
1. `get_advisors type=security` → expect ≤ 1 warning (sisa = leaked password protection).
2. Smoke test:
   - `POST /api/auth/otp/request` → masih kirim WA.
   - `POST /api/checkout` dengan happy path → order created, stock berkurang, Xendit invoice valid.
   - Akses object URL `/storage/v1/object/public/product-images/<key>` → masih return image.
   - Akses list endpoint sebagai anon → 401/403.

---

## 6. Belum Selesai (Next Tasks)

| Item                                      | Owner | Priority |
| ----------------------------------------- | ----- | -------- |
| Apply `009_security_hardening.sql`        | User approval → Claude execute via MCP | 🔴 P0 |
| Enable Leaked Password Protection di Auth | User manual                          | 🔴 P0 |
| Build `MapPicker` + `CheckoutSheet` UI    | Frontend                            | 🟠 P1 |
| Wire Upstash rate limiter ke OTP/checkout | Backend                             | 🟠 P1 |
| Implement abandoned cart cron             | Backend                             | 🟡 P2 |
| Sentry + analytics                        | DevOps                              | 🟡 P2 |
| Drop unused `drizzle-orm` dependency      | Cleanup                             | 🟢 P3 |

---

## 7. Keputusan yang Diambil

- **Schema cleanup**: project lama `bananabinder` (Bananasbindery) dihentikan koneksinya; tidak ada migrasi data karena project baru `binderbanana2` adalah greenfield.
- **Data layer**: Tetap **Supabase JS Client** (server + browser via `@supabase/ssr`). Drizzle ORM tidak dipakai meski package terinstall (akan di-cleanup).
- **Geocoding**: Nominatim primary (free, OSM), Biteship Maps API fallback untuk resolve `area_id` (wajib untuk shipping rate).
- **Email**: Resend di PRD lama → **dihapus**. Komunikasi via WhatsApp Fonnte saja (Indonesia-first).
- **OTP attempts**: Naik dari 3 → 5 sesuai implementasi existing (commit `81e0c67`).

---

## 8. References

- PRD v2.0: `PRD.md`
- Architecture v2.0: `ARCHITECTURE.md`
- Previous audit: `artifacts/024-2026-05-11-full-codebase-audit.md`
- Supabase project ref: `xiumxugolyfsvwnwzenp` (binderbanana2)
- Supabase advisor URL: https://supabase.com/dashboard/project/xiumxugolyfsvwnwzenp/advisors/security
