import type { BookingSlot } from '@bananasbindery/types/domain';

export interface BookingPayload {
  serviceId: string;
  slotId: string;
  petId: string;
  dateStart: Date;
  dateEnd?: Date;
  notes?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Get available slots (booked < capacity).
 * Full DB query in Phase 6 — this validates a slot object in memory.
 */
export function isSlotAvailable(slot: Pick<BookingSlot, 'capacity' | 'booked'>): boolean {
  return slot.booked < slot.capacity;
}

/**
 * Validate booking payload before submission.
 * Full implementation in Phase 6.
 */
export function validateBookingPayload(payload: BookingPayload): ValidationResult {
  const errors: string[] = [];

  if (!payload.serviceId) errors.push('Service wajib dipilih.');
  if (!payload.slotId) errors.push('Slot waktu wajib dipilih.');
  if (!payload.petId) errors.push('Pet wajib dipilih.');
  if (!payload.dateStart) errors.push('Tanggal mulai wajib diisi.');
  if (payload.dateEnd && payload.dateEnd <= payload.dateStart) {
    errors.push('Tanggal selesai harus setelah tanggal mulai.');
  }

  return { isValid: errors.length === 0, errors };
}
