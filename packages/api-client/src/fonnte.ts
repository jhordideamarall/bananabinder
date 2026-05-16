/**
 * Fonnte WhatsApp API client.
 *
 * Wraps the Fonnte REST API so application/UI code never calls it directly.
 * Platform-agnostic: the API token is passed in, never read from a global,
 * so the same client works on web and future mobile.
 *
 * Docs: https://docs.fonnte.com
 */

const FONNTE_BASE_URL = 'https://api.fonnte.com';

export interface FonnteSendParams {
  /** Destination phone number in international format without `+`, e.g. `6281234567890`. */
  target: string;
  /** Message body. */
  message: string;
  /** Optional override sender device number (Fonnte multi-device accounts). */
  countryCode?: string;
}

export interface FonnteSendResult {
  success: boolean;
  /** Raw `status` field from Fonnte (true/false or detail string). */
  status: boolean | string;
  /** IDs of queued messages, when provided by Fonnte. */
  id?: string[];
  /** Human-readable reason on failure. */
  reason?: string;
}

export interface FonnteDeviceResult {
  success: boolean;
  /** Connected device phone number. */
  device?: string;
  /** Device connection state, e.g. `connect` / `disconnect`. */
  status?: string;
  /** Remaining message quota, when provided. */
  quota?: number;
  reason?: string;
}

interface FonnteRawResponse {
  status?: boolean | string;
  reason?: string;
  id?: string[];
  device?: string;
  quota?: number | string;
  message?: string;
}

function normalizePhone(input: string): string {
  const digits = input.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

async function fonnteRequest(
  path: string,
  apiKey: string,
  body?: Record<string, string>,
): Promise<FonnteRawResponse> {
  const response = await fetch(`${FONNTE_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });

  const raw = (await response.json().catch(() => ({}))) as FonnteRawResponse;

  if (!response.ok) {
    throw new Error(raw.reason || raw.message || `Fonnte request gagal (${response.status})`);
  }

  return raw;
}

/**
 * Send a WhatsApp message through Fonnte.
 * Throws on network/HTTP error; returns `{ success: false }` on a logical Fonnte failure.
 */
export async function sendWhatsAppMessage(
  apiKey: string,
  params: FonnteSendParams,
): Promise<FonnteSendResult> {
  if (!apiKey) {
    throw new Error('FONNTE_API_KEY belum dikonfigurasi.');
  }
  if (!params.target || !params.message) {
    throw new Error('Target dan message Fonnte wajib diisi.');
  }

  const raw = await fonnteRequest('/send', apiKey, {
    target: normalizePhone(params.target),
    message: params.message,
    countryCode: params.countryCode ?? '62',
  });

  const ok = raw.status === true || raw.status === 'true';
  return {
    success: ok,
    status: raw.status ?? false,
    id: raw.id,
    reason: ok ? undefined : raw.reason || 'Fonnte menolak pengiriman pesan.',
  };
}

/**
 * Check the connected Fonnte device. Useful to verify the API token is valid
 * and the WhatsApp sender is online before relying on notifications.
 */
export async function checkFonnteDevice(apiKey: string): Promise<FonnteDeviceResult> {
  if (!apiKey) {
    throw new Error('FONNTE_API_KEY belum dikonfigurasi.');
  }

  const raw = await fonnteRequest('/device', apiKey);
  const ok = raw.status === true || raw.status === 'true' || Boolean(raw.device);

  return {
    success: ok,
    device: raw.device,
    status: typeof raw.status === 'string' ? raw.status : ok ? 'connect' : 'unknown',
    quota: typeof raw.quota === 'string' ? Number(raw.quota) : raw.quota,
    reason: ok ? undefined : raw.reason || 'Device Fonnte tidak terhubung.',
  };
}
