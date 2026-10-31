import { Routes } from '@angular/router';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    title: 'Send notification · Szoop Admin',
    data: { title: 'Notifications' },
    loadComponent: () =>
      import('./notification-compose/notification-compose').then(
        (m) => m.NotificationCompose,
      ),
  },
  {
    path: 'history',
    title: 'Notification history · Szoop Admin',
    data: { title: 'Notification history' },
    loadComponent: () =>
      import('./notification-history/notification-history').then(
        (m) => m.NotificationHistory,
      ),
  },
];
