import { DatePipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AgentDocument } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { OrDashPipe } from '@shared/pipes/empty.pipe';
import { humanize } from '@shared/models/filter.model';
import { AgentsService } from '../agents.service';

@Component({
  selector: 'app-agent-documents',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    StatusBadge,
    OrDashPipe,
  ],
  templateUrl: './documents.html',
  styleUrl: './documents.scss',
})
export class AgentDocuments {
  private readonly agentsService = inject(AgentsService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);

  readonly agentId = input.required<string>();
  readonly documents = input<AgentDocument[]>([]);
  readonly changed = output<void>();

  label(type: string) {
    return humanize(type);
  }

  verify(doc: AgentDocument) {
    this.confirm
      .ask({
        title: 'Verify document',
        message: `Mark ${this.label(doc.documentType)} as verified?`,
        confirmLabel: 'Verify',
      })
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.agentsService
          .verifyDocument(this.agentId(), doc.id, {
            verificationStatus: 'VERIFIED',
          })
          .subscribe({
            next: () => {
              this.notifications.success('Document verified');
              this.changed.emit();
            },
          });
      });
  }

  reject(doc: AgentDocument) {
    this.confirm
      .askDanger(
        'Reject document',
        `Reject ${this.label(doc.documentType)} and tell the agent why.`,
        {
          confirmLabel: 'Reject document',
          requireReason: true,
          reasonLabel: 'Reason (sent to the agent)',
        },
      )
      .subscribe((result) => {
        if (!result.confirmed || !result.reason) return;
        this.agentsService
          .verifyDocument(this.agentId(), doc.id, {
            verificationStatus: 'REJECTED',
            remarks: result.reason,
          })
          .subscribe({
            next: () => {
              this.notifications.success('Document rejected');
              this.changed.emit();
            },
          });
      });
  }
}
