import { createClient } from '@/lib/supabase/client';
import { getStoreSettings as _getStoreSettings } from '@bananasbindery/api-client/store-settings';

export type { StoreSettings } from '@bananasbindery/api-client/store-settings';

export const getStoreSettings = () => _getStoreSettings(createClient());
