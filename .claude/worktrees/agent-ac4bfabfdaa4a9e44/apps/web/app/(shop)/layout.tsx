import type { ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#FDFCFB',
        overflow: 'hidden',
        maxWidth: 430,
        margin: '0 auto',
      }}
    >
      <Header />
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          background: '#F5F3F0',
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
