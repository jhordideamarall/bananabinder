import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { orders } from "@bananasbindery/db";
import { Card, CardContent, Badge } from "@bananasbindery/ui";
import { IconCircleCheck, IconClock, IconPackage, IconChevronLeft, IconMapPin, IconTruck } from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ShippingAddress {
  receiver_name: string;
  phone: string;
  full_address: string;
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, params.id),
    with: {
      items: true,
      user: true,
    }
  });

  if (!order) notFound();

  const isPaid = order.status === "paid";
  const isPending = order.status === "pending";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-primary mb-8 transition-colors">
        <IconChevronLeft className="w-4 h-4 mr-1" /> Kembali ke Beranda
      </Link>

      <div className="text-center mb-12">
        {isPaid ? (
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-6 animate-bounce">
            <IconCircleCheck className="w-10 h-10" />
          </div>
        ) : (
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 text-amber-600 rounded-full mb-6 animate-pulse">
            <IconClock className="w-10 h-10" />
          </div>
        )}
        <h1 className="text-3xl font-black text-gray-900">
          {isPaid ? "Terima Kasih Atas Pesananmu!" : "Menunggu Pembayaran"}
        </h1>
        <p className="text-gray-500 mt-2">ID Pesanan: <span className="font-mono font-bold text-gray-900">{order.id}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardContent className="p-8">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <IconPackage className="w-5 h-5 text-primary" /> Detail Produk
              </h2>
              <div className="space-y-6">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">{item.product_name}</p>
                      <p className="text-sm text-gray-500">Jumlah: {item.quantity}</p>
                    </div>
                    <p className="font-bold">Rp {item.price_at_time.toLocaleString("id-ID")}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-gray-50 space-y-3">
                 <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>Rp {order.subtotal.toLocaleString("id-ID")}</span>
                 </div>
                 <div className="flex justify-between text-sm text-gray-500">
                    <span>Pajak (11%)</span>
                    <span>Rp {(order.tax_amount || 0).toLocaleString("id-ID")}</span>
                 </div>
                 <div className="flex justify-between text-sm text-gray-500">
                    <span>Ongkos Kirim</span>
                    <span>Rp {order.shipping_cost.toLocaleString("id-ID")}</span>
                 </div>
                 {order.discount_amount !== null && order.discount_amount > 0 && (
                   <div className="flex justify-between text-sm text-green-600 font-bold">
                      <span>Diskon</span>
                      <span>- Rp {order.discount_amount.toLocaleString("id-ID")}</span>
                   </div>
                 )}
                 <div className="flex justify-between pt-4 text-xl font-black text-primary">
                    <span>Total</span>
                    <span>Rp {order.total_amount.toLocaleString("id-ID")}</span>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50 bg-gray-50/50">
             <CardContent className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <IconMapPin className="w-4 h-4 text-primary" /> Alamat Pengiriman
                </h3>
                <div className="text-sm space-y-1 text-gray-600">
                   <p className="font-bold text-gray-900">{(order.shipping_address as unknown as ShippingAddress)?.receiver_name}</p>
                   <p>{(order.shipping_address as unknown as ShippingAddress)?.phone}</p>
                   <p className="leading-relaxed">{(order.shipping_address as unknown as ShippingAddress)?.full_address}</p>
                </div>
             </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-gray-100/50">
             <CardContent className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <IconTruck className="w-4 h-4 text-primary" /> Status Pengiriman
                </h3>
                <div className="flex flex-col gap-4">
                   <Badge className={`${isPaid ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'} border-none py-2 px-4 rounded-xl text-center block w-full uppercase font-black tracking-widest`}>
                      {order.status}
                   </Badge>
                   {isPending && order.xendit_payment_url && (
                     <a 
                       href={order.xendit_payment_url} 
                       target="_blank"
                       className="inline-flex items-center justify-center rounded-md text-sm font-bold transition-colors bg-secondary text-white hover:bg-secondary/90 h-10 px-4 py-2"
                      >
                        Bayar Sekarang
                      </a>
                   )}
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
