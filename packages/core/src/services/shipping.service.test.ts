import { describe, expect, it } from 'vitest';
import {
  calculateTotalShippingWeight,
  DEFAULT_SHIPPING_WEIGHT_GRAMS,
  normalizeShippingQuantity,
  normalizeShippingWeight,
  sortShippingOptionsByPrice,
} from './shipping.service';

describe('shipping.service', () => {
  it('normalizes missing or invalid weights to the safe gram fallback', () => {
    expect(normalizeShippingWeight(undefined)).toBe(DEFAULT_SHIPPING_WEIGHT_GRAMS);
    expect(normalizeShippingWeight(0)).toBe(DEFAULT_SHIPPING_WEIGHT_GRAMS);
    expect(normalizeShippingWeight(-100)).toBe(DEFAULT_SHIPPING_WEIGHT_GRAMS);
    expect(normalizeShippingWeight(349.6)).toBe(350);
  });

  it('uses one normalized calculation for payload and cache weight', () => {
    expect(
      calculateTotalShippingWeight([
        { weight: 350, quantity: 2 },
        { weight: null, quantity: 1 },
      ]),
    ).toBe(1_200);
  });

  it('normalizes invalid quantities before calculating courier weight', () => {
    expect(normalizeShippingQuantity(2.9)).toBe(2);
    expect(normalizeShippingQuantity(0)).toBe(1);
    expect(calculateTotalShippingWeight([{ weight: 350, quantity: -2 }])).toBe(350);
  });

  it('returns a cheapest-first copy without mutating courier results', () => {
    const original = [
      { id: 'instant', price: 21_000 },
      { id: 'regular', price: 16_000 },
      { id: 'same-day', price: 18_000 },
    ];

    const sorted = sortShippingOptionsByPrice(original);

    expect(sorted.map((option) => option.id)).toEqual(['regular', 'same-day', 'instant']);
    expect(original.map((option) => option.id)).toEqual(['instant', 'regular', 'same-day']);
  });
});
