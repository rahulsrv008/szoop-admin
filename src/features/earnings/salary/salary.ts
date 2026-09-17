import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { DEFAULT_PAGE_SIZE, MONTHS } from '@config/constants';
import { SalaryRow } from '@core/models';
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
import { SalaryDialog } from '../salary-dialog/salary-dialog';
import { EarningsService } from '../earnings.service';

const SALARY_STATUSES = ['PENDING', 'APPROVED', 'PAID', 'REJECTED'] as const;

@Component({
  selector: 'app-salary',
  imports: [
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    DataTable,
  ],
  templateUrl: './salary.html',
  styleUrl: './salary.scss',
})
export class Salary {
  private readonly earnings = inject(EarningsService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly rows = signal<SalaryRow[]>([]);
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
    ...toOptions(SALARY_STATUSES),
  ];

  readonly monthOptions: SelectOption[] = MONTHS.map((label, index) => ({
    value: index + 1,
    label,
  }));

  readonly yearOptions: SelectOption[] = Array.from({ length: 6 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { value: y, label: String(y) };
  });

  readonly columns: TableColumn<SalaryRow>[] = [
    { key: 'agentName', label: 'Agent', fallback: '—' },
    {
      key: 'period',
      label: 'Period',
      value: (row) => `${MONTHS[row.month - 1] ?? row.month} ${row.year}`,
    },
    {
      key: 'fixedSalary',
      label: 'Fixed',
      type: 'currency',
      align: 'right',
    },
    {
      key: 'incentive',
      label: 'Incentive',
      type: 'currency',
      align: 'right',
    },
    {
      key: 'deductions',
      label: 'Deductions',
      type: 'currency',
      align: 'right',
    },
    {
      key: 'netSalary',
      label: 'Net',
      type: 'currency',
      align: 'right',
    },
    { key: 'status', label: 'Status', type: 'badge' },
  ];

  readonly actions: TableAction<SalaryRow>[] = [
    { id: 'edit', label: 'Edit', icon: 'edit' },
  ];

  constructor() {
    this.loadAgents();
    this.load();
  }

  load() {
    this.loading.set(true);
    this.earnings
      .salary({
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
        title: 'Generate salary',
        message: `Generate salary records for ${MONTHS[month - 1]} ${year}?`,
        confirmLabel: 'Generate',
      })
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.earnings.generateSalary({ month, year }).subscribe({
          next: (summary) => {
            this.notifications.success(
              `Salary generated: ${summary.generated} new, ${summary.updated} updated`,
            );
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  onAction(event: TableActionEvent) {
    const row = event.row as SalaryRow;
    if (event.id === 'edit') this.openEdit(row);
  }

  private openEdit(row: SalaryRow) {
    this.dialog
      .open(SalaryDialog, { width: '440px', data: { row } })
      .afterClosed()
      .subscribe((payload) => {
        if (!payload) return;
        this.loading.set(true);
        this.earnings.updateSalary(row.id, payload).subscribe({
          next: (updated) => {
            this.notifications.success(
              `Salary updated · net ${updated.netSalary}`,
            );
            this.load();
          },
          error: () => this.loading.set(false),
        });
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
