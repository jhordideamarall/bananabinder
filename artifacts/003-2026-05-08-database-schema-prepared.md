# Phase 2 (Partial) — Database Schema & Seed Prepared

## Date: 2026-05-08
## Phase: 2 - Database & Auth (preparation)

## Summary
Semua SQL migration files dan seed data sudah disiapkan di local. Tinggal apply ke Supabase project baru.

## Files Created

| Path | Deskripsi |
|------|-----------|
| `supabase/migrations/001_auth_users.sql` | otp_codes, profiles, addresses + RLS |
| `supabase/migrations/002_products.sql` | products, product_variants, product_images + RLS |
| `supabase/migrations/003_marketing.sql` | coupons, flash_sales, flash_sale_items + RLS |
| `supabase/migrations/004_orders.sql` | orders, order_items + RLS |
| `supabase/migrations/005_carts.sql` | carts, cart_items + RLS |
| `supabase/migrations/006_functions.sql` | reduce_stock(), validate_coupon(), use_coupon() RPCs |
| `supabase/migrations/007_storage.sql` | product-images bucket + policies |
| `supabase/seed.sql` | Sample products, variants, coupons |

## Schema Overview
- **11 tables** total
- **RLS enabled** on all tables
- **3 RPC functions** (atomic stock, coupon validation, coupon usage)
- **1 storage bucket** (product-images, public read)
- **Indexes** on all FK columns and frequently queried fields

## Next Steps
1. Buat Supabase project baru di dashboard
2. Jalankan migrations 001-007 secara berurutan
3. Jalankan seed.sql untuk sample data
4. Generate TypeScript types (`supabase gen types typescript`)
5. Update `packages/db/src/types.ts` dengan generated types
