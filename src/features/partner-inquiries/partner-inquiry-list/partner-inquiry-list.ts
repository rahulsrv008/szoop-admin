import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { DataTable } from '@shared/components/data-table/data-table';
import { TableColumn, TablePageEvent } from '@shared/models/table.model';
import { PartnerInquiryListItem } from '../partner-inquiries.model';
import { PartnerInquiriesService } from '../partner-inquiries.service';

@Component({
  selector: 'app-partner-inquiry-list',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, DataTable],
  templateUrl: './partner-inquiry-list.html',
  styleUrl: './partner-inquiry-list.scss',
})
export class PartnerInquiryList {
  private readonly inquiriesService = inject(PartnerInquiriesService);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly rows = signal<PartnerInquiryListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly columns: TableColumn<PartnerInquiryListItem>[] = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email', fallback: '—' },
    { key: 'city', label: 'City / area' },
    { key: 'partnerType', label: 'Partnership interest' },
    { key: 'note', label: 'Experience', fallback: '—' },
    { key: 'createdAt', label: 'Submitted', type: 'datetime' },
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
    this.error.set('');
    this.inquiriesService
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
      })
      .subscribe({
        next: (result) => {
          this.rows.set(result.items);
          this.total.set(result.meta.total);
          this.loading.set(false);
        },
        error: (cause: unknown) => {
          this.rows.set([]);
          this.total.set(0);
          this.error.set(this.errorMessage(cause));
          this.loading.set(false);
        },
      });
  }

  onPageChange(event: TablePageEvent) {
    this.page.set(event.page);
    this.limit.set(event.limit);
    this.load();
  }

  private errorMessage(cause: unknown) {
    if (!(cause instanceof HttpErrorResponse)) {
      return 'Could not load partner inquiries. Please try again.';
    }

    const body = cause.error as { message?: string | string[] } | null;
    const detail = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    return `Could not load partner inquiries. ${detail || `Request failed (${cause.status}).`}`;
  }
}
