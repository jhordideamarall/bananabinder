import { describe, it, expect } from 'vitest';
import { generateOrderNumber } from '../order.js';

describe('generateOrderNumber', () => {
  it('generates correct format PS-YYYYMMDD-XXXXXX', () => {
    const result = generateOrderNumber(new Date('2024-01-15'));
    expect(result).toMatch(/^PS-\d{8}-[0-9A-F]{6}$/);
  });

  it('uses provided date', () => {
    const result = generateOrderNumber(new Date('2024-03-22'));
    expect(result).toContain('20240322');
  });

  it('generates unique values', () => {
    const numbers = new Set(
      Array.from({ length: 100 }, () => generateOrderNumber(new Date('2024-01-15'))),
    );
    // With 16M possibilities, 100 generates should be unique
    expect(numbers.size).toBeGreaterThan(90);
  });

  it('defaults to current date when no date provided', () => {
    const result = generateOrderNumber();
    expect(result).toMatch(/^PS-\d{8}-[0-9A-F]{6}$/);
  });
});
