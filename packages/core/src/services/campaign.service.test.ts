import { describe, it, expect } from 'vitest';
import {
  evaluateCampaigns,
  haversineKm,
  type CampaignInput,
  type CartLineInput,
  type EvaluationContext,
} from './campaign.service';

const NOW = new Date('2026-05-17T12:00:00Z');

// Jakarta Pusat reference
const JAKARTA = { latitude: -6.1944, longitude: 106.8229 };
// Bogor (~50km dari Jakarta)
const BOGOR = { latitude: -6.595, longitude: 106.8167 };
// Surabaya (~700km dari Jakarta)
const SURABAYA = { latitude: -7.2575, longitude: 112.7521 };

function baseCtx(
  lines: CartLineInput[],
  destination: EvaluationContext['destination'] = null,
): EvaluationContext {
  return { lines, destination, now: NOW };
}

function makeCampaign(overrides: Partial<CampaignInput>): CampaignInput {
  return {
    id: 'c1',
    name: 'Test',
    type: 'product_discount',
    discountUnit: 'percentage',
    discountValue: 10,
    maxDiscount: null,
    minOrder: 0,
    targetScope: 'all',
    regionScope: 'all',
    priority: 10,
    stackable: false,
    usageLimit: null,
    usageCount: 0,
    startsAt: new Date('2026-01-01T00:00:00Z'),
    endsAt: new Date('2027-01-01T00:00:00Z'),
    isActive: true,
    productIds: new Set(),
    categoryIds: new Set(),
    geoZones: [],
    ...overrides,
  };
}

describe('haversineKm', () => {
  it('returns ~0 for identical points', () => {
    expect(
      haversineKm(JAKARTA.latitude, JAKARTA.longitude, JAKARTA.latitude, JAKARTA.longitude),
    ).toBeLessThan(0.01);
  });

  it('Jakarta → Bogor is approximately 45-55 km', () => {
    const d = haversineKm(JAKARTA.latitude, JAKARTA.longitude, BOGOR.latitude, BOGOR.longitude);
    expect(d).toBeGreaterThan(40);
    expect(d).toBeLessThan(60);
  });

  it('Jakarta → Surabaya is approximately 660-720 km', () => {
    const d = haversineKm(
      JAKARTA.latitude,
      JAKARTA.longitude,
      SURABAYA.latitude,
      SURABAYA.longitude,
    );
    expect(d).toBeGreaterThan(660);
    expect(d).toBeLessThan(720);
  });
});

