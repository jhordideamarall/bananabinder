'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import Image from 'next/image';
import type { HomeBanner } from '@/lib/services/banner-client';

interface HomeBannerStripProps {
  banners: HomeBanner[];
  /** Optional small caption above the strip. */
  label?: string;
}

/**
 * Horizontal banner strip for the home page. Renders admin-managed banners
 * from the `banners` table. Jika admin belum upload banner untuk section ini,
 * strip tidak ditampilkan sama sekali (no hardcoded fallback).
 */
export function HomeBannerStrip({ banners, label }: HomeBannerStripProps) {
  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      {label ? (
        <p className="mb-2 px-[clamp(16px,5vw,20px)] font-heading text-[13px] font-bold text-[#1A1714]/50">
          {label}
        </p>
      ) : null}

      <div
        className={`flex gap-4 overflow-x-auto pb-4 no-scrollbar ${banners.length === 1 ? 'justify-center' : ''}`}
        style={
          {
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
            paddingLeft: banners.length === 1 ? 0 : 'clamp(16px, 5vw, 20px)',
            paddingRight: banners.length === 1 ? 0 : 'clamp(16px, 5vw, 20px)',
          } as CSSProperties
        }
      >
        {banners.map((banner, index) => (
          <Link
            key={banner.id}
            href={(banner.link || '/products') as Route}
            className="relative h-[210px] w-[88vw] max-w-[600px] flex-shrink-0 overflow-hidden no-underline lg:h-[280px]"
            style={{
              scrollSnapAlign: 'center',
              borderRadius: index % 2 === 0 ? '40px 12px 40px 12px' : '12px 40px 12px 40px',
            }}
          >
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              className="object-cover"
              sizes="(max-width: 430px) 300px, 400px"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(0,0,0,0.55) 15%, rgba(0,0,0,0.15) 65%, transparent 100%)',
              }}
            />
            <div className="absolute bottom-5 left-6 right-6">
              <h3 className="font-heading text-lg font-extrabold leading-tight text-white">
                {banner.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
