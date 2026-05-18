-- Add custom order details persistence to order_items and preserve existing create_order_v1
-- campaign/voucher validation. Custom details are stored as JSONB for admin/customer
-- confirmation workflow and WhatsApp transactional summary.

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS custom_details JSONB;

COMMENT ON COLUMN public.order_items.custom_details IS
  'Custom binder brief captured from cart/checkout: size, material, personalization, notes, reference URL.';

DROP FUNCTION IF EXISTS public.create_order_v1(
  UUID, UUID, JSONB, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, INTEGER, NUMERIC, NUMERIC, NUMERIC, TEXT
);

CREATE OR REPLACE FUNCTION public.create_order_v1(
  p_user_id UUID,
  p_address_id UUID,
  p_items JSONB,
  p_order_number TEXT,
  p_total NUMERIC,
  p_subtotal NUMERIC,
  p_shipping_cost NUMERIC,
  p_shipping_courier TEXT,
  p_shipping_courier_code TEXT DEFAULT NULL,
  p_shipping_service_code TEXT DEFAULT NULL,
  p_total_weight INTEGER DEFAULT 0,
  p_tax NUMERIC DEFAULT 0,
  p_service_fee NUMERIC DEFAULT 0,
  p_discount NUMERIC DEFAULT 0,
  p_voucher_code TEXT DEFAULT NULL,
  p_campaign_ids UUID[] DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID := uuid_generate_v4();
  v_item JSONB;
  v_product_id UUID;
  v_variant_id UUID;
  v_quantity INTEGER;
  v_product_name TEXT;
  v_variant_name TEXT;
  v_custom_details JSONB;
  v_unit_price NUMERIC;
  v_cost_price NUMERIC;
  v_weight_grams INTEGER;
  v_current_stock INTEGER;
  v_line_subtotal NUMERIC;
  v_computed_subtotal NUMERIC := 0;
  v_computed_hpp NUMERIC := 0;
  v_computed_weight INTEGER := 0;
  v_safe_discount NUMERIC := GREATEST(COALESCE(p_discount, 0), 0);
  v_safe_shipping NUMERIC := GREATEST(COALESCE(p_shipping_cost, 0), 0);
  v_safe_service_fee NUMERIC := GREATEST(COALESCE(p_service_fee, 0), 0);
  v_taxable_amount NUMERIC;
  v_computed_tax NUMERIC;
  v_computed_total NUMERIC;
  v_voucher RECORD;
  v_voucher_id UUID := NULL;
  v_voucher_discount NUMERIC := 0;
  v_campaign RECORD;
  v_campaign_id UUID;
  v_campaign_item_discount NUMERIC := 0;
  v_campaign_shipping_discount NUMERIC := 0;
  v_matched_subtotal NUMERIC;
  v_one_campaign_discount NUMERIC;
  v_dest_address RECORD;
  v_addr_city_code TEXT;
  v_addr_province_code TEXT;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'User wajib ada untuk membuat pesanan'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.addresses AS a WHERE a.id = p_address_id AND a.user_id = p_user_id) THEN
    RAISE EXCEPTION 'Alamat tidak valid atau bukan milik user';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Item pesanan tidak boleh kosong';
  END IF;

  INSERT INTO public.orders (
    id, order_number, user_id, address_id, subtotal, discount, shipping_cost, tax, service_fee, total,
    shipping_courier, shipping_courier_code, shipping_service_code, total_weight_grams, status, payment_status, created_at, updated_at
  ) VALUES (
    v_order_id, p_order_number, p_user_id, p_address_id, 0, v_safe_discount, v_safe_shipping, 0, v_safe_service_fee, 0,
    p_shipping_courier, p_shipping_courier_code, p_shipping_service_code, GREATEST(COALESCE(p_total_weight, 0), 0), 'pending', 'unpaid', NOW(), NOW()
  );

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_variant_id := NULLIF(v_item->>'variant_id', '')::UUID;
    v_quantity := COALESCE((v_item->>'quantity')::INTEGER, 0);
    v_custom_details := CASE
      WHEN v_item ? 'custom_details' AND jsonb_typeof(v_item->'custom_details') = 'object' THEN v_item->'custom_details'
      ELSE NULL
    END;
    IF v_product_id IS NULL THEN RAISE EXCEPTION 'product_id wajib di tiap item'; END IF;
    IF v_quantity <= 0 THEN RAISE EXCEPTION 'quantity harus > 0'; END IF;

    IF v_variant_id IS NOT NULL THEN
      SELECT p.name, pv.name, pv.price, COALESCE(p.cost_price, 0), COALESCE(pv.weight_grams, p.weight_grams, 0), COALESCE(pv.stock, 0)
      INTO v_product_name, v_variant_name, v_unit_price, v_cost_price, v_weight_grams, v_current_stock
      FROM public.product_variants AS pv JOIN public.products AS p ON p.id = pv.product_id
      WHERE pv.id = v_variant_id AND pv.is_active = TRUE AND p.is_active = TRUE FOR UPDATE OF pv;
      IF NOT FOUND THEN RAISE EXCEPTION 'Varian produk tidak valid atau tidak aktif'; END IF;
      IF v_current_stock < v_quantity THEN RAISE EXCEPTION 'Stok varian % tidak cukup. Sisa stok: %', COALESCE(v_variant_name, v_variant_id::TEXT), v_current_stock; END IF;
      UPDATE public.product_variants SET stock = stock - v_quantity, updated_at = NOW() WHERE id = v_variant_id;
      UPDATE public.products SET sold_count = COALESCE(sold_count, 0) + v_quantity, updated_at = NOW() WHERE id = v_product_id;
    ELSE
      SELECT p.name, NULL::TEXT,
        CASE WHEN p.promo_price IS NOT NULL AND p.promo_price > 0 AND p.promo_price < p.price THEN p.promo_price ELSE p.price END,
        COALESCE(p.cost_price, 0), COALESCE(p.weight_grams, 0), COALESCE(p.stock, 0)
      INTO v_product_name, v_variant_name, v_unit_price, v_cost_price, v_weight_grams, v_current_stock
      FROM public.products AS p WHERE p.id = v_product_id AND p.is_active = TRUE FOR UPDATE OF p;
      IF NOT FOUND THEN RAISE EXCEPTION 'Produk tidak valid atau tidak aktif'; END IF;
      IF v_current_stock < v_quantity THEN RAISE EXCEPTION 'Stok produk % tidak cukup. Sisa stok: %', COALESCE(v_product_name, v_product_id::TEXT), v_current_stock; END IF;
      UPDATE public.products SET stock = stock - v_quantity, sold_count = COALESCE(sold_count, 0) + v_quantity, updated_at = NOW() WHERE id = v_product_id;
    END IF;

    v_line_subtotal := v_unit_price * v_quantity;
    v_computed_subtotal := v_computed_subtotal + v_line_subtotal;
    v_computed_hpp := v_computed_hpp + (v_cost_price * v_quantity);
    v_computed_weight := v_computed_weight + (v_weight_grams * v_quantity);

    INSERT INTO public.order_items (
      order_id, product_id, variant_id, product_name, variant_name, quantity, price, cost_price, discount, subtotal, custom_details
    ) VALUES (
      v_order_id, v_product_id, v_variant_id, v_product_name, v_variant_name, v_quantity, v_unit_price, v_cost_price, 0, v_line_subtotal, v_custom_details
    );

    INSERT INTO public.stock_movements (product_id, variant_id, type, quantity, reference_type, reference_id, notes, created_by)
    VALUES (v_product_id, v_variant_id, 'out', v_quantity, 'order', v_order_id, 'Stock reserved by create_order_v1', p_user_id);
  END LOOP;

  -- ===== CAMPAIGNS (server-side) =====
  IF p_campaign_ids IS NOT NULL AND array_length(p_campaign_ids, 1) > 0 THEN
    SELECT * INTO v_dest_address FROM public.addresses WHERE id = p_address_id;
    BEGIN v_addr_city_code := COALESCE(v_dest_address.city_code, NULL); EXCEPTION WHEN undefined_column THEN v_addr_city_code := NULL; END;
    BEGIN v_addr_province_code := COALESCE(v_dest_address.province_code, NULL); EXCEPTION WHEN undefined_column THEN v_addr_province_code := NULL; END;

    FOREACH v_campaign_id IN ARRAY p_campaign_ids LOOP
      SELECT * INTO v_campaign FROM public.campaigns WHERE id = v_campaign_id FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Campaign tidak ditemukan: %', v_campaign_id; END IF;
      IF v_campaign.is_active IS NOT TRUE THEN RAISE EXCEPTION 'Campaign tidak aktif: %', v_campaign.name; END IF;
      IF NOW() < v_campaign.starts_at THEN RAISE EXCEPTION 'Campaign belum berlaku: %', v_campaign.name; END IF;
      IF NOW() > v_campaign.ends_at THEN RAISE EXCEPTION 'Campaign sudah berakhir: %', v_campaign.name; END IF;
      IF v_campaign.usage_limit IS NOT NULL AND COALESCE(v_campaign.usage_count, 0) >= v_campaign.usage_limit THEN
        RAISE EXCEPTION 'Kuota campaign sudah habis: %', v_campaign.name;
      END IF;

      v_one_campaign_discount := 0;

      IF v_campaign.type IN ('flash_sale', 'product_discount') THEN
        SELECT COALESCE(SUM(oi.subtotal), 0) INTO v_matched_subtotal
        FROM public.order_items oi LEFT JOIN public.products p ON p.id = oi.product_id
        WHERE oi.order_id = v_order_id AND (
          v_campaign.target_scope = 'all'
          OR (v_campaign.target_scope = 'products' AND EXISTS (SELECT 1 FROM public.campaign_products cp WHERE cp.campaign_id = v_campaign.id AND cp.product_id = oi.product_id))
          OR (v_campaign.target_scope = 'categories' AND EXISTS (SELECT 1 FROM public.campaign_categories cc WHERE cc.campaign_id = v_campaign.id AND cc.category_id = p.category_id))
        );
        IF v_matched_subtotal < v_campaign.min_order THEN RAISE EXCEPTION 'Minimal belanja campaign "%" belum terpenuhi', v_campaign.name; END IF;
        IF v_matched_subtotal <= 0 THEN CONTINUE; END IF;

        IF v_campaign.discount_unit = 'percentage' THEN
          v_one_campaign_discount := ROUND(v_matched_subtotal * v_campaign.discount_value / 100.0);
        ELSE
          v_one_campaign_discount := v_campaign.discount_value;
        END IF;
        IF v_campaign.max_discount IS NOT NULL AND v_campaign.max_discount > 0 THEN
          v_one_campaign_discount := LEAST(v_one_campaign_discount, v_campaign.max_discount);
        END IF;
        v_one_campaign_discount := LEAST(v_one_campaign_discount, v_matched_subtotal);
        v_campaign_item_discount := v_campaign_item_discount + v_one_campaign_discount;

      ELSIF v_campaign.type = 'free_shipping' THEN
        IF v_computed_subtotal < v_campaign.min_order THEN RAISE EXCEPTION 'Minimal belanja gratis ongkir "%" belum terpenuhi', v_campaign.name; END IF;

        IF v_campaign.region_scope <> 'all' THEN
          IF v_campaign.region_scope = 'cities' THEN
            IF v_addr_city_code IS NULL OR NOT EXISTS (SELECT 1 FROM public.campaign_regions cr WHERE cr.campaign_id = v_campaign.id AND cr.region_type = 'city' AND cr.region_code = v_addr_city_code) THEN
              RAISE EXCEPTION 'Alamat tidak masuk wilayah gratis ongkir: %', v_campaign.name;
            END IF;
          ELSIF v_campaign.region_scope = 'provinces' THEN
            IF v_addr_province_code IS NULL OR NOT EXISTS (SELECT 1 FROM public.campaign_regions cr WHERE cr.campaign_id = v_campaign.id AND cr.region_type = 'province' AND cr.region_code = v_addr_province_code) THEN
              RAISE EXCEPTION 'Alamat tidak masuk wilayah gratis ongkir: %', v_campaign.name;
            END IF;
          END IF;
        END IF;

        IF v_campaign.discount_unit = 'percentage' THEN
          v_one_campaign_discount := ROUND(v_safe_shipping * v_campaign.discount_value / 100.0);
        ELSE
          v_one_campaign_discount := v_campaign.discount_value;
        END IF;
        IF v_campaign.max_discount IS NOT NULL AND v_campaign.max_discount > 0 THEN
          v_one_campaign_discount := LEAST(v_one_campaign_discount, v_campaign.max_discount);
        END IF;
        v_one_campaign_discount := LEAST(v_one_campaign_discount, v_safe_shipping);
        v_campaign_shipping_discount := v_campaign_shipping_discount + v_one_campaign_discount;
      END IF;

      UPDATE public.campaigns SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = v_campaign.id;
      INSERT INTO public.campaign_usages (campaign_id, order_id, discount_amount) VALUES (v_campaign.id, v_order_id, v_one_campaign_discount);
    END LOOP;
  END IF;

  -- ===== VOUCHER (server-side) =====
  IF p_voucher_code IS NOT NULL AND length(trim(p_voucher_code)) > 0 THEN
    SELECT * INTO v_voucher FROM public.vouchers WHERE upper(code) = upper(trim(p_voucher_code)) FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Kode voucher tidak ditemukan'; END IF;
    IF v_voucher.is_active IS NOT TRUE THEN RAISE EXCEPTION 'Voucher tidak aktif'; END IF;
    IF v_voucher.valid_from IS NOT NULL AND NOW() < v_voucher.valid_from THEN RAISE EXCEPTION 'Voucher belum berlaku'; END IF;
    IF v_voucher.valid_until IS NOT NULL AND NOW() > v_voucher.valid_until THEN RAISE EXCEPTION 'Voucher sudah kedaluwarsa'; END IF;
    IF v_voucher.usage_limit IS NOT NULL AND COALESCE(v_voucher.used_count, 0) >= v_voucher.usage_limit THEN RAISE EXCEPTION 'Kuota voucher sudah habis'; END IF;
    IF v_voucher.min_order IS NOT NULL AND v_computed_subtotal < v_voucher.min_order THEN RAISE EXCEPTION 'Minimal belanja voucher belum terpenuhi'; END IF;

    IF v_voucher.type = 'percentage' THEN
      v_voucher_discount := ROUND(v_computed_subtotal * v_voucher.value / 100.0);
      IF v_voucher.max_discount IS NOT NULL AND v_voucher.max_discount > 0 THEN
        v_voucher_discount := LEAST(v_voucher_discount, v_voucher.max_discount);
      END IF;
    ELSE v_voucher_discount := v_voucher.value;
    END IF;

    v_safe_discount := GREATEST(v_voucher_discount, 0);
    v_voucher_id := v_voucher.id;
    UPDATE public.vouchers SET used_count = COALESCE(used_count, 0) + 1 WHERE id = v_voucher.id;
    INSERT INTO public.voucher_usages (voucher_id, user_id, order_id) VALUES (v_voucher.id, p_user_id, v_order_id);
  END IF;

  v_safe_discount := GREATEST(v_safe_discount + v_campaign_item_discount, 0);
  v_safe_discount := LEAST(v_safe_discount, v_computed_subtotal);
  v_safe_shipping := GREATEST(v_safe_shipping - v_campaign_shipping_discount, 0);

  v_taxable_amount := GREATEST(v_computed_subtotal - v_safe_discount, 0);
  v_computed_tax := ROUND(v_taxable_amount * 0.11);
  v_computed_total := GREATEST(v_taxable_amount + v_safe_shipping + v_safe_service_fee, 0);

  UPDATE public.orders
  SET subtotal = v_computed_subtotal, discount = v_safe_discount, voucher_id = v_voucher_id,
      shipping_cost = v_safe_shipping, tax = v_computed_tax, service_fee = v_safe_service_fee, total = v_computed_total,
      hpp_total = v_computed_hpp, profit = v_computed_total - v_safe_shipping - v_computed_hpp,
      total_weight_grams = CASE WHEN v_computed_weight > 0 THEN v_computed_weight ELSE GREATEST(COALESCE(p_total_weight, 0), 0) END,
      updated_at = NOW()
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_v1(
  UUID, UUID, JSONB, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, INTEGER, NUMERIC, NUMERIC, NUMERIC, TEXT, UUID[]
) TO authenticated;
