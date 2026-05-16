import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface ShippingMetadata {
  biteship_order_id?: string;
  courier_tracking_id?: string;
}

// Inisialisasi admin client secara lazy/aman untuk build
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
};

const XENDIT_CALLBACK_TOKEN = process.env.XENDIT_CALLBACK_TOKEN || '';
const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY || '';
// Disamakan dengan default DB store_settings agar origin pengiriman konsisten.
const BITESHIP_ORIGIN_AREA_ID = process.env.BITESHIP_ORIGIN_AREA_ID || 'IDNP6M3K2W1';

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

    console.log('Xendit Webhook Received:', JSON.stringify(body, null, 2));

    // Fail-closed: tolak kalau token belum di-set di env ATAU tidak cocok.
    // Sebelumnya validasi dilewati saat env kosong → webhook terbuka.
    if (!XENDIT_CALLBACK_TOKEN || callbackToken !== XENDIT_CALLBACK_TOKEN) {
      console.error('Xendit webhook rejected: callback token missing or mismatch');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { external_id, status } = body;

    // Idempotency guard — hindari proses ganda kalau Xendit retry webhook.
    const eventId: string = body.id || `${external_id}-${status}`;
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
        return NextResponse.json({ success: true, message: 'Order not found, skipping' });
      }

      // 1b. Ambil data profil, items, dan store settings
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', order.user_id)
        .single();

      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('*, products(name, weight_grams)')
        .eq('order_id', order.id);

      const { data: storeSettings } = await supabaseAdmin
        .from('store_settings')
        .select('*')
        .single();

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

      // 3. KIRIM KE BITESHIP (Hanya jika belum pernah dikirim)
      if (!order.shipping_metadata?.biteship_order_id) {
        try {
          if (!BITESHIP_API_KEY) {
            console.error(
              'Biteship Webhook Error: BITESHIP_API_KEY is not defined in environment variables',
            );
            return NextResponse.json({ success: true, message: 'Biteship API Key missing' });
          }

          const address = order.addresses;
          if (!address) throw new Error('Order address not found');

          // Koordinat Pengirim (Origin) - Fallback ke Toko Bananas Bindery
          // (Taman Yasmin, Cilendek Timur, Bogor Barat 16112). Sumber kebenaran
          // tetap store_settings yang diatur via /admin/promos.
          const originLat = storeSettings?.origin_latitude
            ? Number(storeSettings.origin_latitude)
            : -6.570345;
          const originLng = storeSettings?.origin_longitude
            ? Number(storeSettings.origin_longitude)
            : 106.7767107;

          // Koordinat Penerima (Destination)
          const destLat = address.latitude ? Number(address.latitude) : undefined;
          const destLng = address.longitude ? Number(address.longitude) : undefined;

          // Ambil kode kurir & servis langsung dari DB (Step 4 Fix)
          // Jika tidak ada (order lama), fallback ke parsing string
          const shippingMethodStr = order.shipping_method || '';
          const [courierName, serviceName] = shippingMethodStr.split(' - ');

          const mapServiceType = (service: string) => {
            const s = service.toLowerCase();
            if (s.includes('reg')) return 'reg';
            if (s.includes('ins')) return 'instant';
            if (s.includes('same')) return 'same_day';
            if (s.includes('exp')) return 'next_day';
            if (s.includes('eco')) return 'eco';
            return 'reg';
          };

          const finalCourierCode =
            order.shipping_courier_code ||
            (order.shipping_courier || courierName || '').toLowerCase();
          const finalServiceCode =
            order.shipping_service_code || mapServiceType(serviceName || 'reg');

          const biteshipPayload = {
            shipper_contact_name: 'Bananas Bindery',
            shipper_contact_phone: '089519541180',
            shipper_contact_email: 'banastuff@gmail.com',
            shipper_organization: 'Bananas Bindery',
            origin_contact_name: 'Bananas Bindery',
            origin_contact_phone: '089519541180',
            origin_address:
              storeSettings?.origin_address ||
              'Taman Yasmin Sektor V Tahap II, Jl. Cijahe 1 No.60, Kel. Cilendek Timur, Kec. Bogor Barat, Kota Bogor 16112',
            origin_note: '',
            origin_postal_code: 16112,
            origin_area_id: storeSettings?.origin_area_id || BITESHIP_ORIGIN_AREA_ID,
            origin_latitude: originLat,
            origin_longitude: originLng,
            destination_contact_name: address.recipient_name || profile?.name || 'Customer',
            destination_contact_phone: address.phone || profile?.phone || '',
            destination_contact_email: profile?.email || '',
            destination_address: address.full_address,
            destination_note: '',
            destination_postal_code: parseInt(address.postal_code || '0'),
            destination_area_id: address.biteship_area_id,
            destination_latitude: destLat,
            destination_longitude: destLng,
            courier_company: finalCourierCode,
            courier_type: finalServiceCode,
            delivery_type: 'now',
            origin_collection_method: 'pickup',
            items: ((orderItems || []) as unknown[]).map((item) => {
              const it = item as {
                products?: { name: string; weight_grams: number };
                product_name?: string;
                price: number;
                quantity: number;
              };
              return {
                name: it.products?.name || it.product_name || 'Produk',
                description: '-',
                value: it.price,
                quantity: it.quantity,
                weight: Math.max(1, it.products?.weight_grams || 100),
                // Dimensi default (cm) — wajib untuk instant courier (Gojek/Grab).
                // Tanpa ini Biteship reject 40002021 untuk gojek/grab instant.
                length: 10,
                width: 10,
                height: 10,
              };
            }),
          };

          console.log('Attempting Biteship Order Creation for:', order.order_number);
          console.log('Biteship Payload:', JSON.stringify(biteshipPayload, null, 2));

          // SANDBOX MOCK MODE
          // Biteship sandbox (`biteship_test_*`) tidak support `/v1/orders` untuk
          // kurir asli (jne/sicepat/gojek) — semua return 40002021 "Failed getting Rates"
          // dan `biteship/standard` tidak support pickup (40002031).
          // Untuk dev workflow, simulasi sukses lokal supaya alur UI/tracking bisa diuji.
          // Production (key non-test) tetap call real Biteship API.
          const isSandbox = BITESHIP_API_KEY.startsWith('biteship_test');
          let biteshipRes: Response;
          let biteshipData: {
            id?: string;
            status?: string;
            courier?: { tracking_id?: string };
            success?: boolean;
            error?: string;
            code?: number;
            mocked?: boolean;
          };

          if (isSandbox) {
            const mockOrderId = `mock_${order.order_number}_${Date.now()}`;
            biteshipData = {
              id: mockOrderId,
              status: 'confirmed',
              courier: { tracking_id: `MOCK-${order.order_number}` },
              success: true,
              mocked: true,
            };
            biteshipRes = new Response(JSON.stringify(biteshipData), { status: 200 });
            console.warn(
              '[Biteship SANDBOX MOCK] Order ' +
                order.order_number +
                ' — skipping real API call, writing fake metadata for UI testing.',
            );
          } else {
            biteshipRes = await fetch('https://api.biteship.com/v1/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${BITESHIP_API_KEY}`,
              },
              body: JSON.stringify(biteshipPayload),
            });
            biteshipData = await biteshipRes.json();
          }

          if (biteshipRes.ok) {
            await supabaseAdmin
              .from('orders')
              .update({
                shipping_metadata: {
                  ...(order.shipping_metadata as ShippingMetadata),
                  biteship_order_id: biteshipData.id,
                  courier_tracking_id: biteshipData.courier?.tracking_id,
                  biteship_status: biteshipData.status,
                },
              })
              .eq('id', order.id);

            console.log('Biteship Order Created Successfully:', biteshipData.id);
          } else {
            console.error(
              'Biteship API Error Response for Order',
              order.order_number,
              ':',
              JSON.stringify(biteshipData, null, 2),
            );
            // Save error to metadata for debugging
            await supabaseAdmin
              .from('orders')
              .update({
                shipping_metadata: {
                  ...(order.shipping_metadata as ShippingMetadata),
                  biteship_error: biteshipData,
                  last_retry_at: new Date().toISOString(),
                  debug_last_payload: biteshipPayload,
                },
              })
              .eq('id', order.id);
          }
        } catch (bsError) {
          console.error('Failed to call Biteship API for Order', order.order_number, ':', bsError);
        }
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
