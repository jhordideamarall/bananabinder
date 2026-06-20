import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getIntegrationSecret } from '@/lib/integration-secrets';
import { ensureBiteshipFulfillment } from '@/lib/server/biteship-fulfillment';

// Inisialisasi admin client secara lazy/aman untuk build
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
};

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.error('Supabase Admin Client not initialized - Missing Keys');
      return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    const body = await req.json();
    const headers = req.headers;
    const callbackToken = headers.get('x-callback-token');
    const xenditCallbackToken = await getIntegrationSecret(
      'xendit',
      'callback_token',
      'XENDIT_CALLBACK_TOKEN',
    );

    console.log('Xendit Webhook Received:', JSON.stringify(body, null, 2));

    // Fail-closed: tolak kalau token belum di-set di env ATAU tidak cocok.
    // Sebelumnya validasi dilewati saat env kosong → webhook terbuka.
    if (!xenditCallbackToken || callbackToken !== xenditCallbackToken) {
      console.error('Xendit webhook rejected: callback token missing or mismatch');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { external_id, status } = body;

    // Idempotency guard — hindari proses ganda kalau Xendit retry webhook.
    const eventId: string = `${body.id || external_id || 'unknown'}:${status || body.event || 'unknown'}`;
    const { data: existingEvent } = await supabaseAdmin
      .from('webhook_events')
      .select('id')
      .eq('provider', 'xendit')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingEvent) {
      console.log('Xendit webhook already processed, skipping:', eventId);
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    if (status === 'PAID' || status === 'SETTLED') {
      // 1. Ambil data order dasar
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('*, addresses(*)')
        .eq('order_number', external_id)
        .single();

      if (orderError || !order) {
        console.warn(`Webhook received for unknown order: ${external_id}`);
        await supabaseAdmin.from('webhook_events').insert({
          provider: 'xendit',
          event_id: eventId,
          event_type: status,
          reference_id: external_id,
          payload: body,
        });
        return NextResponse.json({ success: true, message: 'Order not found, skipping' });
      }

      // 2. Update status di database kita
      const paidAt = new Date().toISOString();
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'paid',
          paid_at: paidAt,
          payment_metadata: body,
        })
        .eq('order_number', external_id);

      // 2b. Sinkronkan tabel transactions (sebelumnya tidak diupdate →
      //     laporan finansial/audit jadi tidak akurat).
      await supabaseAdmin
        .from('transactions')
        .update({
          status: 'paid',
          paid_at: paidAt,
          raw_response: body,
          updated_at: paidAt,
        })
        .eq('external_id', external_id);

      const fulfillment = await ensureBiteshipFulfillment(order.id, { trigger: 'xendit_webhook' });
      if (fulfillment.error) {
        console.error('Biteship fulfillment error for Xendit order:', fulfillment.error);
      }
    } else if (status === 'EXPIRED') {
      // Ambil order dulu untuk dapat id (dipakai RPC release inventory).
      const { data: expiredOrder } = await supabaseAdmin
        .from('orders')
        .select('id, status, inventory_released_at')
        .eq('order_number', external_id)
        .single();

      if (expiredOrder) {
        const expiredAt = new Date().toISOString();

        await supabaseAdmin
          .from('orders')
          .update({
            status: 'expired',
            payment_status: 'unpaid',
            payment_metadata: body,
          })
          .eq('id', expiredOrder.id);

        // Kembalikan stok yang sudah di-reserve create_order_v1.
        // RPC idempotent — cek inventory_released_at di dalam fungsi.
        const { error: releaseError } = await supabaseAdmin.rpc('release_order_inventory_v1', {
          p_order_id: expiredOrder.id,
          p_reason: 'payment_expired',
        });
        if (releaseError) {
          console.error('release_order_inventory_v1 error for', external_id, ':', releaseError);
        }

        // Sinkronkan transactions.
        await supabaseAdmin
          .from('transactions')
          .update({ status: 'expired', raw_response: body, updated_at: expiredAt })
          .eq('external_id', external_id);
      }

      console.log('Order Expired:', external_id);
    }

    // Catat event yang sudah diproses (idempotency).
    await supabaseAdmin.from('webhook_events').insert({
      provider: 'xendit',
      event_id: eventId,
      event_type: status,
      reference_id: external_id,
      payload: body,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    console.error('WEBHOOK_ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
