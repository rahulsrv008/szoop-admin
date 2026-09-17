import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { OrDashPipe } from '@shared/pipes/empty.pipe';
import { RatingDetail } from '../ratings.model';

@Component({
  selector: 'app-rating-view-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe, OrDashPipe],
  templateUrl: './rating-view-dialog.html',
  styleUrl: './rating-view-dialog.scss',
})
export class RatingViewDialog {
  readonly data = inject<RatingDetail>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<RatingViewDialog>);

  close() {
    this.dialogRef.close();
  }

  stars(value: number) {
    const rounded = Math.round(Number(value) || 0);
    return Array.from({ length: 5 }, (_, index) => index < rounded);
  }
}
