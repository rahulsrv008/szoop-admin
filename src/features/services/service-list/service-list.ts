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
import { RemoveOutcome, ServiceListRow } from '../services.model';
import { ServicesService } from '../services.service';

@Component({
  selector: 'app-service-list',
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
  templateUrl: './service-list.html',
  styleUrl: './service-list.scss',
})
export class ServiceList {
  private readonly services = inject(ServicesService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly rows = signal<ServiceListRow[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly categoryId = signal('');
  readonly status = signal('');
  readonly categoryOptions = signal<SelectOption[]>([
    { value: '', label: 'All categories' },
  ]);

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  readonly columns: TableColumn<ServiceListRow>[] = [
    { key: 'name', label: 'Service', sortable: true },
    { key: 'categoryName', label: 'Category', fallback: 'Uncategorised' },
    {
      key: 'durationMinutes',
      label: 'Duration (min)',
      type: 'number',
      align: 'right',
    },
    {
      key: 'pricingCount',
      label: 'Prices',
      type: 'number',
      align: 'right',
      value: (row) => row.pricingCount ?? row.activePricingCount ?? 0,
    },
    { key: 'isActive', label: 'Active', type: 'boolean', align: 'center' },
    { key: 'createdAt', label: 'Created', type: 'date' },
  ];

  readonly actions: TableAction<ServiceListRow>[] = [
    { id: 'edit', label: 'Edit', icon: 'edit' },
    { id: 'pricing', label: 'Pricing', icon: 'sell' },
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

    this.loadCategories();
    this.load();
  }

  load() {
    this.loading.set(true);
    this.services
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
        categoryId: this.categoryId() || undefined,
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

  onCategoryChange(categoryId: string) {
    this.categoryId.set(categoryId);
    this.page.set(1);
    this.load();
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
    const row = event.row as ServiceListRow;
    switch (event.id) {
      case 'edit':
        void this.router.navigate(['/services', row.id, 'edit']);
        break;
      case 'pricing':
        void this.router.navigate(['/pricing'], {
          queryParams: { serviceId: row.id },
        });
        break;
      case 'delete':
        this.remove(row);
        break;
    }
  }

  private loadCategories() {
    this.services.categories({ page: 1, limit: 100 }).subscribe({
      next: (result) => {
        this.categoryOptions.set([
          { value: '', label: 'All categories' },
          ...(result?.items ?? []).map((item) => ({
            value: item.id,
            label: item.name,
          })),
        ]);
      },
    });
  }

  private remove(row: ServiceListRow) {
    this.confirm
      .askDanger(
        'Delete service',
        `${row.name} will be removed. If bookings still reference it, it will be deactivated instead.`,
        { confirmLabel: 'Delete service' },
      )
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.services.remove(row.id).subscribe({
          next: (outcome) => {
            this.notifications.success(this.outcomeMessage('Service', outcome));
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  private outcomeMessage(label: string, outcome: RemoveOutcome) {
    if (outcome.deleted) return `${label} deleted`;
    if (outcome.deactivated) {
      return outcome.reason
        ? `${label} deactivated — ${outcome.reason}`
        : `${label} deactivated`;
    }
    return outcome.reason ?? `${label} updated`;
  }
}
