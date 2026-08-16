'use client';

import { Suspense, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AuthError } from '@supabase/supabase-js';
import { m } from 'framer-motion';
import { Camera, ChevronLeft, Loader2, LockKeyhole, Mail, Phone, User } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

function safeNextPath(value: string | null): Route {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/' as Route;
  return value as Route;
}

function registerErrorMessage(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('already registered') || normalized.includes('already been registered')) {
    return 'Email sudah terdaftar. Silakan masuk.';
  }
  if (normalized.includes('password')) return 'Password belum memenuhi syarat keamanan.';
  return message || 'Gagal membuat akun. Coba lagi.';
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const next = safeNextPath(searchParams.get('next'));

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.replace(/\D/g, '');

    if (!name.trim() || !normalizedEmail || normalizedPhone.length < 9) {
      toast.error('Nama, nomor HP, dan email wajib diisi dengan benar.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password minimal 8 karakter.');
      return;
    }
    if (password !== passwordConfirmation) {
      toast.error('Konfirmasi password tidak sama.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          data: {
            full_name: name.trim(),
            phone: normalizedPhone,
            auth_channel: 'email_password',
          },
        },
      });
      if (error) throw error;
      if (data.user?.identities?.length === 0) {
        throw new Error('Email sudah terdaftar. Silakan masuk.');
      }

      if (data.session && data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name: name.trim(), phone: normalizedPhone })
          .eq('id', data.user.id);

        if (profileError) {
          console.warn('[register] Profile contact could not be synchronized:', profileError.code);
        }

        toast.success('Akun berhasil dibuat!');
        router.push(next);
        router.refresh();
        return;
      }

      toast.success('Akun berhasil dibuat. Silakan masuk.');
      router.push(`/login?next=${encodeURIComponent(next)}` as Route);
    } catch (error) {
      const authError = error as AuthError | Error;
      toast.error(registerErrorMessage(authError.message));
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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-1 flex-col"
        >
          <div className="mb-8 text-center">
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-stone"
            >
              <User size={40} className="text-[#A09890]" />
              <span className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md">
                <Camera size={16} />
              </span>
            </m.div>
            <h1 className="font-heading text-[26px] font-extrabold text-ink">Buat Profil</h1>
            <p className="mt-2 text-sm font-medium text-ink-3">
              Daftar dengan email dan password, tanpa kode OTP.
            </p>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div>
              <label
                className="ml-1 block font-heading text-[13px] font-bold text-ink"
                htmlFor="name"
              >
                Nama Lengkap
              </label>
              <div className="group relative mt-1.5 flex items-center">
                <User
                  size={18}
                  className="absolute left-4 text-[#A09890] transition-colors group-focus-within:text-primary"
                />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Masukkan nama lengkap"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-stone-3 bg-white pl-12 pr-4 font-sans text-[15px] font-semibold text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="ml-1 block font-heading text-[13px] font-bold text-ink"
                htmlFor="phone"
              >
                Nomor Handphone
              </label>
              <div className="group relative mt-1.5 flex items-center">
                <Phone
                  size={18}
                  className="absolute left-4 text-[#A09890] transition-colors group-focus-within:text-primary"
                />
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0812xxxx"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/[^0-9+]/g, ''))}
                  className="h-14 w-full rounded-2xl border border-stone-3 bg-white pl-12 pr-4 font-sans text-[15px] font-semibold text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="ml-1 block font-heading text-[13px] font-bold text-ink"
                htmlFor="email"
              >
                Email
              </label>
              <div className="group relative mt-1.5 flex items-center">
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
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="ml-1 block font-heading text-[13px] font-bold text-ink"
                htmlFor="password"
              >
                Password
              </label>
              <div className="group relative mt-1.5 flex items-center">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 text-[#A09890] transition-colors group-focus-within:text-primary"
                />
                <input
                  id="password"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-stone-3 bg-white pl-12 pr-4 font-sans text-[15px] font-semibold text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="ml-1 block font-heading text-[13px] font-bold text-ink"
                htmlFor="password-confirmation"
              >
                Ulangi Password
              </label>
              <div className="group relative mt-1.5 flex items-center">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 text-[#A09890] transition-colors group-focus-within:text-primary"
                />
                <input
                  id="password-confirmation"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Ketik ulang password"
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  className="h-14 w-full rounded-2xl border border-stone-3 bg-white pl-12 pr-4 font-sans text-[15px] font-semibold text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-3 flex h-14 w-full items-center justify-center rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-ink-3">
            Sudah punya akun?{' '}
            <Link
              href={`/login?next=${encodeURIComponent(next)}` as Route}
              className="font-bold text-primary active:opacity-70"
            >
              Masuk di sini
            </Link>
          </p>
        </m.div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
