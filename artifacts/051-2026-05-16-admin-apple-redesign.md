# 051 — Admin Apple-style Redesign (Banana Yellow Identity)

**Tanggal**: 2026-05-16
**Scope**: Layout + semua halaman list admin (dashboard, orders, products, categories, promos)
**Tujuan**: Konsolidasi visual admin agar konsisten, lebih mudah digunakan, dengan banana yellow `--primary` sebagai accent identity dan Apple HIG sebagai standar design.

---

## Konteks & Masalah

Sebelum revisi, admin punya **2 sistem design yang bertabrakan**:

1. `layout.tsx`, `page.tsx`, `orders/page.tsx`, `products/page.tsx` → pakai `bg-primary` (banana yellow), `font-black` (weight 900), `shadow-xl`, multi-color stat cards (green/blue/orange/amber).
2. `categories/page.tsx`, `promos/page.tsx` → hardcoded salmon orange `#E07B39` di semua border/eyebrow + dark hero `#1A1714`.

Hasilnya: admin user lihat 2 brand berbeda dalam 1 panel. Tidak ada active state di sidebar nav. Banyak uppercase + tracking-wider bikin "shouty". Card pakai shadow tebal yang heavy.

User minta: revisi Apple-style + banana yellow sebagai identity admin (shop public tetap salmon).

---

## Strategi Design

**Sumber kebenaran**: `~/.claude/skills/apple-design/SKILL.md` (skill yang baru dibuat di sesi ini).

**Palet final admin**:

- **Surface**: `#FAFAFA` (page bg), `#FFFFFF` (card)
- **Border**: `rgba(0,0,0,0.06)` ultra-light
- **Hover bg**: `rgba(0,0,0,0.04)`
- **Text primary**: `#1D1D1F` (bukan pure black)
- **Text secondary**: `#86868B`
- **Primary action**: `#1D1D1F` (dark pill button)
- **Accent (banana)**: token `--primary` existing (`oklch(0.88 0.17 90)`) hanya untuk:
  - Active nav indicator (3px bar kiri + bg `primary/15`)
  - Logo dot
  - Chart bar
  - Status badge "Aktif" / promo / accent stat
  - Avatar background

**Typography**:

- Heading utama: `text-[32px] font-semibold tracking-tight`
- H2: `text-[20px] font-semibold tracking-tight`
- Body: `text-[14px]` / `text-[13px]`
- Eyebrow: `text-[13px] font-medium text-[#86868B]`
- Hanya 2 weight: regular (400) + semibold (600). Buang `font-black` di seluruh admin.

**Spacing**: 8pt grid (gap-4/6/8/10), max-width container `1240px` konsisten.
**Radius**: 12-16px untuk input/button kecil, 16-24px untuk card.
**Shadow**: tidak ada drop-shadow tebal. Hanya border `black/[0.06]`.

---

## File yang Diubah

| File                                                 | Perubahan                                                                                                                                                                                               | Logic Touched?                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `apps/web/app/admin/layout.tsx`                      | Full rewrite — sidebar minimalis, active state via client nav, header dengan blur backdrop + real user name/role                                                                                        | Tetap (auth + redirect logic identik). Profile query diperbaiki dari `full_name` → `name` (column real di Supabase). |
| `apps/web/components/admin/AdminSidebarNav.tsx`      | **Baru** — client component handle `usePathname()` untuk active state                                                                                                                                   | —                                                                                                                    |
| `apps/web/app/admin/page.tsx`                        | Full rewrite dashboard. Stat cards monochrome (banana hanya di "Hari ini"). Chart bar banana solid. Quick actions jadi list bukan grid uppercase. Low-stock card neutral.                               | Data fetching identik (`getAdminStats`, `getAdminRevenueChart`, `getAdminProducts`).                                 |
| `apps/web/app/admin/orders/page.tsx`                 | Status filter jadi segmented pill (`bg-[#1D1D1F]` active). Tabel border light. Status badge neutral kecuali `paid/completed` (banana). Empty state. Pagination button bulat. Search dipindah ke header. | Query identik. Label diterjemahkan ID.                                                                               |
| `apps/web/app/admin/products/page.tsx`               | Header simplified, button primary dark pill.                                                                                                                                                            | Tidak ada — hanya wrapper.                                                                                           |
| `apps/web/components/admin/ProductCatalogClient.tsx` | Card tanpa shadow tebal, badge banana untuk promo, button edit jadi neutral gray pill. Eyebrow kategori menggantikan amber pill.                                                                        | State search logic identik.                                                                                          |
| `apps/web/app/admin/categories/page.tsx`             | Hero dark dibuang, ganti header standar. Form pakai `bg-white + border black/[0.06]`. Salmon `#E07B39` → banana token. Status badge banana.                                                             | `saveCategory` action identik.                                                                                       |
| `apps/web/app/admin/promos/page.tsx`                 | Refactor 4 form pakai helper `FormHeader` + `SaveButton` + `ActiveToggle`. Salmon dibuang. Section dibagi: pengaturan toko / buat baru / list voucher+banner.                                           | `saveBanner` / `saveVoucher` / `saveStoreSettings` actions identik.                                                  |

