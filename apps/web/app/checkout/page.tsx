"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/store/useCart";
import {
  IconTruck,
  IconCreditCard,
  IconChevronRight,
  IconTicket,
  IconMapPin,
  IconLoader2,
  IconCircleCheck,
} from "@tabler/icons-react";
import { Button, Card, CardContent, Badge } from "@bananasbindery/ui";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Address {
  id: string;
  receiver_name: string;
  phone: string;
  full_address: string;
  postal_code: string;
  biteship_area_id: string;
  is_default: boolean;
}

interface ShippingRate {
  company: string;
  type: string;
  service: string;
  price: number;
  duration: string;
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart, syncWithServer } = useCart();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [fetchingAddresses, setFetchingAddresses] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [availableRates, setAvailableRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  // Load addresses and sync cart
  useEffect(() => {
    const init = async () => {
      await syncWithServer();
      try {
        const res = await fetch("/api/user/addresses");
        const { data } = await res.json();
        if (data) {
          setAddresses(data);
          const defaultAddr =
            data.find((a: Address) => a.is_default) || data[0];
          setSelectedAddress(defaultAddr);
        }
      } catch (e) {
        console.error("Failed to load addresses", e);
      } finally {
        setFetchingAddresses(false);
      }
    };
    init();
  }, [syncWithServer]);

  // Calculate shipping when address changes
  useEffect(() => {
    if (selectedAddress && items.length > 0) {
      const calculateShipping = async () => {
        setCalculatingShipping(true);
        try {
          const res = await fetch("/api/shipping/cost", {
            method: "POST",
            body: JSON.stringify({
              addressId: selectedAddress.id,
              items: items.map((i) => ({
                variantId: i.variantId,
                quantity: i.quantity,
              })),
            }),
            headers: { "Content-Type": "application/json" },
          });
          const { rates } = await res.json();
          if (rates) {
            setAvailableRates(rates);
            // Auto select cheapest or first
            setSelectedRate(rates[0]);
          }
        } catch (e) {
          console.error("Shipping calculation failed", e);
        } finally {
          setCalculatingShipping(false);
        }
      };
      calculateShipping();
    }
  }, [selectedAddress, items]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress || !selectedRate) {
      alert("Silakan pilih alamat dan kurir pengiriman");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          couponCode: couponCode || null,
          addressId: selectedAddress.id,
          courier: `${selectedRate.company} - ${selectedRate.service}`,
          courierDetails: {
            company: selectedRate.company,
            type: selectedRate.type,
            service: selectedRate.service,
          },
          shippingCost: selectedRate.price,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        clearCart();
        window.location.href = data.invoiceUrl;
      } else {
        alert(data.error || "Gagal membuat pesanan.");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat checkout.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <IconLoader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Menyiapkan checkout...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/cart" className="hover:text-primary transition-colors">
          Keranjang
        </Link>
        <IconChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-bold">Checkout</span>
      </div>

      <form
        onSubmit={handleCheckout}
        className="grid grid-cols-1 lg:grid-cols-3 gap-12"
      >
        {/* Left Column: Shipping & Details */}
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <IconMapPin className="w-6 h-6 text-primary" /> Alamat Pengiriman
            </h2>

            {fetchingAddresses ? (
              <div className="flex items-center gap-2 text-gray-400 py-8">
                <IconLoader2 className="w-5 h-5 animate-spin" /> Mencari alamat
                Anda...
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((addr) => (
                  <Card
                    key={addr.id}
                    className={`cursor-pointer transition-all border-2 ${selectedAddress?.id === addr.id ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"}`}
                    onClick={() => setSelectedAddress(addr)}
                  >
                    <CardContent className="p-5 flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            {addr.receiver_name}
                          </span>
                          {addr.is_default && (
                            <Badge className="bg-primary/20 text-primary border-none text-[10px]">
                              Utama
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{addr.phone}</p>
                        <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                          {addr.full_address}
                        </p>
                      </div>
                      {selectedAddress?.id === addr.id && (
                        <IconCircleCheck className="w-6 h-6 text-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  className="w-full border-dashed border-2 py-8 rounded-2xl text-gray-400 hover:text-primary hover:border-primary hover:bg-primary/5"
                  onClick={() => router.push("/profile/addresses/new")}
                  type="button"
                >
                  + Tambah Alamat Baru
                </Button>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <IconTruck className="w-6 h-6 text-primary" /> Pilihan Pengiriman
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calculatingShipping ? (
                <div className="col-span-full py-8 text-center text-gray-400">
                  <IconLoader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Mencari kurir tercepat...
                </div>
              ) : availableRates.length > 0 ? (
                availableRates.map((r, idx) => (
                  <Card
                    key={`${r.company}-${r.service}-${idx}`}
                    className={`cursor-pointer transition-all border-2 ${selectedRate?.service === r.service && selectedRate?.company === r.company ? "border-secondary bg-secondary/5" : "border-gray-100 hover:border-gray-200"}`}
                    onClick={() => setSelectedRate(r)}
                  >
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="text-left">
                        <p className="font-black uppercase text-xs tracking-widest text-primary">
                          {r.company}
                        </p>
                        <p className="font-bold text-sm text-gray-900">
                          {r.service}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                          {r.duration}
                        </p>
                      </div>
                      <span className="font-black text-sm text-gray-900">
                        Rp {r.price.toLocaleString("id-ID")}
                      </span>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full p-6 bg-gray-50 rounded-2xl text-center text-gray-400 font-bold text-sm">
                  Silakan pilih alamat terlebih dahulu.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <Card className="glass sticky top-24 border-white/40 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
            <CardContent className="p-8">
              <h2 className="text-xl font-bold mb-6">Ringkasan Belanja</h2>

              {/* Coupon */}
              <div className="mb-8">
                <div className="relative">
                  <IconTicket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="KODE PROMO"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    className="w-full pl-10 pr-20 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-xs font-bold tracking-widest"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 bottom-2 px-3 bg-primary text-white rounded-lg text-[10px] font-black hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                  >
                    PAKAI
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-500 text-sm font-medium">
                  <span>Subtotal</span>
                  <span>Rp {totalPrice().toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-sm font-medium">
                  <span>Ongkos Kirim</span>
                  {calculatingShipping ? (
                    <IconLoader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <span>
                      Rp {(selectedRate?.price || 0).toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
                <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Tagihan</span>
                  <span className="font-black text-2xl text-primary">
                    Rp{" "}
                    {(totalPrice() + (selectedRate?.price || 0)).toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !selectedAddress || calculatingShipping}
                className="w-full h-16 rounded-2xl text-lg font-black shadow-xl shadow-secondary/30 bg-secondary hover:bg-secondary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <IconLoader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <IconCreditCard className="w-6 h-6 mr-2" />
                    BAYAR SEKARANG
                  </>
                )}
              </Button>

              <div className="mt-8 pt-8 border-t border-gray-50 flex justify-center gap-4 grayscale opacity-50">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/e/eb/Logo_Xendit.png"
                  alt="Xendit"
                  className="h-4 object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
