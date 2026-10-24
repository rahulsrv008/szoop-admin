import { ListQuery, Paginated } from '@core/models';

export type RuleServiceType = 'ALL' | 'CLEANING' | 'COOKING' | 'SALON';

export type ConditionType =
  | 'COMPLETED_BOOKINGS'
  | 'NEW_CUSTOMER'
  | 'INACTIVE_DAYS'
  | 'DAYS_SINCE_SERVICE';

export type RuleOperator =
  | 'EQUALS'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL';

export interface RuleCondition {
  type: ConditionType;
  service: RuleServiceType;
  operator: RuleOperator;
  value: number;
  windowDays?: number | null;
}

export interface CouponEligibilityRule {
  id: string;
  name: string;
  description?: string | null;
  applicableServices: RuleServiceType[];
  matchType: 'AND' | 'OR';
  conditions: RuleCondition[];
  isActive: boolean;
  linkedCouponsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouponRuleListQuery extends ListQuery {
  isActive?: boolean;
  service?: string;
}

export interface CreateCouponRulePayload {
  name: string;
  description?: string | null;
  applicableServices: RuleServiceType[];
  matchType: 'AND' | 'OR';
  conditions: RuleCondition[];
  isActive?: boolean;
}

export type UpdateCouponRulePayload = Partial<CreateCouponRulePayload>;

export interface RemoveRuleOutcome {
  deleted: boolean;
  deactivated: boolean;
  reason: string | null;
}
