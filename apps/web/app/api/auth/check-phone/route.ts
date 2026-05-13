import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getBothPhoneFormats(phone: string): string[] {
  if (phone.startsWith('+62')) {
    return [phone, '0' + phone.slice(3)];
  }
  if (phone.startsWith('0')) {
    return [phone, '+62' + phone.slice(1)];
  }
  return [phone, '+62' + phone];
}

export async function POST(request: Request) {
  const { phone } = await request.json();
  if (!phone) return NextResponse.json({ exists: false });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ exists: false });
  }

  const supabase = createClient(url, serviceKey);
  const phoneVariants = getBothPhoneFormats(phone);

  // 1. Check profiles.phone
  const { data: profileData } = await supabase
    .from('profiles')
    .select('id')
    .in('phone', phoneVariants)
    .maybeSingle();

  if (profileData) return NextResponse.json({ exists: true });

  // 2. Check addresses.phone (saved from guest checkout flow)
  const { data: addressData } = await supabase
    .from('addresses')
    .select('user_id')
    .in('phone', phoneVariants)
    .limit(1)
    .maybeSingle();

  if (addressData) return NextResponse.json({ exists: true });

  // 3. Fallback: check auth.users directly
  const { data: authExists } = await supabase.rpc('check_phone_in_auth', { p_phone: phone });

  return NextResponse.json({ exists: !!authExists });
}
