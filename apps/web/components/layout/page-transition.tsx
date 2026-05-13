'use client';
import { m } from 'framer-motion';

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}
    >
      {children}
    </m.div>
  );
}
