import type { ProductVariant } from '@bananasbindery/types/domain';

export interface CartTotals {
  subtotal: number;
  discount: number;
  voucherDiscount: number;
  loyaltyDiscount: number;
  tax: number;
  shippingCost: number;
  total: number;
}

export interface CartItemInput {
  quantity: number;
  unitPrice: number;
}

export const DEFAULT_TAX_RATE = 0.11;

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
 * Calculate the absorbed 11% tax (PPN) from a taxable amount.
 * Absorbed means it's part of the price, not added on top.
 */
export function calculateAbsorbedTax(amount: number): number {
  if (amount <= 0) return 0;
  return Math.round(amount * DEFAULT_TAX_RATE);
}

/**
 * Calculate full cart totals including discounts.
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

  const taxableAmount = Math.max(0, subtotal - discount - voucherDiscount - loyaltyDiscount);
  const tax = calculateAbsorbedTax(taxableAmount);
  const total = Math.max(0, taxableAmount + shippingCost);

  return { subtotal, discount, voucherDiscount, loyaltyDiscount, tax, shippingCost, total };
}
