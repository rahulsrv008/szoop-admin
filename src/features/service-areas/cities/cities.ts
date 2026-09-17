import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
} from '@shared/models/table.model';
import { CityAggregate } from '../service-areas.model';
import { ServiceAreasService } from '../service-areas.service';

@Component({
  selector: 'app-cities',
  imports: [RouterLink, MatButtonModule, MatIconModule, DataTable],
  templateUrl: './cities.html',
  styleUrl: './cities.scss',
})
export class Cities {
  private readonly areas = inject(ServiceAreasService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly rows = signal<CityAggregate[]>([]);

  readonly columns: TableColumn<CityAggregate>[] = [
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State', fallback: '—' },
    { key: 'areaCount', label: 'Areas', type: 'number', align: 'right' },
    {
      key: 'activeAreaCount',
      label: 'Active areas',
      type: 'number',
      align: 'right',
    },
    {
      key: 'pincodeCount',
      label: 'Pincodes',
      type: 'number',
      align: 'right',
    },
  ];

  readonly actions: TableAction<CityAggregate>[] = [
    { id: 'open', label: 'View areas', icon: 'arrow_forward' },
  ];

  constructor() {
    this.load();
  }

  onAction(event: TableActionEvent) {
    const row = event.row as CityAggregate;
    if (event.id === 'open') {
      void this.router.navigate(['/service-areas'], {
        queryParams: { search: row.city },
      });
    }
  }

  onRowClick(row: unknown) {
    const city = row as CityAggregate;
    void this.router.navigate(['/service-areas'], {
      queryParams: { search: city.city },
    });
  }

  private load() {
    this.loading.set(true);
    this.areas.catalog().subscribe({
      next: (result) => {
        const map = new Map<string, CityAggregate & { pincodes: Set<string> }>();
        for (const area of result?.items ?? []) {
          const city = (area.city ?? '').trim() || 'Unspecified';
          const key = `${city}||${area.state ?? ''}`;
          let entry = map.get(key);
          if (!entry) {
            entry = {
              city,
              state: area.state ?? null,
              areaCount: 0,
              activeAreaCount: 0,
              pincodeCount: 0,
              pincodes: new Set(),
            };
            map.set(key, entry);
          }
          entry.areaCount += 1;
          if (area.isActive) entry.activeAreaCount += 1;
          if (area.pincode) entry.pincodes.add(area.pincode);
        }

        this.rows.set(
          [...map.values()]
            .map(({ pincodes, ...rest }) => ({
              ...rest,
              pincodeCount: pincodes.size,
            }))
            .sort((a, b) => a.city.localeCompare(b.city)),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
