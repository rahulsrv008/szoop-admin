import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { SelectOption } from '@shared/models/filter.model';
import { positiveNumberValidator } from '@shared/validators/form.validators';
import { ServicesService } from '../services.service';

@Component({
  selector: 'app-service-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './service-form.html',
  styleUrl: './service-form.scss',
})
export class ServiceForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly services = inject(ServicesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly notFound = signal(false);
  readonly categoryOptions = signal<SelectOption[]>([]);

  readonly serviceId = computed(() => this.route.snapshot.paramMap.get('id'));
  readonly isEdit = computed(() => !!this.serviceId());

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    categoryId: [''],
    description: [''],
    durationMinutes: [
      60,
      [Validators.required, Validators.min(15), positiveNumberValidator()],
    ],
    isActive: [true],
  });

  constructor() {
    this.loadCategories();
    if (this.isEdit()) {
      this.loadService(this.serviceId()!);
    }
  }

  submit() {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name.trim(),
      categoryId: raw.categoryId || null,
      description: raw.description.trim() || null,
      durationMinutes: Number(raw.durationMinutes),
      isActive: raw.isActive,
    };

    this.submitting.set(true);
    const request = this.isEdit()
      ? this.services.update(this.serviceId()!, payload)
      : this.services.create(payload);

    request.subscribe({
      next: () => {
        this.submitting.set(false);
        this.notifications.success(
          this.isEdit() ? 'Service updated' : 'Service created',
        );
        void this.router.navigate(['/services']);
      },
      error: () => this.submitting.set(false),
    });
  }

  private loadCategories() {
    this.services.categories({ page: 1, limit: 100, isActive: true }).subscribe({
      next: (result) => {
        this.categoryOptions.set(
          (result?.items ?? []).map((item) => ({
            value: item.id,
            label: item.name,
          })),
        );
      },
    });
  }

  private loadService(id: string) {
    this.loading.set(true);
    this.services.find(id).subscribe({
      next: (service) => {
        this.loading.set(false);
        if (!service) {
          this.notFound.set(true);
          return;
        }
        this.form.patchValue({
          name: service.name,
          categoryId: service.categoryId ?? '',
          description: service.description ?? '',
          durationMinutes: service.durationMinutes,
          isActive: service.isActive,
        });
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }
}
