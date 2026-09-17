import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { BookingListItem } from '@core/models';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange } from '@shared/models/filter.model';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
} from '@shared/models/table.model';
import { BookingsService } from '../../bookings/bookings.service';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-customer-bookings',
  imports: [RouterLink, MatButtonModule, MatIconModule, DataTable, DateFilter],
  templateUrl: './customer-bookings.html',
  styleUrl: './customer-bookings.scss',
})
export class CustomerBookings implements OnInit {
  private readonly bookingsService = inject(BookingsService);
  private readonly customersService = inject(CustomersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly customerName = signal('Customer');
  readonly rows = signal<BookingListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly range = signal<DateRange>({});

  readonly columns: TableColumn<BookingListItem>[] = [
    { key: 'bookingNumber', label: 'Booking', sortable: true },
    { key: 'bookingDate', label: 'Date', type: 'date' },
    { key: 'startTime', label: 'Time' },
    { key: 'agentName', label: 'Agent', fallback: 'Unassigned' },
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
    { id: 'view', label: 'Open booking', icon: 'visibility' },
  ];

  ngOnInit() {
    this.customersService.detail(this.customerId).subscribe({
      next: (customer) => {
        this.customerName.set(customer.name ?? customer.mobile);
      },
    });
    this.load();
  }

  get customerId() {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  load() {
    this.loading.set(true);
    this.bookingsService
      .list({
        page: this.page(),
        limit: this.limit(),
        customerId: this.customerId,
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
    if (event.id === 'view') {
      this.onRowClick(event.row);
    }
  }
}
