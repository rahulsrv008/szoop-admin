import { BroadcastPayload, ListQuery } from '@core/models';

export type NotificationAudience = BroadcastPayload['audience'];

export interface NotificationListQuery extends ListQuery {
  type?: string;
  userId?: string;
}

export interface NotificationRecipient {
  userType?: string | null;
  mobile?: string | null;
  name?: string | null;
}

export interface NotificationHistoryItem {
  id: string;
  userId: string;
  recipient: NotificationRecipient;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface SendNotificationPayload {
  audience: NotificationAudience;
  userIds?: string[];
  title: string;
  message: string;
  type?: string;
}

export interface SendNotificationResult {
  recipients: number;
}
