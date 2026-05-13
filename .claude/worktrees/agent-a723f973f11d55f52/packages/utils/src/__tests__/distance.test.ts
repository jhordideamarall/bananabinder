import { describe, it, expect } from 'vitest';
import { haversineDistance } from '../distance.js';

describe('haversineDistance', () => {
  it('returns 0 for same coordinates', () => {
    expect(haversineDistance(-6.2, 106.8, -6.2, 106.8)).toBe(0);
  });

  it('calculates distance between Jakarta and Bogor (~60km)', () => {
    // Jakarta: -6.2088, 106.8456
    // Bogor:   -6.5971, 106.8060
    const dist = haversineDistance(-6.2088, 106.8456, -6.5971, 106.806);
    expect(dist).toBeGreaterThan(40);
    expect(dist).toBeLessThan(50);
  });

  it('calculates short distances accurately', () => {
    // ~1km within Jakarta
    const dist = haversineDistance(-6.2, 106.8, -6.21, 106.8);
    expect(dist).toBeGreaterThan(0.5);
    expect(dist).toBeLessThan(2);
  });

  it('result is symmetric (A→B equals B→A)', () => {
    const ab = haversineDistance(-6.2, 106.8, -6.5, 107.0);
    const ba = haversineDistance(-6.5, 107.0, -6.2, 106.8);
    expect(ab).toBeCloseTo(ba, 10);
  });
});
