import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ReferralSettings, ReferralSettingsView } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { ReferralsService } from '@core/services/referrals.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { InrPipe } from '@shared/pipes/inr.pipe';

const MAX_LEVELS = 10;
const amountValidators = [Validators.required, Validators.min(0), Validators.max(100_000), Validators.pattern(/^\d+$/)];
const whole = (min: number, max: number) => [Validators.required, Validators.min(min), Validators.max(max), Validators.pattern(/^\d+$/)];

const rupees = (value: number) => `₹${Number(value).toLocaleString('en-IN')}`;

/** "1st", "2nd", "3rd", "4th" … for the per-invite reward boxes. */
export function ordinal(n: number) {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
}

/**
 * Settings → Referral program. One box per invite and one per level, so the
 * admin always sees every amount; the summary at the top updates as they type.
 */
@Component({
  selector: 'app-referral-settings',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    InrPipe,
  ],
  templateUrl: './referral-settings.html',
  styleUrl: './referral-settings.scss',
})
export class ReferralSettingsPage {
  private readonly referrals = inject(ReferralsService);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly ordinal = ordinal;
  readonly levelOptions = Array.from({ length: MAX_LEVELS }, (_, i) => i + 1);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly saved = signal<ReferralSettingsView | null>(null);

  readonly form = this.fb.nonNullable.group({
    enabled: [false],
    maxPerAgent: [3, whole(1, 100)],
    qualifyJobs: [5, whole(1, 1000)],
    joiningBonus: [200, amountValidators],
    rewardTiers: this.fb.nonNullable.array<FormControl<number>>([]),
    maxLevels: [3, whole(1, MAX_LEVELS)],
    levelRewards: this.fb.nonNullable.array<FormControl<number>>([]),
    activeMinJobs: [10, whole(0, 1000)],
    activeWindowDays: [30, whole(1, 365)],
    maxEarning: [5000, whole(0, 1_000_000)],
  });

  /** The form as numbers, for the live summary. */
  private readonly value = signal(this.current());

  readonly summary = computed(() => {
    const v = this.value();
    const tiers = v.rewardTiers;
    const levels = v.levelRewards;
    // Most an agent can earn if everyone below them invites the full number.
    let teamMax = 0;
    levels.forEach((amount, i) => (teamMax += amount * v.maxPerAgent ** (i + 2)));
    const uncapped = tiers.reduce((sum, n) => sum + n, 0) + teamMax;
    const avgTier = tiers.length ? tiers.reduce((sum, n) => sum + n, 0) / tiers.length : 0;
    return {
      maxEarning: Math.min(uncapped, v.maxEarning),
      capped: uncapped > v.maxEarning,
      // A new agent with a full upline: their referrer, every level above, and their own bonus.
      costPerAgent: Math.round(avgTier + levels.reduce((sum, n) => sum + n, 0) + v.joiningBonus),
      // People who can earn an agent money: every level that is paid.
      teamReach: Array.from({ length: v.maxLevels }, (_, i) => v.maxPerAgent ** (i + 1)).reduce(
        (sum, n) => sum + n,
        0,
      ),
    };
  });

