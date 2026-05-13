import { createClient } from '@/lib/supabase/client';
import {
  getUserAddresses as _getUserAddresses,
  setDefaultAddress as _setDefaultAddress,
  updateAddress as _updateAddress,
  deleteAddress as _deleteAddress,
} from '@bananasbindery/api-client/addresses';

export type { Address } from '@bananasbindery/api-client/addresses';

export const getUserAddresses = () => _getUserAddresses(createClient());
export const setDefaultAddress = (id: string) => _setDefaultAddress(createClient(), id);
export const updateAddress = (id: string, fields: Parameters<typeof _updateAddress>[2]) =>
  _updateAddress(createClient(), id, fields);
export const deleteAddress = (id: string) => _deleteAddress(createClient(), id);
