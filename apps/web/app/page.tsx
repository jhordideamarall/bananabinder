import Image from "next/image";
import Link from "next/link";
import {
  IconArrowRight,
  IconStar,
  IconTruck,
  IconShieldCheck,
  IconSparkles,
} from "@tabler/icons-react";
import { Button, Card, CardContent, Badge } from "@bananasbindery/ui";

interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  weight_grams: number;
  product_images?: Array<{ url: string }>;
  product_variants?: Array<{ stock: number }>;
}

async function getProducts(): Promise<FeaturedProduct[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <Badge variant="accent" className="mb-4 py-1 px-3">
              <IconSparkles className="w-3 h-3 mr-2" />
              Premium Binder Collection
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]">
              Tulis Ceritamu di{" "}
              <span className="text-primary italic">Binder</span> Impian.
            </h1>
            <p className="mt-6 text-xl text-gray-500 max-w-lg">
              Binder custom dengan desain estetik dan kualitas premium. Cocok
              untuk menemanimu belajar, bekerja, dan journaling setiap hari.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" className="rounded-full px-8 h-12 text-base">
                Mulai Belanja <IconArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 h-12 text-base"
              >
                Custom Desain
              </Button>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="w-full aspect-square bg-accent/30 rounded-3xl overflow-hidden shadow-2xl transform rotate-3 transition-transform hover:rotate-0 duration-500">
              {/* Replace with actual high-quality product image if available */}
              <div className="w-full h-full flex items-center justify-center text-8xl">
                🍌📚
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 glass p-6 rounded-2xl shadow-xl max-w-xs animate-bounce">
              <div className="flex items-center gap-2 mb-2">
                <IconStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <IconStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <IconStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <IconStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <IconStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              </div>
              <p className="text-sm font-medium">
                "Bindernya cakep banget, bahannya tebel dan ring-nya kokoh.
                Recommended!"
              </p>
              <p className="text-xs text-gray-500 mt-2">
                — Sarah, Mahasiswa UI
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex items-start gap-4 p-6 rounded-2xl bg-primary/5">
          <div className="p-3 bg-primary/20 rounded-xl text-primary">
            <IconTruck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Pengiriman Cepat</h3>
            <p className="text-sm text-gray-500 mt-1">
              Kirim ke seluruh Indonesia dengan packing aman.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-6 rounded-2xl bg-secondary/5">
          <div className="p-3 bg-secondary/20 rounded-xl text-secondary">
            <IconShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Kualitas Premium</h3>
            <p className="text-sm text-gray-500 mt-1">
              Menggunakan bahan cover terbaik dan ring anti karat.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-6 rounded-2xl bg-accent/10">
          <div className="p-3 bg-accent/30 rounded-xl text-accent-foreground">
            <IconSparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Desain Eksklusif</h3>
            <p className="text-sm text-gray-500 mt-1">
              Varian warna pastel dan desain yang up-to-date.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Produk Unggulan
            </h2>
            <p className="text-gray-500 mt-2">
              Koleksi binder terbaik yang paling dicintai pelanggan.
            </p>
          </div>
          <Link
            href="/products"
            className="text-primary font-medium flex items-center hover:underline"
          >
            Lihat Semua <IconArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <Card className="h-full group">
                <CardContent className="p-0">
                  <div className="aspect-[4/5] bg-gray-100 rounded-t-xl overflow-hidden relative">
                    {product.product_images?.[0] ? (
                      <Image
                        src={product.product_images[0].url}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-110 duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        📚
                      </div>
                    )}
                    {product.product_variants?.[0]?.stock < 10 && (
                      <Badge
                        variant="destructive"
                        className="absolute top-2 left-2"
                      >
                        Stok Menipis
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-primary font-bold mt-1">
                      Rp {product.base_price.toLocaleString("id-ID")}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                      <span>{product.weight_grams}g</span>
                      <span>•</span>
                      <span>Premium</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
