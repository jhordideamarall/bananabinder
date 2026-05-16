import type { CampaignInput, GeoZone } from '@bananasbindery/core';
import type { TypedSupabaseClient } from './types';

export async function getActiveCampaigns(supabase: TypedSupabaseClient): Promise<CampaignInput[]> {
  const nowIso = new Date().toISOString();
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('is_active', true)
    .lte('starts_at', nowIso)
    .gte('ends_at', nowIso)
    .order('priority', { ascending: true });

  if (error || !campaigns || campaigns.length === 0) return [];

  const ids = campaigns.map((c) => c.id);

  const [productsRes, categoriesRes, zonesRes] = await Promise.all([
    supabase.from('campaign_products').select('campaign_id, product_id').in('campaign_id', ids),
    supabase.from('campaign_categories').select('campaign_id, category_id').in('campaign_id', ids),
    supabase
      .from('campaign_geo_zones')
      .select('campaign_id, center_lat, center_lng, radius_km')
      .in('campaign_id', ids),
  ]);

  const productsByCampaign = new Map<string, Set<string>>();
  for (const row of productsRes.data ?? []) {
    const set = productsByCampaign.get(row.campaign_id) ?? new Set<string>();
    set.add(row.product_id);
    productsByCampaign.set(row.campaign_id, set);
  }

  const categoriesByCampaign = new Map<string, Set<string>>();
  for (const row of categoriesRes.data ?? []) {
    const set = categoriesByCampaign.get(row.campaign_id) ?? new Set<string>();
    set.add(row.category_id);
    categoriesByCampaign.set(row.campaign_id, set);
  }

  const zonesByCampaign = new Map<string, GeoZone[]>();
  for (const row of zonesRes.data ?? []) {
    const arr = zonesByCampaign.get(row.campaign_id) ?? [];
    arr.push({
      centerLat: Number(row.center_lat),
      centerLng: Number(row.center_lng),
      radiusKm: Number(row.radius_km),
    });
    zonesByCampaign.set(row.campaign_id, arr);
  }

  return campaigns.map<CampaignInput>((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    discountUnit: c.discount_unit,
    discountValue: Number(c.discount_value),
    maxDiscount: c.max_discount !== null ? Number(c.max_discount) : null,
    minOrder: Number(c.min_order ?? 0),
    targetScope: c.target_scope,
    regionScope: c.region_scope,
    priority: c.priority,
    stackable: c.stackable,
    usageLimit: c.usage_limit,
    usageCount: c.usage_count,
    startsAt: new Date(c.starts_at),
    endsAt: new Date(c.ends_at),
    isActive: c.is_active,
    productIds: productsByCampaign.get(c.id) ?? new Set<string>(),
    categoryIds: categoriesByCampaign.get(c.id) ?? new Set<string>(),
    geoZones: zonesByCampaign.get(c.id) ?? [],
  }));
}
