'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { AuthError } from '@supabase/supabase-js';

const ADMIN_ROLES = ['admin', 'owner', 'staff'];

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan password wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error('Sesi tidak valid.');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!profile || !ADMIN_ROLES.includes(profile.role)) {
        await supabase.auth.signOut();
        toast.error('Akun ini tidak punya akses admin.');
        return;
      }

      toast.success('Berhasil masuk sebagai admin');
      router.push('/admin');
      router.refresh();
    } catch (err) {
      const error = err as AuthError;
      toast.error(error.message || 'Email atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#FDFCFB] px-[clamp(24px,8vw,32px)]">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1A1714] text-white">
            <ShieldCheck size={26} />
          </div>
          <h1 className="font-heading text-[26px] font-extrabold leading-tight text-ink">
            Admin Bananasbindery
          </h1>
          <p className="mt-2 text-sm font-medium text-ink-3">
            Masuk dengan email dan password admin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block font-heading text-[13px] font-bold text-ink">Email</label>
            <div className="group relative flex items-center">
              <div className="absolute left-4 text-[#A09890] transition-colors group-focus-within:text-primary">
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="admin@bananasbindery.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 w-full rounded-2xl border border-stone-3 bg-white pl-12 pr-4 font-sans text-[15px] font-semibold text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                autoFocus
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-heading text-[13px] font-bold text-ink">
              Password
            </label>
            <div className="group relative flex items-center">
              <div className="absolute left-4 text-[#A09890] transition-colors group-focus-within:text-primary">
                <Lock size={18} />
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 w-full rounded-2xl border border-stone-3 bg-white pl-12 pr-4 font-sans text-[15px] font-semibold text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
