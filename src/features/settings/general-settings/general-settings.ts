import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SystemSetting } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-general-settings',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './general-settings.html',
  styleUrl: './general-settings.scss',
})
export class GeneralSettings {
  private readonly settingsService = inject(SettingsService);
  private readonly notifications = inject(NotificationService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly settings = signal<SystemSetting[]>([]);

  readonly form = this.formBuilder.group({
    rows: this.formBuilder.array<FormGroup>([]),
  });

  get rows() {
    return this.form.get('rows') as FormArray<FormGroup>;
  }

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.settingsService.listSettings().subscribe({
      next: (response) => {
        const items = response?.items ?? [];
        this.settings.set(items);
        this.rows.clear();
        for (const item of items) {
          this.rows.push(
            this.formBuilder.group({
              key: [item.settingKey],
              description: [item.description ?? ''],
              value: [
                this.toEditableValue(item.settingValue),
                Validators.required,
              ],
            }),
          );
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save() {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      settings: this.rows.getRawValue().map((row) => ({
        key: row['key'] as string,
        value: this.parseValue(row['value']),
        description: (row['description'] as string)?.trim() || undefined,
      })),
    };

    this.saving.set(true);
    this.settingsService.bulkUpdateSettings(payload).subscribe({
      next: (result) => {
        this.saving.set(false);
        this.notifications.success(
          `Saved ${result.updated} setting${result.updated === 1 ? '' : 's'}`,
        );
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }

  private toEditableValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return JSON.stringify(value);
  }

  private parseValue(raw: unknown): unknown {
    const text = String(raw ?? '').trim();
    if (text === '') return text;
    if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
    if (text === 'true') return true;
    if (text === 'false') return false;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
}
