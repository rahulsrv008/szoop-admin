import { Coupon, CouponUsageRow, ListQuery } from '@core/models';

export interface CouponListQuery extends ListQuery {
  isActive?: boolean;
}

export interface CouponPayload {
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  maxDiscount?: number | null;
  minOrderAmount?: number | null;
  usageLimit?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
}

export interface RemoveOutcome {
  deleted: boolean;
  deactivated: boolean;
  reason: string | null;
}

export type { Coupon, CouponUsageRow };
