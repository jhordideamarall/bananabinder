-- Bananasbindery Platform — Consolidated Master Schema (V3)
-- All 26 Tables + Advanced Security + Automations + Performance Indexes

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'customer', 'staff', 'owner');
CREATE TYPE product_type AS ENUM ('normal', 'frozen', 'parcel');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'expired', 'return_requested', 'returned', 'refunded');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded', 'partial_refund', 'dp_paid');
CREATE TYPE pet_type AS ENUM ('dog', 'cat', 'bird', 'hamster', 'rabbit', 'fish', 'other');
CREATE TYPE voucher_type AS ENUM ('percentage', 'fixed');
CREATE TYPE service_type AS ENUM ('grooming', 'hotel');

-- 3. CORE TABLES

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    role user_role NOT NULL DEFAULT 'customer',
    avatar_url TEXT,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    label TEXT DEFAULT 'Rumah',
    recipient_name TEXT,
    phone TEXT,
    full_address TEXT NOT NULL,
    city TEXT DEFAULT 'Jakarta',
    district TEXT,
    postal_code TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type pet_type NOT NULL,
    breed TEXT,
    weight_kg NUMERIC,
    birth_date DATE,
    notes TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    promo_price NUMERIC,
    cost_price NUMERIC NOT NULL DEFAULT 0,
    stock INT DEFAULT 0,
    weight_grams INT DEFAULT 0,
    type product_type DEFAULT 'normal',
    meta_title TEXT,
    meta_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    avg_rating NUMERIC DEFAULT 0,
    review_count INT DEFAULT 0,
    sold_count INT DEFAULT 0,
    search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('indonesian', coalesce(name, '') || ' ' || coalesce(description, ''))) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    price NUMERIC NOT NULL,
    promo_price NUMERIC,
    cost_price NUMERIC NOT NULL,
    stock INT DEFAULT 0,
    weight_grams INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE UNIQUE NOT NULL,
    stock_quantity INTEGER DEFAULT 0 NOT NULL,
    low_stock_threshold INTEGER DEFAULT 5 NOT NULL,
    last_restocked_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    type TEXT NOT NULL CHECK (type IN ('in','out','adjustment','return')),
    quantity INT NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    type voucher_type NOT NULL,
    value NUMERIC NOT NULL,
    min_order NUMERIC DEFAULT 0,
    max_discount NUMERIC,
    usage_limit INT,
    used_count INT DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    address_id UUID REFERENCES addresses(id),
    status order_status DEFAULT 'pending' NOT NULL,
    payment_status payment_status DEFAULT 'unpaid' NOT NULL,
    payment_method TEXT,
    payment_id TEXT,
    shipping_method TEXT,
    shipping_tracking TEXT,
    shipping_courier TEXT,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    voucher_id UUID REFERENCES vouchers(id),
    shipping_cost NUMERIC DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    hpp_total NUMERIC DEFAULT 0,
    profit NUMERIC DEFAULT 0,
    notes TEXT,
    paid_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE voucher_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(voucher_id, user_id, order_id)
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    product_name TEXT NOT NULL,
    variant_name TEXT,
    quantity INT NOT NULL,
    price NUMERIC NOT NULL,
    cost_price NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    subtotal NUMERIC NOT NULL
);

CREATE TABLE order_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    photo_urls TEXT[],
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'refunded')),
    refund_amount NUMERIC,
    refund_method TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type service_type NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    duration_minutes INT,
    requires_dp BOOLEAN DEFAULT FALSE,
    dp_percentage NUMERIC DEFAULT 50,
    avg_rating NUMERIC DEFAULT 0,
    review_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE booking_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    time_slot TIME,
    type service_type NOT NULL,
    capacity INT NOT NULL DEFAULT 1,
    booked INT DEFAULT 0,
    UNIQUE(date, time_slot, type)
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) NOT NULL,
    pet_id UUID REFERENCES pets(id) NOT NULL,
    service_id UUID REFERENCES services(id) NOT NULL,
    slot_id UUID REFERENCES booking_slots(id),
    date_start DATE NOT NULL,
    date_end DATE,
    time_slot TIME,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    dp_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    payment_status payment_status DEFAULT 'unpaid' NOT NULL,
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loyalty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_points INT DEFAULT 0,
    lifetime_points INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE loyalty_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    points_change INT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'adjustment')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    photo_urls TEXT[],
    admin_reply TEXT,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (product_id IS NOT NULL OR service_id IS NOT NULL)
);

CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    type TEXT CHECK (type IN ('order', 'booking', 'promo', 'loyalty', 'system')),
    reference_id UUID,
    reference_type TEXT,
    channel TEXT DEFAULT 'in_app' CHECK (channel IN ('in_app', 'whatsapp', 'push')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_settings (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    whatsapp_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('hero', 'promo', 'category')),
    image_url TEXT NOT NULL,
    link TEXT,
    priority INT DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE store_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    full_address TEXT NOT NULL,
    city TEXT DEFAULT 'Jakarta',
    district TEXT,
    phone TEXT,
    whatsapp TEXT,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    operating_hours JSONB,
    services_available TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    payment_method TEXT,
    external_id TEXT,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL,
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDEXES
CREATE INDEX idx_products_search ON products USING gin(search_vector);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_date ON bookings(date_start);
CREATE INDEX idx_booking_slots_date ON booking_slots(date, type);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_loyalty_history_user ON loyalty_history(user_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_pets_user ON pets(owner_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_wishlists_user ON wishlists(user_id);

-- 5. AUTOMATIONS

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.columns WHERE column_name = 'updated_at' AND table_schema = 'public' LOOP
        EXECUTE format('CREATE TRIGGER set_updated_at_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION handle_updated_at()', t, t);
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url',
        CASE
            WHEN NEW.raw_app_meta_data->>'role' IN ('admin', 'owner', 'staff')
            THEN (NEW.raw_app_meta_data->>'role')::user_role
            ELSE 'customer'::user_role
        END
    );
    INSERT INTO public.carts (user_id) VALUES (NEW.id);
    INSERT INTO public.loyalty (user_id) VALUES (NEW.id);
    INSERT INTO public.notification_settings (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_avg_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_product_id UUID;
    target_service_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN target_product_id := OLD.product_id; target_service_id := OLD.service_id;
    ELSE target_product_id := NEW.product_id; target_service_id := NEW.service_id; END IF;
    IF (target_product_id IS NOT NULL) THEN
        UPDATE public.products SET avg_rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE product_id = target_product_id AND is_visible = TRUE), 0),
        review_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = target_product_id AND is_visible = TRUE) WHERE id = target_product_id;
    END IF;
    IF (target_service_id IS NOT NULL) THEN
        UPDATE public.services SET avg_rating = COALESCE((SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews WHERE service_id = target_service_id AND is_visible = TRUE), 0),
        review_count = (SELECT COUNT(*) FROM public.reviews WHERE service_id = target_service_id AND is_visible = TRUE) WHERE id = target_service_id;
    END IF;
    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_change AFTER INSERT OR UPDATE OR DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_avg_rating();

-- 6. SECURITY (RLS)

CREATE OR REPLACE FUNCTION is_owner() RETURNS BOOLEAN AS $$
  BEGIN RETURN (SELECT role = 'owner' FROM profiles WHERE id = auth.uid()); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  BEGIN RETURN (SELECT role = 'admin' FROM profiles WHERE id = auth.uid()); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff_or_above() RETURNS BOOLEAN AS $$
  BEGIN RETURN (SELECT role IN ('staff', 'admin', 'owner') FROM profiles WHERE id = auth.uid()); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_owner() RETURNS BOOLEAN AS $$
  BEGIN RETURN (SELECT role IN ('admin', 'owner') FROM profiles WHERE id = auth.uid()); END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('CREATE POLICY "owner_all_%I" ON %I FOR ALL USING (is_owner())', t, t);
    END LOOP;
END $$;

DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN VALUES 
        ('products'), ('product_variants'), ('product_images'), ('categories'), ('services'), ('booking_slots'), ('banners'), ('vouchers'), 
        ('stock_movements'), ('loyalty'), ('loyalty_history'), ('notifications'), ('transactions'), ('voucher_usages'), ('order_returns')
    LOOP
        EXECUTE format('CREATE POLICY "admin_all_%I" ON %I FOR ALL USING (is_admin())', t, t);
    END LOOP;
END $$;

CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "variants_public_read" ON product_variants FOR SELECT USING (is_active = TRUE);
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (is_active = TRUE);
CREATE POLICY "product_images_public_read" ON product_images FOR SELECT USING (TRUE);
CREATE POLICY "services_public_read" ON services FOR SELECT USING (is_active = TRUE);
CREATE POLICY "booking_slots_public_read" ON booking_slots FOR SELECT USING (TRUE);
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (is_visible = TRUE);
CREATE POLICY "banners_public_read" ON banners FOR SELECT USING (is_active = TRUE AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));
CREATE POLICY "store_locations_public_read" ON store_locations FOR SELECT USING (is_active = TRUE);
CREATE POLICY "vouchers_public_read" ON vouchers FOR SELECT USING (is_active = TRUE AND valid_from <= NOW() AND valid_until >= NOW());

CREATE POLICY "profiles_own_read" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "addresses_own" ON addresses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "pets_own" ON pets FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "orders_own_read" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_own_insert" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "order_items_own_read" ON order_items FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "order_returns_own_read" ON order_returns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "order_returns_own_insert" ON order_returns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_own_read" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookings_own_insert" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "carts_own" ON carts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "cart_items_own" ON cart_items FOR ALL USING (EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()));
CREATE POLICY "wishlists_own" ON wishlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "loyalty_own_read" ON loyalty FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "loyalty_history_own_read" ON loyalty_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_own_read" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_own_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notification_settings_own" ON notification_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "reviews_own_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "voucher_usages_own_read" ON voucher_usages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_own_read" ON transactions FOR SELECT USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = transactions.order_id AND orders.user_id = auth.uid()));

CREATE POLICY "staff_orders_read" ON orders FOR SELECT USING (is_staff_or_above());
CREATE POLICY "staff_order_items_read" ON order_items FOR SELECT USING (is_staff_or_above());
CREATE POLICY "staff_bookings_read" ON bookings FOR SELECT USING (is_staff_or_above());
CREATE POLICY "staff_bookings_update" ON bookings FOR UPDATE USING (is_staff_or_above());

-- 7. STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES 
('products', 'products', true), ('banners', 'banners', true), ('avatars', 'avatars', true), 
('pets', 'pets', true), ('reviews', 'reviews', true), ('categories', 'categories', true), ('services', 'services', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies first (they survive DROP SCHEMA public CASCADE)
DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_upload_avatars" ON storage.objects;
DROP POLICY IF EXISTS "storage_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "storage_own_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_own_delete" ON storage.objects;

CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "storage_auth_upload_avatars" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id IN ('avatars', 'pets', 'reviews'));
CREATE POLICY "storage_admin_upload" ON storage.objects FOR INSERT WITH CHECK (is_admin_or_owner() AND bucket_id IN ('products', 'banners', 'categories', 'services'));
CREATE POLICY "storage_own_update" ON storage.objects FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "storage_own_delete" ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);

