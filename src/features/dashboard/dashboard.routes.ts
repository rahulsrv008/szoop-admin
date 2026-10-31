import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    title: 'Dashboard · Szoop Admin',
    data: { title: 'Dashboard' },
    loadComponent: () => import('./dashboard').then((m) => m.Dashboard),
  },
];
