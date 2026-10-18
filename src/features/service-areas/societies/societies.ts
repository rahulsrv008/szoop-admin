import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { Society } from '@core/models';
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
import { SocietyDialog } from '../society-dialog/society-dialog';
import { ServiceAreasService } from '../service-areas.service';

@Component({
  selector: 'app-societies',
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
  templateUrl: './societies.html',
  styleUrl: './societies.scss',
})
export class Societies {
  private readonly areas = inject(ServiceAreasService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly rows = signal<Society[]>([]);
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

  readonly columns: TableColumn<Society>[] = [
    { key: 'name', label: 'Society' },
    { key: 'city', label: 'City' },
    { key: 'pincode', label: 'Pincode' },
    {
      key: 'totalUnits',
      label: 'Units',
      type: 'number',
      align: 'right',
    },
    { key: 'isActive', label: 'Active', type: 'boolean', align: 'center' },
  ];

  readonly actions: TableAction<Society>[] = [
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
    this.areas
      .societies({
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

  openCreate() {
    this.openDialog();
  }

  onAction(event: TableActionEvent) {
    const row = event.row as Society;
    if (event.id === 'edit') this.openDialog(row);
    if (event.id === 'delete') this.remove(row);
  }

  private openDialog(society?: Society) {
    this.dialog
      .open(SocietyDialog, {
        width: '520px',
        data: { society: society ?? null },
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        this.loading.set(true);
        const request = society
          ? this.areas.updateSociety(society.id, payload)
          : this.areas.createSociety(payload);
        request.subscribe({
          next: () => {
            this.notifications.success(society ? 'Society updated' : 'Society created');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  private remove(row: Society) {
    this.confirm
      .askDanger('Delete society', `${row.name} will be permanently removed.`, {
        confirmLabel: 'Delete society',
      })
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.areas.removeSociety(row.id).subscribe({
          next: () => {
            this.notifications.success('Society deleted');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }
}
