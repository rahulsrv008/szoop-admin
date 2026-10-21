import { Routes } from '@angular/router';

export const BOOKINGS_ROUTES: Routes = [
  {
    path: '',
    title: 'Bookings · ClearIt Admin',
    data: { title: 'Bookings' },
    loadComponent: () =>
      import('./booking-list/booking-list').then((m) => m.BookingList),
  },
  {
    path: 'live',
    title: 'Live bookings · ClearIt Admin',
    data: { title: 'Live bookings' },
    loadComponent: () =>
      import('./booking-live/booking-live').then((m) => m.BookingLive),
  },
  {
    path: 'monitor',
    title: 'Booking monitor · ClearIt Admin',
    data: { title: 'Booking monitor' },
    loadComponent: () =>
      import('./booking-monitor/booking-monitor').then((m) => m.BookingMonitor),
  },
  {
    path: 'history',
    title: 'Booking history · ClearIt Admin',
    data: { title: 'Booking history' },
    loadComponent: () =>
      import('./booking-history/booking-history').then((m) => m.BookingHistory),
  },
  {
    path: ':id',
    title: 'Booking · ClearIt Admin',
    data: { title: 'Booking detail' },
    loadComponent: () =>
      import('./booking-details/booking-details').then((m) => m.BookingDetails),
  },
];
