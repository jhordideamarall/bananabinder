// Domain types synced with PRD §15 schema
// Last synced: 2026-05-02

import type { VoucherType, LoyaltyTransactionType } from '../enums.js';

export interface Voucher {
  id: string;
  code: string;
  type: VoucherType;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface LoyaltyBalance {
  id: string;
  userId: string;
  totalPoints: number;
  lifetimePoints: number;
  updatedAt: Date;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  orderId: string | null;
  pointsChange: number;
  type: LoyaltyTransactionType;
  description: string | null;
  createdAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  productId: string | null;
  orderId: string | null;
  serviceId: string | null;
  rating: number;
  comment: string | null;
  photoUrls: string[] | null;
  adminReply: string | null;
  isVisible: boolean;
  createdAt: Date;
}

export interface Wishlist {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
}
