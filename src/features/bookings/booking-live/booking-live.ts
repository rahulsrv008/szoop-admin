import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, interval, map, startWith, switchMap } from 'rxjs';
import { ENVIRONMENT } from '@config/environment';
import { LIVE_BOOKING_STATUSES } from '@config/constants';
import { BookingListItem } from '@core/models';
import { DataTable } from '@shared/components/data-table/data-table';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
} from '@shared/models/table.model';
import {
  AssignAgentDialog,
  AssignAgentDialogData,
  AssignAgentDialogResult,
} from '../assign-agent/assign-agent';
import { BookingsService } from '../bookings.service';

@Component({
  selector: 'app-booking-live',
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    DataTable,
  ],
  templateUrl: './booking-live.html',
  styleUrl: './booking-live.scss',
})
export class BookingLive {
  private readonly bookingsService = inject(BookingsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly rows = signal<BookingListItem[]>([]);
  readonly lastRefreshed = signal<Date | null>(null);

  readonly columns: TableColumn<BookingListItem>[] = [
    { key: 'bookingNumber', label: 'Booking' },
    { key: 'customerName', label: 'Customer', fallback: '—' },
    { key: 'agentName', label: 'Agent', fallback: 'Unassigned' },
    { key: 'bookingDate', label: 'Date', type: 'date' },
    { key: 'startTime', label: 'Time' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'paymentStatus', label: 'Payment', type: 'badge' },
    {
      key: 'totalAmount',
      label: 'Amount',
      type: 'currency',
      align: 'right',
    },
  ];

  readonly actions: TableAction<BookingListItem>[] = [
    { id: 'view', label: 'Open', icon: 'visibility' },
    {
      id: 'assign',
      label: 'Assign agent',
      icon: 'person_add',
      hidden: (row) => !!row.agentId || row.status !== 'paid',
    },
    {
      id: 'reassign',
      label: 'Reassign',
      icon: 'swap_horiz',
      hidden: (row) => !row.agentId,
    },
  ];

  constructor() {
    interval(ENVIRONMENT.livePollIntervalMs)
      .pipe(
        startWith(0),
        switchMap(() => this.fetchLive()),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (rows) => {
          this.rows.set(rows);
          this.lastRefreshed.set(new Date());
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  refresh() {
    this.loading.set(true);
    this.fetchLive().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.lastRefreshed.set(new Date());
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onRowClick(row: unknown) {
    const booking = row as BookingListItem;
    void this.router.navigate(['/bookings', booking.id]);
  }

  onAction(event: TableActionEvent) {
    const row = event.row as BookingListItem;

    switch (event.id) {
      case 'view':
        void this.router.navigate(['/bookings', row.id]);
        break;
      case 'assign':
        this.openAssign(row, false);
        break;
      case 'reassign':
        this.openAssign(row, true);
        break;
    }
  }

  private fetchLive() {
    this.loading.set(true);
    return forkJoin(
      LIVE_BOOKING_STATUSES.map((status) =>
        this.bookingsService.list({ status, page: 1, limit: 100 }),
      ),
    ).pipe(
      map((pages) =>
        pages
          .flatMap((page) => page?.items ?? [])
          .sort((a, b) => {
            const dateCmp = String(b.bookingDate).localeCompare(
              String(a.bookingDate),
            );
            if (dateCmp !== 0) return dateCmp;
            return String(b.startTime).localeCompare(String(a.startTime));
          }),
      ),
    );
  }

  private openAssign(row: BookingListItem, reassign: boolean) {
    const data: AssignAgentDialogData = {
      bookingId: row.id,
      bookingNumber: row.bookingNumber,
      reassign,
      currentAgentName: row.agentName,
    };

    this.dialog
      .open(AssignAgentDialog, { data, width: '480px' })
      .afterClosed()
      .subscribe((result: AssignAgentDialogResult | undefined) => {
        if (result?.assigned) this.refresh();
      });
  }
}
