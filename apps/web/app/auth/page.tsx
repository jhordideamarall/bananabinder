"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@bananasbindery/ui";
import { Phone, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: phone, 2: otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ phone }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        setStep(2);
        setMessage("Kode OTP telah dikirim ke WhatsApp Anda.");
        if (data.debug_otp) {
           console.log("[DEBUG] OTP:", data.debug_otp);
           setMessage(`[DEBUG MODE] OTP: ${data.debug_otp}`);
        }
      } else {
        setError(data.error || "Gagal mengirim OTP.");
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone, otp }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Login berhasil! Mengalihkan...");
        // Redirect to home or profile
        window.location.href = "/";
      } else {
        setError(data.error || "Kode OTP salah.");
      }
    } catch (err) {
      setError("Gagal memverifikasi OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Card className="w-full max-w-md glass shadow-2xl border-white/20 relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
        
        <CardHeader className="text-center pt-10">
          <div className="mx-auto w-12 h-12 bg-accent/30 rounded-full flex items-center justify-center text-2xl mb-4">
             🍌
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Selamat Datang</CardTitle>
          <CardDescription className="text-gray-500 mt-2">
            {step === 1 
              ? "Masuk atau daftar menggunakan nomor WhatsApp Anda." 
              : `Masukkan kode 6-digit yang dikirim ke ${phone}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-10">
          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> Nomor WhatsApp
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+62</span>
                  <input
                    type="tel"
                    placeholder="81234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 animate-fade-in">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading || phone.length < 8}
                className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
              >
                {loading ? "Mengirim..." : "Kirim Kode OTP"}
                {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>

              <p className="text-center text-xs text-gray-400">
                Dengan melanjutkan, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Kode Verifikasi</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full text-center text-2xl tracking-[0.5em] font-bold py-4 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                  required
                />
              </div>

              {message && (
                <div className="flex items-center gap-2 text-sm text-primary bg-primary/5 p-3 rounded-lg border border-primary/20 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" /> {message}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 animate-fade-in">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading || otp.length !== 6}
                className="w-full h-12 rounded-xl text-base font-bold bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20 transition-all"
              >
                {loading ? "Memverifikasi..." : "Masuk Sekarang"}
                {!loading && <CheckCircle2 className="ml-2 w-5 h-5" />}
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-gray-500 hover:text-primary transition-colors font-medium"
              >
                Ganti nomor WhatsApp?
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
