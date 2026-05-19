import 'server-only';

import { Buffer } from 'node:buffer';
import { createClient } from '@supabase/supabase-js';

export type IntegrationProvider = 'xendit' | 'biteship' | 'fonnte';
export type IntegrationMode = 'production' | 'test';
export type IntegrationSecretKey =
  | 'secret_key'
  | 'test_secret_key'
  | 'callback_token'
  | 'test_callback_token'
  | 'api_key'
  | 'test_api_key'
  | 'webhook_token'
  | 'mode'
  | 'origin_area_id'
  | 'api_token';

export interface IntegrationSecretStatus {
  provider: IntegrationProvider;
  secret_key: IntegrationSecretKey;
  is_configured: boolean;
  last_test_status: 'success' | 'failed' | null;
  last_test_message: string | null;
  last_tested_at: string | null;
  updated_at: string | null;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function readIntegrationSecret(
  provider: IntegrationProvider,
  secretKey: IntegrationSecretKey,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return '';

  const { data, error } = await supabase.rpc('get_integration_secret', {
    p_provider: provider,
    p_secret_key: secretKey,
  });

  if (error) {
    console.warn(`INTEGRATION_SECRET_READ_WARN ${provider}.${secretKey}:`, error.message);
    return '';
  }

  return typeof data === 'string' ? data.trim() : '';
}

export async function getIntegrationMode(
  provider: Extract<IntegrationProvider, 'xendit' | 'biteship'>,
): Promise<IntegrationMode> {
  const mode = await readIntegrationSecret(provider, 'mode');
  return mode === 'test' ? 'test' : 'production';
}

function activeSecretKey(
  provider: IntegrationProvider,
  secretKey: IntegrationSecretKey,
  mode: IntegrationMode,
): { secretKey: IntegrationSecretKey; envFallback?: string } {
  if (mode !== 'test') return { secretKey };

  if (provider === 'xendit' && secretKey === 'secret_key') {
    return { secretKey: 'test_secret_key', envFallback: 'XENDIT_TEST_SECRET_KEY' };
  }

  if (provider === 'xendit' && secretKey === 'callback_token') {
    return { secretKey: 'test_callback_token', envFallback: 'XENDIT_TEST_CALLBACK_TOKEN' };
  }

  if (provider === 'biteship' && secretKey === 'api_key') {
    return { secretKey: 'test_api_key', envFallback: 'BITESHIP_TEST_API_KEY' };
  }

  return { secretKey };
}

export async function getIntegrationSecret(
  provider: IntegrationProvider,
  secretKey: IntegrationSecretKey,
  envFallback?: string,
): Promise<string> {
  let mapped = { secretKey, envFallback };
  if ((provider === 'xendit' || provider === 'biteship') && secretKey !== 'mode') {
    const mode = await getIntegrationMode(provider);
    const active = activeSecretKey(provider, secretKey, mode);
    mapped = {
      secretKey: active.secretKey,
      envFallback: active.envFallback ?? envFallback,
    };
  }

  const fallback = mapped.envFallback ? (process.env[mapped.envFallback] ?? '').trim() : '';
  const secret = await readIntegrationSecret(provider, mapped.secretKey);
  return secret || fallback;
}

export async function listIntegrationSecretStatuses(): Promise<IntegrationSecretStatus[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('integration_secrets')
    .select(
      'provider, secret_key, is_configured, last_test_status, last_test_message, last_tested_at, updated_at',
    )
    .order('provider', { ascending: true })
    .order('secret_key', { ascending: true });

  if (error) {
    console.warn('INTEGRATION_SECRET_STATUS_WARN:', error.message);
    return [];
  }

  return (data ?? []) as IntegrationSecretStatus[];
}

export async function recordIntegrationTestResult(
  provider: IntegrationProvider,
  success: boolean,
  message: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { error } = await supabase.rpc('admin_record_integration_test', {
    p_provider: provider,
    p_status: success ? 'success' : 'failed',
    p_message: message,
  });

  if (error) {
    console.warn(`INTEGRATION_TEST_RECORD_WARN ${provider}:`, error.message);
  }
}

export function xenditAuthHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

export function biteshipAuthHeader(apiKey: string): string {
  return apiKey;
}
