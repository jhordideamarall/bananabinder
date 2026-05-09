import { db } from "@/lib/db";
import { getAdminProducts } from "@bananasbindery/db";
import { Card, CardContent } from "@bananasbindery/ui";
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconPhoto,
  IconStack2,
} from "@tabler/icons-react";
import Link from "next/link";
import Image from "next/image";

export default async function AdminProductsPage() {
  const products = await getAdminProducts(db);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-900">
            Products Catalog
          </h2>
          <p className="text-gray-500 font-medium">
            Kelola semua binder dan varian produk kamu.
          </p>
        </div>
        <Link href="/admin/products/new">
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 transition-all">
            <IconPlus className="w-5 h-5" /> Tambah Produk
          </button>
        </Link>
      </div>

      {/* Filters & Search */}
      <Card className="border-none shadow-xl shadow-gray-100/50">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari Produk..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card
            key={product.id}
            className="border-none shadow-xl shadow-gray-100/50 overflow-hidden group hover:scale-[1.02] transition-all duration-300"
          >
            <div className="aspect-[4/3] relative bg-gray-100">
              {product.productImages && product.productImages[0] ? (
                <Image
                  src={product.productImages[0].url}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <IconPhoto className="w-12 h-12" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    product.is_active
                      ? "bg-green-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {product.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <CardContent className="p-6">
              <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <p className="text-gray-400 text-sm font-medium mt-1 line-clamp-1">
                {product.description}
              </p>

              <div className="flex items-center gap-4 mt-4 py-4 border-y border-gray-50">
                <div className="flex items-center gap-1.5">
                  <IconStack2 className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-bold text-gray-600">
                    {product.productVariants.length} Varian
                  </span>
                </div>
                <div className="text-lg font-black text-primary">
                  Rp {product.base_price.toLocaleString("id-ID")}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Link href={`/admin/products/${product.id}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-primary transition-colors">
                    <IconEdit className="w-4 h-4" /> Edit Detail
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
