'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Plus, 
  Upload, 
  CheckCircle2,
  Palette,
  Maximize2
} from 'lucide-react';
import Link from 'next/link';

const BINDER_SIZES = ['A5 (Paling Populer)', 'B5 (Standard)', 'A4 (Besar)', 'Custom Size'];
const MATERIALS = ['Premium Leather', 'Canvas Texture', 'Hardcover Matte', 'Transparent Flexy'];

export default function CustomOrderPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    size: '',
    material: '',
    description: '',
    quantity: 1
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Halo Bananasbindery! Saya ingin pesan custom binder:\n\n- Ukuran: ${formData.size}\n- Bahan: ${formData.material}\n- Jumlah: ${formData.quantity}\n- Deskripsi: ${formData.description}`;
    window.open(`https://wa.me/628123456789?text=${encodeURIComponent(text)}`, '_blank');
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32 pt-12">
      <main className="mx-auto max-w-[430px] p-6">
        {/* Progress Bar - Now Clickable for flexibility */}
        <div className="mb-10 flex justify-between px-2 relative">
          <div className="absolute top-4 left-0 h-0.5 w-full bg-stone -z-10" />
          {[1, 2, 3].map((i) => (
            <button 
              key={i} 
              onClick={() => step < 4 && i < step && setStep(i)}
              disabled={step === 4 || i >= step}
              className="flex flex-col items-center gap-2 group"
            >
              <div 
                className={`flex h-9 w-9 items-center justify-center rounded-full font-bold transition-all shadow-sm ${
                  step === i ? 'bg-primary text-white scale-110 ring-4 ring-primary/20' : 
                  step > i ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-white text-stone-3 border border-stone-2'
                }`}
              >
                {step > i ? <CheckCircle2 size={18} /> : i}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= i ? 'text-primary' : 'text-stone-3'}`}>
                {i === 1 ? 'Ukuran' : i === 2 ? 'Bahan' : 'Detail'}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <m.section
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-heading text-[22px] font-extrabold text-ink">Pilih Ukuran Binder</h2>
                <p className="mt-1 text-sm text-ink-3 px-4">Mulailah dengan menentukan ukuran yang paling sesuai dengan kebutuhanmu.</p>
              </div>

              <div className="grid gap-3">
                {BINDER_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => { setFormData({ ...formData, size }); nextStep(); }}
                    className={`flex items-center justify-between rounded-2xl border-2 p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      formData.size === size ? 'border-primary bg-primary/5 shadow-md' : 'border-white bg-white shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${formData.size === size ? 'bg-primary text-white' : 'bg-stone text-ink-3'}`}>
                        <Maximize2 size={20} />
                      </div>
                      <span className="font-heading text-[15px] font-bold text-ink">{size}</span>
                    </div>
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${formData.size === size ? 'border-primary bg-primary' : 'border-stone-2'}`}>
                      {formData.size === size && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="pt-4 text-center">
                <Link href="/" className="text-xs font-bold text-ink-4 hover:text-ink transition-colors">
                  Batal dan kembali ke beranda
                </Link>
              </div>
            </m.section>
          )}

          {step === 2 && (
            <m.section
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-heading text-[22px] font-extrabold text-ink">Material Cover</h2>
                <p className="mt-1 text-sm text-ink-3 px-4">Setiap bahan memberikan karakter yang berbeda pada bindermu.</p>
              </div>

              <div className="grid gap-3">
                {MATERIALS.map((m) => (
                  <button
                    key={m}
                    onClick={() => { setFormData({ ...formData, material: m }); nextStep(); }}
                    className={`flex items-center justify-between rounded-2xl border-2 p-5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      formData.material === m ? 'border-primary bg-primary/5 shadow-md' : 'border-white bg-white shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${formData.material === m ? 'bg-primary text-white' : 'bg-stone text-ink-3'}`}>
                        <Palette size={20} />
                      </div>
                      <span className="font-heading text-[15px] font-bold text-ink">{m}</span>
                    </div>
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${formData.material === m ? 'border-primary bg-primary' : 'border-stone-2'}`}>
                      {formData.material === m && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
              
              <button 
                onClick={prevStep} 
                className="flex w-full items-center justify-center gap-2 py-4 font-heading text-sm font-bold text-primary"
              >
                <ChevronLeft size={16} /> Kembali ke Ukuran
              </button>
            </m.section>
          )}

          {step === 3 && (
            <m.section
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="font-heading text-[22px] font-extrabold text-ink">Sentuhan Akhir</h2>
                <p className="mt-1 text-sm text-ink-3 px-4">Tambahkan detail atau referensi gambar agar kami bisa mewujudkannya.</p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-stone-2">
                  <textarea
                    rows={4}
                    placeholder="Tuliskan detail desain, warna khusus, atau teks yang ingin dicetak..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full resize-none border-none p-3 font-sans text-sm outline-none placeholder:text-ink-4"
                  />
                </div>

                <div className="rounded-2xl border-2 border-dashed border-stone-3 bg-white/50 p-8 text-center transition-colors hover:border-primary hover:bg-primary/5 cursor-pointer">
                  <Upload className="mx-auto mb-2 text-primary" size={32} />
                  <p className="text-xs font-bold text-ink">Upload Referensi Desain</p>
                  <p className="mt-1 text-[10px] text-ink-4">Mendukung JPG, PNG (Max 5MB)</p>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-2">
                  <span className="font-heading text-sm font-bold text-ink">Jumlah Pesanan</span>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setFormData(d => ({ ...d, quantity: Math.max(1, d.quantity - 1) }))}
                      className="h-9 w-9 rounded-full bg-stone flex items-center justify-center font-bold text-ink active:scale-90 transition-transform"
                    >
                      -
                    </button>
                    <span className="font-heading text-lg font-extrabold w-8 text-center">{formData.quantity}</span>
                    <button 
                      onClick={() => setFormData(d => ({ ...d, quantity: d.quantity + 1 }))}
                      className="h-9 w-9 rounded-full bg-primary flex items-center justify-center font-bold text-white shadow-md active:scale-90 transition-transform"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={prevStep}
                  className="h-14 flex-1 rounded-2xl bg-stone/50 font-heading text-[15px] font-bold text-ink active:scale-95 transition-transform"
                >
                  Kembali
                </button>
                <button 
                  onClick={handleSubmit}
                  className="h-14 flex-[2] rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                >
                  Kirim Pesanan
                </button>
              </div>
            </m.section>
          )}

          {step === 4 && (
            <m.section
              key="step4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-12 text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E3F2FD] text-primary shadow-inner">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="font-heading text-[26px] font-extrabold text-ink">Pesanan Terkirim!</h2>
              <p className="mt-3 px-8 text-sm leading-relaxed text-ink-3">
                Terima kasih! Tim desain kami akan segera menghubungimu via WhatsApp untuk proses pratinjau desain.
              </p>
              <Link 
                href="/"
                className="mt-12 flex h-14 w-full items-center justify-center rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20"
              >
                Kembali ke Beranda
              </Link>
            </m.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
