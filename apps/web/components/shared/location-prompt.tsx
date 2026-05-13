'use client';
import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Search, X, Loader2, ChevronRight } from 'lucide-react';
import { useLocationStore } from '@/stores/location-store';
import { getCityFromCoords } from '@bananasbindery/core';
import { toast } from 'sonner';

interface LocationPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_CITIES = ['Jakarta', 'Tangerang', 'Bekasi', 'Depok', 'Bogor'];

export function LocationPrompt({ isOpen, onClose }: LocationPromptProps) {
  const { setCoords, setLocationName } = useLocationStore();
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRetry = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Browser kamu tidak mendukung GPS');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords([latitude, longitude]);
        const city = await getCityFromCoords(latitude, longitude);
        setLocationName(city);
        setIsLocating(false);
        toast.success(`Lokasi berhasil diatur ke ${city}`);
        onClose();
      },
      (error) => {
        setIsLocating(false);
        if (error.code === 1) {
          toast.error('Izin lokasi ditolak. Silakan ketik lokasi manual.');
        } else {
          toast.error('Gagal mendapatkan lokasi. Coba ketik manual ya.');
        }
      },
      { timeout: 10000 }
    );
  };

  const handleManualSelect = (city: string) => {
    setLocationName(city);
    // Default coords for popular cities if needed, or just keep name
    toast.success(`Lokasi diatur ke ${city}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <m.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 z-[210] w-full max-w-[430px] -translate-x-1/2 rounded-t-[32px] bg-white p-6 pb-10 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-ink">Pilih Lokasi</h3>
                  <p className="font-sans text-xs text-ink-3">Biar ongkirnya pas buat belanjamu</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-full bg-stone p-2 text-ink-3">
                <X size={20} />
              </button>
            </div>

            {/* Main Action */}
            <m.button
              whileTap={{ scale: 0.98 }}
              onClick={handleRetry}
              disabled={isLocating}
              className="mb-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20 transition-all disabled:opacity-70"
            >
              {isLocating ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Navigation size={18} fill="white" />
              )}
              {isLocating ? 'Mencari Lokasi...' : 'Gunakan Lokasi Saat Ini'}
            </m.button>

            {/* Manual Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Atau ketik nama kotamu..."
                className="h-12 w-full rounded-xl border border-stone-2 bg-stone/30 pl-11 pr-4 font-sans text-sm outline-none focus:border-primary/50 focus:bg-white"
                onKeyDown={(e) => e.key === 'Enter' && searchQuery && handleManualSelect(searchQuery)}
              />
            </div>

            {/* Popular Cities */}
            <div>
              <p className="mb-3 font-heading text-[12px] font-bold uppercase tracking-wider text-ink-4">
                Kota Populer
              </p>
              <div className="flex flex-col gap-2">
                {POPULAR_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleManualSelect(city)}
                    className="flex items-center justify-between rounded-xl border border-stone-2 p-3.5 transition-all hover:border-primary/30 active:bg-stone"
                  >
                    <span className="font-sans text-[14px] font-semibold text-ink">{city}</span>
                    <ChevronRight size={16} className="text-ink-4" />
                  </button>
                ))}
              </div>
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
