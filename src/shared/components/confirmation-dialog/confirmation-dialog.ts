import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'warn';
  /** Ask for a mandatory reason/remark and return it to the caller. */
  requireReason?: boolean;
  reasonLabel?: string;
}

export interface ConfirmationDialogResult {
  confirmed: boolean;
  reason?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
  ],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.scss',
})
export class ConfirmationDialog {
  readonly data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<ConfirmationDialog, ConfirmationDialogResult>>(MatDialogRef);

  reason = '';

  get canConfirm() {
    return !this.data.requireReason || this.reason.trim().length > 2;
  }

  cancel() {
    this.dialogRef.close({ confirmed: false });
  }

  confirm() {
    if (!this.canConfirm) return;
    this.dialogRef.close({
      confirmed: true,
      reason: this.reason.trim() || undefined,
    });
  }
}
