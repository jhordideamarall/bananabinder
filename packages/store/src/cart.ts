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
  customDetails?: CustomOrderDetails | null;
}

export interface CustomOrderDetails {
  [key: string]: string | null | undefined;
  size: string;
  material: string;
  personalization: string;
  designNotes?: string | null;
  referenceUrl?: string | null;
}

export interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  setItemQuantity: (
    id: string | number,
    variantId: string | null | undefined,
    quantity: number,
    customDetails?: CustomOrderDetails | null,
  ) => void;
  removeItem: (
    id: string | number,
    variantId?: string | null,
    customDetails?: CustomOrderDetails | null,
  ) => void;
  clearCart: () => void;
  getTotalCount: () => number;
}

const customSignature = (details?: CustomOrderDetails | null): string =>
  details
    ? JSON.stringify({
        size: details.size,
        material: details.material,
        personalization: details.personalization,
        designNotes: details.designNotes ?? null,
        referenceUrl: details.referenceUrl ?? null,
      })
    : '';

const isSameItem = (item: CartItem, other: Omit<CartItem, 'quantity'>): boolean =>
  item.id === other.id &&
  (item.variantId ?? null) === (other.variantId ?? null) &&
  customSignature(item.customDetails) === customSignature(other.customDetails);

const matchesItemIdentity = (
  item: CartItem,
  id: string | number,
  variantId: string | null | undefined,
  customDetails?: CustomOrderDetails | null,
): boolean =>
  item.id === id &&
  (item.variantId ?? null) === (variantId ?? null) &&
  customSignature(item.customDetails) === customSignature(customDetails);

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
        setItemQuantity: (id, variantId, quantity, customDetails) => {
          const next = Math.max(0, quantity);
          set((state) => {
            if (next === 0) {
              return {
                items: state.items.filter(
                  (item) => !matchesItemIdentity(item, id, variantId, customDetails),
                ),
              };
            }
            return {
              items: state.items.map((item) =>
                matchesItemIdentity(item, id, variantId, customDetails)
                  ? { ...item, quantity: next }
                  : item,
              ),
            };
          });
        },
        removeItem: (id, variantId, customDetails) => {
          set((state) => ({
            items: state.items.filter(
              (item) => !matchesItemIdentity(item, id, variantId, customDetails),
            ),
          }));
        },
        clearCart: () => set({ items: [] }),
        getTotalCount: () => get().items.reduce((total, item) => total + item.quantity, 0),
      }),
      {
        name: 'bananasbindery-cart-storage',
        ...(storage ? { storage } : {}),
      },
    ),
  );
}
