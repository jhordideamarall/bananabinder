'use client';
import { LazyMotion, domMax, MotionConfig } from 'framer-motion';
import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <LazyMotion features={domMax} strict>
        <MotionConfig transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
          <AuthProvider>{children}</AuthProvider>
        </MotionConfig>
      </LazyMotion>
    </QueryProvider>
  );
}
