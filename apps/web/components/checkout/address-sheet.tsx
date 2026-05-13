'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { m } from 'framer-motion';
import {
  X,
  Loader2,
  Navigation,
  Check,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Search,
} from 'lucide-react';
import { getDetailedAddress } from '@bananasbindery/core';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { useLocationStore } from '@/stores/location-store';
import { JumpingDots } from '@/components/shared/jumping-dots';
import type { AuthError } from '@supabase/supabase-js';
import { type Address, getUserAddresses } from '@/lib/services/address-client';

// Dynamically import the map component with SSR disabled
const AddressMap = dynamic(() => import('./address-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-stone">
      <Loader2 className="animate-spin text-primary" size={24} />
    </div>
  ),
});

interface AddressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (address: Partial<Address>) => void;
  initialData?: Address | null;
}

export function AddressSheet({ isOpen, onClose, onSuccess, initialData }: AddressSheetProps) {
  const { user } = useAuth();
  const globalLocation = useLocationStore();
  const [step, setStep] = useState<'list' | 'map' | 'form' | 'otp'>('list');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [coords, setCoords] = useState<[number, number]>(
    globalLocation.coords || [-6.2088, 106.8456],
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isLoadingDetails, setIsLoadingLoadingDetails] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  // Form State
  const [label, setLabel] = useState('Rumah');
  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isDefault, setIsDefault] = useState(true);

  // OTP State
  const [otpToken, setOtpToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen && initialData) {
      // Edit Mode: Pre-fill states
      setLabel(initialData.label || 'Rumah');
      setRecipient(initialData.recipient_name || '');
      setPhone(initialData.phone || '');
      setFullAddress(initialData.full_address || '');
      setCity(initialData.city || '');
      setDistrict(initialData.district || '');
      setPostalCode(initialData.postal_code || '');
      setIsDefault(initialData.is_default || false);
      setCoords([initialData.latitude || -6.2088, initialData.longitude || 106.8456]);
      setBiteshipAreaId(initialData.biteship_area_id || '');
      setStep('map'); // Start with the map for verification
    } else if (isOpen && user) {
      setIsLoadingAddresses(true);
      getUserAddresses().then((addresses) => {
        setSavedAddresses(addresses);
        if (addresses.length > 0) {
          setStep('list');
        } else {
          setStep('map');
        }
        setIsLoadingAddresses(false);
      });
    } else if (isOpen && !user) {
      setStep('map');
    }
  }, [isOpen, user, initialData]);

  const handleDetectLocation = () => {
    if ('geolocation' in navigator) {
      setIsLocating(true);

      // Check permission status first to provide better feedback
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
          if (latestStatusRef.current === 'denied' || result.state === 'denied') {
            toast.error(
              'Izin lokasi diblokir oleh browser. Klik ikon "Tune/Lock" di sebelah URL untuk mereset izin.',
              {
                duration: 5000,
              },
            );
            setIsLocating(false);
            return;
          }
        });
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords([position.coords.latitude, position.coords.longitude]);
          setIsLocating(false);
        },
        (error) => {
          setIsLocating(false);
          if (error.code === 1) {
            // PERMISSION_DENIED
            toast.error('Izin lokasi ditolak. Silakan aktifkan di pengaturan browser Anda.');
          } else {
            toast.error('Gagal mendeteksi lokasi. Pastikan GPS aktif.');
          }
        },
        { timeout: 8000, enableHighAccuracy: true },
      );
    } else {
      toast.error('Browser ini tidak mendukung deteksi lokasi (Membutuhkan HTTPS)');
    }
  };

  const latestStatusRef = useRef<string>('prompt');
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        latestStatusRef.current = result.state;
        result.onchange = () => {
          latestStatusRef.current = result.state;
        };
      });
    }
  }, []);

  const handleOpenInGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}`;
    window.open(url, '_blank');
  };

  const handleMapSearch = async () => {
    if (!mapSearchQuery.trim()) return;
    setIsSearchingMap(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          mapSearchQuery,
        )}&limit=1`,
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        toast.success('Lokasi ditemukan!');
      } else {
        toast.error('Lokasi tidak ditemukan');
      }
    } catch {
      toast.error('Gagal mencari lokasi');
    } finally {
      setIsSearchingMap(false);
    }
  };

  const [biteshipAreaId, setBiteshipAreaId] = useState('');

  const handleConfirmLocation = async () => {
    setIsLoadingLoadingDetails(true);
    try {
      // 1. Get Address Details from Nominatim
      const details = await getDetailedAddress(coords[0], coords[1]);
      setFullAddress(details.fullAddress);
      setCity(details.city);
      setDistrict(details.district || '');
      setPostalCode(details.postcode || '');

      // 2. Search for Biteship Area ID
      const searchQuery =
        `${details.district || details.village || details.city} ${details.postcode || ''}`.trim();
      const areaRes = await fetch(`/api/shipping/areas?input=${encodeURIComponent(searchQuery)}`);
      const areaData = await areaRes.json();

      if (areaRes.ok && areaData.areas?.length > 0) {
        // Pick the best match (usually the first one)
        setBiteshipAreaId(areaData.areas[0].id);
      }

      setStep('form');
    } catch {
      toast.error('Gagal mengambil detail alamat');
    } finally {
      setIsLoadingLoadingDetails(false);
    }
  };

  const handleInitiateVerification = async () => {
    if (!recipient || !phone || !fullAddress) {
      toast.error('Mohon lengkapi data alamat');
      return;
    }

    const formattedPhone = phone.startsWith('0')
      ? `+62${phone.slice(1)}`
      : phone.startsWith('+')
        ? phone
        : `+62${phone}`;

    if (user) {
      await saveAddress(user.id);
      return;
    }

    // Guest user: Send OTP to verify phone
    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          data: {
            full_name: recipient,
          },
        },
      });

      if (error) throw error;

      toast.success('Kode OTP telah dikirim ke nomor HP kamu');
      setStep('otp');
    } catch (err) {
      const error = err as AuthError;
      toast.error(error.message || 'Gagal mengirim kode OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyAndSave = async () => {
    if (otpToken.length < 6) {
      toast.error('Masukkan 6 digit kode OTP');
      return;
    }

    const formattedPhone = phone.startsWith('0')
      ? `+62${phone.slice(1)}`
      : phone.startsWith('+')
        ? phone
        : `+62${phone}`;

    setIsSaving(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpToken,
        type: 'sms',
      });

      if (error) throw error;
      if (!data.user) throw new Error('Verifikasi gagal');

      await saveAddress(data.user.id);
    } catch (err) {
      const error = err as AuthError;
      toast.error(error.message || 'Kode OTP salah atau kedaluwarsa');
      setIsSaving(false);
    }
  };

  const saveAddress = async (userId: string) => {
    setIsSaving(true);
    try {
      // 1. If this is marked as default, unset all other addresses for this user first
      if (isDefault) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
      }

      // 2. Insert or Update the address
      let result;
      if (initialData?.id) {
        // UPDATE MODE
        result = await supabase
          .from('addresses')
          .update({
            label,
            recipient_name: recipient,
            phone,
            full_address: fullAddress,
            city,
            district,
            postal_code: postalCode,
            biteship_area_id: biteshipAreaId,
            latitude: coords[0],
            longitude: coords[1],
            is_default: isDefault,
          })
          .eq('id', initialData.id)
          .select()
          .single();
      } else {
        // INSERT MODE
        result = await supabase
          .from('addresses')
          .insert({
            user_id: userId,
            label,
            recipient_name: recipient,
            phone,
            full_address: fullAddress,
            city,
            district,
            postal_code: postalCode,
            biteship_area_id: biteshipAreaId,
            latitude: coords[0],
            longitude: coords[1],
            is_default: isDefault,
          })
          .select()
          .single();
      }

      const { data: savedAddress, error } = result;

      if (error) throw error;

      await supabase.from('profiles').update({ phone, name: recipient }).eq('id', userId);

      toast.success('Alamat berhasil disimpan');

      if (savedAddress) {
        onSuccess(savedAddress as Address);
      }
      onClose();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Gagal menyimpan alamat');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <m.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-[430px] rounded-t-[32px] bg-white pb-10"
      >
        <div className="flex items-center justify-between p-6">
          <h2 className="font-heading text-[18px] font-extrabold text-ink text-left">
            {step === 'list'
              ? 'Pilih Alamat'
              : step === 'map'
                ? 'Pilih Titik Lokasi'
                : step === 'otp'
                  ? 'Verifikasi Nomor HP'
                  : initialData
                    ? 'Edit Alamat'
                    : 'Detail Alamat'}
          </h2>
          <button onClick={onClose} className="rounded-full bg-stone p-2 text-ink-3">
            <X size={20} />
          </button>
        </div>

        <div className="px-6">
          {step === 'list' ? (
            <m.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4"
            >
              {isLoadingAddresses ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[50vh] no-scrollbar">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        onClick={() => {
                          onSuccess(addr);
                          onClose();
                        }}
                        className="flex flex-col gap-1 rounded-2xl border border-stone-2 p-4 text-left transition-all active:scale-[0.98] hover:border-primary/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-heading text-sm font-bold text-ink">
                            {addr.recipient_name}
                          </span>
                          {addr.is_default && (
                            <span className="rounded-md bg-primary/10 px-2 py-0.5 font-heading text-[10px] font-bold text-primary uppercase tracking-wider">
                              Utama
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-ink-3">{addr.phone}</p>
                        <p className="line-clamp-2 text-[12px] text-ink-4 leading-relaxed">
                          {addr.full_address}, {addr.city}, {addr.postal_code}
                        </p>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setStep('map')}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-3 font-heading text-[14px] font-bold text-ink-3 transition-colors active:bg-stone hover:border-primary/50 hover:text-primary"
                  >
                    + Tambah Alamat Baru
                  </button>
                </>
              )}
            </m.div>
          ) : step === 'map' ? (
            <div className="flex flex-col gap-6">
              {/* Manual Search Fallback */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-4" size={18} />
                <input
                  type="text"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  placeholder="Cari nama jalan atau area..."
                  className="h-12 w-full rounded-xl border border-stone-2 bg-stone/30 pl-11 pr-20 font-sans text-sm outline-none focus:border-primary/50 focus:bg-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleMapSearch()}
                />
                <button
                  onClick={handleMapSearch}
                  disabled={isSearchingMap}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary/10 px-3 py-1.5 font-heading text-[11px] font-bold text-primary active:scale-95 transition-transform disabled:opacity-50"
                >
                  {isSearchingMap ? <Loader2 className="animate-spin" size={14} /> : 'Cari'}
                </button>
              </div>

              <div className="relative h-[300px] w-full overflow-hidden rounded-2xl border border-stone-2 shadow-inner">
                <AddressMap coords={coords} onClick={(lat, lng) => setCoords([lat, lng])} />
                <button
                  onClick={handleOpenInGoogleMaps}
                  className="absolute bottom-4 right-4 z-[10] flex h-10 items-center gap-2 rounded-lg bg-white px-3 font-heading text-[12px] font-bold text-ink shadow-md active:scale-95 transition-transform"
                >
                  <ExternalLink size={14} />
                  Buka di Maps
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDetectLocation}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-stone-3 font-heading text-[14px] font-bold text-ink transition-colors active:bg-stone"
                >
                  {isLocating ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Navigation size={18} />
                  )}
                  Gunakan Lokasi Saat Ini
                </button>
                <button
                  onClick={handleConfirmLocation}
                  disabled={isLoadingDetails}
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoadingDetails ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    'Konfirmasi Titik Lokasi'
                  )}
                </button>
              </div>
            </div>
          ) : step === 'form' ? (
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] no-scrollbar text-left">
                <div>
                  <label className="mb-2 block text-[12px] font-bold text-ink-3">Label</label>
                  <div className="flex flex-wrap gap-2">
                    {['Rumah', 'Kantor', 'Kos', 'Lainnya'].map((l) => (
                      <button
                        key={l}
                        onClick={() => setLabel(l)}
                        className={`px-4 py-2 rounded-xl border font-heading text-[13px] font-bold transition-all ${
                          label === l
                            ? 'bg-primary border-primary text-white shadow-md shadow-primary/20'
                            : 'border-stone-3 text-ink-3 bg-white hover:border-primary/50'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-bold text-ink-3">
                      Nama Penerima
                    </label>
                    <input
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      className="h-12 w-full rounded-xl border border-stone-3 px-4 font-sans text-sm outline-none focus:border-primary"
                      placeholder="Contoh: Andi"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-bold text-ink-3">
                      Nomor HP
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                      className="h-12 w-full rounded-xl border border-stone-3 px-4 font-sans text-sm outline-none focus:border-primary"
                      placeholder="0812xxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-ink-3">
                    Alamat Lengkap
                  </label>
                  <textarea
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="w-full rounded-xl border border-stone-3 p-4 font-sans text-sm outline-none focus:border-primary"
                    rows={3}
                    placeholder="Nama jalan, nomor rumah, dll"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[12px] font-bold text-ink-3">Kota</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-12 w-full rounded-xl border border-stone-3 bg-stone px-4 font-sans text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] font-bold text-ink-3">
                      Kecamatan
                    </label>
                    <input
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="h-12 w-full rounded-xl border border-stone-3 px-4 font-sans text-sm outline-none focus:border-primary"
                      placeholder="Kecamatan"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-ink-3">Kode Pos</label>
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="h-12 w-full rounded-xl border border-stone-3 px-4 font-sans text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-start gap-3 py-3 px-1">
                  <button
                    onClick={() => setIsDefault(!isDefault)}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${isDefault ? 'border-primary bg-primary text-white' : 'border-stone-3'}`}
                  >
                    {isDefault && <Check size={16} strokeWidth={3} />}
                  </button>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-ink">Jadikan Alamat Utama</span>
                    <span className="text-[11px] text-ink-4 leading-normal">
                      Alamat ini akan otomatis terpilih untuk setiap pesanan baru kamu.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setStep('map')}
                  className="h-14 flex-1 rounded-2xl border border-stone-3 font-heading text-[15px] font-bold text-ink"
                >
                  Kembali
                </button>
                <button
                  onClick={handleInitiateVerification}
                  disabled={isVerifying || isSaving}
                  className="h-14 flex-[2] rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70"
                >
                  {isVerifying || isSaving ? (
                    <JumpingDots />
                  ) : user ? (
                    'Simpan Alamat'
                  ) : (
                    'Simpan & Verifikasi'
                  )}
                </button>
              </div>
            </m.div>
          ) : (
            <m.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-6 pb-4 text-left"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck size={28} />
                </div>
                <p className="text-sm font-medium text-ink-3">
                  Masukkan 6 digit kode yang dikirim ke <br />
                  <span className="font-bold text-ink">{phone}</span>
                </p>
              </div>

              <div className="relative">
                <input
                  type="tel"
                  maxLength={6}
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/[^0-9]/g, ''))}
                  className="h-16 w-full rounded-2xl border-2 border-stone-3 bg-stone/30 text-center font-heading text-[24px] font-bold tracking-[12px] text-ink outline-none focus:border-primary focus:bg-white"
                  placeholder="xxxxxx"
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleVerifyAndSave}
                  disabled={isSaving || otpToken.length < 6}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-heading text-[15px] font-extrabold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? (
                    <JumpingDots />
                  ) : (
                    <>
                      Verifikasi & Lanjutkan <ArrowRight size={18} />
                    </>
                  )}
                </button>
                <div className="flex flex-col gap-2 pt-2 text-center">
                  <p className="text-[11px] text-ink-4 italic">
                    Belum setup SMS? Gunakan kode <b>123456</b>
                  </p>
                  <button
                    onClick={() => setStep('form')}
                    className="font-heading text-[13px] font-bold text-ink-4 hover:text-ink transition-colors"
                  >
                    Ganti Nomor HP
                  </button>
                </div>
              </div>
            </m.div>
          )}
        </div>
      </m.div>
    </div>
  );
}
