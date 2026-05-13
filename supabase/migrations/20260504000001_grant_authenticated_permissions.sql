-- Grant table-level permissions to authenticated and anon roles
-- Required because RLS policies alone don't bypass PostgreSQL's GRANT check
-- Rollback: REVOKE ALL ON TABLE <name> FROM authenticated; REVOKE ALL ON TABLE <name> FROM anon;

-- Public read access (anon = unauthenticated users)
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.booking_slots TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.banners TO anon;
GRANT SELECT ON public.store_locations TO anon;
GRANT SELECT ON public.vouchers TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets TO authenticated;
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT SELECT ON public.products TO authenticated;
GRANT SELECT ON public.product_variants TO authenticated;
GRANT SELECT ON public.product_images TO authenticated;
GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.services TO authenticated;
GRANT SELECT ON public.booking_slots TO authenticated;
GRANT SELECT ON public.banners TO authenticated;
GRANT SELECT ON public.vouchers TO authenticated;
GRANT SELECT ON public.store_locations TO authenticated;
GRANT SELECT ON public.reviews TO authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT SELECT, INSERT ON public.bookings TO authenticated;
GRANT SELECT ON public.loyalty TO authenticated;
GRANT SELECT ON public.loyalty_history TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_settings TO authenticated;
GRANT SELECT ON public.voucher_usages TO authenticated;
GRANT INSERT ON public.voucher_usages TO authenticated;
GRANT SELECT ON public.transactions TO authenticated;
GRANT SELECT, INSERT ON public.order_returns TO authenticated;
