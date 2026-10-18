import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { DEFAULT_PAGE_SIZE } from '@config/constants';
import { DataTable } from '@shared/components/data-table/data-table';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange } from '@shared/models/filter.model';
import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TablePageEvent,
} from '@shared/models/table.model';
import {
  MISSED_JOB_HELP,
  MissedJobAgentRow,
  MissedJobAgentsResponse,
  MissedJobReason,
  MissedJobRow,
} from '../missed-jobs.model';
import { MissedJobsService } from '../missed-jobs.service';
import { openWarnDialog } from '../warn-dialog/warn-dialog';

const REASONS: MissedJobReason[] = [
  'NO_ON_THE_WAY',
  'NOT_MOVING',
  'CUSTOMER_REPLACED',
  'NOT_STARTED',
  'PLAN_VISIT_MISSED',
];

/**
 * Agents who accepted a job and didn't do it, from the backend's no-show
 * rules: who, how often, which bookings, and whether they've been warned.
 */
@Component({
  selector: 'app-missed-jobs-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    DataTable,
    DateFilter,
  ],
  templateUrl: './missed-jobs-page.html',
  styleUrl: './missed-jobs-page.scss',
})
export class MissedJobsPage {
  private readonly missedJobs = inject(MissedJobsService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly range = signal<DateRange>({});
  readonly search = signal('');
  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly summary = signal<MissedJobAgentsResponse | null>(null);
  readonly agentsLoading = signal(false);
  readonly agents = computed(() => this.summary()?.items ?? []);

  /** Bookings below are for this agent when one is picked, else everyone's. */
  readonly selectedAgent = signal<MissedJobAgentRow | null>(null);
  readonly reason = signal<MissedJobReason | ''>('');
  readonly jobs = signal<MissedJobRow[]>([]);
  readonly jobsLoading = signal(false);
  readonly jobsTotal = signal(0);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);

  readonly help = REASONS.map((reason) => ({ reason, text: MISSED_JOB_HELP[reason] }));
  readonly reasonLabel = (reason: MissedJobReason) => this.summary()?.labels?.[reason] ?? reason;

  readonly agentColumns: TableColumn<MissedJobAgentRow>[] = [
    { key: 'agentName', label: 'Agent', fallback: '—' },
    { key: 'agentMobile', label: 'Mobile', fallback: '—' },
    { key: 'missed', label: 'Missed', type: 'number', align: 'right' },
    ...REASONS.map(
      (reason): TableColumn<MissedJobAgentRow> => ({
        key: `byReason.${reason}`,
        label: MISSED_JOB_SHORT[reason],
        type: 'number',
        align: 'right',
        value: (row) => row.byReason?.[reason] ?? 0,
      }),
    ),
    { key: 'notWarned', label: 'Not warned', type: 'number', align: 'right' },
    { key: 'lastMissedAt', label: 'Last missed', type: 'datetime' },
    { key: 'lastWarnedAt', label: 'Last warned', type: 'datetime', fallback: 'Never' },
    { key: 'agentStatus', label: 'Account', type: 'badge' },
  ];

  readonly agentActions: TableAction<MissedJobAgentRow>[] = [
    { id: 'bookings', label: 'See their missed bookings', icon: 'list_alt' },
    { id: 'warn', label: 'Send warning', icon: 'report', color: 'warn' },
    { id: 'agent', label: 'Open agent', icon: 'person' },
  ];

  readonly jobColumns: TableColumn<MissedJobRow>[] = [
    { key: 'slot', label: 'Job time', type: 'datetime' },
    { key: 'agentName', label: 'Agent', fallback: '—' },
    { key: 'bookingNumber', label: 'Booking', fallback: '—' },
    {
      key: 'service',
      label: 'Service',
      fallback: '—',
      value: (row) =>
        [row.service, row.bookingMode === 'INSTANT' ? '(Right now)' : null].filter(Boolean).join(' ') || '—',
    },
    { key: 'customerName', label: 'Customer', fallback: '—' },
    { key: 'reasonLabel', label: 'What happened' },
    { key: 'bookingStatus', label: 'Booking now', type: 'badge' },
    { key: 'warnedAt', label: 'Warned', type: 'datetime', fallback: 'Not yet' },
    { key: 'details', label: 'Details', fallback: '—' },
  ];

