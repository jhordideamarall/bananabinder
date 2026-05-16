export interface ShippingValidationResult {
  isValid: boolean;
  reason?: string;
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
