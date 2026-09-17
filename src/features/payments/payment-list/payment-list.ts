import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DEFAULT_PAGE_SIZE, PAYMENT_STATUSES } from '@config/constants';
import { PaymentListItem, PaymentTotals } from '@core/models';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange, SelectOption, toOptions } from '@shared/models/filter.model';
import {
  TableColumn,
  TablePageEvent,
} from '@shared/models/table.model';
import { InrPipe } from '@shared/pipes/inr.pipe';
import { PaymentsService } from '../payments.service';

@Component({
  selector: 'app-payment-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    DataTable,
    DateFilter,
    InrPipe,
    DecimalPipe,
  ],
  templateUrl: './payment-list.html',
  styleUrl: './payment-list.scss',
})
export class PaymentList {
  private readonly payments = inject(PaymentsService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly rows = signal<PaymentListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly status = signal('');
  readonly range = signal<DateRange>({});
  readonly totals = signal<PaymentTotals>({
    collected: 0,
    pending: 0,
    refunded: 0,
    count: 0,
  });

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All statuses' },
    ...toOptions(PAYMENT_STATUSES),
  ];

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
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.search.set(value.trim());
        this.page.set(1);
        this.load();
      });

    this.load();
  }

  load() {
    this.loading.set(true);
    this.payments
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
        paymentStatus: this.status() || undefined,
        from: this.range().from ?? undefined,
        to: this.range().to ?? undefined,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result?.items ?? []);
          this.total.set(result?.meta?.total ?? 0);
          this.totals.set(
            result?.totals ?? {
              collected: 0,
              pending: 0,
              refunded: 0,
              count: 0,
            },
          );
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onStatusChange(status: string) {
    this.status.set(status);
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

  onRowClick(row: unknown) {
    const payment = row as PaymentListItem;
    void this.router.navigate(['/payments', payment.id]);
  }
}
