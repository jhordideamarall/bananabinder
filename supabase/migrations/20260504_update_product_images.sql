-- Update product images for client preview
-- Temporarily disable RLS to allow updates

ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;

-- Update Obat Cacing Drontal Cat (both variants)
UPDATE product_images
SET url = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80'
WHERE product_id IN (
  '9c374467-0a7a-49fe-ae74-f0cabd0fd0d5',
  '3d96aba5-0816-4d6c-b220-85d67b243a7d'
);

-- Update Sisir Furminator Long Hair
UPDATE product_images
SET url = 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80'
WHERE product_id = '4c3987ff-be5a-41ac-9fb8-7ecf177236b9';

-- Update Minyak Ikan Omega 3 and Vitamin Bulu Nutricoat
UPDATE product_images
SET url = 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80'
WHERE product_id IN (
  '26381674-ef4a-4624-95a7-fb5b5e0a43ef',
  '51d3522b-aebd-4089-84d9-fe317b019dee'
);

-- Update Me-O Creamy Treats Salmon
UPDATE product_images
SET url = 'https://images.unsplash.com/photo-1548546738-8509cb246ed3?w=800&q=80'
WHERE product_id = '35be7b55-d93e-4581-8974-74fa4a661afa';

-- Update Obat Tetes Telinga Pet
UPDATE product_images
SET url = 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80'
WHERE product_id = '59c70c03-df31-4735-a8e0-370cff7e00ce';

-- Insert Me-O Kitten Ocean Fish image
INSERT INTO product_images (product_id, url, alt_text, sort_order)
VALUES ('6ff16ae5-2506-4111-bc32-fef18dbe06c0', 'https://images.unsplash.com/photo-1548546738-8509cb246ed3?w=800&q=80', 'Me-O Kitten Ocean Fish 1.1kg', 1)
ON CONFLICT DO NOTHING;

-- Re-enable RLS protection
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
