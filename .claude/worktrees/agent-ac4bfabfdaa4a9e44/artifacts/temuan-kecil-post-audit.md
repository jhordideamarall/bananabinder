# 🔧 Temuan Kecil & Fix — Post-Audit Phase 0 & 1

**Tanggal:** 2 Mei 2026 (Updated: 22:06 WIB)  
**Konteks:** Setelah user merge 13 migration jadi 1 file (`master_initial_schema_v3.sql`), ditemukan 2 ketidaksinkronan kecil antara SQL migration dan TypeScript types.

---

## Temuan 1: `handle_new_user()` — Unsafe Enum Cast

### Problem

```sql
-- SEBELUM (line 435 di master migration)
COALESCE((NEW.raw_app_meta_data->>'role')::user_role, 'customer')
```

`COALESCE` **tidak mencegah crash** pada cast yang gagal. Jika `raw_app_meta_data->>'role'` berisi value yang bukan member enum (misal typo `'admn'` atau string random), PostgreSQL akan throw error:

```
ERROR: invalid input value for enum user_role: "admn"
```

Ini menyebabkan **seluruh signup flow gagal** — user baru tidak bisa register.

### Fix

```sql
-- SESUDAH
CASE
    WHEN NEW.raw_app_meta_data->>'role' IN ('admin', 'owner', 'staff')
    THEN (NEW.raw_app_meta_data->>'role')::user_role
    ELSE 'customer'::user_role
END
```

**Logika:** Cek dulu apakah value valid (whitelist), baru cast. Kalau tidak valid, fallback ke `customer`. Tidak mungkin crash.

### File yang Diubah

| File                                                                                                                                                        | Perubahan                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [master_initial_schema_v3.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502154216_master_initial_schema_v3.sql) line 434-445 | Single-line INSERT → multi-line dengan CASE/WHEN |

---

## Temuan 2: `PaymentStatus` Enum — TypeScript vs DB Mismatch

### Problem

DB menggunakan **1 merged enum** untuk orders DAN bookings:

```sql
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded', 'partial_refund', 'dp_paid');
```

Tapi TypeScript punya **2 enum terpisah**:

```typescript
// SEBELUM
export enum PaymentStatus {
  Unpaid,
  Paid,
  Refunded,
  PartialRefund, // ← missing dp_paid
}
export enum BookingPaymentStatus {
  Unpaid,
  DpPaid,
  Paid,
  Refunded, // ← missing partial_refund
}
```

Ini bisa menyebabkan:

- TypeScript tidak bisa assign `DpPaid` ke Order payment status (padahal DB allow)
- Compile error kalau coba compare `PaymentStatus` dengan `BookingPaymentStatus` (beda enum)

### Fix

```typescript
// SESUDAH — 1 merged enum matching DB exactly
export enum PaymentStatus {
  Unpaid = 'unpaid',
  Paid = 'paid',
  Refunded = 'refunded',
  PartialRefund = 'partial_refund',
  DpPaid = 'dp_paid', // ← ditambahkan
}

/** @deprecated Use PaymentStatus instead — DB uses a single merged enum */
export const BookingPaymentStatus = PaymentStatus;
```

`BookingPaymentStatus` dijadikan alias deprecated — kode lama yang import `BookingPaymentStatus` tetap jalan, tapi baru ke depan pakai `PaymentStatus` saja.

### File yang Diubah

| File                                                                                                      | Perubahan                                                     |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [enums.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/types/src/enums.ts) line 34-45         | Merge 2 enum → 1 + deprecated alias                           |
| [booking.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/types/src/domain/booking.ts) line 1  | Import `PaymentStatus` gantikan `BookingPaymentStatus`        |
| [booking.ts](file:///Users/jhordideamarall/Projects/Bananasbindery/packages/types/src/domain/booking.ts) line 45 | `paymentStatus: PaymentStatus` (bukan `BookingPaymentStatus`) |

---

## Verifikasi

```bash
$ pnpm type-check  # ✅ 6/6 packages PASS — 0 errors
```

---

## Temuan 3: Tabel `banners` Hilang Saat Merge

### Problem

Saat user merge 13 migration menjadi 1 file `master_initial_schema_v3.sql`, tabel `banners` (dari migration `008_banners_store_locations.sql`) **tidak ikut ter-copy**.

Error saat run di Supabase SQL Editor:

```
ERROR: 42P01: relation "banners" does not exist
CONTEXT: SQL statement "CREATE POLICY "admin_all_banners" ON banners FOR ALL USING (is_admin())"
```

Dynamic RLS loop mencoba create policy pada tabel `banners` yang belum ada.

### Fix

Tambahkan `CREATE TABLE banners (...)` di posisi sebelum `store_locations`.

### File yang Diubah

| File                                                                                                                                                    | Perubahan                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| [master_initial_schema_v3.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502154216_master_initial_schema_v3.sql) line 352 | Tambah CREATE TABLE banners (11 kolom) |

---

## Temuan 4: Storage Policy "Already Exists" Error

### Problem

Setelah reset schema dengan `DROP SCHEMA public CASCADE`, migration masih error:

```
ERROR: 42710: policy "storage_public_read" for table "objects" already exists
```

**Penyebab:** `DROP SCHEMA public CASCADE` hanya menghapus schema `public`. Storage policies hidup di schema `storage` — jadi policies dari run sebelumnya tetap ada.

### Fix

Tambah `DROP POLICY IF EXISTS` sebelum setiap `CREATE POLICY` pada `storage.objects`:

```sql
-- Drop existing storage policies first (they survive DROP SCHEMA public CASCADE)
DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_upload_avatars" ON storage.objects;
DROP POLICY IF EXISTS "storage_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_own_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_own_delete" ON storage.objects;
```

### File yang Diubah

| File                                                                                                                                                        | Perubahan                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [master_initial_schema_v3.sql](file:///Users/jhordideamarall/Projects/Bananasbindery/supabase/migrations/20260502154216_master_initial_schema_v3.sql) line 575-580 | Tambah 5x DROP POLICY IF EXISTS sebelum CREATE |

---

## Deployment ke Supabase — Berhasil ✅

| Langkah                                   | Status                                   | Waktu     |
| ----------------------------------------- | ---------------------------------------- | --------- |
| `DROP SCHEMA public CASCADE` + recreate   | ✅                                       | 22:55 WIB |
| Run `master_initial_schema_v3.sql`        | ✅ 0 errors                              | 22:56 WIB |
| Run `seed.sql`                            | ✅ 30 products, 6 services, 6 categories | 22:58 WIB |
| Regenerate `supabase.ts` TypeScript types | ✅ by user                               | 23:06 WIB |

### Verifikasi di Supabase

```sql
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Result: 29 ✅

SELECT count(*) FROM products;
-- Result: 30 ✅

SELECT count(*) FROM services;
-- Result: 6 ✅
```

---

## Status Akhir — Phase 0 & Phase 1: 100% ✅

| Area                                  | Status                     |
| ------------------------------------- | -------------------------- |
| Migration deployed ke Supabase        | ✅ 29 tabel, 0 error       |
| Seed data live                        | ✅ 30 products, 6 services |
| Migration SQL ↔ TypeScript Enums      | ✅ 100% synced             |
| Auth trigger safety                   | ✅ CASE/WHEN whitelist     |
| Supabase TypeScript types regenerated | ✅                         |
| `pnpm type-check`                     | ✅ 6/6 pass                |
| `pnpm lint`                           | ✅ 0 errors                |
| `pnpm test`                           | ✅ 22/22 pass              |

**🚀 Siap lanjut Phase 2 — Design System & Layout**
