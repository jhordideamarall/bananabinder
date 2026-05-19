ALTER TABLE public.integration_secrets
  DROP CONSTRAINT IF EXISTS integration_secrets_secret_key_check;

ALTER TABLE public.integration_secrets
  ADD CONSTRAINT integration_secrets_secret_key_check
  CHECK (secret_key IN (
    'secret_key',
    'test_secret_key',
    'callback_token',
    'test_callback_token',
    'api_key',
    'test_api_key',
    'webhook_token',
    'mode',
    'origin_area_id',
    'api_token'
  ));

CREATE OR REPLACE FUNCTION public.admin_upsert_integration_secret(
  p_provider TEXT,
  p_secret_key TEXT,
  p_secret TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
DECLARE
  v_existing public.integration_secrets%ROWTYPE;
  v_vault_secret_id UUID;
  v_secret_name TEXT;
BEGIN
  IF NOT public.is_admin_or_owner() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

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
    'webhook_token',
    'mode',
    'origin_area_id',
    'api_token'
  ) THEN
    RAISE EXCEPTION 'invalid secret key' USING ERRCODE = '22023';
  END IF;

  IF p_secret_key = 'mode' AND p_secret NOT IN ('production', 'test') THEN
    RAISE EXCEPTION 'invalid integration mode' USING ERRCODE = '22023';
  END IF;

  IF p_secret IS NULL OR length(btrim(p_secret)) = 0 THEN
    RAISE EXCEPTION 'secret cannot be empty' USING ERRCODE = '22023';
  END IF;

  v_secret_name := 'bananasbindery_' || p_provider || '_' || p_secret_key;

  SELECT *
    INTO v_existing
    FROM public.integration_secrets
   WHERE provider = p_provider
     AND secret_key = p_secret_key
   FOR UPDATE;

  IF FOUND THEN
    PERFORM vault.update_secret(
      v_existing.vault_secret_id,
      p_secret,
      v_secret_name,
      'Bananasbindery ' || p_provider || ' ' || p_secret_key
    );
    v_vault_secret_id := v_existing.vault_secret_id;
  ELSE
    SELECT vault.create_secret(
      p_secret,
      v_secret_name,
      'Bananasbindery ' || p_provider || ' ' || p_secret_key
    )
    INTO v_vault_secret_id;
  END IF;

  INSERT INTO public.integration_secrets (
    provider,
    secret_key,
    vault_secret_id,
    is_configured,
    updated_by,
    updated_at
  )
  VALUES (
    p_provider,
    p_secret_key,
    v_vault_secret_id,
    TRUE,
    auth.uid(),
    NOW()
  )
  ON CONFLICT (provider, secret_key)
  DO UPDATE SET
    vault_secret_id = EXCLUDED.vault_secret_id,
    is_configured = TRUE,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW();
END;
$$;

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
    'webhook_token',
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

REVOKE EXECUTE ON FUNCTION public.admin_upsert_integration_secret(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_integration_secret(TEXT, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_integration_secret(TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_integration_secret(TEXT, TEXT, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.admin_delete_integration_secret(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_integration_secret(TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_integration_secret(TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_integration_secret(TEXT, TEXT) TO service_role;
