-- Campaign system v1: flash sale, product discount, free shipping
-- Auto-apply (no code input by user, unlike vouchers)
-- Applied via Supabase MCP on 2026-05-17

CREATE TYPE campaign_type AS ENUM ('flash_sale', 'product_discount', 'free_shipping');
CREATE TYPE campaign_discount_unit AS ENUM ('percentage', 'fixed');
CREATE TYPE campaign_target_scope AS ENUM ('all', 'products', 'categories');
CREATE TYPE campaign_region_scope AS ENUM ('all', 'provinces', 'cities');

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  type campaign_type NOT NULL,
  discount_unit campaign_discount_unit NOT NULL,
  discount_value NUMERIC NOT NULL CHECK (discount_value >= 0),
  max_discount NUMERIC CHECK (max_discount IS NULL OR max_discount >= 0),
  min_order NUMERIC NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  target_scope campaign_target_scope NOT NULL DEFAULT 'all',
  region_scope campaign_region_scope NOT NULL DEFAULT 'all',
  priority INTEGER NOT NULL DEFAULT 10,
  stackable BOOLEAN NOT NULL DEFAULT FALSE,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT campaigns_valid_period CHECK (ends_at > starts_at),
  CONSTRAINT campaigns_percentage_max CHECK (
    discount_unit <> 'percentage' OR discount_value <= 100
  )
);
CREATE INDEX idx_campaigns_active_period ON campaigns (is_active, starts_at, ends_at);
CREATE INDEX idx_campaigns_type ON campaigns (type);
CREATE INDEX idx_campaigns_priority ON campaigns (priority);

CREATE TABLE campaign_products (
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, product_id)
);
CREATE INDEX idx_campaign_products_product ON campaign_products (product_id);

CREATE TABLE campaign_categories (
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, category_id)
);
CREATE INDEX idx_campaign_categories_category ON campaign_categories (category_id);

CREATE TABLE campaign_regions (
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  region_type TEXT NOT NULL CHECK (region_type IN ('province','city')),
  region_code TEXT NOT NULL,
  region_label TEXT NOT NULL,
  PRIMARY KEY (campaign_id, region_type, region_code)
);
CREATE INDEX idx_campaign_regions_lookup ON campaign_regions (region_type, region_code);

CREATE TABLE campaign_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  discount_amount NUMERIC NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, order_id)
);
CREATE INDEX idx_campaign_usages_campaign ON campaign_usages (campaign_id);
CREATE INDEX idx_campaign_usages_order ON campaign_usages (order_id);

CREATE OR REPLACE FUNCTION set_campaign_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_campaign_updated_at();

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_usages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin_or_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
      AND role IN ('admin','owner','staff')
  );
$$;

CREATE POLICY "Public read active campaigns" ON campaigns FOR SELECT TO anon, authenticated
  USING (is_active = TRUE AND NOW() BETWEEN starts_at AND ends_at);
CREATE POLICY "Staff full read campaigns" ON campaigns FOR SELECT TO authenticated
  USING (is_admin_or_staff());
CREATE POLICY "Staff write campaigns" ON campaigns FOR ALL TO authenticated
  USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

CREATE POLICY "Read campaign products" ON campaign_products FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_products.campaign_id
    AND (c.is_active = TRUE AND NOW() BETWEEN c.starts_at AND c.ends_at OR is_admin_or_staff())));
CREATE POLICY "Staff write campaign products" ON campaign_products FOR ALL TO authenticated
  USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

CREATE POLICY "Read campaign categories" ON campaign_categories FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_categories.campaign_id
    AND (c.is_active = TRUE AND NOW() BETWEEN c.starts_at AND c.ends_at OR is_admin_or_staff())));
CREATE POLICY "Staff write campaign categories" ON campaign_categories FOR ALL TO authenticated
  USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

CREATE POLICY "Read campaign regions" ON campaign_regions FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM campaigns c WHERE c.id = campaign_regions.campaign_id
    AND (c.is_active = TRUE AND NOW() BETWEEN c.starts_at AND c.ends_at OR is_admin_or_staff())));
CREATE POLICY "Staff write campaign regions" ON campaign_regions FOR ALL TO authenticated
  USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

CREATE POLICY "Staff read campaign usages" ON campaign_usages FOR SELECT TO authenticated
  USING (is_admin_or_staff());

GRANT SELECT ON campaigns, campaign_products, campaign_categories, campaign_regions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON campaigns, campaign_products, campaign_categories, campaign_regions TO authenticated;
GRANT SELECT ON campaign_usages TO authenticated;
