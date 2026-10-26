import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AgentReferralsView, ReferralRewardRow, ReferralTeamMember } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { ReferralsService } from '@core/services/referrals.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { InrPipe } from '@shared/pipes/inr.pipe';

type HistoryFilter = 'ALL' | 'PAID' | 'PENDING' | 'MISSED' | 'REVERSED';

const monthLabel = (month: number, year: number) =>
  new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });

/**
 * The Referrals section of an agent's page: their code, what they earned at
 * each level, every reward with the reason it was missed or cut, and their team.
 */
@Component({
  selector: 'app-agent-referrals',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    StatusBadge,
    InrPipe,
  ],
  templateUrl: './agent-referrals.html',
  styleUrl: './agent-referrals.scss',
})
export class AgentReferrals {
  private readonly referrals = inject(ReferralsService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);

  readonly agentId = input.required<string>();

  readonly loading = signal(false);
  readonly view = signal<AgentReferralsView | null>(null);
  readonly filter = signal<HistoryFilter>('ALL');
  readonly showTeam = signal(false);

  readonly filters: { id: HistoryFilter; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'PAID', label: 'Paid' },
    { id: 'PENDING', label: 'Next salary' },
    { id: 'MISSED', label: 'Missed' },
    { id: 'REVERSED', label: 'Reversed' },
  ];

  readonly history = computed(() => {
    const rows = this.view()?.history ?? [];
    const filter = this.filter();
    return filter === 'ALL' ? rows : rows.filter((row) => row.status === filter);
  });

  readonly teamSize = computed(() => {
    const count = (members: ReferralTeamMember[]): number =>
      members.reduce((sum, member) => sum + 1 + count(member.team), 0);
    return count(this.view()?.team.members ?? []);
  });

  readonly earnedPercent = computed(() => {
    const totals = this.view()?.totals;
    if (!totals?.limit) return 0;
    return Math.min(100, Math.round((totals.earned / totals.limit) * 100));
  });

  constructor() {
    effect(() => {
      if (this.agentId()) this.load();
    });
  }

  load() {
    this.loading.set(true);
    this.referrals.agentReferrals(this.agentId()).subscribe({
      next: (view) => {
        this.view.set(view);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  copyCode(code: string) {
    void navigator.clipboard?.writeText(code).then(
      () => this.notifications.success(`Copied ${code}`),
      () => this.notifications.error('Could not copy'),
    );
  }

  levelLabel(level: number) {
    if (level === 1) return 'Level 1 · invited by them';
    if (level === 2) return 'Level 2 · invited by their invitees';
    return `Level ${level}`;
  }

  typeLabel(row: ReferralRewardRow) {
    return row.type === 'DIRECT' ? 'Level 1' : `Level ${row.level}`;
  }

  /** "Next salary (Oct 2026)", "Paid (Sep 2026)", "Missed"… */
  statusLabel(row: ReferralRewardRow) {
    const salary = row.salary ? ` (${monthLabel(row.salary.month, row.salary.year)})` : '';
    switch (row.status) {
      case 'PENDING':
        return row.salary ? `In salary${salary}` : 'Next salary';
      case 'PAID':
        return `Paid${salary}`;
      case 'MISSED':
        return 'Missed';
      default:
        return 'Reversed';
    }
  }

  teamStatus(member: ReferralTeamMember, jobsToQualify: number) {
    if (member.referralStatus === 'QUALIFIED') return `Finished ${jobsToQualify} jobs`;
    if (member.referralStatus === 'REJECTED') return 'Rejected';
    return `${Math.min(member.jobsCompleted, jobsToQualify)} of ${jobsToQualify} jobs`;
  }

  reverse(row: ReferralRewardRow) {
    const paid = row.status === 'PAID';
    this.confirm
      .askDanger(
        'Reverse this reward?',
        `${row.from.name}'s ${this.typeLabel(row).toLowerCase()} reward of ₹${row.amount} will be taken back and the agent will be told why.` +
          (paid
            ? '\n\nIt was already paid, so to recover the money add it as a deduction on a later salary.'
            : '\n\nIt will be removed from their salary.'),
        {
          confirmLabel: 'Reverse reward',
          requireReason: true,
          reasonLabel: 'Reason (shown to the agent)',
        },
      )
      .subscribe((result) => {
        if (!result.confirmed || !result.reason) return;
        this.loading.set(true);
        this.referrals.reverseReward(row.id, result.reason).subscribe({
          next: (outcome) => {
            this.notifications.success(outcome.message);
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }
}
