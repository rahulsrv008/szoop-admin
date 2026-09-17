import { ListQuery, ServiceCategory, ServiceItem } from '@core/models';

/**
 * The list endpoint reports live price rows as `activePricingCount`; keep the
 * modelled `pricingCount` as a fallback.
 */
export interface ServiceListRow extends ServiceItem {
  activePricingCount?: number;
}

/** `serviceCount` counts every service, `activeServiceCount` only the live ones. */
export interface CategoryListRow extends ServiceCategory {
  activeServiceCount?: number;
}

export interface ServiceListQuery extends ListQuery {
  categoryId?: string;
  isActive?: boolean;
}

export interface ServicePayload {
  name: string;
  categoryId?: string | null;
  description?: string | null;
  durationMinutes: number;
  isActive: boolean;
}

export interface CategoryPayload {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
}

/**
 * Catalog deletes fall back to a deactivation when bookings or services still
 * reference the row, and the backend explains which happened.
 */
export interface RemoveOutcome {
  deleted: boolean;
  deactivated: boolean;
  reason: string | null;
}
