import { CURRENCY, DATE_LOCALE } from '@bananasbindery/config/constants';

/**
 * Format number as Indonesian Rupiah.
 * formatCurrency(15000) → "Rp 15.000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format Date as Indonesian locale string.
 * formatDate(new Date('2024-01-15')) → "15 Januari 2024"
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return new Intl.DateTimeFormat(DATE_LOCALE, options ?? defaultOptions).format(date);
}

/**
 * Format Date as short Indonesian date.
 * formatDateShort(new Date('2024-01-15')) → "15 Jan 2024"
 */
export function formatDateShort(date: Date): string {
  return formatDate(date, { day: 'numeric', month: 'short', year: 'numeric' });
}
