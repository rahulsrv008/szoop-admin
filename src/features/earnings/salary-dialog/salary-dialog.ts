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
import { MatSelectModule } from '@angular/material/select';
import { SalaryRow } from '@core/models';
import { SelectOption, toOptions } from '@shared/models/filter.model';
import { positiveNumberValidator } from '@shared/validators/form.validators';
import { SalaryUpdatePayload } from '../earnings.model';

const SALARY_STATUSES = ['PENDING', 'APPROVED', 'PAID', 'REJECTED'] as const;

export interface SalaryDialogData {
  row: SalaryRow;
}

@Component({
  selector: 'app-salary-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './salary-dialog.html',
  styleUrl: './salary-dialog.scss',
})
export class SalaryDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<SalaryDialog, SalaryUpdatePayload | null>,
  );
  readonly data = inject<SalaryDialogData>(MAT_DIALOG_DATA);

  readonly statusOptions: SelectOption[] = toOptions(SALARY_STATUSES);

  readonly form = this.formBuilder.nonNullable.group({
    status: [this.data.row.status, Validators.required],
    deductions: [
      Number(this.data.row.deductions ?? 0),
      [Validators.required, positiveNumberValidator()],
    ],
    remarks: [''],
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
      status: raw.status,
      deductions: Number(raw.deductions),
      remarks: raw.remarks.trim() || undefined,
    });
  }
}
