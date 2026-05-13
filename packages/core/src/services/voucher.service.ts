import type { Voucher } from '@bananasbindery/types/domain';

export interface VoucherValidationResult {
  isValid: boolean;
  discountAmount: number;
  reason?: string;
}

/**
 * Validate voucher and calculate discount amount.
 * Full implementation in Phase 5.
 */
export function validateVoucher(
  voucher: Voucher,
  cartSubtotal: number,
  now: Date = new Date(),
): VoucherValidationResult {
  if (!voucher.isActive) {
    return { isValid: false, discountAmount: 0, reason: 'Voucher tidak aktif.' };
  }

  if (now < voucher.validFrom || now > voucher.validUntil) {
    return { isValid: false, discountAmount: 0, reason: 'Voucher sudah tidak berlaku.' };
  }

  if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
    return { isValid: false, discountAmount: 0, reason: 'Voucher sudah habis digunakan.' };
  }

  if (cartSubtotal < voucher.minOrder) {
    return {
      isValid: false,
      discountAmount: 0,
      reason: `Minimum pembelian ${voucher.minOrder} untuk menggunakan voucher ini.`,
    };
  }

  let discountAmount: number;
  if (voucher.type === 'percentage') {
    discountAmount = (cartSubtotal * voucher.value) / 100;
    if (voucher.maxDiscount !== null) {
      discountAmount = Math.min(discountAmount, voucher.maxDiscount);
    }
  } else {
    discountAmount = Math.min(voucher.value, cartSubtotal);
  }

  return { isValid: true, discountAmount };
}
