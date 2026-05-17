'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { DesktopNav } from '@/components/layout/desktop-nav';
import { Footer } from '@/components/layout/footer';

export default function ShopLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isProductDetail = pathname.startsWith('/products/') && pathname !== '/products';

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="hidden lg:block">
        <DesktopNav />
        <div className="desktop-hero-bg" />
      </div>

      <div className="shop-layout-container relative mx-auto min-h-[100dvh] w-full overflow-x-hidden lg:overflow-visible bg-[#FFFFFF] lg:bg-transparent">
        {/* Mobile-only Header */}
        {!isProductDetail && (
          <div key="mobile-header-wrapper" className="lg:hidden">
            <Header />
          </div>
        )}

        <main
          key="shop-main-content"
          className="relative z-10 flex min-h-[100dvh] flex-col bg-transparent lg:pb-12"
          style={{
            paddingTop: isProductDetail
              ? 'env(safe-area-inset-top)'
              : 'calc(117px + env(safe-area-inset-top))',
            paddingBottom: isProductDetail
              ? 'calc(80px + env(safe-area-inset-bottom))'
              : 'calc(100px + env(safe-area-inset-bottom))',
          }}
        >
          <div key="desktop-spacer" className="hidden lg:block h-16" />
          <div key="page-content-wrapper">{children}</div>
        </main>

        {/* Floating BottomNav Overlay - Mobile only */}
        {!isProductDetail && (
          <div key="bottom-nav-wrapper" className="lg:hidden">
            <BottomNav />
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
