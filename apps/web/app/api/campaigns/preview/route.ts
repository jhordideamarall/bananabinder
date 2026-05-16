import { NextResponse, type NextRequest } from 'next/server';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import { getActiveCampaigns } from '@bananasbindery/api-client/campaigns';
import {
  evaluateCampaigns,
  type CartLineInput,
  type EvaluationContext,
} from '@bananasbindery/core/campaign';
import { createClient } from '@/lib/supabase/server';

interface RawCartLine {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface RawDestination {
  latitude: number;
  longitude: number;
}

interface RawBody {
  items: RawCartLine[];
  destination?: RawDestination | null;
}

function parseBody(input: unknown): RawBody | null {
  if (typeof input !== 'object' || input === null) return null;
  const obj = input as Record<string, unknown>;
  if (!Array.isArray(obj.items)) return null;

  const items: RawCartLine[] = [];
  for (const raw of obj.items) {
    if (typeof raw !== 'object' || raw === null) continue;
    const r = raw as Record<string, unknown>;
    const productId = typeof r.productId === 'string' ? r.productId : null;
    const quantity = typeof r.quantity === 'number' && r.quantity > 0 ? r.quantity : null;
    const unitPrice = typeof r.unitPrice === 'number' && r.unitPrice >= 0 ? r.unitPrice : null;
    if (productId && quantity !== null && unitPrice !== null) {
      items.push({ productId, quantity, unitPrice });
    }
  }
  if (items.length === 0) return null;

  let destination: RawDestination | null = null;
  if (typeof obj.destination === 'object' && obj.destination !== null) {
    const d = obj.destination as Record<string, unknown>;
    const lat = typeof d.latitude === 'number' ? d.latitude : null;
    const lng = typeof d.longitude === 'number' ? d.longitude : null;
    if (lat !== null && lng !== null) destination = { latitude: lat, longitude: lng };
  }

  return { items, destination };
}

export async function POST(req: NextRequest) {
  try {
    const body = parseBody(await req.json());
    if (!body) return NextResponse.json({ error: 'Payload tidak valid' }, { status: 400 });

    const supabase = (await createClient()) as TypedSupabaseClient;

    const productIds = Array.from(new Set(body.items.map((i) => i.productId)));
    const { data: products } = await supabase
      .from('products')
      .select('id, category_id')
      .in('id', productIds);

    const categoryByProduct = new Map<string, string | null>();
    for (const p of products ?? []) categoryByProduct.set(p.id, p.category_id);

    const lines: CartLineInput[] = body.items.map((i) => ({
      productId: i.productId,
      categoryId: categoryByProduct.get(i.productId) ?? null,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));

    const candidates = await getActiveCampaigns(supabase);

    const ctx: EvaluationContext = {
      lines,
      destination: body.destination ?? null,
      now: new Date(),
    };

    const result = evaluateCampaigns(ctx, candidates);

    return NextResponse.json({
      applied: result.applied.map((a) => ({
        campaignId: a.campaignId,
        name: a.name,
        type: a.type,
        itemDiscounts: a.itemDiscounts,
        shippingDiscount: a.shippingDiscount,
        totalDiscount: a.totalDiscount,
      })),
      totalItemDiscount: result.totalItemDiscount,
      totalShippingDiscount: result.totalShippingDiscount,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    console.error('CAMPAIGN_PREVIEW_ERROR:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
