# PRODUCT REQUIREMENTS DOCUMENT (PRD)

## Bananasbindery E-Commerce, Booking & Delivery Platform — Jakarta

---

## 1. PRODUCT OVERVIEW

### 1.1 Latar Belakang

Bananasbindery di Jakarta membutuhkan sistem terintegrasi untuk:

- Penjualan produk hewan (makanan, aksesoris, obat) — **core revenue**
- Layanan grooming & pet hotel
- Pengiriman berbasis lokasi (same-day & reguler)
- Pembayaran digital (QRIS, e-wallet, transfer)
- Promo, loyalty & repeat order engine
- Manajemen pet profile per customer

Masalah saat ini:

- Overbooking layanan grooming/hotel
- Ongkir tidak akurat (manual)
- Operasional manual (WhatsApp-based)
- Tidak ada tracking order & stok
- Sulit scaling ke multi-branch

### 1.2 Tujuan Produk

Membangun platform web yang:

- Menjadikan e-commerce sebagai core revenue
- Mengintegrasikan booking grooming & pet hotel
- Mengotomatisasi shipping (API kurir), payment, & notifikasi
- Meningkatkan repeat order via loyalty & reorder system
- Memberikan owner visibility penuh ke financial metrics

### 1.3 Product Positioning

- **Core**: E-commerce (produk hewan)
- **Service**: Grooming & Pet Hotel (booking-based)
- **Engine**: Shipping, Payment, Promo, Loyalty, Notification
- **Differentiator**: Pet profile, reorder, WhatsApp-first communication

---

## 2. DESIGN & BRANDING

- Primary color: Orange muda / salem
- Accent: Orange
- Style: Clean, modern, minimal, mobile-first
- UX: Cepat, simple, no friction
- Typography: Inter / Outfit (Google Fonts)
- Micro-animations: Framer Motion

---

## 3. USER TYPES & PERMISSIONS

| Role         | Akses                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------- |
| **Customer** | Browse, cart, checkout, booking, pet profile, order history, loyalty                     |
| **Staff**    | Semua akses customer + view semua orders/bookings, update status booking                 |
| **Admin**    | Semua akses staff + manage produk, order, booking, stok, CMS banner, voucher, notifikasi |
| **Owner**    | Semua akses admin + financial dashboard, analytics, settings, audit logs, delete orders  |

---

## 4. AUTHENTICATION

### Primary: Phone OTP (via Twilio / WhatsApp)

### Secondary: Google OAuth

### Optional: Email + Password

Flow:

1. Register → input phone → OTP → set name → done
2. Login → phone → OTP → dashboard
3. Admin/Owner → email + password (Supabase Auth)

---

## 5. CORE MODULES

### 5.1 E-Commerce

**Product Types:** Normal, Frozen, Parcel

**Features:**

- Product listing with search & filter
- Product detail (images carousel, description, reviews)
- Variants (size, weight, flavor) with individual stock & price
- Categories & subcategories
- Stock management with low-stock alerts
- Cart (persistent, server-side)
- Checkout with address selection
- Wishlist / favorites
- Reorder from order history

**Pricing:**

- Harga normal + harga coret (strikethrough)
- Diskon per-product & per-variant
- Voucher / coupon code

**Search & Filter:**

- Full-text search (Supabase `tsvector`)
- Filter: category, price range, product type, rating
- Sort: newest, popular, price low-high, price high-low

### 5.2 Shipping

**Kurir:**

- JNE, JNT, Anteraja (via RajaOngkir / Biteship API)
- Same-day (kurir internal / Grab)
- Parcel (produk besar)
- Gojek Instant (future)

**Rules:**

- Ongkir dihitung via API berdasarkan berat + lokasi
- Frozen: hanya same-day, max 15km, wajib styrofoam packaging
- Same-day: `IF same_city AND distance <= 15km AND order_time < 14:00 → available`
- Cut-off time same-day: **14:00 WIB**
- Auto-filter kurir berdasarkan product type
- Input resi oleh admin → customer bisa tracking

