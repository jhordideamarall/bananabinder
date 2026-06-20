const BITESHIP_BASE_URL = 'https://api.biteship.com';

export interface BiteshipOrderItem {
  name: string;
  description: string;
  value: number;
  quantity: number;
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface BiteshipOrderPayload {
  shipper_contact_name: string;
  shipper_contact_phone: string;
  shipper_contact_email: string;
  shipper_organization: string;
  origin_contact_name: string;
  origin_contact_phone: string;
  origin_address: string;
  origin_note: string;
  origin_postal_code: number;
  origin_area_id: string;
  origin_coordinate?: {
    latitude: number;
    longitude: number;
  };
  destination_contact_name: string;
  destination_contact_phone: string;
  destination_contact_email: string;
  destination_address: string;
  destination_note: string;
  destination_postal_code: number;
  destination_area_id: string;
  destination_coordinate?: {
    latitude: number;
    longitude: number;
  };
  courier_company: string;
  courier_type: string;
  delivery_type: 'now' | 'later';
  origin_collection_method: 'pickup' | 'drop_off';
  items: BiteshipOrderItem[];
}

export interface BiteshipOrderResponse {
  id?: string;
  status?: string;
  courier?: {
    tracking_id?: string;
    waybill_id?: string;
    company?: string;
    type?: string;
    link?: string | null;
  };
  success?: boolean;
  error?: string;
  code?: number;
  message?: string;
  mocked?: boolean;
  [key: string]: unknown;
}

export function biteshipAuthHeader(apiKey: string): string {
  return apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
}

export async function createBiteshipOrder(
  apiKey: string,
  payload: BiteshipOrderPayload,
): Promise<{ ok: boolean; status: number; data: BiteshipOrderResponse }> {
  if (!apiKey) {
    throw new Error('BITESHIP_API_KEY belum dikonfigurasi.');
  }

  const response = await fetch(`${BITESHIP_BASE_URL}/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: biteshipAuthHeader(apiKey),
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as BiteshipOrderResponse;
  return { ok: response.ok, status: response.status, data };
}
