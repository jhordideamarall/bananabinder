import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Bananasbindery | Binder Stationery Premium Indonesia",
    template: "%s | Bananasbindery"
  },
  description: "Buku binder premium dengan desain estetik untuk pelajar, mahasiswa, dan pekerja Indonesia. Kualitas tinggi, banyak varian warna dan ukuran.",
  keywords: ["binder", "stationery", "buku binder", "binder estetik", "binder indonesia", "bananasbindery"],
  authors: [{ name: "Bananasbindery" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://bananasbindery.com",
    siteName: "Bananasbindery",
    title: "Bananasbindery | Binder Stationery Premium Indonesia",
    description: "Buku binder premium dengan desain estetik untuk pelajar, mahasiswa, dan pekerja Indonesia.",
    images: [
      {
        url: "https://bananasbindery.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Bananasbindery - Premium Binder Stationery"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Bananasbindery | Binder Stationery Premium Indonesia",
    description: "Buku binder premium dengan desain estetik untuk pelajar, mahasiswa, dan pekerja Indonesia.",
    images: ["https://bananasbindery.com/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://bananasbindery.com"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  "name": "Bananasbindery",
  "image": "https://bananasbindery.com/logo.png",
  "description": "Buku binder premium dengan desain estetik untuk pelajar, mahasiswa, dan pekerja Indonesia.",
  "url": "https://bananasbindery.com",
  "telephone": "+628123456789",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Jl. Binder No. 1",
    "addressLocality": "Jakarta",
    "addressRegion": "DKI Jakarta",
    "postalCode": "12345",
    "addressCountry": "ID"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -6.200000,
    "longitude": 106.816666
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "opens": "09:00",
    "closes": "17:00"
  },
  "sameAs": [
    "https://instagram.com/bananasbindery",
    "https://tiktok.com/@bananasbindery"
  ]
};

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LenisProvider from "@/components/LenisProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <LenisProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </LenisProvider>
      </body>
    </html>
  );
}
