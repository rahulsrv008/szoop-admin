import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import { DashboardSummary } from '@core/models';
import { DateRange } from '@shared/models/filter.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);

  summary(range: DateRange = {}) {
    return this.api.get<DashboardSummary>('admin/dashboard', {
      from: range.from ?? undefined,
      to: range.to ?? undefined,
    });
  }
}
