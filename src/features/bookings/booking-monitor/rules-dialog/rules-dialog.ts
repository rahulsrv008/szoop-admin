import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable } from 'rxjs';
import { MonitorRules } from '@core/models';
import { BookingMonitorService } from '@core/services/booking-monitor.service';
import { NotificationService } from '@core/services/notification.service';

type RuleKey = keyof MonitorRules;

const MINUTES = [Validators.required, Validators.min(0), Validators.max(1440), Validators.pattern(/^\d+$/)];

/** Each step's orange/red pair, in the order the page shows them. */
const STEPS: { label: string; hint: string; orange: RuleKey; red: RuleKey }[] = [
  {
    label: 'Waiting for an agent',
    hint: 'from when the job is broadcast to agents',
    orange: 'waitingOrangeMinutes',
    red: 'waitingRedMinutes',
  },
  {
    label: "Agent hasn't set off",
    hint: 'from when the agent picks the job',
    orange: 'setOffOrangeMinutes',
    red: 'setOffRedMinutes',
  },
  {
    label: 'On the way, not started',
    hint: 'from the expected start',
    orange: 'arrivalOrangeMinutes',
    red: 'arrivalRedMinutes',
  },
  {
    label: 'Work in progress',
    hint: 'from the end of the booked time',
    orange: 'overrunOrangeMinutes',
    red: 'overrunRedMinutes',
  },
];

export function openRulesDialog(dialog: MatDialog, rules: MonitorRules): Observable<boolean | undefined> {
  return dialog.open(RulesDialog, { width: '600px', data: rules }).afterClosed();
}

/** Super admins tune when monitored jobs turn orange and red. */
@Component({
  selector: 'app-monitor-rules-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './rules-dialog.html',
  styleUrl: './rules-dialog.scss',
})
export class RulesDialog {
  private readonly rules = inject<MonitorRules>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<RulesDialog, boolean>>(MatDialogRef);
  private readonly monitor = inject(BookingMonitorService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly steps = STEPS;
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      waitingOrangeMinutes: [this.rules.waitingOrangeMinutes, MINUTES],
      waitingRedMinutes: [this.rules.waitingRedMinutes, MINUTES],
      setOffOrangeMinutes: [this.rules.setOffOrangeMinutes, MINUTES],
      setOffRedMinutes: [this.rules.setOffRedMinutes, MINUTES],
      arrivalOrangeMinutes: [this.rules.arrivalOrangeMinutes, MINUTES],
      arrivalRedMinutes: [this.rules.arrivalRedMinutes, MINUTES],
      overrunOrangeMinutes: [this.rules.overrunOrangeMinutes, MINUTES],
      overrunRedMinutes: [this.rules.overrunRedMinutes, MINUTES],
      setOffLeadMinutes: [this.rules.setOffLeadMinutes, MINUTES],
      instantArrivalMinutes: [this.rules.instantArrivalMinutes, MINUTES],
    },
    { validators: redNotBeforeOrange },
  );

  /** The step whose red comes before its orange, if any. */
  invertedStep() {
    const errors = this.form.errors?.['redBeforeOrange'] as string | undefined;
    return errors ?? null;
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const rules = Object.fromEntries(
      Object.entries(value).map(([key, minutes]) => [key, Number(minutes)]),
    ) as unknown as MonitorRules;
    this.saving.set(true);
    this.monitor.updateRules(rules).subscribe({
      next: () => {
        this.notifications.success('Monitor timings saved');
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false),
    });
  }
}

function redNotBeforeOrange(group: AbstractControl): ValidationErrors | null {
  const value = group.value as Record<RuleKey, number>;
  const inverted = STEPS.find((step) => Number(value[step.red]) < Number(value[step.orange]));
  return inverted ? { redBeforeOrange: inverted.label } : null;
}
