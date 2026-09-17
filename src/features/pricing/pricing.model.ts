import { ListQuery, ServicePricing } from '@core/models';

export interface PricingListQuery extends ListQuery {
  serviceId?: string;
  serviceAreaId?: string;
  isActive?: boolean;
}

export interface PricingPayload {
  serviceId: string;
  serviceAreaId?: string | null;
  pricePerHour: number;
  agentPayoutPerHour?: number | null;
  isActive: boolean;
}

/** Pricing rows are never hard-deleted — DELETE always deactivates. */
export interface PricingRemoveOutcome {
  deleted: boolean;
  deactivated: boolean;
  reason: string | null;
}
