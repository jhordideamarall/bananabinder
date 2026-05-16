import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Inter, Outfit } from 'next/font/google';
import { cn } from '@bananasbindery/ui/utils';
import { Providers } from '@/components/providers/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-heading' });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FDFCFB',
  interactiveWidget: 'resizes-visual',
};

export const metadata: Metadata = {
  title: {
    default: 'Bananasbindery',
    template: '%s | Bananasbindery',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  description:
    'Bananasbindery — Toko binder dan alat tulis terlengkap di Jakarta. Produk premium untuk produktivitasmu.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bananasbindery',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Bananasbindery',
    url: 'https://bananasbindery.com',
    title: 'Bananasbindery — Toko Binder & Stationery Jakarta',
    description:
      'Bananasbindery — Toko binder dan alat tulis terlengkap di Jakarta. Produk premium untuk produktivitasmu.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={cn('font-sans antialiased', inter.variable, outfit.variable)}>
      <body style={{ background: 'var(--color-app-bg)' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
