# Arsitektur Sistem & Skema Database - Bananasbindery

## 1. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Monorepo | Turborepo |
| Frontend | Next.js 14 (App Router), React, Tailwind CSS, Shadcn UI |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Custom WhatsApp OTP |
| Storage | Supabase Storage (gambar produk) |
| Payment | Xendit |
| Logistik | RajaOngkir Pro (level kecamatan) |
| WhatsApp Gateway | Fonnte |
| Email | Resend |
| Hosting | Vercel |

## 2. Monorepo Structure (Turborepo)

```
bananabinder/
├── apps/
│   └── web/                          # Next.js app
│       ├── app/
│       │   ├── (storefront)/         # Public: home, products, cart, checkout
│       │   ├── (auth)/              # Login OTP
│       │   └── admin/               # Dashboard, products, orders, coupons, flash-sales
│       ├── components/
│       ├── lib/
│       └── next.config.ts
├── packages/
│   ├── ui/                           # Shared UI components (Shadcn-based)
│   ├── db/                           # Supabase client, types, queries
│   ├── config/                       # Shared Tailwind config, constants
│   └── tsconfig/                     # Shared TypeScript configs
├── supabase/
│   └── migrations/                   # SQL migrations
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## 3. Design System

### 3.1 Color Palette
| Token | Hex | Penggunaan |
|-------|-----|------------|
| `banan-blue` | `#7EC8E3` | Primary buttons, header, links |
| `banan-pink` | `#F2A7C3` | Accent, badges, highlights |
| `banan-yellow` | `#F9E79F` | CTA, sale tags, notifications |
| `banan-blue-dark` | `#5BA4C4` | Hover/active states |
| `banan-pink-dark` | `#D98AA8` | Hover states |
| `banan-yellow-dark` | `#E5D07A` | Hover states |
| `neutral-50` | `#FAFAFA` | Background |
| `neutral-900` | `#171717` | Text |

### 3.2 Typography
- **Font:** Inter
- **Heading:** Bold (600-700)
- **Body:** Regular (400)

## 4. System Flow

### 4.1 Autentikasi (WhatsApp OTP)
1. User input nomor WA → API generate 6-digit OTP.
2. OTP di-hash (SHA-256) dan disimpan di tabel `otp_codes` (expiry 5 menit).
3. OTP dikirim via Fonnte ke WhatsApp user.
4. User input OTP → API verifikasi hash → Buat/ambil user di Supabase Auth → Return session token.

### 4.2 Checkout Flow
1. Client kirim `cart_items[]` + `coupon_code` + `address_id` + `courier_code`.
2. API validasi: stok tersedia, kupon valid (kuota, min purchase, expiry).
3. API hitung ongkir via RajaOngkir.
4. Jika kupon `discount_type = free_shipping` → ongkir di-set 0 (ditanggung owner).
5. API lock harga → simpan ke `orders` + `order_items` (snapshot harga).
6. API buat invoice Xendit → return `payment_url`.
7. User bayar → Xendit kirim webhook → API verifikasi signature → update status `paid` → kurangi stok (atomic RPC).

### 4.3 Abandoned Cart Recovery
- Cron job (setiap 6 jam) cek `carts` dengan `updated_at` > 24 jam yang belum checkout.
- Kirim notifikasi WA/email pengingat.

## 5. Skema Database (PostgreSQL)

### 5.1 Auth & User
```sql
-- otp_codes
id (uuid, PK), phone (text), otp_hash (text), expires_at (timestamptz), used (boolean), created_at

-- profiles
id (uuid, PK, FK → auth.users), full_name (text), phone (text, unique), role (enum: user/admin), created_at, updated_at

-- addresses
id (uuid, PK), user_id (FK → profiles), label (text), recipient_name (text), phone (text), province_id (int), city_id (int), district_id (int), postal_code (text), full_address (text), is_default (boolean)
```

### 5.2 Katalog Produk
```sql
-- products
id (uuid, PK), name (text), slug (text, unique), description (text), base_price (int), weight_grams (int), is_active (boolean), created_at, updated_at

-- product_variants
id (uuid, PK), product_id (FK), ring_size (text), ring_count (int), cover_color (text), paper_type (text), page_count (int), stock (int), sku (text, unique), price_override (int, nullable)

-- product_images
id (uuid, PK), product_id (FK), url (text), alt (text), sort_order (int)
```

