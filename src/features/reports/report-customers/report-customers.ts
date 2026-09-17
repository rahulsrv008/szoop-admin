import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { InrPipe } from '@shared/pipes/inr.pipe';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateRange } from '@shared/models/filter.model';
import { TableColumn } from '@shared/models/table.model';
import { CustomersReport, TopCustomerRow, toBarSlices } from '../reports.model';
import { ReportsService } from '../reports.service';

@Component({
  selector: 'app-report-customers',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    DateFilter,
    DataTable,
    InrPipe,
  ],
  templateUrl: './report-customers.html',
  styleUrl: './report-customers.scss',
})
export class ReportCustomers {
  private readonly reportsService = inject(ReportsService);

  readonly loading = signal(false);
  readonly range = signal<DateRange>({});
  readonly data = signal<CustomersReport | null>(null);

  readonly signupBars = computed(() =>
    toBarSlices(
      (this.data()?.newCustomers ?? []).map((row) => ({
        label: row.date,
        value: row.count,
      })),
    ),
  );

  readonly tableLimit = computed(() =>
    Math.max(this.data()?.topCustomers?.length ?? 10, 10),
  );

  readonly columns: TableColumn<TopCustomerRow>[] = [
    { key: 'name', label: 'Customer', fallback: 'Unnamed' },
    { key: 'mobile', label: 'Mobile', fallback: '—' },
    { key: 'payments', label: 'Payments', type: 'number', align: 'right' },
    { key: 'spend', label: 'Spend', type: 'currency', align: 'right' },
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
      .customers({
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
