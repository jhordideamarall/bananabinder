-- Migration: tambah courier_code & service_code di orders + update RPC create_order_v1
-- Tanggal: 2026-05-05
-- Konteks: Webhook Biteship butuh kode kurir asli (jne, sicepat, gojek, dll) + kode service (reg, instant, dll)
--          untuk panggil /v1/orders. Sebelumnya hanya simpan display name "JNE - Reguler".

-- 1. Tambah kolom (idempotent, aman dijalankan ulang)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_courier_code TEXT,
  ADD COLUMN IF NOT EXISTS shipping_service_code TEXT;

-- 2. Update RPC create_order_v1 — terima 2 parameter baru
-- CATATAN: Sesuaikan body fungsi di bawah dengan implementasi existing kamu.
-- Yang berubah hanya: signature parameter + INSERT 2 kolom baru.
CREATE OR REPLACE FUNCTION public.create_order_v1(
  p_user_id            UUID,
  p_address_id         UUID,
  p_items              JSONB,
  p_order_number       TEXT,
  p_total              NUMERIC,
  p_subtotal           NUMERIC,
  p_shipping_cost      NUMERIC,
  p_shipping_courier   TEXT,
  p_shipping_courier_code TEXT,
  p_shipping_service_code TEXT,
  p_total_weight       INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item     JSONB;
BEGIN
  -- Insert order
  INSERT INTO public.orders (
    order_number, user_id, address_id,
    subtotal, shipping_cost, total,
    shipping_courier, shipping_courier_code, shipping_service_code,
    total_weight_grams,
    status, payment_status
  ) VALUES (
    p_order_number, p_user_id, p_address_id,
    p_subtotal, p_shipping_cost, p_total,
    p_shipping_courier, p_shipping_courier_code, p_shipping_service_code,
    p_total_weight,
    'pending', 'unpaid'
  )
  RETURNING id INTO v_order_id;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id, product_id, variant_id, quantity, price,
      product_name, variant_name
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      NULLIF(v_item->>'variant_id', '')::UUID,
      (v_item->>'quantity')::INT,
      (v_item->>'price')::NUMERIC,
      v_item->>'product_name',
      v_item->>'variant_name'
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

-- 3. Grant permission ke authenticated role
GRANT EXECUTE ON FUNCTION public.create_order_v1(
  UUID, UUID, JSONB, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, INTEGER
) TO authenticated;

-- 4. (Opsional) Drop signature lama untuk hindari ambiguitas
DROP FUNCTION IF EXISTS public.create_order_v1(
  UUID, UUID, JSONB, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, INTEGER
);
