'use client';

import { Suspense, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AuthError } from '@supabase/supabase-js';
import { m } from 'framer-motion';
import { ChevronLeft, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

function safeNextPath(value: string | null): Route {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/' as Route;
  return value as Route;
}

function loginErrorMessage(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'Email atau password salah.';
  if (normalized.includes('email not confirmed')) return 'Konfirmasi email kamu terlebih dahulu.';
  return message || 'Gagal masuk. Coba lagi.';
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const next = safeNextPath(searchParams.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Email dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;

      toast.success('Berhasil masuk!');
      router.push(next);
      router.refresh();
    } catch (error) {
      const authError = error as AuthError | Error;
      toast.error(loginErrorMessage(authError.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FDFCFB]">
      <header className="flex h-16 items-center px-[clamp(16px,5vw,20px)] pt-[env(safe-area-inset-top)]">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-transform active:scale-95"
          aria-label="Kembali"
        >
          <ChevronLeft size={22} className="text-ink" />
        </button>
      </header>

      <main className="flex flex-1 flex-col px-[clamp(24px,8vw,32px)] pt-8 pb-10">
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="font-heading text-[28px] font-extrabold leading-tight text-ink">
            Selamat Datang!
          </h1>
          <p className="mt-2 text-sm font-medium text-ink-3">
            Masuk dengan email dan password, tanpa kode OTP.
          </p>
        </m.div>

        <m.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col gap-5"
          onSubmit={handleEmailLogin}
        >
          <div>
            <label
              className="mb-2 block font-heading text-[13px] font-bold text-ink"
              htmlFor="email"
            >
              Email
            </label>
            <div className="group relative flex items-center">
              <Mail
                size={18}
                className="absolute left-4 text-[#A09890] transition-colors group-focus-within:text-primary"
              />
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-14 w-full rounded-2xl border border-stone-3 bg-white pl-12 pr-4 font-sans text-[15px] font-semibold text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                autoFocus
                required
              />
            </div>
          </div>

          <div>
            <label
              className="mb-2 block font-heading text-[13px] font-bold text-ink"
              htmlFor="password"
            >
              Password
            </label>
            <div className="group relative flex items-center">
              <LockKeyhole
                size={18}
                className="absolute left-4 text-[#A09890] transition-colors group-focus-within:text-primary"
              />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Masukkan password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-14 w-full rounded-2xl border border-stone-3 bg-white pl-12 pr-4 font-sans text-[15px] font-semibold text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 flex h-14 w-full items-center justify-center rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Masuk'}
          </button>

          <p className="text-center text-sm text-ink-3">
            Belum punya akun?{' '}
            <Link
              href={`/register?next=${encodeURIComponent(next)}` as Route}
              className="font-bold text-primary"
            >
              Daftar sekarang
            </Link>
          </p>
        </m.form>

        <p className="mt-auto pt-10 text-center text-xs leading-relaxed text-ink-4">
          Dengan masuk, kamu menyetujui{' '}
          <Link href={'/terms' as Route} className="underline underline-offset-2">
            Syarat & Ketentuan
          </Link>{' '}
          serta{' '}
          <Link href={'/privacy' as Route} className="underline underline-offset-2">
            Kebijakan Privasi
          </Link>{' '}
          Bananasbindery.
        </p>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
