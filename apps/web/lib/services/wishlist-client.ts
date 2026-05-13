import { createClient } from '@/lib/supabase/client';
import {
  getUserWishlist as _getUserWishlist,
  toggleWishlist as _toggleWishlist,
} from '@bananasbindery/api-client/wishlist';

export const getUserWishlist = () => _getUserWishlist(createClient());
export const toggleWishlist = (productId: string) => _toggleWishlist(createClient(), productId);
