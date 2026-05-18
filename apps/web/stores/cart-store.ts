import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Re-export types from shared package
export type { CartItem, CartState } from '@bananasbindery/store/cart';
import type { CartItem } from '@bananasbindery/store/cart';

/**
 * React-bound cart store for web.
 * Uses the same logic as @bananasbindery/store/cart but with React's `create` for hook usage.
 */

const customSignature = (details: CartItem['customDetails']): string =>
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
  customDetails?: CartItem['customDetails'],
): boolean =>
  item.id === id &&
  (item.variantId ?? null) === (variantId ?? null) &&
  customSignature(item.customDetails) === customSignature(customDetails);

export const useCartStore = create<{
  items: CartItem[];
  /** Voucher yang sedang dipasang (preview). Final dihitung server di create_order_v1. */
  voucherCode: string | null;
  voucherDiscount: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  setItemQuantity: (
    id: string | number,
    variantId: string | null | undefined,
    quantity: number,
    customDetails?: CartItem['customDetails'],
  ) => void;
  removeItem: (
    id: string | number,
    variantId?: string | null,
    customDetails?: CartItem['customDetails'],
  ) => void;
  setVoucher: (code: string, discount: number) => void;
  clearVoucher: () => void;
  clearCart: () => void;
  getTotalCount: () => number;
}>()(
  persist(
    (set, get) => ({
      items: [],
      voucherCode: null,
      voucherDiscount: 0,
      addItem: (newItem) => {
        const quantity = Math.max(1, newItem.quantity ?? 1);
        set((state) => {
          const existing = state.items.find((item) => isSameItem(item, newItem));
          if (existing) {
            return {
              items: state.items.map((item) =>
                isSameItem(item, newItem) ? { ...item, quantity: item.quantity + quantity } : item,
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
      setVoucher: (code, discount) =>
        set({ voucherCode: code, voucherDiscount: Math.max(0, discount) }),
      clearVoucher: () => set({ voucherCode: null, voucherDiscount: 0 }),
      clearCart: () => set({ items: [], voucherCode: null, voucherDiscount: 0 }),
      getTotalCount: () => get().items.reduce((total, item) => total + item.quantity, 0),
    }),
    { name: 'bananasbindery-cart-storage' },
  ),
);
