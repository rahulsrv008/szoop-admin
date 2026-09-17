import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ServicePricing } from '@core/models';
import { SelectOption } from '@shared/models/filter.model';
import { positiveNumberValidator } from '@shared/validators/form.validators';
import { PricingPayload } from '../pricing.model';

export interface PricingDialogData {
  row?: ServicePricing | null;
  serviceOptions: SelectOption[];
  areaOptions: SelectOption[];
  presetServiceId?: string;
}

function payoutNotAbovePrice(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const price = Number(group.get('pricePerHour')?.value);
    const payout = group.get('agentPayoutPerHour')?.value;
    if (payout === null || payout === undefined || payout === '') return null;
    const amount = Number(payout);
    if (!Number.isFinite(price) || !Number.isFinite(amount)) return null;
    return amount <= price
      ? null
      : { payoutAbovePrice: 'Payout cannot exceed price' };
  };
}

@Component({
  selector: 'app-pricing-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  templateUrl: './pricing-dialog.html',
  styleUrl: './pricing-dialog.scss',
})
export class PricingDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<PricingDialog, PricingPayload | null>,
  );
  readonly data = inject<PricingDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = !!this.data.row;

  readonly form = this.formBuilder.nonNullable.group(
    {
      serviceId: [
        this.data.row?.serviceId ?? this.data.presetServiceId ?? '',
        Validators.required,
      ],
      serviceAreaId: [this.data.row?.serviceAreaId ?? ''],
      pricePerHour: [
        Number(this.data.row?.pricePerHour ?? 0) || null,
        [Validators.required, positiveNumberValidator()],
      ],
      agentPayoutPerHour: [
        this.data.row?.agentPayoutPerHour == null
          ? null
          : Number(this.data.row.agentPayoutPerHour),
        [positiveNumberValidator()],
      ],
      isActive: [this.data.row?.isActive ?? true],
    },
    { validators: payoutNotAbovePrice() },
  );

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
      serviceId: raw.serviceId,
      serviceAreaId: raw.serviceAreaId || null,
      pricePerHour: Number(raw.pricePerHour),
      agentPayoutPerHour:
        raw.agentPayoutPerHour === null || raw.agentPayoutPerHour === undefined
          ? null
          : Number(raw.agentPayoutPerHour),
      isActive: raw.isActive,
    });
  }
}
