'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  MapPin as IconPin,
  Trash2 as IconTrash,
  Plus as IconPlus,
  Sparkles as IconSparkles,
} from 'lucide-react';
import type { RegionScope, GeoZone } from './types';

const GeoZoneMap = dynamic(() => import('./GeoZoneMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-xl border border-black/[0.08] bg-[#FAFAFA] text-[12px] text-[#86868B]">
      Memuat peta...
    </div>
  ),
});

interface GeoZonePickerProps {
  scope: RegionScope;
  onScopeChange: (scope: RegionScope) => void;
  zones: GeoZone[];
  onChange: (zones: GeoZone[]) => void;
}

interface RadiusPreset {
  id: string;
  label: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
}

// Preset zona populer — admin tinggal klik untuk pakai.
const ZONE_PRESETS: RadiusPreset[] = [
  {
    id: 'jabodetabek',
    label: 'Jabodetabek',
    centerLat: -6.2088,
    centerLng: 106.8456,
    radiusKm: 50,
  },
  { id: 'jakarta', label: 'Jakarta saja', centerLat: -6.2088, centerLng: 106.8456, radiusKm: 25 },
  {
    id: 'bandung-raya',
    label: 'Bandung Raya',
    centerLat: -6.9175,
    centerLng: 107.6191,
    radiusKm: 30,
  },
  {
    id: 'jogja-raya',
    label: 'Jogja & sekitarnya',
    centerLat: -7.7956,
    centerLng: 110.3695,
    radiusKm: 25,
  },
  { id: 'surabaya', label: 'Surabaya Raya', centerLat: -7.2575, centerLng: 112.7521, radiusKm: 35 },
];

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456]; // Jakarta

const SCOPE_LABELS: Record<RegionScope, string> = {
  all: 'Semua wilayah Indonesia',
  radius: 'Zona radius (peta)',
};

const SCOPE_HELPERS: Record<RegionScope, string> = {
  all: 'Berlaku untuk seluruh alamat pengiriman di Indonesia — tidak ada batasan wilayah.',
  radius: 'Tentukan zona di peta. Customer dapat gratis ongkir jika alamatnya masuk dalam zona.',
};

