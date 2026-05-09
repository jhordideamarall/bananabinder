import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { IconShieldCheck, IconTruck, IconStar } from "@tabler/icons-react";
import { Badge } from "@bananasbindery/ui";
import {
  generateProductStructuredData,
  type ProductWithRelations,
} from "@/lib/seo";
import ProductInteraction from "@/components/ProductInteraction";

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  product_images?: Array<{ url: string }>;
  product_variants: Array<{
    id: string;
    cover_color?: string;
    paper_type?: string;
    ring_size?: string;
    sku?: string;
    stock: number;
    price_override?: number;
  }>;
}

async function getProduct(slug: string): Promise<ProductDetail | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/products/${slug}`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Produk Tidak Ditemukan" };

  return {
    title: `${product.name} | Bananasbindery`,
    description: product.description,
    openGraph: {
      images: product.product_images?.[0]?.url
        ? [product.product_images[0].url]
        : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const structuredData = generateProductStructuredData(
    product as ProductWithRelations
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden relative border border-gray-100">
            {product.product_images?.[0] ? (
              <Image
                src={product.product_images[0].url}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-9xl">
                📚
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.product_images?.slice(1, 5).map((img, idx) => (
              <div
                key={idx}
                className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              >
                <Image
                  src={img.url}
                  alt={`${product.name} ${idx}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="accent">Terlaris</Badge>
            <div className="flex items-center gap-1 text-yellow-500 ml-2">
              <IconStar className="w-4 h-4 fill-yellow-500" />
              <span className="text-sm font-bold text-gray-900">4.9</span>
              <span className="text-sm text-gray-500">(120+ Review)</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 leading-tight">
            {product.name}
          </h1>
          <p className="text-primary font-black text-3xl mt-4">
            Rp {product.base_price.toLocaleString("id-ID")}
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">
                Deskripsi
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Client Interaction Component */}
            <ProductInteraction product={product} />

            {/* Service Badges */}
            <div className="grid grid-cols-2 gap-4 pt-10 border-t border-gray-100 mt-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                  <IconShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-600">
                  Garansi Kualitas 100%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <IconTruck className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-600">
                  Pengiriman Seluruh RI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
