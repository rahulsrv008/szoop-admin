import { Injectable, inject } from '@angular/core';
import { Paginated } from '@core/models';
import { ApiService } from '@core/services/api.service';
import {
  NotificationHistoryItem,
  NotificationListQuery,
  SendNotificationPayload,
  SendNotificationResult,
} from './notifications.model';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly api = inject(ApiService);

  send(payload: SendNotificationPayload) {
    return this.api.post<SendNotificationResult>(
      'admin/notifications/send',
      payload,
    );
  }

  list(query: NotificationListQuery) {
    return this.api.get<Paginated<NotificationHistoryItem>>(
      'admin/notifications',
      query,
    );
  }
}
