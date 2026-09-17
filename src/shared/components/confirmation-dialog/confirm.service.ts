import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import {
  ConfirmationDialog,
  ConfirmationDialogData,
  ConfirmationDialogResult,
} from './confirmation-dialog';

/** `confirm.ask({...})` → emits only when the admin confirms. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(MatDialog);

  ask(data: ConfirmationDialogData): Observable<ConfirmationDialogResult> {
    return this.dialog
      .open(ConfirmationDialog, {
        data,
        width: '460px',
        autoFocus: data.requireReason ? 'first-tabbable' : 'dialog',
      })
      .afterClosed()
      .pipe(map((result) => result ?? { confirmed: false }));
  }

  /** Convenience for destructive actions. */
  askDanger(
    title: string,
    message: string,
    options: Partial<ConfirmationDialogData> = {},
  ) {
    return this.ask({
      title,
      message,
      tone: 'warn',
      confirmLabel: 'Yes, continue',
      ...options,
    });
  }
}
