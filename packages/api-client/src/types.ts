import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@bananasbindery/types/supabase';

export type TypedSupabaseClient = SupabaseClient<Database>;

export type Address = Database['public']['Tables']['addresses']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Loyalty = Database['public']['Tables']['loyalty']['Row'];
export type Wishlist = Database['public']['Tables']['wishlists']['Row'];
export type StoreSettings = Database['public']['Tables']['store_settings']['Row'];
export interface ProductWithDetails {
  id: string;
  name: string;
  slug: string;
  price: number;
  promoPrice: number | null;
  imageUrl: string;
  rating: number;
  soldCount: number;
  category_slug?: string | null;
  /** Berat produk (gram) — dipakai untuk kalkulasi ongkir di checkout. */
  weight_grams: number;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    products?: { name: string; product_images?: { url: string }[] };
  })[];
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  etd: string;
  courier_code: string;
  courier_name: string;
  service_code: string;
  service_name: string;
}

export interface CheckoutPayload {
  addressId: string;
  items: {
    product_id: string;
    variant_id: string | null;
    quantity: number;
    price: number;
    product_name: string;
    variant_name: string | null;
  }[];
  total: number;
  subtotal: number;
  shippingCost: number;
  shippingCourier: string;
  shippingCourierCode?: string;
  shippingServiceCode?: string;
  totalWeight: number;
  tax: number;
  serviceFee: number;
  discount: number;
  /** Kode voucher — divalidasi & dihitung ulang server-side di create_order_v1. */
  voucherCode?: string | null;
  /** Campaign IDs yang akan di-apply — divalidasi & dihitung ulang server-side. */
  campaignIds?: string[];
}

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