### 5.3 Payment

**Provider:** Midtrans atau Xendit

**Methods:**

- QRIS
- E-wallet (GoPay, OVO, Dana, ShopeePay)
- Virtual Account (BCA, BNI, Mandiri, BRI)
- Credit/Debit Card

**Support:**

- Full payment (e-commerce)
- DP / down payment (pet hotel)
- Auto-expire unpaid orders (2 jam)

### 5.4 Booking System

**Services:**

| Service        | DP           | Slot                   |
| -------------- | ------------ | ---------------------- |
| Grooming Basic | Tidak wajib  | Per jam                |
| Grooming Full  | Tidak wajib  | Per jam                |
| Pet Hotel      | Wajib DP 50% | Per hari, max capacity |

**Rules:**

- No overbooking (slot-based, real-time)
- Booking butuh data pet (nama, jenis, berat)
- Reminder H-1 via WhatsApp
- Cancellation: free cancel H-1, charge 50% jika < 24 jam

### 5.5 Pet Profile

- Customer bisa register multiple pets
- Data: nama, jenis (dog/cat/dll), breed, berat, tanggal lahir, foto
- Auto-fill saat booking grooming/hotel
- Rekomendasi produk berdasarkan jenis & ukuran pet
- Reminder grooming berkala (opsional)

### 5.6 Promo System

- Harga coret (strikethrough price)
- Diskon percentage & fixed amount
- Campaign (flash sale, bundling)
- Voucher/coupon code dengan: min order, max discount, usage limit, validity period

### 5.7 Loyalty System

- Earn points dari setiap pembelian (1% dari total)
- Redeem points sebagai diskon
- Point history (earn/redeem/expire)
- Points expire setelah 12 bulan
- Tier system (future): Bronze → Silver → Gold

### 5.8 Notification System

**Channels:**

- WhatsApp (primary — via Fonnte / Wablas / official API)
- Push notification (web)
- In-app notification

**Triggers:**

- Order: confirmation, payment received, shipped, delivered
- Booking: confirmation, reminder H-1, completed
- Promo: new campaign, voucher expiring
- Stock: low stock alert (admin only)
- Loyalty: points earned, points expiring

### 5.9 Review & Rating

- Customer bisa review produk setelah order delivered
- Rating 1-5 bintang + komentar
- Foto review (opsional)
- Admin bisa reply review
- Average rating ditampilkan di product card & detail

---

## 6. CMS & BANNER

**Banner Types:** Hero, Promo, Category

**Features:**

- Upload image
- Schedule (start/end date)
- Priority/sort order
- CTA link (ke produk/category/promo page)
- Type classification
- Toggle active/inactive

---

## 7. DASHBOARD SYSTEM

### 7.1 Admin Dashboard

- Manage produk (CRUD + variants + images)
- Manage orders (status update, input resi)
- Manage booking (approve, reschedule, cancel)
- Manage stok (adjustment, movement log)
- Manage banner/CMS
- View customer list
- Send notifications

### 7.2 Owner Dashboard

**Financial Metrics:**

- Omset (gross revenue)
- Net revenue (after discount & returns)
- HPP (cost of goods sold)
- Gross profit & net profit
- Pajak (tax)
- AOV (average order value)
- Repeat customer rate
- Revenue by category
- Revenue by period (daily/weekly/monthly)

**Operational Metrics:**

- Total orders & conversion rate
- Booking utilization rate
- Top selling products
- Stock alerts
- Customer growth

---

## 8. INVENTORY MANAGEMENT

- Real-time stock tracking per variant
- Low stock alert (configurable threshold)
- Stock movement history (in/out/adjustment/return)
- Batch & expiry tracking (untuk makanan & obat hewan)
- Overselling prevention (database-level lock)

---

## 9. ORDER & RETURN FLOW

### Order Status Flow:

```
pending → paid → processing → shipped → delivered → completed
                                                   → return_requested → returned → refunded
         → expired (auto, 2 jam)
         → cancelled (by customer/admin)
```

