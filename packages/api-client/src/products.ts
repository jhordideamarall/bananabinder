import type { TypedSupabaseClient, Product, Category, ProductWithDetails } from './types';

export type { Product, Category, ProductWithDetails };

function getSmartFallbackImage(productName: string): string {
  const p = productName.toLowerCase();
  let id = '1586074299796-062f40b3c6a4'; // Generic Stationery
  if (p.includes('binder')) id = '1517841905572-4b240a55537e';
  if (p.includes('kertas') || p.includes('paper')) id = '1610484826923-d16c3746654e';
  if (p.includes('aesthetic')) id = '1519337020835-26a31c518868';
  return `https://images.unsplash.com/photo-${id}?w=800&q=80`;
}

function normalizePromoPrice(price: number, promoPrice: number | null | undefined): number | null {
  const numericPromoPrice = Number(promoPrice);
  return numericPromoPrice > 0 && numericPromoPrice < price ? numericPromoPrice : null;
}

function resolveVariantPrice(
  productPrice: number,
  variantPrice: number | null | undefined,
): number {
  const numericVariantPrice = Number(variantPrice);

  if (!Number.isFinite(numericVariantPrice) || numericVariantPrice <= 0) {
    return productPrice;
  }

  // Existing malformed rows can contain Rp 0/Rp 1 variant prices. For normal catalog
  // products, keep storefront and checkout on the product price unless the override is reasonable.
  if (productPrice >= 1000 && numericVariantPrice < 1000) {
    return productPrice;
  }

  return numericVariantPrice;
}

export async function getActiveProducts(
  supabase: TypedSupabaseClient,
): Promise<ProductWithDetails[]> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, name, price, promo_price, slug, weight_grams, avg_rating, sold_count, categories(slug), product_images(url)',
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('SUPABASE_FETCH_ERROR:', error.message);
    return [];
  }

  type Row = {
    id: string;
    name: string;
    slug: string;
    price: number;
    promo_price: number | null;
    weight_grams: number | null;
    avg_rating: number;
    sold_count: number;
    categories: { slug: string } | null;
    product_images: { url: string }[];
  };

  return ((data as unknown as Row[]) || []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(p.price),
    promoPrice: normalizePromoPrice(Number(p.price), p.promo_price),
    imageUrl: p.product_images?.[0]?.url || getSmartFallbackImage(p.name),
    rating: Number(p.avg_rating) || 0,
    soldCount: Number(p.sold_count) || 0,
    category_slug: p.categories?.slug || null,
    weight_grams: Number(p.weight_grams) || 500,
  }));
}

export async function getActiveCategories(supabase: TypedSupabaseClient): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data || [];
}

export async function getProductBySlug(supabase: TypedSupabaseClient, slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(url), product_variants(*)')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  type Row = Product & {
    product_images: { url: string }[];
    product_variants: {
      id: string;
      name: string;
      price: number;
      promo_price: number | null;
      stock: number;
      sku: string;
      image_url: string | null;
      weight_grams: number | null;
      is_active: boolean | null;
    }[];
  };

  const product = data as unknown as Row;
  const productPrice = Number(product.price);
  const productPromoPrice = normalizePromoPrice(productPrice, product.promo_price);
  const mappedImages = product.product_images?.map((img) => img.url) || [];
  const imageUrl = mappedImages[0] || getSmartFallbackImage(product.name);

  return {
    ...product,
    price: productPrice,
    imageUrl,
    images: mappedImages.length > 0 ? mappedImages : [imageUrl],
    variants: (product.product_variants || [])
      .filter((variant) => variant.is_active !== false)
      .map((variant) => {
        const variantPrice = resolveVariantPrice(productPrice, variant.price);
        const variantPromoPrice =
          normalizePromoPrice(variantPrice, variant.promo_price) ??
          (variantPrice === productPrice ? productPromoPrice : null);

        return {
          ...variant,
          price: variantPrice,
          promoPrice: variantPromoPrice,
          weight_grams: variant.weight_grams ?? product.weight_grams ?? 500,
        };
      }),
    rating: Number(product.avg_rating) || 0,
    reviewCount: product.review_count || 0,
    soldCount: product.sold_count || 0,
    promoPrice: productPromoPrice,
    description:
      product.description ||
      `*${product.name}* adalah produk binder premium untuk menunjang produktivitas dan kreativitasmu.`,
  };
}
