import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Society } from '@core/models';
import { pincodeValidator, positiveNumberValidator } from '@shared/validators/form.validators';
import { SocietyPayload } from '../service-areas.model';

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export interface SocietyDialogData {
  society?: Society | null;
}

@Component({
  selector: 'app-society-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './society-dialog.html',
  styleUrl: './society-dialog.scss',
})
export class SocietyDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SocietyDialog, SocietyPayload | null>);
  readonly data = inject<SocietyDialogData>(MAT_DIALOG_DATA);
  readonly isEdit = !!this.data.society;

  readonly form = this.formBuilder.group({
    name: [this.data.society?.name ?? '', [Validators.required, Validators.minLength(2)]],
    address: [this.data.society?.address ?? ''],
    city: [this.data.society?.city ?? ''],
    state: [this.data.society?.state ?? ''],
    pincode: [this.data.society?.pincode ?? '', [pincodeValidator()]],
    latitude: [this.data.society?.latitude == null ? null : Number(this.data.society.latitude)],
    longitude: [this.data.society?.longitude == null ? null : Number(this.data.society.longitude)],
    totalUnits: [this.data.society?.totalUnits ?? null, [positiveNumberValidator()]],
    isActive: [this.data.society?.isActive ?? true],
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
      name: String(raw.name ?? '').trim(),
      address: String(raw.address ?? '').trim() || null,
      city: String(raw.city ?? '').trim() || null,
      state: String(raw.state ?? '').trim() || null,
      pincode: String(raw.pincode ?? '').trim() || null,
      latitude: optionalNumber(raw.latitude),
      longitude: optionalNumber(raw.longitude),
      totalUnits: optionalNumber(raw.totalUnits),
      isActive: !!raw.isActive,
    });
  }
}
