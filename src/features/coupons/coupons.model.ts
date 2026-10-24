import { Coupon, CouponUsageRow, ListQuery } from '@core/models';

export interface CouponListQuery extends ListQuery {
  isActive?: boolean;
}

export interface CouponPayload {
  code: string;
  description?: string | null;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  maxDiscount?: number | null;
  minOrderAmount?: number | null;
  usageLimit?: number | null;
  perCustomerLimit?: number;
  customerId?: string | null;
  customerIds?: string[];
  validFrom?: string | null;
  validUntil?: string | null;
  eligibilityRuleId?: string | null;
  isActive: boolean;
}

export interface RemoveOutcome {
  deleted: boolean;
  deactivated: boolean;
  reason: string | null;
}

export type { Coupon, CouponUsageRow };
