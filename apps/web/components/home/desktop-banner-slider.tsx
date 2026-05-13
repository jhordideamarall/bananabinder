'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import Image from 'next/image';
import { m, AnimatePresence } from 'framer-motion';

interface Banner {
  id: number;
  tag: string;
  title: string;
  desc: string;
  cta: string;
  link: string;
  bg: string;
  accent: string;
}

export function DesktopBannerSlider({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const banner = banners[current];

  // Autoplay every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const images = [
    '1583337130417-3346a1be7dee',
    '1548546738-8509cb246ed3',
    '1585110396000-c9ffd4e4b308',
    '1583337130417-3346a1be7dee',
  ];

  return (
    <div className="hidden lg:block mx-auto max-w-[1100px] px-6">
      <div className="relative h-[440px] w-full overflow-hidden rounded-[32px] bg-[#1A1714]">
        {/* Background image & Color Overlay */}
        <AnimatePresence initial={false}>
          <m.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
            style={{ backgroundColor: banner.bg }}
          >
            <m.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={`https://images.unsplash.com/photo-${images[current % images.length]}?w=1400&q=85`}
                alt=""
                fill
                className="object-cover opacity-70"
                sizes="1100px"
              />
            </m.div>
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, ${banner.bg} 0%, transparent 80%)`,
                opacity: 0.9,
              }}
            />
          </m.div>
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-center px-20 py-12 max-w-[650px]">
          <AnimatePresence mode="wait">
            <m.div
              key={`content-${current}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <span className="mb-6 inline-flex w-fit rounded-full bg-white/15 px-5 py-2 font-heading text-[14px] font-bold text-white backdrop-blur-sm border border-white/10">
                {banner.tag}
              </span>
              <h2 className="font-heading text-[52px] font-extrabold leading-[1.05] text-white tracking-tight">
                {banner.title}
              </h2>
              <p className="mt-5 text-[18px] font-medium text-white/90 leading-relaxed">
                {banner.desc}
              </p>
              <Link
                href={banner.link as Route}
                className="mt-10 inline-flex w-fit items-center rounded-full bg-white px-9 py-4 font-heading text-[16px] font-bold text-ink no-underline shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all hover:scale-105 hover:shadow-[0_15px_35px_rgba(0,0,0,0.2)]"
              >
                {banner.cta}
              </Link>
            </m.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Dots */}
      <div className="mt-5 flex justify-center gap-2">
        {banners.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className="h-2.5 rounded-full transition-all"
            style={{
              width: i === current ? 24 : 10,
              background: i === current ? 'white' : 'rgba(255, 255, 255, 0.3)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
