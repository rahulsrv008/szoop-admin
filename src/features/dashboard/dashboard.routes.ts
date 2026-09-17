import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    title: 'Dashboard · ClearIt Admin',
    data: { title: 'Dashboard' },
    loadComponent: () => import('./dashboard').then((m) => m.Dashboard),
  },
];
