import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { AiraGroup, AiraGroupPayload, AiraItem, AiraItemPayload, AiraMenu } from './aira-menu.model';

const BASE = 'admin/aira-menu';

/** The Aira Luxury app menu: home groups and the services customers book. */
@Injectable({ providedIn: 'root' })
export class AiraMenuService {
  private readonly api = inject(ApiService);

  menu() {
    return this.api.get<AiraMenu>(BASE);
  }

  createGroup(payload: AiraGroupPayload) {
    return this.api.post<AiraGroup>(`${BASE}/groups`, payload);
  }

  updateGroup(id: string, payload: Partial<AiraGroupPayload>) {
    const { id: _id, ...rest } = payload;
    return this.api.patch<AiraGroup>(`${BASE}/groups/${id}`, rest);
  }

  removeGroup(id: string) {
    return this.api.delete<{ deleted: boolean }>(`${BASE}/groups/${id}`);
  }

  createItem(payload: AiraItemPayload) {
    return this.api.post<AiraItem>(`${BASE}/items`, payload);
  }

  updateItem(id: string, payload: Partial<AiraItemPayload>) {
    const { id: _id, ...rest } = payload;
    return this.api.patch<AiraItem>(`${BASE}/items/${id}`, rest);
  }

  removeItem(id: string) {
    return this.api.delete<{ deleted: boolean }>(`${BASE}/items/${id}`);
  }
}