export function GeoZonePicker({ scope, onScopeChange, zones, onChange }: GeoZonePickerProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(zones.length > 0 ? 0 : null);

  const addZoneAt = (lat: number, lng: number, label = 'Zona baru', radius = 20): void => {
    const next: GeoZone[] = [...zones, { centerLat: lat, centerLng: lng, radiusKm: radius, label }];
    onChange(next);
    setActiveIndex(next.length - 1);
  };

  const applyPreset = (presetId: string): void => {
    const p = ZONE_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    addZoneAt(p.centerLat, p.centerLng, p.label, p.radiusKm);
  };

  const updateZone = (index: number, patch: Partial<GeoZone>): void => {
    const next = zones.map((z, i) => (i === index ? { ...z, ...patch } : z));
    onChange(next);
  };

  const removeZone = (index: number): void => {
    const next = zones.filter((_, i) => i !== index);
    onChange(next);
    setActiveIndex(next.length > 0 ? 0 : null);
  };

  return (
    <div className="space-y-4">
      <input type="hidden" name="regionScope" value={scope} />
      <input
        type="hidden"
        name="geoZonesJson"
        value={JSON.stringify(scope === 'radius' ? zones : [])}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        {(['all', 'radius'] as RegionScope[]).map((s) => {
          const active = scope === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onScopeChange(s)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                active
                  ? 'border-[#1D1D1F]/20 bg-primary/15'
                  : 'border-black/[0.06] bg-white hover:bg-black/[0.02]'
              }`}
            >
              <div className="flex items-center gap-2">
                <IconPin className="h-4 w-4 text-[#1D1D1F]" strokeWidth={1.75} />
                <span className="text-[13px] font-semibold text-[#1D1D1F]">{SCOPE_LABELS[s]}</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-[#86868B]">{SCOPE_HELPERS[s]}</p>
            </button>
          );
        })}
      </div>

      {scope === 'radius' ? (
        <div className="space-y-3 rounded-xl border border-black/[0.06] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] font-semibold tracking-tight text-[#1D1D1F]">
              Zona radius ({zones.length})
            </p>
            {zones.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  onChange([]);
                  setActiveIndex(null);
                }}
                className="text-[12px] font-medium text-[#86868B] hover:text-red-600"
              >
                Hapus semua
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#86868B]">
              <IconSparkles className="h-3 w-3" strokeWidth={1.75} />
              Preset cepat:
            </span>
            {ZONE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className="rounded-full bg-[#1D1D1F]/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F] transition-colors hover:bg-[#1D1D1F]/[0.12]"
              >
                + {p.label} ({p.radiusKm} km)
              </button>
            ))}
          </div>

          <p className="text-[11px] text-[#86868B]">
            Klik peta untuk tambah zona baru. Edit nama dan radius di kartu di bawah.
          </p>

          <GeoZoneMap
            zones={zones}
            activeIndex={activeIndex}
            onMapClick={(lat, lng) => addZoneAt(lat, lng)}
            initialCenter={
              zones.length > 0 ? [zones[0].centerLat, zones[0].centerLng] : DEFAULT_CENTER
            }
          />

          {zones.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/[0.12] bg-[#FAFAFA] p-6 text-center">
              <IconPlus className="mx-auto h-5 w-5 text-[#86868B]" strokeWidth={1.5} />
              <p className="mt-2 text-[12px] font-medium text-[#1D1D1F]">Belum ada zona</p>
              <p className="text-[11px] text-[#86868B]">Klik peta atau pakai preset di atas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {zones.map((z, i) => {
                const isActive = i === activeIndex;
                return (
                  <div
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                      isActive
                        ? 'border-[#1D1D1F]/20 bg-primary/8'
                        : 'border-black/[0.06] bg-white hover:bg-black/[0.02]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1D1D1F]/[0.06]">
                        <IconPin className="h-4 w-4 text-[#1D1D1F]" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          type="text"
                          value={z.label}
                          onChange={(e) => updateZone(i, { label: e.target.value })}
                          placeholder="Nama zona (mis. Jabodetabek)"
                          className="w-full rounded-lg border border-transparent bg-transparent px-1 text-[13px] font-semibold text-[#1D1D1F] outline-none hover:bg-black/[0.04] focus:border-black/[0.08] focus:bg-white focus:px-2"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <label className="text-[10px] font-medium text-[#86868B]">
                            <span className="block">Latitude</span>
                            <input
                              type="number"
                              step="0.000001"
                              value={z.centerLat}
                              onChange={(e) => updateZone(i, { centerLat: Number(e.target.value) })}
                              className="mt-0.5 h-8 w-full rounded-md border border-black/[0.08] bg-white px-2 text-[12px] font-medium text-[#1D1D1F] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                          </label>
                          <label className="text-[10px] font-medium text-[#86868B]">
                            <span className="block">Longitude</span>
                            <input
                              type="number"
                              step="0.000001"
                              value={z.centerLng}
                              onChange={(e) => updateZone(i, { centerLng: Number(e.target.value) })}
                              className="mt-0.5 h-8 w-full rounded-md border border-black/[0.08] bg-white px-2 text-[12px] font-medium text-[#1D1D1F] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                          </label>
                          <label className="text-[10px] font-medium text-[#86868B]">
                            <span className="block">Radius (km)</span>
                            <input
                              type="number"
                              min="1"
                              max="1000"
                              step="1"
                              value={z.radiusKm}
                              onChange={(e) =>
                                updateZone(i, {
                                  radiusKm: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                              className="mt-0.5 h-8 w-full rounded-md border border-black/[0.08] bg-white px-2 text-[12px] font-semibold text-[#1D1D1F] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                          </label>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="200"
                          step="1"
                          value={z.radiusKm}
                          onChange={(e) => updateZone(i, { radiusKm: Number(e.target.value) })}
                          className="w-full accent-[#E07B39]"
                          aria-label="Radius slider"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeZone(i);
                        }}
                        className="rounded-full p-1.5 text-[#86868B] hover:bg-red-500/10 hover:text-red-600"
                        aria-label={`Hapus zona ${z.label}`}
                      >
                        <IconTrash className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
