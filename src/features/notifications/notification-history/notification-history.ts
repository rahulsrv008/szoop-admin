import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange } from '@shared/models/filter.model';
import { TableColumn, TablePageEvent } from '@shared/models/table.model';
import { NotificationHistoryItem } from '../notifications.model';
import { NotificationsService } from '../notifications.service';

@Component({
  selector: 'app-notification-history',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    DataTable,
    DateFilter,
  ],
  templateUrl: './notification-history.html',
  styleUrl: './notification-history.scss',
})
export class NotificationHistory {
  private readonly notificationsService = inject(NotificationsService);

  readonly loading = signal(false);
  readonly rows = signal<NotificationHistoryItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly range = signal<DateRange>({});

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly columns: TableColumn<NotificationHistoryItem>[] = [
    { key: 'title', label: 'Title', fallback: '—' },
    {
      key: 'message',
      label: 'Message',
      value: (row) =>
        row.message && row.message.length > 90
          ? `${row.message.slice(0, 90)}…`
          : row.message,
      fallback: '—',
    },
    {
      key: 'recipient',
      label: 'Recipient',
      value: (row) => row.recipient?.name ?? row.recipient?.mobile,
      fallback: '—',
    },
    {
      key: 'userType',
      label: 'Audience',
      type: 'badge',
      value: (row) => row.recipient?.userType,
    },
    { key: 'type', label: 'Type', type: 'badge', fallback: 'general' },
    { key: 'isRead', label: 'Read', type: 'boolean', align: 'center' },
    { key: 'createdAt', label: 'Sent', type: 'datetime' },
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
    this.notificationsService
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
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
}
