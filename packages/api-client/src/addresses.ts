import type { TypedSupabaseClient, Address } from './types';

export type { Address };

export async function getUserAddresses(supabase: TypedSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('is_active', true)
    .order('is_default', { ascending: false });

  if (error) {
    console.error('Error fetching addresses:', error);
    return [];
  }
  return data ?? [];
}

export async function setDefaultAddress(supabase: TypedSupabaseClient, addressId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);

  const { data, error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAddress(
  supabase: TypedSupabaseClient,
  addressId: string,
  fields: Partial<
    Pick<
      Address,
      | 'label'
      | 'recipient_name'
      | 'phone'
      | 'full_address'
      | 'city'
      | 'district'
      | 'postal_code'
      | 'is_default'
    >
  >,
) {
  if (fields.is_default) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    }
  }

  const { data, error } = await supabase
    .from('addresses')
    .update(fields)
    .eq('id', addressId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAddress(supabase: TypedSupabaseClient, addressId: string) {
  const { error } = await supabase
    .from('addresses')
    .update({ is_active: false })
    .eq('id', addressId);
  if (error) throw error;
}
