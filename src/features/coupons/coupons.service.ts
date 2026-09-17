import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { Coupon, CouponUsageRow, ListQuery, Paginated } from '@core/models';
import { ApiService } from '@core/services/api.service';
import {
  CouponListQuery,
  CouponPayload,
  RemoveOutcome,
} from './coupons.model';

@Injectable({ providedIn: 'root' })
export class CouponsService {
  private readonly api = inject(ApiService);

  list(query: CouponListQuery = {}) {
    return this.api.get<Paginated<Coupon>>('admin/coupons', query);
  }

  create(payload: CouponPayload) {
    return this.api.post<Coupon>('admin/coupons', payload);
  }

  update(id: string, payload: Partial<CouponPayload>) {
    return this.api.patch<Coupon>(`admin/coupons/${id}`, payload);
  }

  remove(id: string) {
    return this.api.delete<RemoveOutcome>(`admin/coupons/${id}`);
  }

  usage(id: string, query: ListQuery = {}) {
    return this.api.get<Paginated<CouponUsageRow>>(
      `admin/coupons/${id}/usage`,
      query,
    );
  }

  /**
   * No GET admin/coupons/:id — walk paginated list pages to resolve a row.
   */
  find(id: string): Observable<Coupon | null> {
    const limit = 100;
    return this.list({ page: 1, limit }).pipe(
      switchMap((first) => {
        const match = first.items.find((item) => item.id === id);
        if (match || first.meta.totalPages <= 1) return of(match ?? null);

        const rest = Array.from({ length: first.meta.totalPages - 1 }, (_, i) =>
          this.list({ page: i + 2, limit }),
        );
        return forkJoin(rest).pipe(
          map(
            (pages) =>
              pages
                .flatMap((page) => page.items)
                .find((item) => item.id === id) ?? null,
          ),
        );
      }),
    );
  }
}
