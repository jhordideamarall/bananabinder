import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Fungsi untuk mencari Area ID Biteship secara otomatis berdasarkan
 * nama Kecamatan, Kota, dan Kode Pos.
 */
async function resolveAreaId(district: string, city: string, postalCode: string) {
  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) return null;

  const searchQuery = postalCode || `${district}, ${city}`;

  try {
    const response = await fetch(
      `https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(searchQuery)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    );

    const data = await response.json();
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
  name: string;
  price: number;
  quantity: number;
  weight?: number; // gram
  description?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { addressId, items: rawItems } = await req.json();
    const items = (Array.isArray(rawItems) ? rawItems : []) as ShippingCartItem[];
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

    // 2. Hitung Berat Total (gram, untuk key cache) — baca weight top-level
    const totalWeight = items.reduce(
      (sum: number, item) => sum + (item.weight || 1000) * (item.quantity || 1),
      0,
    );

    // 3. Ambil Pengaturan Toko (Origin)
    const { data: settings } = await supabase.from('store_settings').select('*').single();

    // Origin diambil dari store_settings (sumber kebenaran, diatur via /admin/promos).
    // Fallback disamakan dengan default DB store_settings agar tidak ada origin "miss".
    const originAreaId =
      settings?.origin_area_id || process.env.BITESHIP_ORIGIN_AREA_ID || 'IDNP6M3K2W1';
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
    const couriers = 'jne,jnt,sicepat,anteraja,grab,gojek';
    const { data: cachedRate } = await supabase
      .from('shipping_rates_cache')
      .select('rates_data')
      .eq('origin_area_id', originAreaId)
      .eq('destination_area_id', destinationAreaId)
      .eq('total_weight', totalWeight)
      .eq('couriers_list', couriers)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cachedRate) {
      console.log('💰 CACHE HIT: Menggunakan harga ongkir tersimpan. Hemat Rp 5!');
      return NextResponse.json(cachedRate.rates_data);
    }

    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Biteship API Key belum terpasang di .env' },
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
      couriers: 'gojek,grab,jne,lion,sicepat,jnt,idexpress,anteraja,sap,lalamove',
      items: items.map((item) => ({
        name: item.name || 'Produk binder Bananasbindery',
        description: item.description || item.name || 'Produk binder Bananasbindery',
        value: item.price || 0,
        quantity: item.quantity || 1,
        weight: item.weight || 500, // gram — konsisten dengan CartItem.weight
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
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(biteshipPayload),
    });

    const data = await response.json();

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
    const results = (
      data.pricing as Array<{
        courier_code: string;
        courier_service_code: string;
        courier_name: string;
        courier_service_name: string;
        price: number;
        duration: string;
      }>
    ).map((p) => ({
      id: `${p.courier_code}_${p.courier_service_code}`,
      courier_code: p.courier_code,
      courier_name: p.courier_name,
      service_code: p.courier_service_code,
      service_name: p.courier_service_name,
      name: `${p.courier_name} - ${p.courier_service_name}`,
      price: p.price,
      etd: p.duration,
      description: p.courier_service_name, // fallback
    }));

    // 7. Simpan Hasil ke Cache (upsert — refresh row lama yang sudah expired
    //    tanpa kena duplicate key pada unique constraint).
    if (data.success) {
      await supabase.from('shipping_rates_cache').upsert(
        {
          origin_area_id: originAreaId,
          destination_area_id: destinationAreaId,
          total_weight: totalWeight,
          couriers_list: couriers,
          rates_data: results,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'origin_area_id,destination_area_id,total_weight,couriers_list' },
      );
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
