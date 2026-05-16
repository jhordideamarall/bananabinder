// Enums synced with PRD §15 SQL CHECK constraints and database schema
// Last synced: 2026-05-02

export enum UserRole {
  Customer = 'customer',
  Admin = 'admin',
  Owner = 'owner',
  Staff = 'staff',
}

export enum ProductType {
  Normal = 'normal',
  Parcel = 'parcel',
}

// PRD §9: pending → paid → processing → shipped → delivered → completed
//          → expired | cancelled | return_requested → returned → refunded
export enum OrderStatus {
  Pending = 'pending',
  Paid = 'paid',
  Processing = 'processing',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Expired = 'expired',
  ReturnRequested = 'return_requested',
  Returned = 'returned',
  Refunded = 'refunded',
}

// DB uses a merged payment_status enum for order payment lifecycle.
export enum PaymentStatus {
  Unpaid = 'unpaid',
  Paid = 'paid',
  Refunded = 'refunded',
  PartialRefund = 'partial_refund',
  DpPaid = 'dp_paid',
}

export enum PaymentMethod {
  BankTransfer = 'bank_transfer',
  CreditCard = 'credit_card',
  Qris = 'qris',
  Ewallet = 'ewallet',
  Cod = 'cod',
}

export enum VoucherType {
  Percentage = 'percentage',
  Fixed = 'fixed',
}

// PRD §15: loyalty_history.type CHECK
export enum LoyaltyTransactionType {
  Earn = 'earn',
  Redeem = 'redeem',
  Expire = 'expire',
  Adjustment = 'adjustment',
}

// PRD §15: stock_movements.type CHECK
export enum StockMovementType {
  In = 'in',
  Out = 'out',
  Adjustment = 'adjustment',
  Return = 'return',
}

// PRD §15: order_returns.status CHECK
export enum ReturnStatus {
  Requested = 'requested',
  Approved = 'approved',
  Rejected = 'rejected',
  Refunded = 'refunded',
}

// PRD §6: banners.type CHECK
export enum BannerType {
  Hero = 'hero',
  Promo = 'promo',
  Category = 'category',
}

// PRD §15: notifications.type CHECK
export enum NotificationType {
  Order = 'order',
  Promo = 'promo',
  Loyalty = 'loyalty',
  System = 'system',
}

// PRD §15: notifications.channel CHECK
export enum NotificationChannel {
  InApp = 'in_app',
  Whatsapp = 'whatsapp',
  Push = 'push',
}

// Profiles.tier CHECK
export enum LoyaltyTier {
  Bronze = 'bronze',
  Silver = 'silver',
  Gold = 'gold',
}
