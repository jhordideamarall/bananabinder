'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

if (typeof window !== 'undefined') {
  const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  });
  L.Marker.prototype.options.icon = DefaultIcon;
}

export interface MapZone {
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  label: string;
}

interface GeoZoneMapProps {
  zones: MapZone[];
  activeIndex: number | null;
  onMapClick: (lat: number, lng: number) => void;
  initialCenter: [number, number];
  onRequestFit?: () => void;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Fit map to all zones — ONLY when user explicitly requests it (button).
 * No auto-fit on every change to avoid dizzying camera moves.
 */
function FitController({ trigger, zones }: { trigger: number; zones: MapZone[] }) {
  const map = useMap();
  const lastTrigger = useRef<number>(trigger);

  useEffect(() => {
    if (trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;
    if (zones.length === 0) return;
    const bounds = L.latLngBounds(zones.map((z) => [z.centerLat, z.centerLng]));
    map.flyToBounds(bounds.pad(0.4), { duration: 0.6, easeLinearity: 0.5 });
  }, [trigger, zones, map]);

  return null;
}

export default function GeoZoneMap({
  zones,
  activeIndex,
  onMapClick,
  initialCenter,
}: GeoZoneMapProps) {
  // Trigger fit only on first mount — never auto on data changes
  const fitTriggerRef = useRef<number>(0);

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-xl border border-black/[0.08]">
      <MapContainer
        center={initialCenter}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        doubleClickZoom={false}
        zoomSnap={0.5}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={120}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onClick={onMapClick} />
        <FitController trigger={fitTriggerRef.current} zones={zones} />
        {zones.map((z, i) => {
          const isActive = i === activeIndex;
          return (
            <div key={i}>
              <Marker position={[z.centerLat, z.centerLng]} />
              <Circle
                center={[z.centerLat, z.centerLng]}
                radius={z.radiusKm * 1000}
                pathOptions={{
                  color: isActive ? '#E07B39' : '#1D1D1F',
                  fillColor: isActive ? '#E07B39' : '#1D1D1F',
                  fillOpacity: isActive ? 0.18 : 0.06,
                  weight: isActive ? 2 : 1.25,
                }}
              />
            </div>
          );
        })}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium text-[#86868B] shadow-sm backdrop-blur">
        Klik peta untuk tambah zona · Cubit / scroll untuk zoom
      </div>
    </div>
  );
}
