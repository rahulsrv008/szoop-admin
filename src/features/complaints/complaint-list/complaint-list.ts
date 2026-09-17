import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  DEFAULT_PAGE_SIZE,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '@config/constants';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange, SelectOption, toOptions } from '@shared/models/filter.model';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
} from '@shared/models/table.model';
import { ComplaintListItem } from '../complaints.model';
import { ComplaintsService } from '../complaints.service';

@Component({
  selector: 'app-complaint-list',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    DataTable,
    DateFilter,
  ],
  templateUrl: './complaint-list.html',
  styleUrl: './complaint-list.scss',
})
export class ComplaintList {
  private readonly complaintsService = inject(ComplaintsService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly rows = signal<ComplaintListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly status = signal('');
  readonly priority = signal('');
  readonly range = signal<DateRange>({});

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All statuses' },
    ...toOptions(TICKET_STATUSES),
  ];

  readonly priorityOptions: SelectOption[] = [
    { value: '', label: 'All priorities' },
    ...toOptions(TICKET_PRIORITIES),
  ];

  readonly columns: TableColumn<ComplaintListItem>[] = [
    { key: 'subject', label: 'Subject', fallback: 'No subject' },
    {
      key: 'raisedBy',
      label: 'Raised by',
      value: (row) => row.raisedBy?.name ?? row.raisedBy?.mobile,
      fallback: '—',
    },
    {
      key: 'raisedByRole',
      label: 'Role',
      value: (row) => row.raisedBy?.userType,
      type: 'badge',
    },
    { key: 'bookingNumber', label: 'Booking', fallback: '—' },
    { key: 'priority', label: 'Priority', type: 'badge' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'createdAt', label: 'Opened', type: 'datetime' },
  ];

  readonly actions: TableAction<ComplaintListItem>[] = [
    { id: 'view', label: 'Open ticket', icon: 'visibility' },
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
    this.complaintsService
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
        status: this.status() || undefined,
        priority: this.priority() || undefined,
        from: this.range().from ?? undefined,
        to: this.range().to ?? undefined,
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

  onPriorityChange(priority: string) {
    this.priority.set(priority);
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

  onRowClick(row: unknown) {
    const ticket = row as ComplaintListItem;
    void this.router.navigate(['/complaints', ticket.id]);
  }

  onAction(event: TableActionEvent) {
    const row = event.row as ComplaintListItem;
    if (event.id === 'view') {
      void this.router.navigate(['/complaints', row.id]);
    }
  }
}
