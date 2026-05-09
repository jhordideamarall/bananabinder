import { db } from "@/lib/db";
import { getUserOrders } from "@bananasbindery/db";
import { Card, CardContent, Badge } from "@bananasbindery/ui";
import { getUser } from "@/lib/auth";
import {
  IconChevronRight,
  IconPackage,
  IconClock,
  IconTruck,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OrdersHistoryPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth");
  }

  const orders = await getUserOrders(db, user.id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <IconClock className="w-4 h-4" />;
      case "paid":
        return <IconCheck className="w-4 h-4" />;
      case "processing":
        return <IconPackage className="w-4 h-4" />;
      case "shipped":
        return <IconTruck className="w-4 h-4" />;
      case "delivered":
        return <IconCheck className="w-4 h-4" />;
      case "cancelled":
        return <IconX className="w-4 h-4" />;
      default:
        return <IconClock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "delivered":
        return "bg-green-100 text-green-600";
      case "pending":
      case "processing":
        return "bg-amber-100 text-amber-600";
      case "shipped":
        return "bg-blue-100 text-blue-600";
      case "cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900">Riwayat Pesanan</h1>
        <p className="text-gray-500 font-medium">
          Pantau status dan detail semua pembelianmu di sini.
        </p>
      </div>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <Card className="border-none shadow-xl shadow-gray-100/50 text-center py-20">
            <CardContent>
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <IconPackage className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-black text-gray-900">
                Belum ada pesanan
              </h3>
              <p className="text-gray-500 mt-2">
                Mulai belanja binder favoritmu sekarang!
              </p>
              <Link href="/">
                <button className="mt-6 px-8 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 transition-all">
                  Mulai Belanja
                </button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="border-none shadow-xl shadow-gray-100/50 hover:scale-[1.01] transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-primary">
                        <IconPackage className="w-8 h-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">
                            #{order.id.slice(0, 8)}
                          </span>
                          <Badge
                            className={`${getStatusColor(order.status)} border-none text-[10px] font-black uppercase tracking-widest px-2 py-0.5`}
                          >
                            <span className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 font-bold">
                          {new Date(order.created_at).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "long", year: "numeric" }
                          )}
                        </p>
                        <p className="text-sm font-bold text-gray-600 mt-2">
                          {order.items.length} Produk •{" "}
                          <span className="text-primary">
                            Rp {order.total_amount.toLocaleString("id-ID")}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300 group-hover:text-primary transition-colors">
                      <span className="text-xs font-black uppercase tracking-widest">
                        Detail
                      </span>
                      <IconChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
