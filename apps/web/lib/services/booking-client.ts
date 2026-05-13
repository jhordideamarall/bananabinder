import { createClient } from '@/lib/supabase/client';
import {
  getServices as _getServices,
  getAvailableSlots as _getAvailableSlots,
  createBooking as _createBooking,
} from '@bananasbindery/api-client/bookings';

export type { Service, AvailableSlot, Booking, BookingInsert } from '@bananasbindery/api-client/bookings';

export const getServices = () => _getServices(createClient());
export const getAvailableSlots = (date: string, serviceType: 'grooming' | 'hotel') =>
  _getAvailableSlots(createClient(), date, serviceType);
export const createBooking = (payload: Parameters<typeof _createBooking>[1]) =>
  _createBooking(createClient(), payload);
