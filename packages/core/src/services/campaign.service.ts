// Pure deterministic campaign evaluator.
// Server (`create_order_v1`) re-implements identical logic in SQL — this file
// is the canonical reference for client preview math.

export type CampaignType = 'flash_sale' | 'product_discount' | 'free_shipping';
export type DiscountUnit = 'percentage' | 'fixed';
export type TargetScope = 'all' | 'products' | 'categories';
export type RegionScope = 'all' | 'radius';

export interface GeoZone {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
}

export interface CampaignInput {
  id: string;
  name: string;
  type: CampaignType;
  discountUnit: DiscountUnit;
  discountValue: number;
  maxDiscount: number | null;
  minOrder: number;
  targetScope: TargetScope;
  regionScope: RegionScope;
  priority: number;
  stackable: boolean;
  usageLimit: number | null;
  usageCount: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  productIds: ReadonlySet<string>;
  categoryIds: ReadonlySet<string>;
  geoZones: ReadonlyArray<GeoZone>;
}

export interface CartLineInput {
  productId: string;
  categoryId: string | null;
  quantity: number;
  unitPrice: number;
}

export interface EvaluationContext {
  lines: ReadonlyArray<CartLineInput>;
  destination: { latitude: number; longitude: number } | null;
  now: Date;
}

export interface AppliedItemDiscount {
  productId: string;
  amount: number;
}

export interface AppliedCampaign {
  campaignId: string;
  name: string;
  type: CampaignType;
  itemDiscounts: AppliedItemDiscount[];
  shippingDiscount: number;
  totalDiscount: number;
}

export interface EvaluationResult {
  applied: AppliedCampaign[];
  totalItemDiscount: number;
  totalShippingDiscount: number;
}

/**
 * Haversine distance in km between two lat/lng pairs.
 * Mirrors SQL function `public.haversine_km` exactly.
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function isCampaignActive(c: CampaignInput, now: Date): boolean {
  if (!c.isActive) return false;
  if (now < c.startsAt) return false;
  if (now > c.endsAt) return false;
  if (c.usageLimit !== null && c.usageCount >= c.usageLimit) return false;
  return true;
}

function lineMatchesScope(
  line: CartLineInput,
  scope: TargetScope,
  productIds: ReadonlySet<string>,
  categoryIds: ReadonlySet<string>,
): boolean {
  if (scope === 'all') return true;
  if (scope === 'products') return productIds.has(line.productId);
  if (scope === 'categories') return line.categoryId !== null && categoryIds.has(line.categoryId);
  return false;
}

function destinationInZone(
  c: CampaignInput,
  destination: EvaluationContext['destination'],
): boolean {
  if (c.regionScope === 'all') return true;
  if (destination === null) return false;
  if (c.geoZones.length === 0) return false;
  for (const z of c.geoZones) {
    if (
      haversineKm(z.centerLat, z.centerLng, destination.latitude, destination.longitude) <=
      z.radiusKm
    ) {
      return true;
    }
  }
  return false;
}

function computeDiscountAmount(
  unit: DiscountUnit,
  value: number,
  cap: number | null,
  base: number,
): number {
  if (base <= 0) return 0;
  let raw: number;
  if (unit === 'percentage') {
    raw = Math.round((base * value) / 100);
  } else {
    raw = value;
  }
  if (cap !== null && cap > 0) raw = Math.min(raw, cap);
  return Math.max(0, Math.min(raw, base));
}

function evaluateItemCampaigns(
  ctx: EvaluationContext,
  candidates: ReadonlyArray<CampaignInput>,
): { perCampaign: Map<string, AppliedItemDiscount[]>; lineLocked: Set<string> } {
  const sorted = [...candidates].sort((a, b) => a.priority - b.priority);
  const perCampaign = new Map<string, AppliedItemDiscount[]>();
  const lineLocked = new Set<string>();

  for (const c of sorted) {
    if (c.type !== 'flash_sale' && c.type !== 'product_discount') continue;
    if (!isCampaignActive(c, ctx.now)) continue;

    const stackable = c.type === 'flash_sale' ? false : c.stackable;

    const matched = ctx.lines.filter(
      (l) =>
        lineMatchesScope(l, c.targetScope, c.productIds, c.categoryIds) &&
        (stackable || !lineLocked.has(l.productId)),
    );
    if (matched.length === 0) continue;

    const matchedSubtotal = matched.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    if (matchedSubtotal < c.minOrder) continue;

    const totalDiscount = computeDiscountAmount(
      c.discountUnit,
      c.discountValue,
      c.maxDiscount,
      matchedSubtotal,
    );
    if (totalDiscount <= 0) continue;

    const lineDiscounts: AppliedItemDiscount[] = [];
    let allocated = 0;
    for (let i = 0; i < matched.length; i++) {
      const line = matched[i];
      const lineSubtotal = line.unitPrice * line.quantity;
      let share: number;
      if (i === matched.length - 1) {
        share = totalDiscount - allocated;
      } else {
        share = Math.round((lineSubtotal / matchedSubtotal) * totalDiscount);
        allocated += share;
      }
      lineDiscounts.push({ productId: line.productId, amount: Math.max(0, share) });
      if (!stackable) lineLocked.add(line.productId);
    }
    perCampaign.set(c.id, lineDiscounts);
  }

  return { perCampaign, lineLocked };
}

function evaluateShippingCampaigns(
  ctx: EvaluationContext,
  candidates: ReadonlyArray<CampaignInput>,
  cartSubtotal: number,
): { winnerId: string | null; subsidy: number } {
  let winnerId: string | null = null;
  let winnerSubsidy = 0;

  for (const c of candidates) {
    if (c.type !== 'free_shipping') continue;
    if (!isCampaignActive(c, ctx.now)) continue;
    if (cartSubtotal < c.minOrder) continue;
    if (!destinationInZone(c, ctx.destination)) continue;

    const subsidy = computeDiscountAmount(
      c.discountUnit,
      c.discountValue,
      c.maxDiscount,
      c.maxDiscount ?? c.discountValue,
    );
    if (subsidy > winnerSubsidy) {
      winnerSubsidy = subsidy;
      winnerId = c.id;
    }
  }

  return { winnerId, subsidy: winnerSubsidy };
}

export function evaluateCampaigns(
  ctx: EvaluationContext,
  candidates: ReadonlyArray<CampaignInput>,
): EvaluationResult {
  const cartSubtotal = ctx.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);

  const { perCampaign } = evaluateItemCampaigns(ctx, candidates);
  const shippingWinner = evaluateShippingCampaigns(ctx, candidates, cartSubtotal);

  const applied: AppliedCampaign[] = [];
  let totalItemDiscount = 0;

  for (const c of candidates) {
    const itemDiscounts = perCampaign.get(c.id);
    const isShippingWinner = c.id === shippingWinner.winnerId;
    if (!itemDiscounts && !isShippingWinner) continue;

    const items = itemDiscounts ?? [];
    const itemTotal = items.reduce((s, d) => s + d.amount, 0);
    const shippingAmt = isShippingWinner ? shippingWinner.subsidy : 0;

    totalItemDiscount += itemTotal;
    applied.push({
      campaignId: c.id,
      name: c.name,
      type: c.type,
      itemDiscounts: items,
      shippingDiscount: shippingAmt,
      totalDiscount: itemTotal + shippingAmt,
    });
  }

  return {
    applied,
    totalItemDiscount,
    totalShippingDiscount: shippingWinner.subsidy,
  };
}
