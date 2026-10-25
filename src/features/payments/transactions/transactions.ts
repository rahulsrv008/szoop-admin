import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataTable } from '@shared/components/data-table/data-table';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { TableColumn } from '@shared/models/table.model';
import { InrPipe } from '@shared/pipes/inr.pipe';
import { PaymentMethodPipe } from '@shared/pipes/payment-method.pipe';
import {
  PaymentDetailView,
  PaymentTransactionRow,
} from '../payments.model';
import { PaymentsService } from '../payments.service';

@Component({
  selector: 'app-transactions',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatExpansionModule,
    DatePipe,
    InrPipe,
    PaymentMethodPipe,
    StatusBadge,
    DataTable,
  ],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class Transactions {
  private readonly payments = inject(PaymentsService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly notFound = signal(false);
  readonly payment = signal<PaymentDetailView | null>(null);

  readonly txnColumns: TableColumn<PaymentTransactionRow>[] = [
    { key: 'gatewayName', label: 'Gateway', fallback: '—' },
    { key: 'gatewayTransactionId', label: 'Txn id', fallback: '—' },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'createdAt', label: 'Created', type: 'datetime' },
  ];

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
    else this.notFound.set(true);
  }

  pretty(value: unknown) {
    try {
      return JSON.stringify(value ?? null, null, 2);
    } catch {
      return String(value);
    }
  }

  private load(id: string) {
    this.loading.set(true);
    this.payments.detail(id).subscribe({
      next: (detail) => {
        this.payment.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }
}
