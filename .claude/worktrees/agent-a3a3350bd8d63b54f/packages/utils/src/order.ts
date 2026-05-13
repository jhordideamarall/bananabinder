/**
 * Generate a unique order number.
 * Format: PS-YYYYMMDD-XXXXXX (6 random hex chars uppercase)
 * Example: PS-20240115-A3F2B1
 */
export function generateOrderNumber(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, '0');
  return `PS-${year}${month}${day}-${random}`;
}
