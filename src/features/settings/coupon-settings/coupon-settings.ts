import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import {
  ConditionType,
  CouponEligibilityRule,
  CreateCouponRulePayload,
  RuleCondition,
  RuleOperator,
  RuleServiceType,
} from './coupon-settings.model';
import { CouponSettingsService } from './coupon-settings.service';

interface ConditionForm {
  type: FormControl<ConditionType>;
  service: FormControl<RuleServiceType>;
  operator: FormControl<RuleOperator>;
  value: FormControl<number>;
  windowDays: FormControl<number | null>;
}

@Component({
  selector: 'app-coupon-settings',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatRadioModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './coupon-settings.html',
  styleUrl: './coupon-settings.scss',
})
export class CouponSettingsComponent {
  private readonly couponSettings = inject(CouponSettingsService);
  private readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly rules = signal<CouponEligibilityRule[]>([]);
  readonly editingRule = signal<CouponEligibilityRule | null>(null);
  readonly isCreating = signal(false);
  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly serviceOptions: { value: RuleServiceType; label: string }[] = [
    { value: 'ALL', label: 'All Services' },
    { value: 'CLEANING', label: 'Cleaning' },
    { value: 'COOKING', label: 'Cooking' },
    { value: 'SALON', label: 'Salon' },
  ];

  readonly conditionTypeOptions: { value: ConditionType; label: string }[] = [
    {
      value: 'COMPLETED_BOOKINGS',
      label: 'Minimum completed bookings',
    },
    {
      value: 'NEW_CUSTOMER',
      label: 'New customer (Zero completed bookings)',
    },
    {
      value: 'INACTIVE_DAYS',
      label: 'Inactive customer (Days since last booking)',
    },
    {
      value: 'DAYS_SINCE_SERVICE',
      label: 'Days since last service booking',
    },
  ];

  readonly operatorOptions: { value: RuleOperator; label: string }[] = [
    { value: 'GREATER_THAN_OR_EQUAL', label: '>= (At least)' },
    { value: 'EQUALS', label: '= (Exactly)' },
    { value: 'GREATER_THAN', label: '> (Greater than)' },
    { value: 'LESS_THAN_OR_EQUAL', label: '<= (At most)' },
    { value: 'LESS_THAN', label: '< (Less than)' },
  ];

