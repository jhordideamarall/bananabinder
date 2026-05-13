export const CURRENCY = {
  code: 'IDR',
  locale: 'id-ID',
  symbol: 'Rp',
} as const;

export const TIMEZONE = 'Asia/Jakarta';

export const DATE_LOCALE = 'id-ID';

/** Same-day delivery cut-off: 14:00 WIB */
export const SAME_DAY_CUTOFF_HOUR = 14;

/** Order auto-expire after 2 hours (in minutes) */
export const ORDER_EXPIRE_MINUTES = 120;

/** Loyalty points: earn 1% of (total - shipping) */
export const LOYALTY_EARN_RATE = 0.01;

/** Loyalty points expire after 12 months */
export const LOYALTY_EXPIRE_MONTHS = 12;

/** Low stock threshold */
export const LOW_STOCK_THRESHOLD = 5;

/** Max photos per review */
export const MAX_REVIEW_PHOTOS = 3;

/** Booking cancellation window (hours before appointment) */
export const BOOKING_FREE_CANCEL_HOURS = 24;
