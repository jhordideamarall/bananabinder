// Domain types synced with PRD §15 schema
// Last synced: 2026-05-02

import type { ProductType } from '../enums.js';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  price: number;
  promoPrice: number | null;
  costPrice: number;
  stock: number;
  weightGrams: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  promoPrice: number | null;
  costPrice: number;
  stock: number;
  weightGrams: number;
  type: ProductType;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
  avgRating: number;
  reviewCount: number;
  soldCount: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations (optional, populated via joins)
  images?: ProductImage[];
  variants?: ProductVariant[];
  category?: Category;
}
