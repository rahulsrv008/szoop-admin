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
import {
  AGENT_APPROVAL_STATUSES,
  AGENT_STATUSES,
  DEFAULT_PAGE_SIZE,
} from '@config/constants';
import { AgentListItem } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange, SelectOption, toOptions } from '@shared/models/filter.model';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
} from '@shared/models/table.model';
import { AgentsService } from '../agents.service';
import { openAgentZoneDialog } from '../agent-zone-dialog/agent-zone-dialog';

@Component({
  selector: 'app-agent-list',
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
  templateUrl: './agent-list.html',
  styleUrl: './agent-list.scss',
})
export class AgentList {
  private readonly agentsService = inject(AgentsService);
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly rows = signal<AgentListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly approvalStatus = signal('');
  readonly status = signal('');
  readonly range = signal<DateRange>({});

  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly approvalOptions: SelectOption[] = [
    { value: '', label: 'All approvals' },
    ...toOptions(AGENT_APPROVAL_STATUSES),
  ];

  readonly statusOptions: SelectOption[] = [
    { value: '', label: 'All statuses' },
    ...toOptions(AGENT_STATUSES),
  ];

  readonly columns: TableColumn<AgentListItem>[] = [
    { key: 'name', label: 'Agent', sortable: true, fallback: 'Unnamed' },
    { key: 'employeeId', label: 'Employee ID', fallback: '—' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'approvalStatus', label: 'Approval', type: 'badge' },
    { key: 'status', label: 'Status', type: 'badge' },
    {
      key: 'documentsVerified',
      label: 'Docs',
      type: 'number',
      align: 'right',
    },
    {
      key: 'averageRating',
      label: 'Rating',
      type: 'number',
      align: 'right',
    },
    {
      key: 'completedBookings',
      label: 'Jobs',
      type: 'number',
      align: 'right',
    },
    {
      key: 'homeZone',
      label: 'Home zone',
      fallback: '—',
      value: (row) => row.homeZone?.name || '—',
    },
    {
      key: 'serviceAreas',
      label: 'Service areas',
      fallback: '—',
      value: (row) =>
        (row.serviceAreas ?? [])
          .map((zone) => zone.code || zone.name)
          .join(', ') || '—',
    },
    {
      key: 'currentLocation',
      label: 'Current location',
      fallback: '—',
      value: (row) =>
        row.currentLocation
          ? `${row.currentLocation.latitude}, ${row.currentLocation.longitude}`
          : '—',
    },
    { key: 'joiningDate', label: 'Joined', type: 'date' },
  ];

  readonly actions: TableAction<AgentListItem>[] = [
    { id: 'view', label: 'Open profile', icon: 'visibility' },
    { id: 'location', label: 'Location', icon: 'my_location' },
    {
      id: 'approve',
      label: 'Approve',
      icon: 'check_circle',
      hidden: (row) => !['PENDING', 'REJECTED'].includes(row.approvalStatus),
    },
    {
      id: 'reject',
      label: 'Reject',
      icon: 'cancel',
      color: 'warn',
      hidden: (row) => row.approvalStatus !== 'PENDING',
    },
    {
      id: 'suspend',
      label: 'Suspend',
      icon: 'pause_circle',
      color: 'warn',
      hidden: (row) => row.status !== 'ACTIVE',
    },
    {
      id: 'activate',
      label: 'Activate',
      icon: 'play_circle',
      hidden: (row) => row.status !== 'SUSPENDED',
    },
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
    this.agentsService
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.search() || undefined,
        approvalStatus: this.approvalStatus() || undefined,
        status: this.status() || undefined,
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

  onApprovalChange(value: string) {
    this.approvalStatus.set(value);
    this.page.set(1);
    this.load();
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

  onRowClick(row: unknown) {
    const agent = row as AgentListItem;
    void this.router.navigate(['/agents', agent.agentId]);
  }

  onAction(event: TableActionEvent) {
    const row = event.row as AgentListItem;

    switch (event.id) {
      case 'view':
        void this.router.navigate(['/agents', row.agentId]);
        break;
      case 'location':
        void this.router.navigate(['/agents', row.agentId, 'location']);
        break;
      case 'approve':
        this.approve(row);
        break;
      case 'reject':
        this.reject(row);
        break;
      case 'suspend':
        this.suspend(row);
        break;
      case 'activate':
        this.activate(row);
        break;
    }
  }

  private approve(row: AgentListItem) {
    openAgentZoneDialog(this.dialog, {
      mode: 'approve',
      agentName: row.name ?? row.mobile,
      homeZoneId: row.homeZone?.id ?? null,
      serviceAreaIds: (row.serviceAreas ?? []).map((zone) => zone.id),
    }).subscribe((result) => {
      if (!result || !('serviceAreaIds' in result)) return;
      this.loading.set(true);
      this.agentsService
        .approve(row.agentId, {
          homeZoneId: result.homeZoneId,
          serviceAreaIds: result.serviceAreaIds,
          remarks: result.remarks,
        })
        .subscribe({
          next: () => {
            this.notifications.success('Agent approved');
            this.load();
          },
          error: () => this.loading.set(false),
        });
    });
  }

  private reject(row: AgentListItem) {
    this.confirm
      .askDanger(
        'Reject application',
        `${row.name ?? row.mobile} will be told why their onboarding was rejected.`,
        {
          confirmLabel: 'Reject',
          requireReason: true,
          reasonLabel: 'Reason (sent to the agent)',
        },
      )
      .subscribe((result) => {
        if (!result.confirmed || !result.reason) return;
        this.loading.set(true);
        this.agentsService.reject(row.agentId, result.reason).subscribe({
          next: () => {
            this.notifications.success('Application rejected');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  private suspend(row: AgentListItem) {
    this.confirm
      .askDanger(
        'Suspend agent',
        `${row.name ?? row.mobile} will be taken offline immediately.`,
        {
          confirmLabel: 'Suspend',
          requireReason: true,
          reasonLabel: 'Reason (sent to the agent)',
        },
      )
      .subscribe((result) => {
        if (!result.confirmed || !result.reason) return;
        this.loading.set(true);
        this.agentsService.suspend(row.agentId, result.reason).subscribe({
          next: () => {
            this.notifications.success('Agent suspended');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  private activate(row: AgentListItem) {
    this.confirm
      .ask({
        title: 'Activate agent',
        message: `${row.name ?? row.mobile} will be able to go online again.`,
        confirmLabel: 'Activate',
      })
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.agentsService.activate(row.agentId).subscribe({
          next: () => {
            this.notifications.success('Agent activated');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }
}
