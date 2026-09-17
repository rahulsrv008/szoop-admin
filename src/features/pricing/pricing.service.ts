import { Injectable, inject } from '@angular/core';
import { Paginated, ServiceArea, ServiceItem, ServicePricing } from '@core/models';
import { ApiService } from '@core/services/api.service';
import {
  PricingListQuery,
  PricingPayload,
  PricingRemoveOutcome,
} from './pricing.model';

@Injectable({ providedIn: 'root' })
export class PricingService {
  private readonly api = inject(ApiService);

  list(query: PricingListQuery = {}) {
    return this.api.get<Paginated<ServicePricing>>('admin/pricing', query);
  }

  create(payload: PricingPayload) {
    return this.api.post<ServicePricing>('admin/pricing', payload);
  }

  update(id: string, payload: Partial<PricingPayload>) {
    return this.api.patch<ServicePricing>(`admin/pricing/${id}`, payload);
  }

  remove(id: string) {
    return this.api.delete<PricingRemoveOutcome>(`admin/pricing/${id}`);
  }

  services() {
    return this.api.get<Paginated<ServiceItem>>('admin/services', {
      page: 1,
      limit: 100,
      isActive: true,
    });
  }

  areas() {
    return this.api.get<Paginated<ServiceArea>>('admin/service-areas', {
      page: 1,
      limit: 100,
      isActive: true,
    });
  }
}
