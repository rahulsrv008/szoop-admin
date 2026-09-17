import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { PaymentListItem } from '@core/models';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange } from '@shared/models/filter.model';
import { TableColumn, TablePageEvent } from '@shared/models/table.model';
import { InrPipe } from '@shared/pipes/inr.pipe';
import { PaymentsService } from '../payments.service';

@Component({
  selector: 'app-refunds',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    DataTable,
    DateFilter,
    InrPipe,
  ],
  templateUrl: './refunds.html',
  styleUrl: './refunds.scss',
})
export class Refunds {
  private readonly payments = inject(PaymentsService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly rows = signal<PaymentListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly range = signal<DateRange>({});
  readonly refundedTotal = signal(0);

  readonly columns: TableColumn<PaymentListItem>[] = [
    { key: 'bookingNumber', label: 'Booking' },
    { key: 'customerName', label: 'Customer', fallback: '—' },
    { key: 'amount', label: 'Amount', type: 'currency', align: 'right' },
    { key: 'paymentMethod', label: 'Method', fallback: '—' },
    { key: 'paymentStatus', label: 'Status', type: 'badge' },
    { key: 'paidAt', label: 'Paid at', type: 'datetime' },
    { key: 'createdAt', label: 'Created', type: 'datetime' },
  ];

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.payments
      .list({
        page: this.page(),
        limit: this.limit(),
        paymentStatus: 'REFUNDED',
        from: this.range().from ?? undefined,
        to: this.range().to ?? undefined,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result?.items ?? []);
          this.total.set(result?.meta?.total ?? 0);
          this.refundedTotal.set(result?.totals?.refunded ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
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

  onRowClick(row: unknown) {
    const payment = row as PaymentListItem;
    void this.router.navigate(['/payments', payment.id]);
  }
}
