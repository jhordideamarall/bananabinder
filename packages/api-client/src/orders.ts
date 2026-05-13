import type { TypedSupabaseClient, OrderWithItems, CheckoutPayload } from './types';

export type { OrderWithItems, CheckoutPayload };

export async function getUserOrders(supabase: TypedSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(`*, order_items (*, products (name, product_images (url)))`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  return data as OrderWithItems[];
}

export async function getOrderDetail(supabase: TypedSupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`*, order_items (*, products (name, product_images (url)))`)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as OrderWithItems;
}

export async function createOrder(
  supabase: TypedSupabaseClient,
  payload: CheckoutPayload,
  orderNumber: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Anda harus login untuk membuat pesanan');

  const { data, error } = await supabase.rpc('create_order_v1', {
    p_user_id: user.id,
    p_address_id: payload.addressId,
    p_items: payload.items,
    p_order_number: orderNumber,
    p_total: payload.total,
    p_subtotal: payload.subtotal,
    p_shipping_cost: payload.shippingCost,
    p_shipping_courier: payload.shippingCourier,
    p_shipping_courier_code: payload.shippingCourierCode,
    p_shipping_service_code: payload.shippingServiceCode,
    p_total_weight: payload.totalWeight,
    p_tax: payload.tax,
    p_service_fee: payload.serviceFee,
    p_discount: payload.discount,
  });

  if (error) {
    console.error('ERROR_CREATE_ORDER:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'Gagal membuat pesanan');
  }
  return data as string;
}
