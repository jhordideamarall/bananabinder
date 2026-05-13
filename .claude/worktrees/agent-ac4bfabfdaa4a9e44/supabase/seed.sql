-- Bananasbindery Platform — Seed Data
-- 6 Categories, 30 Products (with realistic names), 6 Services

-- 1. CATEGORIES
INSERT INTO categories (name, slug, description, image_url, sort_order) VALUES
('Makanan Kucing', 'makanan-kucing', 'Pilihan makanan kering dan basah terbaik untuk kucing Anda.', NULL, 1),
('Makanan Anjing', 'makanan-anjing', 'Nutrisi lengkap untuk anjing dari berbagai ras dan ukuran.', NULL, 2),
('Pasir & Kebersihan', 'pasir-kebersihan', 'Perlengkapan untuk menjaga kebersihan hewan dan lingkungan rumah.', NULL, 3),
('Aksesoris', 'aksesoris', 'Koleksi kalung, tali, mainan, dan perlengkapan harian lainnya.', NULL, 4),
('Kesehatan & Vitamin', 'kesehatan-vitamin', 'Suplemen dan obat-obatan untuk menjaga imunitas peliharaan.', NULL, 5),
('Grooming Supplies', 'grooming-supplies', 'Shampoo, sisir, dan peralatan perawatan bulu profesional.', NULL, 6);

-- 2. SERVICES
INSERT INTO services (name, slug, type, description, price, duration_minutes, requires_dp, dp_percentage, sort_order) VALUES
('Grooming Kucing Basic', 'grooming-kucing-basic', 'grooming', 'Mandi, potong kuku, pembersihan telinga untuk kucing.', 75000, 60, false, 0, 1),
('Grooming Kucing Full', 'grooming-kucing-full', 'grooming', 'Basic + cukur bulu + treatment anti jamur/kutu.', 150000, 120, false, 0, 2),
('Grooming Anjing Basic', 'grooming-anjing-basic', 'grooming', 'Mandi, potong kuku, sikat gigi untuk anjing.', 100000, 90, false, 0, 3),
('Grooming Anjing Full', 'grooming-anjing-full', 'grooming', 'Basic + potong rambut gaya + treatment lengkap.', 200000, 150, false, 0, 4),
('Pet Hotel Small', 'pet-hotel-small', 'hotel', 'Penginapan nyaman untuk hewan kecil (kucing/anjing kecil) dengan kontrol suhu.', 120000, NULL, true, 50, 5),
('Pet Hotel Large', 'pet-hotel-large', 'hotel', 'Kamar luas untuk anjing besar dengan waktu bermain harian.', 250000, NULL, true, 50, 6);

-- 3. PRODUCTS (30 items — realistic names & prices for Jakarta petshop)
DO $$
DECLARE
    cat_makanan_kucing UUID;
    cat_makanan_anjing UUID;
    cat_pasir UUID;
    cat_aksesoris UUID;
    cat_kesehatan UUID;
    cat_grooming UUID;
    prod_id UUID;
