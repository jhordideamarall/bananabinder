export interface ShippingValidationResult {
  isValid: boolean;
  reason?: string;
}

export const DEFAULT_SHIPPING_WEIGHT_GRAMS = 500;

export interface ShippingWeightItem {
  weight?: number | null;
  quantity?: number | null;
}

export interface PricedShippingOption {
  price: number;
}

/**
 * Normalizes a catalog/cart weight before it is sent to a courier API.
 * Biteship expects a positive integer measured in grams.
 */
export function normalizeShippingWeight(weight: number | null | undefined): number {
  if (!Number.isFinite(weight) || !weight || weight <= 0) {
    return DEFAULT_SHIPPING_WEIGHT_GRAMS;
  }

  return Math.max(1, Math.round(weight));
}

export function normalizeShippingQuantity(quantity: number | null | undefined): number {
  if (!Number.isFinite(quantity) || !quantity || quantity <= 0) return 1;
  return Math.max(1, Math.floor(quantity));
}

/**
 * Calculates the same total weight used by the courier payload and its cache key.
 */
export function calculateTotalShippingWeight(items: readonly ShippingWeightItem[]): number {
  return items.reduce((total, item) => {
    return total + normalizeShippingWeight(item.weight) * normalizeShippingQuantity(item.quantity);
  }, 0);
}

/**
 * Biteship does not guarantee that pricing is returned cheapest-first.
 * Keep all valid courier choices while making the lowest final price the default.
 */
export function sortShippingOptionsByPrice<T extends PricedShippingOption>(
  options: readonly T[],
): T[] {
  return [...options].sort((left, right) => {
    const leftPrice = Number.isFinite(left.price) ? left.price : Number.MAX_SAFE_INTEGER;
    const rightPrice = Number.isFinite(right.price) ? right.price : Number.MAX_SAFE_INTEGER;
    return leftPrice - rightPrice;
  });
}

/**
 * Validate product type is compatible with courier.
 * Parcel/bundle products can require supported courier dimensions and distance rules.
 * Full implementation in Phase 5.
 */
export function validateProductTypeForCourier(
  productType: string,
  courierCode: string,
  distanceKm: number,
): ShippingValidationResult {
  if (productType === 'parcel') {
    const isInstantCourier = courierCode === 'gojek' || courierCode === 'grab';
    if (isInstantCourier && distanceKm > 15) {
      return { isValid: false, reason: 'Pengiriman instant untuk bundle besar maksimal 15km.' };
    }
  }
  return { isValid: true };
}

/**
 * Check if same-day delivery is available based on order time and distance.
 * Cut-off: 14:00 WIB (UTC+7). Full implementation in Phase 5.
 */
export function isSameDayAvailable(orderTime: Date, distanceKm: number): boolean {
  const SAME_DAY_CUTOFF_HOUR = 14;
  const MAX_SAME_DAY_DISTANCE_KM = 15;
  const WIB_OFFSET_HOURS = 7;

  const utcHour = orderTime.getUTCHours();
  const wibHour = (utcHour + WIB_OFFSET_HOURS) % 24;

  return wibHour < SAME_DAY_CUTOFF_HOUR && distanceKm <= MAX_SAME_DAY_DISTANCE_KM;
}
