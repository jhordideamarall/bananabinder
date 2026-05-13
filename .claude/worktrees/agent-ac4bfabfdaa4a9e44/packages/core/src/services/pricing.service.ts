import type { ProductVariant } from '@bananasbindery/types/domain';

export interface CartTotals {
  subtotal: number;
  discount: number;
  voucherDiscount: number;
  loyaltyDiscount: number;
  shippingCost: number;
  total: number;
}

export interface CartItemInput {
  quantity: number;
  unitPrice: number;
}

/**
 * Get the effective display price for a product/variant.
 * Returns promoPrice if available and lower than regular price.
 */
export function calculateDisplayPrice(
  variant: Pick<ProductVariant, 'price' | 'promoPrice'>,
): number {
  if (variant.promoPrice !== null && variant.promoPrice < variant.price) {
    return variant.promoPrice;
  }
  return variant.price;
}

/**
 * Calculate full cart totals including discounts.
 * Full implementation in Phase 5.
 */
export function calculateCartTotal(
  items: CartItemInput[],
  options?: {
    voucherDiscount?: number;
    loyaltyPointsUsed?: number;
    shippingCost?: number;
  },
): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const voucherDiscount = options?.voucherDiscount ?? 0;
  const loyaltyDiscount = options?.loyaltyPointsUsed ?? 0;
  const shippingCost = options?.shippingCost ?? 0;
  const discount = 0;

  const total = Math.max(0, subtotal - discount - voucherDiscount - loyaltyDiscount + shippingCost);

  return { subtotal, discount, voucherDiscount, loyaltyDiscount, shippingCost, total };
}
