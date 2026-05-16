import type { Enums, Tables } from '@bananasbindery/types/supabase';

export type CampaignType = Enums<'campaign_type'>;
export type DiscountUnit = Enums<'campaign_discount_unit'>;
export type TargetScope = Enums<'campaign_target_scope'>;
export type RegionScope = Enums<'campaign_region_scope'>; // 'all' | 'radius'
export type CampaignStatus = 'active' | 'scheduled' | 'expired' | 'paused';

export type CampaignRow = Tables<'campaigns'>;
export type CampaignProductRow = Tables<'campaign_products'>;
export type CampaignCategoryRow = Tables<'campaign_categories'>;
export type CampaignGeoZoneRow = Tables<'campaign_geo_zones'>;

export interface GeoZone {
  id?: string; // existing zones have ID, new ones don't
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  label: string;
}

export interface CampaignWithTargets {
  campaign: CampaignRow;
  productIds: string[];
  categoryIds: string[];
  geoZones: GeoZone[];
}

export interface ProductOption {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  categoryId: string | null;
}

export interface CategoryOption {
  id: string;
  name: string;
  productCount: number;
}

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  flash_sale: 'Flash Sale',
  product_discount: 'Diskon Produk',
  free_shipping: 'Gratis Ongkir',
};

export const CAMPAIGN_TYPE_DESCRIPTIONS: Record<CampaignType, string> = {
  flash_sale: 'Harga coret + countdown timer untuk periode terbatas.',
  product_discount: 'Diskon persen atau nominal untuk produk/kategori tertentu.',
  free_shipping: 'Potongan ongkir berdasarkan zona radius di peta (mis. Jabodetabek).',
};

export function getCampaignStatus(
  campaign: Pick<CampaignRow, 'is_active' | 'starts_at' | 'ends_at'>,
  now: Date = new Date(),
): CampaignStatus {
  if (!campaign.is_active) return 'paused';
  const start = new Date(campaign.starts_at);
  const end = new Date(campaign.ends_at);
  if (now < start) return 'scheduled';
  if (now > end) return 'expired';
  return 'active';
}
