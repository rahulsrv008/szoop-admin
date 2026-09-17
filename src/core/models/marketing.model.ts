export interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: string | number;
  maxDiscount?: string | number | null;
  minOrderAmount?: string | number | null;
  usageLimit?: number | null;
  usedCount: number;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface CouponUsageRow {
  id: string;
  customerName?: string | null;
  bookingNumber?: string | null;
  discountAmount?: string | number | null;
  createdAt: string;
}

export interface NotificationRow {
  id: string;
  userId: string;
  recipientName?: string | null;
  title?: string | null;
  message?: string | null;
  notificationType?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface BroadcastPayload {
  audience: 'ALL' | 'CUSTOMERS' | 'AGENTS' | 'SPECIFIC';
  userIds?: string[];
  title: string;
  message: string;
  type?: string;
}
