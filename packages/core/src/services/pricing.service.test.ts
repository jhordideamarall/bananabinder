import { describe, expect, it } from 'vitest';
import { calculateAbsorbedTax, calculateCartTotal, calculateDisplayPrice } from './pricing.service.js';

describe('pricing.service', () => {
  it('uses promo price only when lower than regular price', () => {
    expect(calculateDisplayPrice({ price: 100_000, promoPrice: 85_000 })).toBe(85_000);
    expect(calculateDisplayPrice({ price: 100_000, promoPrice: 120_000 })).toBe(100_000);
    expect(calculateDisplayPrice({ price: 100_000, promoPrice: null })).toBe(100_000);
  });

  it('records absorbed 11% tax without adding it to the customer total', () => {
    const totals = calculateCartTotal(
      [
        { unitPrice: 100_000, quantity: 2 },
        { unitPrice: 50_000, quantity: 1 },
      ],
      { shippingCost: 15_000 },
    );

    expect(totals.subtotal).toBe(250_000);
    expect(totals.tax).toBe(27_500);
    expect(totals.total).toBe(265_000);
  });

  it('applies voucher and loyalty discounts before absorbed tax', () => {
    const totals = calculateCartTotal([{ unitPrice: 100_000, quantity: 1 }], {
      voucherDiscount: 10_000,
      loyaltyPointsUsed: 5_000,
      shippingCost: 12_000,
    });

    expect(totals.tax).toBe(9_350);
    expect(totals.total).toBe(97_000);
  });

  it('never returns negative taxable totals', () => {
    const totals = calculateCartTotal([{ unitPrice: 10_000, quantity: 1 }], {
      voucherDiscount: 20_000,
    });

    expect(totals.tax).toBe(0);
    expect(totals.total).toBe(0);
    expect(calculateAbsorbedTax(-10_000)).toBe(0);
  });
});