  readonly jobActions: TableAction<MissedJobRow>[] = [
    { id: 'booking', label: 'Open booking', icon: 'event_note' },
    { id: 'warn', label: 'Send warning to this agent', icon: 'report', color: 'warn' },
  ];

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        this.search.set(value.trim());
        this.loadAgents();
      });
  }

  onRangeChange(range: DateRange) {
    this.range.set(range);
    this.page.set(1);
    this.loadAgents();
    this.loadJobs();
  }

  onReasonChange(reason: MissedJobReason | '') {
    this.reason.set(reason);
    this.page.set(1);
    this.loadJobs();
  }

  onJobsPage(event: TablePageEvent) {
    this.page.set(event.page);
    this.limit.set(event.limit);
    this.loadJobs();
  }

  selectAgent(row: MissedJobAgentRow | null) {
    this.selectedAgent.set(row);
    this.page.set(1);
    this.loadJobs();
  }

  onAgentRowClick(row: unknown) {
    this.selectAgent(row as MissedJobAgentRow);
  }

  onAgentAction(event: TableActionEvent) {
    const row = event.row as MissedJobAgentRow;
    if (event.id === 'bookings') this.selectAgent(row);
    if (event.id === 'warn') this.warn(row.agentId, row.agentName);
    if (event.id === 'agent') void this.router.navigate(['/agents', row.agentId]);
  }

  onJobAction(event: TableActionEvent) {
    const row = event.row as MissedJobRow;
    if (event.id === 'booking') void this.router.navigate(['/bookings', row.bookingId]);
    if (event.id === 'warn') this.warn(row.agentId, row.agentName);
  }

  private warn(agentId: string, agentName: string) {
    openWarnDialog(this.dialog, { agentId, agentName }).subscribe((result) => {
      if (!result) return;
      this.loadAgents();
      this.loadJobs();
    });
  }

  private loadAgents() {
    this.agentsLoading.set(true);
    this.missedJobs
      .agents({
        from: this.range().from ?? undefined,
        to: this.range().to ?? undefined,
        search: this.search() || undefined,
      })
      .subscribe({
        next: (result) => {
          this.summary.set(result);
          // Keep the picked agent's row in step (counts change after a warning).
          const picked = this.selectedAgent();
          if (picked) {
            this.selectedAgent.set(result.items.find((item) => item.agentId === picked.agentId) ?? picked);
          }
          this.agentsLoading.set(false);
        },
        error: () => this.agentsLoading.set(false),
      });
  }

  private loadJobs() {
    this.jobsLoading.set(true);
    this.missedJobs
      .list({
        page: this.page(),
        limit: this.limit(),
        from: this.range().from ?? undefined,
        to: this.range().to ?? undefined,
        agentId: this.selectedAgent()?.agentId,
        reason: this.reason() || undefined,
      })
      .subscribe({
        next: (result) => {
          this.jobs.set(result.items ?? []);
          this.jobsTotal.set(result.meta?.total ?? 0);
          this.jobsLoading.set(false);
        },
        error: () => this.jobsLoading.set(false),
      });
  }
}

/** Short column headings for the per-agent table. */
const MISSED_JOB_SHORT: Record<MissedJobReason, string> = {
  NO_ON_THE_WAY: "Didn't set off",
  NOT_MOVING: 'Not moving',
  CUSTOMER_REPLACED: 'Replaced',
  NOT_STARTED: 'Never started',
  PLAN_VISIT_MISSED: 'Plan visits',
};
