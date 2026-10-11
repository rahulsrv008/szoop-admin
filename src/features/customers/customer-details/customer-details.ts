import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GENDERS } from '@config/constants';
import { CustomerAddress, UpdateCustomerPayload } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { InrPipe } from '@shared/pipes/inr.pipe';
import { OrDashPipe } from '@shared/pipes/empty.pipe';
import { CustomerDetailView, CustomerRecentBooking } from '../customers.model';
import { CustomersService } from '../customers.service';

@Component({
  selector: 'app-customer-details',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    StatusBadge,
    InrPipe,
    OrDashPipe,
  ],
  templateUrl: './customer-details.html',
  styleUrl: './customer-details.scss',
})
export class CustomerDetails implements OnInit {
  private readonly customersService = inject(CustomersService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly customer = signal<CustomerDetailView | null>(null);

  readonly genderOptions = GENDERS;

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.maxLength(100)]],
    lastName: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(255)]],
    gender: [''],
    dateOfBirth: [''],
  });

  ngOnInit() {
    this.load();
  }

  get customerId() {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  load() {
    this.loading.set(true);
    this.customersService.detail(this.customerId).subscribe({
      next: (customer) => {
        this.customer.set(customer);
        this.patchForm(customer);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        void this.router.navigate(['/customers']);
      },
    });
  }

  startEdit() {
    const customer = this.customer();
    if (!customer) return;
    this.patchForm(customer);
    this.editing.set(true);
  }

  cancelEdit() {
    const customer = this.customer();
    if (customer) this.patchForm(customer);
    this.editing.set(false);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: UpdateCustomerPayload = {
      firstName: value.firstName.trim() || undefined,
      lastName: value.lastName.trim() || undefined,
      email: value.email.trim() || undefined,
      gender: value.gender || undefined,
      dateOfBirth: value.dateOfBirth || undefined,
    };

    this.saving.set(true);
    this.customersService.update(this.customerId, payload).subscribe({
      next: (customer) => {
        this.customer.set(customer);
        this.patchForm(customer);
        this.editing.set(false);
        this.saving.set(false);
        this.notifications.success('Customer profile updated');
      },
      error: () => this.saving.set(false),
    });
  }

  block() {
    const customer = this.customer();
    if (!customer) return;

    this.confirm
      .askDanger(
        'Block customer',
        `${customer.name ?? customer.mobile} loses access to the ClearIt app immediately.`,
        {
          confirmLabel: 'Block customer',
          requireReason: true,
          reasonLabel: 'Reason (sent to the customer)',
        },
      )
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.customersService.block(this.customerId, result.reason).subscribe({
          next: () => {
            this.notifications.success('Customer blocked');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  unblock() {
    const customer = this.customer();
    if (!customer) return;

    this.confirm
      .ask({
        title: 'Unblock customer',
        message: `${customer.name ?? customer.mobile} will be able to sign in and book again.`,
        confirmLabel: 'Unblock',
      })
      .subscribe((result) => {
        if (!result.confirmed) return;
        this.loading.set(true);
        this.customersService.unblock(this.customerId).subscribe({
          next: () => {
            this.notifications.success('Customer unblocked');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  openBooking(booking: CustomerRecentBooking) {
    void this.router.navigate(['/bookings', booking.id]);
  }

  walletReason(reason: string) {
    if (reason === 'BOOKING_CANCELLED') return 'Refund · booking cancelled';
    if (reason === 'BOOKING_EXPIRED') return 'Refund · booking expired';
    if (reason === 'UNPAID_BOOKING') return 'Due · customer did not pay';
    if (reason === 'DUE_PAID') return 'Due paid';
    return reason;
  }

  addressLine(address: CustomerAddress) {
    return [
      address.addressLine1,
      address.addressLine2,
      address.landmark,
      address.city,
      address.state,
      address.pincode,
    ]
      .filter(Boolean)
      .join(', ');
  }

  bookingCountEntries() {
    const counts = this.customer()?.counts?.bookings ?? {};
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }

  private patchForm(customer: CustomerDetailView) {
    this.form.patchValue({
      firstName: customer.firstName ?? '',
      lastName: customer.lastName ?? '',
      email: customer.email ?? '',
      gender: customer.gender ?? '',
      dateOfBirth: customer.dateOfBirth
        ? String(customer.dateOfBirth).slice(0, 10)
        : '',
    });
  }
}
