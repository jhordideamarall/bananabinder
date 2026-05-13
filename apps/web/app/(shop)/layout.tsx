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

      <div key="shop-layout-shell" className="shop-layout-container relative mx-auto min-h-[100dvh] w-full overflow-x-hidden lg:overflow-visible bg-[#FDFCFB] lg:bg-transparent">
        {/* Mobile-only Background & Header */}
        {!isProductDetail ? (
          <div key="header-group-active">
            <div
              className="absolute top-0 left-1/2 w-full -translate-x-1/2 bg-[#F5F3F0] lg:hidden"
              style={{ maxWidth: 430, height: '40vh' }}
            />
            <div className="lg:hidden">
              <Header />
            </div>
          </div>
        ) : (
          <div key="header-group-hidden" />
        )}

        <main
          key="main-content-area"
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
          <div key="desktop-spacer-top" className="hidden lg:block h-16" />
          {children}
        </main>

        {/* Floating BottomNav Overlay - Mobile only */}
        {!isProductDetail ? (
          <div key="nav-group-active" className="lg:hidden">
            <BottomNav />
          </div>
        ) : (
          <div key="nav-group-hidden" />
        )}
      </div>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
