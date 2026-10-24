import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, formatDate } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { SessionStore } from '@core/auth/session.store';
import {
  LiveAgent,
  LiveJob,
  MONITOR_STEPS,
  MonitorSeverity,
  MonitorStep,
  STEP_META,
} from '@core/models';
import { BookingMonitorService } from '@core/services/booking-monitor.service';
import {
  AssignAgentDialog,
  AssignAgentDialogData,
  AssignAgentDialogResult,
} from '../assign-agent/assign-agent';
import { openNudgeDialog } from './nudge-dialog/nudge-dialog';
import { openRulesDialog } from './rules-dialog/rules-dialog';

type AgentFilter = 'active' | 'all';

/**
 * Every live job, timed against its next step: waiting for an agent, agent
 * not on the way, on the way but not started, in progress past its time.
 * Green → orange → red as each step's timer runs, recoloured every second.
 */
@Component({
  selector: 'app-booking-monitor',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './booking-monitor.html',
  styleUrl: './booking-monitor.scss',
})
export class BookingMonitor {
  private readonly monitor = inject(BookingMonitorService);
  private readonly dialog = inject(MatDialog);
  private readonly session = inject(SessionStore);

  readonly steps = MONITOR_STEPS;
  readonly meta = STEP_META;
  readonly duration = formatDuration;

  readonly board = this.monitor.board;
  readonly loading = this.monitor.loading;
  readonly failed = this.monitor.failed;
  readonly lastUpdated = this.monitor.lastUpdated;
  readonly soundOn = this.monitor.soundOn;
  readonly counts = this.monitor.counts;
  readonly rules = this.monitor.rules;
  readonly now = this.monitor.now;
  readonly isSuperAdmin = computed(() => this.session.role() === 'SUPER_ADMIN');

  readonly stepFilter = signal<MonitorStep | null>(null);
  readonly severityFilter = signal<MonitorSeverity | null>(null);
  readonly search = signal('');
  readonly agentFilter = signal<AgentFilter>('active');

