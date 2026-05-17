'use client';
import { m } from 'framer-motion';
import type { CSSProperties } from 'react';

interface CategoryChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}

export function CategoryChip({ label, active = false, onClick, href }: CategoryChipProps) {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '7px 16px',
    borderRadius: 9999,
    border: `1px solid ${active ? '#FFD54C' : 'rgba(216,212,206,0.6)'}`,
    background: active ? '#FFD54C' : '#FDFCFB',
    color: active ? 'white' : '#3D3830',
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
  };

  const Component = href ? m.a : m.button;

  return (
    <Component
      href={href}
      onClick={onClick}
      style={{ ...baseStyle, outline: 'none' }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {label}
    </Component>
  );
}
