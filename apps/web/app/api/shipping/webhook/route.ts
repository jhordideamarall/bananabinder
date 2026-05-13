import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi admin client secara aman
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) return null;
  return createClient(url, key);
};

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Biteship Webhook Route is Active' 
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

    const { event, order_id, status, courier_tracking_id } = body || {};

    // Jika Biteship cuma ngetes URL (tanpa event), balas OK saja
    if (!event) {
      return NextResponse.json({ success: true, message: 'Webhook URL validated' });
    }

    // 1. Validasi event (Biteship dashboard uses 'order.status')
    if (event !== 'order.status_update' && event !== 'order.status') {
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
    // Status Biteship: placed, confirmed, allocated, picking_up, picked_up, dropping_off, delivered, rejected, cancelled
    let internalStatus = order.status;
    let shippingStatus = order.shipping_status;

    switch (status) {
      case 'picking_up':
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
      shipping_status: string;
      status: string;
      shipping_metadata: Record<string, unknown>;
      delivered_at?: string;
      shipped_at?: string;
    }

    const updateData: OrderUpdate = {
      shipping_status: shippingStatus as string,
      status: internalStatus as string,
      shipping_metadata: {
        ...(order.shipping_metadata as Record<string, unknown>),
        biteship_status: status as string,
        courier_tracking_id: (courier_tracking_id || order.shipping_metadata?.courier_tracking_id) as string,
        last_webhook_at: new Date().toISOString()
      }
    };

    if (status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    } else if (status === 'picked_up') {
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

    console.log(`Order ${order.order_number} updated to shipping_status: ${shippingStatus}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('BITESHIP_WEBHOOK_ERROR:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
