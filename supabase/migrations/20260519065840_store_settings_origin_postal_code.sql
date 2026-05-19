ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS origin_postal_code TEXT;

COMMENT ON COLUMN public.store_settings.origin_postal_code IS
  'Postal code for Biteship origin payload. Auto-filled from Admin > Settings location resolver.';
