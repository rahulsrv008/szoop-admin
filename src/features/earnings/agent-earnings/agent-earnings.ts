import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { DEFAULT_PAGE_SIZE, MONTHS } from '@config/constants';
import {
  EarningRow,
  EarningSummaryRow,
  EarningTotals,
} from '@core/models';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange, SelectOption } from '@shared/models/filter.model';
import { TableColumn, TablePageEvent } from '@shared/models/table.model';
import { InrPipe } from '@shared/pipes/inr.pipe';
import { EarningsService } from '../earnings.service';

@Component({
  selector: 'app-agent-earnings',
  imports: [
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    DataTable,
    DateFilter,
    InrPipe,
    DecimalPipe,
  ],
  templateUrl: './agent-earnings.html',
  styleUrl: './agent-earnings.scss',
})
export class AgentEarnings {
  private readonly earnings = inject(EarningsService);

  readonly loading = signal(false);
  readonly summaryLoading = signal(false);
  readonly rows = signal<EarningRow[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly agentId = signal('');
  readonly range = signal<DateRange>({});
  readonly totals = signal<EarningTotals>({
    earnings: 0,
    revenue: 0,
    hours: 0,
  });

  readonly summaryRows = signal<EarningSummaryRow[]>([]);
  readonly month = signal(new Date().getMonth() + 1);
  readonly year = signal(new Date().getFullYear());

  readonly agentOptions = signal<SelectOption[]>([
    { value: '', label: 'All agents' },
  ]);

  readonly monthOptions: SelectOption[] = MONTHS.map((label, index) => ({
    value: index + 1,
    label,
  }));

  readonly yearOptions: SelectOption[] = Array.from({ length: 6 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: y, label: String(y) };
  });

  readonly columns: TableColumn<EarningRow>[] = [
    { key: 'agentName', label: 'Agent', fallback: '—' },
    { key: 'bookingNumber', label: 'Booking', fallback: '—' },
    { key: 'earningDate', label: 'Date', type: 'date' },
    {
      key: 'serviceHours',
      label: 'Hours',
      type: 'number',
      align: 'right',
    },
    {
      key: 'revenueGenerated',
      label: 'Revenue',
      type: 'currency',
      align: 'right',
    },
    {
      key: 'earningAmount',
      label: 'Earning',
      type: 'currency',
      align: 'right',
    },
  ];

  readonly summaryColumns: TableColumn<EarningSummaryRow>[] = [
    {
      key: 'name',
      label: 'Agent',
      fallback: '—',
      value: (row) => row.name,
    },
    {
      key: 'completedJobs',
      label: 'Jobs',
      type: 'number',
      align: 'right',
    },
    { key: 'hours', label: 'Hours', type: 'number', align: 'right' },
    {
      key: 'revenueGenerated',
      label: 'Revenue',
      type: 'currency',
      align: 'right',
    },
    {
      key: 'earnings',
      label: 'Earnings',
      type: 'currency',
      align: 'right',
    },
  ];

  constructor() {
    this.loadAgents();
    this.load();
    this.loadSummary();
  }

  load() {
    this.loading.set(true);
    this.earnings
      .list({
        page: this.page(),
        limit: this.limit(),
        agentId: this.agentId() || undefined,
        from: this.range().from ?? undefined,
        to: this.range().to ?? undefined,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result?.items ?? []);
          this.total.set(result?.meta?.total ?? 0);
          this.totals.set(
            result?.totals ?? { earnings: 0, revenue: 0, hours: 0 },
          );
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  loadSummary() {
    this.summaryLoading.set(true);
    this.earnings.summary(this.month(), this.year()).subscribe({
      next: (result) => {
        this.summaryRows.set(result?.items ?? []);
        this.summaryLoading.set(false);
      },
      error: () => this.summaryLoading.set(false),
    });
  }

  onAgentChange(agentId: string) {
    this.agentId.set(agentId);
    this.page.set(1);
    this.load();
  }

  onRangeChange(range: DateRange) {
    this.range.set(range);
    this.page.set(1);
    this.load();
  }

  onPageChange(event: TablePageEvent) {
    this.page.set(event.page);
    this.limit.set(event.limit);
    this.load();
  }

  onMonthChange(month: number) {
    this.month.set(month);
    this.loadSummary();
  }

  onYearChange(year: number) {
    this.year.set(year);
    this.loadSummary();
  }

  private loadAgents() {
    this.earnings.agents().subscribe({
      next: (result) => {
        this.agentOptions.set([
          { value: '', label: 'All agents' },
          ...(result?.items ?? []).map((item) => ({
            value: item.agentId,
            label: item.name ?? item.mobile,
          })),
        ]);
      },
    });
  }
}
