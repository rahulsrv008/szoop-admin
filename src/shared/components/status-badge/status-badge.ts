import { Component, computed, input } from '@angular/core';
import { BOOKING_STATUS_LABELS } from '@config/constants';
import { humanize } from '@shared/models/filter.model';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'progress';

/** Maps every backend status string onto a colour tone. */
const TONES: Record<string, Tone> = {
  // bookings
  finding: 'warning',
  paid: 'info',
  accepted: 'info',
  arriving: 'progress',
  ongoing: 'progress',
  completed: 'success',
  cancelled: 'danger',
  // payments
  PENDING: 'warning',
  PAID: 'success',
  FAILED: 'danger',
  REFUNDED: 'neutral',
  VOIDED: 'neutral',
  // agents / documents / tickets
  APPROVED: 'success',
  REJECTED: 'danger',
  SUSPENDED: 'danger',
  ACTIVE: 'success',
  VERIFIED: 'success',
  OPEN: 'warning',
  IN_PROGRESS: 'progress',
  RESOLVED: 'success',
  CLOSED: 'neutral',
  HIGH: 'danger',
  NORMAL: 'info',
  LOW: 'neutral',
};

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
})
export class StatusBadge {
  readonly status = input<string | null | undefined>('');
  /** Overrides the default humanised label. */
  readonly label = input<string | null>(null);

  readonly text = computed(() => {
    const status = this.status();
    if (!status) return '—';
    return this.label() ?? BOOKING_STATUS_LABELS[status] ?? humanize(status);
  });

  readonly tone = computed<Tone>(() => {
    const status = this.status();
    return (status && TONES[status]) || 'neutral';
  });
}
