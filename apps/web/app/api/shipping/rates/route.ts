import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Json } from '@bananasbindery/types/supabase';
import {
  calculateTotalShippingWeight,
  normalizeShippingQuantity,
  normalizeShippingWeight,
  sortShippingOptionsByPrice,
} from '@bananasbindery/core';
import { createClient } from '@/lib/supabase/server';
import { biteshipAuthHeader, getIntegrationSecret } from '@/lib/integration-secrets';

const BITESHIP_COURIERS = 'gojek,grab,jne,lion,sicepat,jnt,idexpress,anteraja,sap,lalamove';

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

/**
 * Fungsi untuk mencari Area ID Biteship secara otomatis berdasarkan
 * nama Kecamatan, Kota, dan Kode Pos.
 */
async function resolveAreaId(
  district: string | null | undefined,
  city: string | null | undefined,
  postalCode: string | null | undefined,
) {
  const apiKey = await getIntegrationSecret('biteship', 'api_key', 'BITESHIP_API_KEY');
  if (!apiKey) return null;

  const searchQuery = postalCode || [district, city].filter(Boolean).join(', ');
  if (!searchQuery) return null;

  try {
    const response = await fetch(
      `https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(searchQuery)}`,
      {
        headers: { Authorization: biteshipAuthHeader(apiKey) },
      },
    );

    const data = (await response.json()) as BiteshipAreaResponse;
    if (data.areas && data.areas.length > 0) {
      return data.areas[0].id;
    }
  } catch (err) {
    console.error('Error resolving area ID:', err);
  }
  return null;
}

/**
 * Cart item shape yang dikirim dari client (lihat `CartItem` di store).
 * Field bersifat top-level — TIDAK ada nested `product`.
 */
interface ShippingCartItem {
  id: string | number;
  variantId?: string | null;
  name: string;
  price: number;
  quantity: number;
  weight?: number; // gram
  description?: string;
}

interface CanonicalShippingItem extends ShippingCartItem {
  weight: number;
}

interface ShippingOption {
  id: string;
  courier_code: string;
  courier_name: string;
  service_code: string;
  service_name: string;
  name: string;
  price: number;
  etd: string;
  description: string;
}

interface BiteshipAreaResponse {
  areas?: Array<{ id: string }>;
}

interface BiteshipRatesResponse {
  success?: boolean;
  message?: string;
  code?: string;
  errors?: unknown;
  pricing?: Array<{
    courier_code: string;
    courier_service_code: string;
    courier_name: string;
    courier_service_name: string;
    price: number;
    duration: string;
  }>;
}

function isShippingCartItem(value: unknown): value is ShippingCartItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;

  return (
    (typeof item.id === 'string' || typeof item.id === 'number') &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    typeof item.quantity === 'number' &&
    (item.variantId === undefined ||
      item.variantId === null ||
      typeof item.variantId === 'string') &&
    (item.weight === undefined || typeof item.weight === 'number') &&
    (item.description === undefined || typeof item.description === 'string')
  );
}

function isShippingOption(value: unknown): value is ShippingOption {
  if (typeof value !== 'object' || value === null) return false;
  const option = value as Record<string, unknown>;

  return (
    typeof option.id === 'string' &&
    typeof option.courier_code === 'string' &&
    typeof option.courier_name === 'string' &&
    typeof option.service_code === 'string' &&
    typeof option.service_name === 'string' &&
    typeof option.name === 'string' &&
    typeof option.price === 'number' &&
    typeof option.etd === 'string' &&
    typeof option.description === 'string'
  );
}

function readCachedShippingOptions(value: unknown): ShippingOption[] | null {
  if (!Array.isArray(value) || !value.every(isShippingOption)) return null;
  return sortShippingOptionsByPrice(value);
}

