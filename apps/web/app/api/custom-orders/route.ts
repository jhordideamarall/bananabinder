import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage } from '@bananasbindery/api-client/fonnte';
import type { Database, Json } from '@bananasbindery/types/supabase';
import { generateOrderNumber } from '@bananasbindery/utils/order';
import { createClient } from '@/lib/supabase/server';

interface CustomOrderBody {
  productId?: string;
  variantId?: string | null;
  size?: string;
  material?: string;
  personalization?: string;
  designNotes?: string | null;
  referenceUrl?: string | null;
  referenceImagePath?: string | null;
  referenceImageName?: string | null;
  referenceImageType?: string | null;
  referenceImageSize?: number | null;
  quantity?: number;
  whatsapp?: string | null;
}

interface WhatsAppAttempt {
  attempted: boolean;
  success: boolean;
  target?: string;
  provider_ids?: string[];
  reason?: string;
  sent_at: string;
}

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readOptionalString = (value: unknown): string | null | undefined => {
  if (typeof value === 'string') return value;
  if (value === null) return null;
  return undefined;
};

const parseBody = (value: unknown): CustomOrderBody => {
  if (!isRecord(value)) return {};
  return {
    productId: typeof value.productId === 'string' ? value.productId : undefined,
    variantId: readOptionalString(value.variantId),
    size: typeof value.size === 'string' ? value.size : undefined,
    material: typeof value.material === 'string' ? value.material : undefined,
    personalization: typeof value.personalization === 'string' ? value.personalization : undefined,
    designNotes: readOptionalString(value.designNotes),
    referenceUrl: readOptionalString(value.referenceUrl),
    referenceImagePath: readOptionalString(value.referenceImagePath),
    referenceImageName: readOptionalString(value.referenceImageName),
    referenceImageType: readOptionalString(value.referenceImageType),
    referenceImageSize:
      typeof value.referenceImageSize === 'number' ? value.referenceImageSize : undefined,
    quantity: typeof value.quantity === 'number' ? value.quantity : undefined,
    whatsapp: readOptionalString(value.whatsapp),
  };
};

const formatRupiah = (value: number): string => `Rp ${value.toLocaleString('id-ID')}`;

const buildCustomRequestMessage = (params: {
  customerName: string;
  orderNumber: string;
  productName: string;
  variantName: string | null;
  total: number;
  quantity: number;
  details: {
    size: string;
    material: string;
    personalization: string;
    designNotes?: string | null;
    referenceUrl?: string | null;
    referenceImagePath?: string | null;
  };
}): string => {
  const notes = params.details.designNotes ? `\nCatatan: ${params.details.designNotes}` : '';
  const reference = params.details.referenceUrl
    ? `\nReferensi: ${params.details.referenceUrl}`
    : '';
  const referenceImage = params.details.referenceImagePath
    ? '\nFoto referensi: sudah masuk di dashboard admin'
    : '';

  return [
    `Halo Kak ${params.customerName}!`,
    '',
    'Brief custom binder Kakak sudah kami terima dan sudah masuk ke Pesanan Saya.',
    '',
    `Order: *${params.orderNumber}*`,
    `Produk: ${params.productName}`,
    `Varian: ${params.variantName || params.details.size}`,
    `Ukuran: ${params.details.size}`,
    `Material: ${params.details.material}`,
    `Teks/Nama: ${params.details.personalization}`,
    `Qty: ${params.quantity}`,
    `Estimasi: *${formatRupiah(params.total)}*${notes}${reference}${referenceImage}`,
    '',
    'Admin akan cek brief ini dan konfirmasi detail desain sebelum produksi/pembayaran final.',
    '',
    '— Tim Bananasbindery',
  ].join('\n');
};

