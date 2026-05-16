-- Migration: preview_voucher_v1
-- Date: 2026-05-15
-- Context: validasi voucher read-only untuk preview di cart/checkout.
-- SECURITY DEFINER supaya tidak terhalang RLS tabel vouchers.
-- Tidak mengubah data — perhitungan final tetap di create_order_v1.

CREATE OR REPLACE FUNCTION public.preview_voucher_v1(
  p_code TEXT,
  p_subtotal NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voucher RECORD;
  v_discount NUMERIC := 0;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RETURN jsonb_build_object('valid', false, 'discount', 0, 'message', 'Kode voucher kosong');
  END IF;

  SELECT * INTO v_voucher
  FROM public.vouchers
  WHERE upper(code) = upper(trim(p_code));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'discount', 0, 'message', 'Kode voucher tidak ditemukan');
  END IF;
  IF v_voucher.is_active IS NOT TRUE THEN
    RETURN jsonb_build_object('valid', false, 'discount', 0, 'message', 'Voucher tidak aktif');
  END IF;
  IF v_voucher.valid_from IS NOT NULL AND NOW() < v_voucher.valid_from THEN
    RETURN jsonb_build_object('valid', false, 'discount', 0, 'message', 'Voucher belum berlaku');
  END IF;
  IF v_voucher.valid_until IS NOT NULL AND NOW() > v_voucher.valid_until THEN
    RETURN jsonb_build_object('valid', false, 'discount', 0, 'message', 'Voucher sudah kedaluwarsa');
  END IF;
  IF v_voucher.usage_limit IS NOT NULL AND COALESCE(v_voucher.used_count, 0) >= v_voucher.usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'discount', 0, 'message', 'Kuota voucher sudah habis');
  END IF;
  IF v_voucher.min_order IS NOT NULL AND COALESCE(p_subtotal, 0) < v_voucher.min_order THEN
    RETURN jsonb_build_object('valid', false, 'discount', 0,
      'message', 'Minimal belanja Rp ' || v_voucher.min_order::TEXT);
  END IF;

  IF v_voucher.type = 'percentage' THEN
    v_discount := ROUND(COALESCE(p_subtotal, 0) * v_voucher.value / 100.0);
    IF v_voucher.max_discount IS NOT NULL AND v_voucher.max_discount > 0 THEN
      v_discount := LEAST(v_discount, v_voucher.max_discount);
    END IF;
  ELSE
    v_discount := v_voucher.value;
  END IF;

  v_discount := LEAST(GREATEST(v_discount, 0), COALESCE(p_subtotal, 0));

  RETURN jsonb_build_object(
    'valid', true,
    'discount', v_discount,
    'code', upper(trim(p_code)),
    'message', 'Voucher diterapkan'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.preview_voucher_v1(TEXT, NUMERIC) TO anon, authenticated;
