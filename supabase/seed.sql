-- Seed data: Sample products for Bananasbindery
-- Run this AFTER migrations are applied

-- Products
insert into public.products (name, slug, description, base_price, weight_grams) values
  ('Binder A5 Pastel Dream', 'binder-a5-pastel-dream', 'Buku binder A5 dengan cover pastel lembut, ring 20mm berkualitas tinggi. Cocok untuk catatan kuliah dan journaling.', 89000, 350),
  ('Binder B5 Classic', 'binder-b5-classic', 'Binder B5 ukuran ideal untuk catatan harian. Ring 26mm, muat lebih banyak kertas.', 99000, 420),
  ('Binder A5 Transparent', 'binder-a5-transparent', 'Cover transparan yang bisa di-custom dengan foto atau artwork kamu sendiri.', 79000, 300),
  ('Refill Dotgrid A5 (50 lembar)', 'refill-dotgrid-a5-50', 'Kertas dotgrid 100gsm, tidak tembus tinta. Cocok untuk bullet journal dan fountain pen.', 25000, 150),
  ('Refill Polos A5 (50 lembar)', 'refill-polos-a5-50', 'Kertas polos 100gsm untuk sketching dan free writing.', 22000, 150),
  ('Refill Garis A5 (50 lembar)', 'refill-garis-a5-50', 'Kertas bergaris 80gsm untuk catatan kuliah dan meeting notes.', 20000, 140);

-- Variants for Binder A5 Pastel Dream
insert into public.product_variants (product_id, ring_size, ring_count, cover_color, paper_type, page_count, stock, sku) values
  ((select id from public.products where slug = 'binder-a5-pastel-dream'), '20mm', 20, 'Pink Pastel', 'Dotgrid 100gsm', 40, 50, 'BA5PD-PNK-DOT'),
  ((select id from public.products where slug = 'binder-a5-pastel-dream'), '20mm', 20, 'Blue Pastel', 'Dotgrid 100gsm', 40, 50, 'BA5PD-BLU-DOT'),
  ((select id from public.products where slug = 'binder-a5-pastel-dream'), '20mm', 20, 'Yellow Pastel', 'Dotgrid 100gsm', 40, 50, 'BA5PD-YLW-DOT'),
  ((select id from public.products where slug = 'binder-a5-pastel-dream'), '20mm', 20, 'Pink Pastel', 'Polos 100gsm', 40, 30, 'BA5PD-PNK-PLN'),
  ((select id from public.products where slug = 'binder-a5-pastel-dream'), '20mm', 20, 'Blue Pastel', 'Polos 100gsm', 40, 30, 'BA5PD-BLU-PLN');

-- Variants for Binder B5 Classic
insert into public.product_variants (product_id, ring_size, ring_count, cover_color, paper_type, page_count, stock, sku) values
  ((select id from public.products where slug = 'binder-b5-classic'), '26mm', 26, 'Black', 'Dotgrid 100gsm', 50, 40, 'BB5CL-BLK-DOT'),
  ((select id from public.products where slug = 'binder-b5-classic'), '26mm', 26, 'Navy', 'Dotgrid 100gsm', 50, 40, 'BB5CL-NVY-DOT'),
  ((select id from public.products where slug = 'binder-b5-classic'), '26mm', 26, 'Black', 'Garis 80gsm', 50, 35, 'BB5CL-BLK-GRS');

-- Variants for Binder A5 Transparent
insert into public.product_variants (product_id, ring_size, ring_count, cover_color, paper_type, page_count, stock, sku) values
  ((select id from public.products where slug = 'binder-a5-transparent'), '20mm', 20, 'Clear', 'Dotgrid 100gsm', 40, 60, 'BA5TR-CLR-DOT'),
  ((select id from public.products where slug = 'binder-a5-transparent'), '20mm', 20, 'Clear', 'Polos 100gsm', 40, 60, 'BA5TR-CLR-PLN');

-- Variants for Refills (single variant each)
insert into public.product_variants (product_id, ring_size, ring_count, cover_color, paper_type, page_count, stock, sku) values
  ((select id from public.products where slug = 'refill-dotgrid-a5-50'), null, null, null, 'Dotgrid 100gsm', 50, 200, 'RFL-A5-DOT-50'),
  ((select id from public.products where slug = 'refill-polos-a5-50'), null, null, null, 'Polos 100gsm', 50, 200, 'RFL-A5-PLN-50'),
  ((select id from public.products where slug = 'refill-garis-a5-50'), null, null, null, 'Garis 80gsm', 50, 200, 'RFL-A5-GRS-50');

-- Sample coupon
insert into public.coupons (code, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, valid_from, valid_until) values
  ('WELCOME10', 'percentage', 10, 50000, 20000, 100, now(), now() + interval '30 days'),
  ('BINDER20K', 'fixed', 20000, 100000, null, 50, now(), now() + interval '14 days');
