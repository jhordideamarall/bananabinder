import type { ReactNode } from 'react';
import { ArrowLeft as IconArrowLeft, LogOut as IconLogout } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebarNav } from '@/components/admin/AdminSidebarNav';

const ADMIN_ROLES = ['admin', 'owner', 'staff'];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = (await createClient()) as TypedSupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin-login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single();

  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    redirect('/');
  }

  async function logoutAdmin() {
    'use server';

    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/admin-login');
  }

  const displayName = profile.name || user.email?.split('@')[0] || 'Admin';
  const initials = displayName
    .split(' ')
    .map((part: string) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] text-[#1D1D1F] antialiased">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-black/[0.06] bg-white md:flex">
        <div className="px-6 py-7">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
            <span className="text-[15px] font-semibold tracking-tight">bananasbindery</span>
            <span className="text-[11px] font-medium text-[#86868B]">/ admin</span>
          </Link>
        </div>

        <AdminSidebarNav />

        <div className="border-t border-black/[0.06] px-3 py-4">
          <Link
            href="/"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-[#86868B] transition-colors hover:bg-black/[0.04] hover:text-[#1D1D1F]"
          >
            <IconArrowLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
            Kembali ke toko
          </Link>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium text-[#86868B] transition-colors hover:bg-black/[0.04] hover:text-[#1D1D1F]"
            >
              <IconLogout className="h-[18px] w-[18px]" strokeWidth={1.75} />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.06] bg-white/80 px-8 py-3.5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#86868B]">
            <span>Control Center</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[13px] font-semibold leading-tight">{displayName}</p>
              <p className="text-[11px] capitalize leading-tight text-[#86868B]">{profile.role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-[12px] font-semibold text-[#1D1D1F]">
              {initials}
            </div>
          </div>
        </header>
        <div className="px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