### Return/Refund Policy:

- Request dalam 2x24 jam setelah delivered
- Alasan: rusak, salah kirim, frozen mencair
- Bukti foto wajib
- Refund ke saldo / original payment method
- Admin approve/reject return request

---

## 10. STORE LOCATION

**Config per branch:**

- Store name
- Full address
- City & district
- Phone & WhatsApp number
- Latitude & longitude
- Operating hours (per hari)
- Services available

**Implementation:**

- MVP: single store, hardcoded
- Production: multi-branch, map picker (Google Maps / Leaflet)

---

## 11. USER FLOWS

### Purchase:

```
browse/search → product detail → add to cart → cart → checkout
→ select address → select shipping → apply voucher → payment → confirmation
→ admin process → shipped (resi) → delivered → review
```

### Grooming:

```
pilih service → pilih tanggal & slot → pilih/tambah pet → confirm → done
→ reminder H-1 → datang → selesai → review
```

### Pet Hotel:

```
pilih tanggal (check-in/out) → pilih/tambah pet → DP payment → confirm
→ reminder H-1 → check-in → check-out → full payment → review
```

---

## 12. SEO & MARKETING

- Product page: slug URL, meta title, meta description, Open Graph tags
- Category page: SEO-friendly URLs
- Google Business Profile integration
- Instagram feed embed (Bananasbindery Jakarta sangat bergantung IG)
- WhatsApp share button di product page
- Sitemap & robots.txt

---

## 13. NON-FUNCTIONAL REQUIREMENTS

- **Performance**: < 3s page load, < 1s API response
- **Mobile**: Mobile-first responsive design
- **Security**: RLS, input validation, rate limiting, HTTPS
- **Scalability**: Horizontal scaling ready
- **Availability**: 99.5% uptime
- **Browser**: Chrome, Safari, Firefox (latest 2 versions)
- **Accessibility**: WCAG 2.1 Level A minimum

---

## 14. TECH STACK (MONOREPO)

> Arsitektur monorepo dengan **Turborepo + pnpm workspaces**. Core logic & API client bisa di-reuse di web, mobile, dan desktop. Detail lengkap di [ARCHITECTURE.md](./ARCHITECTURE.md).

### Monorepo

- **Turborepo** (build orchestration)
- **pnpm** (package manager + workspaces)
- **TypeScript** (strict mode, shared tsconfig)

### Frontend — Web

- React + Next.js (App Router)
- shadcn/ui + Tailwind CSS + Radix UI
- Framer Motion (animations)

### Frontend — Mobile

- React Native (Expo + Expo Router)
- NativeWind (Tailwind for RN) atau Tamagui

### Frontend — Desktop (Future)

- Electron atau Tauri (wrapping web app)

### State Management (shared)

- TanStack Query (server state)
- Zustand (client state)

### Backend (Standalone API)

- **NestJS** (REST API, independent dari Next.js)
- Deploy: Railway / Fly.io / VPS / Vercel Serverless

### Shared Packages

- `@bananasbindery/types` — TypeScript types (semua platform)
- `@bananasbindery/core` — Business logic (pricing, shipping rules, validations)
- `@bananasbindery/api-client` — API SDK (fetch wrapper, semua frontend)
- `@bananasbindery/hooks` — React hooks (web + mobile)
- `@bananasbindery/store` — Zustand stores (web + mobile)
- `@bananasbindery/utils` — Utility functions (semua platform)
- `@bananasbindery/ui` — Shared UI components (web only)
- `@bananasbindery/config` — Shared env & constants

### Database & Auth

- Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)

### Payment

- Midtrans atau Xendit

### Shipping

- RajaOngkir atau Biteship API

### Maps

- Google Maps API atau Leaflet + OpenStreetMap

### Notification

- WhatsApp: Fonnte / Wablas
- Push: Web Push API + Expo Notifications (mobile)

### Storage

- Supabase Storage (primary)
- Cloudinary (image optimization, optional)

### Deployment