### 5.3 Marketing
```sql
-- coupons
id (uuid, PK), code (text, unique), discount_type (enum: percentage/fixed/free_shipping), discount_value (int), min_purchase_amount (int), max_discount_amount (int, nullable), usage_limit (int), used_count (int, default 0), valid_from (timestamptz), valid_until (timestamptz), is_active (boolean)

-- flash_sales
id (uuid, PK), name (text), start_time (timestamptz), end_time (timestamptz), is_active (boolean)

-- flash_sale_items
id (uuid, PK), flash_sale_id (FK), product_id (FK), promo_price (int), stock_allocated (int), stock_sold (int, default 0)
```

### 5.4 Transaksi
```sql
-- orders
id (uuid, PK), user_id (FK), xendit_invoice_id (text), xendit_payment_url (text), status (enum: pending/paid/processing/shipped/delivered/cancelled), refund_status (enum: none/refund_pending/refunded, default 'none'), subtotal (int), shipping_cost (int), coupon_id (FK, nullable), discount_amount (int, default 0), total_amount (int), shipping_address (jsonb), courier_details (jsonb), tracking_number (text, nullable), paid_at (timestamptz), shipped_at (timestamptz), cancelled_at (timestamptz), cancel_reason (text), created_at, updated_at

-- order_items
id (uuid, PK), order_id (FK), variant_id (FK), product_name (text), variant_label (text), quantity (int), price_at_time (int)

-- refunds
id (uuid, PK), order_id (FK → orders), amount (int), method (text), status (enum: pending/processed/failed), processed_by (FK → profiles, nullable), notes (text), created_at, processed_at (timestamptz)
```

### 5.5 Keranjang
```sql
-- carts
id (uuid, PK), user_id (FK, unique), updated_at

-- cart_items
id (uuid, PK), cart_id (FK), variant_id (FK), quantity (int)
-- UNIQUE constraint on (cart_id, variant_id)
```

## 6. API Routes

| Method | Route | Deskripsi |
|--------|-------|-----------|
| POST | `/api/auth/otp/request` | Kirim OTP ke WhatsApp |
| POST | `/api/auth/otp/verify` | Verifikasi OTP, return session |
| GET | `/api/products` | List produk (public) |
| GET | `/api/products/[slug]` | Detail produk + varian |
| POST | `/api/cart` | Add/update cart item |
| DELETE | `/api/cart/[itemId]` | Remove cart item |
| POST | `/api/checkout` | Validasi + buat order + invoice Xendit |
| POST | `/api/shipping/cost` | Hitung ongkir via RajaOngkir |
| POST | `/api/webhooks/xendit` | Handle payment callback |
| GET | `/api/orders` | List orders user |
| PATCH | `/api/admin/orders/[id]` | Update status, input resi |

## 7. Security & Best Practices
- **RLS:** Semua tabel user-facing dilindungi. User hanya akses data sendiri. Admin akses semua.
- **Atomic Stock Reduction:** Pakai database function (RPC) dengan `UPDATE ... SET stock = stock - $qty WHERE stock >= $qty RETURNING *` untuk prevent race condition.
- **Data Snapshot:** Harga dan alamat di-copy ke `orders`/`order_items` saat checkout. Perubahan data master tidak mempengaruhi history.
- **Webhook Verification:** Validasi `x-callback-token` dari Xendit sebelum proses.
- **OTP Security:** Hash OTP, expiry 5 menit, max 3 attempts, rate limit per nomor.
- **Input Validation:** Zod schema di semua API routes.
- **DDoS & Rate Limiting:**
  - Infrastructure: Vercel Edge Network (auto DDoS mitigation).
  - Application: Upstash Redis rate limiter per endpoint.
  - `/api/auth/otp/request` → max 3 req/nomor/15 menit.
  - `/api/checkout` → max 5 req/user/jam.
  - `/api/shipping/cost` → cached per kecamatan + max 10 req/user/menit.
  - `/api/webhooks/xendit` → signature reject = instant 401, no processing.

## 8. Turborepo Pipeline

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {}
  }
}
```
