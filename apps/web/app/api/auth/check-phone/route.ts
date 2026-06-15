import { NextResponse } from 'next/server';
import { phoneAccountExists } from '@/lib/phone-otp-server';

export const runtime = 'nodejs';

interface CheckPhoneRequest {
  phone?: unknown;
}

interface CheckPhoneResponse {
  exists: boolean;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function POST(request: Request): Promise<NextResponse<CheckPhoneResponse>> {
  let body: CheckPhoneRequest;

  try {
    const parsed: unknown = await request.json();
    body = isRecord(parsed) ? parsed : {};
  } catch {
    return NextResponse.json(
      { exists: false, error: 'Payload nomor HP tidak valid' },
      { status: 400 },
    );
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (!phone) {
    return NextResponse.json({ exists: false });
  }

  try {
    const exists = await phoneAccountExists(phone);
    return NextResponse.json({ exists });
  } catch (error: unknown) {
    console.error('[auth/check-phone] RPC failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { exists: false, error: 'Tidak bisa memeriksa nomor HP saat ini' },
      { status: 500 },
    );
  }
}
