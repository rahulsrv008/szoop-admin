import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DataTable } from '@shared/components/data-table/data-table';
import { TableColumn } from '@shared/models/table.model';
import { PincodeRow, zonePincodes } from '../service-areas.model';
import { ServiceAreasService } from '../service-areas.service';

@Component({
  selector: 'app-pincodes',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    DataTable,
  ],
  templateUrl: './pincodes.html',
  styleUrl: './pincodes.scss',
})
export class Pincodes {
  private readonly areas = inject(ServiceAreasService);

  readonly loading = signal(false);
  readonly allRows = signal<PincodeRow[]>([]);
  readonly search = signal('');
  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly columns: TableColumn<PincodeRow>[] = [
    { key: 'pincode', label: 'Pincode' },
    { key: 'areaName', label: 'Covered area' },
    { key: 'zoneName', label: 'Zone' },
    { key: 'city', label: 'City', fallback: '—' },
    { key: 'isActive', label: 'Active', type: 'boolean', align: 'center' },
  ];

  readonly rows = computed(() => {
    const q = this.search().toLowerCase();
    if (!q) return this.allRows();
    return this.allRows().filter(
      (row) =>
        row.pincode.includes(q) ||
        row.areaName.toLowerCase().includes(q) ||
        row.zoneName.toLowerCase().includes(q) ||
        (row.city ?? '').toLowerCase().includes(q),
    );
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => this.search.set(value.trim()));

    this.load();
  }

  private load() {
    this.loading.set(true);
    this.areas.catalog().subscribe({
      next: (result) => {
        this.allRows.set(
          (result?.items ?? [])
            .flatMap((area) => {
              const nested = (area.areas ?? []).map((item) => ({
                pincode: item.pincode,
                areaName: item.area,
                zoneName: area.name,
                city: area.city ?? null,
                isActive: area.isActive,
                areaId: area.id,
              }));
              if (nested.length) return nested;
              return zonePincodes(area).map((pincode) => ({
                pincode,
                areaName: area.name,
                zoneName: area.name,
                city: area.city ?? null,
                isActive: area.isActive,
                areaId: area.id,
              }));
            })
            .sort((a, b) => a.pincode.localeCompare(b.pincode)),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
