import type { TypedSupabaseClient } from './types';

export async function getUserWishlist(supabase: TypedSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('wishlists')
    .select(`*, products (id, name, price, promo_price, product_images (url))`)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching wishlist:', error);
    return [];
  }
  return data;
}

export async function toggleWishlist(supabase: TypedSupabaseClient, productId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('wishlists').delete().eq('id', existing.id);
    if (error) throw error;
    return { status: 'removed' as const };
  } else {
    const { error } = await supabase
      .from('wishlists')
      .insert([{ user_id: user.id, product_id: productId }]);
    if (error) throw error;
    return { status: 'added' as const };
  }
}
