'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { checkFonnteDevice, sendWhatsAppMessage } from '@bananasbindery/api-client/fonnte';
import type { Enums } from '@bananasbindery/types/supabase';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import { createClient } from '@/lib/supabase/server';
import {
  biteshipAuthHeader,
  getIntegrationMode,
  getIntegrationSecret,
  recordIntegrationTestResult,
  xenditAuthHeader,
  type IntegrationSecretKey,
  type IntegrationProvider,
} from '@/lib/integration-secrets';

const ADMIN_ROLES: Enums<'user_role'>[] = ['admin', 'owner'];
const ALLOWED_SECRET_KEYS: IntegrationSecretKey[] = [
  'secret_key',
  'test_secret_key',
  'callback_token',
  'test_callback_token',
  'api_key',
  'test_api_key',
  'webhook_token',
  'mode',
  'api_token',
];

export type IntegrationActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

async function requireOwnerAdmin(): Promise<TypedSupabaseClient> {
  const supabase = (await createClient()) as TypedSupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Anda harus login sebagai admin.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    throw new Error('Hanya owner/admin yang boleh mengubah integrasi.');
  }

  return supabase;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function saveSecret(
  provider: IntegrationProvider,
  secretKey: IntegrationSecretKey,
  secret: string,
) {
  if (!secret) return false;
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) throw new Error('Supabase admin belum dikonfigurasi.');

  const { error } = await supabaseAdmin.rpc('admin_upsert_integration_secret', {
    p_provider: provider,
    p_secret_key: secretKey,
    p_secret: secret,
  });
  if (error) throw new Error(error.message);
  return true;
}

function actionSuccess(message: string): IntegrationActionState {
  return { status: 'success', message };
}

function actionError(error: unknown, fallback: string): IntegrationActionState {
  return {
    status: 'error',
    message: error instanceof Error ? error.message : fallback,
  };
}

export async function saveIntegrationSettings(
  _prevState: IntegrationActionState,
  formData: FormData,
): Promise<IntegrationActionState> {
  try {
    await requireOwnerAdmin();
    const provider = text(formData, 'provider') as IntegrationProvider;
    const mode = text(formData, 'mode');
    let saved = 0;

    if (provider === 'xendit') {
      if (mode === 'production' || mode === 'test') {
        if (await saveSecret(provider, 'mode', mode)) saved++;
      }
      if (await saveSecret(provider, 'secret_key', text(formData, 'secret_key'))) saved++;
      if (await saveSecret(provider, 'test_secret_key', text(formData, 'test_secret_key'))) {
        saved++;
      }
      if (await saveSecret(provider, 'callback_token', text(formData, 'callback_token'))) {
        saved++;
      }
      if (
        await saveSecret(provider, 'test_callback_token', text(formData, 'test_callback_token'))
      ) {
        saved++;
      }
    } else if (provider === 'biteship') {
      if (mode === 'production' || mode === 'test') {
        if (await saveSecret(provider, 'mode', mode)) saved++;
      }
      if (await saveSecret(provider, 'api_key', text(formData, 'api_key'))) saved++;
      if (await saveSecret(provider, 'test_api_key', text(formData, 'test_api_key'))) saved++;
      if (await saveSecret(provider, 'webhook_token', text(formData, 'webhook_token'))) saved++;
    } else if (provider === 'fonnte') {
      if (await saveSecret(provider, 'api_token', text(formData, 'api_token'))) saved++;
    } else {
      throw new Error('Provider tidak valid.');
    }

    if (saved === 0) {
      throw new Error('Isi minimal satu field sebelum menyimpan.');
    }

    revalidatePath('/admin/integrations');
    return actionSuccess(
      'Tersimpan. Secret tetap disembunyikan dan hanya statusnya yang ditampilkan.',
    );
  } catch (error) {
    return actionError(error, 'Gagal menyimpan integrasi.');
  }
}

export async function deleteIntegrationSecret(
  _prevState: IntegrationActionState,
  formData: FormData,
): Promise<IntegrationActionState> {
  try {
    await requireOwnerAdmin();
    const provider = text(formData, 'provider') as IntegrationProvider;
    const secretKey = text(formData, 'secret_key') as IntegrationSecretKey;

    if (!['xendit', 'biteship', 'fonnte'].includes(provider)) {
      throw new Error('Provider tidak valid.');
    }

    if (!ALLOWED_SECRET_KEYS.includes(secretKey)) {
      throw new Error('Secret key tidak valid.');
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) throw new Error('Supabase admin belum dikonfigurasi.');

    const { error } = await supabaseAdmin.rpc('admin_delete_integration_secret', {
      p_provider: provider,
      p_secret_key: secretKey,
    });
    if (error) throw new Error(error.message);

    revalidatePath('/admin/integrations');
    return actionSuccess(
      'Credential dihapus dari mode aktif. Masukkan credential baru sebelum test ulang.',
    );
  } catch (error) {
    return actionError(error, 'Gagal menghapus credential.');
  }
}

