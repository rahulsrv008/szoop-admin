import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import {
  AgentsReport,
  BookingsReport,
  CustomersReport,
  ReportRangeQuery,
  ReportsOverview,
  RevenueReport,
} from './reports.model';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly api = inject(ApiService);

  overview(query: ReportRangeQuery = {}) {
    return this.api.get<ReportsOverview>('admin/reports', query);
  }

  bookings(query: ReportRangeQuery = {}) {
    return this.api.get<BookingsReport>('admin/reports/bookings', query);
  }

  revenue(query: ReportRangeQuery = {}) {
    return this.api.get<RevenueReport>('admin/reports/revenue', query);
  }

  agents(query: ReportRangeQuery = {}) {
    return this.api.get<AgentsReport>('admin/reports/agents', query);
  }

  customers(query: ReportRangeQuery = {}) {
    return this.api.get<CustomersReport>('admin/reports/customers', query);
  }
}
