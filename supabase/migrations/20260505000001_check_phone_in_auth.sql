-- Function to check if phone exists in auth.users (bypasses profiles)
CREATE OR REPLACE FUNCTION public.check_phone_in_auth(p_phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE phone = p_phone
       OR phone = CASE
           WHEN p_phone LIKE '0%' THEN '+62' || substring(p_phone FROM 2)
           WHEN p_phone LIKE '+62%' THEN '0' || substring(p_phone FROM 4)
           ELSE p_phone
         END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_phone_in_auth TO service_role;
