import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import {
  DEFAULT_PAGE_SIZE,
  INCENTIVE_STATUSES,
  MONTHS,
} from '@config/constants';
import { IncentiveRow } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { SelectOption, toOptions } from '@shared/models/filter.model';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
} from '@shared/models/table.model';
import { EarningsService } from '../earnings.service';

@Component({
  selector: 'app-incentives',
  imports: [
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    DataTable,
  ],
  templateUrl: './incentives.html',
  styleUrl: './incentives.scss',
})
export class Incentives {
  private readonly earnings = inject(EarningsService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(false);
  readonly rows = signal<IncentiveRow[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly agentId = signal('');
  readonly status = signal('');
  readonly month = signal(new Date().getMonth() + 1);
  readonly year = signal(new Date().getFullYear());

  readonly agentOptions = signal<SelectOption[]>([
    { value: '', label: 'All agents' },
  ]);

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All statuses' },
    ...toOptions(INCENTIVE_STATUSES),
  ];

  readonly monthOptions: SelectOption[] = MONTHS.map((label, index) => ({
    value: index + 1,
    label,
  }));

  readonly yearOptions: SelectOption[] = Array.from({ length: 6 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: y, label: String(y) };
  });

  readonly columns: TableColumn<IncentiveRow>[] = [
    { key: 'agentName', label: 'Agent', fallback: '—' },
    {
      key: 'period',
      label: 'Period',
      value: (row) => `${MONTHS[row.month - 1] ?? row.month} ${row.year}`,
    },
    {
      key: 'revenueGenerated',
      label: 'Revenue',
      type: 'currency',
      align: 'right',
    },
    {
      key: 'thresholdAmount',
      label: 'Threshold',
      type: 'currency',
      align: 'right',
    },
    {
      key: 'incentiveAmount',
      label: 'Incentive',
      type: 'currency',
      align: 'right',
    },
    { key: 'status', label: 'Status', type: 'badge' },
  ];

  readonly actions: TableAction<IncentiveRow>[] = [
    {
      id: 'approve',
      label: 'Approve',
      icon: 'check_circle',
      hidden: (row) => row.status !== 'PENDING',
    },
    {
      id: 'paid',
      label: 'Mark paid',
      icon: 'payments',
      hidden: (row) => row.status !== 'APPROVED',
    },
    {
      id: 'reject',
      label: 'Reject',
      icon: 'cancel',
      color: 'warn',
      hidden: (row) => row.status === 'PAID' || row.status === 'REJECTED',
    },
  ];

  constructor() {
    this.loadAgents();
    this.load();
  }

  load() {
    this.loading.set(true);
    this.earnings
      .incentives({
        page: this.page(),
        limit: this.limit(),
        agentId: this.agentId() || undefined,
        month: this.month(),
        year: this.year(),
        status: this.status() || undefined,
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

  onAgentChange(agentId: string) {
    this.agentId.set(agentId);
    this.page.set(1);
    this.load();
  }

  onStatusChange(status: string) {
    this.status.set(status);
    this.page.set(1);
    this.load();
  }

  onMonthChange(month: number) {
    this.month.set(month);
    this.page.set(1);
    this.load();
  }

  onYearChange(year: number) {
    this.year.set(year);
    this.page.set(1);
    this.load();
  }

  onPageChange(event: TablePageEvent) {
    this.page.set(event.page);
    this.limit.set(event.limit);
    this.load();
  }

  generate() {
    const month = this.month();
    const year = this.year();
    this.confirm
      .ask({
        title: 'Generate incentives',
        message: `Recalculate incentives for ${MONTHS[month - 1]} ${year}? Existing rows for this month will be refreshed.`,
        confirmLabel: 'Generate',
      })
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.earnings.generateIncentives({ month, year }).subscribe({
          next: (summary) => {
            this.notifications.success(
              `Incentives generated: ${summary.generated} new, ${summary.updated} updated`,
            );
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  onAction(event: TableActionEvent) {
    const row = event.row as IncentiveRow;
    if (event.id === 'approve') this.updateStatus(row, 'APPROVED');
    if (event.id === 'paid') this.updateStatus(row, 'PAID');
    if (event.id === 'reject') this.reject(row);
  }

  private updateStatus(
    row: IncentiveRow,
    status: 'APPROVED' | 'PAID' | 'REJECTED',
    remarks?: string,
  ) {
    this.loading.set(true);
    this.earnings.updateIncentive(row.id, { status, remarks }).subscribe({
      next: () => {
        this.notifications.success(`Incentive marked ${status.toLowerCase()}`);
        this.load();
      },
      error: () => this.loading.set(false),
    });
  }

  private reject(row: IncentiveRow) {
    this.confirm
      .askDanger('Reject incentive', `Reject incentive for ${row.agentName ?? 'this agent'}?`, {
        confirmLabel: 'Reject',
        requireReason: true,
        reasonLabel: 'Reason',
      })
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.updateStatus(row, 'REJECTED', result.reason);
      });
  }

  private loadAgents() {
    this.earnings.agents().subscribe({
      next: (result) => {
        this.agentOptions.set([
          { value: '', label: 'All agents' },
          ...(result?.items ?? []).map((item) => ({
            value: item.agentId,
            label: item.name ?? item.mobile,
          })),
        ]);
      },
    });
  }
}