  readonly visibleJobs = computed(() => {
    const step = this.stepFilter();
    const severity = this.severityFilter();
    const term = this.search().trim().toLowerCase();
    return this.monitor.jobs().filter(
      (job) =>
        (!step || job.step === step) &&
        (!severity || job.live.severity === severity) &&
        (!term ||
          [job.bookingNumber, job.customer.name, job.agent?.name, job.area?.name, job.service]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(term))),
    );
  });

  readonly stepCounts = computed(() => {
    const counts = new Map<MonitorStep, { total: number; alerts: number }>();
    for (const step of MONITOR_STEPS) counts.set(step, { total: 0, alerts: 0 });
    for (const job of this.monitor.jobs()) {
      const count = counts.get(job.step)!;
      count.total += 1;
      if (job.live.severity !== 'ok') count.alerts += 1;
    }
    return counts;
  });

  readonly visibleAgents = computed(() =>
    this.agentFilter() === 'all'
      ? this.monitor.agents()
      : this.monitor.agents().filter((agent) => agent.live.severity !== 'idle'),
  );

  /** One line for the worst thing on the board right now, if any. */
  readonly banner = computed(() => {
    if (!this.board()) return null;
    const waiting = this.monitor.jobs().filter((job) => job.step === 'WAITING_FOR_AGENT' && job.live.running);
    if (waiting.length && this.counts().online === 0) {
      return `No agents are online right now: ${waiting.length} paid ${waiting.length === 1 ? 'job is' : 'jobs are'} waiting for someone to pick ${waiting.length === 1 ? 'it' : 'them'} up.`;
    }
    return null;
  });

  readonly updatedAgo = computed(() => {
    const at = this.lastUpdated();
    if (!at) return null;
    const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
    // Re-read every tick so the text keeps moving.
    this.now();
    if (seconds < 5) return 'just now';
    return seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)} min ago`;
  });

  refresh() {
    this.monitor.refresh();
  }

  toggleSound() {
    this.monitor.toggleSound();
  }

  toggleSeverity(severity: MonitorSeverity) {
    this.severityFilter.update((current) => (current === severity ? null : severity));
  }

  editRules() {
    const rules = this.rules();
    if (rules) openRulesDialog(this.dialog, rules).subscribe();
  }

  // ------------------------------------------------------------ job text

  clockLabel(job: LiveJob) {
    return job.live.running ? this.meta[job.step].running : this.meta[job.step].upcoming;
  }

  /** Share of the way from the timer starting to red, for the bar under the timer. */
  progress(job: LiveJob) {
    if (!job.live.running) return 0;
    const start = Date.parse(job.clockStartsAt);
    const span = Date.parse(job.redAt) - start;
    if (span <= 0) return 100;
    return Math.min(100, Math.max(0, ((this.now() - start) / span) * 100));
  }

  /** Where orange sits on that bar. */
  orangeMark(job: LiveJob) {
    const start = Date.parse(job.clockStartsAt);
    const span = Date.parse(job.redAt) - start;
    if (span <= 0) return 0;
    return ((Date.parse(job.orangeAt) - start) / span) * 100;
  }

  thresholdText(job: LiveJob) {
    if (!job.live.running) return null;
    if (job.live.severity === 'ok') return { label: 'Orange at', at: job.orangeAt };
    if (Date.parse(job.redAt) > this.now()) return { label: 'Red at', at: job.redAt };
    return { label: 'Red since', at: job.redAt };
  }

  /** "in 4 min", "now", "2 min ago". */
  relative(at: string) {
    const minutes = Math.round((Date.parse(at) - this.now()) / 60_000);
    if (minutes === 0) return 'now';
    // Past due: the next dispatch tick hasn't run yet (it runs every few minutes).
    return minutes > 0 ? `in ${minutes} min` : `due ${-minutes} min ago`;
  }

  kind(job: LiveJob) {
    if (job.mode === 'INSTANT') return 'Right now';
    return job.plan ? 'Plan visit' : 'Scheduled';
  }

  canAssign(job: LiveJob) {
    return job.step === 'WAITING_FOR_AGENT' && !job.agent;
  }

  canReassign(job: LiveJob) {
    return !!job.agent && (job.step === 'NOT_SET_OFF' || job.step === 'ON_THE_WAY');
  }

  // ------------------------------------------------------------- actions

  assign(job: LiveJob, reassign: boolean) {
    const data: AssignAgentDialogData = {
      bookingId: job.id,
      bookingNumber: job.bookingNumber,
      reassign,
      currentAgentName: job.agent?.name ?? null,
    };
    this.dialog
      .open(AssignAgentDialog, { data, width: '480px' })
      .afterClosed()
      .subscribe((result: AssignAgentDialogResult | undefined) => {
        if (result?.assigned) this.monitor.refresh();
      });
  }

  nudgeForJob(job: LiveJob) {
    if (!job.agent) return;
    const time = clockText(job.slot);
    const notice =
      job.step === 'NOT_SET_OFF'
        ? {
            title: 'Time to head out',
            message: `Booking ${job.bookingNumber} starts at ${time}. Tap "I'm on my way" in the app as soon as you leave.`,
          }
        : job.step === 'ON_THE_WAY'
          ? {
              title: 'The customer is waiting',
              message: `Booking ${job.bookingNumber} was due to start at ${time}. Please reach the customer and start the job, or call support if you're stuck.`,
            }
          : {
              title: 'Please complete the job',
              message: `Booking ${job.bookingNumber} has run past its booked time. Mark it complete in the app when you finish.`,
            };
    openNudgeDialog(this.dialog, {
      agentId: job.agent.id,
      agentName: job.agent.name,
      bookingId: job.id,
      ...notice,
    }).subscribe();
  }

  nudgeAgent(agent: LiveAgent) {
    const next = agent.nextJob;
    const time = next ? clockText(next.slot) : null;
    openNudgeDialog(this.dialog, {
      agentId: agent.id,
      agentName: agent.name,
      bookingId: next?.bookingId,
      title: 'Please go online',
      message: next
        ? `You have booking ${next.bookingNumber} at ${time} today. Open the app and go online.`
        : 'Open the app and go online so you can get jobs.',
    }).subscribe();
  }

  // -------------------------------------------------------------- agents

  agentLine(agent: LiveAgent) {
    if (agent.currentJob) {
      return `${agent.currentJob.step === 'IN_PROGRESS' ? 'Working on' : 'On the way to'} ${agent.currentJob.bookingNumber}`;
    }
    if (agent.nextJob) {
      return `Next: ${agent.nextJob.bookingNumber} at ${clockText(agent.nextJob.slot)}`;
    }
    return agent.presence === 'online' ? 'Free' : agent.presenceLabel;
  }

  presenceText(presence: string) {
    return presence === 'online' ? 'Online' : presence === 'off_hours' ? 'Outside hours' : 'Offline';
  }

  lastSeen(at: string | null) {
    if (!at) return 'No location yet';
    const minutes = Math.max(0, Math.round((this.now() - Date.parse(at)) / 60_000));
    if (minutes < 1) return 'Location just now';
    if (minutes < 60) return `Location ${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return hours < 24 ? `Location ${hours} h ago` : 'Location over a day old';
  }
}

/** "1:13 PM", the way the backend writes times in agent messages. */
function clockText(iso: string) {
  return formatDate(iso, 'h:mm a', 'en-US');
}

/** 4:05 under an hour, 1h 05m beyond. */
export function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours
    ? `${hours}h ${String(minutes).padStart(2, '0')}m`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}
