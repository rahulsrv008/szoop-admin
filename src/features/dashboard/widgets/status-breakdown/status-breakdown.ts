import { Component, computed, input } from '@angular/core';
import { StatusBadge } from '@shared/components/status-badge/status-badge';

interface Slice {
  status: string;
  count: number;
  percent: number;
}

/** Horizontal bar list, e.g. bookings grouped by status. */
@Component({
  selector: 'app-status-breakdown',
  imports: [StatusBadge],
  templateUrl: './status-breakdown.html',
  styleUrl: './status-breakdown.scss',
})
export class StatusBreakdown {
  readonly title = input('Breakdown');
  readonly data = input<Record<string, number> | null | undefined>({});
  readonly emptyMessage = input('Nothing to show yet');

  readonly slices = computed<Slice[]>(() => {
    const entries = Object.entries(this.data() ?? {});
    const total = entries.reduce((sum, [, count]) => sum + Number(count || 0), 0);
    return entries
      .map(([status, count]) => ({
        status,
        count: Number(count || 0),
        percent: total ? Math.round((Number(count || 0) / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  });

  readonly total = computed(() =>
    this.slices().reduce((sum, slice) => sum + slice.count, 0),
  );
}
