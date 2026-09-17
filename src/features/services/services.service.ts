import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { ListQuery, Paginated } from '@core/models';
import { ApiService } from '@core/services/api.service';
import {
  CategoryListRow,
  CategoryPayload,
  RemoveOutcome,
  ServiceListQuery,
  ServiceListRow,
  ServicePayload,
} from './services.model';

/** Services and their categories — the two halves of the service catalog. */
@Injectable({ providedIn: 'root' })
export class ServicesService {
  private readonly api = inject(ApiService);

  list(query: ServiceListQuery = {}) {
    return this.api.get<Paginated<ServiceListRow>>('admin/services', query);
  }

  create(payload: ServicePayload) {
    return this.api.post<ServiceListRow>('admin/services', payload);
  }

  update(id: string, payload: Partial<ServicePayload>) {
    return this.api.patch<ServiceListRow>(`admin/services/${id}`, payload);
  }

  remove(id: string) {
    return this.api.delete<RemoveOutcome>(`admin/services/${id}`);
  }

  /**
   * There is no GET admin/services/:id, so the edit screen looks a row up by
   * walking the list endpoint; `meta.totalPages` bounds the walk.
   */
  find(id: string): Observable<ServiceListRow | null> {
    const limit = 100;
    return this.list({ page: 1, limit }).pipe(
      switchMap((first) => {
        const match = first.items.find((item) => item.id === id);
        if (match || first.meta.totalPages <= 1) return of(match ?? null);

        const rest = Array.from({ length: first.meta.totalPages - 1 }, (_, index) =>
          this.list({ page: index + 2, limit }),
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

  categories(query: ListQuery = {}) {
    return this.api.get<Paginated<CategoryListRow>>(
      'admin/service-categories',
      query,
    );
  }

  createCategory(payload: CategoryPayload) {
    return this.api.post<CategoryListRow>('admin/service-categories', payload);
  }

  updateCategory(id: string, payload: Partial<CategoryPayload>) {
    return this.api.patch<CategoryListRow>(
      `admin/service-categories/${id}`,
      payload,
    );
  }

  removeCategory(id: string) {
    return this.api.delete<RemoveOutcome>(`admin/service-categories/${id}`);
  }
}
