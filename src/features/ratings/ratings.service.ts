import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import {
  RatingDeleteResult,
  RatingDetail,
  RatingsListQuery,
  RatingsListResponse,
} from './ratings.model';

@Injectable({ providedIn: 'root' })
export class RatingsService {
  private readonly api = inject(ApiService);

  list(query: RatingsListQuery) {
    return this.api.get<RatingsListResponse>('admin/ratings', query);
  }

  detail(id: string) {
    return this.api.get<RatingDetail>(`admin/ratings/${id}`);
  }

  remove(id: string) {
    return this.api.delete<RatingDeleteResult>(`admin/ratings/${id}`);
  }
}
