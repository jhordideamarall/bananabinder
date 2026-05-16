import type { ReactNode } from 'react';
import {
  IconDashboard,
  IconPackage,
  IconShoppingCart,
  IconTicket,
  IconUsers,
  IconArrowLeft,
  IconLogout,
} from '@tabler/icons-react';
import Link from 'next/link';
import { Badge } from '@bananasbindery/ui';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const menuItems = [
    { label: 'Dashboard', icon: IconDashboard, href: '/admin' },
    { label: 'Orders', icon: IconShoppingCart, href: '/admin/orders' },
    { label: 'Products', icon: IconPackage, href: '/admin/products' },
    { label: 'Coupons', icon: IconTicket, href: '/admin/coupons' },
    { label: 'Customers', icon: IconUsers, href: '/admin/customers' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black group-hover:rotate-12 transition-transform">
              B
            </div>
            <span className="font-black text-xl tracking-tight">
              Admin<span className="text-primary">Panel</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-primary rounded-xl transition-all"
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-500 hover:text-primary transition-colors"
          >
            <IconArrowLeft className="w-5 h-5" /> Back to Store
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 hover:rounded-xl transition-all">
            <IconLogout className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 flex justify-between items-center">
          <h1 className="text-lg font-black text-gray-900">Bananasbindery Control</h1>
          <div className="flex items-center gap-4">
            <Badge className="bg-primary/10 text-primary border-none font-bold">
              Admin Account
            </Badge>
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
