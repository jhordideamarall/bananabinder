import type { Metadata } from 'next';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';

export const metadata: Metadata = {
  title: 'Kampanye Pemasaran',
};
import { createClient } from '@/lib/supabase/server';
import { CampaignManager } from '@/components/admin/campaigns/CampaignManager';
import type {
  CampaignCategoryRow,
  CampaignGeoZoneRow,
  CampaignProductRow,
  CampaignRow,
  CampaignWithTargets,
  CategoryOption,
  GeoZone,
  ProductOption,
} from '@/components/admin/campaigns/types';

export const dynamic = 'force-dynamic';

export default async function AdminCampaignsPage() {
  const supabase = (await createClient()) as TypedSupabaseClient;

  const [campaignsResult, productsResult, categoriesResult] = await Promise.all([
    supabase.from('campaigns').select('*').order('priority', { ascending: true }).limit(200),
    supabase
      .from('products')
      .select('id, name, price, category_id, product_images(url, sort_order)')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(500),
    supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
  ]);

  const campaigns: CampaignRow[] = campaignsResult.data ?? [];
  const campaignIds = campaigns.map((c) => c.id);

  const [productTargetsResult, categoryTargetsResult, zonesResult, countResult] =
    campaignIds.length > 0
      ? await Promise.all([
          supabase.from('campaign_products').select('*').in('campaign_id', campaignIds),
          supabase.from('campaign_categories').select('*').in('campaign_id', campaignIds),
          supabase.from('campaign_geo_zones').select('*').in('campaign_id', campaignIds),
          supabase.from('products').select('category_id').eq('is_active', true),
        ])
      : await Promise.all([
          Promise.resolve({ data: [] as CampaignProductRow[] }),
          Promise.resolve({ data: [] as CampaignCategoryRow[] }),
          Promise.resolve({ data: [] as CampaignGeoZoneRow[] }),
          supabase.from('products').select('category_id').eq('is_active', true),
        ]);

  const productsByCampaign = new Map<string, string[]>();
  for (const p of productTargetsResult.data ?? []) {
    const arr = productsByCampaign.get(p.campaign_id) ?? [];
    arr.push(p.product_id);
    productsByCampaign.set(p.campaign_id, arr);
  }

  const categoriesByCampaign = new Map<string, string[]>();
  for (const c of categoryTargetsResult.data ?? []) {
    const arr = categoriesByCampaign.get(c.campaign_id) ?? [];
    arr.push(c.category_id);
    categoriesByCampaign.set(c.campaign_id, arr);
  }

  const zonesByCampaign = new Map<string, GeoZone[]>();
  for (const z of zonesResult.data ?? []) {
    const arr = zonesByCampaign.get(z.campaign_id) ?? [];
    arr.push({
      id: z.id,
      centerLat: Number(z.center_lat),
      centerLng: Number(z.center_lng),
      radiusKm: Number(z.radius_km),
      label: z.label,
    });
    zonesByCampaign.set(z.campaign_id, arr);
  }

  const enriched: CampaignWithTargets[] = campaigns.map((c) => ({
    campaign: c,
    productIds: productsByCampaign.get(c.id) ?? [],
    categoryIds: categoriesByCampaign.get(c.id) ?? [],
    geoZones: zonesByCampaign.get(c.id) ?? [],
  }));

  type RawProduct = {
    id: string;
    name: string;
    price: number;
    category_id: string | null;
    product_images: { url: string; sort_order: number | null }[] | null;
  };
  const rawProducts = (productsResult.data ?? []) as unknown as RawProduct[];
  const products: ProductOption[] = rawProducts.map((p) => {
    const images = [...(p.product_images ?? [])].sort(
      (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999),
    );
    return {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      categoryId: p.category_id,
      imageUrl: images[0]?.url ?? null,
    };
  });

  const categoryCounts = new Map<string, number>();
  for (const row of countResult.data ?? []) {
    if (row.category_id) {
      categoryCounts.set(row.category_id, (categoryCounts.get(row.category_id) ?? 0) + 1);
    }
  }
  const categories: CategoryOption[] = (categoriesResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    productCount: categoryCounts.get(c.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-[1240px] space-y-8">
      <header>
        <p className="text-[13px] font-medium text-[#86868B]">Marketing</p>
        <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight text-[#1D1D1F]">
          Campaigns
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] text-[#86868B]">
          Atur flash sale, diskon produk, dan gratis ongkir berbasis zona radius di peta. Campaign
          berjalan otomatis sesuai periode & target — pelanggan tidak perlu input kode.
        </p>
      </header>

      <CampaignManager initialCampaigns={enriched} products={products} categories={categories} />
    </div>
  );
}