- Vercel (web + admin frontend)
- Railway / Fly.io (NestJS API)
- Supabase (DB + auth + storage)
- EAS Build (mobile app → App Store & Play Store)

### Monitoring

- Sentry (error tracking — web, mobile, API)
- Vercel Analytics (web performance)
- Grafana / Uptime Robot (API health)

---

# 15. DATABASE SCHEMA (SUPABASE / POSTGRESQL)

---

## USERS

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  phone text unique,
  role text not null default 'customer' check (role in ('customer','staff','admin','owner')),
  avatar_url text,
  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## ADDRESSES

```sql
create table addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  label text default 'Rumah',
  recipient_name text,
  phone text,
  full_address text not null,
  city text default 'Jakarta',
  district text,
  postal_code text,
  latitude numeric,
  longitude numeric,
  is_default boolean default false,
  created_at timestamp default now()
);
```

## PETS

```sql
create table pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('dog','cat','bird','hamster','rabbit','fish','other')),
  breed text,
  weight_kg numeric,
  birth_date date,
  notes text,
  avatar_url text,
  created_at timestamp default now()
);
```

## CATEGORIES

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  parent_id uuid references categories(id),
  sort_order int default 0,
  is_active boolean default true
);
```

## PRODUCTS

```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id),
  name text not null,
  slug text unique not null,
  description text,
  price numeric not null,
  promo_price numeric,
  cost_price numeric not null,
  stock int default 0,
  weight_grams int default 0,
  type text not null default 'normal' check (type in ('normal','frozen','parcel')),
  meta_title text,
  meta_description text,
  is_active boolean default true,
  avg_rating numeric default 0,
  review_count int default 0,
  sold_count int default 0,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## PRODUCT_VARIANTS

```sql
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  name text not null,
  sku text unique,
  price numeric not null,
  promo_price numeric,
  cost_price numeric not null,
  stock int default 0,
  weight_grams int default 0,
  sort_order int default 0,
  is_active boolean default true
);
```

## PRODUCT_IMAGES

```sql
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int default 0
);
```

## CARTS

```sql
create table carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique,
  updated_at timestamp default now()
);
```

## CART_ITEMS

```sql
create table cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references carts(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  quantity int not null default 1 check (quantity > 0),
  created_at timestamp default now()
);
```

## ORDERS

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references users(id),
  address_id uuid references addresses(id),
  status text not null default 'pending'
    check (status in ('pending','paid','processing','shipped','delivered','completed','cancelled','expired')),
  payment_status text default 'unpaid'
    check (payment_status in ('unpaid','paid','refunded','partial_refund')),
  payment_method text,
  payment_id text,
  shipping_method text,
  shipping_tracking text,
  shipping_courier text,
  subtotal numeric not null default 0,
  discount numeric default 0,
  voucher_id uuid,
  shipping_cost numeric default 0,
  tax numeric default 0,
  total numeric not null default 0,
  hpp_total numeric default 0,
  profit numeric default 0,
  notes text,
  paid_at timestamp,
  shipped_at timestamp,
  delivered_at timestamp,
  expired_at timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## ORDER_ITEMS

```sql
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  product_name text not null,
  variant_name text,
  quantity int not null,
  price numeric not null,
  cost_price numeric not null,
  discount numeric default 0,
  subtotal numeric not null
);
```

## ORDER_RETURNS

```sql
create table order_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  user_id uuid references users(id),
  reason text not null,
  description text,
  photo_urls text[],
  status text default 'requested'
    check (status in ('requested','approved','rejected','refunded')),
  refund_amount numeric,
  refund_method text,
  admin_notes text,
  created_at timestamp default now(),
  resolved_at timestamp
);
```

## SERVICES

```sql
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('grooming','hotel')),
  description text,
  price numeric not null,
  duration_minutes int,
  requires_dp boolean default false,
  dp_percentage numeric default 50,
  is_active boolean default true,
  sort_order int default 0
);
```

## BOOKING_SLOTS

