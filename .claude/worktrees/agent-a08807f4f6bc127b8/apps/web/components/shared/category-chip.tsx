'use client';
import type { CSSProperties } from 'react';

interface CategoryChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}

export function CategoryChip({
  label,
  active = false,
  onClick,
  href,
}: CategoryChipProps) {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: 9999,
    border: `1.5px solid ${active ? '#E07B39' : '#D8D4CE'}`,
    background: active ? '#E07B39' : '#FDFCFB',
    color: active ? 'white' : '#1A1714',
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
    textDecoration: 'none',
  };

  if (href) {
    return (
      <a href={href} style={baseStyle}>
        {label}
      </a>
    );
  }

  return (
    <button onClick={onClick} style={{ ...baseStyle, outline: 'none' }}>
      {label}
    </button>
  );
}
