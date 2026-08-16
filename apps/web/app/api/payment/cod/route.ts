import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Database, Json } from '@bananasbindery/types/supabase';
import { createClient } from '@/lib/supabase/server';

interface CodPaymentRequest {
  orderId: string | null;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseBody(value: unknown): CodPaymentRequest {
  if (!isRecord(value)) return { orderId: null };
  return {
    orderId:
      typeof value.orderId === 'string' && value.orderId.trim() ? value.orderId.trim() : null,
  };
}

function jsonRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

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
        { error: 'Silakan login dulu untuk memilih pembayaran COD.' },
        { status: 401 },
      );
    }

    const { orderId } = parseBody(await req.json().catch(() => null));
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib ada.' }, { status: 400 });
    }

    const { data: paymentSettings, error: settingsError } = await supabaseAdmin
      .from('store_settings')
      .select('cod_enabled')
      .limit(1)
      .maybeSingle();
    if (settingsError) {
      return NextResponse.json({ error: settingsError.message }, { status: 500 });
    }
    if (paymentSettings?.cod_enabled === false) {
      return NextResponse.json(
        { error: 'COD sedang dinonaktifkan oleh admin toko.' },
        { status: 409 },
      );
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(
        'id, user_id, status, payment_status, payment_method, total, shipping_cost, shipping_courier, shipping_courier_code, shipping_service_code, payment_metadata',
      )
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order tidak ditemukan.' }, { status: 404 });
    }
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Order bukan milik user ini.' }, { status: 403 });
    }
    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order ini sudah dibayar.' }, { status: 409 });
    }
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'COD hanya bisa dipilih untuk order pending.' },
        { status: 409 },
      );
    }

    const { data: latestProof } = await supabaseAdmin
      .from('payment_proofs')
      .select('id, status')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestProof?.status === 'submitted' || latestProof?.status === 'approved') {
      return NextResponse.json(
        { error: 'Order ini sudah memiliki bukti transfer yang sedang direview.' },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const paymentMetadata: Json = {
      ...jsonRecord(order.payment_metadata),
      cod: {
        confirmed_at: now,
        amount_due: Number(order.total),
        shipping_cost: Number(order.shipping_cost ?? 0),
        shipping_courier: order.shipping_courier,
        shipping_courier_code: order.shipping_courier_code,
        shipping_service_code: order.shipping_service_code,
        payment_timing: 'on_delivery',
      },
    };

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_method: 'cod',
        payment_status: 'unpaid',
        payment_metadata: paymentMetadata,
        updated_at: now,
      })
      .eq('id', order.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ orderId: order.id, status: 'cod_pending' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Internal Server Error');
    console.error('COD_PAYMENT_ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
