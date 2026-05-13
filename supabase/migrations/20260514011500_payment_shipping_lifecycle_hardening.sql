-- Migration: payment/shipping lifecycle hardening for Xendit + Biteship
-- Date: 2026-05-14
-- Context:
-- - Xendit invoice expiry must release reserved stock exactly once.
-- - Biteship webhook needs first-class shipping status storage.
-- - Payment/shipping webhooks need idempotent audit storage.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS inventory_released_at TIMESTAMPTZ;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'xendit',
  ADD COLUMN IF NOT EXISTS provider_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT,
  reference_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, event_id)
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_webhook_events" ON public.webhook_events;
CREATE POLICY "admin_all_webhook_events" ON public.webhook_events
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON public.orders(shipping_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON public.orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_metadata_gin ON public.orders USING gin(shipping_metadata);
CREATE INDEX IF NOT EXISTS idx_orders_payment_metadata_gin ON public.orders USING gin(payment_metadata);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_external ON public.transactions(provider, external_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_reference ON public.webhook_events(provider, reference_id);

CREATE OR REPLACE FUNCTION public.release_order_inventory_v1(
  p_order_id UUID,
  p_reason TEXT DEFAULT 'expired'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
BEGIN
  SELECT id, status, payment_status, inventory_released_at
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order tidak ditemukan';
  END IF;

  IF v_order.inventory_released_at IS NOT NULL THEN
    RETURN FALSE;
  END IF;

  -- Never release stock for orders that are already paid/settled.
  IF v_order.payment_status IN ('paid', 'dp_paid') OR v_order.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed') THEN
    RETURN FALSE;
  END IF;

  FOR v_item IN
    SELECT id, product_id, variant_id, quantity
    FROM public.order_items
    WHERE order_id = p_order_id
  LOOP
    IF v_item.variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET stock = COALESCE(stock, 0) + v_item.quantity,
          updated_at = NOW()
      WHERE id = v_item.variant_id;
    END IF;

    IF v_item.product_id IS NOT NULL THEN
      UPDATE public.products
      SET stock = CASE
            WHEN v_item.variant_id IS NULL THEN COALESCE(stock, 0) + v_item.quantity
            ELSE COALESCE(stock, 0)
          END,
          sold_count = GREATEST(COALESCE(sold_count, 0) - v_item.quantity, 0),
          updated_at = NOW()
      WHERE id = v_item.product_id;
    END IF;

    INSERT INTO public.stock_movements (
      product_id,
      variant_id,
      type,
      quantity,
      reference_type,
      reference_id,
      notes,
      created_by
    ) VALUES (
      v_item.product_id,
      v_item.variant_id,
      'return',
      v_item.quantity,
      'order',
      p_order_id,
      'Stock released by release_order_inventory_v1: ' || COALESCE(p_reason, 'expired'),
      NULL
    );
  END LOOP;

  UPDATE public.orders
  SET inventory_released_at = NOW(),
      updated_at = NOW()
  WHERE id = p_order_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.release_order_inventory_v1(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_order_inventory_v1(UUID, TEXT) TO service_role;
