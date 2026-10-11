import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { CustomerListItem } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange, SelectOption } from '@shared/models/filter.model';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
} from '@shared/models/table.model';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-customer-list',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    DataTable,
    DateFilter,
  ],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
})
export class CustomerList {
  private readonly customersService = inject(CustomersService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly rows = signal<CustomerListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly status = signal('');
  readonly range = signal<DateRange>({});

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All accounts' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Blocked' },
  ];

  readonly columns: TableColumn<CustomerListItem>[] = [
    { key: 'name', label: 'Customer', sortable: true, fallback: 'Unnamed' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'email', label: 'Email' },
    {
      key: 'homeZone',
      label: 'Zone',
      fallback: '—',
      value: (row) => row.homeZone?.name || '—',
    },
    { key: 'totalBookings', label: 'Bookings', type: 'number', align: 'right' },
    { key: 'lastBookingDate', label: 'Last booking', type: 'date' },
    { key: 'isActive', label: 'Active', type: 'boolean', align: 'center' },
    { key: 'createdAt', label: 'Joined', type: 'date' },
  ];

  readonly actions: TableAction<CustomerListItem>[] = [
    { id: 'view', label: 'Open profile', icon: 'visibility' },
    { id: 'bookings', label: 'Bookings', icon: 'event_note' },
    {
      id: 'block',
      label: 'Block customer',
      icon: 'block',
      color: 'warn',
      hidden: (row) => !row.isActive,
    },
    {
      id: 'unblock',
      label: 'Unblock customer',
      icon: 'lock_open',
      hidden: (row) => row.isActive,
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
    this.customersService
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
        isActive: this.status() ? this.status() === 'true' : undefined,
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
    const customer = row as CustomerListItem;
    void this.router.navigate(['/customers', customer.customerId]);
  }

  onAction(event: TableActionEvent) {
    const row = event.row as CustomerListItem;

    switch (event.id) {
      case 'view':
        void this.router.navigate(['/customers', row.customerId]);
        break;
      case 'bookings':
        void this.router.navigate(['/customers', row.customerId, 'bookings']);
        break;
      case 'block':
        this.block(row);
        break;
      case 'unblock':
        this.unblock(row);
        break;
    }
  }

  private block(row: CustomerListItem) {
    this.confirm
      .askDanger(
        'Block customer',
        `${row.name ?? row.mobile} loses access to the ClearIt app immediately.`,
        {
          confirmLabel: 'Block customer',
          requireReason: true,
          reasonLabel: 'Reason (sent to the customer)',
        },
      )
      .subscribe((result) => {
        if (!result.confirmed) return;

        this.loading.set(true);
        this.customersService.block(row.customerId, result.reason).subscribe({
          next: () => {
            this.notifications.success('Customer blocked');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  private unblock(row: CustomerListItem) {
    this.confirm
      .ask({
        title: 'Unblock customer',
        message: `${row.name ?? row.mobile} will be able to sign in and book again.`,
        confirmLabel: 'Unblock',
      })
      .subscribe((result) => {
        if (!result.confirmed) return;

        this.loading.set(true);
        this.customersService.unblock(row.customerId).subscribe({
          next: () => {
            this.notifications.success('Customer unblocked');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }
}
