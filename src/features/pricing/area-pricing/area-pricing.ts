import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { ServicePricing as PricingRow } from '@core/models';
import { DataTable } from '@shared/components/data-table/data-table';
import { SelectOption } from '@shared/models/filter.model';
import { TableColumn } from '@shared/models/table.model';
import { PricingService } from '../pricing.service';

@Component({
  selector: 'app-area-pricing',
  imports: [
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    DataTable,
  ],
  templateUrl: './area-pricing.html',
  styleUrl: './area-pricing.scss',
})
export class AreaPricing {
  private readonly pricing = inject(PricingService);

  readonly loading = signal(false);
  readonly areaId = signal('');
  readonly areaOptions = signal<SelectOption[]>([]);
  readonly allRows = signal<PricingRow[]>([]);

  readonly columns: TableColumn<PricingRow>[] = [
    { key: 'serviceName', label: 'Service' },
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

  readonly filteredRows = computed(() => {
    const areaId = this.areaId();
    const rows = this.allRows();
    if (!areaId) {
      return rows.filter((row) => !row.serviceAreaId);
    }
    return rows.filter((row) => row.serviceAreaId === areaId);
  });

  readonly selectedAreaLabel = computed(() => {
    const match = this.areaOptions().find((o) => o.value === this.areaId());
    return match?.label ?? 'Default (all areas)';
  });

  constructor() {
    this.load();
  }

  onAreaChange(areaId: string) {
    this.areaId.set(areaId);
  }

  private load() {
    this.loading.set(true);
    this.pricing.areas().subscribe({
      next: (result) => {
        this.areaOptions.set([
          { value: '', label: 'Default (all areas)' },
          ...(result?.items ?? []).map((item) => ({
            value: item.id,
            label: item.name,
          })),
        ]);
      },
    });

    this.pricing.list({ page: 1, limit: 100, isActive: true }).subscribe({
      next: (result) => {
        this.allRows.set(result?.items ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
