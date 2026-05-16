import { supabaseAdmin } from './supabase';
import type { Enums } from '@bananasbindery/types/supabase';

const ADMIN_ROLES: Enums<'user_role'>[] = ['admin', 'owner', 'staff'];

export async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) return false;
  return ADMIN_ROLES.includes(data.role);
}
