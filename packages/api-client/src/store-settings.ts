import type { TypedSupabaseClient, StoreSettings } from './types';

export type { StoreSettings };

/**
 * Fetch the single store settings row (store name, origin, home section labels).
 * Returns null if not configured yet.
 */
export async function getStoreSettings(
  supabase: TypedSupabaseClient,
): Promise<StoreSettings | null> {
  const { data, error } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();

  if (error) {
    console.error('STORE_SETTINGS_FETCH_ERROR:', error.message);
    return null;
  }

  return data;
}
