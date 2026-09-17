import { Injectable, inject } from '@angular/core';
import { Paginated } from '@core/models';
import { ApiService } from '@core/services/api.service';
import {
  ComplaintDetail,
  ComplaintListItem,
  ComplaintListQuery,
  ComplaintUpdatePayload,
  ComplaintUpdateResult,
} from './complaints.model';

@Injectable({ providedIn: 'root' })
export class ComplaintsService {
  private readonly api = inject(ApiService);

  list(query: ComplaintListQuery) {
    return this.api.get<Paginated<ComplaintListItem>>('admin/support', query);
  }

  detail(id: string) {
    return this.api.get<ComplaintDetail>(`admin/support/${id}`);
  }

  update(id: string, payload: ComplaintUpdatePayload) {
    return this.api.patch<ComplaintUpdateResult>(`admin/support/${id}`, payload);
  }
}
