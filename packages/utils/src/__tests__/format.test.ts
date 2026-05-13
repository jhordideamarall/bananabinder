import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatDateShort } from '../format.js';

describe('formatCurrency', () => {
  it('formats integer amounts as IDR', () => {
    const result = formatCurrency(15000);
    expect(result).toContain('15.000');
    expect(result).toContain('Rp');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('formats large amounts', () => {
    const result = formatCurrency(1500000);
    expect(result).toContain('1.500.000');
  });
});

describe('formatDate', () => {
  it('formats date in Indonesian locale', () => {
    const date = new Date('2024-01-15T00:00:00.000Z');
    const result = formatDate(date);
    expect(result).toContain('2024');
    expect(result).toMatch(/januari|january|15/i);
  });

  it('accepts custom options', () => {
    const date = new Date('2024-01-15T00:00:00.000Z');
    const result = formatDate(date, { year: 'numeric' });
    expect(result).toContain('2024');
  });
});

describe('formatDateShort', () => {
  it('formats date in short format', () => {
    const date = new Date('2024-01-15T00:00:00.000Z');
    const result = formatDateShort(date);
    expect(result).toContain('2024');
  });
});
