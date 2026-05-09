import { createSupabaseClient } from "@bananasbindery/db";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for public use (client-side or RLS-protected server-side)
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Admin client for bypass RLS (server-side only)
export const supabaseAdmin = createSupabaseClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
