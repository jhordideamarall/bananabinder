// Domain types synced with PRD §15 schema
// Last synced: 2026-05-02

import type { OrderStatus, PaymentStatus, ReturnStatus } from '../enums.js';
import type { Address } from './user.js';
import type { ProductVariant } from './product.js';

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  createdAt: Date;
  // Relations
  variant?: ProductVariant;
}

export interface Cart {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  items?: CartItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  quantity: number;
  price: number;
  costPrice: number;
  discount: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  paymentId: string | null;
  shippingMethod: string | null;
  shippingTracking: string | null;
  shippingCourier: string | null;
  subtotal: number;
  discount: number;
  voucherId: string | null;
  shippingCost: number;
  tax: number;
  total: number;
  hppTotal: number;
  profit: number;
  notes: string | null;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  expiredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  items?: OrderItem[];
  address?: Address;
}

export interface OrderReturn {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  description: string | null;
  photoUrls: string[] | null;
  status: ReturnStatus;
  refundAmount: number | null;
  refundMethod: string | null;
  adminNotes: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}
