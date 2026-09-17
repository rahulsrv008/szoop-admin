import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PAGE_SIZES } from '@config/constants';
import { InrPipe } from '@shared/pipes/inr.pipe';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
  TableSortEvent,
} from '@shared/models/table.model';

/**
 * Server-driven table: the parent owns loading, paging and sorting state and
 * feeds `rows` + `total`; this component only renders and emits intent.
 */
@Component({
  selector: 'app-data-table',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    DatePipe,
    DecimalPipe,
    InrPipe,
    StatusBadge,
  ],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
})
export class DataTable {
  readonly columns = input<TableColumn[]>([]);
  readonly rows = input<readonly unknown[]>([]);
  readonly actions = input<TableAction[]>([]);
  readonly loading = input(false);
  readonly total = input(0);
  readonly page = input(1);
  readonly limit = input(20);
  readonly pageSizeOptions = input<number[]>(PAGE_SIZES);
  readonly emptyMessage = input('No records found');
  readonly clickableRows = input(false);

  readonly pageChange = output<TablePageEvent>();
  readonly sortChange = output<TableSortEvent>();
  readonly actionClick = output<TableActionEvent>();
  readonly rowClick = output<unknown>();

  readonly displayedColumns = computed(() => {
    const keys = this.columns().map((column) => column.key);
    return this.actions().length ? [...keys, '__actions'] : keys;
  });

  readonly pageIndex = computed(() => Math.max(this.page() - 1, 0));

  cell(row: unknown, column: TableColumn): unknown {
    if (column.value) return column.value(row);
    return (row as Record<string, unknown>)[column.key];
  }

  text(row: unknown, column: TableColumn): string {
    const value = this.cell(row, column);
    if (value === null || value === undefined || value === '') {
      return column.fallback ?? '—';
    }
    return String(value);
  }

  /** Numeric view of a cell, for the currency and number column types. */
  numeric(row: unknown, column: TableColumn): number | null {
    const value = this.cell(row, column);
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  chips(row: unknown, column: TableColumn): string[] {
    const value = this.cell(row, column);
    return Array.isArray(value) ? value.map((entry) => String(entry)) : [];
  }

  asDate(row: unknown, column: TableColumn): string | null {
    const value = this.cell(row, column);
    return typeof value === 'string' || value instanceof Date
      ? (value as unknown as string)
      : null;
  }

  isTruthy(row: unknown, column: TableColumn) {
    return !!this.cell(row, column);
  }

  visibleActions(row: unknown) {
    return this.actions().filter((action) => !action.hidden?.(row));
  }

  isDisabled(action: TableAction, row: unknown) {
    return !!action.disabled?.(row);
  }

  onPage(event: PageEvent) {
    this.pageChange.emit({ page: event.pageIndex + 1, limit: event.pageSize });
  }

  onSort(event: Sort) {
    this.sortChange.emit({ active: event.active, direction: event.direction });
  }

  onAction(action: TableAction, row: unknown, event: MouseEvent) {
    event.stopPropagation();
    this.actionClick.emit({ id: action.id, row });
  }

  onRowClick(row: unknown) {
    if (this.clickableRows()) this.rowClick.emit(row);
  }
}
