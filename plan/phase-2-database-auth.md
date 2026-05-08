# Phase 2 — Database & Auth

## Objective
Setup Supabase database schema lengkap + WhatsApp OTP authentication flow.

## Tasks

### Database
- [ ] Buat migration: `profiles` table + RLS
- [ ] Buat migration: `otp_codes` table
- [ ] Buat migration: `addresses` table + RLS
- [ ] Buat migration: `products` + `product_variants` + `product_images` tables
- [ ] Buat migration: `coupons` + `flash_sales` + `flash_sale_items` tables
- [ ] Buat migration: `orders` + `order_items` tables + RLS
- [ ] Buat migration: `carts` + `cart_items` tables + RLS
- [ ] Buat RPC function: `reduce_stock` (atomic)
- [ ] Buat RPC function: `validate_coupon`
- [ ] Setup Supabase Storage bucket untuk product images

### Auth (WhatsApp OTP)
- [ ] API route: `POST /api/auth/otp/request`
- [ ] API route: `POST /api/auth/otp/verify`
- [ ] Integrasi Fonnte API (kirim WA)
- [ ] OTP hashing (SHA-256) + expiry logic
- [ ] Rate limiting (max 3 OTP per nomor per 15 menit)
- [ ] Auto-create profile on first login

## Output
- Database schema live di Supabase
- User bisa login via WhatsApp OTP
- RLS aktif di semua tabel
