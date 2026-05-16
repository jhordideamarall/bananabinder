'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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

interface StoreLocationMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  flyToCoords: { lat: number; lng: number; trigger: number } | null;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToController({ flyTo }: { flyTo: StoreLocationMapProps['flyToCoords'] }) {
  const map = useMap();
  const lastTrigger = useRef<number>(0);
  useEffect(() => {
    if (!flyTo || flyTo.trigger === lastTrigger.current) return;
    lastTrigger.current = flyTo.trigger;
    map.flyTo([flyTo.lat, flyTo.lng], 16, { duration: 0.6 });
  }, [flyTo, map]);
  return null;
}

export default function StoreLocationMap({
  lat,
  lng,
  onChange,
  flyToCoords,
}: StoreLocationMapProps) {
  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-xl border border-black/[0.08]">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        doubleClickZoom={false}
        zoomSnap={0.5}
        zoomDelta={0.5}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onClick={onChange} />
        <FlyToController flyTo={flyToCoords} />
        <Marker
          position={[lat, lng]}
          draggable
          eventHandlers={{
            dragend(e) {
              const m = e.target as L.Marker;
              const pos = m.getLatLng();
              onChange(pos.lat, pos.lng);
            },
          }}
        />
      </MapContainer>
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium text-[#86868B] shadow-sm backdrop-blur">
        Klik peta atau geser pin untuk pindah lokasi
      </div>
    </div>
  );
}
