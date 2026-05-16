-- Replace text-based province/city region targeting with lat/lng + radius (haversine).
-- Leverages existing addresses.latitude/longitude — same Leaflet picker as checkout.
-- Applied via Supabase MCP on 2026-05-17.

DROP TABLE IF EXISTS public.campaign_regions CASCADE;
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS region_scope;
DROP TYPE IF EXISTS campaign_region_scope;

CREATE TYPE campaign_region_scope AS ENUM ('all', 'radius');

ALTER TABLE public.campaigns
  ADD COLUMN region_scope campaign_region_scope NOT NULL DEFAULT 'all';

CREATE TABLE public.campaign_geo_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  center_lat NUMERIC(10, 6) NOT NULL CHECK (center_lat BETWEEN -90 AND 90),
  center_lng NUMERIC(10, 6) NOT NULL CHECK (center_lng BETWEEN -180 AND 180),
  radius_km NUMERIC(6, 2) NOT NULL CHECK (radius_km > 0 AND radius_km <= 1000),
  label TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_campaign_geo_zones_campaign ON public.campaign_geo_zones (campaign_id);

ALTER TABLE public.campaign_geo_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read campaign geo zones" ON public.campaign_geo_zones FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.campaigns c WHERE c.id = campaign_geo_zones.campaign_id
      AND (c.is_active = TRUE AND NOW() BETWEEN c.starts_at AND c.ends_at OR is_admin_or_staff())
  ));
CREATE POLICY "Staff write campaign geo zones" ON public.campaign_geo_zones FOR ALL TO authenticated
  USING (is_admin_or_staff()) WITH CHECK (is_admin_or_staff());

GRANT SELECT ON public.campaign_geo_zones TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.campaign_geo_zones TO authenticated;

CREATE OR REPLACE FUNCTION public.haversine_km(
  lat1 NUMERIC, lng1 NUMERIC, lat2 NUMERIC, lng2 NUMERIC
) RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE AS $$
DECLARE
  r CONSTANT NUMERIC := 6371;
  dlat NUMERIC; dlng NUMERIC; a NUMERIC;
BEGIN
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN RETURN NULL; END IF;
  dlat := RADIANS(lat2 - lat1);
  dlng := RADIANS(lng2 - lng1);
  a := SIN(dlat/2)^2 + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlng/2)^2;
  RETURN r * 2 * ASIN(SQRT(a));
END;
$$;

-- create_order_v1 updated separately in 20260517013811_create_order_v1_with_campaigns.sql
-- (re-applied via MCP to use haversine_km for free shipping region match)
