// Domain types synced with PRD §15 schema
// Last synced: 2026-05-02

import type { BookingStatus, PaymentStatus, ServiceType } from '../enums.js';
import type { Pet } from './user.js';

export interface Service {
  id: string;
  name: string;
  slug: string;
  type: ServiceType;
  description: string | null;
  price: number;
  durationMinutes: number | null;
  requiresDp: boolean;
  dpPercentage: number;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  avgRating: number;
  reviewCount: number;
  createdAt: Date;
}

export interface BookingSlot {
  id: string;
  date: Date;
  timeSlot: string | null;
  type: ServiceType;
  capacity: number;
  booked: number;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  userId: string;
  petId: string;
  serviceId: string;
  slotId: string | null;
  dateStart: Date;
  dateEnd: Date | null;
  timeSlot: string | null;
  status: BookingStatus;
  dpAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  notes: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  service?: Service;
  slot?: BookingSlot;
  pet?: Pet;
}
