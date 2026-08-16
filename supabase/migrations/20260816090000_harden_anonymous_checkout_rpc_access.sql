-- Anonymous Auth sessions use the authenticated Postgres role. Keep the
-- manual order expiry RPC service-only because it mutates orders, vouchers,
-- campaigns, and reserved inventory without an end-user ownership check.
REVOKE ALL ON FUNCTION public.expire_manual_order_v1(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.expire_manual_order_v1(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_manual_order_v1(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.expire_manual_order_v1(UUID, TEXT) TO service_role;
