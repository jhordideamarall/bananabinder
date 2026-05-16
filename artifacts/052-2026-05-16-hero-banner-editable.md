# 052 — Hero Banner Editable dari Admin

**Tanggal**: 2026-05-16
**Scope**: Hero carousel di home page (mobile + desktop) sekarang fully editable dari `/admin/promos` tab Banner section Hero. Semua teks (tag, judul, deskripsi, CTA), background gradient, dan accent color dikelola dari admin — tidak lagi hardcoded.

---

## Konteks

User screenshot hero banner di home menampilkan teks "Flash Sale", "Diskon hingga 50%", "Koleksi binder premium untuk produktivitasmu", "Belanja sekarang" — semua hardcoded di array `BANNERS` di `apps/web/app/(shop)/page.tsx:28-73`.

User minta: "ada teks seperti ini di banner apakah bisa di edit semua? jangan sampai banyak hard code".

---

## Perubahan DB

### Migration baru

**File**: `supabase/migrations/20260516000000_banner_hero_content_fields.sql`

Tambah 5 kolom optional di table `public.banners` (backward compatible — semua nullable):

| Kolom          | Tipe | Tujuan                                         |
| -------------- | ---- | ---------------------------------------------- |
| `subtitle`     | text | Small eyebrow/tag di atas title ("Flash Sale") |
| `description`  | text | Body description ("Koleksi binder premium...") |
| `cta_label`    | text | Label tombol CTA ("Belanja sekarang")          |
| `bg_gradient`  | text | CSS gradient string untuk background           |
| `accent_color` | text | Hex/rgba untuk glow + badge                    |

**Status**: Applied ke remote project `xiumxugolyfsvwnwzenp` (bananabinder).
Migration file lokal di `supabase/migrations/` siap di-commit. Project lain bisa sync via `supabase db pull`.

### Types Update

- `packages/types/src/supabase.ts` — banners Row/Insert/Update + 5 kolom baru
- `packages/api-client/src/banners.ts` — `HomeBanner` interface +5 field (`subtitle`, `description`, `ctaLabel`, `bgGradient`, `accentColor`) + select query di `getActiveBanners` ambil kolom baru

---

## Perubahan Admin (`/admin/promos` tab Banner section Hero)

**File**: `apps/web/components/admin/promos/BannerManager.tsx`

- Tambah variable `isHero = section.id === 'hero'`
- Field "Judul banner" punya helper text berbeda untuk hero vs strip
- Saat section=Hero, muncul **panel "Teks hero carousel"** dengan background banana yellow tipis (`bg-primary/[0.06]`) berisi 5 field text editable:
  - Tag/eyebrow
  - Deskripsi
  - Label tombol CTA
  - Background gradient (CSS, font-mono)
  - Warna accent (hex, font-mono)
- Saat section bukan Hero (Promo/Pilihan), field-field di atas dikirim sebagai hidden input kosong → server tetap accept tanpa error
- BannerListItem di sidebar list: kalau banner punya `subtitle`, tampilkan subtitle sebagai secondary line (lebih informatif untuk hero); fallback ke "Tampil di home" / "Tidak tampil" untuk strip

**File**: `apps/web/app/admin/actions.ts`

`saveBanner` action sekarang baca 5 field baru dari FormData → masukkan ke payload UPDATE/INSERT.

---

## Perubahan Home Page

**File**: `apps/web/app/(shop)/page.tsx`

1. **Buang hardcoded `BANNERS` array** (45 baris) — sumber kebenaran sekarang DB
2. Tambah query baru `heroBanners` dengan `getActiveBanners('hero')`
3. `BannerCard` component:
   - Props ganti dari `(typeof BANNERS)[0]` → `HomeBanner`
   - `banner.bg` → `banner.bgGradient || DEFAULT_HERO_BG` (fallback untuk safety, BUKAN konten)
   - `banner.accent` → `banner.accentColor || DEFAULT_HERO_ACCENT`
   - `banner.image` → `banner.imageUrl`
   - `banner.tag`, `banner.desc`, `banner.cta` → render conditional (`subtitle`, `description`, `ctaLabel`). Kalau admin kosongkan field, element tidak dirender (Apple-style: less is more)
