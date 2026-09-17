import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DateRange } from '@shared/models/filter.model';

type PresetId = 'today' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';

function toIsoDate(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

/** Date-range picker with the presets every report screen needs. */
@Component({
  selector: 'app-date-filter',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './date-filter.html',
  styleUrl: './date-filter.scss',
})
export class DateFilter {
  readonly label = input('Period');
  readonly initialPreset = input<PresetId>('thisMonth');

  readonly rangeChange = output<DateRange>();

  readonly presets: { id: PresetId; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'last7', label: 'Last 7 days' },
    { id: 'last30', label: 'Last 30 days' },
    { id: 'thisMonth', label: 'This month' },
    { id: 'lastMonth', label: 'Last month' },
    { id: 'custom', label: 'Custom range' },
  ];

  preset = signal<PresetId>('thisMonth');
  from = signal<Date | null>(null);
  to = signal<Date | null>(null);

  constructor() {
    this.preset.set(this.initialPreset());
    this.applyPreset(this.initialPreset(), false);
  }

  onPresetChange(preset: PresetId) {
    this.preset.set(preset);
    if (preset !== 'custom') this.applyPreset(preset, true);
  }

  applyCustom() {
    this.emit();
  }

  clear() {
    this.preset.set('custom');
    this.from.set(null);
    this.to.set(null);
    this.rangeChange.emit({ from: null, to: null });
  }

  private applyPreset(preset: PresetId, emit: boolean) {
    const now = new Date();
    const startOfDay = (date: Date) =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let from = startOfDay(now);
    let to = startOfDay(now);

    switch (preset) {
      case 'today':
        break;
      case 'last7':
        from = new Date(from.getTime() - 6 * 24 * 60 * 60 * 1000);
        break;
      case 'last30':
        from = new Date(from.getTime() - 29 * 24 * 60 * 60 * 1000);
        break;
      case 'thisMonth':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'custom':
        return;
    }

    this.from.set(from);
    this.to.set(to);
    if (emit) this.emit();
  }

  private emit() {
    const from = this.from();
    const to = this.to();
    this.rangeChange.emit({
      from: from ? toIsoDate(from) : null,
      to: to ? toIsoDate(to) : null,
    });
  }

  /** Current range, useful for a parent that wants the initial value. */
  currentRange(): DateRange {
    const from = this.from();
    const to = this.to();
    return {
      from: from ? toIsoDate(from) : null,
      to: to ? toIsoDate(to) : null,
    };
  }
}
