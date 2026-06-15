export function formatIndonesiaPhone(phone: string): string {
  const normalized = phone.trim().replace(/[^\d+]/g, '');

  if (normalized.startsWith('+62')) {
    return normalized;
  }

  if (normalized.startsWith('62')) {
    return `+${normalized}`;
  }

  if (normalized.startsWith('0')) {
    return `+62${normalized.slice(1)}`;
  }

  return `+62${normalized}`;
}

export type PhoneOtpPurpose = 'login' | 'register' | 'checkout';

interface PhoneOtpSession {
  email: string;
  password: string;
  userId: string;
}

interface PhoneOtpSendParams {
  phone: string;
  purpose: PhoneOtpPurpose;
  name?: string;
}

interface PhoneOtpVerifyParams {
  phone: string;
  token: string;
  name?: string;
  email?: string;
  shouldCreateUser: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getResponseError(value: unknown, fallback: string): string {
  if (isRecord(value) && typeof value.error === 'string' && value.error.length > 0) {
    return value.error;
  }

  return fallback;
}

function isPhoneOtpSession(value: unknown): value is PhoneOtpSession {
  return (
    isRecord(value) &&
    typeof value.email === 'string' &&
    typeof value.password === 'string' &&
    typeof value.userId === 'string'
  );
}

export async function requestPhoneOtp(params: PhoneOtpSendParams): Promise<void> {
  const response = await fetch('/api/auth/phone-otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const result: unknown = await response.json().catch(() => ({}));

  if (!response.ok || !isRecord(result) || result.success !== true) {
    throw new Error(getResponseError(result, 'Gagal mengirim OTP'));
  }
}

export async function verifyPhoneOtpSession(
  params: PhoneOtpVerifyParams,
): Promise<PhoneOtpSession> {
  const response = await fetch('/api/auth/phone-otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const result: unknown = await response.json().catch(() => ({}));
  const session = isRecord(result) ? result.session : undefined;

  if (!response.ok || !isRecord(result) || result.success !== true || !isPhoneOtpSession(session)) {
    throw new Error(getResponseError(result, 'Kode OTP salah atau kedaluwarsa'));
  }

  return session;
}

export function getOtpSendErrorMessage(message?: string): string {
  const normalized = message?.toLowerCase() ?? '';

  if (
    normalized.includes('unsupported phone provider') ||
    normalized.includes('phone provider') ||
    normalized.includes('sms provider')
  ) {
    return 'Verifikasi nomor HP belum aktif. Admin perlu mengaktifkan Phone Auth dan Fonnte OTP di Supabase.';
  }

  if (normalized.includes('rate') || normalized.includes('too many')) {
    return 'Terlalu banyak percobaan OTP. Tunggu sebentar lalu coba lagi.';
  }

  return message || 'Gagal mengirim OTP';
}

export function getOtpVerifyErrorMessage(message?: string): string {
  const normalized = message?.toLowerCase() ?? '';

  if (normalized.includes('expired')) {
    return 'Kode OTP sudah kedaluwarsa. Kirim ulang kode lalu coba lagi.';
  }

  return message || 'Kode OTP salah atau kedaluwarsa';
}
