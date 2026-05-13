export interface ShippingValidationResult {
  isValid: boolean;
  reason?: string;
}

/**
 * Validate product type is compatible with courier.
 * Frozen products only allowed for same-day couriers within 15km.
 * Full implementation in Phase 5.
 */
export function validateProductTypeForCourier(
  productType: string,
  courierCode: string,
  distanceKm: number,
): ShippingValidationResult {
  if (productType === 'frozen') {
    const isSameDay = courierCode === 'same-day';
    if (!isSameDay) {
      return { isValid: false, reason: 'Produk frozen hanya tersedia pengiriman same-day.' };
    }
    if (distanceKm > 15) {
      return { isValid: false, reason: 'Pengiriman same-day untuk produk frozen maksimal 15km.' };
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