async function resolveBiteshipArea(apiKey: string, input: string) {
  const res = await fetch(
    `https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(input)}`,
    { headers: { Authorization: biteshipAuthHeader(apiKey) } },
  );
  const data = (await res.json().catch(() => ({}))) as {
    areas?: Array<{ id: string; name?: string; postal_code?: string | number }>;
    message?: string;
    error?: string;
  };
  if (!res.ok || !data.areas?.[0]) {
    throw new Error(data.message || data.error || 'Area tujuan test tidak ditemukan Biteship.');
  }
  return data.areas[0];
}

async function getStoreOrigin() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin belum dikonfigurasi.');

  const { data, error } = await supabase
    .from('store_settings')
    .select('origin_area_id, origin_address, origin_latitude, origin_longitude, origin_postal_code')
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.origin_area_id) {
    throw new Error('Isi lokasi toko dan Biteship Area ID di Admin > Settings dulu.');
  }
  return data;
}

async function testBiteshipRates(formData: FormData): Promise<string> {
  const apiKey = await getIntegrationSecret('biteship', 'api_key', 'BITESHIP_API_KEY');
  if (!apiKey) throw new Error('Biteship API Key belum disimpan.');

  const origin = await getStoreOrigin();
  const destinationInput = text(formData, 'destination') || 'Jakarta Selatan 12250';
  const destination = await resolveBiteshipArea(apiKey, destinationInput);

  const payload = {
    origin_area_id: origin.origin_area_id,
    destination_area_id: destination.id,
    couriers: 'jne,jnt,sicepat,anteraja,grab,gojek',
    items: [
      {
        name: 'Test Binder',
        description: 'Barang test koneksi ongkir',
        value: 50000,
        quantity: 1,
        weight: 500,
      },
    ],
  };

  const res = await fetch('https://api.biteship.com/v1/rates/couriers', {
    method: 'POST',
    headers: {
      Authorization: biteshipAuthHeader(apiKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    pricing?: Array<{ courier_name?: string; courier_service_name?: string; price: number }>;
    message?: string;
    error?: string;
  };
  if (!res.ok || !data.pricing?.length) {
    throw new Error(data.message || data.error || 'Biteship belum mengembalikan ongkir.');
  }

  const cheapest = [...data.pricing].sort((a, b) => a.price - b.price)[0];
  return `Ongkir aktif: ${data.pricing.length} opsi. Termurah ${cheapest.courier_name ?? 'kurir'} ${cheapest.courier_service_name ?? ''} Rp ${cheapest.price.toLocaleString('id-ID')}.`;
}

async function testBiteshipCouriers(): Promise<string> {
  const apiKey = await getIntegrationSecret('biteship', 'api_key', 'BITESHIP_API_KEY');
  if (!apiKey) throw new Error('Biteship API Key belum disimpan.');

  const res = await fetch('https://api.biteship.com/v1/couriers', {
    headers: { Authorization: biteshipAuthHeader(apiKey) },
  });
  const data = (await res.json().catch(() => ({}))) as {
    couriers?: unknown[];
    courier_companies?: unknown[];
    message?: string;
    error?: string;
  };
  if (!res.ok) throw new Error(data.message || data.error || 'Gagal mengambil daftar kurir.');

  const count = (data.couriers ?? data.courier_companies ?? []).length;
  return count > 0
    ? `Kurir aktif: ${count} courier terbaca dari Biteship.`
    : 'API key valid, tapi daftar kurir kosong dari Biteship.';
}

async function testBiteshipSandboxKey(): Promise<string> {
  const apiKey = await getIntegrationSecret('biteship', 'test_api_key', 'BITESHIP_TEST_API_KEY');
  if (!apiKey) throw new Error('Biteship Test API Key belum disimpan.');
  if (!apiKey.startsWith('biteship_test')) {
    throw new Error(
      'Field Test API Key harus diisi token sandbox Biteship yang diawali biteship_test.',
    );
  }

  const res = await fetch('https://api.biteship.com/v1/couriers', {
    headers: { Authorization: biteshipAuthHeader(apiKey) },
  });
  const data = (await res.json().catch(() => ({}))) as {
    couriers?: unknown[];
    courier_companies?: unknown[];
    message?: string;
    error?: string;
  };
  if (!res.ok) throw new Error(data.message || data.error || 'Biteship Test API Key tidak valid.');

  const count = (data.couriers ?? data.courier_companies ?? []).length;
  return `Sandbox key valid. ${count} courier terbaca. Gunakan key ini untuk membuat test order delivered/cancelled di Biteship Mode Testing.`;
}

async function testBiteshipOrderReadiness(): Promise<string> {
  const apiKey = await getIntegrationSecret('biteship', 'api_key', 'BITESHIP_API_KEY');
  if (!apiKey) throw new Error('Biteship API Key belum disimpan.');
  const mode = await getIntegrationMode('biteship');

  const origin = await getStoreOrigin();
  if (
    !origin.origin_address ||
    !origin.origin_latitude ||
    !origin.origin_longitude ||
    !origin.origin_postal_code
  ) {
    throw new Error('Lengkapi alamat dan titik lokasi toko di Admin > Settings dulu.');
  }

  if (mode === 'test') {
    return 'Mode testing aktif. Website akan memakai Biteship Test API Key dan shipment live tidak akan dibuat.';
  }

  if (apiKey.startsWith('biteship_test')) {
    throw new Error(
      'Mode Production aktif tapi API key masih token testing. Pindahkan ke field Test API Key, lalu isi Live API Key dengan token biteship_live.',
    );
  }

  return 'Pesanan live siap: API key dan origin toko lengkap. Create order test tidak dijalankan agar tidak memanggil kurir sungguhan.';
}

async function testXendit(): Promise<string> {
  const mode = await getIntegrationMode('xendit');
  const secretKey = await getIntegrationSecret('xendit', 'secret_key', 'XENDIT_SECRET_KEY');
  const callbackToken = await getIntegrationSecret(
    'xendit',
    'callback_token',
    'XENDIT_CALLBACK_TOKEN',
  );
  if (!secretKey) throw new Error('Xendit Secret Key belum disimpan.');
  if (!callbackToken) throw new Error('Xendit Callback Token belum disimpan.');

  const res = await fetch('https://api.xendit.co/balance?account_type=CASH', {
    headers: { Authorization: xenditAuthHeader(secretKey) },
  });
  const data = (await res.json().catch(() => ({}))) as { balance?: number; message?: string };
  if (!res.ok) throw new Error(data.message || 'Secret Key Xendit tidak valid.');

  return `Xendit ${mode === 'test' ? 'testing' : 'production'} aktif. Callback token tersimpan, balance endpoint terbaca${typeof data.balance === 'number' ? ` (Rp ${data.balance.toLocaleString('id-ID')})` : ''}.`;
}

async function testFonnteDevice(): Promise<string> {
  const apiToken = await getIntegrationSecret('fonnte', 'api_token', 'FONNTE_API_TOKEN');
  if (!apiToken) throw new Error('Fonnte API Token belum disimpan.');
  const device = await checkFonnteDevice(apiToken);
  if (!device.success) throw new Error(device.reason || 'Device Fonnte belum connected.');
  return `Fonnte aktif. Device ${device.device ?? '-'} status ${device.status ?? 'connected'}.`;
}

async function testFonnteMessage(formData: FormData): Promise<string> {
  const apiToken = await getIntegrationSecret('fonnte', 'api_token', 'FONNTE_API_TOKEN');
  if (!apiToken) throw new Error('Fonnte API Token belum disimpan.');
  const target = text(formData, 'target');
  if (!target) throw new Error('Isi nomor WhatsApp tujuan test.');
  const result = await sendWhatsAppMessage(apiToken, {
    target,
    message:
      'Tes koneksi WhatsApp Bananasbindery via Fonnte. Pesan ini terkirim dari halaman admin.',
  });
  if (!result.success) throw new Error(result.reason || 'Fonnte menolak pengiriman pesan.');
  return 'Pesan test Fonnte berhasil dikirim.';
}

export async function testIntegration(
  _prevState: IntegrationActionState,
  formData: FormData,
): Promise<IntegrationActionState> {
  await requireOwnerAdmin();
  const provider = text(formData, 'provider') as IntegrationProvider;
  const testType = text(formData, 'test_type');

  try {
    let message: string;
    if (provider === 'biteship' && testType === 'rates') {
      message = await testBiteshipRates(formData);
    } else if (provider === 'biteship' && testType === 'couriers') {
      message = await testBiteshipCouriers();
    } else if (provider === 'biteship' && testType === 'sandbox') {
      message = await testBiteshipSandboxKey();
    } else if (provider === 'biteship' && testType === 'order') {
      message = await testBiteshipOrderReadiness();
    } else if (provider === 'xendit') {
      message = await testXendit();
    } else if (provider === 'fonnte' && testType === 'device') {
      message = await testFonnteDevice();
    } else if (provider === 'fonnte' && testType === 'message') {
      message = await testFonnteMessage(formData);
    } else {
      throw new Error('Jenis test tidak valid.');
    }

    await recordIntegrationTestResult(provider, true, message);
    revalidatePath('/admin/integrations');
    return actionSuccess(message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Test integrasi gagal.';
    await recordIntegrationTestResult(provider, false, message);
    revalidatePath('/admin/integrations');
    return { status: 'error', message };
  }
}
