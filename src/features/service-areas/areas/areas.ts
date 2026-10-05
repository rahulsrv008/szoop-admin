import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { ServiceArea } from '@core/models';
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
import { AreaDialog } from '../area-dialog/area-dialog';
import { RemoveOutcome, zonePincodes } from '../service-areas.model';
import { ServiceAreasService } from '../service-areas.service';

@Component({
  selector: 'app-areas',
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
  templateUrl: './areas.html',
  styleUrl: './areas.scss',
})
export class Areas {
  private readonly areas = inject(ServiceAreasService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly rows = signal<ServiceArea[]>([]);
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

  readonly columns: TableColumn<ServiceArea>[] = [
    { key: 'name', label: 'Zone name' },
    {
      key: 'code',
      label: 'Code',
      fallback: '—',
      value: (row) => row.code || '—',
    },
    { key: 'city', label: 'City', fallback: '—' },
    { key: 'region', label: 'Region', fallback: '—' },
    {
      key: 'areas',
      label: 'Covered areas',
      value: (row) =>
        (row.areas ?? []).map((item) => item.area).join(', ') || '—',
    },
    {
      key: 'serviceRadiusKm',
      label: 'Radius (km)',
      type: 'number',
      align: 'right',
      fallback: '—',
    },
    {
      key: 'coords',
      label: 'Lat, Lng',
      value: (row) =>
        row.latitude != null && row.longitude != null
          ? `${row.latitude}, ${row.longitude}`
          : '—',
    },
    {
      key: 'pincodes',
      label: 'Pincodes',
      value: (row) => zonePincodes(row).join(', ') || '—',
    },
    { key: 'isActive', label: 'Active', type: 'boolean', align: 'center' },
  ];

  readonly actions: TableAction<ServiceArea>[] = [
    { id: 'edit', label: 'Edit', icon: 'edit' },
    { id: 'delete', label: 'Delete', icon: 'delete', color: 'warn' },
  ];

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const search = params.get('search') ?? '';
      if (search && search !== this.searchControl.value) {
        this.searchControl.setValue(search, { emitEvent: false });
        this.search.set(search);
        this.page.set(1);
        this.load();
      }
    });

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

  openCreate() {
    this.openDialog();
  }

  onAction(event: TableActionEvent) {
    const row = event.row as ServiceArea;
    if (event.id === 'edit') this.openDialog(row);
    if (event.id === 'delete') this.remove(row);
  }

  private openDialog(area?: ServiceArea) {
    this.dialog
      .open(AreaDialog, { width: '720px', data: { area: area ?? null } })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        this.loading.set(true);
        const request = area
          ? this.areas.update(area.id, payload)
          : this.areas.create(payload);
        request.subscribe({
          next: () => {
            this.notifications.success(
              area ? 'Service area updated' : 'Service area created',
            );
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  private remove(row: ServiceArea) {
    this.confirm
      .askDanger(
        'Delete service area',
        `${row.name} will be removed. If bookings or prices reference it, it will be deactivated instead.`,
        { confirmLabel: 'Delete area' },
      )
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.areas.remove(row.id).subscribe({
          next: (outcome) => {
            this.notifications.success(this.outcomeMessage(outcome));
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  private outcomeMessage(outcome: RemoveOutcome) {
    if (outcome.deleted) return 'Service area deleted';
    if (outcome.deactivated) {
      return outcome.reason
        ? `Service area deactivated — ${outcome.reason}`
        : 'Service area deactivated';
    }
    return outcome.reason ?? 'Service area updated';
  }
}
