import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AgentListItem } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { AgentsService } from '../../agents/agents.service';
import { BookingsService } from '../bookings.service';

export interface AssignAgentDialogData {
  bookingId: string;
  bookingNumber: string;
  reassign: boolean;
  currentAgentName?: string | null;
}

export interface AssignAgentDialogResult {
  assigned: boolean;
}

@Component({
  selector: 'app-assign-agent',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './assign-agent.html',
  styleUrl: './assign-agent.scss',
})
export class AssignAgentDialog implements OnInit {
  private readonly bookingsService = inject(BookingsService);
  private readonly agentsService = inject(AgentsService);
  private readonly notifications = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<AssignAgentDialog, AssignAgentDialogResult>);
  private readonly fb = inject(FormBuilder);
  readonly data = inject<AssignAgentDialogData>(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly agents = signal<AgentListItem[]>([]);

  readonly form = this.fb.nonNullable.group({
    agentId: ['', Validators.required],
    remarks: [''],
    reason: [''],
  });

  ngOnInit() {
    if (this.data.reassign) {
      this.form.controls.reason.setValidators([
        Validators.required,
        Validators.minLength(3),
      ]);
      this.form.controls.reason.updateValueAndValidity();
    }

    this.agentsService
      .list({ page: 1, limit: 100, status: 'ACTIVE', approvalStatus: 'APPROVED' })
      .subscribe({
        next: (result) => this.agents.set(result?.items ?? []),
      });
  }

  cancel() {
    this.dialogRef.close({ assigned: false });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.loading.set(true);

    const request$ = this.data.reassign
      ? this.bookingsService.reassignAgent(this.data.bookingId, {
          agentId: value.agentId,
          reason: value.reason.trim(),
        })
      : this.bookingsService.assignAgent(this.data.bookingId, {
          agentId: value.agentId,
          remarks: value.remarks.trim() || undefined,
        });

    request$.subscribe({
      next: () => {
        this.notifications.success(
          this.data.reassign ? 'Agent reassigned' : 'Agent assigned',
        );
        this.loading.set(false);
        this.dialogRef.close({ assigned: true });
      },
      error: () => this.loading.set(false),
    });
  }
}
