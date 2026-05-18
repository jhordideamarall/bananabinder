import { createClient } from '@/lib/supabase/client';
import {
  getActiveProducts as _getActiveProducts,
  getActiveCategories as _getActiveCategories,
  getProductBySlug as _getProductBySlug,
} from '@bananasbindery/api-client/products';

export type { Product, Category, ProductWithDetails } from '@bananasbindery/api-client/products';

export const getActiveProducts = () => _getActiveProducts(createClient());
export const getActiveCategories = () => _getActiveCategories(createClient());
export const getProductBySlug = (slug: string) => _getProductBySlug(createClient(), slug);
