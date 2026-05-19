-- Store third-party integration secrets in Supabase Vault.
-- Public table only stores non-secret metadata for admin UI status.

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA vault;

CREATE TABLE IF NOT EXISTS public.integration_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('xendit', 'biteship', 'fonnte')),
  secret_key TEXT NOT NULL CHECK (secret_key IN (
    'secret_key',
    'callback_token',
    'api_key',
    'test_api_key',
    'origin_area_id',
    'api_token'
  )),
  vault_secret_id UUID NOT NULL,
  is_configured BOOLEAN NOT NULL DEFAULT TRUE,
  last_test_status TEXT CHECK (last_test_status IN ('success', 'failed')),
  last_test_message TEXT,
  last_tested_at TIMESTAMPTZ,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider, secret_key)
);

ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_integration_secrets" ON public.integration_secrets;
CREATE POLICY "admin_read_integration_secrets"
  ON public.integration_secrets
  FOR SELECT
  USING (public.is_admin_or_owner());

CREATE INDEX IF NOT EXISTS idx_integration_secrets_provider
  ON public.integration_secrets(provider);

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

  IF p_secret_key NOT IN ('secret_key', 'callback_token', 'api_key', 'test_api_key', 'origin_area_id', 'api_token') THEN
    RAISE EXCEPTION 'invalid secret key' USING ERRCODE = '22023';
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

CREATE OR REPLACE FUNCTION public.get_integration_secret(
  p_provider TEXT,
  p_secret_key TEXT
)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, vault, pg_temp
AS $$
  SELECT ds.decrypted_secret
    FROM public.integration_secrets s
    JOIN vault.decrypted_secrets ds ON ds.id = s.vault_secret_id
   WHERE s.provider = p_provider
     AND s.secret_key = p_secret_key
     AND s.is_configured = TRUE
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.admin_record_integration_test(
  p_provider TEXT,
  p_status TEXT,
  p_message TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_admin_or_owner() THEN
    RAISE EXCEPTION 'not authorized' USING ERRCODE = '42501';
  END IF;

  IF p_provider NOT IN ('xendit', 'biteship', 'fonnte') THEN
    RAISE EXCEPTION 'invalid provider' USING ERRCODE = '22023';
  END IF;

  IF p_status NOT IN ('success', 'failed') THEN
    RAISE EXCEPTION 'invalid status' USING ERRCODE = '22023';
  END IF;

  UPDATE public.integration_secrets
     SET last_test_status = p_status,
         last_test_message = left(coalesce(p_message, ''), 500),
         last_tested_at = NOW(),
         updated_at = NOW()
   WHERE provider = p_provider;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_integration_secret(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_upsert_integration_secret(TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.admin_upsert_integration_secret(TEXT, TEXT, TEXT) FROM authenticated;
REVOKE ALL ON FUNCTION public.get_integration_secret(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_integration_secret(TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.get_integration_secret(TEXT, TEXT) FROM authenticated;
REVOKE ALL ON FUNCTION public.admin_record_integration_test(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_record_integration_test(TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.admin_record_integration_test(TEXT, TEXT, TEXT) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.admin_upsert_integration_secret(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_record_integration_test(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_integration_secret(TEXT, TEXT) TO service_role;
