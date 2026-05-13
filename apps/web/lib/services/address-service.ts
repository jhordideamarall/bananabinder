import { createClient } from '@/lib/supabase/server';
import { getUserAddresses as _getUserAddresses } from '@bananasbindery/api-client/addresses';

export type { Address } from '@bananasbindery/api-client/addresses';

export const getUserAddresses = async () => _getUserAddresses(await createClient());
