REVOKE EXECUTE ON FUNCTION public.admin_upsert_integration_secret(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_integration_secret(TEXT, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_upsert_integration_secret(TEXT, TEXT, TEXT) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_record_integration_test(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_record_integration_test(TEXT, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_record_integration_test(TEXT, TEXT, TEXT) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.get_integration_secret(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_integration_secret(TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_integration_secret(TEXT, TEXT) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.admin_upsert_integration_secret(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_record_integration_test(TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_integration_secret(TEXT, TEXT) TO service_role;
