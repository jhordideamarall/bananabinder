"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button, Input } from "@bananasbindery/ui";
import { IconArrowLeft, IconCheck, IconLoader2 } from "@tabler/icons-react";
import Link from "next/link";

// Import Map dynamically to avoid SSR issues
const AddressMapPicker = dynamic(() => import("@/components/AddressMapPicker"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-3xl" />
});

interface LocationData {
  area_id: string;
  area_name: string;
}

export default function NewAddressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    receiver_name: "",
    phone: "",
    full_address: "",
    postal_code: "",
    biteship_area_id: "",
    area_name: "",
  });

  const handleLocationSelect = (data: LocationData) => {
    setFormData(prev => ({
      ...prev,
      biteship_area_id: data.area_id,
      area_name: data.area_name,
      // Auto fill address if empty
      full_address: prev.full_address || data.area_name
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.biteship_area_id) {
      alert("Silakan pilih lokasi di peta terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });

      if (res.ok) {
        router.push("/checkout");
      } else {
        const error = await res.json();
        alert(error.message || "Gagal menyimpan alamat.");
      }
    } catch (e) {
      alert("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
         <Link href="/checkout" className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <IconArrowLeft className="w-6 h-6" />
         </Link>
         <div>
            <h1 className="text-2xl font-black text-gray-900">Alamat Baru</h1>
            <p className="text-sm text-gray-500 font-medium">Pin lokasi Anda untuk pengiriman yang presisi.</p>
         </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
           <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">1. Pin Point Lokasi</h3>
           <AddressMapPicker onLocationSelect={handleLocationSelect} />
           {formData.area_name && (
             <div className="p-4 bg-primary/5 rounded-2xl flex items-center gap-3 border border-primary/10">
                <IconCheck className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold text-primary">Area Terdeteksi: <span className="uppercase">{formData.area_name}</span></span>
             </div>
           )}
        </section>

        <section className="space-y-6">
           <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">2. Detail Penerima</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-500 uppercase ml-1">Nama Penerima</label>
                 <Input 
                   required
                   placeholder="Contoh: Budi Santoso"
                   value={formData.receiver_name}
                   onChange={(e) => setFormData({...formData, receiver_name: e.target.value})}
                   className="h-14 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-500 uppercase ml-1">Nomor Telepon</label>
                 <Input 
                   required
                   placeholder="0812xxxx"
                   value={formData.phone}
                   onChange={(e) => setFormData({...formData, phone: e.target.value})}
                   className="h-14 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all"
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase ml-1">Alamat Lengkap</label>
              <textarea 
                required
                placeholder="Nama jalan, Nomor rumah, RT/RW, Patokan..."
                value={formData.full_address}
                onChange={(e) => setFormData({...formData, full_address: e.target.value})}
                className="w-full min-h-[120px] p-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
              />
           </div>

           <div className="space-y-2">
              <label className="text-xs font-black text-gray-500 uppercase ml-1">Kode Pos</label>
              <Input 
                required
                placeholder="12345"
                value={formData.postal_code}
                onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                className="h-14 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all"
              />
           </div>
        </section>

        <Button 
          type="submit" 
          disabled={loading || !formData.biteship_area_id}
          className="w-full h-16 rounded-2xl text-lg font-black bg-secondary hover:bg-secondary/90 shadow-xl shadow-secondary/20 transition-all"
        >
          {loading ? <IconLoader2 className="w-6 h-6 animate-spin" /> : "SIMPAN ALAMAT"}
        </Button>
      </form>
    </div>
  );
}
