'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Save, MapPin, Crosshair, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Tables } from '@bananasbindery/types/supabase';
import { saveStoreSettings } from '@/app/admin/actions';

type StoreSettingsRow = Tables<'store_settings'>;

const StoreLocationMap = dynamic(() => import('./StoreLocationMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] items-center justify-center rounded-xl border border-black/[0.08] bg-[#FAFAFA] text-[12px] text-[#86868B]">
      Memuat peta...
    </div>
  ),
});

interface ResolveResponse {
  address: string;
  postalCode: string | null;
  biteshipAreaId: string | null;
  biteshipLabel: string | null;
  candidates: Array<{ id: string; label: string; postalCode?: string | undefined }>;
}

const inputClass =
  'h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-[14px] font-medium text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'text-[12px] font-medium text-[#86868B]';

// Default = Bogor (existing fallback)
const DEFAULT_LAT = -6.570345;
const DEFAULT_LNG = 106.7767107;

interface StoreLocationPickerProps {
  settings: StoreSettingsRow | undefined;
}

export function StoreLocationPicker({ settings }: StoreLocationPickerProps) {
  const [lat, setLat] = useState<number>(
    settings?.origin_latitude != null ? Number(settings.origin_latitude) : DEFAULT_LAT,
  );
  const [lng, setLng] = useState<number>(
    settings?.origin_longitude != null ? Number(settings.origin_longitude) : DEFAULT_LNG,
  );
  const [areaId, setAreaId] = useState<string>(settings?.origin_area_id ?? 'IDNP6M3K2W1');
  const [address, setAddress] = useState<string>(settings?.origin_address ?? '');
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; trigger: number } | null>(null);

  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ResolveResponse['candidates']>([]);
  const [autoResolved, setAutoResolved] = useState(false);
  const resolveSeqRef = useRef(0);

  const resolveCoords = useCallback(async (nextLat: number, nextLng: number) => {
    setResolving(true);
    setResolveError(null);
    setAutoResolved(false);
    const seq = ++resolveSeqRef.current;

    try {
      const res = await fetch('/api/admin/store-location/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: nextLat, longitude: nextLng }),
      });
      const data = (await res.json()) as ResolveResponse & { error?: string };
      if (seq !== resolveSeqRef.current) return; // outdated
      if (!res.ok) {
        setResolveError(data.error ?? 'Gagal resolve lokasi');
        return;
      }
      if (data.address) setAddress(data.address);
      if (data.biteshipAreaId) {
        setAreaId(data.biteshipAreaId);
        setAutoResolved(true);
      }
      setCandidates(data.candidates ?? []);
    } catch (err) {
      if (seq !== resolveSeqRef.current) return;
      setResolveError(err instanceof Error ? err.message : 'Gagal resolve lokasi');
    } finally {
      if (seq === resolveSeqRef.current) setResolving(false);
    }
  }, []);

  // Debounced auto-resolve when lat/lng changes
  useEffect(() => {
    const timer = setTimeout(() => {
      void resolveCoords(lat, lng);
    }, 700);
    return () => clearTimeout(timer);
  }, [lat, lng, resolveCoords]);

  const handleUseMyLocation = (): void => {
    if (!navigator.geolocation) {
      setResolveError('Browser tidak support geolocation');
      return;
    }
    setResolving(true);
    setResolveError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = pos.coords.latitude;
        const nextLng = pos.coords.longitude;
        setLat(nextLat);
        setLng(nextLng);
        setFlyTo({ lat: nextLat, lng: nextLng, trigger: Date.now() });
      },
      (err) => {
        setResolving(false);
        setResolveError(`Akses lokasi ditolak: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <form action={saveStoreSettings} className="rounded-2xl border border-black/[0.06] bg-white">
      <div className="flex items-start gap-3 border-b border-black/[0.06] px-6 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-[#1D1D1F]">
          <MapPin className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">
            Lokasi toko (origin pengiriman)
          </h3>
          <p className="mt-0.5 text-[13px] leading-relaxed text-[#86868B]">
            Klik peta, geser pin, atau pakai lokasi GPS. Area Biteship auto-detect dari koordinat.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={resolving}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[#1D1D1F] px-3.5 text-[12px] font-medium text-white transition-colors hover:bg-black disabled:opacity-60"
          >
            <Crosshair className="h-3.5 w-3.5" strokeWidth={2} />
            Gunakan lokasi saya
          </button>
          {resolving ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-medium text-blue-700">
              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
              Mendeteksi area...
            </span>
          ) : autoResolved ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
              Area Biteship terdeteksi
            </span>
          ) : null}
          {resolveError ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[11px] font-medium text-red-700">
              <AlertCircle className="h-3 w-3" strokeWidth={2} />
              {resolveError}
            </span>
          ) : null}
        </div>

        <StoreLocationMap
          lat={lat}
          lng={lng}
          onChange={(nextLat, nextLng) => {
            setLat(nextLat);
            setLng(nextLng);
          }}
          flyToCoords={flyTo}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className={labelClass}>Latitude</span>
            <input
              name="origin_latitude"
              type="number"
              step="any"
              required
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              className={inputClass}
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelClass}>Longitude</span>
            <input
              name="origin_longitude"
              type="number"
              step="any"
              required
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className={labelClass}>Alamat toko</span>
          <input
            name="origin_address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
            placeholder="Auto-fill dari koordinat..."
          />
        </label>

        <div className="space-y-2 rounded-xl border border-black/[0.06] bg-[#FAFAFA] p-4">
          <div className="flex items-center justify-between">
            <label className="block">
              <span className={labelClass}>Biteship Area ID</span>
              <input
                name="origin_area_id"
                required
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className={`${inputClass} mt-1.5 font-mono`}
                placeholder="IDNP6M3K2W1"
              />
            </label>
          </div>
          {candidates.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-[#86868B]">
                Pilih area yang paling cocok:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {candidates.map((c) => {
                  const isSelected = c.id === areaId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAreaId(c.id)}
                      className={`rounded-full px-3 py-1.5 text-left text-[11px] font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#1D1D1F] text-white'
                          : 'bg-white border border-black/[0.08] text-[#1D1D1F] hover:bg-black/[0.04]'
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="flex items-center justify-end border-t border-black/[0.06] bg-[#FAFAFA] px-6 py-4">
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1D1D1F] px-5 text-[14px] font-medium text-white transition-colors hover:bg-black"
        >
          <Save className="h-4 w-4" strokeWidth={2} />
          Simpan lokasi toko
        </button>
      </footer>
    </form>
  );
}
