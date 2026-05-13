'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { m, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  User,
  Phone,
  Mail,
  Loader2,
  Camera,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import type { AuthError } from '@supabase/supabase-js';
import type { Route } from 'next';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const next = searchParams.get('next') || '/';
  const initialPhone = searchParams.get('phone') || '';

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formattedPhone = phone.startsWith('0')
    ? `+62${phone.slice(1)}`
    : phone.startsWith('+')
      ? phone
      : `+62${phone}`;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error('Nama dan Nomor HP wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          data: {
            full_name: name,
            email: email || undefined,
          },
        },
      });

      if (error) throw error;

      toast.success('Kode verifikasi dikirim ke HP kamu');
      setStep('otp');
    } catch (err) {
      const error = err as AuthError;
      toast.error(error.message || 'Gagal mendaftar');
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
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      toast.success('Berhasil daftar dan masuk!');
      router.push(next as Route);
      router.refresh();
    } catch (err) {
      const error = err as AuthError;
      toast.error(error.message || 'Kode OTP salah atau kedaluwarsa');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#FDFCFB]">
      <header className="flex h-16 items-center px-[clamp(16px,5vw,20px)] pt-[env(safe-area-inset-top)]">
        <button
          onClick={() => (step === 'otp' ? setStep('form') : router.back())}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 active:scale-95 transition-transform"
        >
          <ChevronLeft size={22} className="text-ink" />
        </button>
      </header>

      <main className="flex flex-1 flex-col px-[clamp(24px,8vw,32px)] pt-8 pb-10">
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <m.div
              key="form-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-1 flex-col"
            >
              <div className="mb-10 text-center">
                <m.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mx-auto mb-6 relative flex h-24 w-24 items-center justify-center rounded-full bg-stone"
                >
                  <User size={40} className="text-[#A09890]" />
                  <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md">
                    <Camera size={16} />
                  </button>
                </m.div>
                <h1 className="font-heading text-[26px] font-extrabold text-ink">Buat Profil</h1>
                <p className="mt-2 text-sm font-medium text-ink-3">
                  Lengkapi data dirimu untuk mulai memesan.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
                <div className="space-y-1.5">
                  <label className="ml-1 font-heading text-[13px] font-bold text-ink">
                    Nama Lengkap
                  </label>
                  <div className="group relative flex items-center">
                    <div className="absolute left-4 text-[#A09890] transition-colors group-focus-within:text-primary">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-stone-3 bg-white pl-12 pr-4 font-sans text-[15px] font-semibold text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 font-heading text-[13px] font-bold text-ink">
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
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 font-heading text-[13px] font-bold text-ink">
                    Email (Opsional)
                  </label>
                  <div className="group relative flex items-center">
                    <div className="absolute left-4 text-[#A09890] transition-colors group-focus-within:text-primary">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 w-full rounded-2xl border border-stone-3 bg-white pl-12 pr-4 font-sans text-[15px] font-semibold text-ink outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !name || !phone}
                  className="mt-4 flex h-14 w-full items-center justify-center rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
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
          ) : (
            <m.div
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-1 flex-col"
            >
              <div className="mb-10">
                <h1 className="font-heading text-[28px] font-extrabold leading-tight text-ink">
                  Verifikasi Kode
                </h1>
                <p className="mt-2 text-sm font-medium text-ink-3">
                  Masukkan 6 digit kode yang dikirim ke{' '}
                  <span className="font-bold text-ink">{phone}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ShieldCheck size={28} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 font-heading text-[13px] font-bold text-ink">
                    Kode OTP
                  </label>
                  <input
                    type="tel"
                    maxLength={6}
                    placeholder="xxxxxx"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="h-16 w-full rounded-2xl border-2 border-stone-3 bg-stone/30 text-center font-heading text-[24px] font-bold tracking-[12px] text-ink outline-none focus:border-primary focus:bg-white"
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      Verifikasi & Masuk <ArrowRight size={18} />
                    </>
                  )}
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
              </form>
            </m.div>
          )}
        </AnimatePresence>
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
