import { Injectable, inject } from '@angular/core';
import { AssignAgentPayload, BookingListItem, Paginated } from '@core/models';
import { ApiService } from '@core/services/api.service';
import {
  BookingActionResult,
  BookingDetailView,
  BookingListQuery,
} from './bookings.model';

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private readonly api = inject(ApiService);

  list(query: BookingListQuery = {}) {
    return this.api.get<Paginated<BookingListItem>>('admin/bookings', query);
  }

  detail(id: string) {
    return this.api.get<BookingDetailView>(`admin/bookings/${id}`);
  }

  assignAgent(id: string, payload: AssignAgentPayload) {
    return this.api.post<BookingActionResult>(
      `admin/bookings/${id}/assign-agent`,
      payload,
    );
  }

  reassignAgent(id: string, payload: AssignAgentPayload & { reason: string }) {
    return this.api.post<BookingActionResult>(
      `admin/bookings/${id}/reassign-agent`,
      payload,
    );
  }

  cancel(id: string, reason: string) {
    return this.api.post<BookingActionResult>(`admin/bookings/${id}/cancel`, {
      reason,
    });
  }
}
