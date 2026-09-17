import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '@config/constants';
import { NotificationService } from '@core/services/notification.service';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { InrPipe } from '@shared/pipes/inr.pipe';
import { OrDashPipe } from '@shared/pipes/empty.pipe';
import { toOptions } from '@shared/models/filter.model';
import { ComplaintDetail } from '../complaints.model';
import { ComplaintsService } from '../complaints.service';

@Component({
  selector: 'app-complaint-details',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    StatusBadge,
    DatePipe,
    InrPipe,
    OrDashPipe,
  ],
  templateUrl: './complaint-details.html',
  styleUrl: './complaint-details.scss',
})
export class ComplaintDetails {
  private readonly complaintsService = inject(ComplaintsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly ticket = signal<ComplaintDetail | null>(null);

  readonly statusOptions = toOptions(TICKET_STATUSES);
  readonly priorityOptions = toOptions(TICKET_PRIORITIES);

  readonly form = this.formBuilder.nonNullable.group({
    status: ['', Validators.required],
    priority: ['', Validators.required],
    resolutionNote: [''],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/complaints']);
      return;
    }
    this.load(id);
  }

  load(id: string) {
    this.loading.set(true);
    this.complaintsService.detail(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.form.patchValue({
          status: ticket.status,
          priority: ticket.priority,
          resolutionNote: '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        void this.router.navigate(['/complaints']);
      },
    });
  }

  save() {
    const current = this.ticket();
    if (!current || this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const { status, priority, resolutionNote } = this.form.getRawValue();
    this.saving.set(true);
    this.complaintsService
      .update(current.id, {
        status,
        priority,
        resolutionNote: resolutionNote.trim() || undefined,
      })
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.notifications.success(result.message ?? 'Ticket updated');
          this.load(current.id);
        },
        error: () => this.saving.set(false),
      });
  }
}
