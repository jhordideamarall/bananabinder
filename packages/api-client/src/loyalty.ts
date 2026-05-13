import type { TypedSupabaseClient, Loyalty } from './types';

export type { Loyalty };

export async function getUserLoyalty(supabase: TypedSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('loyalty')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching loyalty:', error);
    return null;
  }
  return data;
}

export async function getUserLoyaltyHistory(supabase: TypedSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('loyalty_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching loyalty history:', error);
    return [];
  }
  return data;
}
