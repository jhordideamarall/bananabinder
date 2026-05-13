'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Phone, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { AuthError } from '@supabase/supabase-js';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const next = searchParams.get('next') || '/';
  const initialPhone = searchParams.get('phone') || '';

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 9) {
      toast.error('Masukkan nomor HP yang valid');
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = phone.startsWith('0')
        ? `+62${phone.slice(1)}`
        : phone.startsWith('+')
          ? phone
          : `+62${phone}`;

      const checkRes = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      const { exists } = await checkRes.json();
      if (!exists) {
        router.push(
          `/register?phone=${encodeURIComponent(phone)}&next=${encodeURIComponent(next)}`,
        );
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      toast.success('Kode OTP telah dikirim');
      setStep('otp');
    } catch (err) {
      const error = err as AuthError;
      toast.error(error.message || 'Gagal mengirim OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error('Masukkan 6 digit kode OTP');
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = phone.startsWith('0')
        ? `+62${phone.slice(1)}`
        : phone.startsWith('+')
          ? phone
          : `+62${phone}`;

      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      toast.success('Berhasil masuk!');
      router.push(next as Route);
      router.refresh();
    } catch (err) {
      const error = err as AuthError;
      toast.error(error.message || 'Kode OTP salah atau kedaluwarsa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      const error = err as AuthError;
      toast.error(error.message || 'Gagal login via Google');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FDFCFB]">
      {/* Header */}
      <header className="flex h-16 items-center px-[clamp(16px,5vw,20px)] pt-[env(safe-area-inset-top)]">
        <button
          onClick={() => (step === 'otp' ? setStep('phone') : router.back())}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 active:scale-95 transition-transform"
        >
          <ChevronLeft size={22} className="text-ink" />
        </button>
      </header>

      <main className="flex flex-1 flex-col px-[clamp(24px,8vw,32px)] pt-8 pb-10">
        <div className="mb-10">
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="font-heading text-[28px] font-extrabold leading-tight text-ink">
              {step === 'phone' ? 'Selamat Datang!' : 'Verifikasi Kode'}
            </h1>
            <p className="mt-2 text-sm font-medium text-ink-3">
              {step === 'phone'
                ? 'Masuk atau daftar untuk mulai belanja kebutuhan binder & stationery.'
                : `Masukkan 6 digit kode yang dikirim ke ${phone}`}
            </p>
          </m.div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <m.form
              key="phone-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
              onSubmit={handleSendOtp}
            >
              <div className="relative">
                <label className="mb-2 block font-heading text-[13px] font-bold text-ink">
                  Nomor Handphone
                </label>
                <div className="group relative flex items-center">
                  <div className="absolute left-4 text-[#A09890] transition-colors group-focus-within:text-primary">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    placeholder="0812xxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                    className="h-14 w-full rounded-2xl border border-stone-3 bg-white pl-12 pr-4 font-sans text-[15px] font-semibold text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !phone}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Lanjutkan'}
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="h-px w-full bg-stone-2" />
                <span className="absolute bg-[#FDFCFB] px-3 font-heading text-[11px] font-bold uppercase tracking-wider text-[#A09890]">
                  Atau pakai
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-stone-3 bg-white font-heading text-[15px] font-bold text-ink transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                      />
                    </svg>
                    Google
                  </>
                )}
              </button>
              <p className="text-center text-sm text-ink-3">
                Belum punya akun?{' '}
                <Link href={'/register' as Route} className="font-bold text-primary">
                  Daftar sekarang
                </Link>
              </p>
            </m.form>
          ) : (
            <m.form
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6"
              onSubmit={handleVerifyOtp}
            >
              <div className="relative">
                <label className="mb-2 block font-heading text-[13px] font-bold text-ink">
                  Kode OTP
                </label>
                <div className="group relative flex items-center">
                  <div className="absolute left-4 text-[#A09890] transition-colors group-focus-within:text-primary">
                    <ShieldCheck size={18} />
                  </div>
                  <input
                    type="tel"
                    maxLength={6}
                    placeholder="xxxxxx"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="h-14 w-full rounded-2xl border border-stone-3 bg-white pl-12 pr-4 font-heading text-[18px] font-bold tracking-[8px] text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:tracking-normal placeholder:text-sm placeholder:font-medium"
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Masuk'}
              </button>

              <p className="text-center text-sm font-medium text-ink-3">
                Tidak menerima kode?{' '}
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="font-bold text-primary active:opacity-70"
                >
                  Kirim ulang
                </button>
              </p>
            </m.form>
          )}
        </AnimatePresence>

        <p className="mt-auto text-center text-xs leading-relaxed text-ink-4">
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
