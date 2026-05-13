import type { Metadata } from 'next';
import './globals.css';
import { Inter, Outfit } from 'next/font/google';
import { cn } from '@bananasbindery/ui/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
  title: {
    default: 'Bananasbindery',
    template: '%s | Bananasbindery',
  },
  description: 'Bananasbindery terlengkap di Jakarta. Produk, grooming, dan hotel hewan piaraan.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={cn('font-sans antialiased', inter.variable, outfit.variable)}>
      <body>{children}</body>
    </html>
  );
}
