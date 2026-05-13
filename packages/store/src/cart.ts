import { createStore } from 'zustand/vanilla';
import { persist, type PersistStorage } from 'zustand/middleware';

export interface CartItem {
  id: string | number;
  variantId?: string | null;
  variantName?: string | null;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  weight?: number;
}

export interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  setItemQuantity: (
    id: string | number,
    variantId: string | null | undefined,
    quantity: number,
  ) => void;
  removeItem: (id: string | number, variantId?: string | null) => void;
  clearCart: () => void;
  getTotalCount: () => number;
}

const isSameItem = (item: CartItem, other: Omit<CartItem, 'quantity'>): boolean =>
  item.id === other.id && (item.variantId ?? null) === (other.variantId ?? null);

/**
 * Creates a cart store with a custom storage adapter.
 * - Web: pass localStorage-based storage
 * - Mobile: pass AsyncStorage-based storage
 */
export function createCartStore(storage?: PersistStorage<{ items: CartItem[] }>) {
  return createStore<CartState>()(
    persist(
      (set, get) => ({
        items: [],
        addItem: (newItem) => {
          const quantity = Math.max(1, newItem.quantity ?? 1);
          set((state) => {
            const existing = state.items.find((item) => isSameItem(item, newItem));
            if (existing) {
              return {
                items: state.items.map((item) =>
                  isSameItem(item, newItem)
                    ? { ...item, quantity: item.quantity + quantity }
                    : item,
                ),
              };
            }
            return { items: [...state.items, { ...newItem, quantity }] };
          });
        },
        setItemQuantity: (id, variantId, quantity) => {
          const next = Math.max(0, quantity);
          set((state) => {
            if (next === 0) {
              return {
                items: state.items.filter(
                  (item) => !(item.id === id && (item.variantId ?? null) === (variantId ?? null)),
                ),
              };
            }
            return {
              items: state.items.map((item) =>
                item.id === id && (item.variantId ?? null) === (variantId ?? null)
                  ? { ...item, quantity: next }
                  : item,
              ),
            };
          });
        },
        removeItem: (id, variantId) => {
          set((state) => ({
            items: state.items.filter(
              (item) => !(item.id === id && (item.variantId ?? null) === (variantId ?? null)),
            ),
          }));
        },
        clearCart: () => set({ items: [] }),
        getTotalCount: () => get().items.reduce((total, item) => total + item.quantity, 0),
      }),
      {
        name: 'petshop-cart-storage',
        ...(storage ? { storage } : {}),
      },
    ),
  );
}
