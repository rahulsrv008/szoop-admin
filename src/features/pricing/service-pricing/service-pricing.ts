import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { ServicePricing as PricingRow } from '@core/models';
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
import { PricingDialog } from '../pricing-dialog/pricing-dialog';
import { PricingRemoveOutcome } from '../pricing.model';
import { PricingService } from '../pricing.service';

@Component({
  selector: 'app-service-pricing',
  imports: [
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    DataTable,
  ],
  templateUrl: './service-pricing.html',
  styleUrl: './service-pricing.scss',
})
export class ServicePricingPage {
  private readonly pricing = inject(PricingService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly rows = signal<PricingRow[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly serviceId = signal('');
  readonly areaId = signal('');
  readonly status = signal('');
  readonly serviceOptions = signal<SelectOption[]>([
    { value: '', label: 'All services' },
  ]);
  readonly areaOptions = signal<SelectOption[]>([
    { value: '', label: 'All areas' },
  ]);

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  readonly columns: TableColumn<PricingRow>[] = [
    { key: 'serviceName', label: 'Service' },
    {
      key: 'serviceAreaName',
      label: 'Area',
      fallback: 'All areas',
    },
    {
      key: 'pricePerHour',
      label: 'Price / hr',
      type: 'currency',
      align: 'right',
    },
    {
      key: 'agentPayoutPerHour',
      label: 'Agent payout / hr',
      type: 'currency',
      align: 'right',
    },
    { key: 'isActive', label: 'Active', type: 'boolean', align: 'center' },
  ];

  readonly actions: TableAction<PricingRow>[] = [
    { id: 'edit', label: 'Edit', icon: 'edit' },
    { id: 'delete', label: 'Deactivate', icon: 'block', color: 'warn' },
  ];

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const serviceId = params.get('serviceId') ?? '';
      this.serviceId.set(serviceId);
      this.page.set(1);
      this.load();
    });

    this.loadLookups();
  }

  load() {
    this.loading.set(true);
    this.pricing
      .list({
        page: this.page(),
        limit: this.limit(),
        serviceId: this.serviceId() || undefined,
        serviceAreaId: this.areaId() || undefined,
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

  onServiceChange(serviceId: string) {
    this.serviceId.set(serviceId);
    this.page.set(1);
    this.load();
  }

  onAreaChange(areaId: string) {
    this.areaId.set(areaId);
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

  openCreate() {
    this.openDialog();
  }

  onAction(event: TableActionEvent) {
    const row = event.row as PricingRow;
    if (event.id === 'edit') this.openDialog(row);
    if (event.id === 'delete') this.remove(row);
  }

  private loadLookups() {
    this.pricing.services().subscribe({
      next: (result) => {
        this.serviceOptions.set([
          { value: '', label: 'All services' },
          ...(result?.items ?? []).map((item) => ({
            value: item.id,
            label: item.name,
          })),
        ]);
      },
    });
    this.pricing.areas().subscribe({
      next: (result) => {
        this.areaOptions.set([
          { value: '', label: 'All areas' },
          ...(result?.items ?? []).map((item) => ({
            value: item.id,
            label: item.name,
          })),
        ]);
      },
    });
  }

  private openDialog(row?: PricingRow) {
    const serviceOptions = this.serviceOptions().filter((o) => o.value !== '');
    const areaOptions = this.areaOptions().filter((o) => o.value !== '');

    this.dialog
      .open(PricingDialog, {
        width: '480px',
        data: {
          row: row ?? null,
          serviceOptions,
          areaOptions,
          presetServiceId: this.serviceId() || undefined,
        },
      })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        this.loading.set(true);
        const request = row
          ? this.pricing.update(row.id, payload)
          : this.pricing.create(payload);
        request.subscribe({
          next: () => {
            this.notifications.success(row ? 'Price updated' : 'Price created');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  private remove(row: PricingRow) {
    this.confirm
      .askDanger(
        'Deactivate price',
        `${row.serviceName ?? 'This price'} will be deactivated (pricing history is kept).`,
        { confirmLabel: 'Deactivate' },
      )
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.pricing.remove(row.id).subscribe({
          next: (outcome) => {
            this.notifications.success(this.outcomeMessage(outcome));
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  private outcomeMessage(outcome: PricingRemoveOutcome) {
    if (outcome.deactivated) {
      return outcome.reason
        ? `Price deactivated — ${outcome.reason}`
        : 'Price deactivated';
    }
    return outcome.reason ?? 'Price updated';
  }
}