**File baru**: 1 (`components/admin/AdminSidebarNav.tsx`)
**File diubah**: 7
**File dihapus**: 0
**Logic bisnis disentuh**: 0 (cuma 1 query column fix, ada di section bawah)

---

## Catatan Bug Fix (incidental)

**1. Column name mismatch** — `layout.tsx` sebelumnya hanya `select('role')`. Saat tambah display name di header, sempat pakai `full_name` (mengikuti naming Supabase Auth umum), tapi schema real `profiles` di project ini pakai column `name`. Fixed: `select('role, name')`.
Rujukan: `packages/types/src/supabase.ts` table `profiles.Row` → `name: string`.

**2. Server→Client Component icon passing** — Runtime error muncul saat layout (server) coba pass `menuItems` (array dengan property `icon: LucideIcon`) ke `AdminSidebarNav` (client). Next.js 15 menolak: "Functions cannot be passed directly to Client Components".
Fix: pindahkan definition `NAV_ITEMS` ke dalam `AdminSidebarNav.tsx` (data static anyway, tidak perlu di-server-side-render). Layout sekarang cukup render `<AdminSidebarNav />` tanpa props.

---

## Validasi Dijalankan

- ✅ `pnpm --filter @bananasbindery/web type-check` — **0 error**
- ✅ `npx eslint <8 file>` — **0 warning, 0 error**
- ⚠️ Belum dijalankan: `pnpm build` (next compile), runtime smoke test di browser, dan E2E Playwright.

**Manual test recommended (browser)**:

1. Login admin → dashboard load, stat cards tampil monochrome, banana yellow muncul di "Hari ini" + chart + avatar
2. Klik sidebar item → indicator 3px banana muncul di kiri item aktif
3. `/admin/orders` → filter pill segmented bekerja, status badge benar per status
4. `/admin/products` → search filter realtime, card promo punya badge banana
5. `/admin/categories` → form save tetap jalan, tidak ada salmon orange tersisa
6. `/admin/promos` → 4 form save (voucher, banner, home labels, origin), accordion edit per-row

---

## Revert Procedure

Jika design baru bermasalah, revert dengan:

```bash
git checkout HEAD~1 -- \
  apps/web/app/admin/layout.tsx \
  apps/web/app/admin/page.tsx \
  apps/web/app/admin/orders/page.tsx \
  apps/web/app/admin/products/page.tsx \
  apps/web/app/admin/categories/page.tsx \
  apps/web/app/admin/promos/page.tsx \
  apps/web/components/admin/ProductCatalogClient.tsx

# Hapus file baru
rm apps/web/components/admin/AdminSidebarNav.tsx
```

Tidak ada schema/database/RPC change. Tidak ada perubahan action server. Aman di-revert tanpa side effect.

---

## Revisi Lanjutan — Halaman Promos Master-Detail (2026-05-16, sesi sama)

User kecewa pada hasil pertama halaman `/admin/promos`: 4 form muncul sekaligus, edit harus buka accordion, tidak ada cara cepat toggle aktif/nonaktif, preview banner kecil, layout campur aduk antara create dan edit.

### Pendekatan Revisi

Pisah halaman jadi **tab-based** + **master-detail layout** per section:

```
/admin/promos                  → tab Banner (default)
/admin/promos?tab=voucher      → tab Voucher
/admin/promos?tab=settings     → tab Pengaturan toko
```

Tab Banner sendiri punya **3 section sub-cards** sesuai posisi di home:

- **Hero Carousel** (`type='hero'`) → banner besar paling atas
- **Banner Promo** (`type='promo'`) → strip di atas Best Seller
- **Banner Pilihan** (`type='category'`) → strip di bawah Best Seller

Tiap section: list banner di kiri (320px) + editor & preview besar 16:7 di kanan. Klik banner di list = editor terisi otomatis. Klik "+ Baru" = form kosong di kanan dengan section type sudah pre-filled.

### Quick Toggle Inline

Toggle switch aktif/nonaktif tersedia langsung di list (tanpa buka editor):

- Untuk banner: muncul di setiap row di list banner
- Untuk voucher: muncul di setiap row di list voucher
- Pakai `useTransition` + optimistic update — feedback instan, auto-revert kalau server reject
- 2 server action baru: `toggleBannerActive(formData)`, `toggleVoucherActive(formData)`