describe('evaluateCampaigns', () => {
  describe('inactive / expired campaigns', () => {
    it('skips inactive campaigns', () => {
      const result = evaluateCampaigns(
        baseCtx([{ productId: 'p1', categoryId: null, quantity: 1, unitPrice: 100000 }]),
        [makeCampaign({ isActive: false })],
      );
      expect(result.applied).toHaveLength(0);
    });

    it('skips campaigns before start date', () => {
      const result = evaluateCampaigns(
        baseCtx([{ productId: 'p1', categoryId: null, quantity: 1, unitPrice: 100000 }]),
        [makeCampaign({ startsAt: new Date('2027-01-01T00:00:00Z') })],
      );
      expect(result.applied).toHaveLength(0);
    });

    it('skips campaigns at usage limit', () => {
      const result = evaluateCampaigns(
        baseCtx([{ productId: 'p1', categoryId: null, quantity: 1, unitPrice: 100000 }]),
        [makeCampaign({ usageLimit: 10, usageCount: 10 })],
      );
      expect(result.applied).toHaveLength(0);
    });
  });

  describe('product discount math', () => {
    it('applies 10% to all matching lines', () => {
      const result = evaluateCampaigns(
        baseCtx([{ productId: 'p1', categoryId: null, quantity: 2, unitPrice: 50000 }]),
        [makeCampaign({ discountValue: 10 })],
      );
      expect(result.totalItemDiscount).toBe(10000);
    });

    it('caps percentage discount at maxDiscount', () => {
      const result = evaluateCampaigns(
        baseCtx([{ productId: 'p1', categoryId: null, quantity: 1, unitPrice: 1000000 }]),
        [makeCampaign({ discountValue: 50, maxDiscount: 100000 })],
      );
      expect(result.totalItemDiscount).toBe(100000);
    });

    it('applies fixed amount discount', () => {
      const result = evaluateCampaigns(
        baseCtx([{ productId: 'p1', categoryId: null, quantity: 1, unitPrice: 100000 }]),
        [makeCampaign({ discountUnit: 'fixed', discountValue: 15000 })],
      );
      expect(result.totalItemDiscount).toBe(15000);
    });

    it('skips if cart subtotal below minOrder', () => {
      const result = evaluateCampaigns(
        baseCtx([{ productId: 'p1', categoryId: null, quantity: 1, unitPrice: 50000 }]),
        [makeCampaign({ minOrder: 100000 })],
      );
      expect(result.applied).toHaveLength(0);
    });
  });

  describe('scope filtering', () => {
    it('targets specific products only', () => {
      const result = evaluateCampaigns(
        baseCtx([
          { productId: 'p1', categoryId: null, quantity: 1, unitPrice: 100000 },
          { productId: 'p2', categoryId: null, quantity: 1, unitPrice: 100000 },
        ]),
        [makeCampaign({ targetScope: 'products', productIds: new Set(['p1']), discountValue: 10 })],
      );
      expect(result.totalItemDiscount).toBe(10000);
    });

    it('targets specific categories only', () => {
      const result = evaluateCampaigns(
        baseCtx([
          { productId: 'p1', categoryId: 'cat-a', quantity: 1, unitPrice: 100000 },
          { productId: 'p2', categoryId: 'cat-b', quantity: 1, unitPrice: 100000 },
        ]),
        [makeCampaign({ targetScope: 'categories', categoryIds: new Set(['cat-a']) })],
      );
      expect(result.applied[0].itemDiscounts[0].productId).toBe('p1');
    });
  });

  describe('stacking', () => {
    it('non-stackable locks line', () => {
      const result = evaluateCampaigns(
        baseCtx([{ productId: 'p1', categoryId: null, quantity: 1, unitPrice: 100000 }]),
        [
          makeCampaign({ id: 'c1', priority: 1, stackable: false, discountValue: 10 }),
          makeCampaign({ id: 'c2', priority: 2, stackable: false, discountValue: 20 }),
        ],
      );
      expect(result.applied).toHaveLength(1);
      expect(result.applied[0].campaignId).toBe('c1');
    });
  });

  describe('free shipping (geo radius)', () => {
    it('matches when destination is inside zone', () => {
      const result = evaluateCampaigns(
        baseCtx([{ productId: 'p1', categoryId: null, quantity: 1, unitPrice: 200000 }], BOGOR),
        [
          makeCampaign({
            type: 'free_shipping',
            discountUnit: 'fixed',
            discountValue: 30000,
            maxDiscount: 30000,
            regionScope: 'radius',
            geoZones: [{ centerLat: JAKARTA.latitude, centerLng: JAKARTA.longitude, radiusKm: 80 }],
          }),
        ],
      );
      expect(result.totalShippingDiscount).toBe(30000);
    });

    it('rejects when destination is outside zone', () => {
      const result = evaluateCampaigns(
        baseCtx([{ productId: 'p1', categoryId: null, quantity: 1, unitPrice: 200000 }], SURABAYA),
        [
          makeCampaign({
            type: 'free_shipping',
            discountUnit: 'fixed',
            discountValue: 30000,
            maxDiscount: 30000,
            regionScope: 'radius',
            geoZones: [{ centerLat: JAKARTA.latitude, centerLng: JAKARTA.longitude, radiusKm: 80 }],
          }),
        ],
      );
      expect(result.totalShippingDiscount).toBe(0);
    });

    it('matches if ANY zone matches (OR logic)', () => {
      const result = evaluateCampaigns(
        baseCtx([{ productId: 'p1', categoryId: null, quantity: 1, unitPrice: 200000 }], SURABAYA),
        [
          makeCampaign({
            type: 'free_shipping',
            discountUnit: 'fixed',
            discountValue: 25000,
            maxDiscount: 25000,
            regionScope: 'radius',
            geoZones: [
              { centerLat: JAKARTA.latitude, centerLng: JAKARTA.longitude, radiusKm: 50 },
              { centerLat: SURABAYA.latitude, centerLng: SURABAYA.longitude, radiusKm: 30 },
            ],
          }),
        ],
      );
      expect(result.totalShippingDiscount).toBe(25000);
    });

    it('regionScope=all matches any destination including null', () => {
      const result = evaluateCampaigns(
        baseCtx([{ productId: 'p1', categoryId: null, quantity: 1, unitPrice: 200000 }], null),
        [
          makeCampaign({
            type: 'free_shipping',
            discountUnit: 'fixed',
            discountValue: 10000,
            maxDiscount: 10000,
            regionScope: 'all',
          }),
        ],
      );
      expect(result.totalShippingDiscount).toBe(10000);
    });

    it('picks largest shipping subsidy when multiple match', () => {
      const result = evaluateCampaigns(
        baseCtx([{ productId: 'p1', categoryId: null, quantity: 1, unitPrice: 500000 }], JAKARTA),
        [
          makeCampaign({
            id: 'small',
            type: 'free_shipping',
            discountUnit: 'fixed',
            discountValue: 10000,
            maxDiscount: 10000,
          }),
          makeCampaign({
            id: 'big',
            type: 'free_shipping',
            discountUnit: 'fixed',
            discountValue: 50000,
            maxDiscount: 50000,
          }),
        ],
      );
      expect(result.totalShippingDiscount).toBe(50000);
    });
  });
});
