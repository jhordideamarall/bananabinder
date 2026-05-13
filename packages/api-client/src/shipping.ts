import type { ShippingOption, CartItem } from './types';

export type { ShippingOption };

/**
 * Fetch shipping rates from the API endpoint.
 * Platform-agnostic: accepts baseUrl so it works on web and mobile.
 * On web (same-origin), pass empty string for baseUrl.
 */
export async function getShippingRates(
  baseUrl: string,
  addressId: string,
  items: CartItem[],
): Promise<ShippingOption[]> {
  const response = await fetch(`${baseUrl}/api/shipping/rates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ addressId, items }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Gagal mengambil ongkir' }));
    throw new Error((err as { error?: string }).error || 'Gagal mengambil ongkir');
  }
  return (await response.json()) as ShippingOption[];
}
