import { describe, it, expect } from 'vitest';
import { slugify } from '../slug.js';

describe('slugify', () => {
  it('converts to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('makanan kucing premium')).toBe('makanan-kucing-premium');
  });

  it('removes special characters', () => {
    expect(slugify('Makanan Kucing Premium!')).toBe('makanan-kucing-premium');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('hello--world')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('-hello-')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('removes diacritics', () => {
    expect(slugify('café')).toBe('cafe');
  });

  it('handles numbers', () => {
    expect(slugify('product 123')).toBe('product-123');
  });
});
