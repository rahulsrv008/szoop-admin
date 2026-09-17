import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ServiceArea } from '@core/models';
import { pincodeValidator } from '@shared/validators/form.validators';
import { AreaPayload } from '../service-areas.model';

export interface AreaDialogData {
  area?: ServiceArea | null;
}

@Component({
  selector: 'app-area-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './area-dialog.html',
  styleUrl: './area-dialog.scss',
})
export class AreaDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<AreaDialog, AreaPayload | null>,
  );
  readonly data = inject<AreaDialogData>(MAT_DIALOG_DATA);
  readonly isEdit = !!this.data.area;

  readonly form = this.formBuilder.nonNullable.group({
    name: [
      this.data.area?.name ?? '',
      [Validators.required, Validators.minLength(2)],
    ],
    city: [this.data.area?.city ?? ''],
    state: [this.data.area?.state ?? ''],
    pincode: [this.data.area?.pincode ?? '', [pincodeValidator()]],
    isActive: [this.data.area?.isActive ?? true],
  });

  cancel() {
    this.dialogRef.close(null);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      name: raw.name.trim(),
      city: raw.city.trim() || null,
      state: raw.state.trim() || null,
      pincode: raw.pincode.trim() || null,
      isActive: raw.isActive,
    });
  }
}
