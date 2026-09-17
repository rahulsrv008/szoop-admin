import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange } from '@shared/models/filter.model';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
} from '@shared/models/table.model';
import {
  AttendanceReportResponse,
  AttendanceReportRow,
} from '../attendance.model';
import { AttendanceService } from '../attendance.service';

@Component({
  selector: 'app-attendance-report',
  imports: [RouterLink, MatButtonModule, MatIconModule, DataTable, DateFilter],
  templateUrl: './attendance-report.html',
  styleUrl: './attendance-report.scss',
})
export class AttendanceReport {
  private readonly attendanceService = inject(AttendanceService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly rows = signal<AttendanceReportRow[]>([]);
  readonly range = signal<DateRange>({});
  readonly report = signal<AttendanceReportResponse | null>(null);

  readonly columns: TableColumn<AttendanceReportRow>[] = [
    { key: 'agentName', label: 'Agent', fallback: '—' },
    { key: 'agentMobile', label: 'Mobile', fallback: '—' },
    {
      key: 'presentDays',
      label: 'Present days',
      type: 'number',
      align: 'right',
    },
    {
      key: 'totalHours',
      label: 'Total hours',
      type: 'number',
      align: 'right',
    },
    {
      key: 'averageHours',
      label: 'Avg hours/day',
      type: 'number',
      align: 'right',
    },
    { key: 'lastCheckIn', label: 'Last check-in', type: 'datetime' },
  ];

  readonly actions: TableAction<AttendanceReportRow>[] = [
    { id: 'agent', label: 'Open agent', icon: 'person' },
  ];

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.attendanceService
      .report({
        from: this.range().from ?? undefined,
        to: this.range().to ?? undefined,
      })
      .subscribe({
        next: (result) => {
          this.report.set(result);
          this.rows.set(result?.items ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onRangeChange(range: DateRange) {
    this.range.set(range);
    this.load();
  }

  onAction(event: TableActionEvent) {
    if (event.id === 'agent') {
      const row = event.row as AttendanceReportRow;
      void this.router.navigate(['/agents', row.agentId]);
    }
  }
}
