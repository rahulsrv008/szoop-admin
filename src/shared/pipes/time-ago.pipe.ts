import { Pipe, PipeTransform } from '@angular/core';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

/** "3 minutes ago" style relative timestamps. */
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  private readonly formatter = new Intl.RelativeTimeFormat('en', {
    numeric: 'auto',
  });

  transform(value: string | Date | null | undefined, fallback = '—'): string {
    if (!value) return fallback;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;

    const diff = date.getTime() - Date.now();
    for (const [unit, ms] of UNITS) {
      if (Math.abs(diff) >= ms) {
        return this.formatter.format(Math.round(diff / ms), unit);
      }
    }
    return 'just now';
  }
}
