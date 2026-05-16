import { NextResponse } from 'next/server';
import { checkFonnteDevice, sendWhatsAppMessage } from '@bananasbindery/api-client/fonnte';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import { createClient } from '@/lib/supabase/server';

const ADMIN_ROLES = ['admin', 'owner', 'staff'];

/**
 * Ensures the caller is an authenticated admin/owner/staff.
 * Returns an error response when not authorized, otherwise null.
 */
async function guardAdmin(): Promise<NextResponse | null> {
  const supabase = (await createClient()) as TypedSupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Tidak terautentikasi.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    return NextResponse.json({ success: false, error: 'Akses ditolak.' }, { status: 403 });
  }

  return null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Terjadi kesalahan tak terduga.';
}

/**
 * GET /api/test/fonnte
 * Verifies the Fonnte API token by checking the connected WhatsApp device.
 */
export async function GET(): Promise<NextResponse> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const apiKey = process.env.FONNTE_API_TOKEN;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'FONNTE_API_TOKEN belum dikonfigurasi di environment.' },
      { status: 503 },
    );
  }

  try {
    const device = await checkFonnteDevice(apiKey);
    return NextResponse.json(
      { success: device.success, device },
      { status: device.success ? 200 : 502 },
    );
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 502 });
  }
}

interface SendBody {
  target?: unknown;
  message?: unknown;
}

/**
 * POST /api/test/fonnte
 * Sends a test WhatsApp message. Body: { target: string, message?: string }.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const apiKey = process.env.FONNTE_API_TOKEN;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'FONNTE_API_TOKEN belum dikonfigurasi di environment.' },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as SendBody;
  const target = typeof body.target === 'string' ? body.target.trim() : '';
  const message =
    typeof body.message === 'string' && body.message.trim().length > 0
      ? body.message.trim()
      : 'Tes koneksi WhatsApp Bananasbindery via Fonnte. Pesan ini terkirim otomatis.';

  if (!target) {
    return NextResponse.json(
      { success: false, error: 'Field "target" (nomor WhatsApp) wajib diisi.' },
      { status: 400 },
    );
  }

  try {
    const result = await sendWhatsAppMessage(apiKey, { target, message });
    return NextResponse.json(
      { success: result.success, result },
      { status: result.success ? 200 : 502 },
    );
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 502 });
  }
}
