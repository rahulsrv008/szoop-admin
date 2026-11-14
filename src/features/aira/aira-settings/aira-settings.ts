import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NotificationService } from '@core/services/notification.service';
import { SettingsService } from '@features/settings/settings.service';

const DEFAULTS = {
  enabled: true,
  brandName: 'Aira Luxury',
  tagline: 'Luxury beauty, on your Szoop account',
  heroTitle: 'Feel beautiful. Feel like you.',
  heroCopy: 'Thoughtful beauty services, wherever you feel most comfortable.',
  supportEmail: 'hello@szoop.in',
};

const KEYS = {
  enabled: 'aira_enabled',
  brandName: 'aira_brand_name',
  tagline: 'aira_tagline',
  heroTitle: 'aira_hero_title',
  heroCopy: 'aira_hero_copy',
  supportEmail: 'aira_support_email',
} as const;

@Component({
  selector: 'app-aira-settings',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSlideToggleModule,
  ],
  templateUrl: './aira-settings.html',
  styleUrl: './aira-settings.scss',
})
export class AiraSettingsPage {
  private readonly settingsService = inject(SettingsService);
  private readonly notifications = inject(NotificationService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    enabled: [DEFAULTS.enabled],
    brandName: [DEFAULTS.brandName, [Validators.required, Validators.maxLength(40)]],
    tagline: [DEFAULTS.tagline, [Validators.required, Validators.maxLength(160)]],
    heroTitle: [DEFAULTS.heroTitle, [Validators.required, Validators.maxLength(80)]],
    heroCopy: [DEFAULTS.heroCopy, [Validators.required, Validators.maxLength(240)]],
    supportEmail: [DEFAULTS.supportEmail, [Validators.required, Validators.email, Validators.maxLength(120)]],
  });

  constructor() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.settingsService.listSettings().subscribe({
      next: (response) => {
        const byKey = new Map(
          (response?.items ?? []).map((item) => [item.settingKey, item.settingValue]),
        );
        this.form.reset({
          enabled: this.flag(byKey.get(KEYS.enabled), DEFAULTS.enabled),
          brandName: this.text(byKey.get(KEYS.brandName), DEFAULTS.brandName),
          tagline: this.text(byKey.get(KEYS.tagline), DEFAULTS.tagline),
          heroTitle: this.text(byKey.get(KEYS.heroTitle), DEFAULTS.heroTitle),
          heroCopy: this.text(byKey.get(KEYS.heroCopy), DEFAULTS.heroCopy),
          supportEmail: this.text(byKey.get(KEYS.supportEmail), DEFAULTS.supportEmail),
        });
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
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.settingsService
      .bulkUpdateSettings({
        settings: [
          { key: KEYS.enabled, value: value.enabled, description: 'Aira customer app is open for bookings' },
          { key: KEYS.brandName, value: value.brandName.trim(), description: 'Name shown in the Aira app' },
          { key: KEYS.tagline, value: value.tagline.trim(), description: 'Short line under the Aira name' },
          { key: KEYS.heroTitle, value: value.heroTitle.trim(), description: 'Aira home hero title' },
          { key: KEYS.heroCopy, value: value.heroCopy.trim(), description: 'Aira home hero copy' },
          { key: KEYS.supportEmail, value: value.supportEmail.trim(), description: 'Support address shown in Aira' },
        ],
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notifications.success('Aira app settings saved');
          this.load();
        },
        error: () => this.saving.set(false),
      });
  }

  private text(value: unknown, fallback: string) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private flag(value: unknown, fallback: boolean) {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
  }
}
