import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
} from '@shared/models/table.model';
import { CategoryDialog } from '../category-dialog/category-dialog';
import { CategoryListRow, RemoveOutcome } from '../services.model';
import { ServicesService } from '../services.service';

@Component({
  selector: 'app-category-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    DataTable,
  ],
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss',
})
export class CategoryList {
  private readonly services = inject(ServicesService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly rows = signal<CategoryListRow[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly columns: TableColumn<CategoryListRow>[] = [
    { key: 'name', label: 'Category' },
    { key: 'description', label: 'Description', fallback: '—' },
    {
      key: 'serviceCount',
      label: 'Services',
      type: 'number',
      align: 'right',
      value: (row) => row.serviceCount ?? row.activeServiceCount ?? 0,
    },
    { key: 'isActive', label: 'Active', type: 'boolean', align: 'center' },
  ];

  readonly actions: TableAction<CategoryListRow>[] = [
    { id: 'edit', label: 'Edit', icon: 'edit' },
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
    this.services
      .categories({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
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

  onPageChange(event: TablePageEvent) {
    this.page.set(event.page);
    this.limit.set(event.limit);
    this.load();
  }

  openCreate() {
    this.openDialog();
  }

  onAction(event: TableActionEvent) {
    const row = event.row as CategoryListRow;
    if (event.id === 'edit') this.openDialog(row);
    if (event.id === 'delete') this.remove(row);
  }

  private openDialog(category?: CategoryListRow) {
    this.dialog
      .open(CategoryDialog, {
        width: '480px',
        data: { category: category ?? null },
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        this.loading.set(true);
        const request = category
          ? this.services.updateCategory(category.id, payload)
          : this.services.createCategory(payload);
        request.subscribe({
          next: () => {
            this.notifications.success(
              category ? 'Category updated' : 'Category created',
            );
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  private remove(row: CategoryListRow) {
    this.confirm
      .askDanger(
        'Delete category',
        `${row.name} will be removed. If services still reference it, it will be deactivated instead.`,
        { confirmLabel: 'Delete category' },
      )
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.services.removeCategory(row.id).subscribe({
          next: (outcome) => {
            this.notifications.success(this.outcomeMessage(outcome));
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  private outcomeMessage(outcome: RemoveOutcome) {
    if (outcome.deleted) return 'Category deleted';
    if (outcome.deactivated) {
      return outcome.reason
        ? `Category deactivated — ${outcome.reason}`
        : 'Category deactivated';
    }
    return outcome.reason ?? 'Category updated';
  }
}
