import { db } from "@/lib/db";
import { getAdminOrders } from "@bananasbindery/db";
import { Card, CardContent } from "@bananasbindery/ui";
import {
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
} from "@tabler/icons-react";
import Link from "next/link";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const page = Number(searchParams.page) || 1;
  const status = searchParams.status || null;
  const limit = 10;

  const { data: orders, total } = await getAdminOrders(db, {
    status,
    page,
    limit,
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-900">
            Orders Management
          </h2>
          <p className="text-gray-500 font-medium">
            Kelola dan pantau semua pesanan masuk di sini.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="border-none shadow-xl shadow-gray-100/50">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {[
              "all",
              "pending",
              "paid",
              "shipped",
              "completed",
              "cancelled",
            ].map((s) => (
              <Link
                key={s}
                href={`/admin/orders${s === "all" ? "" : `?status=${s}`}`}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  status === s || (s === "all" && !status)
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                {s}
              </Link>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari Order ID / Nama..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-none shadow-xl shadow-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-400 tracking-widest">
                  Order ID
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-400 tracking-widest">
                  Customer
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-400 tracking-widest">
                  Total
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-400 tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-black uppercase text-gray-400 tracking-widest">
                  Date
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      #{order.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">
                        {order.user?.full_name || "Guest"}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {order.user?.phone}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-primary">
                      Rp {order.total_amount.toLocaleString("id-ID")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                        order.status === "paid"
                          ? "bg-green-100 text-green-600"
                          : order.status === "pending"
                            ? "bg-amber-100 text-amber-600"
                            : order.status === "shipped"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                    {new Date(order.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="p-2 hover:bg-gray-100 rounded-lg inline-flex text-gray-400 hover:text-primary transition-all"
                    >
                      <IconEye className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-gray-50 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-400">
            Showing {orders.length} of {total} orders
          </p>
          <div className="flex gap-2">
            <button className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:text-primary disabled:opacity-50 transition-all">
              <IconChevronLeft className="w-5 h-5" />
            </button>
            <button className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:text-primary disabled:opacity-50 transition-all">
              <IconChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