```sql
create table booking_slots (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time_slot time,
  type text not null check (type in ('grooming','hotel')),
  capacity int not null,
  booked int default 0,
  unique(date, time_slot, type)
);
```

## BOOKINGS

```sql
create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text unique not null,
  user_id uuid references users(id),
  pet_id uuid references pets(id),
  service_id uuid references services(id),
  slot_id uuid references booking_slots(id),
  date_start date not null,
  date_end date,
  time_slot time,
  status text default 'pending'
    check (status in ('pending','confirmed','in_progress','completed','cancelled')),
  dp_amount numeric default 0,
  total_amount numeric not null,
  payment_status text default 'unpaid'
    check (payment_status in ('unpaid','dp_paid','paid','refunded')),
  notes text,
  cancellation_reason text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
```

## VOUCHERS

```sql
create table vouchers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('percentage','fixed')),
  value numeric not null,
  min_order numeric default 0,
  max_discount numeric,
  usage_limit int,
  used_count int default 0,
  valid_from timestamp not null,
  valid_until timestamp not null,
  is_active boolean default true,
  created_at timestamp default now()
);
```

## BANNERS

```sql
create table banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('hero','promo','category')),
  image_url text not null,
  link text,
  priority int default 0,
  start_date timestamp,
  end_date timestamp,
  is_active boolean default true,
  created_at timestamp default now()
);
```

## STORE_LOCATIONS

```sql
create table store_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  full_address text not null,
  city text default 'Jakarta',
  district text,
  phone text,
  whatsapp text,
  latitude numeric not null,
  longitude numeric not null,
  operating_hours jsonb,
  services_available text[],
  is_active boolean default true
);
```

## LOYALTY

```sql
create table loyalty (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique,
  total_points int default 0,
  lifetime_points int default 0,
  updated_at timestamp default now()
);
```

## LOYALTY_HISTORY

```sql
create table loyalty_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  order_id uuid references orders(id),
  points_change int not null,
  type text not null check (type in ('earn','redeem','expire','adjustment')),
  description text,
  created_at timestamp default now()
);
```

## REVIEWS

```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  product_id uuid references products(id),
  order_id uuid references orders(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  photo_urls text[],
  admin_reply text,
  is_visible boolean default true,
  created_at timestamp default now()
);
```

## WISHLISTS

```sql
create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamp default now(),
  unique(user_id, product_id)
);
```

## STOCK_MOVEMENTS

```sql
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  type text not null check (type in ('in','out','adjustment','return')),
  quantity int not null,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references users(id),
  created_at timestamp default now()
);
```

## NOTIFICATIONS

```sql
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  body text,
  type text check (type in ('order','booking','promo','loyalty','system')),
  reference_type text,
  reference_id uuid,
  channel text default 'in_app' check (channel in ('in_app','whatsapp','push')),
  is_read boolean default false,
  created_at timestamp default now()
);
```

---

## DATABASE INDEXES

```sql
-- Performance indexes
create index idx_products_category on products(category_id);
create index idx_products_slug on products(slug);
create index idx_products_type on products(type);
create index idx_products_active on products(is_active);
create index idx_product_variants_product on product_variants(product_id);
create index idx_orders_user on orders(user_id);
create index idx_orders_status on orders(status);
create index idx_orders_created on orders(created_at desc);
create index idx_order_items_order on order_items(order_id);
create index idx_bookings_user on bookings(user_id);
create index idx_bookings_date on bookings(date_start);
create index idx_booking_slots_date on booking_slots(date, type);
create index idx_reviews_product on reviews(product_id);
create index idx_notifications_user on notifications(user_id, is_read);
create index idx_loyalty_history_user on loyalty_history(user_id);
create index idx_stock_movements_product on stock_movements(product_id);
create index idx_addresses_user on addresses(user_id);
create index idx_pets_user on pets(user_id);

-- Full-text search
alter table products add column search_vector tsvector
  generated always as (to_tsvector('indonesian', coalesce(name,'') || ' ' || coalesce(description,''))) stored;
create index idx_products_search on products using gin(search_vector);
```

---

