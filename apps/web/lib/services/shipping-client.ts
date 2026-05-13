import { getShippingRates as _getShippingRates } from '@bananasbindery/api-client/shipping';
import type { CartItem } from '@/stores/cart-store';

export type { ShippingOption } from '@bananasbindery/api-client/shipping';

export const getShippingRates = (addressId: string, items: CartItem[]) =>
  _getShippingRates('', addressId, items);
