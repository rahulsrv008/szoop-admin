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
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { Coupon } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { SelectOption } from '@shared/models/filter.model';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
} from '@shared/models/table.model';
import { RemoveOutcome } from '../coupons.model';
import { CouponsService } from '../coupons.service';

@Component({
  selector: 'app-coupon-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    DataTable,
  ],
  templateUrl: './coupon-list.html',
  styleUrl: './coupon-list.scss',
})
export class CouponList {
  private readonly coupons = inject(CouponsService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly rows = signal<Coupon[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly status = signal('');

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  readonly columns: TableColumn<Coupon>[] = [
    { key: 'code', label: 'Code' },
    { key: 'discountType', label: 'Type', type: 'badge' },
    {
      key: 'discountValue',
      label: 'Value',
      value: (row) =>
        row.discountType === 'PERCENT'
          ? `${row.discountValue}%`
          : `₹${row.discountValue}`,
    },
    {
      key: 'minOrderAmount',
      label: 'Min order',
      type: 'currency',
      align: 'right',
    },
    {
      key: 'maxDiscount',
      label: 'Max discount',
      type: 'currency',
      align: 'right',
    },
    {
      key: 'usage',
      label: 'Used',
      value: (row) =>
        row.usageLimit == null
          ? `${row.usedCount}`
          : `${row.usedCount} / ${row.usageLimit}`,
    },
    {
      key: 'perCustomerLimit',
      label: 'Per User',
      value: (row) => `${row.perCustomerLimit ?? 1}x`,
      align: 'center',
    },
    {
      key: 'customerName',
      label: 'Target',
      value: (row) => {
        if (row.customerName) return row.customerName;
        if (row.assignedCustomerIds && row.assignedCustomerIds.length > 0) {
          return `${row.assignedCustomerIds.length} customer(s)`;
        }
        return 'All';
      },
    },
    {
      key: 'eligibilityRuleName',
      label: 'Eligibility Rule',
      value: (row) => row.eligibilityRuleName || '—',
    },
    { key: 'validFrom', label: 'Valid from', type: 'date' },
    { key: 'validUntil', label: 'Valid until', type: 'date' },
    { key: 'isActive', label: 'Active', type: 'boolean', align: 'center' },
  ];

  readonly actions: TableAction<Coupon>[] = [
    { id: 'edit', label: 'Edit', icon: 'edit' },
    { id: 'usage', label: 'Usage', icon: 'history' },
    { id: 'delete', label: 'Delete', icon: 'delete', color: 'warn' },
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
    this.coupons
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
        isActive: this.status() ? this.status() === 'true' : undefined,
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

  onPageChange(event: TablePageEvent) {
    this.page.set(event.page);
    this.limit.set(event.limit);
    this.load();
  }

  onAction(event: TableActionEvent) {
    const row = event.row as Coupon;
    switch (event.id) {
      case 'edit':
        void this.router.navigate(['/coupons', row.id, 'edit']);
        break;
      case 'usage':
        void this.router.navigate(['/coupons', row.id, 'usage']);
        break;
      case 'delete':
        this.remove(row);
        break;
    }
  }

  private remove(row: Coupon) {
    this.confirm
      .askDanger(
        'Delete coupon',
        `${row.code} will be removed. If it has redemptions, it will be deactivated instead.`,
        { confirmLabel: 'Delete coupon' },
      )
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.coupons.remove(row.id).subscribe({
          next: (outcome) => {
            this.notifications.success(this.outcomeMessage(outcome));
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  private outcomeMessage(outcome: RemoveOutcome) {
    if (outcome.deleted) return 'Coupon deleted';
    if (outcome.deactivated) {
      return outcome.reason
        ? `Coupon deactivated — ${outcome.reason}`
        : 'Coupon deactivated';
    }
    return outcome.reason ?? 'Coupon updated';
  }
}
