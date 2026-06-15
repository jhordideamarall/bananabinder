import 'server-only';

import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage } from '@bananasbindery/api-client/fonnte';
import { getIntegrationSecret } from '@/lib/integration-secrets';
import { formatIndonesiaPhone } from '@/lib/auth-otp';

type OtpPurpose = 'login' | 'register' | 'checkout';

interface OtpChallengeRow {
  id: string;
  normalized_phone: string;
  otp_hash: string;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  consumed_at: string | null;
}

interface ProfileLookupRow {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
}

interface VerifiedPhoneSession {
  email: string;
  password: string;
  userId: string;
}

interface VerifyPhoneOtpParams {
  phone: string;
  token: string;
  name?: string;
  email?: string;
  shouldCreateUser: boolean;
}

const OTP_EXPIRY_MINUTES = 5;
const OTP_LENGTH = 6;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Konfigurasi Supabase service role belum lengkap.');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getOtpSecret(): string {
  return process.env.PHONE_OTP_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function hashOtp(phone: string, otp: string): string {
  const secret = getOtpSecret();

  if (!secret) {
    throw new Error('PHONE_OTP_HASH_SECRET belum dikonfigurasi.');
  }

  return createHmac('sha256', secret).update(`${phone}:${otp}`).digest('hex');
}

function isHashMatch(expectedHash: string, actualHash: string): boolean {
  const expected = Buffer.from(expectedHash, 'hex');
  const actual = Buffer.from(actualHash, 'hex');

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

function internalEmailForPhone(phone: string): string {
  return `phone.${phoneDigits(phone)}@auth.bananasbindery.local`;
}

function phoneVariants(phone: string): string[] {
  const e164 = formatIndonesiaPhone(phone);
  const digits = phoneDigits(e164);
  const local = digits.startsWith('62') ? `0${digits.slice(2)}` : phoneDigits(phone);

  return Array.from(new Set([phone, e164, digits, local].filter(Boolean)));
}

function generateOtp(): string {
  return randomInt(0, 10 ** OTP_LENGTH)
    .toString()
    .padStart(OTP_LENGTH, '0');
}

function generatePassword(): string {
  return `${randomBytes(24).toString('base64url')}Aa1!`;
}

function getExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

function getDisplayName(name: string | undefined): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'Pelanggan';
}

function resolveDisplayName(name: string | undefined, fallbackName?: string | null): string {
  const trimmed = name?.trim();
  const fallback = fallbackName?.trim();

  if (trimmed && trimmed.length > 0) return trimmed;
  if (fallback && fallback.length > 0) return fallback;

  return 'Pelanggan';
}

async function findProfileByPhone(phone: string): Promise<ProfileLookupRow | null> {
  const supabase = getSupabaseAdmin();
  const variants = phoneVariants(phone);
  const internalEmail = internalEmailForPhone(phone);

  const { data: phoneProfile, error: phoneError } = await supabase
    .from('profiles')
    .select('id, email, phone, name')
    .in('phone', variants)
    .limit(1)
    .maybeSingle();

  if (phoneError) {
    throw new Error(`Gagal mengecek profil nomor HP: ${phoneError.message}`);
  }

  if (phoneProfile) {
    return phoneProfile as ProfileLookupRow;
  }

  const { data: emailProfile, error: emailError } = await supabase
    .from('profiles')
    .select('id, email, phone, name')
    .eq('email', internalEmail)
    .limit(1)
    .maybeSingle();

  if (emailError) {
    throw new Error(`Gagal mengecek profil nomor HP: ${emailError.message}`);
  }

  return emailProfile as ProfileLookupRow | null;
}