  constructor() {
    this.form.controls.maxPerAgent.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => this.resize(this.tiers, count));
    this.form.controls.maxLevels.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((levels) => this.resize(this.levelRewards, levels - 1));
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.value.set(this.current()));
    this.load();
  }

  get tiers() {
    return this.form.controls.rewardTiers as FormArray<FormControl<number>>;
  }

  get levelRewards() {
    return this.form.controls.levelRewards as FormArray<FormControl<number>>;
  }

  load() {
    this.loading.set(true);
    this.referrals.getSettings().subscribe({
      next: (settings) => {
        this.saved.set(settings);
        this.reset(settings);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Back to what's saved. */
  reset(settings = this.saved()) {
    if (!settings) return;
    this.tiers.clear({ emitEvent: false });
    this.levelRewards.clear({ emitEvent: false });
    settings.rewardTiers.forEach((n) => this.tiers.push(this.amount(n), { emitEvent: false }));
    settings.levelRewards
      .slice(0, settings.maxLevels - 1)
      .forEach((n) => this.levelRewards.push(this.amount(n), { emitEvent: false }));
    this.form.patchValue(
      {
        enabled: settings.enabled,
        maxPerAgent: settings.maxPerAgent,
        qualifyJobs: settings.qualifyJobs,
        joiningBonus: settings.joiningBonus,
        maxLevels: settings.maxLevels,
        activeMinJobs: settings.activeMinJobs,
        activeWindowDays: settings.activeWindowDays,
        maxEarning: settings.maxEarning,
      },
      { emitEvent: false },
    );
    // Stored amounts may be fewer than invites/levels (env defaults repeat the last one).
    this.resize(this.tiers, settings.maxPerAgent);
    this.resize(this.levelRewards, settings.maxLevels - 1);
    this.form.markAsPristine();
    this.value.set(this.current());
  }

  save() {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      this.notifications.error('Check the highlighted values');
      return;
    }
    const before = this.saved();
    const next = this.current();
    const changes = before ? describeChanges(before, next) : [];
    if (before && !changes.length) {
      this.notifications.info('Nothing to save');
      return;
    }

    this.confirm
      .ask({
        title: 'Save referral settings?',
        message:
          'These apply to rewards earned from now on. Rewards already given do not change.\n\n' +
          changes.map((line) => `• ${line}`).join('\n'),
        confirmLabel: 'Save changes',
      })
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.saving.set(true);
        this.referrals.updateSettings(next).subscribe({
          next: (settings) => {
            this.saving.set(false);
            this.saved.set(settings);
            this.reset(settings);
            this.notifications.success('Referral settings saved');
          },
          error: () => this.saving.set(false),
        });
      });
  }

  private current(): ReferralSettings {
    const raw = this.form.getRawValue();
    return {
      enabled: raw.enabled,
      maxPerAgent: Number(raw.maxPerAgent),
      maxLevels: Number(raw.maxLevels),
      rewardTiers: raw.rewardTiers.map(Number),
      levelRewards: raw.levelRewards.map(Number),
      maxEarning: Number(raw.maxEarning),
      qualifyJobs: Number(raw.qualifyJobs),
      joiningBonus: Number(raw.joiningBonus),
      activeMinJobs: Number(raw.activeMinJobs),
      activeWindowDays: Number(raw.activeWindowDays),
    };
  }

  private amount(value: number) {
    return this.fb.nonNullable.control(value, amountValidators);
  }

  /** New boxes start from the last amount, so raising a count needs no retyping. */
  private resize(array: FormArray<FormControl<number>>, size: number) {
    const target = Number.isInteger(size) ? Math.max(0, Math.min(size, 100)) : array.length;
    while (array.length > target) array.removeAt(array.length - 1);
    while (array.length < target) {
      const last = array.length ? array.at(array.length - 1).value : 0;
      array.push(this.amount(last));
    }
  }
}

/** One line per setting that changed, in the admin's words. */
function describeChanges(before: ReferralSettings, after: ReferralSettings) {
  const lines: string[] = [];
  const add = (label: string, from: string, to: string) => {
    if (from !== to) lines.push(`${label}: ${from} → ${to}`);
  };
  const list = (amounts: number[]) => amounts.map(rupees).join(' / ') || 'none';
  const team = (s: ReferralSettings) =>
    s.levelRewards
      .slice(0, s.maxLevels - 1)
      .map((n, i) => `level ${i + 2} ${rupees(n)}`)
      .join(', ') || 'none';

  add('Program', before.enabled ? 'On' : 'Off', after.enabled ? 'On' : 'Off');
  add('Invites per agent', String(before.maxPerAgent), String(after.maxPerAgent));
  add('Jobs to complete', String(before.qualifyJobs), String(after.qualifyJobs));
  add('Joining bonus', rupees(before.joiningBonus), rupees(after.joiningBonus));
  add('Direct rewards', list(before.rewardTiers.slice(0, before.maxPerAgent)), list(after.rewardTiers));
  add('Levels paid', String(before.maxLevels), String(after.maxLevels));
  add('Team rewards', team(before), team(after));
  add(
    'Active rule',
    `${before.activeMinJobs} jobs in ${before.activeWindowDays} days`,
    `${after.activeMinJobs} jobs in ${after.activeWindowDays} days`,
  );
  add('Lifetime limit', rupees(before.maxEarning), rupees(after.maxEarning));
  return lines;
}
