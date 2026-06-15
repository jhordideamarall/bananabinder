CREATE TABLE IF NOT EXISTS public.phone_otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('login', 'register', 'checkout')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_otp_challenges_lookup
  ON public.phone_otp_challenges(normalized_phone, created_at DESC)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_phone_otp_challenges_expires_at
  ON public.phone_otp_challenges(expires_at);

ALTER TABLE public.phone_otp_challenges ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.phone_otp_challenges FROM PUBLIC;
REVOKE ALL ON TABLE public.phone_otp_challenges FROM anon;
REVOKE ALL ON TABLE public.phone_otp_challenges FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.phone_otp_challenges TO service_role;
