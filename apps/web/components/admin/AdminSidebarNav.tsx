'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import {
  LayoutDashboard as IconDashboard,
  Package as IconPackage,
  ShoppingCart as IconShoppingCart,
  Ticket as IconTicket,
  FolderTree as IconCategories,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: Route;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: IconDashboard, href: '/admin' as Route },
  { label: 'Orders', icon: IconShoppingCart, href: '/admin/orders' as Route },
  { label: 'Products', icon: IconPackage, href: '/admin/products' as Route },
  { label: 'Categories', icon: IconCategories, href: '/admin/categories' as Route },
  { label: 'Promos', icon: IconTicket, href: '/admin/promos' as Route },
];

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-2" aria-label="Admin">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors ${
              isActive
                ? 'bg-primary/15 font-semibold text-[#1D1D1F]'
                : 'font-medium text-[#86868B] hover:bg-black/[0.04] hover:text-[#1D1D1F]'
            }`}
          >
            {isActive ? (
              <span
                className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                aria-hidden
              />
            ) : null}
            <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2 : 1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
