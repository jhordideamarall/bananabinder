-- 20260516000000_banner_hero_content_fields.sql
-- Tambah field text overlay untuk banner agar hero carousel di home page bisa
-- di-edit dari admin (tidak lagi pakai array hardcoded `BANNERS` di
-- app/(shop)/page.tsx).
--
-- Field baru (semua optional/nullable agar backward compatible):
--   subtitle       — small tag/eyebrow di atas title ("Flash Sale")
--   description    — body description di bawah title
--   cta_label      — text tombol CTA ("Belanja sekarang")
--   bg_gradient    — CSS gradient string optional untuk background
--   accent_color   — accent hex/rgba untuk badge/glow di banner
--
-- Banner type='promo' dan type='category' (strip) hanya pakai image_url + title
-- (sudah ada). Field baru terutama dipakai banner type='hero'.

ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS bg_gradient text,
  ADD COLUMN IF NOT EXISTS accent_color text;

COMMENT ON COLUMN public.banners.subtitle IS
  'Small tag/eyebrow shown above title on hero banner (e.g. "Flash Sale"). Optional.';

COMMENT ON COLUMN public.banners.description IS
  'Body description shown under title on hero banner. Optional.';

COMMENT ON COLUMN public.banners.cta_label IS
  'Button label on hero banner CTA (e.g. "Belanja sekarang"). Optional.';

COMMENT ON COLUMN public.banners.bg_gradient IS
  'CSS gradient string for hero banner background overlay. Optional.';

COMMENT ON COLUMN public.banners.accent_color IS
  'Accent color hex/rgba for hero banner badge/glow elements. Optional.';
