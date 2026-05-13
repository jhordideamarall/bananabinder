'use client';

import { useRouter } from 'next/navigation';
import { m } from 'framer-motion';
import { ArrowLeft, Heart, ShoppingCart, Loader2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserWishlist, toggleWishlist } from '@/lib/services/wishlist-client';
import { useCartStore } from '@/stores/cart-store';
import { toast } from 'sonner';
import Image from 'next/image';

function formatPrice(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`;
}

export default function WishlistPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addItem } = useCartStore();

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getUserWishlist,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => toggleWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Dihapus dari wishlist');
    },
    onError: () => toast.error('Gagal menghapus dari wishlist'),
  });

  return (
    <div className="bg-[#FDFCFB]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-2 bg-[#FDFCFB]/90 px-5 pb-4 pt-[max(18px,env(safe-area-inset-top))] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-3"
        >
          <ArrowLeft size={18} />
          Kembali
        </button>
        <h1 className="mt-3 font-heading text-[22px] font-extrabold text-ink">Wishlist</h1>
      </header>

      <main className="px-5 py-5">
        {isLoading ? (
          <div className="flex h-[40dvh] items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : wishlist.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <Heart size={48} className="text-ink-4" />
            <p className="mt-4 font-heading text-[16px] font-extrabold text-ink">Wishlist kosong</p>
            <p className="mt-1 text-[13px] text-ink-3">
              Simpan produk favoritmu untuk dibeli nanti.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {wishlist.map(
              (
                item: {
                  id: string;
                  product_id: string;
                  products?: {
                    id?: string;
                    name: string;
                    price: number;
                    promo_price?: number | null;
                    product_images?: { url: string }[];
                  };
                },
                i: number,
              ) => (
                <m.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3.5 rounded-[20px] bg-white p-3.5 shadow-[0_2px_14px_rgba(0,0,0,0.05)]"
                >
                  {/* Thumbnail */}
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[16px] bg-[#F5F3F0]">
                    {item.products?.product_images?.[0]?.url ? (
                      <Image
                        src={item.products.product_images[0].url}
                        alt={item.products.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[24px]">
                        🐾
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="font-heading text-[14px] font-extrabold leading-snug text-ink">
                      {item.products?.name || 'Produk tidak dikenal'}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-heading text-[14px] font-extrabold text-primary">
                        {formatPrice(item.products?.promo_price || item.products?.price || 0)}
                      </span>
                      {(item.products?.promo_price ?? 0) > 0 && (
                        <span className="text-[12px] font-medium text-ink-4 line-through">
                          {formatPrice(item.products?.price || 0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        addItem({
                          id: item.products?.id ?? item.product_id,
                          variantId: null,
                          variantName: null,
                          name: item.products?.name ?? '',
                          price: item.products?.promo_price || item.products?.price || 0,
                          imageUrl: item.products?.product_images?.[0]?.url ?? '',
                          quantity: 1,
                        });
                        toast.success('Ditambahkan ke keranjang');
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_12px_rgba(224,123,57,0.3)] active:scale-90"
                      style={{ transition: 'transform 0.1s' }}
                    >
                      <ShoppingCart size={16} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate(item.product_id)}
                      disabled={removeMutation.isPending}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-400 active:scale-90 disabled:opacity-50"
                      style={{ transition: 'transform 0.1s' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </m.div>
              ),
            )}
          </div>
        )}
      </main>
    </div>
  );
}
