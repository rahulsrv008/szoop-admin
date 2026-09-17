import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { RatingRow, RatingSummary } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange, SelectOption } from '@shared/models/filter.model';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
} from '@shared/models/table.model';
import { RatingViewDialog } from '../rating-view-dialog/rating-view-dialog';
import { RatingsService } from '../ratings.service';

interface BreakdownSlice {
  star: string;
  count: number;
  percent: number;
}

@Component({
  selector: 'app-rating-list',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    DataTable,
    DateFilter,
  ],
  templateUrl: './rating-list.html',
  styleUrl: './rating-list.scss',
})
export class RatingList {
  private readonly ratingsService = inject(RatingsService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly rows = signal<RatingRow[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly minRating = signal<number | undefined>(undefined);
  readonly range = signal<DateRange>({});
  readonly summary = signal<RatingSummary>({ average: 0, count: 0, breakdown: {} });

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly minRatingOptions: SelectOption[] = [
    { value: '', label: 'All ratings' },
    { value: 5, label: '5 stars' },
    { value: 4, label: '4+ stars' },
    { value: 3, label: '3+ stars' },
    { value: 2, label: '2+ stars' },
    { value: 1, label: '1+ stars' },
  ];

  readonly columns: TableColumn<RatingRow>[] = [
    {
      key: 'rating',
      label: 'Stars',
      type: 'number',
      align: 'center',
      value: (row) => Number(row.rating),
    },
    { key: 'bookingNumber', label: 'Booking', fallback: '—' },
    { key: 'customerName', label: 'Customer', fallback: '—' },
    { key: 'agentName', label: 'Agent', fallback: '—' },
    {
      key: 'reviewText',
      label: 'Review',
      fallback: '—',
      value: (row) =>
        row.reviewText && row.reviewText.length > 80
          ? `${row.reviewText.slice(0, 80)}…`
          : row.reviewText,
    },
    { key: 'createdAt', label: 'Submitted', type: 'datetime' },
  ];

  readonly actions: TableAction<RatingRow>[] = [
    { id: 'view', label: 'View', icon: 'visibility' },
    { id: 'delete', label: 'Delete', icon: 'delete', color: 'warn' },
  ];

  readonly breakdown = computed<BreakdownSlice[]>(() => {
    const data = this.summary().breakdown ?? {};
    const total = Object.values(data).reduce((sum, count) => sum + Number(count || 0), 0);
    return [5, 4, 3, 2, 1].map((star) => {
      const count = Number(data[String(star)] ?? 0);
      return {
        star: String(star),
        count,
        percent: total ? Math.round((count / total) * 100) : 0,
      };
    });
  });

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
    this.ratingsService
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
        minRating: this.minRating(),
        from: this.range().from ?? undefined,
        to: this.range().to ?? undefined,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result?.items ?? []);
          this.total.set(result?.meta?.total ?? 0);
          this.summary.set(
            result?.summary ?? { average: 0, count: 0, breakdown: {} },
          );
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onMinRatingChange(value: string | number) {
    this.minRating.set(value === '' || value === null ? undefined : Number(value));
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
    const row = event.row as RatingRow;
    if (event.id === 'view') this.openDetail(row);
    if (event.id === 'delete') this.remove(row);
  }

  private openDetail(row: RatingRow) {
    this.loading.set(true);
    this.ratingsService.detail(row.id).subscribe({
      next: (detail) => {
        this.loading.set(false);
        this.dialog.open(RatingViewDialog, {
          data: detail,
          width: '560px',
        });
      },
      error: () => this.loading.set(false),
    });
  }

  private remove(row: RatingRow) {
    this.confirm
      .askDanger(
        'Delete rating',
        `Remove the ${row.rating}-star rating for booking ${row.bookingNumber ?? row.bookingId}? This also deletes its review text.`,
        { confirmLabel: 'Delete rating' },
      )
      .subscribe((result) => {
        if (!result.confirmed) return;

        this.loading.set(true);
        this.ratingsService.remove(row.id).subscribe({
          next: () => {
            this.notifications.success('Rating deleted');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }
}
