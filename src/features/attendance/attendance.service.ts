import { Injectable, inject } from '@angular/core';
import { ApiService } from '@core/services/api.service';
import {
  AttendanceListQuery,
  AttendanceListResponse,
  AttendanceReportQuery,
  AttendanceReportResponse,
} from './attendance.model';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly api = inject(ApiService);

  list(query: AttendanceListQuery = {}) {
    return this.api.get<AttendanceListResponse>('admin/attendance', query);
  }

  report(query: AttendanceReportQuery = {}) {
    return this.api.get<AttendanceReportResponse>(
      'admin/attendance/report',
      query,
    );
  }
}
