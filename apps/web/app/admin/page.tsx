import { db } from "@/lib/db";
import { getAdminStats, getAdminRevenueChart } from "@bananasbindery/db";
import { Card, CardContent } from "@bananasbindery/ui";
import {
  IconCurrencyDollar,
  IconShoppingCart,
  IconClock,
  IconTrendingUp,
  IconAlertTriangle,
  IconArrowRight,
} from "@tabler/icons-react";
import Link from "next/link";

interface ChartDay {
  date: string;
  revenue: string | number;
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats(db);
  const chartData = (await getAdminRevenueChart(db, 7)) as ChartDay[];

  const statCards = [
    {
      label: "Total Revenue",
      value: `Rp ${stats.totalRevenue.toLocaleString("id-ID")}`,
      icon: IconCurrencyDollar,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: IconShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Today Revenue",
      value: `Rp ${stats.todayRevenue.toLocaleString("id-ID")}`,
      icon: IconTrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders,
      icon: IconClock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900">
          Dashboard Overview
        </h2>
        <p className="text-gray-500 font-medium">
          Selamat datang kembali, admin. Berikut performa toko hari ini.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="border-none shadow-xl shadow-gray-100/50 hover:scale-[1.02] transition-transform duration-300"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <Badge className="bg-gray-50 text-gray-400 border-none">
                  +12.5%
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                {stat.label}
              </h3>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart Section (Simplified for now) */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-gray-100/50">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-gray-900">
                Revenue (Last 7 Days)
              </h3>
              <Link
                href="/admin/orders"
                className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"
              >
                View Orders <IconArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="h-[300px] flex items-end gap-4 px-4">
              {chartData.map((day) => {
                const height =
                  stats.totalRevenue > 0
                    ? (Number(day.revenue) / stats.totalRevenue) * 100 * 5
                    : 10;
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-2 group"
                  >
                    <div
                      className="w-full bg-primary/20 hover:bg-primary rounded-t-xl transition-all relative"
                      style={{ height: `${Math.max(height, 20)}%` }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Rp {Number(day.revenue).toLocaleString("id-ID")}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      {new Date(day.date).toLocaleDateString("id-ID", {
                        weekday: "short",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Alerts */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-gray-100/50 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <IconAlertTriangle className="w-6 h-6" />
                <h3 className="font-black">Stok Menipis!</h3>
              </div>
              <p className="text-sm text-amber-800 font-medium leading-relaxed">
                Ada 5 varian produk yang stoknya di bawah 10. Segera restok
                untuk menjaga penjualan.
              </p>
              <Button className="w-full mt-4 bg-amber-600 hover:bg-amber-700 font-bold border-none">
                Cek Produk
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-gray-100/50">
            <CardContent className="p-6">
              <h3 className="font-black text-gray-900 mb-4">Quick Links</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/admin/products/new"
                  className="p-3 bg-gray-50 rounded-xl text-[11px] font-black uppercase text-center hover:bg-primary hover:text-white transition-all"
                >
                  Tambah Produk
                </Link>
                <Link
                  href="/admin/coupons/new"
                  className="p-3 bg-gray-50 rounded-xl text-[11px] font-black uppercase text-center hover:bg-primary hover:text-white transition-all"
                >
                  Buat Kupon
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`px-2 py-1 text-xs rounded-lg ${className}`}>
      {children}
    </span>
  );
}

function Button({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      className={`px-4 py-2 rounded-xl text-white transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
