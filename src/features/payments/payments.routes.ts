import { Routes } from '@angular/router';

export const PAYMENTS_ROUTES: Routes = [
  {
    path: '',
    title: 'Payments · Szoop Admin',
    data: { title: 'Payments' },
    loadComponent: () =>
      import('./payment-list/payment-list').then((m) => m.PaymentList),
  },
  {
    path: 'refunds',
    title: 'Refunds · Szoop Admin',
    data: { title: 'Refunds' },
    loadComponent: () => import('./refunds/refunds').then((m) => m.Refunds),
  },
  {
    path: ':id',
    title: 'Payment · Szoop Admin',
    data: { title: 'Payment detail' },
    loadComponent: () =>
      import('./transactions/transactions').then((m) => m.Transactions),
  },
];
