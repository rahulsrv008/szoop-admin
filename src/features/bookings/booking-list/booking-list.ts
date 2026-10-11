import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUSES,
  DEFAULT_PAGE_SIZE,
  PAYMENT_STATUSES,
} from '@config/constants';
import { BookingListItem } from '@core/models';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange, SelectOption, toOptions } from '@shared/models/filter.model';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
} from '@shared/models/table.model';
import {
  AssignAgentDialog,
  AssignAgentDialogData,
  AssignAgentDialogResult,
} from '../assign-agent/assign-agent';
import { BookingsService } from '../bookings.service';

@Component({
  selector: 'app-booking-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    DataTable,
    DateFilter,
  ],
  templateUrl: './booking-list.html',
  styleUrl: './booking-list.scss',
})
export class BookingList {
  private readonly bookingsService = inject(BookingsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly rows = signal<BookingListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly status = signal('');
  readonly paymentStatus = signal('');
  readonly range = signal<DateRange>({});

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All statuses' },
    ...toOptions(BOOKING_STATUSES, BOOKING_STATUS_LABELS),
  ];

  readonly paymentOptions: SelectOption[] = [
    { value: '', label: 'All payments' },
    ...toOptions(PAYMENT_STATUSES),
  ];

  readonly columns: TableColumn<BookingListItem>[] = [
    { key: 'bookingNumber', label: 'Booking', sortable: true },
    { key: 'customerName', label: 'Customer', fallback: '—' },
    { key: 'planTitle', label: 'Service', fallback: '—' },
    { key: 'agentName', label: 'Agent', fallback: 'Unassigned' },
    { key: 'bookingDate', label: 'Date', type: 'date' },
    { key: 'startTime', label: 'Time' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'paymentStatus', label: 'Payment', type: 'badge' },
    {
      key: 'totalAmount',
      label: 'Amount',
      type: 'currency',
      align: 'right',
    },
  ];

  readonly actions: TableAction<BookingListItem>[] = [
    { id: 'view', label: 'Open', icon: 'visibility' },
    {
      id: 'assign',
      label: 'Assign agent',
      icon: 'person_add',
      hidden: (row) =>
        !!row.agentId || !['finding', 'paid', 'accepted'].includes(row.status),
    },
    {
      id: 'reassign',
      label: 'Reassign',
      icon: 'swap_horiz',
      hidden: (row) =>
        !row.agentId || ['completed', 'cancelled', 'expired'].includes(row.status),
    },
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
    this.bookingsService
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
        status: this.status() || undefined,
        paymentStatus: this.paymentStatus() || undefined,
        from: this.range().from ?? undefined,
        to: this.range().to ?? undefined,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result?.items ?? []);
          this.total.set(result?.meta?.total ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onStatusChange(value: string) {
    this.status.set(value);
    this.page.set(1);
    this.load();
  }

  onPaymentChange(value: string) {
    this.paymentStatus.set(value);
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
    const booking = row as BookingListItem;
    void this.router.navigate(['/bookings', booking.id]);
  }

  onAction(event: TableActionEvent) {
    const row = event.row as BookingListItem;

    switch (event.id) {
      case 'view':
        void this.router.navigate(['/bookings', row.id]);
        break;
      case 'assign':
        this.openAssign(row, false);
        break;
      case 'reassign':
        this.openAssign(row, true);
        break;
    }
  }

  private openAssign(row: BookingListItem, reassign: boolean) {
    const data: AssignAgentDialogData = {
      bookingId: row.id,
      bookingNumber: row.bookingNumber,
      reassign,
      currentAgentName: row.agentName,
    };

    this.dialog
      .open(AssignAgentDialog, { data, width: '480px' })
      .afterClosed()
      .subscribe((result: AssignAgentDialogResult | undefined) => {
        if (result?.assigned) this.load();
      });
  }
}
