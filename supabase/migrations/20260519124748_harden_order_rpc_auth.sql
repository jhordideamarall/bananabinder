-- Harden checkout RPC ownership and exposed execute privileges.
-- The function is intentionally SECURITY DEFINER for stock/order writes, so it
-- must verify the JWT user before trusting p_user_id from the client payload.

DO $$
DECLARE
  v_signature REGPROCEDURE :=
    'public.create_order_v1(uuid,uuid,jsonb,text,numeric,numeric,numeric,text,text,text,integer,numeric,numeric,numeric,text,uuid[])'::REGPROCEDURE;
  v_definition TEXT;
  v_hardened_definition TEXT;
  v_old_guard TEXT := 'BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION ''User wajib ada untuk membuat pesanan''; END IF;';
  v_new_guard TEXT := 'BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION ''Sesi login tidak valid untuk membuat pesanan ini'';
  END IF;

  IF p_user_id IS NULL THEN RAISE EXCEPTION ''User wajib ada untuk membuat pesanan''; END IF;';
BEGIN
  SELECT pg_get_functiondef(v_signature) INTO v_definition;

  IF position(v_new_guard IN v_definition) > 0 THEN
    RETURN;
  END IF;

  IF position(v_old_guard IN v_definition) = 0 THEN
    RAISE EXCEPTION 'create_order_v1 guard anchor not found. Review migration before applying.';
  END IF;

  v_hardened_definition := replace(v_definition, v_old_guard, v_new_guard);
  EXECUTE v_hardened_definition;
END $$;

REVOKE EXECUTE ON FUNCTION public.create_order_v1(
  UUID, UUID, JSONB, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, INTEGER, NUMERIC, NUMERIC, NUMERIC, TEXT, UUID[]
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_order_v1(
  UUID, UUID, JSONB, TEXT, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, INTEGER, NUMERIC, NUMERIC, NUMERIC, TEXT, UUID[]
) TO authenticated, service_role;

-- Inventory release is only called from trusted server-side webhook handling.
REVOKE EXECUTE ON FUNCTION public.release_order_inventory_v1(UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_order_inventory_v1(UUID, TEXT) TO service_role;
