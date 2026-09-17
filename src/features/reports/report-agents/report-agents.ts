import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateRange } from '@shared/models/filter.model';
import { TableColumn } from '@shared/models/table.model';
import { AgentReportRow, AgentsReport } from '../reports.model';
import { ReportsService } from '../reports.service';

@Component({
  selector: 'app-report-agents',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    DateFilter,
    DataTable,
  ],
  templateUrl: './report-agents.html',
  styleUrl: './report-agents.scss',
})
export class ReportAgents {
  private readonly reportsService = inject(ReportsService);

  readonly loading = signal(false);
  readonly range = signal<DateRange>({});
  readonly data = signal<AgentsReport | null>(null);
  readonly tableLimit = computed(() =>
    Math.max(this.data()?.items?.length ?? 20, 20),
  );

  readonly columns: TableColumn<AgentReportRow>[] = [
    { key: 'name', label: 'Agent', fallback: 'Unnamed' },
    { key: 'completedJobs', label: 'Jobs', type: 'number', align: 'right' },
    { key: 'hours', label: 'Hours', type: 'number', align: 'right' },
    {
      key: 'revenueGenerated',
      label: 'Revenue',
      type: 'currency',
      align: 'right',
    },
    { key: 'earnings', label: 'Earnings', type: 'currency', align: 'right' },
    {
      key: 'averageRating',
      label: 'Rating',
      type: 'number',
      align: 'right',
      value: (row) => Number(row.averageRating).toFixed(1),
    },
    {
      key: 'attendanceDays',
      label: 'Attendance days',
      type: 'number',
      align: 'right',
    },
  ];

  constructor() {
    this.load();
  }

  onRangeChange(range: DateRange) {
    this.range.set(range);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.reportsService
      .agents({
        from: this.range().from ?? undefined,
        to: this.range().to ?? undefined,
      })
      .subscribe({
        next: (data) => {
          this.data.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