## ROW LEVEL SECURITY (RLS) POLICIES

```sql
-- Enable RLS on all tables
alter table users enable row level security;
alter table addresses enable row level security;
alter table pets enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table bookings enable row level security;
alter table reviews enable row level security;
alter table wishlists enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table loyalty enable row level security;
alter table loyalty_history enable row level security;
alter table notifications enable row level security;

-- Customer: hanya bisa akses data sendiri
create policy "users_own_data" on users for select using (auth.uid() = id);
create policy "addresses_own" on addresses for all using (auth.uid() = user_id);
create policy "pets_own" on pets for all using (auth.uid() = user_id);
create policy "orders_own" on orders for select using (auth.uid() = user_id);
create policy "bookings_own" on bookings for select using (auth.uid() = user_id);
create policy "wishlists_own" on wishlists for all using (auth.uid() = user_id);
create policy "notifications_own" on notifications for select using (auth.uid() = user_id);

-- Public: produk, kategori, banner bisa diakses semua
create policy "products_public" on products for select using (is_active = true);
create policy "categories_public" on categories for select using (is_active = true);
create policy "banners_public" on banners for select using (is_active = true);
create policy "reviews_public" on reviews for select using (is_visible = true);

-- Admin/Owner: full access via service role atau custom claim
-- Implementasi via Supabase custom claims: app_metadata.role = 'admin' | 'owner'
```

---

# 16. SUPABASE FEATURES USAGE

- **Auth** → Phone OTP + Google OAuth + Email (admin/owner)
- **RLS** → Role-based access (customer/admin/owner policies)
- **Storage** → Product images, banner images, review photos, pet avatars
- **Realtime** → Booking slot updates, order status changes, notifications
- **Edge Functions** → Payment webhooks, shipping API calls, WhatsApp notifications
- **Full-text Search** → Product search via `tsvector`

---

# 17. ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Payment
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false

# Shipping
RAJAONGKIR_API_KEY=

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=

# WhatsApp Notification
WHATSAPP_API_KEY=
WHATSAPP_SENDER_NUMBER=