4. **Carousel hero conditional render**: hanya tampil kalau `heroBanners.length > 0` — kalau admin belum upload hero, section disembunyikan (tidak ada hardcoded placeholder)
5. Mobile carousel pakai `lg:hidden` agar tidak double dengan DesktopBannerSlider
6. Proxy scroll divs `BANNERS.map((_, i) => key={i})` diganti `heroBanners.map((banner) => key={`scroll-${banner.id}`})` untuk stable keys

**File**: `apps/web/components/home/desktop-banner-slider.tsx`

- Props ganti dari local `Banner` interface → `HomeBanner`
- Field render conditional (subtitle, description, ctaLabel optional)
- Dots reorder pakai `key=`dot-${b.id}`` (bukan index)
- Return null kalau banners kosong (defensive)
- `useEffect` skip interval kalau cuma 1 banner (tidak perlu auto-rotate)

---

## Hasil

User sekarang bisa:

1. Buka `/admin/promos` → tab Banner default
2. Klik card section **🎬 Hero Carousel**
3. Klik "+ Baru" atau pilih banner existing
4. Edit semua teks (tag, judul, deskripsi, CTA) + warna gradient/accent
5. Toggle aktif/nonaktif inline di list
6. Save → muncul langsung di home page (path revalidated)

Kalau admin hapus semua hero banner → section hero di home **tidak tampil sama sekali** (tidak ada hardcoded fallback yang bocor).

---

## File Diubah / Baru

| File                                                                | Status   | Catatan                                                                                                           |
| ------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260516000000_banner_hero_content_fields.sql` | **Baru** | Migration tambah 5 kolom                                                                                          |
| `packages/types/src/supabase.ts`                                    | Updated  | banners Row/Insert/Update +5 field                                                                                |
| `packages/api-client/src/banners.ts`                                | Updated  | HomeBanner interface +5 field, select query ambil kolom baru, `declare const console` untuk fix lib `ES2022` only |
| `apps/web/app/admin/actions.ts`                                     | Updated  | saveBanner accept 5 field baru                                                                                    |
| `apps/web/components/admin/promos/BannerManager.tsx`                | Updated  | Conditional fields untuk hero, BannerListItem tampilkan subtitle                                                  |
| `apps/web/app/(shop)/page.tsx`                                      | Updated  | Buang hardcoded BANNERS, query heroBanners, BannerCard pakai HomeBanner type, conditional render carousel         |
| `apps/web/components/home/desktop-banner-slider.tsx`                | Updated  | Props HomeBanner, conditional render fields, defensive empty state                                                |

---

## Validasi

- ✅ Migration applied: `supabase apply_migration` returned `{success: true}`
- ✅ `pnpm --filter @bananasbindery/web type-check` — 0 error
- ✅ ESLint 5 file disentuh — 0 warning
- ⚠️ Belum ada test manual di browser (deferred ke user — per preferensi user tidak pakai chrome-devtools MCP)

---

## Revert Procedure

**Code**:

```bash
git checkout HEAD~1 -- \
  apps/web/app/admin/actions.ts \
  apps/web/app/\(shop\)/page.tsx \
  apps/web/components/admin/promos/BannerManager.tsx \
  apps/web/components/home/desktop-banner-slider.tsx \
  packages/api-client/src/banners.ts \
  packages/types/src/supabase.ts
rm supabase/migrations/20260516000000_banner_hero_content_fields.sql
```

**Database** (kolom baru tidak menghapus data existing):

```sql
ALTER TABLE public.banners
  DROP COLUMN IF EXISTS subtitle,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS cta_label,
  DROP COLUMN IF EXISTS bg_gradient,
  DROP COLUMN IF EXISTS accent_color;
```

---

## Catatan untuk User

**Hero banner di home sekarang kosong** karena belum ada banner type='hero' di DB. Untuk test:

1. Login admin → /admin/promos
2. Pilih section "🎬 Hero Carousel"
3. Tap "+ Baru"
4. Upload gambar binder (rasio 16:7 disarankan)
5. Isi:
   - Judul: "Diskon hingga 50%"
   - Tag/eyebrow: "Flash Sale"
   - Deskripsi: "Koleksi binder premium untuk produktivitasmu"
   - Label CTA: "Belanja sekarang"
   - Link: `/products?sale=true`
   - Gradient (opsional): `linear-gradient(135deg, #1A1714 0%, #3D2F1E 100%)`
   - Accent (opsional): `#FFD54C`
6. Simpan → refresh home page

Buat beberapa hero banner untuk dapat carousel (rotate otomatis di desktop, swipe di mobile).
