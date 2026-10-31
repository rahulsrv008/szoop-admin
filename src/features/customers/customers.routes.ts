import { Routes } from '@angular/router';

export const CUSTOMERS_ROUTES: Routes = [
  {
    path: '',
    title: 'Customers · Szoop Admin',
    data: { title: 'Customers' },
    loadComponent: () =>
      import('./customer-list/customer-list').then((m) => m.CustomerList),
  },
  {
    path: ':id/bookings',
    title: 'Customer bookings · Szoop Admin',
    data: { title: 'Customer bookings' },
    loadComponent: () =>
      import('./customer-bookings/customer-bookings').then(
        (m) => m.CustomerBookings,
      ),
  },
  {
    path: ':id',
    title: 'Customer · Szoop Admin',
    data: { title: 'Customer profile' },
    loadComponent: () =>
      import('./customer-details/customer-details').then(
        (m) => m.CustomerDetails,
      ),
  },
];
