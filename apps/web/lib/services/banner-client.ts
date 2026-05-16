import { createClient } from '@/lib/supabase/client';
import { getActiveBanners as _getActiveBanners } from '@bananasbindery/api-client/banners';

export type { HomeBanner } from '@bananasbindery/api-client/banners';

export const getActiveBanners = (type?: string) => _getActiveBanners(createClient(), type);