export async function POST(req: NextRequest) {
  try {
    const requestBody = (await req.json()) as { addressId?: unknown; items?: unknown };
    const addressId = typeof requestBody.addressId === 'string' ? requestBody.addressId : null;
    const rawItems = Array.isArray(requestBody.items) ? requestBody.items : [];
    const items = rawItems.filter(isShippingCartItem);

    if (!addressId || items.length === 0 || items.length !== rawItems.length) {
      return NextResponse.json({ error: 'Data alamat atau produk tidak valid' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Ambil Detail Alamat
    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', addressId)
      .single();

    if (addressError || !address) {
      return NextResponse.json({ error: 'Alamat tidak ditemukan' }, { status: 404 });
    }

    // 2. Ambil berat terbaru dari katalog server. Berat browser hanya menjadi
    // fallback defensif agar keranjang lama tidak membuat tarif meleset.
    const productIds = Array.from(new Set(items.map((item) => String(item.id))));
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, weight_grams, product_variants(id, product_id, weight_grams)')
      .in('id', productIds);

    if (productsError) {
      console.error('SHIPPING_PRODUCT_WEIGHT_ERROR:', productsError.message);
      return NextResponse.json({ error: 'Berat produk belum dapat diperiksa' }, { status: 500 });
    }

    const productById = new Map((products ?? []).map((product) => [product.id, product]));
    const canonicalItems: CanonicalShippingItem[] = [];

    for (const item of items) {
      const product = productById.get(String(item.id));
      if (!product) {
        return NextResponse.json(
          { error: `Produk "${item.name}" sudah tidak tersedia` },
          { status: 400 },
        );
      }

      const variant = item.variantId
        ? product.product_variants.find(
            (candidate) => candidate.id === item.variantId && candidate.product_id === product.id,
          )
        : null;

      if (item.variantId && !variant) {
        return NextResponse.json(
          { error: `Varian produk "${item.name}" sudah tidak tersedia` },
          { status: 400 },
        );
      }

      canonicalItems.push({
        ...item,
        price: Math.max(0, Math.round(item.price)),
        quantity: normalizeShippingQuantity(item.quantity),
        weight: normalizeShippingWeight(
          variant?.weight_grams ?? product.weight_grams ?? item.weight,
        ),
      });
    }

    const totalWeight = calculateTotalShippingWeight(canonicalItems);

    // 3. Ambil Pengaturan Toko (Origin)
    const { data: settings } = await supabase.from('store_settings').select('*').single();

    // Origin diambil dari store_settings (sumber kebenaran, diatur via /admin/promos).
    // Fallback disamakan dengan default DB store_settings agar tidak ada origin "miss".
    const originAreaId = settings?.origin_area_id || 'IDNP6M3K2W1';
    // Fallback koordinat = Toko Bananas Bindery (Cilendek Timur, Bogor Barat 16112).
    const originLat = settings?.origin_latitude ? Number(settings.origin_latitude) : -6.570345;
    const originLng = settings?.origin_longitude ? Number(settings.origin_longitude) : 106.7767107;

    // 4. Resolve Area ID (Auto-generate jika belum ada)
    let destinationAreaId = address.biteship_area_id;

    if (!destinationAreaId) {
      destinationAreaId = await resolveAreaId(address.district, address.city, address.postal_code);

      if (destinationAreaId) {
        await supabase
          .from('addresses')
          .update({ biteship_area_id: destinationAreaId })
          .eq('id', addressId);
      } else {
        return NextResponse.json(
          {
            error: 'Lokasi tidak dikenali oleh kurir. Mohon cek kembali Kecamatan/Kota Anda.',
          },
          { status: 400 },
        );
      }
    }

    // 5. CEK CACHE (Hemat Saldo!)
    const cacheClient = getSupabaseAdmin() ?? supabase;
    const { data: cachedRate } = await cacheClient
      .from('shipping_rates_cache')
      .select('rates_data')
      .eq('origin_area_id', originAreaId)
      .eq('destination_area_id', destinationAreaId)
      .eq('total_weight', totalWeight)
      .eq('couriers_list', BITESHIP_COURIERS)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    const cachedOptions = readCachedShippingOptions(cachedRate?.rates_data);
    if (cachedOptions) {
      console.log('💰 CACHE HIT: Menggunakan harga ongkir tersimpan. Hemat Rp 5!');
      return NextResponse.json(cachedOptions);
    }

    const apiKey = await getIntegrationSecret('biteship', 'api_key', 'BITESHIP_API_KEY');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Biteship API Key belum disimpan di Admin > Integrations.' },
        { status: 500 },
      );
    }

    // 6. Request Ongkir dari Biteship (Hanya jika cache kosong)
    const biteshipPayload: {
      origin_area_id: string;
      destination_area_id: string;
      couriers: string;
      items: Array<{
        name: string;
        description: string;
        value: number;
        quantity: number;
        weight: number;
      }>;
      origin_latitude?: number;
      origin_longitude?: number;
      destination_latitude?: number;
      destination_longitude?: number;
    } = {
      origin_area_id: originAreaId,
      destination_area_id: destinationAreaId,
      couriers: BITESHIP_COURIERS,
      items: canonicalItems.map((item) => ({
        name: item.name || 'Produk binder Bananasbindery',
        description: item.description || item.name || 'Produk binder Bananasbindery',
        value: item.price || 0,
        quantity: item.quantity || 1,
        weight: item.weight,
      })),
    };

    if (originLat && originLat !== 0) biteshipPayload.origin_latitude = originLat;
    if (originLng && originLng !== 0) biteshipPayload.origin_longitude = originLng;
    if (address.latitude && Number(address.latitude) !== 0)
      biteshipPayload.destination_latitude = Number(address.latitude);
    if (address.longitude && Number(address.longitude) !== 0)
      biteshipPayload.destination_longitude = Number(address.longitude);

    const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
      method: 'POST',
      headers: {
        Authorization: biteshipAuthHeader(apiKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(biteshipPayload),
    });

    const data = (await response.json()) as BiteshipRatesResponse;

    if (!response.ok) {
      console.error('BITESHIP_API_ERROR_DETAIL:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        {
          error: data.message || 'Biteship API error',
          code: data.code,
          details: data.errors || data,
        },
        { status: response.status },
      );
    }

    // Format output untuk UI
    const results = sortShippingOptionsByPrice(
      (data.pricing ?? []).map(
        (pricing): ShippingOption => ({
          id: `${pricing.courier_code}_${pricing.courier_service_code}`,
          courier_code: pricing.courier_code,
          courier_name: pricing.courier_name,
          service_code: pricing.courier_service_code,
          service_name: pricing.courier_service_name,
          name: `${pricing.courier_name} - ${pricing.courier_service_name}`,
          price: pricing.price,
          etd: pricing.duration,
          description: pricing.courier_service_name,
        }),
      ),
    );

    // 7. Simpan Hasil ke Cache (upsert — refresh row lama yang sudah expired
    //    tanpa kena duplicate key pada unique constraint).
    if (data.success) {
      const { error: cacheError } = await cacheClient.from('shipping_rates_cache').upsert(
        {
          origin_area_id: originAreaId,
          destination_area_id: destinationAreaId,
          total_weight: totalWeight,
          couriers_list: BITESHIP_COURIERS,
          rates_data: results as unknown as Json,
          expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'origin_area_id,destination_area_id,total_weight,couriers_list' },
      );
      if (cacheError) {
        console.warn('SHIPPING_RATES_CACHE_WRITE_WARN:', cacheError.message);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    const err = error as Error;
    console.error('SHIPPING_RATES_INTERNAL_ERROR:', err);
    return NextResponse.json(
      { error: 'Internal Server Error', message: err.message },
      { status: 500 },
    );
  }
}
