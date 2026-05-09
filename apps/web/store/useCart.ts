import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  variantId: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variantLabel: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  syncWithServer: () => Promise<void>;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: async (item) => {
        const existing = get().items.find((i) => i.variantId === item.variantId);
        const newQuantity = existing ? existing.quantity + item.quantity : item.quantity;

        // Optimistic UI update
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.variantId === item.variantId ? { ...i, quantity: newQuantity } : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }

        // Try to sync with server if logged in
        try {
          await fetch("/api/cart", {
            method: "POST",
            body: JSON.stringify({ variant_id: item.variantId, quantity: newQuantity }),
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("Cart sync failed", e);
        }
      },
      removeItem: async (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });

        try {
          // Assuming the delete API takes a query param or body
          await fetch(`/api/cart?id=${variantId}`, { method: "DELETE" });
        } catch (e) {
          console.error("Cart remove sync failed", e);
        }
      },
      updateQuantity: async (variantId, quantity) => {
        if (quantity < 1) return;
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        });

        try {
          await fetch("/api/cart", {
            method: "POST",
            body: JSON.stringify({ variant_id: variantId, quantity }),
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.error("Cart quantity sync failed", e);
        }
      },
      clearCart: () => set({ items: [] }),
      syncWithServer: async () => {
        try {
          const res = await fetch("/api/cart");
          const { data } = await res.json();
          if (data && data.items) {
            interface ServerCartItem {
              variant_id: string;
              quantity: number;
              variant: {
                cover_color: string;
                ring_size: string;
                price_override?: number;
                product: {
                  id: string;
                  name: string;
                  base_price: number;
                  productImages: Array<{ url: string }>;
                };
              };
            }

            const mappedItems = data.items.map((item: ServerCartItem) => ({
              variantId: item.variant_id,
              productId: item.variant.product.id,
              name: item.variant.product.name,
              image: item.variant.product.productImages[0]?.url || "",
              price: item.variant.price_override || item.variant.product.base_price,
              quantity: item.quantity,
              variantLabel: `${item.variant.cover_color} - ${item.variant.ring_size}`,
            }));
            set({ items: mappedItems });
          }
        } catch (e) {
          console.error("Failed to sync cart with server", e);
        }
      },
      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    {
      name: "bananasbindery-cart",
    }
  )
);
