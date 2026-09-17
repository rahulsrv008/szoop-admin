import { Injectable, inject } from '@angular/core';
import { Paginated, ServiceArea, Society } from '@core/models';
import { ApiService } from '@core/services/api.service';
import {
  AreaListQuery,
  AreaPayload,
  RemoveOutcome,
  SocietyListQuery,
  SocietyPayload,
} from './service-areas.model';

@Injectable({ providedIn: 'root' })
export class ServiceAreasService {
  private readonly api = inject(ApiService);

  list(query: AreaListQuery = {}) {
    return this.api.get<Paginated<ServiceArea>>('admin/service-areas', query);
  }

  create(payload: AreaPayload) {
    return this.api.post<ServiceArea>('admin/service-areas', payload);
  }

  update(id: string, payload: Partial<AreaPayload>) {
    return this.api.patch<ServiceArea>(`admin/service-areas/${id}`, payload);
  }

  remove(id: string) {
    return this.api.delete<RemoveOutcome>(`admin/service-areas/${id}`);
  }

  /** Fetch a large page for client-side city/pincode aggregates. */
  catalog() {
    return this.list({ page: 1, limit: 100 });
  }

  societies(query: SocietyListQuery = {}) {
    return this.api.get<Paginated<Society>>('admin/societies', query);
  }

  createSociety(payload: SocietyPayload) {
    return this.api.post<Society>('admin/societies', payload);
  }

  updateSociety(id: string, payload: Partial<SocietyPayload>) {
    return this.api.patch<Society>(`admin/societies/${id}`, payload);
  }

  removeSociety(id: string) {
    return this.api.delete<{ deleted?: boolean } | void>(
      `admin/societies/${id}`,
    );
  }
}
