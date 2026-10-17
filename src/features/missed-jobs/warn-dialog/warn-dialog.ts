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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { MissedJobsService } from '../missed-jobs.service';
import { WarnResult } from '../missed-jobs.model';

export interface WarnDialogData {
  agentId: string;
  agentName: string;
}

/** Opens the warning dialog; resolves with the result once a warning is sent. */
export function openWarnDialog(
  dialog: MatDialog,
  data: WarnDialogData,
): Observable<WarnResult | undefined> {
  return dialog.open(WarnDialog, { width: '560px', data }).afterClosed();
}

/** Shows the standard warning (editable) and sends it to the agent as a push + in-app notification. */
@Component({
  selector: 'app-warn-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './warn-dialog.html',
  styleUrl: './warn-dialog.scss',
})
export class WarnDialog {
  readonly data = inject<WarnDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<WarnDialog, WarnResult>>(MatDialogRef);
  private readonly missedJobs = inject(MissedJobsService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly notWarned = signal(0);
  message = '';

  constructor() {
    this.missedJobs.warningPreview(this.data.agentId).subscribe({
      next: (preview) => {
        this.message = preview.message;
        this.notWarned.set(preview.notWarned);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get canSend() {
    return !this.loading() && !this.sending() && this.message.trim().length > 10;
  }

  cancel() {
    this.dialogRef.close();
  }

  send() {
    if (!this.canSend) return;
    this.sending.set(true);
    this.missedJobs.warn(this.data.agentId, this.message.trim()).subscribe({
      next: (result) => {
        this.notifications.success(`Warning sent to ${this.data.agentName}`);
        this.dialogRef.close(result);
      },
      error: () => this.sending.set(false),
    });
  }
}
