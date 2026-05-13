-- Migration to add missing shipping cache, store settings, and fix ghost columns
-- Created to fix schema drift and security vulnerabilities identified in live audit.

-- 1. FIX GHOST COLUMNS IN EXISTING TABLES
ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS biteship_area_id TEXT;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS total_weight_grams INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. SHIPPING RATES CACHE
CREATE TABLE IF NOT EXISTS public.shipping_rates_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_area_id TEXT NOT NULL,
    destination_area_id TEXT NOT NULL,
    total_weight INTEGER NOT NULL,
    couriers_list TEXT NOT NULL,
    rates_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Index for fast lookup
    UNIQUE(origin_area_id, destination_area_id, total_weight, couriers_list)
);

-- 3. STORE SETTINGS
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT NOT NULL DEFAULT 'Bananasbindery',
    origin_area_id TEXT NOT NULL DEFAULT 'IDNP6M3K2W1',
    origin_address TEXT,
    origin_latitude NUMERIC,
    origin_longitude NUMERIC,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SECURITY (ENABLE RLS)
ALTER TABLE public.shipping_rates_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Policies for Shipping Cache
DROP POLICY IF EXISTS "Admin manage shipping_rates_cache" ON public.shipping_rates_cache;
CREATE POLICY "Admin manage shipping_rates_cache" ON public.shipping_rates_cache FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

DROP POLICY IF EXISTS "Public read shipping_rates_cache" ON public.shipping_rates_cache;
CREATE POLICY "Public read shipping_rates_cache" ON public.shipping_rates_cache FOR SELECT USING (TRUE);

-- Policies for Store Settings
DROP POLICY IF EXISTS "Admin manage store_settings" ON public.store_settings;
CREATE POLICY "Admin manage store_settings" ON public.store_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);

DROP POLICY IF EXISTS "Public read store_settings" ON public.store_settings;
CREATE POLICY "Public read store_settings" ON public.store_settings FOR SELECT USING (TRUE);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_shipping_cache_lookup ON public.shipping_rates_cache (origin_area_id, destination_area_id, total_weight);
CREATE INDEX IF NOT EXISTS idx_shipping_cache_expiry ON public.shipping_rates_cache (expires_at);

-- 6. AUTOMATION
DROP TRIGGER IF EXISTS set_updated_at_store_settings ON public.store_settings;
CREATE TRIGGER set_updated_at_store_settings BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
