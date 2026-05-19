import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { biteshipAuthHeader, getIntegrationSecret } from '@/lib/integration-secrets';

interface ShippingMetadata {
  biteship_order_id?: string;
  courier_tracking_id?: string;
  courier_waybill_id?: string;
  courier_company?: string;
}

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    const userSupabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Inisialisasi Supabase
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase admin is not configured' }, { status: 503 });
    }

    // 2. Ambil biteship_order_id dari database
    const { data: order, error } = await supabase
      .from('orders')
      .select('user_id, shipping_metadata')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'owner'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const metadata = order.shipping_metadata as unknown as ShippingMetadata;
    const biteshipOrderId = metadata?.biteship_order_id;
    const courierTrackingId = metadata?.courier_tracking_id;
    const courierWaybillId = metadata?.courier_waybill_id;
    const courierCompany = metadata?.courier_company;

    if (!biteshipOrderId && !courierTrackingId) {
      return NextResponse.json({ error: 'Tracking not available yet' }, { status: 400 });
    }

    // 3. Panggil API Biteship
    const trackingId = courierTrackingId || biteshipOrderId;

    // Sandbox mock — biteship_order_id format `mock_*` artinya order dibuat
    // di mode mock (lihat webhook/route.ts). Return data tracking simulasi.
    if (typeof biteshipOrderId === 'string' && biteshipOrderId.startsWith('mock_')) {
      const now = new Date();
      const fiveMinsAgo = new Date(now.getTime() - 5 * 60000).toISOString();
      const tenMinsAgo = new Date(now.getTime() - 10 * 60000).toISOString();

      return NextResponse.json({
        success: true,
        mocked: true,
        order_id: biteshipOrderId,
        waybill_id: courierWaybillId || courierTrackingId || trackingId,
        courier: { company: 'biteship', type: 'sandbox' },
        status: 'picking_up',
        history: [
          {
            note: 'Kurir sedang menuju lokasi penjemputan (sandbox mock)',
            updated_at: now.toISOString(),
            status: 'picking_up',
          },
          {
            note: 'Kurir berhasil dialokasikan',
            updated_at: fiveMinsAgo,
            status: 'allocated',
          },
          {
            note: 'Order diterima sistem',
            updated_at: tenMinsAgo,
            status: 'confirmed',
          },
        ],
        link: null,
      });
    }

    const biteshipApiKey = await getIntegrationSecret('biteship', 'api_key', 'BITESHIP_API_KEY');
    if (!biteshipApiKey) {
      return NextResponse.json({ error: 'Biteship API key is not configured' }, { status: 503 });
    }

    let biteshipRes = await fetch(`https://api.biteship.com/v1/trackings/${trackingId}`, {
      headers: {
        Authorization: biteshipAuthHeader(biteshipApiKey),
      },
    });

    let trackingData = await readJson(biteshipRes);

    if (!biteshipRes.ok && courierWaybillId && courierCompany) {
      const publicTrackingRes = await fetch(
        `https://api.biteship.com/v1/trackings/${courierWaybillId}/couriers/${courierCompany}`,
        {
          headers: {
            Authorization: biteshipAuthHeader(biteshipApiKey),
          },
        },
      );
      const publicTrackingData = await readJson(publicTrackingRes);

      if (publicTrackingRes.ok) {
        biteshipRes = publicTrackingRes;
        trackingData = publicTrackingData;
      }
    }

    if (!biteshipRes.ok) {
      return NextResponse.json(trackingData, { status: biteshipRes.status });
    }

    return NextResponse.json(trackingData);
  } catch (error) {
    console.error('TRACKING_API_ERROR:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 },
    );
  }
}
