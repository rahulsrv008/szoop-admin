import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DashboardSummary, DashboardTeamRow } from '@core/models';
import { InrPipe } from '@shared/pipes/inr.pipe';
import { DateFilter } from '@shared/components/date-filter/date-filter';
import { DateRange } from '@shared/models/filter.model';
import { SessionStore } from '@core/auth/session.store';
import { DashboardService } from './dashboard.service';
import { LiveMap } from './live-map/live-map';
import { StatCard } from './widgets/stat-card/stat-card';
import { StatusBreakdown } from './widgets/status-breakdown/status-breakdown';

@Component({
  selector: 'app-dashboard',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    InrPipe,
    DateFilter,
    LiveMap,
    StatCard,
    StatusBreakdown,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly dashboardService = inject(DashboardService);
  private readonly session = inject(SessionStore);

  readonly isSuperAdmin = computed(() => this.session.role() === 'SUPER_ADMIN');
  readonly loading = signal(false);
  readonly summary = signal<DashboardSummary>({});
  readonly range = signal<DateRange>({});

  constructor() {
    this.load();
  }

  onRangeChange(range: DateRange) {
    this.range.set(range);
    this.load();
  }

  zoneNames(person: DashboardTeamRow) {
    return (person.zones ?? [])
      .map((zone) => (zone.city ? `${zone.name} (${zone.city})` : zone.name))
      .join(', ');
  }

  load() {
    this.loading.set(true);
    this.dashboardService.summary(this.range()).subscribe({
      next: (summary) => {
        this.summary.set(summary ?? {});
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
