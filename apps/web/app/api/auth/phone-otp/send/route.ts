import { NextResponse } from 'next/server';
import { isProtectedPhoneError, sendPhoneOtp } from '@/lib/phone-otp-server';

export const runtime = 'nodejs';

type OtpPurpose = 'login' | 'register' | 'checkout';

interface SendPhoneOtpBody {
  phone?: unknown;
  purpose?: unknown;
  name?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toPurpose(value: unknown): OtpPurpose {
  return value === 'login' || value === 'register' || value === 'checkout' ? value : 'checkout';
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Gagal mengirim OTP.';
}

export async function POST(request: Request): Promise<NextResponse> {
  const parsed: unknown = await request.json().catch(() => ({}));
  const body: SendPhoneOtpBody = isRecord(parsed) ? parsed : {};
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : undefined;

  if (!phone) {
    return NextResponse.json({ success: false, error: 'Nomor HP wajib diisi.' }, { status: 400 });
  }

  try {
    await sendPhoneOtp(phone, toPurpose(body.purpose), name);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: isProtectedPhoneError(error) ? 409 : 500 },
    );
  }
}
