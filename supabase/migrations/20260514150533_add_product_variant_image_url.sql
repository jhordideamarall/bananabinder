ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS image_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-images', 'product-images', true),
  ('categories', 'categories', true),
  ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "storage_admin_upload_product_media" ON storage.objects;

CREATE POLICY "storage_admin_upload_product_media"
ON storage.objects
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner', 'staff')
  )
  AND bucket_id IN ('product-images', 'categories', 'banners')
);
