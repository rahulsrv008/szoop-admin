import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { InrPipe } from '@shared/pipes/inr.pipe';
import { OrDashPipe } from '@shared/pipes/empty.pipe';
import { AgentBankDetails } from '../bank-details/bank-details';
import { AgentDocuments } from '../documents/documents';
import { AgentReferrals } from '../referrals/agent-referrals';
import {
  AgentAvailabilitySlot,
  AgentDetailView,
  AgentRecentBooking,
} from '../agents.model';
import { AgentsService } from '../agents.service';
import { openAgentZoneDialog } from '../agent-zone-dialog/agent-zone-dialog';

@Component({
  selector: 'app-agent-details',
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    StatusBadge,
    InrPipe,
    OrDashPipe,
    AgentDocuments,
    AgentBankDetails,
    AgentReferrals,
  ],
  templateUrl: './agent-details.html',
  styleUrl: './agent-details.scss',
})
export class AgentDetails implements OnInit {
  private readonly agentsService = inject(AgentsService);
  private readonly confirm = inject(ConfirmService);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly agent = signal<AgentDetailView | null>(null);

  ngOnInit() {
    this.load();
  }

  get agentId() {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  load() {
    this.loading.set(true);
    this.agentsService.detail(this.agentId).subscribe({
      next: (agent) => {
        this.agent.set(agent);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        void this.router.navigate(['/agents']);
      },
    });
  }

  availabilitySlots(): AgentAvailabilitySlot[] {
    const value = this.agent()?.availabilityToday;
    if (!value) return [];
    return Array.isArray(value) ? value : [value as AgentAvailabilitySlot];
  }

  canApprove() {
    const status = this.agent()?.approvalStatus;
    return status === 'PENDING' || status === 'REJECTED';
  }

  canReject() {
    return this.agent()?.approvalStatus === 'PENDING';
  }

  canSuspend() {
    return this.agent()?.status === 'ACTIVE';
  }

  canActivate() {
    return this.agent()?.status === 'SUSPENDED';
  }

  locationText() {
    const location = this.agent()?.currentLocation;
    if (!location) return '—';
    return `${location.latitude}, ${location.longitude}`;
  }

  serviceAreaText() {
    const areas = this.agent()?.serviceAreas ?? [];
    if (!areas.length) return '—';
    return areas.map((zone) => zone.code || zone.name).join(', ');
  }

  approve() {
    const agent = this.agent();
    if (!agent) return;

    openAgentZoneDialog(this.dialog, {
      mode: 'approve',
      agentName: agent.name ?? agent.mobile,
      homeZoneId: agent.homeZone?.id ?? null,
      serviceAreaIds: (agent.serviceAreas ?? []).map((zone) => zone.id),
    }).subscribe((result) => {
      if (!result || !('serviceAreaIds' in result)) return;
      this.loading.set(true);
      this.agentsService
        .approve(this.agentId, {
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

  assignZones() {
    const agent = this.agent();
    if (!agent) return;

    openAgentZoneDialog(this.dialog, {
      mode: 'assign',
      agentName: agent.name ?? agent.mobile,
      homeZoneId: agent.homeZone?.id ?? null,
      serviceAreaIds: (agent.serviceAreas ?? []).map((zone) => zone.id),
    }).subscribe((result) => {
      if (!result || !('serviceAreaIds' in result)) return;
      this.loading.set(true);
      this.agentsService
        .assignZones(this.agentId, {
          homeZoneId: result.homeZoneId,
          serviceAreaIds: result.serviceAreaIds,
        })
        .subscribe({
          next: () => {
            this.notifications.success('Service locations updated');
            this.load();
          },
          error: () => this.loading.set(false),
        });
    });
  }

  reject() {
    const agent = this.agent();
    if (!agent) return;

    this.confirm
      .askDanger(
        'Reject application',
        `${agent.name ?? agent.mobile} will be told why their onboarding was rejected.`,
        {
          confirmLabel: 'Reject',
          requireReason: true,
          reasonLabel: 'Reason (sent to the agent)',
        },
      )
      .subscribe((result) => {
        if (!result.confirmed || !result.reason) return;
        this.loading.set(true);
        this.agentsService.reject(this.agentId, result.reason).subscribe({
          next: () => {
            this.notifications.success('Application rejected');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  suspend() {
    const agent = this.agent();
    if (!agent) return;

    this.confirm
      .askDanger(
        'Suspend agent',
        `${agent.name ?? agent.mobile} will be taken offline immediately.`,
        {
          confirmLabel: 'Suspend',
          requireReason: true,
          reasonLabel: 'Reason (sent to the agent)',
        },
      )
      .subscribe((result) => {
        if (!result.confirmed || !result.reason) return;
        this.loading.set(true);
        this.agentsService.suspend(this.agentId, result.reason).subscribe({
          next: () => {
            this.notifications.success('Agent suspended');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  activate() {
    const agent = this.agent();
    if (!agent) return;

    this.confirm
      .ask({
        title: 'Activate agent',
        message: `${agent.name ?? agent.mobile} will be able to go online again.`,
        confirmLabel: 'Activate',
      })
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.agentsService.activate(this.agentId).subscribe({
          next: () => {
            this.notifications.success('Agent activated');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  openBooking(booking: AgentRecentBooking) {
    void this.router.navigate(['/bookings', booking.id]);
  }
}
