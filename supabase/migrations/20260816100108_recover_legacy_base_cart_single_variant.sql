-- Recover legacy cart rows that were saved without a variant id.
--
-- A base product can legitimately have zero stock while its variants own the
-- inventory. Older browser carts sent variant_id = null, which made checkout
-- fail after shipping was selected. When exactly one active variant can fulfil
-- the requested quantity, reserve that variant atomically. Ambiguous products
-- still require the customer to choose a variant.
--
-- Also make the RPC honour an explicit variant's promo_price. The storefront
-- already displays that price, so server-side order totals must match it.

DO $migration$
DECLARE
  v_signature REGPROCEDURE :=
    'public.create_order_v1(uuid,uuid,jsonb,text,numeric,numeric,numeric,text,text,text,integer,numeric,numeric,numeric,text,uuid[])'::REGPROCEDURE;
  v_definition TEXT;
  v_updated_definition TEXT;
  v_declaration_anchor TEXT := '  v_current_stock INTEGER;';
  v_declaration_replacement TEXT := '  v_current_stock INTEGER;
  v_base_variant_candidates INTEGER;
  v_base_variant_id UUID;';
  v_variant_price_anchor TEXT := 'SELECT p.name, pv.name, pv.price, COALESCE(p.cost_price, 0), COALESCE(pv.weight_grams, p.weight_grams, 0), COALESCE(pv.stock, 0)';
  v_variant_price_replacement TEXT := 'SELECT p.name, pv.name,
        CASE WHEN pv.promo_price IS NOT NULL AND pv.promo_price > 0 AND pv.promo_price < pv.price THEN pv.promo_price ELSE pv.price END,
        COALESCE(p.cost_price, 0), COALESCE(pv.weight_grams, p.weight_grams, 0), COALESCE(pv.stock, 0)';
  v_old_base_branch TEXT := $old$
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
$old$;
  v_new_base_branch TEXT := $new$
    ELSE
      -- Reserve base stock with one atomic statement. This avoids a lock-order
      -- inversion with the variant path and prevents overselling.
      UPDATE public.products AS p
      SET stock = p.stock - v_quantity,
          sold_count = COALESCE(p.sold_count, 0) + v_quantity,
          updated_at = NOW()
      WHERE p.id = v_product_id
        AND p.is_active = TRUE
        AND COALESCE(p.stock, 0) >= v_quantity
      RETURNING p.name, NULL::TEXT,
        CASE WHEN p.promo_price IS NOT NULL AND p.promo_price > 0 AND p.promo_price < p.price THEN p.promo_price ELSE p.price END,
        COALESCE(p.cost_price, 0), COALESCE(p.weight_grams, 0), COALESCE(p.stock, 0)
      INTO v_product_name, v_variant_name, v_unit_price, v_cost_price, v_weight_grams, v_current_stock;

      IF NOT FOUND THEN
        SELECT p.name, COALESCE(p.stock, 0)
        INTO v_product_name, v_current_stock
        FROM public.products AS p
        WHERE p.id = v_product_id AND p.is_active = TRUE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Produk tidak valid atau tidak aktif';
        END IF;

        SELECT COUNT(*),
          CASE WHEN COUNT(*) = 1 THEN MIN(pv.id::TEXT)::UUID ELSE NULL END
        INTO v_base_variant_candidates, v_base_variant_id
        FROM public.product_variants AS pv
        WHERE pv.product_id = v_product_id
          AND pv.is_active = TRUE
          AND COALESCE(pv.stock, 0) >= v_quantity;

        IF v_base_variant_candidates = 1 AND v_base_variant_id IS NOT NULL THEN
          v_variant_id := v_base_variant_id;

          SELECT p.name, pv.name,
            CASE WHEN pv.promo_price IS NOT NULL AND pv.promo_price > 0 AND pv.promo_price < pv.price THEN pv.promo_price ELSE pv.price END,
            COALESCE(p.cost_price, 0), COALESCE(pv.weight_grams, p.weight_grams, 0), COALESCE(pv.stock, 0)
          INTO v_product_name, v_variant_name, v_unit_price, v_cost_price, v_weight_grams, v_current_stock
          FROM public.product_variants AS pv
          JOIN public.products AS p ON p.id = pv.product_id
          WHERE pv.id = v_variant_id
            AND pv.product_id = v_product_id
            AND pv.is_active = TRUE
            AND p.is_active = TRUE
          FOR UPDATE OF pv;

          IF NOT FOUND OR v_current_stock < v_quantity THEN
            RAISE EXCEPTION 'Stok varian produk berubah. Silakan pilih ulang produk';
          END IF;

          UPDATE public.product_variants
          SET stock = stock - v_quantity, updated_at = NOW()
          WHERE id = v_variant_id;

          UPDATE public.products
          SET sold_count = COALESCE(sold_count, 0) + v_quantity, updated_at = NOW()
          WHERE id = v_product_id;
        ELSIF v_base_variant_candidates > 1 THEN
          RAISE EXCEPTION 'Produk % memiliki beberapa varian tersedia. Pilih varian terlebih dahulu', COALESCE(v_product_name, v_product_id::TEXT);
        ELSE
          RAISE EXCEPTION 'Stok produk % tidak cukup. Sisa stok: %', COALESCE(v_product_name, v_product_id::TEXT), v_current_stock;
        END IF;
      END IF;
    END IF;
$new$;
BEGIN
  SELECT pg_get_functiondef(v_signature) INTO v_definition;

  IF position('v_base_variant_candidates INTEGER' IN v_definition) > 0 THEN
    RETURN;
  END IF;

  IF position(v_declaration_anchor IN v_definition) = 0 THEN
    RAISE EXCEPTION 'create_order_v1 declaration anchor not found';
  END IF;
  v_updated_definition := replace(
    v_definition,
    v_declaration_anchor,
    v_declaration_replacement
  );

  IF position(v_variant_price_anchor IN v_updated_definition) = 0 THEN
    RAISE EXCEPTION 'create_order_v1 variant price anchor not found';
  END IF;
  v_updated_definition := replace(
    v_updated_definition,
    v_variant_price_anchor,
    v_variant_price_replacement
  );

  IF position(v_old_base_branch IN v_updated_definition) = 0 THEN
    RAISE EXCEPTION 'create_order_v1 base inventory anchor not found';
  END IF;
  v_updated_definition := replace(
    v_updated_definition,
    v_old_base_branch,
    v_new_base_branch
  );

  EXECUTE v_updated_definition;
END
$migration$;

REVOKE EXECUTE ON FUNCTION public.create_order_v1(
  UUID, UUID, JSONB, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT,
  INTEGER, NUMERIC, NUMERIC, NUMERIC, TEXT, UUID[]
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_order_v1(
  UUID, UUID, JSONB, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT,
  INTEGER, NUMERIC, NUMERIC, NUMERIC, TEXT, UUID[]
) TO authenticated, service_role;
