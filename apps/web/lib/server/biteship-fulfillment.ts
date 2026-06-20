import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '@bananasbindery/types/supabase';
import {
  createBiteshipOrder,
  type BiteshipOrderPayload,
  type BiteshipOrderResponse,
} from '@bananasbindery/api-client/biteship';
import { getIntegrationSecret } from '@/lib/integration-secrets';

interface ShippingMetadata {
  biteship_order_id?: string;
  courier_tracking_id?: string;
  courier_waybill_id?: string;
  courier_company?: string;
  courier_type?: string;
  courier_link?: string | null;
  biteship_status?: string;
  biteship_error?: unknown;
  last_retry_at?: string;
  debug_last_payload?: unknown;
}

interface FulfillmentOptions {
  trigger: 'xendit_webhook' | 'manual_payment_approved';
}

export interface BiteshipFulfillmentResult {
  created: boolean;
  skipped: boolean;
  mocked: boolean;
  orderId?: string;
  trackingId?: string | null;
  error?: string;
}

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function metadataFrom(value: unknown): ShippingMetadata {
  return asRecord(value) as ShippingMetadata;
}

function toJson(value: Record<string, unknown>): Json {
  return value as Json;
}

function finiteNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapServiceType(service: string): string {
  const normalized = service.toLowerCase();
  if (normalized.includes('reg')) return 'reg';
  if (normalized.includes('ins')) return 'instant';
  if (normalized.includes('same')) return 'same_day';
  if (normalized.includes('exp')) return 'next_day';
  if (normalized.includes('eco')) return 'eco';
  return 'reg';
}

async function saveBiteshipError(
  supabase: NonNullable<SupabaseAdmin>,
  orderId: string,
  currentMetadata: ShippingMetadata,
  error: unknown,
  payload?: BiteshipOrderPayload,
): Promise<void> {
  const message = error instanceof Error ? error.message : 'Gagal membuat order Biteship.';
  await supabase
    .from('orders')
    .update({
      shipping_metadata: toJson({
        ...asRecord(currentMetadata),
        biteship_error: error instanceof Error ? { message } : error,
        last_retry_at: new Date().toISOString(),
        ...(payload ? { debug_last_payload: payload } : {}),
      }),
    })
    .eq('id', orderId);
}

function buildPayload(params: {
  order: OrderForFulfillment;
  address: NonNullable<OrderForFulfillment['addresses']>;
  profile: OrderForFulfillment['profiles'];
  orderItems: OrderForFulfillment['order_items'];
  storeSettings: StoreSettingsForFulfillment | null;
}): BiteshipOrderPayload {
  const { order, address, profile, orderItems, storeSettings } = params;
  const originLat = finiteNumber(storeSettings?.origin_latitude) ?? -6.570345;
  const originLng = finiteNumber(storeSettings?.origin_longitude) ?? 106.7767107;
  const destLat = finiteNumber(address.latitude);
  const destLng = finiteNumber(address.longitude);
  const shippingMethod = order.shipping_method || '';
  const [courierName, serviceName] = shippingMethod.split(' - ');
  const finalCourierCode =
    order.shipping_courier_code || (order.shipping_courier || courierName || '').toLowerCase();
  const finalServiceCode = order.shipping_service_code || mapServiceType(serviceName || 'reg');
  const storeName = storeSettings?.store_name || 'Bananasbindery';
  const storePhone = storeSettings?.contact_phone || '089519541180';
  const storeEmail = storeSettings?.contact_email || 'banastuff@gmail.com';
  const originCoordinate =
    Number.isFinite(originLat) && Number.isFinite(originLng)
      ? { latitude: originLat, longitude: originLng }
      : undefined;
  const destinationCoordinate =
    destLat !== null && destLng !== null ? { latitude: destLat, longitude: destLng } : undefined;

  return {
    shipper_contact_name: storeName,
    shipper_contact_phone: storePhone,
    shipper_contact_email: storeEmail,
    shipper_organization: storeName,
    origin_contact_name: storeName,
    origin_contact_phone: storePhone,
    origin_address:
      storeSettings?.origin_address ||
      'Taman Yasmin Sektor V Tahap II, Jl. Cijahe 1 No.60, Kel. Cilendek Timur, Kec. Bogor Barat, Kota Bogor 16112',
    origin_note: '',
    origin_postal_code: Number(storeSettings?.origin_postal_code || 16112),
    origin_area_id: storeSettings?.origin_area_id || 'IDNP6M3K2W1',
    ...(originCoordinate ? { origin_coordinate: originCoordinate } : {}),
    destination_contact_name: address.recipient_name || profile?.name || 'Customer',
    destination_contact_phone: address.phone || profile?.phone || '',
    destination_contact_email: profile?.email || '',
    destination_address: address.full_address,
    destination_note: '',
    destination_postal_code: Number(address.postal_code || 0),
    destination_area_id: address.biteship_area_id || '',
    ...(destinationCoordinate ? { destination_coordinate: destinationCoordinate } : {}),
    courier_company: finalCourierCode,
    courier_type: finalServiceCode,
    delivery_type: 'now',
    origin_collection_method: 'pickup',
    items: orderItems.map((item) => ({
      name: item.products?.name || item.product_name || 'Produk Bananasbindery',
      description: '-',
      value: Number(item.price),
      quantity: item.quantity,
      weight: Math.max(1, item.products?.weight_grams || 100),
      length: 10,
      width: 10,
      height: 10,
    })),
  };
}

