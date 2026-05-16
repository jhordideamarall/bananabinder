'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Enums, TablesInsert, TablesUpdate } from '@bananasbindery/types/supabase';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import { createClient } from '@/lib/supabase/server';

const ADMIN_ROLES: Enums<'user_role'>[] = ['admin', 'owner', 'staff'];

type CampaignType = Enums<'campaign_type'>;
type DiscountUnit = Enums<'campaign_discount_unit'>;
type TargetScope = Enums<'campaign_target_scope'>;
type RegionScope = Enums<'campaign_region_scope'>;
type CampaignInsert = TablesInsert<'campaigns'>;
type CampaignUpdate = TablesUpdate<'campaigns'>;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(formData: FormData, key: string, fallback = 0): number {
  const raw = text(formData, key);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(formData: FormData, key: string): number | null {
  const raw = text(formData, key);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function checkbox(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on';
}

function isoOrThrow(value: string, label: string): string {
  if (!value) throw new Error(`${label} wajib diisi.`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} tidak valid.`);
  return date.toISOString();
}

function parseType(value: string): CampaignType {
  if (value === 'flash_sale' || value === 'product_discount' || value === 'free_shipping')
    return value;
  throw new Error('Tipe campaign tidak valid.');
}

function parseDiscountUnit(value: string): DiscountUnit {
  return value === 'fixed' ? 'fixed' : 'percentage';
}

function parseTargetScope(value: string): TargetScope {
  if (value === 'products' || value === 'categories') return value;
  return 'all';
}

function parseRegionScope(value: string): RegionScope {
  return value === 'radius' ? 'radius' : 'all';
}

function uniqueStrings(values: FormDataEntryValue[]): string[] {
  const set = new Set<string>();
  for (const v of values) {
    if (typeof v === 'string' && v.trim().length > 0) set.add(v.trim());
  }
  return Array.from(set);
}

interface GeoZoneEntry {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  label: string;
}

function parseGeoZones(formData: FormData): GeoZoneEntry[] {
  const raw = formData.get('geoZonesJson');
  if (typeof raw !== 'string' || raw.length === 0) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: GeoZoneEntry[] = [];
    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) continue;
      const obj = item as Record<string, unknown>;
      const lat = obj.centerLat;
      const lng = obj.centerLng;
      const radius = obj.radiusKm;
      const label = obj.label;
      if (
        typeof lat === 'number' &&
        lat >= -90 &&
        lat <= 90 &&
        typeof lng === 'number' &&
        lng >= -180 &&
        lng <= 180 &&
        typeof radius === 'number' &&
        radius > 0 &&
        radius <= 1000
      ) {
        out.push({
          centerLat: lat,
          centerLng: lng,
          radiusKm: radius,
          label: typeof label === 'string' ? label : '',
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

async function getSupabase(): Promise<TypedSupabaseClient> {
  return (await createClient()) as TypedSupabaseClient;
}

async function requireAdmin(supabase: TypedSupabaseClient): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin-login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !ADMIN_ROLES.includes(profile.role)) redirect('/');
}

function validateBusinessRules(args: {
  unit: DiscountUnit;
  value: number;
  startsAt: string;
  endsAt: string;
}): void {
  if (args.unit === 'percentage' && args.value > 100) {
    throw new Error('Diskon persentase tidak boleh > 100%.');
  }
  if (args.value < 0) throw new Error('Nilai diskon tidak boleh negatif.');
  if (new Date(args.endsAt) <= new Date(args.startsAt)) {
    throw new Error('Tanggal berakhir harus setelah tanggal mulai.');
  }
}

export async function saveCampaign(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);

  const id = text(formData, 'id');
  const type = parseType(text(formData, 'type'));
  const discountUnit = parseDiscountUnit(text(formData, 'discountUnit'));
  const discountValue = numberValue(formData, 'discountValue');
  const startsAt = isoOrThrow(text(formData, 'startsAt'), 'Tanggal mulai');
  const endsAt = isoOrThrow(text(formData, 'endsAt'), 'Tanggal berakhir');

  validateBusinessRules({ unit: discountUnit, value: discountValue, startsAt, endsAt });

  const name = text(formData, 'name');
  if (!name) throw new Error('Nama campaign wajib diisi.');

  const productIds = uniqueStrings(formData.getAll('productIds'));
  const categoryIds = uniqueStrings(formData.getAll('categoryIds'));
  const geoZones = parseGeoZones(formData);

  const targetScope =
    type === 'free_shipping' ? 'all' : parseTargetScope(text(formData, 'targetScope'));
  const regionScope =
    type === 'free_shipping' ? parseRegionScope(text(formData, 'regionScope')) : 'all';

  if (targetScope === 'products' && productIds.length === 0) {
    throw new Error('Pilih minimal 1 produk untuk scope "Produk pilihan".');
  }
  if (targetScope === 'categories' && categoryIds.length === 0) {
    throw new Error('Pilih minimal 1 kategori untuk scope "Kategori pilihan".');
  }
  if (regionScope === 'radius' && geoZones.length === 0) {
    throw new Error('Tambah minimal 1 zona radius di peta untuk gratis ongkir terbatas wilayah.');
  }

  const payload: CampaignInsert | CampaignUpdate = {
    name,
    description: text(formData, 'description'),
    type,
    discount_unit: discountUnit,
    discount_value: discountValue,
    max_discount: nullableNumber(formData, 'maxDiscount'),
    min_order: numberValue(formData, 'minOrder'),
    target_scope: targetScope,
    region_scope: regionScope,
    priority: numberValue(formData, 'priority', 10),
    stackable: checkbox(formData, 'stackable'),
    usage_limit: nullableNumber(formData, 'usageLimit'),
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: checkbox(formData, 'isActive'),
  };

  let campaignId = id;
  if (id) {
    const { error } = await supabase
      .from('campaigns')
      .update(payload as CampaignUpdate)
      .eq('id', id);
    if (error) throw new Error(`Gagal update campaign: ${error.message}`);
  } else {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(payload as CampaignInsert)
      .select('id')
      .single();
    if (error || !data) throw new Error(`Gagal buat campaign: ${error?.message ?? 'unknown'}`);
    campaignId = data.id;
  }

  await Promise.all([
    supabase.from('campaign_products').delete().eq('campaign_id', campaignId),
    supabase.from('campaign_categories').delete().eq('campaign_id', campaignId),
    supabase.from('campaign_geo_zones').delete().eq('campaign_id', campaignId),
  ]);

  if (targetScope === 'products' && productIds.length > 0) {
    const rows = productIds.map((product_id) => ({ campaign_id: campaignId, product_id }));
    const { error } = await supabase.from('campaign_products').insert(rows);
    if (error) throw new Error(`Gagal simpan produk target: ${error.message}`);
  }

  if (targetScope === 'categories' && categoryIds.length > 0) {
    const rows = categoryIds.map((category_id) => ({ campaign_id: campaignId, category_id }));
    const { error } = await supabase.from('campaign_categories').insert(rows);
    if (error) throw new Error(`Gagal simpan kategori target: ${error.message}`);
  }

  if (regionScope === 'radius' && geoZones.length > 0) {
    const rows = geoZones.map((z) => ({
      campaign_id: campaignId,
      center_lat: z.centerLat,
      center_lng: z.centerLng,
      radius_km: z.radiusKm,
      label: z.label,
    }));
    const { error } = await supabase.from('campaign_geo_zones').insert(rows);
    if (error) throw new Error(`Gagal simpan zona radius: ${error.message}`);
  }

  revalidatePath('/admin/campaigns');
}

export async function deleteCampaign(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);
  const id = text(formData, 'id');
  if (!id) throw new Error('ID campaign wajib diisi.');
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw new Error(`Gagal hapus campaign: ${error.message}`);
  revalidatePath('/admin/campaigns');
}
