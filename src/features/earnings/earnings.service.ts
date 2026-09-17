import { Injectable, inject } from '@angular/core';
import { AgentListItem, Paginated } from '@core/models';
import { ApiService } from '@core/services/api.service';
import {
  EarningsListQuery,
  EarningsListResponse,
  EarningsSummaryResponse,
  GeneratePeriodPayload,
  GenerateSummary,
  IncentiveListQuery,
  IncentiveRow,
  IncentiveUpdatePayload,
  SalaryListQuery,
  SalaryRow,
  SalaryUpdatePayload,
} from './earnings.model';

@Injectable({ providedIn: 'root' })
export class EarningsService {
  private readonly api = inject(ApiService);

  list(query: EarningsListQuery = {}) {
    return this.api.get<EarningsListResponse>('admin/earnings', query);
  }

  summary(month: number, year: number) {
    return this.api.get<EarningsSummaryResponse>('admin/earnings/summary', {
      month,
      year,
    });
  }

  incentives(query: IncentiveListQuery = {}) {
    return this.api.get<Paginated<IncentiveRow>>(
      'admin/earnings/incentives',
      query,
    );
  }

  generateIncentives(payload: GeneratePeriodPayload) {
    return this.api.post<GenerateSummary>(
      'admin/earnings/incentives/generate',
      payload,
    );
  }

  updateIncentive(id: string, payload: IncentiveUpdatePayload) {
    return this.api.patch<IncentiveRow>(
      `admin/earnings/incentives/${id}`,
      payload,
    );
  }

  salary(query: SalaryListQuery = {}) {
    return this.api.get<Paginated<SalaryRow>>('admin/earnings/salary', query);
  }

  generateSalary(payload: GeneratePeriodPayload) {
    return this.api.post<GenerateSummary>(
      'admin/earnings/salary/generate',
      payload,
    );
  }

  updateSalary(id: string, payload: SalaryUpdatePayload) {
    return this.api.patch<SalaryRow>(`admin/earnings/salary/${id}`, payload);
  }

  agents() {
    return this.api.get<Paginated<AgentListItem>>('admin/agents', {
      page: 1,
      limit: 100,
    });
  }
}
