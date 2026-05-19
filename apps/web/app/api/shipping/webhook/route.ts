import { NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';
import { createClient } from '@supabase/supabase-js';
import { getIntegrationSecret } from '@/lib/integration-secrets';

// Inisialisasi admin client secara aman
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
};

function authCandidates(req: Request): string[] {
  const authorization = req.headers.get('authorization')?.trim() ?? '';
  const webhookToken =
    req.headers.get('x-webhook-token')?.trim() ??
    req.headers.get('x-biteship-webhook-token')?.trim() ??
    req.headers.get('x-biteship-token')?.trim() ??
    '';

  const values = [authorization, webhookToken];
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearer) values.push(bearer);

  const basic = authorization.match(/^Basic\s+(.+)$/i)?.[1]?.trim();
  if (basic) {
    try {
      const decoded = Buffer.from(basic, 'base64').toString('utf8');
      const [username, password] = decoded.split(':');
      if (username) values.push(username);
      if (password) values.push(password);
    } catch {
      // Ignore malformed Basic auth headers.
    }
  }

  return values.filter(Boolean);
}

async function verifyBiteshipWebhook(req: Request): Promise<boolean> {
  const expectedToken = await getIntegrationSecret(
    'biteship',
    'webhook_token',
    'BITESHIP_WEBHOOK_TOKEN',
  );
  if (!expectedToken) return false;
  return authCandidates(req).some((candidate) => candidate === expectedToken);
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Biteship Webhook Route is Active',
  });
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.error('Supabase Admin Client not initialized');
      return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    // Ambil body secara aman untuk menghindari error saat Biteship melakukan tes/ping
    let body;
    try {
      body = await req.json();
    } catch {
      console.log('Webhook Warning: Received empty or invalid JSON body during ping/validation');
      return NextResponse.json({ success: true, message: 'Ping received' });
    }

    console.log('Biteship Webhook Received:', JSON.stringify(body, null, 2));

    const {
      event,
      order_id,
      status,
      courier_tracking_id,
      courier_waybill_id,
      courier_company,
      courier_type,
      courier_link,
      courier_driver_name,
      courier_driver_phone,
      courier_driver_plate_number,
      price,
      order_price,
    } = body || {};

    // Jika Biteship cuma ngetes URL (tanpa event), balas OK saja
    if (!event) {
      return NextResponse.json({ success: true, message: 'Webhook URL validated' });
    }

    if (!(await verifyBiteshipWebhook(req))) {
      console.error('Biteship webhook rejected: webhook token missing or mismatch');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Validasi event (Biteship dashboard uses 'order.status')
    if (
      event !== 'order.status_update' &&
      event !== 'order.status' &&
      event !== 'order.waybill_id' &&
      event !== 'order.price'
    ) {
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    // 2. Cari order yang memiliki biteship_order_id tersebut
    // Kita simpan biteship_order_id di dalam shipping_metadata
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .contains('shipping_metadata', { biteship_order_id: order_id })
      .single();

    if (orderError || !order) {
      console.warn(`Biteship webhook received for unknown order: ${order_id}`);
      return NextResponse.json({ success: true, message: 'Order not found' });
    }

    // 3. Mapping status Biteship ke status database kita
    // Status Biteship: confirmed, allocated, picking_up, picked, dropping_off, delivered, rejected, cancelled
    let internalStatus = order.status;
    let shippingStatus = order.shipping_status;

    switch (status) {
      case 'picking_up':
      case 'picked':
      case 'picked_up':
        shippingStatus = 'shipped';
        break;
      case 'dropping_off':
        shippingStatus = 'shipped';
        break;
      case 'delivered':
        shippingStatus = 'delivered';
        internalStatus = 'completed'; // Order selesai kalau sudah sampai
        break;
      case 'rejected':
      case 'cancelled':
        shippingStatus = 'cancelled';
        break;
    }

    // 4. Update data order
    interface OrderUpdate {
      shipping_status: string | null;
      status: string;
      shipping_tracking?: string | null;
      shipping_metadata: Record<string, unknown>;
      delivered_at?: string;
      shipped_at?: string;
    }

    const metadata = (order.shipping_metadata as Record<string, unknown>) ?? {};
    const nextTrackingId =
      courier_tracking_id || metadata.courier_tracking_id || metadata.biteship_order_id;
    const nextWaybillId = courier_waybill_id || metadata.courier_waybill_id;

    const updateData: OrderUpdate = {
      shipping_status: shippingStatus as string | null,
      status: internalStatus as string,
      shipping_tracking: (nextWaybillId || nextTrackingId || order.shipping_tracking || null) as
        | string
        | null,
      shipping_metadata: {
        ...metadata,
        biteship_status: status as string,
        courier_tracking_id: nextTrackingId as string,
        courier_waybill_id: nextWaybillId as string,
        courier_company: courier_company || metadata.courier_company,
        courier_type: courier_type || metadata.courier_type,
        courier_link: courier_link || metadata.courier_link,
        courier_driver_name: courier_driver_name || metadata.courier_driver_name,
        courier_driver_phone: courier_driver_phone || metadata.courier_driver_phone,
        courier_driver_plate_number:
          courier_driver_plate_number || metadata.courier_driver_plate_number,
        biteship_price: price ?? order_price ?? metadata.biteship_price,
        last_webhook_event: event,
        last_webhook_at: new Date().toISOString(),
      },
    };

    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (status === 'picked' || status === 'picked_up') {
      updateData.shipped_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      console.error('Failed to update order from Biteship webhook:', updateError);
      return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
    }

    const webhookEventId = [
      order_id || order.id,
      event,
      status || courier_tracking_id || courier_waybill_id || price || order_price || 'received',
    ].join(':');
    const { error: eventError } = await supabaseAdmin.from('webhook_events').insert({
      provider: 'biteship',
      event_id: webhookEventId,
      event_type: event,
      reference_id: order_id || order.id,
      payload: body,
    });

    if (eventError) {
      console.warn('Biteship webhook event audit skipped:', eventError.message);
    }

    console.log(`Order ${order.order_number} updated to shipping_status: ${shippingStatus}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('BITESHIP_WEBHOOK_ERROR:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
