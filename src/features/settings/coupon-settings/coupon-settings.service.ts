import { Injectable, inject } from '@angular/core';
import { Paginated } from '@core/models';
import { ApiService } from '@core/services/api.service';
import {
  CouponEligibilityRule,
  CouponRuleListQuery,
  CreateCouponRulePayload,
  RemoveRuleOutcome,
  UpdateCouponRulePayload,
} from './coupon-settings.model';

@Injectable({ providedIn: 'root' })
export class CouponSettingsService {
  private readonly api = inject(ApiService);

  list(query: CouponRuleListQuery = {}) {
    return this.api.get<Paginated<CouponEligibilityRule>>(
      'admin/coupon-rules',
      query,
    );
  }

  get(id: string) {
    return this.api.get<CouponEligibilityRule>(`admin/coupon-rules/${id}`);
  }

  create(payload: CreateCouponRulePayload) {
    return this.api.post<CouponEligibilityRule>(
      'admin/coupon-rules',
      payload,
    );
  }

  update(id: string, payload: UpdateCouponRulePayload) {
    return this.api.put<CouponEligibilityRule>(
      `admin/coupon-rules/${id}`,
      payload,
    );
  }

  toggle(id: string) {
    return this.api.patch<CouponEligibilityRule>(
      `admin/coupon-rules/${id}/toggle`,
    );
  }

  remove(id: string) {
    return this.api.delete<RemoveRuleOutcome>(`admin/coupon-rules/${id}`);
  }
}