# Storage
NEXT_PUBLIC_STORAGE_URL=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=BananasbinderyJKT
```

---

# 18. API ENDPOINTS OVERVIEW

### Auth

| Method | Endpoint               | Desc               |
| ------ | ---------------------- | ------------------ |
| POST   | `/api/auth/otp/send`   | Kirim OTP ke phone |
| POST   | `/api/auth/otp/verify` | Verifikasi OTP     |
| POST   | `/api/auth/register`   | Register user baru |
| GET    | `/api/auth/me`         | Get current user   |

### Products

| Method | Endpoint               | Desc                   |
| ------ | ---------------------- | ---------------------- |
| GET    | `/api/products`        | List + search + filter |
| GET    | `/api/products/[slug]` | Detail produk          |
| GET    | `/api/categories`      | List kategori          |

### Cart

| Method | Endpoint               | Desc        |
| ------ | ---------------------- | ----------- |
| GET    | `/api/cart`            | Get cart    |
| POST   | `/api/cart/items`      | Add item    |
| PATCH  | `/api/cart/items/[id]` | Update qty  |
| DELETE | `/api/cart/items/[id]` | Remove item |

### Orders

| Method | Endpoint                  | Desc                    |
| ------ | ------------------------- | ----------------------- |
| POST   | `/api/orders`             | Create order (checkout) |
| GET    | `/api/orders`             | List user orders        |
| GET    | `/api/orders/[id]`        | Detail order            |
| POST   | `/api/orders/[id]/return` | Request return          |

### Booking

| Method | Endpoint                   | Desc               |
| ------ | -------------------------- | ------------------ |
| GET    | `/api/booking/slots`       | Available slots    |
| POST   | `/api/booking`             | Create booking     |
| GET    | `/api/booking`             | List user bookings |
| PATCH  | `/api/booking/[id]/cancel` | Cancel booking     |

### Shipping

| Method | Endpoint                     | Desc           |
| ------ | ---------------------------- | -------------- |
| POST   | `/api/shipping/cost`         | Cek ongkir     |
| GET    | `/api/shipping/track/[resi]` | Track shipment |

### Payment

| Method | Endpoint               | Desc             |
| ------ | ---------------------- | ---------------- |
| POST   | `/api/payment/create`  | Create payment   |
| POST   | `/api/payment/webhook` | Payment callback |

### Admin

| Method | Endpoint               | Desc              |
| ------ | ---------------------- | ----------------- |
| CRUD   | `/api/admin/products`  | Manage products   |
| CRUD   | `/api/admin/orders`    | Manage orders     |
| CRUD   | `/api/admin/bookings`  | Manage bookings   |
| CRUD   | `/api/admin/banners`   | Manage banners    |
| GET    | `/api/admin/dashboard` | Dashboard metrics |

### Owner

| Method | Endpoint               | Desc             |
| ------ | ---------------------- | ---------------- |
| GET    | `/api/owner/financial` | Financial report |
| GET    | `/api/owner/analytics` | Analytics data   |

---

# 19. MVP SCOPE & TIMELINE

### Phase 1 (MVP — 8 minggu):

- Auth (phone OTP + email)
- E-commerce (products, categories, variants, cart, checkout)
- Payment integration (Midtrans/Xendit)
- Shipping (RajaOngkir API)
- Order management (admin)
- Basic CMS & banner
- Admin dashboard
- Mobile responsive

### Phase 2 (4 minggu):

- Booking system (grooming + pet hotel)
- Pet profile
- WhatsApp notifications
- Review & rating
- Search & filter
- Owner dashboard (financial)

### Phase 3 (4 minggu):

- Loyalty system
- Voucher/promo system
- Wishlist & reorder
- Return/refund flow
- Stock movement tracking
- Push notifications

### Phase 4 (Future):

- Multi-branch support
- Subscription / auto-reorder
- Instagram feed integration
- Gojek/Grab instant delivery
- Loyalty tiers
- Mobile app (React Native)

---

# 20. SUCCESS METRICS

| Metric                         | Target (6 bulan) |
| ------------------------------ | ---------------- |
| Monthly Active Users           | 1,000+           |
| Online order rate vs walk-in   | 30%+             |
| Repeat order rate              | 40%+             |
| Booking overbooking rate       | 0%               |
| Average order value (AOV)      | Rp 150,000+      |
| Page load time                 | < 3 detik        |
| Cart abandonment rate          | < 50%            |
| Customer satisfaction (rating) | 4.5+ / 5         |

---

# 21. RISK MITIGATION

| Risk                       | Impact | Mitigation                                        |
| -------------------------- | ------ | ------------------------------------------------- |
| Payment gateway downtime   | Tinggi | Dual provider (Midtrans + Xendit fallback)        |
| Frozen food delivery issue | Tinggi | Max distance 15km, wajib styrofoam, same-day only |
| Overbooking grooming/hotel | Tinggi | Database-level slot locking, real-time check      |
| Stock overselling          | Sedang | PostgreSQL row-level lock pada checkout           |
| WhatsApp API rate limit    | Sedang | Queue system, batch sending                       |
| Data breach                | Tinggi | RLS, encrypted secrets, regular security audit    |
| Supabase downtime          | Sedang | Health check monitoring, cached fallback          |

---

# 22. FINAL SUMMARY

> **Platform e-commerce + booking terintegrasi untuk Bananasbindery Jakarta**, dengan arsitektur **monorepo** (Turborepo) yang mendukung web, mobile (React Native), dan desktop. Shared core logic & API client memastikan konsistensi di semua platform.
>
> **Architecture**: Monorepo — 4 apps + 8 shared packages
> **Tech**: Next.js + NestJS + React Native + Supabase + shadcn/ui
> **Database**: 22 tabel PostgreSQL dengan RLS, indexes, dan full-text search
> **Timeline**: MVP 8 minggu, full platform 16 minggu
> **Target**: 1,000+ MAU dalam 6 bulan
