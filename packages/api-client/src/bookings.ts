import type { TypedSupabaseClient, Service, AvailableSlot, BookingInsert, Booking } from './types';

export type { Service, AvailableSlot, Booking, BookingInsert };

// Fallback config — dipakai kalau booking_slots kosong untuk tanggal tsb
const FALLBACK_CONFIG = {
  openHour: 9,
  closeHour: 16,
  intervalMinutes: 90,
} as const;

function generateFallbackSlots(): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  let current = FALLBACK_CONFIG.openHour * 60;
  while (current < FALLBACK_CONFIG.closeHour * 60) {
    const h = Math.floor(current / 60)
      .toString()
      .padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    slots.push({ timeSlot: `${h}:${m}`, available: true });
    current += FALLBACK_CONFIG.intervalMinutes;
  }
  return slots;
}

export async function getServices(supabase: TypedSupabaseClient): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }
  return data;
}

export async function getAvailableSlots(
  supabase: TypedSupabaseClient,
  date: string, // YYYY-MM-DD
  serviceType: 'grooming' | 'hotel',
): Promise<AvailableSlot[]> {
  const { data, error } = await supabase
    .from('booking_slots')
    .select('time_slot, capacity, booked')
    .eq('date', date)
    .eq('type', serviceType)
    .order('time_slot', { ascending: true });

  if (error || !data || data.length === 0) {
    return generateFallbackSlots();
  }

  return data.map((row) => ({
    timeSlot: (row.time_slot ?? '').slice(0, 5), // "HH:MM:SS" → "HH:MM"
    available: (row.booked ?? 0) < (row.capacity ?? 1),
  }));
}

export async function createBooking(
  supabase: TypedSupabaseClient,
  payload: Omit<BookingInsert, 'user_id' | 'booking_number'>,
): Promise<Booking> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const d = new Date();
  const datePart = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const bookingNumber = `BK-${datePart}-${rand}`;

  const { data, error } = await supabase
    .from('bookings')
    .insert([{ ...payload, user_id: user.id, booking_number: bookingNumber }])
    .select()
    .single();

  if (error) throw error;
  return data;
}
