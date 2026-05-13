'use client';
import { useState, useRef } from 'react';
import NextImage from 'next/image';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  fallbackColor?: string;
}

export function ProductGallery({
  images,
  productName,
  fallbackColor = '#D4C4A0',
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const goTo = (index: number) => {
    setActiveIndex(Math.max(0, Math.min(index, images.length - 1)));
  };

  if (images.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          background: fallbackColor + '30',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 13,
            fontWeight: 600,
            color: '#6B6460',
            textAlign: 'center',
            padding: '0 24px',
          }}
        >
          {productName}
        </span>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', background: '#FDFCFB' }}>
      {/* Image area - No animation */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          position: 'relative',
          background: '#F5F3F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <NextImage
            src={images[activeIndex]}
            alt={`${productName} - foto ${activeIndex + 1}`}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 430px) 100vw, 430px"
            priority
          />
        </div>
      </div>

      {/* Thumbnails indicator */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 10,
          padding: '12px 20px 32px',
          overflowX: 'auto',
          justifyContent: 'flex-start',
        }}
        className="no-scrollbar"
      >
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              overflow: 'hidden',
              border:
                i === activeIndex
                  ? '2px solid var(--color-orange)'
                  : '1.5px solid var(--color-stone-2)',
              background: '#FFFFFF',
              padding: 0,
              flexShrink: 0,
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
              boxShadow: i === activeIndex ? '0 4px 12px rgba(224,123,57,0.15)' : 'none',
            }}
          >
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <NextImage 
                src={img} 
                alt={`Thumbnail ${i + 1}`} 
                fill 
                style={{ objectFit: 'cover' }} 
                sizes="44px"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
