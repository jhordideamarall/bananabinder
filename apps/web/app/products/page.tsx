import Link from "next/link";
import Image from "next/image";
import { Search, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, Badge, Button } from "@bananasbindery/ui";

interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  weight_grams: number;
  product_images: Array<{ url: string }>;
}

async function getProducts(category?: string, search?: string): Promise<CatalogProduct[]> {
  const url = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/api/products`);
  if (category) url.searchParams.set("category", category);
  if (search) url.searchParams.set("search", search);
  
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string };
}) {
  const products = await getProducts(searchParams.category, searchParams.search);

  const categories = [
    { name: "Semua", slug: "" },
    { name: "Binder A5", slug: "binder-a5" },
    { name: "Binder B5", slug: "binder-b5" },
    { name: "Refill", slug: "refill" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Katalog Binder</h1>
          <p className="text-gray-500 mt-2">Temukan teman setia untuk catatan dan jurnalmu.</p>
        </div>

        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-grow md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Cari binder..." 
               className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
             />
          </div>
          <Button variant="outline" className="rounded-full">
            <SlidersHorizontal className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-10">
        {categories.map((cat) => (
          <Link 
            key={cat.slug} 
            href={`/products${cat.slug ? `?category=${cat.slug}` : ""}`}
          >
            <Badge 
              variant={searchParams.category === cat.slug ? "default" : "outline"}
              className="px-6 py-2 cursor-pointer whitespace-nowrap text-sm"
            >
              {cat.name}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
           <div className="text-4xl mb-4">🔍</div>
           <h2 className="text-xl font-bold">Produk tidak ditemukan</h2>
           <p className="text-gray-500">Coba kata kunci lain atau pilih kategori yang berbeda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <Card className="h-full group border-none shadow-none hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                    {product.product_images?.[0] ? (
                      <Image 
                        src={product.product_images[0].url} 
                        alt={product.name} 
                        fill 
                        className="object-cover transition-transform group-hover:scale-110 duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📚</div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <div className="p-6">
                    <Badge variant="accent" className="mb-2 text-[10px] uppercase font-bold tracking-widest px-2">
                       Premium Quality
                    </Badge>
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
                    <p className="text-primary font-black text-xl mt-2">Rp {product.base_price.toLocaleString('id-ID')}</p>
                    
                    <div className="mt-4 flex items-center justify-between">
                       <span className="text-xs text-gray-500">{product.weight_grams}g</span>
                       <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white">
                          +
                       </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
