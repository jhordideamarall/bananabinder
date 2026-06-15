import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function signOutAndRedirect(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/admin-login', request.url), 303);
}

export async function POST(request: Request): Promise<NextResponse> {
  return signOutAndRedirect(request);
}

export async function GET(request: Request): Promise<NextResponse> {
  return signOutAndRedirect(request);
}
