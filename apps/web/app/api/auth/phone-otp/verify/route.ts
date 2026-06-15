import { NextResponse } from 'next/server';
import { isProtectedPhoneError, verifyPhoneOtp } from '@/lib/phone-otp-server';

export const runtime = 'nodejs';

interface VerifyPhoneOtpBody {
  phone?: unknown;
  token?: unknown;
  name?: unknown;
  email?: unknown;
  shouldCreateUser?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Gagal memverifikasi OTP.';
}

export async function POST(request: Request): Promise<NextResponse> {
  const parsed: unknown = await request.json().catch(() => ({}));
  const body: VerifyPhoneOtpBody = isRecord(parsed) ? parsed : {};
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const token = typeof body.token === 'string' ? body.token.trim() : '';

  if (!phone || !token) {
    return NextResponse.json(
      { success: false, error: 'Nomor HP dan kode OTP wajib diisi.' },
      { status: 400 },
    );
  }

  try {
    const session = await verifyPhoneOtp({
      phone,
      token,
      name: typeof body.name === 'string' ? body.name.trim() : undefined,
      email: typeof body.email === 'string' ? body.email.trim() : undefined,
      shouldCreateUser: body.shouldCreateUser === true,
    });

    return NextResponse.json({ success: true, session });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: isProtectedPhoneError(error) ? 409 : 400 },
    );
  }
}