type OrderForFulfillment = {
  id: string;
  order_number: string;
  user_id: string;
  address_id: string | null;
  shipping_method: string | null;
  shipping_courier: string | null;
  shipping_courier_code: string | null;
  shipping_service_code: string | null;
  shipping_metadata: Json | null;
  addresses: {
    recipient_name: string | null;
    phone: string | null;
    full_address: string;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
    biteship_area_id: string | null;
  } | null;
  profiles: {
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  order_items: Array<{
    product_name: string;
    quantity: number;
    price: number;
    products: { name: string | null; weight_grams: number | null } | null;
  }>;
};

type StoreSettingsForFulfillment = {
  store_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  origin_address: string | null;
  origin_postal_code: string | null;
  origin_area_id: string | null;
  origin_latitude: number | null;
  origin_longitude: number | null;
};

export async function ensureBiteshipFulfillment(
  orderId: string,
  options: FulfillmentOptions,
): Promise<BiteshipFulfillmentResult> {
  const supabase = createAdminClient();
  if (!supabase) {
    return {
      created: false,
      skipped: false,
      mocked: false,
      error: 'Supabase admin is not configured',
    };
  }

  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, order_number, user_id, address_id, shipping_method, shipping_courier, shipping_courier_code, shipping_service_code, shipping_metadata, addresses:address_id(recipient_name, phone, full_address, postal_code, latitude, longitude, biteship_area_id), profiles:user_id(name, phone, email), order_items(product_name, quantity, price, products(name, weight_grams))',
    )
    .eq('id', orderId)
    .single();

  if (error || !data) {
    return { created: false, skipped: false, mocked: false, error: 'Order tidak ditemukan.' };
  }

  const order = data as unknown as OrderForFulfillment;
  const currentMetadata = metadataFrom(order.shipping_metadata);

  if (currentMetadata.biteship_order_id) {
    return {
      created: false,
      skipped: true,
      mocked: String(currentMetadata.biteship_order_id).startsWith('mock_'),
      orderId: currentMetadata.biteship_order_id,
      trackingId: currentMetadata.courier_waybill_id || currentMetadata.courier_tracking_id || null,
    };
  }

  if (!order.addresses) {
    await saveBiteshipError(
      supabase,
      order.id,
      currentMetadata,
      new Error('Order address not found'),
    );
    return { created: false, skipped: false, mocked: false, error: 'Order address not found' };
  }

  const { data: storeSettings } = await supabase
    .from('store_settings')
    .select(
      'store_name, contact_phone, contact_email, origin_address, origin_postal_code, origin_area_id, origin_latitude, origin_longitude',
    )
    .limit(1)
    .maybeSingle();

  const payload = buildPayload({
    order,
    address: order.addresses,
    profile: order.profiles,
    orderItems: order.order_items ?? [],
    storeSettings: (storeSettings ?? null) as StoreSettingsForFulfillment | null,
  });

  try {
    const apiKey = await getIntegrationSecret('biteship', 'api_key', 'BITESHIP_API_KEY');
    if (!apiKey) throw new Error('Biteship API Key belum disimpan.');

    let biteshipData: BiteshipOrderResponse;
    let ok = true;
    const mocked = apiKey.startsWith('biteship_test');

    if (mocked) {
      biteshipData = {
        id: `mock_${order.order_number}_${Date.now()}`,
        status: 'confirmed',
        courier: { tracking_id: `MOCK-${order.order_number}` },
        success: true,
        mocked: true,
      };
    } else {
      const response = await createBiteshipOrder(apiKey, payload);
      ok = response.ok;
      biteshipData = response.data;
    }

    if (!ok) {
      await saveBiteshipError(supabase, order.id, currentMetadata, biteshipData, payload);
      return {
        created: false,
        skipped: false,
        mocked,
        error: biteshipData.message || biteshipData.error || 'Biteship API error',
      };
    }

    const now = new Date().toISOString();
    await supabase
      .from('orders')
      .update({
        shipping_status: biteshipData.status ?? 'confirmed',
        shipping_tracking:
          biteshipData.courier?.waybill_id || biteshipData.courier?.tracking_id || null,
        shipping_metadata: toJson({
          ...asRecord(currentMetadata),
          biteship_order_id: biteshipData.id,
          courier_tracking_id: biteshipData.courier?.tracking_id,
          courier_waybill_id: biteshipData.courier?.waybill_id,
          courier_company: biteshipData.courier?.company,
          courier_type: biteshipData.courier?.type,
          courier_link: biteshipData.courier?.link,
          biteship_status: biteshipData.status,
          biteship_trigger: options.trigger,
          biteship_created_at: now,
        }),
        updated_at: now,
      })
      .eq('id', order.id);

    return {
      created: true,
      skipped: false,
      mocked,
      orderId: biteshipData.id,
      trackingId: biteshipData.courier?.waybill_id || biteshipData.courier?.tracking_id || null,
    };
  } catch (error) {
    await saveBiteshipError(supabase, order.id, currentMetadata, error, payload);
    return {
      created: false,
      skipped: false,
      mocked: false,
      error: error instanceof Error ? error.message : 'Gagal membuat order Biteship.',
    };
  }
}
