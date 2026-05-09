"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/store/useCart";
import {
  IconTrash,
  IconMinus,
  IconPlus,
  IconArrowRight,
  IconShoppingBag,
} from "@tabler/icons-react";
import { Button, Card, CardContent } from "@bananasbindery/ui";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-6">
          🛒
        </div>
        <h1 className="text-2xl font-bold">Keranjangmu masih kosong</h1>
        <p className="text-gray-500 mt-2 mb-8 text-center max-w-xs">
          Sepertinya kamu belum memilih binder impianmu. Yuk, intip koleksi
          terbaru kami!
        </p>
        <Link href="/products">
          <Button size="lg" className="rounded-full px-8">
            Mulai Belanja
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-10 flex items-center gap-3">
        <IconShoppingBag className="w-8 h-8 text-primary" />
        Keranjang Belanja
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <Card
              key={item.variantId}
              className="overflow-hidden border-none shadow-sm bg-white hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 flex gap-6">
                <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 relative">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      📚
                    </div>
                  )}
                </div>

                <div className="flex-grow flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.variantLabel}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <IconTrash className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-full p-1 border border-gray-100">
                      <button
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity - 1)
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm transition-all"
                      >
                        <IconMinus className="w-4 h-4" />
                      </button>
                      <span className="w-4 text-center font-bold text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.variantId, item.quantity + 1)
                        }
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm transition-all"
                      >
                        <IconPlus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-bold text-primary text-lg">
                      Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="glass sticky top-24 border-white/40 shadow-xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
            <CardContent className="p-8">
              <h2 className="text-xl font-bold mb-6">Ringkasan Belanja</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} item)</span>
                  <span>Rp {totalPrice().toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Pengiriman</span>
                  <span className="text-xs italic">Dihitung di checkout</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-black text-2xl text-primary">
                    Rp {totalPrice().toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <Link href="/checkout">
                <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20">
                  Lanjut ke Checkout <IconArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Pembayaran aman via Xendit
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  Dukung kurir seluruh Indonesia
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
