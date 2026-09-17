import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DISCOUNT_TYPES } from '@config/constants';
import { NotificationService } from '@core/services/notification.service';
import { SelectOption, toOptions } from '@shared/models/filter.model';
import {
  dateRangeValidator,
  percentValidator,
  positiveNumberValidator,
} from '@shared/validators/form.validators';
import { CouponsService } from '../coupons.service';

function toDateInput(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

@Component({
  selector: 'app-coupon-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './coupon-form.html',
  styleUrl: './coupon-form.scss',
})
export class CouponForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly coupons = inject(CouponsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly notFound = signal(false);

  readonly couponId = computed(() => this.route.snapshot.paramMap.get('id'));
  readonly isEdit = computed(() => !!this.couponId());

  readonly typeOptions: SelectOption[] = toOptions(DISCOUNT_TYPES);

  readonly form = this.formBuilder.group(
    {
      code: ['', [Validators.required, Validators.minLength(3)]],
      discountType: [
        'PERCENT' as 'PERCENT' | 'FLAT',
        Validators.required,
      ],
      discountValue: [
        null as number | null,
        [Validators.required, positiveNumberValidator()],
      ],
      maxDiscount: [null as number | null, [positiveNumberValidator()]],
      minOrderAmount: [null as number | null, [positiveNumberValidator()]],
      usageLimit: [null as number | null, [positiveNumberValidator()]],
      validFrom: [null as Date | null],
      validUntil: [null as Date | null],
      isActive: [true],
    },
    { validators: dateRangeValidator('validFrom', 'validUntil') },
  );

  constructor() {
    this.form.controls.discountType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((type) => {
      const valueCtrl = this.form.controls.discountValue;
      const maxCtrl = this.form.controls.maxDiscount;
      if (type === 'PERCENT') {
        valueCtrl.setValidators([
          Validators.required,
          percentValidator(),
        ]);
        maxCtrl.enable({ emitEvent: false });
      } else {
        valueCtrl.setValidators([
          Validators.required,
          positiveNumberValidator(),
        ]);
        maxCtrl.disable({ emitEvent: false });
        maxCtrl.setValue(null, { emitEvent: false });
      }
      valueCtrl.updateValueAndValidity({ emitEvent: false });
    });

    if (this.isEdit()) {
      this.loadCoupon(this.couponId()!);
    } else {
      this.form.controls.discountType.setValue('PERCENT');
    }
  }

  onCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    if (upper !== input.value) {
      this.form.controls.code.setValue(upper, { emitEvent: false });
    }
  }

  submit() {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      code: String(raw.code ?? '').trim().toUpperCase(),
      discountType: raw.discountType as 'PERCENT' | 'FLAT',
      discountValue: Number(raw.discountValue),
      maxDiscount:
        raw.discountType === 'PERCENT' && raw.maxDiscount != null
          ? Number(raw.maxDiscount)
          : null,
      minOrderAmount:
        raw.minOrderAmount == null ? null : Number(raw.minOrderAmount),
      usageLimit: raw.usageLimit == null ? null : Number(raw.usageLimit),
      validFrom: toIso(raw.validFrom),
      validUntil: toIso(raw.validUntil),
      isActive: !!raw.isActive,
    };

    this.submitting.set(true);
    const request = this.isEdit()
      ? this.coupons.update(this.couponId()!, payload)
      : this.coupons.create(payload);

    request.subscribe({
      next: () => {
        this.submitting.set(false);
        this.notifications.success(
          this.isEdit() ? 'Coupon updated' : 'Coupon created',
        );
        void this.router.navigate(['/coupons']);
      },
      error: () => this.submitting.set(false),
    });
  }

  private loadCoupon(id: string) {
    this.loading.set(true);
    this.coupons.find(id).subscribe({
      next: (coupon) => {
        this.loading.set(false);
        if (!coupon) {
          this.notFound.set(true);
          return;
        }
        this.form.patchValue({
          code: coupon.code,
          discountType: coupon.discountType as 'PERCENT' | 'FLAT',
          discountValue: Number(coupon.discountValue),
          maxDiscount:
            coupon.maxDiscount == null ? null : Number(coupon.maxDiscount),
          minOrderAmount:
            coupon.minOrderAmount == null
              ? null
              : Number(coupon.minOrderAmount),
          usageLimit: coupon.usageLimit ?? null,
          validFrom: toDateInput(coupon.validFrom),
          validUntil: toDateInput(coupon.validUntil),
          isActive: coupon.isActive,
        });
        if (coupon.discountType === 'FLAT') {
          this.form.controls.maxDiscount.disable({ emitEvent: false });
        }
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }
}
