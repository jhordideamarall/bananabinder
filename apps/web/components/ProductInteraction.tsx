"use client";

import { useState } from "react";
import { useCart } from "@/store/useCart";
import { Button } from "@bananasbindery/ui";
import { IconShoppingBag, IconHeart, IconShare } from "@tabler/icons-react";

interface Variant {
  id: string;
  cover_color?: string;
  paper_type?: string;
  ring_size?: string;
  stock: number;
  price_override?: number;
}

interface ProductWithVariants {
  id: string;
  name: string;
  base_price: number;
  product_variants: Variant[];
  product_images?: Array<{ url: string }>;
}

export default function ProductInteraction({
  product,
}: {
  product: ProductWithVariants;
}) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
    product.product_variants[0]
  );
  const [quantity] = useState(1);

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      name: product.name,
      image: product.product_images?.[0]?.url || "",
      price: selectedVariant.price_override || product.base_price,
      quantity: quantity,
      variantLabel:
        `${selectedVariant.cover_color || ""} ${selectedVariant.paper_type || ""} ${selectedVariant.ring_size || ""}`.trim(),
    });
    alert("Berhasil ditambahkan ke keranjang! 🍌");
  };

  return (
    <div className="space-y-8">
      {/* Variants */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-3">
          Pilih Varian
        </h3>
        <div className="flex flex-wrap gap-2">
          {product.product_variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => setSelectedVariant(variant)}
              disabled={variant.stock === 0}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                selectedVariant?.id === variant.id
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                  : variant.stock === 0
                    ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                    : "hover:border-primary hover:text-primary border-gray-200"
              }`}
            >
              {variant.cover_color || ""} {variant.paper_type || ""}{" "}
              {variant.ring_size || ""}
            </button>
          ))}
        </div>
        {selectedVariant &&
          selectedVariant.stock < 10 &&
          selectedVariant.stock > 0 && (
            <p className="text-xs text-orange-500 mt-2 font-medium">
              Sisa {selectedVariant.stock} item lagi!
            </p>
          )}
      </div>

      {/* Actions */}
      <div className="pt-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-grow">
          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.stock === 0}
            className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
          >
            <IconShoppingBag className="w-5 h-5 mr-2" />
            {!selectedVariant
              ? "Pilih Varian"
              : selectedVariant.stock === 0
                ? "Stok Habis"
                : "Tambah ke Keranjang"}
          </Button>
        </div>
        <Button
          variant="outline"
          size="lg"
          className="h-14 w-14 p-0 rounded-2xl border-gray-200"
        >
          <IconHeart className="w-6 h-6 text-gray-400" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 w-14 p-0 rounded-2xl border-gray-200"
        >
          <IconShare className="w-6 h-6 text-gray-400" />
        </Button>
      </div>
    </div>
  );
}
