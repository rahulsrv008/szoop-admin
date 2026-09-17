import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DataTable } from '@shared/components/data-table/data-table';
import { OrDashPipe } from '@shared/pipes/empty.pipe';
import { TableColumn } from '@shared/models/table.model';
import { AgentLocationView } from '../agents.model';
import { AgentsService } from '../agents.service';

@Component({
  selector: 'app-agent-location',
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    DataTable,
    OrDashPipe,
  ],
  templateUrl: './agent-location.html',
  styleUrl: './agent-location.scss',
})
export class AgentLocation implements OnInit {
  private readonly agentsService = inject(AgentsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly view = signal<AgentLocationView | null>(null);

  readonly columns: TableColumn[] = [
    { key: 'recordedAt', label: 'Recorded', type: 'datetime' },
    { key: 'latitude', label: 'Latitude' },
    { key: 'longitude', label: 'Longitude' },
    { key: 'bookingId', label: 'Booking', fallback: '—' },
  ];

  ngOnInit() {
    this.load();
  }

  get agentId() {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  load() {
    this.loading.set(true);
    this.agentsService.location(this.agentId).subscribe({
      next: (view) => {
        this.view.set(view);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        void this.router.navigate(['/agents', this.agentId]);
      },
    });
  }

  mapsUrl(lat: string | number, lng: string | number) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
}
