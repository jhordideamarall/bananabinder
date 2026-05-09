"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, Button } from "@bananasbindery/ui";
import {
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconLoader2,
  IconCheck,
} from "@tabler/icons-react";
import Link from "next/link";

interface Variant {
  cover_color: string;
  paper_type: string;
  ring_size: string;
  stock: number;
  price_override?: number;
}

interface ProductImage {
  url: string;
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  base_price: number;
  weight_grams: number;
  productVariants: Variant[];
  productImages: ProductImage[];
}

interface ProductFormProps {
  initialData?: ProductDetail;
  isEdit?: boolean;
}

export default function ProductForm({ initialData, isEdit }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [basePrice, setBasePrice] = useState(initialData?.base_price || 0);
  const [weight, setWeight] = useState(initialData?.weight_grams || 500);
  const [variants, setVariants] = useState<Variant[]>(
    initialData?.productVariants || []
  );
  const [images, setImages] = useState<string[]>(
    initialData?.productImages?.map((img) => img.url) || []
  );
  const [newImageUrl, setNewImageUrl] = useState("");

  const addVariant = () => {
    setVariants([
      ...variants,
      { cover_color: "Blue", paper_type: "Lined", ring_size: "A5", stock: 10 },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (
    index: number,
    field: keyof Variant,
    value: string | number
  ) => {
    const updated = [...variants];
    const item = updated[index];
    if (item) {
      updated[index] = { ...item, [field]: value } as Variant;
      setVariants(updated);
    }
  };

  const addImage = () => {
    if (newImageUrl) {
      setImages([...images, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit
        ? `/api/admin/products/${initialData?.id}`
        : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";

      const slug = name
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          base_price: Number(basePrice),
          weight: Number(weight),
          is_active: true,
          variants: variants.map((v) => ({
            ...v,
            stock: Number(v.stock),
            price_override: v.price_override ? Number(v.price_override) : null,
          })),
          images: images.map((url, idx) => ({ url, sort_order: idx })),
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan produk");

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error saving product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <Link
          href="/admin/products"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" /> Kembali ke Katalog
        </Link>
        <Button
          type="submit"
          disabled={loading}
          className="px-8 h-12 rounded-2xl font-black shadow-lg shadow-primary/20"
        >
          {loading ? (
            <IconLoader2 className="w-5 h-5 animate-spin" />
          ) : (
            <IconCheck className="w-5 h-5 mr-2" />
          )}
          {isEdit ? "Update Produk" : "Simpan Produk"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-xl font-black text-gray-900">
                Informasi Dasar
              </h3>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Nama Produk
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  placeholder="Contoh: Blue Sky Binder A5"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Deskripsi
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                  placeholder="Berikan deskripsi lengkap produk kamu..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Harga Dasar (Rp)
                  </label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    Berat (gram)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900">
                  Varian Produk
                </h3>
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/20 text-accent-foreground text-xs font-black rounded-lg hover:bg-accent/30 transition-all"
                >
                  <IconPlus className="w-4 h-4" /> Tambah Varian
                </button>
              </div>

              <div className="space-y-4">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-6 bg-gray-50 rounded-2xl relative group"
                  >
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400">
                          Cover
                        </label>
                        <input
                          type="text"
                          value={v.cover_color}
                          onChange={(e) =>
                            updateVariant(idx, "cover_color", e.target.value)
                          }
                          className="w-full bg-white border-none rounded-lg p-2 text-xs font-bold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400">
                          Paper
                        </label>
                        <input
                          type="text"
                          value={v.paper_type}
                          onChange={(e) =>
                            updateVariant(idx, "paper_type", e.target.value)
                          }
                          className="w-full bg-white border-none rounded-lg p-2 text-xs font-bold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400">
                          Size
                        </label>
                        <input
                          type="text"
                          value={v.ring_size}
                          onChange={(e) =>
                            updateVariant(idx, "ring_size", e.target.value)
                          }
                          className="w-full bg-white border-none rounded-lg p-2 text-xs font-bold outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400">
                          Stock
                        </label>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) =>
                            updateVariant(idx, "stock", Number(e.target.value))
                          }
                          className="w-full bg-white border-none rounded-lg p-2 text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Images */}
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-xl font-black text-gray-900">Foto Produk</h3>
              <div className="space-y-4">
                {images.map((url, idx) => (
                  <div
                    key={idx}
                    className="aspect-square bg-gray-50 rounded-2xl relative overflow-hidden group"
                  >
                    <img
                      src={url}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 p-2 bg-white/80 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500">
                    Add Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-50 border-none rounded-xl text-xs font-medium outline-none"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={addImage}
                      className="p-2 bg-primary text-white rounded-xl"
                    >
                      <IconPlus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
