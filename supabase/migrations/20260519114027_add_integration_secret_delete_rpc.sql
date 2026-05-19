CREATE OR REPLACE FUNCTION public.admin_delete_integration_secret(
  p_provider TEXT,
  p_secret_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_existing public.integration_secrets%ROWTYPE;
BEGIN
  IF p_provider NOT IN ('xendit', 'biteship', 'fonnte') THEN
    RAISE EXCEPTION 'invalid provider' USING ERRCODE = '22023';
  END IF;

  IF p_secret_key NOT IN (
    'secret_key',
    'test_secret_key',
    'callback_token',
    'test_callback_token',
    'api_key',
    'test_api_key',
    'mode',
    'origin_area_id',
    'api_token'
  ) THEN
    RAISE EXCEPTION 'invalid secret key' USING ERRCODE = '22023';
  END IF;

  SELECT *
    INTO v_existing
    FROM public.integration_secrets
   WHERE provider = p_provider
     AND secret_key = p_secret_key
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  PERFORM vault.update_secret(
    v_existing.vault_secret_id,
    'deleted',
    'bananasbindery_' || p_provider || '_' || p_secret_key,
    'Deleted Bananasbindery ' || p_provider || ' ' || p_secret_key
  );

  UPDATE public.integration_secrets
     SET is_configured = FALSE,
         last_test_status = NULL,
         last_test_message = NULL,
         last_tested_at = NULL,
         updated_at = NOW()
   WHERE id = v_existing.id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_integration_secret(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_integration_secret(TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_integration_secret(TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_integration_secret(TEXT, TEXT) TO service_role;
