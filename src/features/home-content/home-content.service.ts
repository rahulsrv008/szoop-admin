import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import {
  HomeCategory,
  HomeCategoryOption,
  HomeCategoryOptionPayload,
  HomeCategoryPayload,
  HomePopularItem,
  HomePopularPayload,
} from './home-content.model';

const BASE = 'admin/home-content';

/** Everything the customer app home screen renders: tiles, their options, most popular. */
@Injectable({ providedIn: 'root' })
export class HomeContentService {
  private readonly api = inject(ApiService);

  categories() {
    return this.api.get<HomeCategory[]>(`${BASE}/categories`);
  }

  createCategory(payload: HomeCategoryPayload) {
    return this.api.post<HomeCategory>(`${BASE}/categories`, payload);
  }

  updateCategory(id: string, payload: Partial<HomeCategoryPayload>) {
    return this.api.patch<HomeCategory>(`${BASE}/categories/${id}`, payload);
  }

  removeCategory(id: string) {
    return this.api.delete<{ deleted: boolean }>(`${BASE}/categories/${id}`);
  }

  createOption(categoryId: string, payload: HomeCategoryOptionPayload) {
    return this.api.post<HomeCategoryOption>(
      `${BASE}/categories/${categoryId}/options`,
      payload,
    );
  }

  updateOption(id: string, payload: Partial<HomeCategoryOptionPayload>) {
    return this.api.patch<HomeCategoryOption>(`${BASE}/options/${id}`, payload);
  }

  removeOption(id: string) {
    return this.api.delete<{ deleted: boolean }>(`${BASE}/options/${id}`);
  }

  popular() {
    return this.api.get<HomePopularItem[]>(`${BASE}/popular`);
  }

  createPopular(payload: HomePopularPayload) {
    return this.api.post<HomePopularItem>(`${BASE}/popular`, payload);
  }

  updatePopular(id: string, payload: Partial<HomePopularPayload>) {
    return this.api.patch<HomePopularItem>(`${BASE}/popular/${id}`, payload);
  }

  removePopular(id: string) {
    return this.api.delete<{ deleted: boolean }>(`${BASE}/popular/${id}`);
  }
}
