-- Bananasbindery Binder Commerce — Seed Data
-- Categories and starter products for binder/photo-product catalog.

-- 1. CATEGORIES
INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES
('Binder Photocard', 'binder-photocard', 'Binder dan organizer untuk koleksi photocard.', NULL, 1),
('Refill Binder', 'refill-binder', 'Refill paper, sleeve, dan isi binder A5/A6/mini.', NULL, 2),
('Custom Name Binder', 'custom-name-binder', 'Binder dengan personalisasi nama atau teks custom.', NULL, 3),
('Gift Bundle', 'gift-bundle', 'Bundle binder siap hadiah dengan packaging estetik.', NULL, 4),
('Accessories', 'accessories', 'Aksesori binder seperti charm, divider, sticker, dan label.', NULL, 5),
('New Drop', 'new-drop', 'Produk baru dan limited drop Bananasbindery.', NULL, 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- 2. PRODUCTS
DO $$
DECLARE
    cat_binder UUID;
    cat_refill UUID;
    cat_custom UUID;
    cat_bundle UUID;
    cat_accessories UUID;
    cat_new UUID;
    prod_id UUID;
BEGIN
    SELECT id INTO cat_binder FROM categories WHERE slug = 'binder-photocard';
    SELECT id INTO cat_refill FROM categories WHERE slug = 'refill-binder';
    SELECT id INTO cat_custom FROM categories WHERE slug = 'custom-name-binder';
    SELECT id INTO cat_bundle FROM categories WHERE slug = 'gift-bundle';
    SELECT id INTO cat_accessories FROM categories WHERE slug = 'accessories';
    SELECT id INTO cat_new FROM categories WHERE slug = 'new-drop';

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type, promo_price)
    VALUES (cat_binder, 'A5 Photocard Binder Rose', 'a5-photocard-binder-rose', 'Binder A5 warna rose untuk koleksi photocard dan memo.', 129000, 72000, 40, 650, 'normal', 119000)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock, weight_grams = EXCLUDED.weight_grams, promo_price = EXCLUDED.promo_price
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams)
    VALUES (prod_id, 'Rose / A5', 'BB-A5-ROSE', 129000, 72000, 40, 650)
    ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock, weight_grams = EXCLUDED.weight_grams;

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type)
    VALUES (cat_binder, 'A6 Mini Binder Denim Blue', 'a6-mini-binder-denim-blue', 'Mini binder A6 warna denim blue untuk koleksi harian.', 99000, 55000, 35, 420, 'normal')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock, weight_grams = EXCLUDED.weight_grams
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams)
    VALUES (prod_id, 'Denim Blue / A6', 'BB-A6-DENIM', 99000, 55000, 35, 420)
    ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock, weight_grams = EXCLUDED.weight_grams;

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type)
    VALUES (cat_refill, 'Refill Photocard Sleeve A5 20 Sheets', 'refill-photocard-sleeve-a5-20', 'Isi ulang sleeve photocard A5 isi 20 lembar.', 45000, 22000, 80, 250, 'normal')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock, weight_grams = EXCLUDED.weight_grams
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams)
    VALUES (prod_id, 'A5 / 20 Sheets', 'BB-REF-A5-20', 45000, 22000, 80, 250)
    ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock, weight_grams = EXCLUDED.weight_grams;

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type)
    VALUES (cat_custom, 'Custom Name Binder A5', 'custom-name-binder-a5', 'Binder A5 dengan custom nama/teks untuk hadiah personal.', 159000, 90000, 25, 700, 'normal')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock, weight_grams = EXCLUDED.weight_grams
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams)
    VALUES (prod_id, 'A5 / Custom Text', 'BB-CUSTOM-A5', 159000, 90000, 25, 700)
    ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock, weight_grams = EXCLUDED.weight_grams;

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type, promo_price)
    VALUES (cat_bundle, 'Gift Bundle Binder Starter Kit', 'gift-bundle-binder-starter-kit', 'Bundle binder, refill, divider, sticker, dan gift packaging.', 229000, 135000, 20, 1100, 'parcel', 199000)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock, weight_grams = EXCLUDED.weight_grams, promo_price = EXCLUDED.promo_price
    RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams)
    VALUES (prod_id, 'Starter Kit', 'BB-BUNDLE-STARTER', 229000, 135000, 20, 1100)
    ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock, weight_grams = EXCLUDED.weight_grams;

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type)
    VALUES (cat_accessories, 'Binder Divider Pastel Set', 'binder-divider-pastel-set', 'Divider pastel untuk merapikan section koleksi binder.', 35000, 15000, 70, 120, 'normal')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock, weight_grams = EXCLUDED.weight_grams;

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type)
    VALUES (cat_new, 'Limited Drop Violet Mini Binder', 'limited-drop-violet-mini-binder', 'Limited mini binder warna violet untuk koleksi photocard.', 119000, 68000, 15, 430, 'normal')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, cost_price = EXCLUDED.cost_price, stock = EXCLUDED.stock, weight_grams = EXCLUDED.weight_grams;
END $$;
