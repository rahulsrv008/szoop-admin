import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Toast feedback for every user action. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string) {
    this.open(message, 'snack-success', 3000);
  }

  error(message: string) {
    this.open(message, 'snack-error', 6000);
  }

  info(message: string) {
    this.open(message, 'snack-info', 4000);
  }

  private open(message: string, panelClass: string, duration: number) {
    this.snackBar.open(message, 'Dismiss', {
      duration,
      panelClass,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
