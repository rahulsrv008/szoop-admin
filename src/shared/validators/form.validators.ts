import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^\d{6}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** Mirrors the backend's 10-digit Indian mobile rule. */
export function mobileValidator(): ValidatorFn {
  return (control) =>
    !control.value || MOBILE_REGEX.test(String(control.value))
      ? null
      : { mobile: 'Enter a valid 10-digit mobile number' };
}

export function pincodeValidator(): ValidatorFn {
  return (control) =>
    !control.value || PINCODE_REGEX.test(String(control.value))
      ? null
      : { pincode: 'Enter a valid 6-digit pincode' };
}

export function ifscValidator(): ValidatorFn {
  return (control) =>
    !control.value || IFSC_REGEX.test(String(control.value).toUpperCase())
      ? null
      : { ifsc: 'Enter a valid IFSC code' };
}

/** Percentage inputs (discounts, incentives). */
export function percentValidator(): ValidatorFn {
  return (control) => {
    if (control.value === null || control.value === '') return null;
    const value = Number(control.value);
    return Number.isFinite(value) && value > 0 && value <= 100
      ? null
      : { percent: 'Enter a percentage between 1 and 100' };
  };
}

export function positiveNumberValidator(): ValidatorFn {
  return (control) => {
    if (control.value === null || control.value === '') return null;
    const value = Number(control.value);
    return Number.isFinite(value) && value >= 0
      ? null
      : { positiveNumber: 'Enter a valid amount' };
  };
}

/** Group validator: `validUntil` must come after `validFrom`. */
export function dateRangeValidator(
  fromKey = 'validFrom',
  toKey = 'validUntil',
): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const from = group.get(fromKey)?.value;
    const to = group.get(toKey)?.value;
    if (!from || !to) return null;
    return new Date(from).getTime() <= new Date(to).getTime()
      ? null
      : { dateRange: 'End date must be after the start date' };
  };
}

/** Group validator for password confirmation fields. */
export function matchValidator(sourceKey: string, targetKey: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const source = group.get(sourceKey)?.value;
    const target = group.get(targetKey)?.value;
    if (!source || !target) return null;
    return source === target ? null : { mismatch: 'Values do not match' };
  };
}