BEGIN
    SELECT id INTO cat_makanan_kucing FROM categories WHERE slug = 'makanan-kucing';
    SELECT id INTO cat_makanan_anjing FROM categories WHERE slug = 'makanan-anjing';
    SELECT id INTO cat_pasir FROM categories WHERE slug = 'pasir-kebersihan';
    SELECT id INTO cat_aksesoris FROM categories WHERE slug = 'aksesoris';
    SELECT id INTO cat_kesehatan FROM categories WHERE slug = 'kesehatan-vitamin';
    SELECT id INTO cat_grooming FROM categories WHERE slug = 'grooming-supplies';

    -- Makanan Kucing (5 products)
    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_makanan_kucing, 'Royal Canin Indoor 27 - 2kg', 'royal-canin-indoor-27-2kg', 'Makanan kering premium untuk kucing indoor dewasa. Formula khusus mengurangi bau kotoran.', 245000, 180000, 50, 2000, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '2kg', 'RC-IND27-2KG', 245000, 180000, 50, 2000);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_makanan_kucing, 'Whiskas Tuna Adult 1.2kg', 'whiskas-tuna-adult-1-2kg', 'Makanan kucing dewasa rasa tuna, kaya omega-3 untuk bulu sehat.', 89000, 62000, 80, 1200, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '1.2kg', 'WSK-TUNA-1.2', 89000, 62000, 80, 1200);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_makanan_kucing, 'Me-O Kitten Ocean Fish 1.1kg', 'meo-kitten-ocean-fish', 'Makanan anak kucing rasa ikan laut, tinggi protein untuk pertumbuhan.', 68000, 48000, 60, 1100, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '1.1kg', 'MEO-KIT-OF', 68000, 48000, 60, 1100);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_makanan_kucing, 'Sheba Tuna & Salmon Pouch 70g', 'sheba-tuna-salmon-70g', 'Makanan basah kucing premium, potongan daging dalam kuah.', 18000, 12000, 120, 70, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '70g', 'SHEBA-TS-70', 18000, 12000, 120, 70);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type, promo_price) VALUES
    (cat_makanan_kucing, 'Proplan Adult Salmon 2.5kg', 'proplan-adult-salmon-2-5kg', 'Makanan kucing dewasa rasa salmon, formula untuk pencernaan sensitif.', 320000, 240000, 30, 2500, 'normal', 285000) RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams, promo_price) VALUES (prod_id, '2.5kg', 'PP-SALM-2.5', 320000, 240000, 30, 2500, 285000);

    -- Makanan Anjing (5 products)
    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_makanan_anjing, 'Pedigree Adult Chicken & Vegetables 3kg', 'pedigree-adult-chicken-veg-3kg', 'Makanan anjing dewasa rasa ayam dan sayuran, nutrisi seimbang.', 135000, 95000, 40, 3000, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '3kg', 'PED-CV-3KG', 135000, 95000, 40, 3000);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_makanan_anjing, 'Royal Canin Mini Adult 2kg', 'royal-canin-mini-adult-2kg', 'Makanan premium untuk anjing ras kecil dewasa.', 265000, 195000, 35, 2000, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '2kg', 'RC-MINI-2KG', 265000, 195000, 35, 2000);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_makanan_anjing, 'Cesar Wet Food Beef 100g', 'cesar-wet-food-beef-100g', 'Makanan basah anjing premium rasa daging sapi.', 25000, 17000, 100, 100, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '100g', 'CES-BEEF-100', 25000, 17000, 100, 100);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_makanan_anjing, 'Dog Frozen Raw Chicken BARF 500g', 'frozen-raw-chicken-barf-500g', 'Makanan anjing mentah beku (BARF diet). Simpan di freezer.', 75000, 50000, 20, 500, 'frozen') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '500g', 'BARF-CKN-500', 75000, 50000, 20, 500);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_makanan_anjing, 'Acana Heritage Adult Dog 2kg', 'acana-heritage-adult-2kg', 'Makanan anjing grain-free premium, bahan alami.', 450000, 340000, 15, 2000, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '2kg', 'ACANA-HER-2', 450000, 340000, 15, 2000);

    -- Pasir & Kebersihan (5 products)
    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_pasir, 'Pasir Kucing Cat''s Best Original 10L', 'cats-best-original-10l', 'Pasir kucing organik dari serat kayu, daya serap tinggi, ramah lingkungan.', 145000, 100000, 40, 4300, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '10L', 'CB-ORI-10L', 145000, 100000, 40, 4300);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_pasir, 'Pasir Wangi Kawan Bentonite 25L', 'kawan-bentonite-25l', 'Pasir kucing bentonite premium dengan wangi lavender. Gumpalan kuat.', 85000, 55000, 60, 20000, 'parcel') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '25L', 'KWN-BNT-25', 85000, 55000, 60, 20000);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_pasir, 'Pee Pad Training 60x45cm (50pcs)', 'pee-pad-60x45-50pcs', 'Perlak training untuk anak anjing, super absorbent.', 95000, 65000, 45, 1500, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '50pcs', 'PP-6045-50', 95000, 65000, 45, 1500);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_pasir, 'Pet Deodorizer Spray 500ml', 'pet-deodorizer-spray-500ml', 'Spray penghilang bau hewan, aman untuk bulu dan kulit.', 55000, 35000, 70, 550, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '500ml', 'DEO-SPR-500', 55000, 35000, 70, 550);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_pasir, 'Pooper Scooper Stainless Steel', 'pooper-scooper-stainless', 'Sekop pasir kucing stainless steel anti karat, pegangan ergonomis.', 45000, 28000, 55, 300, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, 'Standard', 'PS-SS-STD', 45000, 28000, 55, 300);

    -- Aksesoris (5 products)
    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_aksesoris, 'Kalung Kucing Bel Adjustable', 'kalung-kucing-bel', 'Kalung kucing dengan bel kecil, tali adjustable, bahan nylon lembut.', 25000, 12000, 100, 30, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, 'Standard', 'KLG-BEL-STD', 25000, 12000, 100, 30);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_aksesoris, 'Harness Anjing Breathable Size M', 'harness-anjing-breathable-m', 'Harness anjing bahan mesh breathable, nyaman untuk jalan-jalan.', 89000, 55000, 40, 150, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, 'M', 'HRN-BRT-M', 89000, 55000, 40, 150);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_aksesoris, 'Mainan Bola Catnip Interactive', 'mainan-bola-catnip', 'Bola mainan kucing dengan catnip di dalamnya, merangsang aktivitas bermain.', 35000, 18000, 80, 50, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, 'Standard', 'MNK-CATNIP', 35000, 18000, 80, 50);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_aksesoris, 'Tempat Makan Stainless Double Bowl', 'tempat-makan-double-bowl', 'Tempat makan dan minum stainless steel ganda, anti slip.', 65000, 38000, 50, 400, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, 'Medium', 'TM-DBL-M', 65000, 38000, 50, 400);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_aksesoris, 'Carrier Pet Lipat Portable', 'carrier-pet-lipat', 'Tas carrier lipat untuk kucing/anjing kecil, bahan oxford tahan air.', 185000, 120000, 25, 800, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, 'Standard', 'CRR-LIPAT', 185000, 120000, 25, 800);

    -- Kesehatan & Vitamin (5 products)
    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_kesehatan, 'Obat Cacing Drontal Cat (1 tablet)', 'drontal-cat-1tab', 'Obat cacing spektrum luas untuk kucing, dosis tunggal.', 35000, 22000, 90, 10, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '1 tablet', 'DRN-CAT-1', 35000, 22000, 90, 10);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_kesehatan, 'Vitamin Bulu Nutricoat 200ml', 'nutricoat-200ml', 'Suplemen minyak ikan untuk bulu sehat dan berkilau.', 125000, 85000, 35, 250, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '200ml', 'NTC-200ML', 125000, 85000, 35, 250);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_kesehatan, 'Obat Tetes Telinga Pet 30ml', 'obat-tetes-telinga-30ml', 'Pembersih dan obat infeksi telinga untuk kucing dan anjing.', 48000, 30000, 60, 50, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '30ml', 'OTT-30ML', 48000, 30000, 60, 50);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_kesehatan, 'Frontline Plus Kucing (1 pipet)', 'frontline-plus-cat-1pip', 'Anti kutu dan caplak untuk kucing, perlindungan 1 bulan.', 95000, 68000, 45, 15, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '1 pipet', 'FL-CAT-1P', 95000, 68000, 45, 15);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_kesehatan, 'Probiotik Pencernaan Hewan 60 kapsul', 'probiotik-pencernaan-60kaps', 'Suplemen probiotik untuk kesehatan pencernaan kucing dan anjing.', 155000, 105000, 30, 80, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '60 kapsul', 'PRB-60K', 155000, 105000, 30, 80);

    -- Grooming Supplies (5 products)
    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_grooming, 'Shampoo Kucing Anti Kutu 500ml', 'shampoo-kucing-anti-kutu-500ml', 'Shampoo kucing dengan formula anti kutu dan jamur, pH balanced.', 55000, 35000, 65, 550, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '500ml', 'SMP-AK-500', 55000, 35000, 65, 550);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_grooming, 'Sisir Bulu Slicker Brush Premium', 'sisir-slicker-brush', 'Sisir slicker brush untuk mengurai bulu kusut, cocok semua jenis bulu.', 45000, 25000, 50, 120, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, 'Standard', 'SBR-SLKR', 45000, 25000, 50, 120);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_grooming, 'Gunting Kuku Pet Clipper Safety', 'gunting-kuku-pet-clipper', 'Gunting kuku hewan dengan safety guard, mencegah potong berlebih.', 35000, 20000, 55, 80, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, 'Standard', 'GK-CLIP-SF', 35000, 20000, 55, 80);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_grooming, 'Handuk Microfiber Pet 60x120cm', 'handuk-microfiber-pet', 'Handuk microfiber cepat kering khusus hewan, lembut dan absorbent.', 42000, 25000, 45, 200, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '60x120cm', 'HM-PET-60', 42000, 25000, 45, 200);

    INSERT INTO products (category_id, name, slug, description, price, cost_price, stock, weight_grams, type) VALUES
    (cat_grooming, 'Parfum Anjing Cologne Fresh 100ml', 'parfum-anjing-cologne-100ml', 'Cologne segar untuk anjing setelah mandi, tahan lama 24 jam.', 65000, 40000, 40, 130, 'normal') RETURNING id INTO prod_id;
    INSERT INTO product_variants (product_id, name, sku, price, cost_price, stock, weight_grams) VALUES (prod_id, '100ml', 'PRF-FRESH-100', 65000, 40000, 40, 130);

END $$;