async function upsertProfilePhone(
  userId: string,
  params: VerifyPhoneOtpParams,
  existingProfile?: ProfileLookupRow | null,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const normalizedPhone = formatIndonesiaPhone(params.phone);
  const fallbackEmail = internalEmailForPhone(normalizedPhone);
  const profileEmail = existingProfile?.email?.trim();
  const profileName = existingProfile?.name?.trim();

  const { error } = await supabase.from('profiles').upsert(
    {
      id: userId,
      name: resolveDisplayName(params.name, profileName),
      phone: normalizedPhone,
      email: params.email?.trim() || profileEmail || fallbackEmail,
      role: 'customer',
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw new Error(`Gagal menyimpan profil customer: ${error.message}`);
  }
}

async function prepareAuthUser(params: VerifyPhoneOtpParams): Promise<VerifiedPhoneSession> {
  const supabase = getSupabaseAdmin();
  const normalizedPhone = formatIndonesiaPhone(params.phone);
  const profile = await findProfileByPhone(normalizedPhone);
  const sessionEmail = profile?.email || internalEmailForPhone(normalizedPhone);
  const password = generatePassword();
  const displayName = resolveDisplayName(params.name, profile?.name);

  if (profile) {
    const { error } = await supabase.auth.admin.updateUserById(profile.id, {
      email: sessionEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: displayName,
        phone: normalizedPhone,
        auth_channel: 'fonnte_otp',
      },
    });

    if (error) {
      throw new Error(`Gagal menyiapkan sesi customer: ${error.message}`);
    }

    await upsertProfilePhone(profile.id, params, profile);
    return { email: sessionEmail, password, userId: profile.id };
  }

  if (!params.shouldCreateUser) {
    throw new Error('Nomor HP belum terdaftar. Silakan daftar terlebih dahulu.');
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: sessionEmail,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: getDisplayName(params.name),
      phone: normalizedPhone,
      auth_channel: 'fonnte_otp',
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Gagal membuat akun customer.');
  }

  await upsertProfilePhone(data.user.id, params);
  return { email: sessionEmail, password, userId: data.user.id };
}

export async function phoneAccountExists(phone: string): Promise<boolean> {
  const profile = await findProfileByPhone(formatIndonesiaPhone(phone));

  if (profile) {
    return true;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('check_phone_in_auth', { p_phone: phone });

  if (error) {
    throw new Error(`Gagal mengecek auth phone: ${error.message}`);
  }

  return data === true;
}

export async function sendPhoneOtp(
  phone: string,
  purpose: OtpPurpose,
  name?: string,
): Promise<void> {
  const normalizedPhone = formatIndonesiaPhone(phone);
  const otp = generateOtp();
  const apiKey = await getIntegrationSecret('fonnte', 'api_token', 'FONNTE_API_TOKEN');

  if (!apiKey) {
    throw new Error('Token Fonnte belum dikonfigurasi.');
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('phone_otp_challenges').insert({
    normalized_phone: normalizedPhone,
    otp_hash: hashOtp(normalizedPhone, otp),
    purpose,
    expires_at: getExpiryDate().toISOString(),
  });

  if (error) {
    throw new Error(`Gagal membuat OTP: ${error.message}`);
  }

  const message = `Halo Kak ${getDisplayName(name)}!\n\nKode verifikasi Bananasbindery kamu:\n\n*${otp}*\n\nKode berlaku ${OTP_EXPIRY_MINUTES} menit. Jangan berikan kode ini kepada siapa pun.`;
  const result = await sendWhatsAppMessage(apiKey, {
    target: normalizedPhone,
    message,
  });

  if (!result.success) {
    throw new Error(result.reason || 'Fonnte gagal mengirim OTP.');
  }
}

export async function verifyPhoneOtp(params: VerifyPhoneOtpParams): Promise<VerifiedPhoneSession> {
  const normalizedPhone = formatIndonesiaPhone(params.phone);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('phone_otp_challenges')
    .select('id, normalized_phone, otp_hash, attempts, max_attempts, expires_at, consumed_at')
    .eq('normalized_phone', normalizedPhone)
    .is('consumed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal memeriksa OTP: ${error.message}`);
  }

  const challenge = data as OtpChallengeRow | null;

  if (!challenge) {
    throw new Error('Kode OTP tidak ditemukan atau sudah kedaluwarsa.');
  }

  if (challenge.attempts >= challenge.max_attempts) {
    throw new Error('Terlalu banyak percobaan OTP. Kirim ulang kode baru.');
  }

  const actualHash = hashOtp(normalizedPhone, params.token);

  if (!isHashMatch(challenge.otp_hash, actualHash)) {
    await supabase
      .from('phone_otp_challenges')
      .update({ attempts: challenge.attempts + 1 })
      .eq('id', challenge.id);
    throw new Error('Kode OTP salah.');
  }

  const session = await prepareAuthUser(params);

  await supabase
    .from('phone_otp_challenges')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', challenge.id);

  return session;
}
