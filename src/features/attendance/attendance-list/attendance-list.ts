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
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange, SelectOption } from '@shared/models/filter.model';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
} from '@shared/models/table.model';
import {
  AttendanceListItem,
  AttendanceTotals,
} from '../attendance.model';
import { AttendanceService } from '../attendance.service';

@Component({
  selector: 'app-attendance-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    DataTable,
    DateFilter,
  ],
  templateUrl: './attendance-list.html',
  styleUrl: './attendance-list.scss',
})
export class AttendanceList {
  private readonly attendanceService = inject(AttendanceService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly rows = signal<AttendanceListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly status = signal('');
  readonly range = signal<DateRange>({});
  readonly totals = signal<AttendanceTotals>({
    records: 0,
    presentDays: 0,
    completedShifts: 0,
    totalHours: 0,
  });

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All statuses' },
    { value: 'PRESENT', label: 'Present' },
    { value: 'CHECKED_IN', label: 'Checked in' },
    { value: 'CHECKED_OUT', label: 'Checked out' },
    { value: 'ABSENT', label: 'Absent' },
  ];

  readonly columns: TableColumn<AttendanceListItem>[] = [
    { key: 'agentName', label: 'Agent', fallback: '—' },
    { key: 'agentMobile', label: 'Mobile', fallback: '—' },
    { key: 'attendanceDate', label: 'Date', type: 'date' },
    { key: 'checkIn', label: 'Check in', type: 'datetime' },
    { key: 'checkOut', label: 'Check out', type: 'datetime' },
    {
      key: 'hoursWorked',
      label: 'Hours',
      type: 'number',
      align: 'right',
      fallback: '—',
    },
    { key: 'status', label: 'Status', type: 'badge' },
  ];

  readonly actions: TableAction<AttendanceListItem>[] = [
    { id: 'agent', label: 'Open agent', icon: 'person' },
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
    this.attendanceService
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
        status: this.status() || undefined,
        from: this.range().from ?? undefined,
        to: this.range().to ?? undefined,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result?.items ?? []);
          this.total.set(result?.meta?.total ?? 0);
          this.totals.set(
            result?.totals ?? {
              records: 0,
              presentDays: 0,
              completedShifts: 0,
              totalHours: 0,
            },
          );
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onStatusChange(value: string) {
    this.status.set(value);
    this.page.set(1);
    this.load();
  }

  onRangeChange(range: DateRange) {
    this.range.set(range);
    this.page.set(1);
    this.load();
  }

  onPageChange(event: TablePageEvent) {
    this.page.set(event.page);
    this.limit.set(event.limit);
    this.load();
  }

  onAction(event: TableActionEvent) {
    if (event.id === 'agent') {
      const row = event.row as AttendanceListItem;
      void this.router.navigate(['/agents', row.agentId]);
    }
  }
}
