-- Manual transfer payment flow with multi-rekening support.
-- New checkout orders no longer require Xendit. Customers upload transfer proof,
-- admins verify it, then Biteship fulfillment is created after approval.

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS manual_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS manual_payment_qr_image_url TEXT,
  ADD COLUMN IF NOT EXISTS manual_payment_instructions TEXT,
  ADD COLUMN IF NOT EXISTS manual_payment_expires_hours INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS manual_payment_accounts JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.store_settings.manual_payment_enabled IS
  'Enables manual QR/rekening transfer as the active checkout payment method.';
COMMENT ON COLUMN public.store_settings.manual_payment_qr_image_url IS
  'Public URL for static QR/QRIS image shown in checkout.';
COMMENT ON COLUMN public.store_settings.manual_payment_accounts IS
  'JSON array of manual transfer bank accounts: id, bankName, accountNumber, accountHolder, label, isActive, sortOrder.';

CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  submitted_amount NUMERIC,
  payment_destination_type TEXT NOT NULL DEFAULT 'bank_transfer'
    CHECK (payment_destination_type IN ('qris', 'bank_transfer')),
  payment_destination_id TEXT,
  payment_destination_label TEXT,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_order_created
  ON public.payment_proofs(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_user_created
  ON public.payment_proofs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status
  ON public.payment_proofs(status);

ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_proofs_owner_or_staff_read" ON public.payment_proofs;
CREATE POLICY "payment_proofs_owner_or_staff_read"
ON public.payment_proofs
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'owner', 'staff')
  )
);

DROP POLICY IF EXISTS "payment_proofs_owner_insert" ON public.payment_proofs;
CREATE POLICY "payment_proofs_owner_insert"
ON public.payment_proofs
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "payment_proofs_staff_update" ON public.payment_proofs;
CREATE POLICY "payment_proofs_staff_update"
ON public.payment_proofs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'owner', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'owner', 'staff')
  )
);

GRANT SELECT, INSERT, UPDATE ON public.payment_proofs TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'payment-assets',
    'payment-assets',
    TRUE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'payment-proofs',
    'payment-proofs',
    FALSE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

DROP POLICY IF EXISTS "storage_payment_assets_public_read" ON storage.objects;
CREATE POLICY "storage_payment_assets_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'payment-assets');

DROP POLICY IF EXISTS "storage_payment_assets_staff_write" ON storage.objects;
CREATE POLICY "storage_payment_assets_staff_write"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-assets'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('admin', 'owner', 'staff')
  )
);

DROP POLICY IF EXISTS "storage_payment_proofs_owner_or_staff_read" ON storage.objects;
CREATE POLICY "storage_payment_proofs_owner_or_staff_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND (
    (SELECT auth.uid())::TEXT = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role IN ('admin', 'owner', 'staff')
    )
  )
);

DROP POLICY IF EXISTS "storage_payment_proofs_owner_insert" ON storage.objects;
CREATE POLICY "storage_payment_proofs_owner_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND (SELECT auth.uid())::TEXT = (storage.foldername(name))[1]
);

CREATE OR REPLACE FUNCTION public.expire_manual_order_v1(
  p_order_id UUID,
  p_reason TEXT DEFAULT 'manual_payment_expired'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_released BOOLEAN;
BEGIN
  SELECT id, status, payment_status, voucher_id, payment_metadata
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order tidak ditemukan';
  END IF;

  IF v_order.payment_status IN ('paid', 'dp_paid')
     OR v_order.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed') THEN
    RETURN FALSE;
  END IF;

  SELECT public.release_order_inventory_v1(p_order_id, COALESCE(p_reason, 'manual_payment_expired'))
  INTO v_released;

  IF NOT (COALESCE(v_order.payment_metadata, '{}'::jsonb) ? 'manual_usage_reversed_at') THEN
    IF v_order.voucher_id IS NOT NULL THEN
      UPDATE public.vouchers
      SET used_count = GREATEST(COALESCE(used_count, 0) - 1, 0)
      WHERE id = v_order.voucher_id;
    END IF;

    UPDATE public.campaigns c
    SET usage_count = GREATEST(COALESCE(c.usage_count, 0) - usage_counts.usage_count, 0)
    FROM (
      SELECT campaign_id, COUNT(*)::INTEGER AS usage_count
      FROM public.campaign_usages
      WHERE order_id = p_order_id
      GROUP BY campaign_id
    ) AS usage_counts
    WHERE c.id = usage_counts.campaign_id;
  END IF;

  UPDATE public.orders
  SET
    status = 'expired',
    payment_status = 'unpaid',
    expired_at = COALESCE(expired_at, NOW()),
    payment_metadata = COALESCE(payment_metadata, '{}'::jsonb)
      || jsonb_build_object(
        'manual_usage_reversed_at', NOW(),
        'manual_release_reason', COALESCE(p_reason, 'manual_payment_expired')
      ),
    updated_at = NOW()
  WHERE id = p_order_id;

  RETURN COALESCE(v_released, FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.expire_manual_order_v1(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_manual_order_v1(UUID, TEXT) TO service_role;
