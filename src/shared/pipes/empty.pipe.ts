import { Pipe, PipeTransform } from '@angular/core';

/** Renders an em dash instead of blank cells. */
@Pipe({ name: 'orDash' })
export class OrDashPipe implements PipeTransform {
  transform(value: unknown, fallback = '—'): unknown {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'string' && !value.trim()) return fallback;
    return value;
  }
}
