-- Allow store admins to enable or disable COD without a code deployment.
-- Keep the default enabled to preserve the existing checkout behavior.

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS cod_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.store_settings.cod_enabled IS
  'Controls whether cash on delivery is offered and accepted at checkout.';
