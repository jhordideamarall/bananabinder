CREATE OR REPLACE FUNCTION public.check_phone_in_auth(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  normalized_phone TEXT := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  phone_e164 TEXT;
  phone_local TEXT;
  phone_without_plus TEXT;
BEGIN
  IF normalized_phone = '' THEN
    RETURN FALSE;
  END IF;

  IF normalized_phone LIKE '+62%' THEN
    phone_e164 := normalized_phone;
    phone_without_plus := substring(normalized_phone FROM 2);
    phone_local := '0' || substring(normalized_phone FROM 4);
  ELSIF normalized_phone LIKE '62%' THEN
    phone_e164 := '+' || normalized_phone;
    phone_without_plus := normalized_phone;
    phone_local := '0' || substring(normalized_phone FROM 3);
  ELSIF normalized_phone LIKE '0%' THEN
    phone_e164 := '+62' || substring(normalized_phone FROM 2);
    phone_without_plus := '62' || substring(normalized_phone FROM 2);
    phone_local := normalized_phone;
  ELSE
    phone_e164 := '+62' || normalized_phone;
    phone_without_plus := '62' || normalized_phone;
    phone_local := '0' || normalized_phone;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE phone IN (normalized_phone, phone_e164, phone_without_plus, phone_local)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_phone_in_auth(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_phone_in_auth(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.check_phone_in_auth(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_phone_in_auth(TEXT) TO service_role;
