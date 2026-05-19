ALTER TABLE public.integration_secrets
  DROP CONSTRAINT IF EXISTS integration_secrets_secret_key_check;

ALTER TABLE public.integration_secrets
  ADD CONSTRAINT integration_secrets_secret_key_check
  CHECK (secret_key IN (
    'secret_key',
    'callback_token',
    'api_key',
    'test_api_key',
    'origin_area_id',
    'api_token'
  ));
