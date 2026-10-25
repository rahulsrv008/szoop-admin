import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmService } from '@shared/components/confirmation-dialog/confirm.service';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { InrPipe } from '@shared/pipes/inr.pipe';
import { OrDashPipe } from '@shared/pipes/empty.pipe';
import { PaymentMethodPipe } from '@shared/pipes/payment-method.pipe';
import {
  AssignAgentDialog,
  AssignAgentDialogData,
  AssignAgentDialogResult,
} from '../assign-agent/assign-agent';
import { BookingDetailView } from '../bookings.model';
import { BookingsService } from '../bookings.service';

@Component({
  selector: 'app-booking-details',
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    StatusBadge,
    InrPipe,
    OrDashPipe,
    PaymentMethodPipe,
  ],
  templateUrl: './booking-details.html',
  styleUrl: './booking-details.scss',
})
export class BookingDetails implements OnInit {
  private readonly bookingsService = inject(BookingsService);
  private readonly confirm = inject(ConfirmService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly booking = signal<BookingDetailView | null>(null);

  ngOnInit() {
    this.load();
  }

  get bookingId() {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  load() {
    this.loading.set(true);
    this.bookingsService.detail(this.bookingId).subscribe({
      next: (booking) => {
        this.booking.set(booking);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        void this.router.navigate(['/bookings']);
      },
    });
  }

  totalAmount() {
    const booking = this.booking();
    return booking?.amounts?.totalAmount ?? booking?.totalAmount ?? 0;
  }

  canAssign() {
    const booking = this.booking();
    if (!booking) return false;
    return (
      !booking.agent?.agentId &&
      ['finding', 'paid', 'accepted'].includes(booking.status)
    );
  }

  canReassign() {
    const booking = this.booking();
    if (!booking) return false;
    return !!booking.agent?.agentId && !['completed', 'cancelled', 'expired'].includes(booking.status);
  }

  canCancel() {
    const booking = this.booking();
    if (!booking) return false;
    return !['completed', 'cancelled', 'expired'].includes(booking.status);
  }

  openAssign(reassign: boolean) {
    const booking = this.booking();
    if (!booking) return;

    const data: AssignAgentDialogData = {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      reassign,
      currentAgentName: booking.agent?.name,
    };

    this.dialog
      .open(AssignAgentDialog, { data, width: '480px' })
      .afterClosed()
      .subscribe((result: AssignAgentDialogResult | undefined) => {
        if (result?.assigned) this.load();
      });
  }

  cancelBooking() {
    const booking = this.booking();
    if (!booking) return;

    this.confirm
      .askDanger(
        'Cancel booking',
        `${booking.bookingNumber} will be cancelled and payment settled.`,
        {
          confirmLabel: 'Cancel booking',
          requireReason: true,
          reasonLabel: 'Reason (shared with customer and agent)',
        },
      )
      .subscribe((result) => {
        if (!result.confirmed || !result.reason) return;
        this.loading.set(true);
        this.bookingsService.cancel(this.bookingId, result.reason).subscribe({
          next: () => {
            this.notifications.success('Booking cancelled');
            this.load();
          },
          error: () => this.loading.set(false),
        });
      });
  }

  addressText(address: Record<string, unknown> | null | undefined) {
    if (!address) return '—';
    return [
      address['addressLine1'],
      address['addressLine2'],
      address['landmark'],
      address['city'],
      address['state'],
      address['pincode'],
    ]
      .filter(Boolean)
      .join(', ') || '—';
  }
}
