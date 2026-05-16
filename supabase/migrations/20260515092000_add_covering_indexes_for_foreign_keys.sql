-- Migration: covering indexes untuk foreign key
-- Date: 2026-05-15
-- Context: Supabase performance advisor menandai 26 FK tanpa covering index.
-- Index additive & IF NOT EXISTS — aman, tidak mengubah data/skema.

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pet_id ON public.bookings(pet_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON public.bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON public.cart_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_history_order_id ON public.loyalty_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_order_id ON public.order_returns(order_id);
CREATE INDEX IF NOT EXISTS idx_order_returns_user_id ON public.order_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_address_id ON public.orders(address_id);
CREATE INDEX IF NOT EXISTS idx_orders_voucher_id ON public.orders(voucher_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON public.reviews(service_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON public.stock_movements(created_by);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant_id ON public.stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_voucher_usages_order_id ON public.voucher_usages(order_id);
CREATE INDEX IF NOT EXISTS idx_voucher_usages_user_id ON public.voucher_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);
