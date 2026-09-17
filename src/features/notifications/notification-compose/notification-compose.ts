import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { NOTIFICATION_AUDIENCES } from '@config/constants';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { toOptions } from '@shared/models/filter.model';
import { NotificationsService } from '../notifications.service';
import { NotificationAudience } from '../notifications.model';

@Component({
  selector: 'app-notification-compose',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './notification-compose.html',
  styleUrl: './notification-compose.scss',
})
export class NotificationCompose {
  private readonly formBuilder = inject(FormBuilder);
  private readonly notificationsApi = inject(NotificationsService);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);

  readonly submitting = signal(false);

  readonly audienceOptions = toOptions(NOTIFICATION_AUDIENCES, {
    ALL: 'All customers & agents',
    CUSTOMERS: 'Customers only',
    AGENTS: 'Agents only',
    SPECIFIC: 'Specific user IDs',
  });

  readonly form = this.formBuilder.nonNullable.group({
    audience: ['ALL' as NotificationAudience, Validators.required],
    userIds: [''],
    title: ['', [Validators.required, Validators.minLength(2)]],
    message: ['', [Validators.required, Validators.minLength(2)]],
    type: ['general'],
  });

  get showUserIds() {
    return this.form.controls.audience.value === 'SPECIFIC';
  }

  submit() {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const userIds =
      raw.audience === 'SPECIFIC'
        ? raw.userIds
            .split(/[\s,]+/)
            .map((id) => id.trim())
            .filter(Boolean)
        : undefined;

    if (raw.audience === 'SPECIFIC' && !userIds?.length) {
      this.form.controls.userIds.setErrors({ required: true });
      return;
    }

    this.confirm
      .ask({
        title: 'Send notification',
        message: `Broadcast “${raw.title}” to ${this.audienceLabel(raw.audience)}?`,
        confirmLabel: 'Send now',
      })
      .subscribe((result) => {
        if (!result.confirmed) return;

        this.submitting.set(true);
        this.notificationsApi
          .send({
            audience: raw.audience,
            userIds,
            title: raw.title.trim(),
            message: raw.message.trim(),
            type: raw.type.trim() || 'general',
          })
          .subscribe({
            next: (response) => {
              this.submitting.set(false);
              this.notifications.success(
                `Sent to ${response.recipients} recipient${response.recipients === 1 ? '' : 's'}`,
              );
              this.form.patchValue({ title: '', message: '', userIds: '' });
              this.form.markAsUntouched();
            },
            error: () => this.submitting.set(false),
          });
      });
  }

  private audienceLabel(audience: NotificationAudience) {
    return (
      this.audienceOptions.find((option) => option.value === audience)?.label ??
      audience
    );
  }
}
