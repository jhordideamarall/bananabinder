"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { IconMapPin, IconSearch, IconLoader2 } from "@tabler/icons-react";

// Fix for default marker icon in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AddressMapPickerProps {
  onLocationSelect: (data: {
    lat: number;
    lng: number;
    address: string;
    area_id: string;
    area_name: string;
  }) => void;
}

function LocationMarker({
  onMove,
}: {
  onMove: (lat: number, lng: number) => void;
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onMove(e.latlng.lat, e.latlng.lng);
    },
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  return position === null ? null : <Marker position={position} />;
}

export default function AddressMapPicker({
  onLocationSelect,
}: AddressMapPickerProps) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const handleMove = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/shipping/areas/reverse?lat=${lat}&lng=${lng}`
      );
      const { area } = await res.json();

      if (area) {
        onLocationSelect({
          lat,
          lng,
          address: area.name, // Preliminary address from area name
          area_id: area.id,
          area_name: area.name,
        });
      }
    } catch (e) {
      console.error("Reverse geocoding failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari lokasi atau alamat..."
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="h-[400px] w-full rounded-3xl overflow-hidden border-4 border-white shadow-2xl relative">
        <MapContainer
          center={[-6.2, 106.816666]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onMove={handleMove} />
        </MapContainer>

        {loading && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-[1000] flex flex-col items-center justify-center gap-2">
            <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              Detecting Area...
            </span>
          </div>
        )}

        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur p-3 rounded-2xl shadow-xl flex items-center gap-2 border border-white">
          <IconMapPin className="w-4 h-4 text-secondary" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">
            Pin point for precision shipping
          </span>
        </div>
      </div>
    </div>
  );
}
