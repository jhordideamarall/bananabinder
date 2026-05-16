export interface CampaignPreviewItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface CampaignPreviewDestination {
  latitude: number;
  longitude: number;
}

export interface AppliedCampaignDto {
  campaignId: string;
  name: string;
  type: 'flash_sale' | 'product_discount' | 'free_shipping';
  itemDiscounts: { productId: string; amount: number }[];
  shippingDiscount: number;
  totalDiscount: number;
}

export interface CampaignPreviewResponse {
  applied: AppliedCampaignDto[];
  totalItemDiscount: number;
  totalShippingDiscount: number;
}

export async function previewCampaigns(
  items: CampaignPreviewItem[],
  destination: CampaignPreviewDestination | null,
): Promise<CampaignPreviewResponse> {
  const res = await fetch('/api/campaigns/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, destination }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? 'Gagal preview campaign');
  }
  return (await res.json()) as CampaignPreviewResponse;
}