const sendCustomRequestWhatsApp = async (params: {
  apiKey?: string;
  target?: string | null;
  customerName: string;
  orderNumber: string;
  productName: string;
  variantName: string | null;
  total: number;
  quantity: number;
  details: {
    size: string;
    material: string;
    personalization: string;
    designNotes?: string | null;
    referenceUrl?: string | null;
    referenceImagePath?: string | null;
  };
}): Promise<WhatsAppAttempt> => {
  const sentAt = new Date().toISOString();
  if (!params.apiKey) {
    return {
      attempted: false,
      success: false,
      reason: 'FONNTE_API_TOKEN belum dikonfigurasi.',
      sent_at: sentAt,
    };
  }
  if (!params.target) {
    return {
      attempted: false,
      success: false,
      reason: 'Nomor WhatsApp customer kosong.',
      sent_at: sentAt,
    };
  }

  try {
    const result = await sendWhatsAppMessage(params.apiKey, {
      target: params.target,
      message: buildCustomRequestMessage(params),
    });
    return {
      attempted: true,
      success: result.success,
      target: params.target,
      provider_ids: result.id,
      reason: result.reason,
      sent_at: sentAt,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Gagal mengirim WhatsApp custom order.');
    return {
      attempted: true,
      success: false,
      target: params.target ?? undefined,
      reason: err.message,
      sent_at: sentAt,
    };
  }
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin is not configured' }, { status: 503 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Silakan login dulu untuk membuat custom order.' },
        { status: 401 },
      );
    }

    const body = parseBody(await req.json());
    const quantity = Math.max(1, Math.min(99, Math.floor(body.quantity ?? 1)));
    const details = {
      size: body.size?.trim() ?? '',
      material: body.material?.trim() ?? '',
      personalization: body.personalization?.trim() ?? '',
      designNotes: body.designNotes?.trim() || null,
      referenceUrl: body.referenceUrl?.trim() || null,
      referenceImagePath: body.referenceImagePath?.trim() || null,
      referenceImageName: body.referenceImageName?.trim() || null,
      referenceImageType: body.referenceImageType?.trim() || null,
      referenceImageSize:
        typeof body.referenceImageSize === 'number' && body.referenceImageSize > 0
          ? Math.floor(body.referenceImageSize)
          : null,
    };

    if (!body.productId || !details.size || !details.material || !details.personalization) {
      return NextResponse.json(
        { error: 'Produk, ukuran, material, dan teks/nama custom wajib diisi.' },
        { status: 400 },
      );
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, promo_price, cost_price, weight_grams, is_active')
      .eq('id', body.productId)
      .single();

    if (productError || !product || product.is_active !== true) {
      return NextResponse.json(
        { error: 'Produk custom tidak valid atau tidak aktif.' },
        { status: 400 },
      );
    }

    let variant: {
      id: string;
      name: string;
      price: number;
      promo_price: number | null;
      weight_grams: number | null;
      is_active: boolean | null;
    } | null = null;

    if (body.variantId) {
      const { data: variantData, error: variantError } = await supabaseAdmin
        .from('product_variants')
        .select('id, name, price, promo_price, weight_grams, is_active')
        .eq('id', body.variantId)
        .eq('product_id', body.productId)
        .single();

      if (variantError || !variantData || variantData.is_active !== true) {
        return NextResponse.json(
          { error: 'Varian custom tidak valid atau tidak aktif.' },
          { status: 400 },
        );
      }
      variant = variantData;
    }

    const unitPrice = Number(
      variant ? (variant.promo_price ?? variant.price) : (product.promo_price ?? product.price),
    );
    const subtotal = unitPrice * quantity;
    const totalWeight = Number(variant?.weight_grams ?? product.weight_grams ?? 500) * quantity;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name, email, phone')
      .eq('id', user.id)
      .single();

    const { data: address } = await supabaseAdmin
      .from('addresses')
      .select('id, phone, recipient_name')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .limit(1)
      .maybeSingle();

    const customerName =
      profile?.name || address?.recipient_name || user.email?.split('@')[0] || 'Customer';
    const customerPhone = body.whatsapp?.trim() || profile?.phone || address?.phone || null;
    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        address_id: address?.id ?? null,
        status: 'pending',
        payment_status: 'unpaid',
        payment_method: 'custom_request',
        subtotal,
        discount: 0,
        shipping_cost: 0,
        tax: 0,
        service_fee: 0,
        total: subtotal,
        total_weight_grams: totalWeight,
        notes: 'Custom order request. Admin perlu konfirmasi desain dan pembayaran final.',
        shipping_metadata: {
          flow: 'custom_request',
          fulfillment_pending_confirmation: true,
        },
        payment_metadata: {
          flow: 'custom_request',
          payment_required_after_confirmation: true,
        },
      })
      .select('id, payment_metadata')
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: orderError?.message ?? 'Gagal membuat custom order.' },
        { status: 500 },
      );
    }

    const customDetails = {
      ...details,
      whatsapp: customerPhone,
      flow: 'custom_request',
    };

    const { error: itemError } = await supabaseAdmin.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      variant_id: variant?.id ?? null,
      product_name: product.name,
      variant_name: variant?.name ?? details.size,
      quantity,
      price: unitPrice,
      cost_price: Number(product.cost_price ?? 0),
      discount: 0,
      subtotal,
      custom_details: customDetails,
    } as never);

    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }

    const whatsappAttempt = await sendCustomRequestWhatsApp({
      apiKey: process.env.FONNTE_API_TOKEN,
      target: customerPhone,
      customerName,
      orderNumber,
      productName: product.name,
      variantName: variant?.name ?? details.size,
      total: subtotal,
      quantity,
      details,
    });

    const paymentMetadata = isRecord(order.payment_metadata) ? order.payment_metadata : {};
    await supabaseAdmin
      .from('orders')
      .update({
        payment_metadata: {
          ...paymentMetadata,
          custom_order_whatsapp: whatsappAttempt,
        } as unknown as Json,
      })
      .eq('id', order.id);

    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      whatsapp: whatsappAttempt,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Internal Server Error');
    console.error('CUSTOM_ORDER_CREATE_ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
