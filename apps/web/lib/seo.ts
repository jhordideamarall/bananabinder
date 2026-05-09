interface ProductVariant {
  sku: string;
  price_override?: number;
  stock: number;
}

interface ProductImage {
  url: string;
}

interface ProductWithRelations {
  name: string;
  slug: string;
  description: string;
  base_price: number;
  product_variants: ProductVariant[];
  product_images: ProductImage[];
}

export function generateProductStructuredData(product: ProductWithRelations) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://bananasbindery.com";

  // Get min price from variants or base price
  const prices = product.product_variants.map(
    (v) => v.price_override || product.base_price
  );
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    image: product.product_images.map((img) => img.url),
    description: product.description,
    sku: product.product_variants[0]?.sku,
    brand: {
      "@type": "Brand",
      name: "Bananasbindery",
    },
    offers: {
      "@type": "AggregateOffer",
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: "IDR",
      lowPrice: minPrice,
      highPrice: maxPrice,
      offerCount: product.product_variants.length,
      availability: product.product_variants.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}
