import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';
import { BookingMonitorService } from '@core/services/booking-monitor.service';
import { NotificationService } from '@core/services/notification.service';

export interface NudgeDialogData {
  agentId: string;
  agentName: string;
  /** The job it's about: lets a zone admin nudge an agent from another zone on their job. */
  bookingId?: string;
  title: string;
  message: string;
}

/** Resolves true once the nudge is sent. */
export function openNudgeDialog(dialog: MatDialog, data: NudgeDialogData): Observable<boolean | undefined> {
  return dialog.open(NudgeDialog, { width: '520px', data }).afterClosed();
}

/** A push + in-app notification to one agent, prefilled for the step they're stuck on. */
@Component({
  selector: 'app-nudge-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './nudge-dialog.html',
  styleUrl: './nudge-dialog.scss',
})
export class NudgeDialog {
  readonly data = inject<NudgeDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<NudgeDialog, boolean>>(MatDialogRef);
  private readonly monitor = inject(BookingMonitorService);
  private readonly notifications = inject(NotificationService);

  readonly sending = signal(false);
  title = this.data.title;
  message = this.data.message;

  get canSend() {
    return !this.sending() && this.title.trim().length >= 2 && this.message.trim().length >= 2;
  }

  send() {
    if (!this.canSend) return;
    this.sending.set(true);
    this.monitor
      .nudge({
        agentId: this.data.agentId,
        bookingId: this.data.bookingId,
        title: this.title.trim(),
        message: this.message.trim(),
      })
      .subscribe({
        next: () => {
          this.notifications.success(`Nudge sent to ${this.data.agentName}`);
          this.dialogRef.close(true);
        },
        error: () => this.sending.set(false),
      });
  }
}