  readonly ruleForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    applicableServices: [
      ['ALL'] as RuleServiceType[],
      [Validators.required, Validators.minLength(1)],
    ],
    matchType: ['AND' as 'AND' | 'OR', Validators.required],
    isActive: [true],
    conditions: this.fb.array<FormGroup<ConditionForm>>([]),
  });

  get conditionsArray() {
    return this.ruleForm.controls.conditions as FormArray<FormGroup<ConditionForm>>;
  }

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.loadRules();
      });

    this.loadRules();
  }

  loadRules() {
    this.loading.set(true);
    const search = this.searchControl.value.trim() || undefined;
    this.couponSettings.list({ limit: 100, search }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.rules.set(res.items || []);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.error('Failed to load coupon eligibility rules');
      },
    });
  }

  startNewRule() {
    this.editingRule.set(null);
    this.isCreating.set(true);
    this.resetForm();
    this.addCondition();
  }

  editRule(rule: CouponEligibilityRule) {
    this.isCreating.set(false);
    this.editingRule.set(rule);
    this.resetForm();

    this.ruleForm.patchValue({
      name: rule.name,
      description: rule.description || '',
      applicableServices: rule.applicableServices?.length
        ? rule.applicableServices
        : ['ALL'],
      matchType: rule.matchType || 'AND',
      isActive: rule.isActive,
    });

    if (rule.conditions?.length) {
      for (const cond of rule.conditions) {
        this.addCondition(cond);
      }
    } else {
      this.addCondition();
    }
  }

  cancelEdit() {
    this.editingRule.set(null);
    this.isCreating.set(false);
    this.resetForm();
  }

  resetForm() {
    this.ruleForm.reset({
      name: '',
      description: '',
      applicableServices: ['ALL'],
      matchType: 'AND',
      isActive: true,
    });
    this.conditionsArray.clear();
  }

  addCondition(initial?: RuleCondition) {
    const group = this.fb.group<ConditionForm>({
      type: new FormControl<ConditionType>(
        initial?.type || 'COMPLETED_BOOKINGS',
        { nonNullable: true, validators: [Validators.required] },
      ),
      service: new FormControl<RuleServiceType>(
        initial?.service || 'ALL',
        { nonNullable: true, validators: [Validators.required] },
      ),
      operator: new FormControl<RuleOperator>(
        initial?.operator || 'GREATER_THAN_OR_EQUAL',
        { nonNullable: true, validators: [Validators.required] },
      ),
      value: new FormControl<number>(
        initial?.value !== undefined ? initial.value : 1,
        { nonNullable: true, validators: [Validators.required, Validators.min(0)] },
      ),
      windowDays: new FormControl<number | null>(
        initial?.windowDays ?? null,
      ),
    });

    // Auto-adjust default operator/value on type change for convenience
    group.controls.type.valueChanges.subscribe((type) => {
      if (type === 'NEW_CUSTOMER') {
        group.controls.operator.setValue('EQUALS');
        group.controls.value.setValue(0);
      } else if (type === 'INACTIVE_DAYS' || type === 'DAYS_SINCE_SERVICE') {
        group.controls.operator.setValue('GREATER_THAN_OR_EQUAL');
        if (group.controls.value.value <= 0) {
          group.controls.value.setValue(30);
        }
      }
    });

    this.conditionsArray.push(group);
  }

  removeCondition(index: number) {
    if (this.conditionsArray.length > 1) {
      this.conditionsArray.removeAt(index);
    } else {
      this.notifications.info('At least one condition is required for a rule');
    }
  }

  isServiceSelected(service: RuleServiceType): boolean {
    const list = this.ruleForm.controls.applicableServices.value || [];
    return list.includes(service);
  }

  toggleService(service: RuleServiceType) {
    let list = [...(this.ruleForm.controls.applicableServices.value || [])];
    if (service === 'ALL') {
      list = ['ALL'];
    } else {
      list = list.filter((s) => s !== 'ALL');
      if (list.includes(service)) {
        list = list.filter((s) => s !== service);
      } else {
        list.push(service);
      }
      if (list.length === 0) {
        list = ['ALL'];
      }
    }
    this.ruleForm.controls.applicableServices.setValue(list);
  }

  applyPreset(preset: 'loyal_cleaning' | 'loyal_cooking' | 'inactive_salon' | 'new_customer' | 'cross_service') {
    this.resetForm();

    switch (preset) {
      case 'loyal_cleaning':
        this.ruleForm.patchValue({
          name: 'Loyal Cleaning Customers',
          description: 'Customers with 5 or more completed cleaning bookings',
          applicableServices: ['CLEANING'],
          matchType: 'AND',
          isActive: true,
        });
        this.addCondition({
          type: 'COMPLETED_BOOKINGS',
          service: 'CLEANING',
          operator: 'GREATER_THAN_OR_EQUAL',
          value: 5,
        });
        break;

      case 'loyal_cooking':
        this.ruleForm.patchValue({
          name: 'Loyal Cooking Customers',
          description: 'Customers with 4 or more completed cooking bookings',
          applicableServices: ['COOKING'],
          matchType: 'AND',
          isActive: true,
        });
        this.addCondition({
          type: 'COMPLETED_BOOKINGS',
          service: 'COOKING',
          operator: 'GREATER_THAN_OR_EQUAL',
          value: 4,
        });
        break;

      case 'inactive_salon':
        this.ruleForm.patchValue({
          name: 'Inactive Salon Customers',
          description: 'Reactivate customers who have not booked a Salon service in 60+ days',
          applicableServices: ['SALON'],
          matchType: 'AND',
          isActive: true,
        });
        this.addCondition({
          type: 'DAYS_SINCE_SERVICE',
          service: 'SALON',
          operator: 'GREATER_THAN_OR_EQUAL',
          value: 60,
        });
        break;

      case 'new_customer':
        this.ruleForm.patchValue({
          name: 'New Customers (First Booking)',
          description: 'First-time users with 0 completed bookings across all services',
          applicableServices: ['ALL'],
          matchType: 'AND',
          isActive: true,
        });
        this.addCondition({
          type: 'NEW_CUSTOMER',
          service: 'ALL',
          operator: 'EQUALS',
          value: 0,
        });
        break;

      case 'cross_service':
        this.ruleForm.patchValue({
          name: 'Cross-Service Loyalty (Salon Perk)',
          description: 'Customers with 5+ bookings across any services eligible for Salon coupon',
          applicableServices: ['SALON'],
          matchType: 'AND',
          isActive: true,
        });
        this.addCondition({
          type: 'COMPLETED_BOOKINGS',
          service: 'ALL',
          operator: 'GREATER_THAN_OR_EQUAL',
          value: 5,
        });
        break;
    }
  }

  saveRule() {
    if (this.ruleForm.invalid || this.saving()) {
      this.ruleForm.markAllAsTouched();
      this.notifications.info('Please check the form for invalid fields');
      return;
    }

    if (this.conditionsArray.length === 0) {
      this.notifications.info('Please add at least one condition');
      return;
    }

    const raw = this.ruleForm.getRawValue();
    const payload: CreateCouponRulePayload = {
      name: String(raw.name).trim(),
      description: raw.description ? String(raw.description).trim() : null,
      applicableServices: raw.applicableServices || ['ALL'],
      matchType: raw.matchType || 'AND',
      isActive: !!raw.isActive,
      conditions: (raw.conditions || []).map((c) => ({
        type: c.type,
        service: c.service,
        operator: c.operator,
        value: Number(c.value),
        windowDays: c.windowDays != null && c.windowDays !== ('' as unknown as number) ? Number(c.windowDays) : null,
      })),
    };

    this.saving.set(true);
    const editing = this.editingRule();
    const req$ = editing
      ? this.couponSettings.update(editing.id, payload)
      : this.couponSettings.create(payload);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.success(
          editing ? 'Coupon eligibility rule updated' : 'Coupon eligibility rule created',
        );
        this.cancelEdit();
        this.loadRules();
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || 'Failed to save rule';
        this.notifications.error(msg);
      },
    });
  }

  toggleActive(rule: CouponEligibilityRule) {
    this.couponSettings.toggle(rule.id).subscribe({
      next: (updated) => {
        rule.isActive = updated.isActive;
        this.notifications.success(
          `Rule "${rule.name}" is now ${rule.isActive ? 'active' : 'inactive'}`,
        );
      },
      error: () => {
        this.notifications.error('Failed to toggle rule status');
      },
    });
  }

  confirmDelete(rule: CouponEligibilityRule) {
    this.confirm
      .askDanger(
        'Delete Rule',
        `Are you sure you want to delete eligibility rule "${rule.name}"? If any coupons are linked, it will be deactivated to preserve history.`,
        { confirmLabel: 'Delete' },
      )
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.couponSettings.remove(rule.id).subscribe({
          next: (res) => {
            if (res.deactivated) {
              this.notifications.info(res.reason || 'Rule deactivated because coupons are linked.');
            } else {
              this.notifications.success(`Rule "${rule.name}" deleted`);
            }
            this.loadRules();
          },
          error: () => {
            this.notifications.error('Failed to delete rule');
          },
        });
      });
  }

  formatCondition(cond: RuleCondition): string {
    const opSymbols: Record<RuleOperator, string> = {
      EQUALS: '=',
      GREATER_THAN: '>',
      GREATER_THAN_OR_EQUAL: '>=',
      LESS_THAN: '<',
      LESS_THAN_OR_EQUAL: '<=',
    };
    const op = opSymbols[cond.operator] || cond.operator;
    const svc = cond.service === 'ALL' ? 'Any Service' : cond.service;

    let text = '';
    switch (cond.type) {
      case 'NEW_CUSTOMER':
        text = `New Customer (${svc} bookings = 0)`;
        break;
      case 'COMPLETED_BOOKINGS':
        text = `Completed ${svc} Bookings ${op} ${cond.value}`;
        break;
      case 'INACTIVE_DAYS':
        text = `Days Since Last Booking ${op} ${cond.value} days`;
        break;
      case 'DAYS_SINCE_SERVICE':
        text = `Days Since Last ${svc} Booking ${op} ${cond.value} days`;
        break;
      default:
        text = `${cond.type} (${svc}) ${op} ${cond.value}`;
    }

    if (cond.windowDays) {
      text += ` (within past ${cond.windowDays} days)`;
    }
    return text;
  }
}
