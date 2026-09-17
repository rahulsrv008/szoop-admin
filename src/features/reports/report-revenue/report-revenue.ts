import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { InrPipe } from '@shared/pipes/inr.pipe';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange } from '@shared/models/filter.model';
import { RevenueReport, toBarSlices } from '../reports.model';
import { ReportsService } from '../reports.service';

@Component({
  selector: 'app-report-revenue',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    DateFilter,
    InrPipe,
  ],
  templateUrl: './report-revenue.html',
  styleUrl: './report-revenue.scss',
})
export class ReportRevenue {
  private readonly reportsService = inject(ReportsService);

  readonly loading = signal(false);
  readonly range = signal<DateRange>({});
  readonly data = signal<RevenueReport | null>(null);

  readonly collectedBars = computed(() =>
    toBarSlices(
      (this.data()?.series ?? []).map((row) => ({
        label: row.date,
        value: row.collected,
        hint: `Pending ${row.pending} · Refunded ${row.refunded}`,
      })),
    ),
  );

  readonly serviceBars = computed(() =>
    toBarSlices(
      (this.data()?.topServices ?? []).map((row) => ({
        label: row.serviceName,
        value: row.revenue,
        hint: `${row.bookings} bookings`,
      })),
    ),
  );

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
      .revenue({
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
