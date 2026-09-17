import { Pipe, PipeTransform } from '@angular/core';

/** Formats a rupee amount (DECIMAL columns arrive as strings). */
@Pipe({ name: 'inr' })
export class InrPipe implements PipeTransform {
  transform(value: string | number | null | undefined, fallback = '—'): string {
    if (value === null || value === undefined || value === '') return fallback;
    const amount = Number(value);
    if (!Number.isFinite(amount)) return fallback;

    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    });
  }
}