### File Baru

- `apps/web/components/admin/promos/BannerManager.tsx` (client) — master-detail dengan 3 section sub-cards + toggle inline + preview 16:7
- `apps/web/components/admin/promos/VoucherManager.tsx` (client) — master-detail voucher + toggle inline
- `apps/web/components/admin/promos/SettingsPanel.tsx` (server) — 2 form pengaturan (home labels + origin pengiriman) dengan icon header

### File Diubah

- `apps/web/app/admin/promos/page.tsx` — full rewrite jadi tab router (server component, baca `?tab=` query)
- `apps/web/app/admin/actions.ts` — tambah `toggleBannerActive` + `toggleVoucherActive`

### Yang Diperbaiki Dari Versi Pertama

- ❌ 4 form muncul sekaligus → ✅ tab-based, 1 fokus per layar
- ❌ Edit lewat accordion → ✅ klik list = editor langsung muncul (master-detail)
- ❌ Toggle aktif harus buka form → ✅ toggle switch inline (1 klik)
- ❌ Preview gambar kecil → ✅ preview 16:7 besar di editor
- ❌ Tidak jelas banner masuk section apa → ✅ section sub-cards eksplisit dengan label bahasa user ("Hero Carousel", "Banner Promo", "Banner Pilihan") + hint posisi di home
- ❌ Form "Banner baru" + list bercampur → ✅ "Baru" jadi tombol di header list, klik = clear editor kanan
- ❌ Pengaturan toko & origin nyasar di halaman promo → ✅ pindah ke tab "Pengaturan"
- ❌ Priority cuma angka tanpa konteks → ✅ priority badge `#0` visible di thumbnail list + counter "X/Y aktif" per section

### Validasi (Revisi Promos)

- ✅ `pnpm --filter @bananasbindery/web type-check` — 0 error
- ✅ `eslint` 5 file baru/diubah — 0 warning

---

## Revisi Lanjutan #2 — Product Form + Home Banner Wiring + Defensive Keys (2026-05-16, sesi sama)

User feedback:

1. "Banner pilihan admin kosong tapi ada di home" — bug wiring banner type
2. "Edit product page revisi layout, semua view photo 1:1"
3. "Jangan sampai ada error key duplicate di console"

### 1. Banner Pilihan Mismatch Fix

**Root cause**: Halaman home `(shop)/page.tsx` query `getActiveBanners('promo')` untuk KEDUA strip (Banner Promo + Banner Pilihan). Strip Banner Pilihan seharusnya fetch `type='category'`. Selain itu, `HomeBannerStrip` punya `DEFAULT_BANNERS` hardcoded fallback yang muncul kalau dbBanners kosong — bikin user bingung "admin kosong tapi banner ada".

**Fix**:

- `apps/web/app/(shop)/page.tsx` — pisah jadi 2 query: `promoBanners` (type='promo') untuk strip atas, `pilihanBanners` (type='category') untuk strip bawah. Sekarang sinkron dengan section di admin BannerManager.
- `apps/web/components/home/home-banner-strip.tsx` — buang `DEFAULT_BANNERS`. Kalau banners kosong → return null (strip tidak tampil). Sesuai prinsip "jangan hardcode".

### 2. Product Form Apple-Redesign + Foto 1:1

**File diubah**:

- `apps/web/components/admin/ProductForm.tsx` — full rewrite. Drop dark hero `#1A1714` + salmon `#E07B39`. Header standar Apple-style dengan back-link, judul tipis, action button dark pill kanan. Card pakai border light + bg white (bukan `#FDFBF7` + heavy shadow). Semua input pakai `fieldClass` (border `black/[0.08]`, focus banana). Variant card jadi `bg-[#FAFAFA]` di dalam parent card putih. Sidebar ringkasan publish jadi `<dl>` semantik dengan indicator hijau banana untuk "Aktif".
- `apps/web/components/admin/ProductCatalogClient.tsx` — image card produk diubah dari `aspect-[4/3]` → `aspect-square` (1:1).
- `apps/web/app/admin/products/[id]/page.tsx` — drop wrapper header redundan (sekarang header sudah ada di ProductForm), cuma render `<ProductForm>` saja.

**Foto 1:1 yang dipastikan**:

- Foto varian: `aspect-square` 120×120 (sebelumnya 140×140) — tetap 1:1
- Foto produk di sidebar: `aspect-square` 340×340 — tetap 1:1
- Card produk di katalog: `aspect-square` (sebelumnya 4:3) — sekarang 1:1
- Thumbnail banner di admin BannerManager: 80×56 (tetap untuk thumbnail, preview di editor pakai 16:7 sesuai aspek banner real)

### 3. Defensive Key Fixes (Console Warning)

Warning: "Each child in a list should have a unique 'key' prop. Check render method of `ShopLayout`."

Tidak bisa locate sumber pasti tanpa devtools, jadi pendekatan defensive:

- `apps/web/components/layout/header.tsx` — `<m.div>` wrapper "Semua" CategoryChip yang hidup di parent staggering motion tanpa key → tambah `key="cat-semua"`. Parent motion `staggerChildren` butuh setiap direct child punya stable key untuk track AnimatePresence.
- `apps/web/app/(shop)/page.tsx` — `<ProductCard key={p.id}>` di section "Best Seller" dan "Semua Produk" sama-sama render product yang mungkin overlap ID. Diubah jadi `key={`best-${p.id}`}` dan `key={`all-${p.id}`}` untuk eliminasi potensi konflik antar siblings.

Kalau warning masih muncul setelah ini, butuh inspeksi real-time di browser devtools.

### Validasi (Revisi #2)

- ✅ `pnpm --filter @bananasbindery/web type-check` — 0 error (1 hint deprecation `FormEvent` di React 19 types, not blocking)
- ✅ Logic bisnis tidak disentuh (action save, save banner, query banner)

### File yang Diubah (Revisi #2)

| File                                                 | Perubahan                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| `apps/web/app/(shop)/page.tsx`                       | Pisah `pilihanBanners` query type='category' + compound key untuk ProductCard |
| `apps/web/components/home/home-banner-strip.tsx`     | Buang DEFAULT_BANNERS hardcoded, return null kalau empty                      |
| `apps/web/components/admin/ProductCatalogClient.tsx` | Image card `aspect-[4/3]` → `aspect-square`                                   |
| `apps/web/components/admin/ProductForm.tsx`          | Full rewrite Apple-style, banana yellow accent, semua foto 1:1                |
| `apps/web/app/admin/products/[id]/page.tsx`          | Simplify (header sudah ada di ProductForm)                                    |
| `apps/web/components/layout/header.tsx`              | Tambah `key="cat-semua"` di motion sibling                                    |

---

## TODO Sesi Berikutnya (User Request Belum Selesai)

1. **Hero banner editable dari admin** — text "Flash Sale", "Diskon hingga 50%", "Koleksi binder premium...", "Belanja sekarang" masih hardcoded di array `BANNERS` di `apps/web/app/(shop)/page.tsx:28-73`. Butuh:
   - Migration: tambah kolom `subtitle`, `description`, `cta_label`, `bg_gradient`, `accent_color` di table `banners`
   - Update saveBanner action handle field baru
   - Update `BannerEditor` (di `components/admin/promos/BannerManager.tsx`) tambah field text editable
   - Update `BannerCard` di home page render dari `dbHeroBanners` (type='hero') bukan dari array hardcoded
2. **Halaman product/new** — belum di-Apple-style-kan (cek apakah pakai ProductForm yang sudah baru)
3. **Halaman order detail** `/admin/orders/[id]` — belum disentuh

---

## Yang Belum Disentuh (Out of Scope Sesi Ini)

- `apps/web/app/admin/products/new/page.tsx` (form tambah produk baru)
- `apps/web/app/admin/products/[id]/page.tsx` (edit produk detail)
- `apps/web/app/admin/orders/[id]/page.tsx` (detail order)
- `apps/web/components/admin/ProductForm.tsx`
- `apps/web/components/admin/ImageUploadField.tsx`
- Halaman shop public — **tetap salmon orange** sesuai instruksi user

Halaman detail/form pages dipakai pattern yang sama (`inputClass`, `formCard`, dark pill button) — siap dipakai saat polish berikutnya.

---

## Rasionale Teknis Singkat

**Kenapa banana yellow tidak dipakai sebagai primary action button?**
Apple HIG: accent color punya makna spesifik (status, highlight, active). Action utama biasanya neutral/dark karena harus stand out tanpa kompetisi warna. Banana yellow di seluruh admin = tidak ada hierarki. Dengan dark pill primary + banana accent, banana yellow justru lebih "berasa" karena dipakai sparingly.

**Kenapa weight 600 maksimum?**
`font-black` (900) bikin admin tool terasa seperti landing page marketing — over-shouting di tool yang dipakai daily. Apple system text di macOS/iOS tidak pernah pakai 900 untuk UI, hanya 600 (semibold) untuk emphasize.

**Kenapa drop shadow dihilangkan total?**
Drop shadow tebal di card = Material Design vibe. Apple lebih sering pakai border 1px ultra-light + flat. Hasil terasa lebih "calm" dan tidak distract dari konten utama (data tabel/form).
